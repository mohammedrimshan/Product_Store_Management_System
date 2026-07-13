import { useEffect, useState, useCallback } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import {
  getStock,
  createStock,
  adjustStock,
  transferStock,
} from "../api/stockService";
import { getProducts } from "../api/productService";
import { getStores } from "../api/storeService";
import "../styles/pages.css";

const stockBadge = (qty) => {
  if (qty === 0) return <span className="badge badge-out">Out of stock</span>;
  if (qty <= 10) return <span className="badge badge-low">Low stock</span>;
  return <span className="badge badge-ok">In stock</span>;
};

function InitStockForm({ products, stores, onDone }) {
  const [form, setForm] = useState({
    productId: "",
    storeId: "",
    quantity: "",
  });
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const qty = parseInt(form.quantity);
    if (!form.productId || !form.storeId || isNaN(qty) || !Number.isInteger(qty) || qty < 0) {
      toast.error("Fill all fields with a valid quantity (≥ 0)");
      return;
    }
    try {
      setBusy(true);
      const res = await createStock({ ...form, quantity: qty });
      toast.success(res.message);
      setForm({ productId: "", storeId: "", quantity: "" });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to initialise stock");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>
        Initialise Stock
      </p>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-field">
            <label>Product</label>
            <select name="productId" value={form.productId} onChange={handle}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Store</label>
            <select name="storeId" value={form.storeId} onChange={handle}>
              <option value="">Select store…</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ maxWidth: 120 }}>
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              min="0"
              value={form.quantity}
              onChange={handle}
              placeholder="0"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy}
            style={{ alignSelf: "flex-end" }}
          >
            {busy ? "Saving…" : "Set Stock"}
          </button>
        </div>
      </form>
    </div>
  );
}

function AdjustForm({ products, stores, onDone }) {
  const [form, setForm] = useState({ productId: "", storeId: "", delta: "" });
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const delta = Number(form.delta);
    if (
      !form.productId ||
      !form.storeId ||
      !Number.isInteger(delta) ||
      delta === 0
    ) {
      toast.error("Fill all fields; delta must be a non-zero integer");
      return;
    }
    try {
      setBusy(true);
      const res = await adjustStock({
        productId: form.productId,
        storeId: form.storeId,
        delta,
      });
      toast.success(res.message);
      setForm({ productId: "", storeId: "", delta: "" });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Adjustment failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
        Adjust Stock
      </p>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
        Use a positive delta to restock (+50), negative to correct (−5).
      </p>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-field">
            <label>Product</label>
            <select name="productId" value={form.productId} onChange={handle}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>Store</label>
            <select name="storeId" value={form.storeId} onChange={handle}>
              <option value="">Select store…</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field" style={{ maxWidth: 120 }}>
            <label>Delta</label>
            <input
              type="number"
              name="delta"
              value={form.delta}
              onChange={handle}
              placeholder="e.g. +50 or -5"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy}
            style={{ alignSelf: "flex-end" }}
          >
            {busy ? "Adjusting…" : "Adjust"}
          </button>
        </div>
      </form>
    </div>
  );
}

function TransferForm({ products, stores, onDone }) {
  const [form, setForm] = useState({
    productId: "",
    fromStoreId: "",
    toStoreId: "",
    quantity: "",
  });
  const [busy, setBusy] = useState(false);

  const handle = (e) => setForm({ ...form, [e.target.name]: e.target.value });

  const submit = async (e) => {
    e.preventDefault();
    const qty = parseInt(form.quantity);
    if (
      !form.productId ||
      !form.fromStoreId ||
      !form.toStoreId ||
      isNaN(qty) ||
      !Number.isInteger(qty) ||
      qty <= 0
    ) {
      toast.error("Fill all fields; quantity must be > 0");
      return;
    }
    if (form.fromStoreId === form.toStoreId) {
      toast.error("Source and destination stores cannot be the same");
      return;
    }
    try {
      setBusy(true);
      const res = await transferStock({
        productId: form.productId,
        fromStoreId: form.fromStoreId,
        toStoreId: form.toStoreId,
        quantity: qty,
      });
      toast.success(res.message);
      setForm({ productId: "", fromStoreId: "", toStoreId: "", quantity: "" });
      onDone();
    } catch (err) {
      toast.error(err.response?.data?.message || "Transfer failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="card">
      <p style={{ fontWeight: 600, marginBottom: 6, fontSize: 14 }}>
        Transfer Stock
      </p>
      <p style={{ fontSize: 12, color: "#888", marginBottom: 14 }}>
        Moves stock atomically — source decrements and destination increments in
        a single transaction.
      </p>
      <form onSubmit={submit}>
        <div className="form-row">
          <div className="form-field">
            <label>Product</label>
            <select name="productId" value={form.productId} onChange={handle}>
              <option value="">Select product…</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.sku})
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>From Store</label>
            <select
              name="fromStoreId"
              value={form.fromStoreId}
              onChange={handle}
            >
              <option value="">Source store…</option>
              {stores.map((s) => (
                <option key={s._id} value={s._id}>
                  {s.name}
                </option>
              ))}
            </select>
          </div>
          <div className="form-field">
            <label>To Store</label>
            <select name="toStoreId" value={form.toStoreId} onChange={handle}>
              <option value="">Destination store…</option>
              {stores
                .filter((s) => s._id !== form.fromStoreId)
                .map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name}
                  </option>
                ))}
            </select>
          </div>
          <div className="form-field" style={{ maxWidth: 120 }}>
            <label>Quantity</label>
            <input
              type="number"
              name="quantity"
              min="1"
              value={form.quantity}
              onChange={handle}
              placeholder="e.g. 10"
            />
          </div>
          <button
            type="submit"
            className="btn-primary"
            disabled={busy}
            style={{ alignSelf: "flex-end" }}
          >
            {busy ? "Transferring…" : "Transfer"}
          </button>
        </div>
      </form>
    </div>
  );
}

