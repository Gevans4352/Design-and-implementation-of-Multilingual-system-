
import { Link } from "react-router-dom"
import image from "../assets/photo-1706403615881-d83dc2067c5d.jpg"
import Features from "./Features"
import CTA from "./CTA"
import Footer from "./Footer"

const Home = () => {
    return (
        <div className="flex flex-col">
            <div className="flex flex-col md:flex-row px-4 md:px-10 items-center justify-between min-h-[calc(100vh-80px)] gap-10 py-10 md:py-0 mt-20 md:mt-0">
                <div className="w-full md:w-1/2 mt-10 md:mt-0">
                    <h4 className="rounded-full bg-[#f3e8ff] text-[#b169ef] px-4 py-2 w-fit mb-4 text-sm md:text-base">Preserving Cultural Heritage Through Technology</h4>
                    <h1 className="text-4xl md:text-6xl font-bold text-gray-900 leading-tight">Master Multiple <br className="hidden md:block" /> Languages with <br className="hidden md:block" /><span className="text-[#9810fa]">FluentRoot</span></h1>
                    <p className="text-gray-600 text-base md:text-lg mt-4 w-full max-w-2xl">Your AI-powered companion for learning English, French, Yoruba, Igbo, and Hausa. Connect with your cultural roots while mastering new languages.</p>
                    <Link to={localStorage.getItem("isLoggedIn") === "true" ? "/dashboard" : "/Login"}>
                        <button className="bg-[#9810fa] text-white font-bold py-4 px-4 rounded-xl hover:bg-[#8000de] transition-all shadow-lg shadow-[#9810fa]/30 mt-4 cursor-pointer">
                            Get Started
                        </button>
                    </Link>
                </div>

                <div className="w-full md:w-1/2 flex justify-center md:justify-end mb-10 md:mb-0">
                    <div className="relative group w-full max-w-md md:max-w-none">
                        {/* The Glow Effect */}
                        <div className="absolute -inset-1 bg-[#9810fa] rounded-3xl blur-2xl opacity-30 group-hover:opacity-50 transition-opacity duration-500"></div>

                        {/* The Image */}
                        <img
                            src={image}
                            alt=""
                            className="relative rounded-2xl h-80 md:h-96 w-full object-cover shadow-2xl border-4 border-purple-500/50"
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