import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { getProducts, createProduct } from "../api/productService";
import "../styles/pages.css";

function ProductsPage() {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === "admin";

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", sku: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchProducts = async () => {
        try {
            setLoading(true);
            const res = await getProducts();
            setProducts(res.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load products");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim() || !form.sku.trim()) {
            toast.error("Name and SKU are required");
            return;
        }
        try {
            setSubmitting(true);
            const res = await createProduct(form);
            toast.success(res.message);
            setForm({ name: "", sku: "" });
            fetchProducts();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create product");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-body">
            <div className="page-header">
                <h2>Products</h2>
            </div>

            {isAdmin && (
                <div className="card">
                    <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Add New Product</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-field">
                                <label>Product Name</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Wireless Headphones"
                                />
                            </div>
                            <div className="form-field">
                                <label>SKU</label>
                                <input
                                    name="sku"
                                    value={form.sku}
                                    onChange={handleChange}
                                    placeholder="e.g. SKU-001"
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting}
                                style={{ alignSelf: "flex-end" }}
                            >
                                {submitting ? "Adding…" : "Add Product"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {loading ? (
                <div className="spinner">Loading products…</div>
            ) : products.length === 0 ? (
                <div className="empty-state">No products found. {isAdmin && "Create one above."}</div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>SKU</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.map((p, i) => (
                                <tr key={p._id}>
                                    <td>{i + 1}</td>
                                    <td>{p.name}</td>
                                    <td><span className="sku">{p.sku}</span></td>
                                    <td>{new Date(p.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default ProductsPage;
