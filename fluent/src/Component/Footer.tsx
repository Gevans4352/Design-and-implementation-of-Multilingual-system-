import { Sparkles } from 'lucide-react';

const Footer = () => {
    return (
        <footer className="py-12 px-10 border-t border-gray-100 bg-white">
            <div className="max-w-7xl mx-auto flex flex-col items-center">
                <div className="flex items-center gap-2 mb-6">
                    <div className="w-8 h-8 rounded-lg bg-[#f3e8ff] flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#9810fa]" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">FluentRoot</span>
                </div>

                <p className="text-gray-500 text-sm text-center">
                    © {new Date().getFullYear()} FluentRoot. Empowering multilingual communication.
                </p>
            </div>
        </footer>
    );
};

export default Footer;
