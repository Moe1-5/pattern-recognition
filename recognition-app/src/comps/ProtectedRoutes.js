import { Navigate } from "react-router-dom";

function useAuth() {
    const token = localStorage.getItem("authToken");
    return !!token;
}

export function ProtectedRoute({ children }) {
    const isAuthenticated = useAuth();

    if (!isAuthenticated) {
        return <Navigate to="/" />;
    }

    return children;
}
