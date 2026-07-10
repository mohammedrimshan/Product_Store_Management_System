import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";
import AuthLayout from "../components/AuthLayout";
import { registerUser } from "../api/authService";

function Register() {
    const [formData, setFormData] = useState({
        name: "",
        email: "",
        password: "",
        confirmPassword: "",
    });
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (formData.password !== formData.confirmPassword) {
            toast.error("Passwords do not match");
            return;
        }

        setLoading(true);

        try {
            const result = await registerUser({
                name: formData.name,
                email: formData.email,
                password: formData.password,
            });
            toast.success(result.message);
            navigate("/");
        } catch (err) {
            toast.error(err.response?.data?.message || err.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <AuthLayout title="Create Account">
            <form onSubmit={handleSubmit}>
                <div className="form-group">
                    <label>Full Name</label>
                    <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleChange}
                        required
                    />
                </div>

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

                <div className="form-group">
                    <label>Confirm Password</label>
                    <input
                        type="password"
                        name="confirmPassword"
                        value={formData.confirmPassword}
                        onChange={handleChange}
                        required
                    />
                </div>

                <button className="btn" type="submit" disabled={loading}>
                    {loading ? "Registering…" : "Register"}
                </button>
            </form>

            <p className="bottom-text">
                Already have an account?
                <Link to="/"> Login</Link>
            </p>
        </AuthLayout>
    );
}

export default Register;