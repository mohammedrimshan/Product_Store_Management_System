# Multi-Store Stock Management System

A full-stack MERN application for managing product stock across multiple stores, with role-based access control and atomic stock operations.

---

## Prerequisites

- **Node.js** ≥ 18
- **npm** ≥ 9
- **MongoDB** ≥ 6.0 running as a **replica set** (required for atomic transfers)

### Starting a local single-node replica set

```bash
mongod --replSet rs0 --dbpath /your/data/path
```

Then in the MongoDB shell (first time only):

```js
rs.initiate()
```

---

## Setup

### 1. Clone the repository

```bash
git clone <repo-url>
cd Product_Store_Management_System
```

### 2. Install dependencies

```bash
# Backend
cd server
npm install

# Frontend (new terminal)
cd frontend
npm install
```

### 3. Configure environment variables

```bash
cd server
cp .env.example .env
```

Edit `server/.env` with your values:

| Variable | Description | Example |
|---|---|---|
| `PORT` | Port the API server listens on | `5000` |
| `MONGO_URI` | MongoDB connection string | `mongodb://localhost:27017/product_store` |
| `JWT_SECRET` | Secret key used to sign JWTs | any long random string |
| `JWT_EXPIRES_IN` | JWT expiry duration | `7d` |

---

## Running the Application

### Backend

```bash
cd server
npm run dev      # development (auto-restarts with nodemon)
# or
npm start        # production
```

API runs at `http://localhost:5000`

### Frontend

```bash
cd frontend
npm run dev
```

UI runs at `http://localhost:5173`

---

## Seeding the Database (optional but recommended)

The seed script creates two users, three products, three stores, and nine stock entries so you can log in immediately without clicking through the UI.

```bash
cd server
npm run seed
```

**Created credentials:**

| Role | Email | Password |
|---|---|---|
| Admin | `admin@example.com` | `admin123` |
| Shopper | `shopper@example.com` | `shopper123` |

> ⚠️ The seed script **deletes all existing data** before inserting. Do not run it against a production database.

> **Note:** Registration always creates a `shopper` account. To get an admin account without seeding, update the `role` field directly in MongoDB:
> ```js
> db.users.updateOne({ email: "you@example.com" }, { $set: { role: "admin" } })
> ```

---

## Running Tests

Tests run against a separate `_test` database and clean up after themselves.

```bash
cd server
npm test
```

### What is tested

| Test | Description |
|---|---|
| **Never-negative (concurrent)** | Fires 120 concurrent decrement requests against stock of 100 — exactly 100 must succeed and stock must end at 0 |
| **End-to-end transfer** | Source decrements and destination increments by the correct amount |
| **Transfer exceeding stock** | Returns `422` and leaves both stores unchanged |
| **Same-store transfer** | Returns `400` |
| **Non-positive quantity** | Returns `400` for 0 and negative values |
| **Role enforcement** | Shoppers receive `403` on stock-changing endpoints |
| **Auth guard** | Unauthenticated requests receive `401` |

> **Replica set required for transfer tests.** If MongoDB is not running as a replica set, the transfer tests will fail. Adjustment tests (including the concurrent test) work on a standalone instance.

---

## API Specification

See [`openapi.yaml`](./openapi.yaml) in the repository root for the full OpenAPI 3.x specification of all endpoints.

---

## Project Structure

```
Product_Store_Management_System/
├── server/
│   ├── src/
│   │   ├── config/          # DB connection
│   │   ├── constants/       # HTTP status codes, message strings, role enums
│   │   ├── controllers/     # Request/response layer
│   │   ├── middleware/      # JWT auth + role guard
│   │   ├── models/          # Mongoose schemas
│   │   ├── routes/          # Express routers
│   │   ├── services/        # Business logic (stock operations)
│   │   └── utils/           # JWT generation
│   ├── scripts/
│   │   └── seed.js          # Database seeder
│   └── __tests__/
│       └── stock.test.js    # Automated tests
├── frontend/
│   └── src/
│       ├── api/             # Axios service functions
│       ├── components/      # Shared UI components
│       ├── pages/           # Dashboard, Products, Stores, Stock, Auth
│       ├── store/           # Redux slices
│       └── styles/          # CSS
├── DESIGN.md                # Architecture and concurrency design
├── openapi.yaml             # API specification
└── README.md
```

---

## Assumptions & Trade-offs

- **Role assignment:** New accounts always get the `shopper` role. There is no admin self-registration by design. Use the seed script or a direct DB update to create admin accounts.
- **Replica set required for transfers:** MongoDB multi-document transactions do not function on standalone instances. This is a MongoDB constraint, not an application limitation.
- **Stock initialisation is explicit:** A stock record must be created via `POST /api/stock` before it can be adjusted. Adjusting with a positive delta on a non-existent record will upsert it, but negative deltas require the record to exist.
- **Low-stock threshold is server-side:** The `?threshold=N` filter is evaluated inside the MongoDB query, not in application memory, so it scales with the database.