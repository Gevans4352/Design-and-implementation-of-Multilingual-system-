import { useState, useEffect } from 'react';
import { Search, Plus, Edit2, Trash2, LogOut, Sparkles } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import WelcomeModal from '../Component/WelcomeModal';

const Dashboard = () => {
    const [showWelcome, setShowWelcome] = useState(false);
    const [conversations, setConversations] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null);
    const [confirmId, setConfirmId] = useState<string | null>(null);
    const navigate = useNavigate();

    useEffect(() => {
        // Show welcome modal for "new" users (simulated)
        const hasSeenWelcome = localStorage.getItem('hasSeenWelcome');
        if (!hasSeenWelcome) {
            setShowWelcome(true);
        }

        fetchConversations();
    }, []);

    const fetchConversations = async () => {
        const userStr = localStorage.getItem("user");
        if (!userStr) return;
        const user = JSON.parse(userStr);

        try {
            const response = await fetch(`http://127.0.0.1:8000/conversations/${user.id}`);
            if (response.ok) {
                const data = await response.json();
                setConversations(data);
            }
        } catch (err) {
            console.error("Failed to fetch conversations:", err);
        } finally {
            setLoading(false);
        }
    };

    const handleCloseWelcome = () => {
        setShowWelcome(false);
        localStorage.setItem('hasSeenWelcome', 'true');
    };

    const showToast = (message: string, type: 'success' | 'error' = 'success') => {
        setToast({ message, type });
        setTimeout(() => setToast(null), 3000);
    };

    const handleCreateNew = () => {
        navigate('/select-language');
    };

    const handleDeleteConversation = async (conversationId: string) => {
        setConfirmId(null);

        try {
            const response = await fetch(`http://127.0.0.1:8000/conversations/${conversationId}`, {
                method: "DELETE",
            });

            if (response.ok) {
                // Remove from local state
                setConversations(prev => prev.filter(c => c.id !== conversationId));
                showToast("Conversation deleted successfully");
            } else {
                showToast("Failed to delete. Please restart your backend server!", "error");
            }
        } catch (err) {
            console.error("Delete failed:", err);
            showToast("Could not connect to the server", "error");
        }
    };

    return (
        <div className="min-h-screen bg-[#fdfaff] relative">
            {/* Toast Notification */}
            {toast && (
                <div className={`fixed top-6 left-1/2 -translate-x-1/2 z-100 px-6 py-3 rounded-2xl shadow-2xl border transition-all animate-in fade-in slide-in-from-top-4 ${toast.type === 'success'
                        ? 'bg-white border-green-100 text-green-600'
                        : 'bg-white border-red-100 text-red-600'
                    }`}>
                    <div className="flex items-center gap-3 font-bold">
                        {toast.type === 'success' ? <Sparkles className="w-5 h-5" /> : <Plus className="w-5 h-5 rotate-45" />}
                        {toast.message}
                    </div>
                </div>
            )}

            {/* Custom Confirmation Modal */}
            {confirmId && (
                <div className="fixed inset-0 bg-gray-900/20 backdrop-blur-sm z-100 flex items-center justify-center p-4">
                    <div className="bg-white rounded-3xl p-8 max-w-sm w-full shadow-2xl border border-gray-100 scale-in-95 animate-in fade-in duration-200">
                        <h3 className="text-xl font-bold text-gray-900 mb-2">Delete Conversation?</h3>
                        <p className="text-gray-500 mb-8 leading-relaxed">This action cannot be undone. All your messages in this session will be permanently deleted.</p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setConfirmId(null)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold text-gray-500 hover:bg-gray-50 transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => handleDeleteConversation(confirmId)}
                                className="flex-1 py-3 px-4 rounded-xl font-bold bg-red-500 text-white hover:bg-red-600 shadow-lg shadow-red-500/30 transition-all active:scale-95"
                            >
                                Delete
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Dashboard Nav */}
            <nav className="flex items-center justify-between px-10 py-4 bg-white border-b border-gray-100">
                <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-[#f3e8ff] flex items-center justify-center">
                        <Sparkles className="w-5 h-5 text-[#9810fa]" />
                    </div>
                    <span className="text-xl font-bold text-gray-900">FluentRoot</span>
                </div>
                <button
                    onClick={() => navigate('/')}
                    className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
                >
                    <LogOut className="w-4 h-4" />
                    <span>Logout</span>
                </button>
            </nav>

            <main className="max-w-4xl mx-auto py-12 px-6">
                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">My Conversations</h1>
                    <p className="text-gray-500">Continue your language learning journey</p>
                </div>

                <div className="relative mb-8">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 w-5 h-5" />
                    <input
                        type="text"
                        placeholder="Search conversations..."
                        className="w-full bg-gray-50 border border-gray-100 rounded-xl py-4 pl-12 pr-4 focus:outline-none focus:ring-2 focus:ring-[#9810fa]/20 transition-all"
                    />
                </div>

                <div className="space-y-4">
                    {loading ? (
                        <div className="text-center py-20 text-gray-400">Loading your conversations...</div>
                    ) : conversations.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-3xl border-2 border-dashed border-gray-100 italic text-gray-400">
                            No conversations yet. Start one by clicking the + button!
                        </div>
                    ) : (
                        conversations.map((conv) => (
                            <div
                                key={conv.id}
                                onClick={() => {
                                    localStorage.setItem("currentConversationId", conv.id);
                                    navigate("/practice");
                                }}
                                className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all group cursor-pointer relative"
                            >
                                <div className="flex items-start justify-between">
                                    <div className="flex gap-4">
                                        <div className="w-12 h-12 rounded-xl bg-gray-50 flex items-center justify-center font-bold text-gray-600 uppercase">
                                            {conv.language.substring(0, 2)}
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-gray-900 text-lg group-hover:text-[#9810fa] transition-colors">
                                                {conv.language} {conv.topic}
                                            </h3>
                                            <p className="text-gray-500 italic mb-2">{conv.last_message || "Start practicing..."}</p>
                                            <span className="text-xs text-gray-400">
                                                {new Date(conv.updated_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                        <button className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-gray-600 transition-colors">
                                            <Edit2 className="w-4 h-4" />
                                        </button>
                                        <button
                                            onClick={(e) => {
                                                e.stopPropagation();
                                                setConfirmId(conv.id);
                                            }}
                                            className="p-2 hover:bg-gray-50 rounded-lg text-gray-400 hover:text-red-500 transition-colors"
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </button>
                                    </div>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            </main>

            <button
                onClick={handleCreateNew}
                className="fixed bottom-10 right-10 w-16 h-16 bg-[#9810fa] text-white rounded-full flex items-center justify-center shadow-2xl hover:bg-[#8000de] transition-all hover:scale-110 active:scale-95"
            >
                <Plus className="w-8 h-8" />
            </button>

            <WelcomeModal
                isOpen={showWelcome}
                onClose={handleCloseWelcome}
                onNext={handleCloseWelcome}
            />
        </div>
    );
};

export default Dashboard;
