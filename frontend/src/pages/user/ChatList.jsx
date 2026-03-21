import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import { MessageSquare, ChevronRight, Clock, ShieldAlert } from 'lucide-react';

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

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            <div className="max-w-4xl mx-auto p-4 md:p-8 pt-10">
                
                {/* --- HEADER --- */}
                <div className="mb-10">
                    <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 flex items-center gap-4 tracking-tight">
                        <div className="w-14 h-14 bg-[#00478F]/10 rounded-2xl flex items-center justify-center text-[#00478F]">
                            <MessageSquare size={28} strokeWidth={2.5} />
                        </div>
                        Kotak Masuk
                    </h1>
                    <p className="text-slate-500 font-medium ml-0 md:ml-[4.5rem]">Pesan dan negosiasi Anda dengan pengguna lain.</p>
                </div>

                {/* --- LIST CONTAINER --- */}
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    
                    {conversations.length === 0 ? (
                        <div className="p-16 text-center flex flex-col items-center">
                            <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mb-6">
                                <MessageSquare size={40} className="text-slate-300" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 mb-2">Belum ada obrolan</h3>
                            <p className="text-slate-400 font-medium">Mulai cari barang dan hubungi penjual untuk bernegosiasi.</p>
                            <Link to="/" className="mt-8 px-8 py-3 bg-[#00478F] text-white font-black rounded-xl hover:bg-[#FF9500] transition-colors shadow-lg shadow-blue-900/20 active:scale-95">
                                Eksplorasi Barang
                            </Link>
                        </div>
                    ) : (
                        <div className="divide-y divide-slate-50">
                            {conversations.map((conv, index) => {
                                const opponent = conv.user || {};
                                const isUnread = !conv.isRead;
                                const isBanned = opponent.isBanned;
                                
                                // Format Waktu
                                const dateObj = new Date(conv.updatedAt);
                                const timeString = dateObj.toLocaleTimeString('id-ID', { hour: '2-digit', minute:'2-digit' });
                                const dateString = dateObj.toLocaleDateString('id-ID', { day:'numeric', month:'short' });

                                return (
                                    <Link 
                                        key={index} 
                                        to={`/chat/${opponent._id}`}
                                        className={`flex items-center gap-4 p-6 transition-all duration-300 group relative ${isUnread ? 'bg-blue-50/30' : 'hover:bg-slate-50'}`}
                                    >
                                        {/* UNREAD INDICATOR */}
                                        {isUnread && (
                                            <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#FF9500]"></div>
                                        )}

                                        {/* AVATAR */}
                                        <div className="relative shrink-0">
                                            <img 
                                                src={opponent.profilePicture || `https://ui-avatars.com/api/?name=${opponent.name || 'User'}&background=f1f5f9&color=00478F`} 
                                                alt={opponent.name} 
                                                className={`w-16 h-16 rounded-full object-cover border-2 border-transparent group-hover:border-[#FF9500] transition-colors ${isBanned ? 'grayscale opacity-50' : ''}`}
                                            />
                                            {!isBanned && <div className="absolute bottom-1 right-1 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                                            {isBanned && <div className="absolute bottom-1 right-1 w-5 h-5 bg-red-500 border-2 border-white rounded-full flex items-center justify-center"><ShieldAlert size={10} className="text-white" /></div>}
                                        </div>

                                        {/* CHAT INFO */}
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-baseline mb-1">
                                                <h4 className={`text-lg transition-colors truncate pr-4 ${isUnread ? 'font-black text-[#00478F]' : 'font-bold text-slate-900 group-hover:text-[#00478F]'}`}>
                                                    {isBanned ? (
                                                        <span className="text-red-500 flex items-center gap-1 italic opacity-70">Banned User</span>
                                                    ) : (
                                                        opponent.name || 'User Tidak Diketahui'
                                                    )}
                                                </h4>
                                                <span className={`shrink-0 text-xs flex items-center gap-1 ${isUnread ? 'font-black text-[#FF9500]' : 'font-bold text-slate-400'}`}>
                                                    {dateString} <span className="text-[10px] text-slate-300">•</span> {timeString}
                                                </span>
                                            </div>
                                            <p className={`text-sm truncate transition-colors ${isUnread ? 'font-black text-slate-800' : 'font-medium text-slate-500 group-hover:text-slate-700'}`}>
                                                {conv.lastMessage || 'Mengirim lampiran...'}
                                            </p>
                                        </div>

                                        {/* CHEVRON ICON */}
                                        <div className="shrink-0 ml-2">
                                            <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-all border border-transparent ${isUnread ? 'bg-white text-[#FF9500] shadow-sm border-slate-100' : 'text-slate-300 group-hover:bg-white group-hover:text-[#FF9500] group-hover:shadow-sm group-hover:border-slate-100'}`}>
                                                <ChevronRight size={20} />
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}