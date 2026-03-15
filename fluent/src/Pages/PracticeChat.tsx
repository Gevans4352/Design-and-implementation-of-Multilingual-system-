import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Mic,
    Volume2,
    Languages,
    Check
} from "lucide-react";

interface Message {
    id: string;
    text: string;
    sender: "ai" | "user";
    timestamp: string;
    translation?: string;
    tts_voice?: string;
}

const LANG_DEFAULT_VOICE: Record<string, string> = {
    "ig": "Adaora",
    "ha": "Umar",
    "yo": "Tayo",
    "fr": "Emma",
    "en": "Jude",
    "es": "Remi",
};

const PracticeChat = () => {
    const navigate = useNavigate();
    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState("");
    const [isTranslating, setIsTranslating] = useState(false);
    const [isThinking, setIsThinking] = useState(false);
    const [playingMessageId, setPlayingMessageId] = useState<string | null>(null);
    const [selectedLanguage, setSelectedLanguage] = useState("");
    const [langCode, setLangCode] = useState("");
    const [selectedTopic, setSelectedTopic] = useState("Conversation");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const isTranslatingRef = useRef(isTranslating);

    // Keep ref in sync with state
    useEffect(() => {
        isTranslatingRef.current = isTranslating;
    }, [isTranslating]);

    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8006";

    // Load History and Metadata - only once on mount
    useEffect(() => {
        const conversationId = localStorage.getItem("currentConversationId") || "demo-session";
        
        const loadMetadata = async () => {
            try {
                const response = await fetch(`${API_BASE}/conversations/single/${conversationId}`);
                if (response.ok) {
                    const data = await response.json();
                    const langMap: { [key: string]: string } = {
                        'en': 'English',
                        'fr': 'French',
                        'yo': 'Yoruba',
                        'ig': 'Igbo',
                        'ha': 'Hausa',
                        'es': 'Spanish'
                    };
                    setLangCode(data.language);
                    setSelectedLanguage(langMap[data.language] || "English");
                    setSelectedTopic(data.topic || "Conversation");
                } else {
                    // Fallback to localStorage if metadata fetch fails
                    const storedLang = localStorage.getItem("selectedLanguage") || "ig";
                    const langMap: { [key: string]: string } = {
                        'en': 'English',
                        'fr': 'French',
                        'yo': 'Yoruba',
                        'ig': 'Igbo',
                        'ha': 'Hausa'
                    };
                    setLangCode(storedLang);
                    setSelectedLanguage(langMap[storedLang] || "Igbo");
                    setSelectedTopic(localStorage.getItem("selectedTopicTitle") || "Conversation");
                }
            } catch (err) {
                console.error("Failed to load metadata:", err);
            }
        };

        const loadHistory = async () => {
            try {
                const response = await fetch(`${API_BASE}/messages/${conversationId}`);
                if (response.ok) {
                    const data = await response.json();
                    const mappedMessages = data.map((m: any) => ({
                        id: m.id.toString(),
                        text: m.text,
                        sender: m.sender,
                        timestamp: new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                        translation: m.translation,
                        tts_voice: m.tts_voice
                    }));
                    setMessages(mappedMessages);
                }
            } catch (err) {
                console.error("Failed to load history:", err);
            }
        };
        
        loadMetadata();
        loadHistory();
    }, [API_BASE]);

    // WebSocket Setup - only once on mount
    useEffect(() => {
        const conversationId = localStorage.getItem("currentConversationId") || "demo-session";
        const socket = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws/chat/${conversationId}`);

        socket.onopen = () => {
            console.log("WebSocket connected");
        };

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.sender === "ai") {
                setIsThinking(false);
            }

            let translation = "";

            // Fetch translation if AI message and toggle is on
            if (data.sender === "ai" && isTranslatingRef.current) {
                try {
                    const transRes = await fetch(`${API_BASE}/translate`, {
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

            setMessages((prev: Message[]) => {
                // Prevent duplicate messages using the unique ID from backend
                const isDuplicate = prev.some((m: Message) => m.id === data.id.toString());
                if (isDuplicate) return prev;

                return [...prev, {
                    id: data.id.toString(),
                    text: data.text,
                    sender: data.sender,
                    timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    translation: translation,
                    tts_voice: data.tts_voice
                }];
            });
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
            setIsThinking(false);
        };

        socket.onclose = () => {
            console.log("WebSocket disconnected");
        };

        socketRef.current = socket;

        return () => {
            socket.close();
        };
    }, [API_BASE]); // Reconnect only if API_BASE or conversationId changes (the latter is static here)

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages, isThinking]);

    useEffect(() => {
        if (!isTranslating) return;
        messages.forEach((msg: Message) => {
            if (msg.sender === 'ai' && !msg.translation) {
                translateMessage(msg.id, msg.text);
            }
        });
    }, [isTranslating]); // Only trigger on toggle

    const handleSendMessage = () => {
        if (!inputValue.trim() || !socketRef.current) return;

        const messagePayload = {
            sender: "user",
            text: inputValue
        };

        socketRef.current.send(JSON.stringify(messagePayload));
        setInputValue("");
        setIsThinking(true); // AI will process the message
    };

    const translateMessage = async (id: string, text: string) => {
        try {
            const res = await fetch(`${API_BASE}/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, target_lang: "en" })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((prev: Message[]) => prev.map((m: Message) => m.id === id ? { ...m, translation: data.translatedText } : m));
            }
        } catch (e) {
            console.error("translation failed", e);
        }
    };

    const playTTS = async (messageId: string, text: string, voice?: string) => {
        if (playingMessageId) return;

        setPlayingMessageId(messageId);

        try {
            const effectiveVoice = voice || LANG_DEFAULT_VOICE[langCode] || "Idera";

            // Using GET endpoint allows the browser to handle streaming natively
            const url = `${API_BASE}/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(effectiveVoice)}`;

            const audio = new Audio(url);

            audio.onplay = () => {
                console.log("TTS playback started");
            };

            audio.onended = () => {
                setPlayingMessageId(null);
            };

            audio.onerror = (e) => {
                console.error("Audio playback error", e);
                setPlayingMessageId(null);
            };

            // Start playing immediately as data arrives
            audio.play();
        } catch (e) {
            console.error("TTS setup failed", e);
            setPlayingMessageId(null);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-[#fdfaff]">
            {/* Header */}
            <header className="bg-white border-b border-gray-100 px-4 py-3 flex items-center justify-between shadow-sm sticky top-0 z-10">
                <div className="flex items-center gap-2 md:gap-4">
                    <button
                        onClick={() => navigate("/select-topic")}
                        className="p-1.5 md:p-2 hover:bg-gray-50 rounded-full transition-colors"
                    >
                        <ArrowLeft className="w-5 h-5 text-gray-500" />
                    </button>

                    <div className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-[#9810fa] shrink-0 rounded-lg flex items-center justify-center">
                            <span className="text-white font-bold text-xs">F</span>
                        </div>
                        <span className="hidden sm:inline font-bold text-lg text-gray-800 tracking-tight">FluentRoot</span>
                    </div>

                    <div className="hidden md:flex items-center gap-2 ml-4">
                        <div className="bg-[#f8f0ff] px-3 py-1 rounded-full flex items-center gap-2 border border-[#9810fa]/10">
                            <span className="text-[10px] font-bold text-[#9810fa] bg-white w-4 h-4 rounded-full flex items-center justify-center">
                                {langCode.toUpperCase() || "EN"}
                            </span>
                            <span className="text-xs font-semibold text-[#9810fa]">{selectedLanguage}</span>
                        </div>
                        <div className="bg-white px-3 py-1 rounded-full flex items-center gap-2 border border-gray-100 shadow-sm">
                            <span className="text-xs font-semibold text-gray-600">{selectedTopic}</span>
                        </div>
                    </div>
                </div>

                <div className="flex items-center gap-2 md:gap-4">
                    <div className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 px-2 md:px-3 py-1.5 rounded-xl transition-colors">
                        <Languages className="w-4 h-4 text-[#9810fa] shrink-0" />
                        <span className="hidden md:inline text-xs font-bold text-[#9810fa] uppercase tracking-wider">Translations</span>
                        <div
                            onClick={() => setIsTranslating(!isTranslating)}
                            className={`w-10 h-5 rounded-full relative transition-colors shrink-0 ${isTranslating ? 'bg-[#9810fa]' : 'bg-gray-200'}`}
                        >
                            <div className={`absolute top-0.5 transition-all w-4 h-4 bg-white rounded-full ${isTranslating ? 'left-5.5' : 'left-0.5'}`} />
                        </div>
                    </div>
                </div>
            </header>

            {/* Chat Area */}
            <main className="flex-1 overflow-y-auto p-4 md:p-8 space-y-6">
                {messages.map((message) => (
                    <div
                        key={message.id}
                        className={`flex flex-col ${message.sender === 'user' ? 'items-end' : 'items-start'}`}
                    >
                        <div className={`max-w-[85%] md:max-w-2xl relative group ${message.sender === 'user'
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
                                <button
                                    onClick={() => playTTS(message.id, message.text, message.tts_voice)}
                                    disabled={playingMessageId === message.id}
                                    className={`p-1 hover:bg-[#f8f0ff] rounded-full transition-colors group ${playingMessageId === message.id ? 'animate-pulse' : ''}`}
                                >
                                    <Volume2 className={`w-3.5 h-3.5 ${playingMessageId === message.id ? 'text-[#9810fa]' : 'text-gray-300'} group-hover:text-[#9810fa]`} />
                                </button>
                            )}
                            {message.sender === 'user' && (
                                <Check className="w-3 h-3 text-[#9810fa]" />
                            )}
                        </div>
                    </div>
                ))}

                {/* Thinking Indicator */}
                {isThinking && (
                    <div className="flex flex-col items-start">
                        <div className="bg-white border border-gray-100 rounded-2xl rounded-tl-none py-3 px-4 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-[#9810fa] rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                                <span className="w-1.5 h-1.5 bg-[#9810fa] rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                                <span className="w-1.5 h-1.5 bg-[#9810fa] rounded-full animate-bounce"></span>
                            </div>
                        </div>
                    </div>
                )}

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
                            placeholder="Enter message..."
                            value={inputValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm md:text-base text-gray-700 px-2 py-1 placeholder:text-gray-400"
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
                    <p className="hidden sm:block text-[10px] text-center text-gray-400 mt-2 md:mt-3 font-medium">
                        FluentRoot AI is here to help you practice. Press Enter to send, or use the microphone for voice input.
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PracticeChat;
