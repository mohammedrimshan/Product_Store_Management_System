import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { toast } from "sonner";
import AuthLayout from "../components/AuthLayout";
import { loginUser } from "../api/authService";
import { setCredentials } from "../store/authSlice";

function Login() {
    const [formData, setFormData] = useState({ email: "", password: "" });
    const [loading, setLoading] = useState(false);
    const dispatch = useDispatch();
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        try {
            const result = await loginUser(formData);
            localStorage.setItem("token", result.data.token);
            localStorage.setItem("user", JSON.stringify(result.data));
            dispatch(setCredentials({ user: result.data, token: result.data.token }));
            toast.success(result.message);
            navigate("/dashboard");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Product Store" subtitle="Stock Management System">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Email</label>
                    <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Password</label>
                    <input
                        type="password"
                        name="password"
                        value={formData.password}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button className="btn" type="submit" disabled={loading}>
                    {loading ? "Logging in…" : "Login"}
                </button>
            </form>

            <p className="bottom-text">
                Don't have an account?
                <Link to="/register"> Register</Link>
            </p>
        </AuthLayout>
    );
}

export default Login;