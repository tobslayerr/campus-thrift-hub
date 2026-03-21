/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, ShieldAlert, AlertTriangle } from 'lucide-react';

export default function ChatRoom() {
    const { id: targetUserId } = useParams(); 
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product'); 
    
    const { user } = useAuthStore();
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [targetUser, setTargetUser] = useState(null);
    const messagesEndRef = useRef(null);

    // Auto-scroll ke pesan terbaru
    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    // Ambil data lawan bicara
    useEffect(() => {
        const fetchTargetUser = async () => {
            try {
                const response = await api.get(`/users/seller/${targetUserId}`);
                setTargetUser(response.data.data.profile);
            } catch (error) {
                console.error("Gagal memuat profil lawan bicara");
                toast.error("Gagal memuat profil pengguna.");
            }
        };
        fetchTargetUser();
    }, [targetUserId]);

    // Ambil pesan & Polling setiap 2 detik (Efek Real-Time)
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/chat/${targetUserId}`);
                setMessages(response.data.data);
            } catch (error) {
                console.error("Gagal mengambil pesan");
            }
        };

        fetchMessages(); 
        const interval = setInterval(fetchMessages, 2000); 
        
        return () => clearInterval(interval); 
    }, [targetUserId]);

    // Scroll ke bawah setiap kali ada pesan baru
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const textToSend = inputText;
        setInputText(''); // Kosongkan input seketika agar UX terasa instan

        try {
            await api.post('/messages', {
                receiverId: targetUserId,
                productId: productId || null,
                text: textToSend
            });
            // Pesan akan otomatis muncul di layar berkat interval polling
        } catch (error) {
            toast.error('Gagal mengirim pesan. Periksa koneksi Anda.');
            setInputText(textToSend); // Kembalikan teks jika gagal
        }
    };

    if (!targetUser) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-6 h-[calc(100vh-80px)] md:h-[90vh] flex flex-col">
            
            {/* --- HEADER CHAT --- */}
            <div className="bg-white p-4 rounded-t-[2rem] border border-slate-100 shadow-sm flex items-center gap-4 z-10">
                <button 
                    onClick={() => navigate(-1)} 
                    className="p-2 text-slate-400 hover:text-[#00478F] hover:bg-slate-50 rounded-full transition-colors"
                >
                    <ArrowLeft size={24} />
                </button>
                <div className="relative">
                    <img 
                        src={targetUser.profilePicture || `https://ui-avatars.com/api/?name=${targetUser.name || 'User'}&background=f1f5f9&color=00478F`} 
                        alt={targetUser.name} 
                        className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100" 
                    />
                    <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>
                </div>
                <div>
                    <h2 className="font-black text-slate-900 text-lg leading-tight">{targetUser.name}</h2>
                    <p className="text-xs text-green-500 font-bold tracking-wide">
                        Online
                    </p>
                </div>
            </div>

            {/* --- AREA PESAN --- */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-6 border-x border-slate-100 flex flex-col gap-4 no-scrollbar shadow-inner">
                
                {/* Peringatan Keamanan Escrow */}
                <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500] p-4 rounded-2xl flex items-start gap-3 shadow-sm mx-auto max-w-[90%] md:max-w-[80%] mb-4">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm font-bold leading-relaxed">
                        <strong className="font-black uppercase tracking-wider block mb-1">Keamanan Escrow</strong>
                        Dilarang membagikan nomor WhatsApp atau Rekening pribadi. Sistem akan menyensor pesan yang mengandung nomor telepon demi keamanan transaksi Anda.
                    </p>
                </div>

                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100">
                            <Send size={32} className="text-slate-300 ml-1" />
                        </div>
                        <p className="font-bold">Belum ada pesan.</p>
                        <p className="text-sm font-medium">Sapa penjual untuk memulai negosiasi!</p>
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        const isMe = msg.senderId === user?.id || msg.senderId === user?._id;
                        const isCensored = msg.text.includes('DISENSOR');

                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] md:max-w-[70%] px-5 py-3 text-[15px] leading-relaxed shadow-sm relative ${
                                    isMe 
                                        ? 'bg-[#00478F] text-white rounded-[1.5rem] rounded-tr-sm' 
                                        : 'bg-white border border-slate-100 text-slate-800 rounded-[1.5rem] rounded-tl-sm'
                                }`}>
                                    {isCensored ? (
                                        <span className={`font-bold flex items-center gap-2 ${isMe ? 'text-red-300' : 'text-red-500'}`}>
                                            <AlertTriangle size={16} className="shrink-0" />
                                            {msg.text}
                                        </span>
                                    ) : (
                                        msg.text
                                    )}
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* --- INPUT FORM --- */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-b-[2rem] border border-slate-100 shadow-sm flex items-end gap-3 z-10">
                <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl flex items-center px-2 focus-within:border-[#00478F] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-900/5 transition-all">
                    <input 
                        type="text" 
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Ketik pesan..." 
                        className="w-full px-4 py-3.5 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                        autoComplete="off"
                    />
                </div>
                <button 
                    type="submit" 
                    disabled={!inputText.trim()}
                    className="w-14 h-14 bg-[#FF9500] text-white rounded-full flex items-center justify-center hover:bg-[#00478F] transition-all shadow-lg shadow-orange-900/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
                >
                    <Send size={20} className="ml-1" />
                </button>
            </form>
        </div>
    );
}