
import { Link } from "react-router-dom"
import image from "../assets/photo-1706403615881-d83dc2067c5d.jpg"
import Features from "./Features"
import CTA from "./CTA"
import Footer from "./Footer"

const Home = () => {
    return (
        <div className="flex flex-col">
            <div className="flex px-10 items-center justify-between min-h-[calc(100vh-80px)] gap-10">
                <div className="w-1/2">
                    <h4 className="rounded-full bg-[#f3e8ff] text-[#b169ef] px-4 py-2 w-fit mb-4">Preserving Cultural Heritage Through Technology</h4>
                    <h1 className="text-6xl font-bold text-gray-900">Master Multiple <br /> Languages with <br /><span className="text-[#9810fa]">FluentRoot</span></h1>
                    <p className="text-gray-600 text-lg mt-4 max-w-2xl">Your AI-powered companion for learning English, French, Yoruba, Igbo, and Hausa. Connect with your cultural roots while mastering new languages.</p>
                    <Link to={localStorage.getItem("isLoggedIn") === "true" ? "/dashboard" : "/Login"}>
                        <button className="bg-[#9810fa] text-white font-bold py-4 px-4 rounded-xl hover:bg-[#8000de] transition-all shadow-lg shadow-[#9810fa]/30 mt-4 cursor-pointer">
                            Get Started
                        </button>
                    </Link>
                </div>

                <div className="w-1/2 flex justify-end">
                    <div className="relative group">
                        {/* The Glow Effect */}
                        <div className="absolute -inset-1 bg-[#9810fa] rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>

                        {/* The Image */}
                        <img
                            src={image}
                            alt=""
                            className="relative rounded-2xl h-96 object-cover shadow-2xl border-4 border-purple-500/50"
                        />
                    </div>
                </div>
            </div>

            <Features />
            <CTA />
            <Footer />
        </div>
    )
}

export default Home