import { Link } from "react-router-dom";

const CTA = () => {
    return (
        <section className="py-20 px-10 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="bg-[#9810fa] rounded-[40px] py-20 px-10 text-center relative overflow-hidden shadow-2xl shadow-purple-500/40">
                    {/* Decorative background effects */}
                    <div className="absolute top-0 right-0 -mr-20 -mt-20 w-80 h-80 bg-white/10 rounded-full blur-3xl"></div>
                    <div className="absolute bottom-0 left-0 -ml-20 -mb-20 w-80 h-80 bg-black/10 rounded-full blur-3xl"></div>

                    <div className="relative z-10">
                        <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
                            Ready to Start Your Language Journey?
                        </h2>
                        <p className="text-white/80 text-lg md:text-xl max-w-2xl mx-auto mb-10">
                            Join students preserving their cultural heritage through interactive learning
                        </p>
                        <Link to={localStorage.getItem("isLoggedIn") === "true" ? "/dashboard" : "/Signup"}>
                            <button className="bg-white text-[#9810fa] font-bold py-4 px-10 rounded-xl hover:bg-gray-100 transition-all shadow-xl hover:scale-105 active:scale-95 cursor-pointer">
                                Get Started Free
                            </button>
                        </Link>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default CTA;
