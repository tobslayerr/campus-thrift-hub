import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function ChatList() {
    const [conversations, setConversations] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchConversations = async () => {
            try {
                const response = await api.get('/messages/conversations');
                setConversations(response.data.data);
            } catch (error) {
                console.error("Gagal memuat pesan", error);
            } finally {
                setLoading(false);
            }
        };
        fetchConversations();
    }, []);

    if (loading) return <div className="text-center mt-20 font-bold">Memuat Kotak Masuk...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20 min-h-[80vh]">
            <h1 className="text-3xl font-black text-gray-900 mb-8 flex items-center gap-3">
                <span>💬</span> Kotak Masuk
            </h1>

            <div className="bg-white rounded-3xl shadow-sm border border-gray-100 overflow-hidden">
                {conversations.length === 0 ? (
                    <div className="p-12 text-center text-gray-400 font-bold">
                        Anda belum memiliki obrolan dengan siapapun.
                    </div>
                ) : (
                    <div className="divide-y divide-gray-100">
                        {conversations.map((conv, index) => (
                            <Link 
                                key={index} 
                                to={`/chat/${conv.user._id}`}
                                className="flex items-center gap-4 p-5 hover:bg-gray-50 transition group"
                            >
                                <img 
                                    src={conv.user.profilePicture || 'https://via.placeholder.com/150'} 
                                    alt={conv.user.name} 
                                    className="w-14 h-14 rounded-full object-cover border border-gray-200 group-hover:border-brand-yellow transition"
                                />
                                <div className="flex-1 min-w-0">
                                    <h4 className="font-black text-gray-900 text-lg group-hover:text-brand-yellow transition">
                                        {conv.user.name}
                                    </h4>
                                    <p className="text-gray-500 text-sm truncate pr-4 font-medium">
                                        {conv.lastMessage}
                                    </p>
                                </div>
                                <div className="text-xs text-gray-400 font-bold">
                                    {new Date(conv.updatedAt).toLocaleDateString('id-ID', { hour: '2-digit', minute:'2-digit' })}
                                </div>
                            </Link>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}