import { Link, useNavigate } from "react-router-dom"
import { useState, useEffect } from "react"

const Navbar = () => {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const navigate = useNavigate();

    useEffect(() => {
        // Initial check
        const loggedIn = localStorage.getItem("isLoggedIn") === "true";
        setIsLoggedIn(loggedIn);

        // Listen for changes in localStorage (auth state)
        const checkAuth = () => {
            const status = localStorage.getItem("isLoggedIn") === "true";
            setIsLoggedIn(status);
        };

        window.addEventListener('storage', checkAuth);

        // Custom interval as fallback since 'storage' event doesn't fire in the same tab
        const interval = setInterval(checkAuth, 1000);

        return () => {
            window.removeEventListener('storage', checkAuth);
            clearInterval(interval);
        };
    }, []);

    const handleLogout = () => {
        localStorage.removeItem("isLoggedIn");
        setIsLoggedIn(false);
        navigate("/", { replace: true });
    };

    return (
        <nav className="flex justify-between items-center px-10 border-b-2 border-gray-100 w-full h-20 shadow-md fixed top-0 left-0 right-0 z-50 bg-white">
            <Link to="/"> <h1 className="font-bold text-3xl text-[#9810fa]">FluentRoot</h1></Link>

            <div className="flex items-center gap-4">
                {isLoggedIn ? (
                    <button
                        onClick={handleLogout}
                        className="bg-[#9810fa] px-6 py-2 rounded-full cursor-pointer hover:bg-[#8000de] transition-colors text-white font-medium shadow-lg shadow-[#9810fa]/20"
                    >
                        Logout
                    </button>
                ) : (
                    <Link to="/Login">
                        <div className="bg-[#9810fa] px-6 py-2 rounded-full cursor-pointer hover:bg-[#8000de] transition-colors text-white font-medium shadow-lg shadow-[#9810fa]/20">
                            Get Started
                        </div>
                    </Link>
                )}
            </div>
        </nav>
    )
}

export default Navbar