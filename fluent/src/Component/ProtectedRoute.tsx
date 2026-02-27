import { Navigate } from "react-router-dom";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const isLoggedIn = localStorage.getItem("isLoggedIn") === "true";

    if (!isLoggedIn) {
        return <Navigate to="/Login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
