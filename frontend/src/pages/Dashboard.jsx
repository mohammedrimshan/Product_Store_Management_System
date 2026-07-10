import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import { clearCredentials } from "../store/authSlice";
import { logoutUser } from "../api/authService";
import "../styles/dashboard.css";

const stats = [
    { label: "Total Products", value: 0 },
    { label: "Total Stores", value: 0, className: "accent" },
    { label: "Low Stock", value: 0, className: "warning" },
    { label: "Out of Stock", value: 0, className: "danger" },
];

function Dashboard() {
    const dispatch = useDispatch();
    const navigate = useNavigate();
    const { user } = useSelector((state) => state.auth);

    const handleLogout = () => {
        logoutUser();
        dispatch(clearCredentials());
        toast.success("Logged out successfully");
        navigate("/");
    };

    const initials = user?.name
        ? user.name.split(" ").map((n) => n[0]).join("").toUpperCase()
        : "U";

    return (
        <div className="dashboard-layout">
            <aside className="sidebar">
                <div className="sidebar-brand">
                    Product<span>Store</span>
                </div>

                <nav className="sidebar-nav">
                    <div className="nav-item active">Dashboard</div>
                    <div className="nav-item">Products</div>
                    <div className="nav-item">Stores</div>
                    <div className="nav-item">Stock</div>
                </nav>

                <div className="sidebar-footer">
                    <button className="logout-btn" onClick={handleLogout}>
                        Logout
                    </button>
                </div>
            </aside>

            <div className="main-content">
                <header className="topbar">
                    <span className="topbar-title">Dashboard</span>
                    <div className="topbar-user">
                        <div className="user-avatar">{initials}</div>
                        <div className="user-info">
                            <span className="user-name">{user?.name}</span>
                            <span className="user-role">{user?.role}</span>
                        </div>
                    </div>
                </header>

                <div className="page-body">
                    <div className="welcome-card">
                        <h2>Welcome back, {user?.name?.split(" ")[0]} 👋</h2>
                        <p>Here's what's happening in your store today.</p>
                    </div>

                    <div className="stats-grid">
                        {stats.map((stat) => (
                            <div key={stat.label} className={`stat-card ${stat.className || ""}`}>
                                <span className="stat-label">{stat.label}</span>
                                <span className="stat-value">{stat.value}</span>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

export default Dashboard;
