import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
    Search,
    ChevronLeft,
    Hand,
    Users,
    UtensilsCrossed,
    Theater,
    BookOpen,
    CloudSun,
    ShoppingCart,
    HeartPulse,
    MapPin,
    Laptop,
    Trophy,
    Music,
    Briefcase,
    Home,
    Trees,
    PartyPopper,
    Clock,
    Hash,
    Smile,
    Quote
} from "lucide-react";
import { supabase } from "../supabaseClient";

const topics = [
    { id: "greetings", title: "Greetings & Introductions", desc: "Learn how to greet people and introduce yourself", icon: Hand },
    { id: "family", title: "Family & Relationships", desc: "Talk about your family members and relationships", icon: Users },
    { id: "food", title: "Food & Cuisine", desc: "Discuss traditional dishes and dining experiences", icon: UtensilsCrossed },
    { id: "culture", title: "Culture & Traditions", desc: "Explore cultural practices and traditional customs", icon: Theater },
    { id: "education", title: "Education & Learning", desc: "Discuss school, studies, and academic topics", icon: BookOpen },
    { id: "weather", title: "Weather & Seasons", desc: "Talk about weather conditions and seasonal changes", icon: CloudSun },
    { id: "shopping", title: "Shopping & Markets", desc: "Learn vocabulary for buying and selling at markets", icon: ShoppingCart },
    { id: "health", title: "Health & Wellness", desc: "Discuss health topics and medical situations", icon: HeartPulse },
    { id: "travel", title: "Travel & Directions", desc: "Navigate places and ask for directions", icon: MapPin },
    { id: "tech", title: "Technology & Modern Life", desc: "Talk about phones, computers, and modern conveniences", icon: Laptop },
    { id: "sports", title: "Sports & Recreation", desc: "Discuss popular sports and leisure activities", icon: Trophy },
    { id: "music", title: "Music & Entertainment", desc: "Talk about traditional and modern music", icon: Music },
    { id: "work", title: "Work & Professions", desc: "Discuss jobs, careers, and workplace topics", icon: Briefcase },
    { id: "home", title: "Home & Living", desc: "Describe your home and household items", icon: Home },
    { id: "nature", title: "Nature & Environment", desc: "Talk about plants, animals, and the environment", icon: Trees },
    { id: "celebrations", title: "Celebrations & Festivals", desc: "Learn about traditional and modern celebrations", icon: PartyPopper },
    { id: "time", title: "Time & Dates", desc: "Discuss time, days, months, and scheduling", icon: Clock },
    { id: "numbers", title: "Numbers & Counting", desc: "Practice numbers and mathematical expressions", icon: Hash },
    { id: "emotions", title: "Emotions & Feelings", desc: "Express how you feel and understand others", icon: Smile },
    { id: "proverbs", title: "Proverbs & Wisdom", desc: "Learn traditional sayings and wisdom", icon: Quote },
];

const TopicSelection = () => {
    const [searchTerm, setSearchTerm] = useState("");
    const [selecting, setSelecting] = useState<string | null>(null);
    const [errorMsg, setErrorMsg] = useState<string | null>(null);
    const navigate = useNavigate();

    const filteredTopics = topics.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8006";

    const handleSelectTopic = async (topicId: string) => {
        if (selecting) return; // Prevent double clicks
        setSelecting(topicId);
        setErrorMsg(null);

        const topic = topics.find(t => t.id === topicId);
        const language = localStorage.getItem("selectedLanguage") || "ig";

        // Try getSession first, fall back to getUser if session is stale
        let userId: string | null = null;
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (session?.user) {
                userId = session.user.id;
            } else {
                // Refresh session
                const { data: { user } } = await supabase.auth.getUser();
                userId = user?.id ?? null;
            }
        } catch (e) {
            console.error("Auth check failed:", e);
        }

        if (!userId) {
            navigate("/Login");
            return;
        }

        const convId = `conv_${Date.now()}`;

        try {
            const res = await fetch(`${API_BASE}/conversations`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: convId,
                    user_id: userId,
                    language: language,
                    topic: topic?.title || topicId
                })
            });

            if (!res.ok) {
                console.warn("Conversation creation returned non-ok status:", res.status);
            }
        } catch (err) {
            console.error("Failed to create conversation:", err);
            setErrorMsg("Could not connect to backend. Starting locally.");
        }

        // Always navigate – conversation will be created on first message if backend missed it
        localStorage.setItem("selectedTopic", topicId);
        localStorage.setItem("selectedTopicTitle", topic?.title || topicId);
        localStorage.setItem("selectedLanguage", language);
        localStorage.setItem("currentConversationId", convId);
        navigate("/practice");
    };

    return (
        <div className="min-h-screen bg-[#fdfaff] pb-12">
            <div className="max-w-7xl mx-auto px-4 pt-8 md:pt-12">
                <div className="text-center mb-10 md:mb-12">
                    <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3 md:mb-4">Choose a Topic</h1>
                    <p className="text-gray-600 text-base md:text-lg">Select what you'd like to practice today</p>
                    {errorMsg && (
                        <p className="mt-3 text-sm text-orange-500 bg-orange-50 border border-orange-100 rounded-xl px-4 py-2 inline-block">
                            ⚠️ {errorMsg}
                        </p>
                    )}
                </div>

                <div className="max-w-2xl mx-auto mb-12 relative">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search topics..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-12 pr-4 py-4 rounded-2xl border border-gray-100 shadow-sm focus:border-[#9810fa] focus:ring-2 focus:ring-[#9810fa]/20 outline-none transition-all"
                    />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {filteredTopics.map((topic) => {
                        const isLoading = selecting === topic.id;
                        const isDisabled = !!selecting;
                        return (
                            <div
                                key={topic.id}
                                onClick={() => handleSelectTopic(topic.id)}
                                className={`bg-white p-8 rounded-3xl border transition-all text-center group ${isLoading
                                    ? 'border-[#9810fa]/50 shadow-xl shadow-[#9810fa]/10 scale-[0.98]'
                                    : isDisabled
                                        ? 'border-gray-100 shadow-sm opacity-50 cursor-not-allowed'
                                        : 'border-gray-100 shadow-sm hover:shadow-xl hover:border-[#9810fa]/50 cursor-pointer'
                                    }`}
                            >
                                <div className={`w-14 h-14 md:w-16 md:h-16 bg-[#f8f0ff] rounded-2xl flex items-center justify-center mx-auto mb-4 md:mb-6 transition-transform ${!isDisabled ? 'group-hover:scale-110' : ''
                                    }`}>
                                    {isLoading
                                        ? <div className="w-5 h-5 md:w-6 md:h-6 border-2 border-[#9810fa] border-t-transparent rounded-full animate-spin" />
                                        : <topic.icon className="w-6 h-6 md:w-8 md:h-8 text-[#9810fa]" />
                                    }
                                </div>
                                <h3 className="text-lg md:text-xl font-bold text-gray-800 mb-2">{topic.title}</h3>
                                <p className="text-gray-500 text-sm leading-relaxed">{topic.desc}</p>
                            </div>
                        );
                    })}
                </div>

                <div className="mt-12 text-center">
                    <button
                        onClick={() => navigate("/select-language")}
                        className="inline-flex items-center text-gray-500 hover:text-[#9810fa] font-semibold transition-colors"
                    >
                        <ChevronLeft className="w-5 h-5 mr-1" />
                        Back to Language Selection
                    </button>
                </div>
            </div>
        </div>
    );
};

export default TopicSelection;
