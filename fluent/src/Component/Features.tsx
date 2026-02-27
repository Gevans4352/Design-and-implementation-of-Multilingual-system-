import { Languages, MessageCircle, Sparkles, Globe } from 'lucide-react';

const features = [
    {
        icon: <Languages className="w-6 h-6 text-[#9810fa]" />,
        title: "Multilingual Support",
        description: "Converse in English, French, Yoruba, Igbo, and Hausa with seamless translation"
    },
    {
        icon: <MessageCircle className="w-6 h-6 text-[#9810fa]" />,
        title: "Smart Conversations",
        description: "AI-powered responses that understand context and cultural nuances"
    },
    {
        icon: <Sparkles className="w-6 h-6 text-[#9810fa]" />,
        title: "Speech Recognition",
        description: "Advanced ASR technology to practice pronunciation and speaking skills"
    },
    {
        icon: <Globe className="w-6 h-6 text-[#9810fa]" />,
        title: "Cultural Learning",
        description: "Explore topics that connect you to Nigerian culture and heritage"
    }
];

const Features = () => {
    return (
        <section className="py-20 px-10 bg-white">
            <div className="max-w-7xl mx-auto">
                <div className="text-center mb-16">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">Why Choose FluentRoot?</h2>
                    <p className="text-gray-500 text-lg">Advanced AI technology meets cultural preservation</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
                    {features.map((feature, index) => (
                        <div
                            key={index}
                            className="p-8 rounded-3xl bg-white border border-gray-100 shadow-xl shadow-purple-500/5 hover:shadow-purple-500/10 transition-all duration-300 group"
                        >
                            <div className="w-12 h-12 rounded-2xl bg-[#f3e8ff] flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300">
                                {feature.icon}
                            </div>
                            <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                            <p className="text-gray-500 leading-relaxed text-sm">
                                {feature.description}
                            </p>
                        </div>
                    ))}
                </div>
            </div>
        </section>
    );
};

export default Features;
