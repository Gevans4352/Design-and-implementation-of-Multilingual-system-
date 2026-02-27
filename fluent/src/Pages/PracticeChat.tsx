import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Mic,
    Volume2,
    Languages,
    Check,
    MoreVertical
} from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: "ai" | "user";
    timestamp: string;
    translation?: string;          // optional translated text when toggled
}

const PracticeChat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);

    useEffect(() => {
        const conversationId = localStorage.getItem("currentConversationId") || "demo-session";

        // Load History
        const loadHistory = async () => {
            try {
                const response = await fetch(`http://127.0.0.1:8000/messages/${conversationId}`);
                if (response.ok) {
                    const data = await response.json();
                    const mappedMessages = data.map((m: any) => ({
                        id: m.id.toString(),
                        text: m.text,
                        sender: m.sender,
                        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        translation: m.translation
                    }));
                    setMessages(mappedMessages);
                }
            } catch (err) {
                console.error("Failed to load history:", err);
            }
        };
        loadHistory();

        const socket = new WebSocket(`ws://127.0.0.1:8000/ws/chat/${conversationId}`);

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);
            let translation = "";

            // Fetch translation if AI message and toggle is on
            if (data.sender === "ai" && isTranslating) {
                try {
                    const transRes = await fetch("http://127.0.0.1:8000/translate", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ text: data.text, target_lang: "en" })
                    });
                    if (transRes.ok) {
                        const transData = await transRes.json();
                        translation = transData.translatedText;
                    }
                } catch (err) {
                    console.error("Translation failed:", err);
                }
            }

            setMessages((prev) => {
                // Prevent duplicate messages from broadcast
                const isDuplicate = prev.some(m => m.text === data.text && m.timestamp === new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
                if (isDuplicate) return prev;

                return [...prev, {
                    id: Date.now().toString(),
                    text: data.text,
                    sender: data.sender,
                    timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    translation: translation
                }];
            });
        };

        socketRef.current = socket;

        return () => {
            socket.close();
        };
    }, [isTranslating]); // Reconnect/Rebind when translation toggle changes to capture effect

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!isTranslating) return;
        messages.forEach((msg) => {
            if (msg.sender === 'ai' && !msg.translation) {
                translateMessage(msg.id, msg.text);
            }
        });
    }, [isTranslating, messages.length]);

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socketRef.current) return;

        const messagePayload = {
            sender: "user",
            text: inputValue
        };

        socketRef.current.send(JSON.stringify(messagePayload));
        setInputValue("");
    };

    const translateMessage = async (id: string, text: string) => {
        try {
            const res = await fetch("http://127.0.0.1:8000/translate", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, target_lang: "en" })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages(prev => prev.map(m => m.id === id ? { ...m, translation: data.translatedText } : m));
            }
        } catch (e) {
            console.error("translation failed", e);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#fdfaff]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-4">
                    <button
                        onClick={() => navigate("/select-topic")}
                        className="p-2 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#9810fa] rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">F</span>
                        </div>
                        <span className="font-bold text-lg text-gray-800 tracking-tight">FluentRoot</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 ml-4">
                        <div className="bg-[#f8f0ff] px-3 py-1 rounded-full flex items-center gap-2 border border-[#9810fa]/10">
                            <span className="text-[10px] font-bold text-[#9810fa] bg-white w-4 h-4 rounded-full flex items-center justify-center">NG</span>
                            <span className="text-xs font-semibold text-[#9810fa]">Igbo</span>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-full flex items-center gap-2 border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-600">Shopping & Markets</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-3 py-1.5 rounded-xl transition-colors">
                        <Languages className="w-4 h-4 text-[#9810fa]" />
                        <span className="text-xs font-bold text-[#9810fa] uppercase tracking-wider">Translations</span>
                        <div
                            onClick={() => setIsTranslating(!isTranslating)}
                            className={`w-10 h-5 rounded-full relative transition-colors ${isTranslating ? 'bg-[#9810fa]' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-0.5 transition-all w-4 h-4 bg-white rounded-full ${isTranslating ? 'left-5.5' : 'left-0.5'}`} />
                        </div>
                    </div>
                    <button className="p-2 hover:bg-gray-50 rounded-full transition-colors">
                        <MoreVertical className="w-5 h-5 text-gray-400" />
                    </button>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div className={`max-w-[80%] md:max-w-2xl relative group ${message.sender === 'user'
                            ? 'bg-[#9810fa] text-white rounded-2xl rounded-tr-none py-3 px-4 shadow-lg shadow-[#9810fa]/10'
                            : 'bg-white border border-gray-100 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm'
                            }`}>
                            <p className="text-sm md:text-base leading-relaxed">{message.text}</p>

                            {isTranslating && message.sender === 'ai' && message.translation && (
                                <div className="mt-2 pt-2 border-t border-gray-100">
                                    <p className="text-sm text-[#9810fa] italic font-medium">{message.translation}</p>
                                </div>
                            )}
                        </div>

                        <div className={`flex items-center gap-2 mt-1 px-1 ${message.sender === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                            <span className="text-[10px] font-medium text-gray-400">{message.timestamp}</span>
                            {message.sender === 'ai' && (
                                <button className="p-1 hover:bg-[#f8f0ff] rounded-full transition-colors group">
                                    <Volume2 className="w-3.5 h-3.5 text-gray-300 group-hover:text-[#9810fa]" />
                                </button>
                            )}
                            {message.sender === 'user' && (
                                <Check className="w-3 h-3 text-[#9810fa]" />
                            )}
                        </div>
                    </div>
                ))}
                <div ref={messagesEndRef} />
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-100 p-4 pb-6 shadow-[0_-4px_20px_rgba(0,0,0,0.02)]">
                <div className="max-w-4xl mx-auto">
                    <div className="bg-[#fcfaff] border border-gray-100 rounded-2xl px-2 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#9810fa]/10 focus-within:border-[#9810fa]/30 transition-all">
                        <button className="p-3 hover:bg-white hover:shadow-sm rounded-xl transition-all text-gray-400 hover:text-[#9810fa]">
                            <Mic className="w-5 h-5" />
                        </button>
                        <input
                            type="text"
                            placeholder="Type your message in Igbo..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 bg-transparent border-none outline-none text-sm md:text-base text-gray-700 px-2 py-1 placeholder:text-gray-400"
                        />
                        <button
                            onClick={handleSendMessage}
                            disabled={!inputValue.trim()}
                            className={`p-3 rounded-xl transition-all ${inputValue.trim()
                                ? 'bg-[#9810fa] text-white shadow-lg shadow-[#9810fa]/30 hover:scale-105 active:scale-95'
                                : 'bg-gray-100 text-gray-300 cursor-not-allowed'
                                }`}
                        >
                            <Send className="w-5 h-5" />
                        </button>
                    </div>
                    <p className="text-[10px] text-center text-gray-400 mt-3 font-medium">
                        FluentRoot AI is here to help you practice. Press Enter to send, or use the microphone for voice input.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PracticeChat;
