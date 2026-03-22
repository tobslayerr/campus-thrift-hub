import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { ArrowLeft, Send, ShieldAlert, AlertTriangle, X, CheckCheck, Flag, ImagePlus, ShieldOff, Store, Loader2 } from 'lucide-react';
import { io } from 'socket.io-client'; // Import Socket.io Client

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
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    
    const [isTargetTyping, setIsTargetTyping] = useState(false);
    const typingTimeoutRef = useRef(null);
    const socketRef = useRef(null); // Ref untuk socket
    
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

    // FIX: Tambahkan proteksi agar tidak error jika VITE_API_URL undefined
    const rawApiUrl = import.meta.env.VITE_API_URL || 'http://localhost:5000';
    const SOCKET_URL = rawApiUrl.replace('/api', '');

    const scrollToBottom = () => {
        setTimeout(() => {
            messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
        }, 100);
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
                // Fetch Target User Profile
                const response = await api.get(`/users/seller/${targetUserId}`);
                const profile = response.data.data?.profile || response.data.data;
                setTargetUser(profile);

                // Fetch Linked Product if any
                if (productIdQuery && !profile.isBanned) {
                    const resProduct = await api.get(`/products/${productIdQuery}`);
                    setLinkedProduct(resProduct.data.data);
                    setInputText(`Halo kak, saya ingin bertanya tentang produk "${resProduct.data.data.title}" ini.`);
                }

                // Fetch Chat History
                const chatRes = await api.get(`/messages/chat/${targetUserId}`);
                const fetchedMessages = chatRes.data.data || chatRes.data;
                if (Array.isArray(fetchedMessages)) setMessages(fetchedMessages);

            } catch (error) {
                console.error("Gagal memuat data awal:", error);
                toast.error("Gagal memuat percakapan.");
                navigate('/chats');
            } finally {
                setLoading(false);
                scrollToBottom();
            }
        };

        if (targetUserId) {
            fetchInitialData();
            
            // ==========================================
            // 🟢 INISIALISASI SOCKET.IO
            // ==========================================
            socketRef.current = io(SOCKET_URL);

            // Registrasikan user ID kita ke socket server
            if (myId) {
                socketRef.current.emit('register_user', myId);
            }

            // Dengarkan pesan masuk secara realtime
            socketRef.current.on('receive_message', (incomingMessage) => {
                const incomingSenderId = incomingMessage.senderId?._id || incomingMessage.senderId;
                if (incomingSenderId === targetUserId) {
                    setMessages((prevMessages) => {
                        if (prevMessages.some(m => m._id === incomingMessage._id)) return prevMessages;
                        return [...prevMessages, incomingMessage];
                    });
                    
                    if (isAutoScrollActive.current) {
                        scrollToBottom();
                    }
                }
            });

            return () => {
                if (socketRef.current) {
                    socketRef.current.disconnect();
                }
            };
        }
    }, [targetUserId, productIdQuery, myId, SOCKET_URL, navigate]);

    useEffect(() => {
        const fetchStatus = async () => {
            if (!targetUserId) return;
            try {
                const response = await api.get(`/messages/chat/${targetUserId}`);
                setIsTargetTyping(response.data.isTyping || false);
                
                if(response.data.opponentData) {
                    setTargetUser(prev => ({...prev, lastActive: response.data.opponentData.lastActive}));
                }
            // eslint-disable-next-line no-unused-vars
            } catch (e) { /* ignore */ }
        };
        const interval = setInterval(fetchStatus, 3000); 
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
        const normalizedText = t.replace(/[^a-z0-9]/g, '');
        const phoneRegexNormalized = /(?:08|628)\d{8,12}/;
        const phoneRegexOriginal = /(?:\+\s*62|62|0)[\s\-.]*8[0-9]{1,2}[\s\-.]?[0-9]{3,4}[\s\-.]?[0-9]{3,4}/g;
        if (phoneRegexNormalized.test(normalizedText) || phoneRegexOriginal.test(t)) return true;

        const hasBankKeyword = /\b(rek|rekening|norek|bca|bni|bri|mandiri|bsi|cimb|danamon|permata|mega|bjb|gopay|gpay|dana|ovo|shopeepay|spay|linkaja|jenius|sakuku|tf|transfer)\b/i.test(t);
        const hasLongDigits = /\d{8,}/.test(normalizedText);
        if (hasBankKeyword && hasLongDigits) return true;

        const forbiddenPatterns = [
            /\b(bayar|transfer|tf|trf)\s*(ke|lewat|via|pake|pakai|langsung)?\s*(saya|gw|aku|rekening|rek|norek)\b/i,
            /\b(ketemuan|cod)\s*(tapi|cuma|syaratnya)?\s*(bayar|transfer|tf)\s*(dulu|awal|separuh|dp)\b/i,
            /\b(bayar|transfer|tf|trf)\s*(langsung)\s*(aja|saja)\b/i,
            /\b(minta|bagi|kasih|kirim|tulis)\s*(no|nomor|nomer|wa|rek|rekening)\b/i,
            /\b(pindah|lanjut|lewat|chat|hubungi)\s*(aja\s*)?(ke|di|via)?\s*(wa|whatsapp|w a|ig|instagram|tele|telegram|line)\b/i,
            /\b(ini|ni|nih|nomor|no)\s*(wa|whatsapp|w a|watsap|rek|rekening|norek)\s*(saya|gw|aku)?\b/i,
            /\b(wa|whatsapp|w a|w\.a|watsap|wea)\b/i,
            /\b(shopee|tokopedia|tokped|lazada|bukalapak|tiktok|carousell)\b/i
        ];
        return forbiddenPatterns.some(pattern => pattern.test(t));
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
        if (!inputText.trim() || targetUser?.isBanned || sending) return;

        const textToSend = inputText;
        if (isSuspicious(textToSend)) {
            setShowWarningModal(true);
            return;
        }

        setSending(true);
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
        scrollToBottom();

        try {
            const res = await api.post('/messages', {
                receiverId: targetUserId,
                productId: tempMessage.productId?._id || null,
                text: textToSend,
                message: textToSend 
            });
            setMessages((prev) => prev.map(m => m._id === tempMessage._id ? res.data.data : m));
        } catch (error) {
            setMessages((prev) => prev.filter(m => m._id !== tempMessage._id));
            setInputText(textToSend);
            if (tempMessage.productId) setLinkedProduct(tempMessage.productId);
            if (error.response?.status === 403) setShowWarningModal(true);
            else toast.error('Gagal mengirim pesan.');
        } finally {
            setSending(false);
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

    if (loading || !targetUser) return (
        <div className="flex justify-center items-center h-[calc(100vh-80px)] bg-[#F8FAFC]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );

    const statusOnline = getOnlineStatus(targetUser.lastActive);
    const isOnlineNow = statusOnline === 'Online';
    const isBanned = targetUser.isBanned;

    return (
        <div className="w-full flex flex-col h-[calc(100dvh-80px)] bg-[#F8FAFC]">
            
            {/* HEADER CHAT */}
            <div className="bg-white px-4 py-3 border-b border-slate-200 shadow-sm flex items-center justify-between z-20 shrink-0">
                <div className="flex items-center gap-3">
                    <button onClick={() => navigate(-1)} className="p-2 -ml-2 text-slate-400 hover:text-[#00478F] hover:bg-slate-100 rounded-full transition-colors">
                        <ArrowLeft size={24} />
                    </button>
                    <div className={`relative ${!isBanned ? 'cursor-pointer' : ''}`} onClick={() => !isBanned && navigate(`/seller/${targetUser._id}`)}>
                        <img src={targetUser.profilePicture || `https://ui-avatars.com/api/?name=${targetUser.name || 'User'}&background=f1f5f9&color=00478F`} alt={targetUser.name} className={`w-11 h-11 rounded-full object-cover ring-2 ring-slate-100 ${isBanned ? 'grayscale opacity-50' : ''}`} />
                        {isOnlineNow && !isBanned && <div className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-green-500 border-2 border-white rounded-full"></div>}
                    </div>
                    <div className={`flex flex-col justify-center h-full ${!isBanned ? 'cursor-pointer' : ''}`} onClick={() => !isBanned && navigate(`/seller/${targetUser._id}`)}>
                        <h2 className="font-black text-slate-900 text-base leading-tight flex items-center gap-1">
                            {isBanned ? (
                                <span className="text-red-500 flex items-center gap-1 italic opacity-70"><ShieldOff size={14}/> Banned User</span>
                            ) : (
                                <span className="hover:text-[#00478F] transition-colors flex items-center gap-1">{targetUser.name} {targetUser.isVerified && <CheckCheck size={14} className="text-blue-500" />}</span>
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

            {/* PERINGATAN ANTI FRAUD */}
            <div className="bg-orange-50 border-b border-orange-200 px-4 py-2 shrink-0 flex items-start gap-3 shadow-sm">
                <ShieldAlert className="text-[#FF9500] shrink-0 mt-0.5" size={16} />
                <p className="text-[10px] md:text-xs text-orange-800 font-medium leading-tight">
                    <strong>PENTING:</strong> Dilarang keras transaksi di luar sistem (transfer pribadi/kirim resi di chat). Sistem otomatis memblokir pesan indikasi eksternal. Gunakan fitur "Beli Sekarang" atau "Checkout".
                </p>
            </div>

            {/* AREA PESAN (Scrollable) */}
            <div ref={chatContainerRef} onScroll={handleScroll} className="flex-1 overflow-y-auto p-4 flex flex-col items-center relative no-scrollbar">
                <div className="w-full max-w-4xl flex flex-col gap-4 relative pb-2">
                    
                    {messages.length === 0 ? (
                        <div className="flex-1 flex flex-col justify-center items-center text-slate-400 mt-20 opacity-60">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center shadow-sm mb-4 border border-slate-200"><Store size={32} className="text-slate-300" /></div>
                            <p className="font-black text-xl tracking-tight text-slate-500">Mulai Percakapan</p>
                            <p className="text-xs font-medium text-center max-w-xs mt-2">Tanyakan detail barang atau janjian COD di area kampus.</p>
                        </div>
                    ) : (
                        messages.map((msg, index) => {
                            const rawSender = msg.senderId || msg.sender; 
                            const msgSenderId = typeof rawSender === 'object' ? rawSender?._id : rawSender;
                            const isMe = String(msgSenderId) === String(myId);
                            const prod = msg.productId || msg.product;
                            
                            return (
                                <div key={msg._id || index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[85%] md:max-w-[70%] px-5 py-3 text-[15px] leading-relaxed shadow-sm relative ${isMe ? 'bg-[#00478F] text-white rounded-[1.5rem] rounded-tr-sm' : 'bg-white border border-slate-100 text-slate-800 rounded-[1.5rem] rounded-tl-sm'}`}>
                                        
                                        {prod && (
                                            <Link to={`/product/${prod._id || prod}`} className={`block mb-3 p-2.5 rounded-xl border transition-colors ${isMe ? 'bg-white/10 border-white/20 hover:bg-white/20' : 'bg-slate-50 border-slate-200 hover:bg-slate-100'}`}>
                                                <div className="flex items-center gap-3">
                                                    <img src={(prod.images && prod.images.length > 0) ? prod.images[0] : (prod.imageUrl || 'https://via.placeholder.com/150')} alt="Produk" className="w-12 h-12 object-cover rounded-lg bg-white border border-slate-200" />
                                                    <div className="overflow-hidden">
                                                        <p className={`text-xs font-black truncate ${isMe ? 'text-white' : 'text-slate-800'}`}>{prod.title || 'Barang Dihapus'}</p>
                                                        <p className={`text-[10px] font-bold mt-0.5 ${isMe ? 'text-blue-200' : 'text-[#FF9500]'}`}>Lihat Barang ↗</p>
                                                    </div>
                                                </div>
                                            </Link>
                                        )}

                                        <p className="whitespace-pre-wrap break-words">{msg.text || msg.message || ""}</p>
                                        
                                        <div className={`text-[9px] font-bold mt-1.5 flex items-center gap-1 ${isMe ? 'text-blue-200 justify-end' : 'text-slate-400'}`}>
                                            {new Date(msg.createdAt).toLocaleTimeString('id-ID', {hour: '2-digit', minute:'2-digit'})}
                                            {isMe && <CheckCheck size={14} className={msg.isRead ? "text-green-300" : "text-blue-300/50"} />}
                                        </div>
                                    </div>
                                </div>
                            );
                        })
                    )}
                    <div ref={messagesEndRef} />
                </div>
            </div>

            {/* INPUT FORM */}
            <div className="bg-white p-3 md:p-4 border-t border-slate-200 z-20 flex justify-center shrink-0">
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
                        <div className={`flex-1 border rounded-[2rem] flex items-center px-2 transition-all shadow-inner ${isBanned ? 'bg-slate-50 border-slate-200' : 'bg-slate-50 border-slate-200 focus-within:border-[#00478F] focus-within:bg-white'}`}>
                            <input 
                                type="text" 
                                value={inputText}
                                onChange={handleInputChange} 
                                disabled={isBanned || sending}
                                placeholder={isBanned ? "Akun ini telah diblokir (Banned User)" : "Ketik pesan..."} 
                                className="w-full px-4 py-3.5 bg-transparent outline-none text-slate-700 font-medium placeholder:text-slate-400 text-sm md:text-base disabled:cursor-not-allowed"
                                autoComplete="off"
                            />
                        </div>
                        <button type="submit" disabled={!inputText.trim() || isBanned || sending} className="w-12 h-12 md:w-14 md:h-14 bg-[#00478F] text-white rounded-full flex items-center justify-center hover:bg-[#FF9500] transition-all shadow-md active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed shrink-0">
                            {sending ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} className="ml-1" />}
                        </button>
                    </form>
                </div>
            </div>

            {/* MODALS */}
            {showWarningModal && (
                <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full text-center shadow-2xl border-4 border-red-500">
                        <div className="w-24 h-24 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6"><AlertTriangle size={48} strokeWidth={2.5} /></div>
                        <h2 className="text-2xl font-black text-slate-900 mb-2">Pesan Diblokir!</h2>
                        <p className="text-slate-600 text-sm font-medium leading-relaxed mb-6">Sistem mendeteksi indikasi transaksi di luar aplikasi. Transaksi di luar sistem dilarang demi keamanan.</p>
                        <button type="button" onClick={() => setShowWarningModal(false)} className="w-full py-4 bg-red-500 text-white font-black rounded-xl hover:bg-red-600 transition-colors uppercase tracking-widest text-xs shadow-lg shadow-red-500/30">Saya Mengerti</button>
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
                                <select required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-red-500">
                                    <option value="" disabled>Pilih Jenis Pelanggaran...</option>
                                    <option value="Penipuan / Fraud">Terindikasi Penipuan / Transaksi Luar</option>
                                    <option value="Pelecehan / Kata Kasar">Pelecehan / Kata-kata Kasar</option>
                                    <option value="Spam / Bot">Spam atau Bot</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Kejadian</label>
                                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} placeholder="Ceritakan detail kejadian..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none focus:border-red-500 min-h-[100px]"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti</label>
                                {reportPreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                                        <img src={reportPreview} className="w-full h-32 object-cover" alt="preview" />
                                        <button type="button" onClick={() => {setReportForm({...reportForm, evidenceImage: null}); setReportPreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 cursor-pointer text-slate-400 hover:bg-red-50 hover:border-red-300 hover:text-red-500 transition-colors">
                                        <ImagePlus size={28} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase">Pilih Screenshot</span>
                                        <input type="file" accept="image/*" onChange={handleReportImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                            <button type="submit" disabled={submittingReport} className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 uppercase tracking-widest text-xs disabled:opacity-50 mt-4 shadow-lg shadow-red-500/30">
                                {submittingReport ? 'Mengirim...' : 'Kirim Laporan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}