import { ArrowLeft, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useState } from 'react';

const languages = [
    { id: 'en', name: 'English', sub: 'English', icon: 'GB' },
    { id: 'fr', name: 'French', sub: 'Français', icon: 'FR' },
    { id: 'yo', name: 'Yoruba', sub: 'Yorùbá', icon: 'NG' },
    { id: 'ig', name: 'Igbo', sub: 'Igbo', icon: 'NG' },
    { id: 'ha', name: 'Hausa', sub: 'Hausa', icon: 'NG' }
];

const LanguageSelection = () => {
    const navigate = useNavigate();
    const [selected, setSelected] = useState<string | null>(null);

    return (
        <div className="min-h-screen bg-[#fdfaff] py-16 px-10">
            <button
                onClick={() => navigate('/dashboard')}
                className="flex items-center gap-2 text-[#9810fa] font-semibold mb-12 hover:gap-3 transition-all"
            >
                <ArrowLeft className="w-5 h-5" />
                <span>Back to Conversations</span>
            </button>

            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-16">
                    <h1 className="text-4xl font-bold text-gray-900 mb-4">Choose Your Language</h1>
                    <p className="text-gray-500 text-lg">Select the language you want to practice</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
                    {languages.map((lang) => (
                        <div
                            key={lang.id}
                            onClick={() => setSelected(lang.id)}
                            className={`p-8 bg-white rounded-3xl border-2 transition-all cursor-pointer flex items-center gap-6 group ${selected === lang.id
                                ? 'border-[#9810fa] shadow-xl shadow-purple-500/10'
                                : 'border-white hover:border-gray-100 shadow-sm hover:shadow-md'
                                }`}
                        >
                            <div className="w-20 h-20 rounded-2xl bg-gray-50 flex items-center justify-center text-3xl font-bold text-gray-600 group-hover:scale-105 transition-transform">
                                {lang.icon}
                            </div>
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900">{lang.name}</h3>
                                <p className="text-gray-500">{lang.sub}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="mt-16 flex justify-end">
                    <button
                        disabled={!selected}
                        onClick={() => {
                            if (selected) {
                                localStorage.setItem("selectedLanguage", selected);
                                navigate('/select-topic');
                            }
                        }}
                        className={`flex items-center gap-2 px-10 py-4 rounded-xl font-bold transition-all ${selected
                            ? 'bg-[#9810fa] text-white shadow-lg shadow-purple-500/20 hover:scale-105 active:scale-95'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed'
                            }`}
                    >
                        <span>Continue</span>
                        <ArrowRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};

export default LanguageSelection;
