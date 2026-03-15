import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    ArrowLeft,
    Send,
    Mic,
    MicOff,
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

// Web Speech API type declarations
declare global {
    interface Window {
        SpeechRecognition: any;
        webkitSpeechRecognition: any;
    }
}

// Map our language codes to BCP-47 codes for speech recognition
const SPEECH_LANG_MAP: Record<string, string> = {
    "ig": "ig-NG",   // Igbo (may fallback to en-NG in some browsers)
    "ha": "ha-NG",   // Hausa
    "yo": "yo-NG",   // Yoruba
    "fr": "fr-FR",   // French
    "en": "en-US",   // English
    "es": "es-ES",   // Spanish
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

    // Mic state
    const [isListening, setIsListening] = useState(false);
    const [micError, setMicError] = useState<string | null>(null);
    const [micSupported, setMicSupported] = useState(false);
    const recognitionRef = useRef<any>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const socketRef = useRef<WebSocket | null>(null);
    const isTranslatingRef = useRef(isTranslating);

    // Keep ref in sync with state
    useEffect(() => {
        isTranslatingRef.current = isTranslating;
    }, [isTranslating]);

    const API_BASE = import.meta.env.VITE_API_URL || "http://127.0.0.1:8006";

    // Check if Speech Recognition is supported
    useEffect(() => {
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
        if (SpeechRecognition) {
            setMicSupported(true);
        }
    }, []);

    // Load History and Metadata
    useEffect(() => {
        const conversationId = localStorage.getItem("currentConversationId") || "demo-session";

        const loadMetadata = async () => {
            try {
                const response = await fetch(`${API_BASE}/conversations/single/${conversationId}`);
                if (response.ok) {
                    const data = await response.json();
                    const langMap: { [key: string]: string } = {
                        'en': 'English', 'fr': 'French', 'yo': 'Yoruba',
                        'ig': 'Igbo', 'ha': 'Hausa', 'es': 'Spanish'
                    };
                    setLangCode(data.language);
                    setSelectedLanguage(langMap[data.language] || "English");
                    setSelectedTopic(data.topic || "Conversation");
                } else {
                    const storedLang = localStorage.getItem("selectedLanguage") || "ig";
                    const langMap: { [key: string]: string } = {
                        'en': 'English', 'fr': 'French', 'yo': 'Yoruba',
                        'ig': 'Igbo', 'ha': 'Hausa'
                    };
                    setLangCode(storedLang);
                    setSelectedLanguage(langMap[storedLang] || "Igbo");
                    setSelectedTopic(localStorage.getItem("selectedTopicTitle") || "Conversation");
                }
            } catch (err) {
                console.error("Failed to load metadata:", err);
                const storedLang = localStorage.getItem("selectedLanguage") || "ig";
                setLangCode(storedLang);
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

    // WebSocket Setup
    useEffect(() => {
        const conversationId = localStorage.getItem("currentConversationId") || "demo-session";
        const socket = new WebSocket(`${API_BASE.replace('http', 'ws')}/ws/chat/${conversationId}`);

        socket.onopen = () => console.log("WebSocket connected");

        socket.onmessage = async (event) => {
            const data = JSON.parse(event.data);

            if (data.sender === "ai") {
                setIsThinking(false);
            }

            let translation = "";
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
                const isDuplicate = prev.some((m: Message) => m.id === data.id.toString());
                if (isDuplicate) return prev;
                return [...prev, {
                    id: data.id.toString(),
                    text: data.text,
                    sender: data.sender,
                    timestamp: new Date(data.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
                    translation,
                    tts_voice: data.tts_voice
                }];
            });
        };

        socket.onerror = (err) => {
            console.error("WebSocket error:", err);
            setIsThinking(false);
        };

        socket.onclose = () => console.log("WebSocket disconnected");

        socketRef.current = socket;
        return () => socket.close();
    }, [API_BASE]);

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
    }, [isTranslating]);

    // ── Send message ──────────────────────────────────────────────────────────
    const handleSendMessage = (textOverride?: string) => {
        const text = (textOverride ?? inputValue).trim();
        if (!text || !socketRef.current) return;

        // The backend will handle the translation to the target language.
        // User can type in ANY language — AI always responds in the selected language.
        socketRef.current.send(JSON.stringify({ sender: "user", text }));
        setInputValue("");
        setIsThinking(true);
    };

    // ── Translation ───────────────────────────────────────────────────────────
    const translateMessage = async (id: string, text: string) => {
        try {
            const res = await fetch(`${API_BASE}/translate`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ text, target_lang: "en" })
            });
            if (res.ok) {
                const data = await res.json();
                setMessages((prev: Message[]) =>
                    prev.map((m: Message) => m.id === id ? { ...m, translation: data.translatedText } : m)
                );
            }
        } catch (e) {
            console.error("translation failed", e);
        }
    };

    // ── TTS ───────────────────────────────────────────────────────────────────
    const playTTS = async (messageId: string, text: string, voice?: string) => {
        if (playingMessageId) return;
        setPlayingMessageId(messageId);
        try {
            const effectiveVoice = voice || LANG_DEFAULT_VOICE[langCode] || "Idera";
            const url = `${API_BASE}/tts?text=${encodeURIComponent(text)}&voice=${encodeURIComponent(effectiveVoice)}`;
            const audio = new Audio(url);
            audio.onended = () => setPlayingMessageId(null);
            audio.onerror = () => setPlayingMessageId(null);
            audio.play();
        } catch (e) {
            console.error("TTS setup failed", e);
            setPlayingMessageId(null);
        }
    };

    // ── Microphone (Speech Recognition) ──────────────────────────────────────
    const startListening = () => {
        setMicError(null);
        const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;

        if (!SpeechRecognition) {
            setMicError("Microphone not supported in this browser. Try Chrome.");
            return;
        }

        const recognition = new SpeechRecognition();

        // Accept speech in the selected language AND English so users can speak either
        // (browser will use the primary lang but still transcribe either)
        recognition.lang = SPEECH_LANG_MAP[langCode] || "en-US";
        recognition.interimResults = true;   // show live transcription
        recognition.maxAlternatives = 1;
        recognition.continuous = false;

        recognition.onstart = () => {
            setIsListening(true);
        };

        recognition.onresult = (event: any) => {
            let transcript = "";
            for (let i = event.resultIndex; i < event.results.length; i++) {
                transcript += event.results[i][0].transcript;
            }
            // Update input field live as user speaks
            setInputValue(transcript);
        };

        recognition.onend = () => {
            setIsListening(false);
            // Auto-send if there's content after mic stops
            const currentInput = inputValue;
            if (currentInput.trim()) {
                // Small delay so state updates before sending
                setTimeout(() => {
                    setInputValue((val) => {
                        if (val.trim()) {
                            handleSendMessage(val.trim());
                            return "";
                        }
                        return val;
                    });
                }, 300);
            }
        };

        recognition.onerror = (event: any) => {
            setIsListening(false);
            if (event.error === "not-allowed") {
                setMicError("Microphone access denied. Please allow mic access in your browser.");
            } else if (event.error === "no-speech") {
                setMicError("No speech detected. Try again.");
                setTimeout(() => setMicError(null), 3000);
            } else {
                setMicError(`Mic error: ${event.error}`);
                setTimeout(() => setMicError(null), 3000);
            }
        };

        recognitionRef.current = recognition;
        recognition.start();
    };

    const stopListening = () => {
        if (recognitionRef.current) {
            recognitionRef.current.stop();
        }
        setIsListening(false);
    };

    const handleMicClick = () => {
        if (isListening) {
            stopListening();
        } else {
            startListening();
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
                {/* Language hint */}
                {messages.length === 0 && !isThinking && (
                    <div className="text-center py-12">
                        <div className="w-16 h-16 bg-[#f8f0ff] rounded-2xl flex items-center justify-center mx-auto mb-4">
                            <span className="text-2xl font-bold text-[#9810fa]">{langCode.toUpperCase()}</span>
                        </div>
                        <p className="text-gray-500 text-sm">
                            You can type or speak in <span className="font-bold text-[#9810fa]">{selectedLanguage}</span> or any language.
                        </p>
                        <p className="text-gray-400 text-xs mt-1">
                            The AI will always reply in <span className="font-semibold">{selectedLanguage}</span>.
                        </p>
                    </div>
                )}

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

                    {/* Mic error */}
                    {micError && (
                        <div className="mb-2 text-xs text-red-500 bg-red-50 border border-red-100 rounded-xl px-3 py-2 text-center">
                            {micError}
                        </div>
                    )}

                    {/* Listening indicator */}
                    {isListening && (
                        <div className="mb-2 flex items-center justify-center gap-2 text-xs text-[#9810fa] font-semibold">
                            <span className="w-2 h-2 bg-[#9810fa] rounded-full animate-pulse" />
                            Listening... speak now
                        </div>
                    )}

                    <div className="bg-[#fcfaff] border border-gray-100 rounded-2xl px-2 py-2 flex items-center gap-2 focus-within:ring-2 focus-within:ring-[#9810fa]/10 focus-within:border-[#9810fa]/30 transition-all">

                        {/* Mic button */}
                        <button
                            onClick={handleMicClick}
                            disabled={!micSupported}
                            title={!micSupported ? "Microphone not supported in this browser" : isListening ? "Stop recording" : "Start recording"}
                            className={`p-3 rounded-xl transition-all ${isListening
                                ? 'bg-red-500 text-white shadow-lg shadow-red-500/30 animate-pulse'
                                : micSupported
                                    ? 'hover:bg-white hover:shadow-sm text-gray-400 hover:text-[#9810fa]'
                                    : 'text-gray-200 cursor-not-allowed'
                                }`}
                        >
                            {isListening ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
                        </button>

                        <input
                            type="text"
                            placeholder={isListening ? "Listening..." : `Type in ${selectedLanguage} or any language...`}
                            value={inputValue}
                            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInputValue(e.target.value)}
                            onKeyPress={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSendMessage()}
                            className="flex-1 min-w-0 bg-transparent border-none outline-none text-sm md:text-base text-gray-700 px-2 py-1 placeholder:text-gray-400"
                        />

                        <button
                            onClick={() => handleSendMessage()}
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
                        Type or speak in any language — AI always replies in <span className="font-bold">{selectedLanguage}</span>
                    </p>
                </div>
            </footer>
        </div>
    );
};

export default PracticeChat;