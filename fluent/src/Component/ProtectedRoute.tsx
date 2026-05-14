import { Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
    const [isAuthenticated, setIsAuthenticated] = useState<boolean | null>(null);

    useEffect(() => {
        const checkAuth = async () => {
            // Check local storage first (resilience)
            const localLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            
            try {
                const { data: { session } } = await supabase.auth.getSession();
                setIsAuthenticated(!!session || localLoggedIn);
            } catch (err) {
                console.error("Auth check failed, using local fallback:", err);
                setIsAuthenticated(localLoggedIn);
            }
        };
        checkAuth();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            const localLoggedIn = localStorage.getItem("isLoggedIn") === "true";
            setIsAuthenticated(!!session || localLoggedIn);
        });

        return () => subscription.unsubscribe();
    }, []);

    if (isAuthenticated === null) {
        return <div className="flex items-center justify-center min-h-screen">Loading...</div>;
    }

    if (!isAuthenticated) {
        return <Navigate to="/Login" replace />;
    }

    return <>{children}</>;
};

export default ProtectedRoute;
