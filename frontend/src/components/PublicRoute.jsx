import { useSelector } from "react-redux";
import { Navigate } from "react-router-dom";

function PublicRoute({ children }) {
    const { isAuthenticated } = useSelector((state) => state.auth);

    if (isAuthenticated) {
        return <Navigate to="/dashboard" replace />;
    }

    return children;
}

export default PublicRoute;
