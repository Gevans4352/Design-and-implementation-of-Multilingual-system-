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
    const navigate = useNavigate();

    const filteredTopics = topics.filter(t =>
        t.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        t.desc.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const handleSelectTopic = async (topicId: string) => {
        const topic = topics.find(t => t.id === topicId);
        const language = localStorage.getItem("selectedLanguage") || "Unknown";
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        const convId = `conv_${Date.now()}`;

        try {
            await fetch("http://127.0.0.1:8000/conversations", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    id: convId,
                    user_id: user.id,
                    language: language,
                    topic: topic?.title || topicId
                })
            });

            localStorage.setItem("selectedTopic", topicId);
            localStorage.setItem("currentConversationId", convId);
            navigate("/practice");
        } catch (err) {
            console.error("Failed to create conversation:", err);
            // Fallback: still navigate but might not persist
            localStorage.setItem("currentConversationId", convId);
            navigate("/practice");
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfaff] pb-12">
            <div className="max-w-7xl mx-auto px-4 pt-12">
                <div className="text-center mb-12">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose a Topic</h1>
                    <p className="text-gray-600 text-lg">Select what you'd like to practice today</p>
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
                    {filteredTopics.map((topic) => (
                        <div
                            key={topic.id}
                            onClick={() => handleSelectTopic(topic.id)}
                            className="bg-white p-8 rounded-3xl border border-gray-100 shadow-sm hover:shadow-xl hover:border-[#9810fa]/50 transition-all cursor-pointer text-center group"
                        >
                            <div className="w-16 h-16 bg-[#f8f0ff] rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-110 transition-transform">
                                <topic.icon className="w-8 h-8 text-[#9810fa]" />
                            </div>
                            <h3 className="text-xl font-bold text-gray-800 mb-2">{topic.title}</h3>
                            <p className="text-gray-500 text-sm leading-relaxed">{topic.desc}</p>
                        </div>
                    ))}
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
