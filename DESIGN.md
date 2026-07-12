# DESIGN.md

## Data Model

Three core entities are stored in MongoDB:

| Collection | Key fields |
|---|---|
| **User** | `name`, `email` (unique), `password` (bcrypt), `role` (`admin` \| `shopper`) |
| **Product** | `name`, `sku` (unique — enforced by a DB-level `unique` index) |
| **Store** | `name`, `location` |
| **Stock** | `product` (ref), `store` (ref), `quantity` (min: 0) — compound unique index `{ product, store }` ensures one record per product/store pair |

Stock is a junction collection. Each document represents the quantity of one product at one store. This keeps queries simple (`Stock.find({ store })` shows all stock for a store) and makes atomic per-document updates natural.

---

## Keeping Stock Non-Negative Under Concurrency

Stock is never read, checked, then written (that would be a TOCTOU race). Instead, the decrement is a **single conditional atomic operation**:

```js
Stock.findOneAndUpdate(
  { product, store, quantity: { $gte: Math.abs(delta) } },
  { $inc: { quantity: delta } },
  { new: true }
)
```

MongoDB evaluates the filter and applies the `$inc` atomically inside its document-level write lock. If another request has already decremented the stock so that `quantity < |delta|`, the filter does not match and the update is not applied — the function returns `null`, which the service layer translates into a `422 Unprocessable Entity` response.

This means even 100 concurrent admin requests trying to take the last unit will only ever result in exactly one success; the rest will receive a structured error. No application-level locking or retry logic is needed.

---

## Atomic Transfers

A transfer touches two documents (source stock and destination stock). To ensure the operation is all-or-nothing, it runs inside a **MongoDB multi-document transaction**:

```js
const session = await mongoose.startSession();
await session.withTransaction(async () => {
    const src = await Stock.findOneAndUpdate(
        { product, store: fromStore, quantity: { $gte: quantity } },
        { $inc: { quantity: -quantity } },
        { new: true, session }
    );
    if (!src) throw new Error("Insufficient stock");

    await Stock.findOneAndUpdate(
        { product, store: toStore },
        { $inc: { quantity: quantity } },
        { new: true, session, upsert: true }
    );
});
```

`session.withTransaction()` automatically retries on transient write conflicts and rolls back if any operation throws. MongoDB's WiredTiger engine guarantees that the intermediate state (source decremented, destination not yet incremented) is never visible to any concurrent reader.

> **Replica set requirement:** Multi-document transactions require a MongoDB replica set. A single-node replica set (`mongod --replSet rs0` + `rs.initiate()`) is sufficient for local development.