const ADMIN_TABS = ["View Stock", "Adjust", "Transfer", "Initialise"];
const SHOPPER_TABS = ["View Stock"];

function StockPage() {
  const { user } = useSelector((state) => state.auth);
  const isAdmin = user?.role === "admin";

  const tabs = isAdmin ? ADMIN_TABS : SHOPPER_TABS;
  const [activeTab, setActiveTab] = useState("View Stock");

  const [stocks, setStocks] = useState([]);
  const [products, setProducts] = useState([]);
  const [stores, setStores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [threshold, setThreshold] = useState("");

  const fetchStock = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getStock(
        threshold !== "" ? Number(threshold) : undefined,
      );
      setStocks(res.data || []);
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to load stock");
    } finally {
      setLoading(false);
    }
  }, [threshold]);

  useEffect(() => {
    fetchStock();
  }, [fetchStock]);

  useEffect(() => {
    if (isAdmin) {
      Promise.all([getProducts(), getStores()])
        .then(([pr, sr]) => {
          setProducts(pr.data || []);
          setStores(sr.data || []);
        })
        .catch(() => toast.error("Failed to load products/stores"));
    }
  }, [isAdmin]);

  return (
    <div className="page-body">
      <div className="page-header">
        <h2>Stock</h2>
      </div>

      <div className="tab-bar">
        {tabs.map((t) => (
          <button
            key={t}
            className={`tab-btn ${activeTab === t ? "active" : ""}`}
            onClick={() => setActiveTab(t)}
          >
            {t}
          </button>
        ))}
      </div>

      {activeTab === "View Stock" && (
        <>
          <div className="filter-bar">
            <label>Low-stock threshold:</label>
            <input
              type="number"
              min="0"
              placeholder="e.g. 10"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
            <button
              className="btn-primary"
              style={{ padding: "7px 14px", fontSize: 13 }}
              onClick={fetchStock}
            >
              Filter
            </button>
            {threshold !== "" && (
              <button
                className="btn-secondary"
                style={{ padding: "7px 14px", fontSize: 13 }}
                onClick={() => setThreshold("")}
              >
                Clear
              </button>
            )}
          </div>

          {loading ? (
            <div className="spinner">Loading stock…</div>
          ) : stocks.length === 0 ? (
            <div className="empty-state">No stock entries found.</div>
          ) : (
            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>SKU</th>
                    <th>Store</th>
                    <th>Quantity</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stocks.map((s) => (
                    <tr key={s._id}>
                      <td>{s.product?.name ?? "—"}</td>
                      <td>
                        <span className="sku">{s.product?.sku ?? "—"}</span>
                      </td>
                      <td>{s.store?.name ?? "—"}</td>
                      <td>
                        <strong>{s.quantity}</strong>
                      </td>
                      <td>{stockBadge(s.quantity)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}

      {activeTab === "Adjust" && isAdmin && (
        <AdjustForm products={products} stores={stores} onDone={fetchStock} />
      )}

      {activeTab === "Transfer" && isAdmin && (
        <TransferForm products={products} stores={stores} onDone={fetchStock} />
      )}

      {activeTab === "Initialise" && isAdmin && (
        <InitStockForm
          products={products}
          stores={stores}
          onDone={fetchStock}
        />
      )}
    </div>
  );
}

export default StockPage;
