import { X } from 'lucide-react';

interface WelcomeModalProps {
    isOpen: boolean;
    onClose: () => void;
    onNext: () => void;
}

const WelcomeModal = ({ isOpen, onClose, onNext }: WelcomeModalProps) => {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
            <div className="bg-white rounded-3xl max-w-lg w-full relative p-12 shadow-2xl animate-in fade-in zoom-in duration-300">
                <button
                    onClick={onClose}
                    className="absolute top-6 right-6 text-gray-400 hover:text-gray-600 transition-colors"
                >
                    <X className="w-6 h-6" />
                </button>

                <div className="text-center">
                    <h2 className="text-3xl font-bold text-gray-900 mb-8 flex items-center justify-center gap-2">
                        Welcome to FluentRoot! <span role="img" aria-label="sprout">🌱</span>
                    </h2>

                    <div className="flex justify-center mb-10">
                        <div className="relative group">
                            <div className="w-32 h-32 text-[#9810fa]">
                                <svg viewBox="0 0 100 100" fill="currentColor">
                                    {/* Simplified icon based on the image */}
                                    <path d="M50 20 L80 80 L50 65 L20 80 Z" stroke="currentColor" strokeWidth="4" fill="none" />
                                    <circle cx="25" cy="25" r="8" opacity="0.6" />
                                    <circle cx="50" cy="15" r="8" opacity="0.8" />
                                    <circle cx="75" cy="25" r="8" opacity="0.6" />
                                    <text x="22" y="28" fontSize="6" fill="white" fontWeight="bold">A</text>
                                    <text x="46" y="18" fontSize="6" fill="white" fontWeight="bold">Àá</text>
                                    <text x="73" y="28" fontSize="6" fill="white" fontWeight="bold">あ</text>
                                </svg>
                            </div>
                        </div>
                    </div>

                    <p className="text-gray-500 text-lg leading-relaxed mb-10">
                        Your AI-powered companion for learning English, French, Yoruba, Igbo, and Hausa. Let's help you preserve your cultural heritage while mastering new languages.
                    </p>

                    <div className="flex justify-center gap-2 mb-10">
                        <div className="w-8 h-2 rounded-full bg-[#9810fa]"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                        <div className="w-2 h-2 rounded-full bg-gray-200"></div>
                    </div>

                    <button
                        onClick={onNext}
                        className="w-full bg-[#9810fa] text-white font-bold py-4 rounded-xl hover:bg-[#8000de] transition-all shadow-lg shadow-[#9810fa]/20"
                    >
                        Next
                    </button>
                </div>
            </div>
        </div>
    );
};

export default WelcomeModal;
