import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { clearCredentials } from "../store/authSlice";
import { logoutUser } from "../api/authService";
import { getStockSummary } from "../api/stockService";
import ProductsPage from "./ProductsPage";
import StoresPage from "./StoresPage";
import StockPage from "./StockPage";
import "../styles/dashboard.css";
import "../styles/pages.css";

const NAV_ITEMS = ["Dashboard", "Products", "Stores", "Stock"];

function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const [activePage, setActivePage] = useState("Dashboard");
    const [summary, setSummary] = useState({
        totalProducts: 0,
        totalStores: 0,
        lowStock: 0,
        outOfStock: 0,
    });

    useEffect(() => {
        getStockSummary()
            .then((res) => setSummary(res.data))
            .catch(() => {});
    }, []);

    const handleLogout = () => {
        logoutUser();
        dispatch(clearCredentials());
        toast.success("Logged out successfully");
        navigate("/");
    };

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
        : "U";

    const stats = [
        { label: "Total Products", value: summary.totalProducts },
        { label: "Total Stores", value: summary.totalStores, className: "accent" },
        { label: "Low Stock", value: summary.lowStock, className: "warning" },
        { label: "Out of Stock", value: summary.outOfStock, className: "danger" },
    ];

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    Product<span>Store</span>
                </div>

                <nav className="sidebar-nav">
                    {NAV_ITEMS.map((item) => (
                        <div
                            key={item}
                            className={`nav-item ${activePage === item ? "active" : ""}`}
                            onClick={() => setActivePage(item)}
                        >
                            {item}
                        </div>
                    ))}
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="topbar">
                    <span className="topbar-title">{activePage}</span>
                    <div className="topbar-user">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                </header>

                {activePage === "Dashboard" && (
                    <div className="page-body">
                        <div className="welcome-card">
                            <h2>Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
                            <p>Here's what's happening in your store today.</p>
                        </div>

                        <div className="stats-grid">
                            {stats.map((stat) => (
                                <div
                                    key={stat.label}
                                    className={`stat-card ${stat.className || ""}`}
                                    style={{ cursor: "pointer" }}
                                    onClick={() => {
                                        if (stat.label === "Total Products") setActivePage("Products");
                                        else if (stat.label === "Total Stores") setActivePage("Stores");
                                        else setActivePage("Stock");
                                    }}
                                >
                                    <span className="stat-label">{stat.label}</span>
                                    <span className="stat-value">{stat.value}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                {activePage === "Products" && <ProductsPage />}
                {activePage === "Stores" && <StoresPage />}
                {activePage === "Stock" && <StockPage />}
            </div>
        </div>
    );
}

export default Dashboard;
