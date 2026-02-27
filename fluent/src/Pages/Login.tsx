import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Eye, EyeOff } from "lucide-react"

const Login = () => {
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const navigate = useNavigate()

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setLoading(true)
        setError("")

        try {
            const response = await fetch("http://127.0.0.1:8000/login", {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({ email, password }),
            })

            const data = await response.json()

            if (response.ok) {
                console.log("Login successful:", data)
                localStorage.setItem("isLoggedIn", "true")
                localStorage.setItem("user", JSON.stringify(data.user))
                navigate("/dashboard")
            } else {
                setError(data.detail || "Invalid email or password")
            }
        } catch (err) {
            setError("Could not connect to the server")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex items-center justify-center min-h-[calc(100vh-80px)] w-full bg-gray-50/50">
            <div className="w-full max-w-md bg-white border border-gray-100 rounded-3xl shadow-xl shadow-gray-200/50 p-8 m-4">
                <div className="text-center mb-10">
                    <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
                    <p className="text-gray-500">Please enter your details to sign in</p>
                </div>

                {error && (
                    <div className="mb-4 p-3 bg-red-50 text-red-500 text-sm rounded-xl border border-red-100">
                        {error}
                    </div>
                )}

                <form className="space-y-6" onSubmit={handleSubmit}>
                    <div className="space-y-2">
                        <label htmlFor="email" className="text-sm font-semibold text-gray-700 ml-1">Email Address</label>
                        <input
                            id="email"
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Enter your email"
                            className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#9810fa] focus:ring-2 focus:ring-[#9810fa]/20 outline-none transition-all"
                        />
                    </div>

                    <div className="space-y-2">
                        <label htmlFor="password" className="text-sm font-semibold text-gray-700 ml-1">Password</label>
                        <div className="relative">
                            <input
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="••••••••"
                                className="w-full px-5 py-3 rounded-2xl border border-gray-200 focus:border-[#9810fa] focus:ring-2 focus:ring-[#9810fa]/20 outline-none transition-all"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-[#9810fa] text-white font-bold py-4 rounded-2xl hover:bg-[#8000de] active:scale-[0.98] transition-all shadow-lg shadow-[#9810fa]/30 disabled:opacity-50"
                    >
                        {loading ? "Signing in..." : "Sign In"}
                    </button>
                </form>

                <div className="mt-8 text-center text-sm text-gray-500">
                    Don't have an account? <Link to="/Signup"><span className="text-[#9810fa] font-bold cursor-pointer hover:underline">Sign up</span></Link>
                </div>
            </div>
        </div>
    )
}

export default Login