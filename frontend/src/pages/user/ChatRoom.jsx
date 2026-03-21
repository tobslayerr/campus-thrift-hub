/* eslint-disable react-hooks/purity */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, ShieldAlert, AlertTriangle, X, CheckCheck } from 'lucide-react';

export default function ChatRoom() {
    const { id: targetUserId } = useParams(); 
    const [searchParams] = useSearchParams();
    const productIdQuery = searchParams.get('product'); 
    
    const { user } = useAuthStore();
    const myId = user?.id || user?._id;
    const navigate = useNavigate();
    
    const [messages, setMessages] = useState([]);
    const [inputText, setInputText] = useState('');
    const [targetUser, setTargetUser] = useState(null);
    
    const [isTargetTyping, setIsTargetTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const messagesEndRef = useRef(null);

    const [linkedProduct, setLinkedProduct] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await api.get(`/users/seller/${targetUserId}`);
                setTargetUser(response.data.data?.profile || response.data.data);

                if (productIdQuery) {
                    const resProduct = await api.get(`/products/${productIdQuery}`);
                    setLinkedProduct(resProduct.data.data);
                    setInputText(`Halo kak, saya ingin bertanya tentang produk "${resProduct.data.data.title}" ini.`);
                }
            } catch (error) {
                console.error("Gagal memuat data awal:", error);
            }
        };
        if (targetUserId) fetchInitialData();
    }, [targetUserId, productIdQuery]);

    useEffect(() => {
        const fetchMessages = async () => {
            try {
                const response = await api.get(`/messages/chat/${targetUserId}`);
                const fetchedMessages = response.data.data || response.data;
                
                if (Array.isArray(fetchedMessages)) setMessages(fetchedMessages);
                setIsTargetTyping(response.data.isTyping || false);
            } catch (error) {
                console.error("Gagal mengambil pesan:", error);
            }
        };

        fetchMessages(); 
        const interval = setInterval(fetchMessages, 2000); 
        return () => clearInterval(interval); 
    }, [targetUserId]);

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const getOnlineStatus = (lastActive) => {
        if (!lastActive) return 'Offline';
        const diffMs = Date.now() - new Date(lastActive).getTime();
        const diffMins = Math.floor(diffMs / 60000);
        if (diffMins < 5) return 'Online';
        if (diffMins < 60) return `Aktif ${diffMins} menit yang lalu`;
        const diffHours = Math.floor(diffMins / 60);
        if (diffHours < 24) return `Aktif ${diffHours} jam yang lalu`;
        return `Aktif ${Math.floor(diffHours / 24)} hari yang lalu`;
    };

    // =======================================================
    // REGEX FRONTEND BARU: LOGIKA TWO-FACTOR LEBIH KETAT
    // =======================================================
    const isSuspicious = (text) => {
        const t = text.toLowerCase();
        
        const phoneRegex = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/g;
        
        // Deteksi Dua Faktor (Bank + Angka)
        const hasFiveDigits = /(\d[\s\-\.,]*){5,}/.test(t);
        const hasBankKeyword = /\b(rek|rekening|norek|bca|bni|bri|mandiri|bsi|cimb|danamon|permata|mega|bjb|gopay|gpay|dana|ovo|shopeepay|spay|linkaja)\b/i.test(t);

        if (hasBankKeyword && hasFiveDigits) return true;

        const forbiddenPatterns = [
            /\b(pindah|lanjut|lewat|chat|hubungi)\s*(aja\s*)?(ke|di|via)?\s*(wa|whatsapp|w a|ig|instagram|tele|telegram|line)\b/i,
            /\b(ini|ni|nih|nomor|no)\s*(wa|whatsapp|w a|watsap)\b/i,
            /\b(wa|whatsapp|w a|w\.a|watsap|wea)\b/i,
            /\b(shopee|tokopedia|lazada|bukalapak|tiktok)\b/i
        ];
        
        return phoneRegex.test(t) || forbiddenPatterns.some(pattern => pattern.test(t));
    };

    const handleInputChange = (e) => {
        setInputText(e.target.value);
        api.post('/messages/typing', { receiverId: targetUserId, isTyping: true }).catch(() => {});
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            api.post('/messages/typing', { receiverId: targetUserId, isTyping: false }).catch(() => {});
        }, 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const textToSend = inputText;
        const productObjToSend = linkedProduct; 
        const productIdToSend = linkedProduct?._id || null;

        // CEK REGEX FRONTEND
        if (isSuspicious(textToSend)) {
            setShowWarningModal(true);
            return;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        api.post('/messages/typing', { receiverId: targetUserId, isTyping: false }).catch(() => {});

        const tempMessage = {
            _id: `temp-${Date.now()}`,
            senderId: myId,
            receiverId: targetUserId,
            text: textToSend,
            message: textToSend,
            productId: productObjToSend, 
            isRead: false,
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, tempMessage]);
        setInputText(''); 
        setLinkedProduct(null);

        try {
            await api.post('/messages', {
                receiverId: targetUserId,
                productId: productIdToSend,
                text: textToSend,
                message: textToSend 
            });
        } catch (error) {
            setMessages((prev) => prev.filter(m => m._id !== tempMessage._id));
            setInputText(textToSend);
            if (productObjToSend) setLinkedProduct(productObjToSend);

            if (error.response?.status === 403) {
                setShowWarningModal(true);
            } else {
                toast.error('Gagal mengirim pesan.');
            }
        }
    };

    if (!targetUser) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );

    const statusOnline = getOnlineStatus(targetUser.lastActive);
    const isOnlineNow = statusOnline === 'Online';

    return (
        <div className="max-w-3xl mx-auto p-0 md:p-6 h-[100dvh] md:h-[90vh] flex flex-col relative bg-white md:bg-transparent">
            
            {/* HEADER CHAT */}
            <div className="bg-white p-4 md:rounded-t-[2rem] border-b md:border border-slate-100 shadow-sm flex items-center gap-4 z-10">
                <button onClick={() => navigate(-1)} className="p-2 text-slate-400 hover:text-[#00478F] hover:bg-slate-50 rounded-full transition-colors">
                    <ArrowLeft size={24} />
                </button>
                <div className="relative">
                    <img src={targetUser.profilePicture || `https://ui-avatars.com/api/?name=${targetUser.name || 'User'}&background=f1f5f9&color=00478F`} alt={targetUser.name} className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100" />
                    {isOnlineNow && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                </div>
                <div className="flex flex-col justify-center h-full">
                    <h2 className="font-black text-slate-900 text-lg leading-tight">{targetUser.name}</h2>
                    {isTargetTyping ? (
                        <p className="text-xs font-bold text-[#00478F] animate-pulse">Sedang mengetik...</p>
                    ) : (
                        <p className={`text-xs font-bold tracking-wide ${isOnlineNow ? 'text-green-500' : 'text-slate-400'}`}>{statusOnline}</p>
                    )}
                </div>
            </div>

            {/* AREA PESAN */}
            <div className="flex-1 bg-slate-50 overflow-y-auto p-4 md:p-6 md:border-x border-slate-100 flex flex-col gap-4 no-scrollbar">
                
                <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500] p-4 rounded-2xl flex items-start gap-3 shadow-sm mx-auto max-w-[90%] md:max-w-[80%] mb-4">
                    <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                    <p className="text-xs md:text-sm font-bold leading-relaxed">
                        <strong className="font-black uppercase tracking-wider block mb-1">Keamanan Escrow</strong>
                        Dilarang membagikan nomor WhatsApp atau Rekening pribadi. Pesan akan terblokir otomatis.
                    </p>
                </div>

                {messages.length === 0 ? (
                    <div className="flex-1 flex flex-col justify-center items-center text-slate-400">
                        <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-100"><Send size={32} className="text-slate-300 ml-1" /></div>
                        <p className="font-bold">Belum ada pesan.</p>
                        <p className="text-sm font-medium">Sapa penjual untuk memulai negosiasi!</p>
                    </div>
                ) : (
                    messages.map((msg) => {
                        const rawSender = msg.senderId || msg.sender; 
                        const msgSenderId = typeof rawSender === 'object' ? rawSender?._id : rawSender;
                        const isMe = String(msgSenderId) === String(myId);
                        const textContent = msg.text || msg.message || "";
                        const prod = msg.productId || msg.product;
                        const isReadStatus = msg.isRead;

                        return (
                            // eslint-disable-next-line react-hooks/purity
                            <div key={msg._id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[80%] md:max-w-[70%] px-5 py-3 text-[15px] leading-relaxed shadow-sm relative ${isMe ? 'bg-[#00478F] text-white rounded-[1.5rem] rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-[1.5rem] rounded-tl-sm'}`}>
                                    
                                    {prod && (
                                        <Link to={`/product/${prod._id || prod}`} className={`block mb-3 p-3 rounded-xl border transition-colors ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                            <div className="flex items-center gap-3">
                                                <img src={(prod.images && prod.images.length > 0) ? prod.images[0] : (prod.imageUrl || 'https://via.placeholder.com/150')} alt="Produk" className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200" />
                                                <div className="overflow-hidden">
                                                    <p className={`text-xs font-black truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>{prod.title || 'Barang Dihapus'}</p>
                                                    <p className={`text-xs font-bold mt-0.5 ${isMe ? 'text-blue-200' : 'text-[#00478F]'}`}>Rp{prod.price?.toLocaleString('id-ID') || 0}</p>
                                                </div>
                                            </div>
                                        </Link>
                                    )}

                                    <p className="whitespace-pre-wrap">{textContent}</p>
                                    
                                    <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'text-blue-200 justify-end' : 'text-slate-400'}`}>
                                        {new Date(msg.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                        {isMe && <CheckCheck size={14} className={isReadStatus ? "text-green-300" : "text-blue-300/50"} />}
                                    </div>
                                </div>
                            </div>
                        );
                    })
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* INPUT FORM BAWAH */}
            <div className="bg-white p-4 md:rounded-b-[2rem] border-t md:border border-slate-100 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-10">
                
                {linkedProduct && (
                    <div className="mb-3 p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between relative animate-in slide-in-from-bottom-4 shadow-sm">
                        <div className="flex items-center gap-3">
                            <img src={(linkedProduct.images && linkedProduct.images.length > 0) ? linkedProduct.images[0] : linkedProduct.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200" alt="Produk" />
                            <div>
                                <p className="text-xs font-black text-slate-800 line-clamp-1">{linkedProduct.title}</p>
                                <p className="text-xs font-bold text-[#00478F]">Rp{linkedProduct.price.toLocaleString('id-ID')}</p>
                            </div>
                        </div>
                        <button type="button" onClick={() => { setLinkedProduct(null); setInputText(''); }} className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-full shadow-sm border border-slate-200 hover:scale-110 transition-all">
                            <X size={14}/>
                        </button>
                    </div>
                )}

                <form onSubmit={handleSendMessage} className="flex items-end gap-3">
                    <div className="flex-1 bg-slate-50 border border-slate-200 rounded-3xl flex items-center px-2 focus-within:border-[#00478F] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-900/5 transition-all">
                        <input 
                            type="text" 
                            value={inputText}
                            onChange={handleInputChange} 
                            placeholder="Ketik pesan dengan aman..." 
                            className="w-full px-4 py-3.5 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400"
                            autoComplete="off"
                        />
                    </div>
                    <button type="submit" disabled={!inputText.trim()} className="w-14 h-14 bg-[#FF9500] text-white rounded-full flex items-center justify-center hover:bg-[#00478F] transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                        <Send size={20} className="ml-1" />
                    </button>
                </form>
            </div>

            {/* MODAL PERINGATAN BLOKIR */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl animate-in zoom-in-95 duration-200 border-4 border-red-500">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                            <AlertTriangle size={48} strokeWidth={2.5} />
                        </div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Pesan Diblokir!</h2>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">
                            Sistem mendeteksi Anda mencoba mengirim <b>Nomor HP, Rekening, atau Link Platform Lain</b>.
                            <br/><br/>
                            Demi keamanan, seluruh transaksi <b>WAJIB</b> diselesaikan di dalam platform Escrow Campus Thrift Hub.
                        </p>
                        <button type="button" onClick={() => setShowWarningModal(false)} className="w-full py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest text-xs shadow-lg shadow-red-500/30">
                            Saya Mengerti
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}