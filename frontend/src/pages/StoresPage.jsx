import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { toast } from "sonner";
import { getStores, createStore } from "../api/storeService";
import "../styles/pages.css";

function StoresPage() {
    const { user } = useSelector((state) => state.auth);
    const isAdmin = user?.role === "admin";

    const [stores, setStores] = useState([]);
    const [loading, setLoading] = useState(true);
    const [form, setForm] = useState({ name: "", location: "" });
    const [submitting, setSubmitting] = useState(false);

    const fetchStores = async () => {
        try {
            setLoading(true);
            const res = await getStores();
            setStores(res.data || []);
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to load stores");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchStores();
    }, []);

    const handleChange = (e) => {
        setForm({ ...form, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.name.trim()) {
            toast.error("Store name is required");
            return;
        }
        try {
            setSubmitting(true);
            const res = await createStore(form);
            toast.success(res.message);
            setForm({ name: "", location: "" });
            fetchStores();
        } catch (err) {
            toast.error(err.response?.data?.message || "Failed to create store");
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="page-body">
            <div className="page-header">
                <h2>Stores</h2>
            </div>

            {/* Admin-only: create form */}
            {isAdmin && (
                <div className="card">
                    <p style={{ fontWeight: 600, marginBottom: 14, fontSize: 14 }}>Add New Store</p>
                    <form onSubmit={handleSubmit}>
                        <div className="form-row">
                            <div className="form-field">
                                <label>Store Name</label>
                                <input
                                    name="name"
                                    value={form.name}
                                    onChange={handleChange}
                                    placeholder="e.g. Downtown Branch"
                                />
                            </div>
                            <div className="form-field">
                                <label>Location (optional)</label>
                                <input
                                    name="location"
                                    value={form.location}
                                    onChange={handleChange}
                                    placeholder="e.g. 123 Main St"
                                />
                            </div>
                            <button
                                type="submit"
                                className="btn-primary"
                                disabled={submitting}
                                style={{ alignSelf: "flex-end" }}
                            >
                                {submitting ? "Adding…" : "Add Store"}
                            </button>
                        </div>
                    </form>
                </div>
            )}

            {/* Store list */}
            {loading ? (
                <div className="spinner">Loading stores…</div>
            ) : stores.length === 0 ? (
                <div className="empty-state">No stores found. {isAdmin && "Create one above."}</div>
            ) : (
                <div className="table-wrapper">
                    <table>
                        <thead>
                            <tr>
                                <th>#</th>
                                <th>Name</th>
                                <th>Location</th>
                                <th>Created</th>
                            </tr>
                        </thead>
                        <tbody>
                            {stores.map((s, i) => (
                                <tr key={s._id}>
                                    <td>{i + 1}</td>
                                    <td>{s.name}</td>
                                    <td>{s.location || <span style={{ color: "#bbb" }}>—</span>}</td>
                                    <td>{new Date(s.createdAt).toLocaleDateString()}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            )}
        </div>
    );
}

export default StoresPage;
