import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, ShieldAlert, AlertTriangle, X, CheckCheck, Flag, ImagePlus, ShieldOff } from 'lucide-react';

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
    
    // REFS UNTUK SMART SCROLL
    const messagesEndRef = useRef(null);
    const chatContainerRef = useRef(null);
    const isAutoScrollActive = useRef(true);

    const [linkedProduct, setLinkedProduct] = useState(null);
    const [showWarningModal, setShowWarningModal] = useState(false);

    // STATE SISTEM LAPORAN PENGGUNA
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ title: '', description: '', evidenceImage: null });
    const [reportPreview, setReportPreview] = useState(null);
    const [submittingReport, setSubmittingReport] = useState(false);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleScroll = () => {
        if (chatContainerRef.current) {
            const { scrollTop, scrollHeight, clientHeight } = chatContainerRef.current;
            const isAtBottom = scrollHeight - scrollTop - clientHeight < 150;
            isAutoScrollActive.current = isAtBottom;
        }
    };

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const response = await api.get(`/users/seller/${targetUserId}`);
                const profile = response.data.data?.profile || response.data.data;
                setTargetUser(profile);

                if (productIdQuery && !profile.isBanned) {
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
        if (isAutoScrollActive.current) {
            scrollToBottom();
        }
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

    const isSuspicious = (text) => {
        const t = text.toLowerCase();
        const phoneRegex = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/g;
        const hasFiveDigits = /(\d[\s\-\\.,]*){5,}/.test(t);
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
        if (targetUser?.isBanned) return;
        api.post('/messages/typing', { receiverId: targetUserId, isTyping: true }).catch(() => {});
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(() => {
            api.post('/messages/typing', { receiverId: targetUserId, isTyping: false }).catch(() => {});
        }, 2000);
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim() || targetUser?.isBanned) return;

        const textToSend = inputText;
        if (isSuspicious(textToSend)) {
            setShowWarningModal(true);
            return;
        }

        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        api.post('/messages/typing', { receiverId: targetUserId, isTyping: false }).catch(() => {});
        isAutoScrollActive.current = true;

        const tempMessage = {
            _id: `temp-${Date.now()}`,
            senderId: myId,
            receiverId: targetUserId,
            text: textToSend,
            message: textToSend,
            productId: linkedProduct, 
            isRead: false,
            createdAt: new Date().toISOString()
        };

        setMessages((prev) => [...prev, tempMessage]);
        setInputText(''); 
        setLinkedProduct(null);
        setTimeout(scrollToBottom, 100);

        try {
            await api.post('/messages', {
                receiverId: targetUserId,
                productId: tempMessage.productId?._id || null,
                text: textToSend,
                message: textToSend 
            });
        } catch (error) {
            setMessages((prev) => prev.filter(m => m._id !== tempMessage._id));
            setInputText(textToSend);
            if (tempMessage.productId) setLinkedProduct(tempMessage.productId);
            if (error.response?.status === 403) setShowWarningModal(true);
            else toast.error('Gagal mengirim pesan.');
        }
    };

    const handleReportImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReportForm({ ...reportForm, evidenceImage: file });
            setReportPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportForm.title || !reportForm.description) return toast.error("Harap isi semua kolom!");
        if (!reportForm.evidenceImage) return toast.error("Harap lampirkan bukti foto!");
        setSubmittingReport(true);
        const toastId = toast.loading("Mengirim laporan ke Admin...");
        const formData = new FormData();
        formData.append('reportedUserId', targetUserId);
        formData.append('title', reportForm.title);
        formData.append('description', reportForm.description);
        formData.append('evidenceImage', reportForm.evidenceImage);
        try {
            await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("Laporan berhasil dikirim!", { id: toastId });
            setShowReportModal(false);
            setReportForm({ title: '', description: '', evidenceImage: null });
            setReportPreview(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mengirim laporan", { id: toastId });
        } finally {
            setSubmittingReport(false);
        }
    };

    if (!targetUser) return (
        <div className="flex justify-center items-center h-[calc(100vh-64px)]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );

    const statusOnline = getOnlineStatus(targetUser.lastActive);
    const isOnlineNow = statusOnline === 'Online';
    const isBanned = targetUser.isBanned;

    return (
        <div className="w-full flex flex-col h-[calc(100dvh-64px)] md:h-[calc(100vh-76px)] bg-[#F8FAFC]">
            
            {/* HEADER CHAT */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 shadow-sm flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-4">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-[#00478F] hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className={`relative ${!isBanned ? 'cursor-pointer' : ''}`} onClick={() => !isBanned && navigate(`/seller/${targetUser._id}`)}>
                        <img src={targetUser.profilePicture || `https://ui-avatars.com/api/?name=${targetUser.name || 'User'}&background=f1f5f9&color=00478F`} alt={targetUser.name} className={`w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 ${isBanned ? 'grayscale opacity-50' : ''}`} />
                        {isOnlineNow && !isBanned && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                    </div>
                    <div className={`flex flex-col justify-center h-full ${!isBanned ? 'cursor-pointer' : ''}`} onClick={() => !isBanned && navigate(`/seller/${targetUser._id}`)}>
                        <h2 className="font-black text-slate-900 text-base leading-tight">
                            {isBanned ? (
                                <span className="text-red-500 flex items-center gap-1 italic opacity-70">Banned User</span>
                            ) : (
                                <span className="hover:text-[#00478F] transition-colors">{targetUser.name}</span>
                            )}
                        </h2>
                        {!isBanned && (
                            isTargetTyping ? (
                                <p className="text-xs font-bold text-[#00478F] animate-pulse">Sedang mengetik...</p>
                            ) : (
                                <p className={`text-xs font-bold tracking-wide ${isOnlineNow ? 'text-green-500' : 'text-slate-400'}`}>{statusOnline}</p>
                            )
                        )}
                    </div>
                </div>

                <button onClick={() => setShowReportModal(true)} className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors" title="Laporkan Pengguna">
                    <Flag size={20} />
                </button>
            </div>

            {/* AREA PESAN */}
            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 flex flex-col items-center">
                <div className="w-full max-w-4xl flex flex-col gap-4 relative">
                    <div className="bg-[#FF9500]/10 border border-[#FF9500]/20 text-[#FF9500] p-4 rounded-xl flex items-start gap-3 shadow-sm mx-auto w-full md:w-[80%] mb-4">
                        <ShieldAlert size={20} className="shrink-0 mt-0.5" />
                        <p className="text-xs md:text-sm font-bold leading-relaxed">
                            <strong className="font-black uppercase tracking-wider block mb-1">Keamanan Escrow</strong>
                            Dilarang membagikan nomor WhatsApp atau Rekening pribadi. Pesan akan terblokir otomatis.
                        </p>
                    </div>

                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-slate-400 mt-10">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-200"><Send size={32} className="text-slate-300 ml-1" /></div>
                            <p className="font-bold text-slate-600">Belum ada pesan.</p>
                        </div>
                    ) : (
                        messages.map((msg) => {
                            const rawSender = msg.senderId || msg.sender; 
                            const msgSenderId = typeof rawSender === 'object' ? rawSender?._id : rawSender;
                            const isMe = String(msgSenderId) === String(myId);
                            const prod = msg.productId || msg.product;
                            return (
                                <div key={msg._id || Math.random()} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] md:max-w-[65%] px-5 py-3 text-[15px] leading-relaxed shadow-sm relative ${isMe ? 'bg-[#00478F] text-white rounded-[1.5rem] rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-[1.5rem] rounded-tl-sm'}`}>
                                        {prod && (
                                            <Link to={`/product/${prod._id || prod}`} className={`block mb-3 p-2.5 rounded-xl border transition-colors ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <img src={(prod.images && prod.images.length > 0) ? prod.images[0] : (prod.imageUrl || 'https://via.placeholder.com/150')} alt="Produk" className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200" />
                                                    <div className="overflow-hidden">
                                                        <p className={`text-xs font-black truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>{prod.title || 'Barang Dihapus'}</p>
                                                        <p className={`text-xs font-bold mt-0.5 ${isMe ? 'text-blue-200' : 'text-[#00478F]'}`}>Rp{prod.price?.toLocaleString('id-ID') || 0}</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}
                                        <p className="whitespace-pre-wrap">{msg.text || msg.message || ""}</p>
                                        <div className={`text-[10px] mt-1.5 flex items-center gap-1 ${isMe ? 'text-blue-200 justify-end' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                            {isMe && <CheckCheck size={14} className={msg.isRead ? "text-green-300" : "text-blue-300/50"} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} className="pb-2" />
                </div>
            </div>

            {/* INPUT FORM BAWAH */}
            <div className="bg-white p-3 md:p-4 border-t border-slate-200 shadow-[0_-10px_15px_-3px_rgba(0,0,0,0.05)] z-20 flex justify-center shrink-0">
                <div className="w-full max-w-4xl flex flex-col gap-3">
                    
                    {linkedProduct && (
                        <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between relative shadow-sm">
                            <div className="flex items-center gap-3">
                                <img src={(linkedProduct.images && linkedProduct.images.length > 0) ? linkedProduct.images[0] : linkedProduct.imageUrl} className="w-12 h-12 rounded-lg object-cover bg-white border border-slate-200" alt="Produk" />
                                <div>
                                    <p className="text-xs font-black text-slate-800 line-clamp-1">{linkedProduct.title}</p>
                                    <p className="text-xs font-bold text-[#00478F]">Rp{linkedProduct.price.toLocaleString('id-ID')}</p>
                                </div>
                            </div>
                            <button type="button" onClick={() => { setLinkedProduct(null); setInputText(''); }} className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-full shadow-sm border border-slate-200">
                                <X size={14}/>
                            </button>
                        </div>
                    )}

                    <form onSubmit={handleSendMessage} className="flex items-end gap-2 md:gap-3">
                        <div className={`flex-1 border rounded-[2rem] flex items-center px-2 transition-all ${isBanned ? 'bg-slate-50 border-slate-200' : 'bg-slate-100 border-slate-200 focus-within:border-[#00478F] focus-within:bg-white focus-within:ring-4 focus-within:ring-blue-900/5'}`}>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={handleInputChange} 
                                disabled={isBanned}
                                placeholder={isBanned ? "Akun ini telah diblokir (Banned User)" : "Ketik pesan..."} 
                                className="w-full px-4 py-3.5 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm md:text-base disabled:cursor-not-allowed"
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" disabled={!inputText.trim() || isBanned} className="w-12 h-12 md:w-14 md:h-14 bg-[#00478F] text-white rounded-full flex items-center justify-center hover:bg-[#FF9500] transition-all shadow-md active:scale-95 disabled:opacity-30 disabled:cursor-not-allowed shrink-0">
                            <Send size={20} className="ml-1 md:ml-1.5" />
                        </button>
                    </form>
                </div>
            </div>

            {/* MODALS (Peringatan & Laporan) */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl border-4 border-red-500">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={48} strokeWidth={2.5} /></div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Pesan Diblokir!</h2>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">Sistem mendeteksi Anda mencoba mengirim <b>Nomor HP, Rekening, atau Link Platform Lain</b>.</p>
                        <button type="button" onClick={() => setShowWarningModal(false)} className="w-full py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest text-xs">Saya Mengerti</button>
                    </div>
                </div>
            )}

            {showReportModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-6 md:p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto animate-in zoom-in-95 duration-200">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-red-600 flex items-center gap-2"><AlertTriangle size={24}/> Laporkan Pengguna</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Pelanggaran</label>
                                <select required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none">
                                    <option value="" disabled>Pilih Jenis Pelanggaran...</option>
                                    <option value="Penipuan / Fraud">Terindikasi Penipuan / Fraud</option>
                                    <option value="Pelecehan / Kata Kasar">Pelecehan / Kata-kata Kasar</option>
                                    <option value="Spam / Bot">Spam atau Bot</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Kejadian</label>
                                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} placeholder="Ceritakan detail kejadian..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none min-h-[100px]"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti</label>
                                {reportPreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                                        <img src={reportPreview} className="w-full h-32 object-cover" alt="preview" />
                                        <button type="button" onClick={() => {setReportForm({...reportForm, evidenceImage: null}); setReportPreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer text-slate-400">
                                        <ImagePlus size={28} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase">Pilih Screenshot</span>
                                        <input type="file" accept="image/*" onChange={handleReportImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                            <button type="submit" disabled={submittingReport} className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 uppercase tracking-widest text-xs disabled:opacity-50 mt-4">
                                {submittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}