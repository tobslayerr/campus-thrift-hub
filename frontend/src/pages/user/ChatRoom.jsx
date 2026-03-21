/* eslint-disable no-unused-vars */
import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function ChatRoom() {
    const { id: targetUserId } = useParams(); // ID lawan bicara
    const [searchParams] = useSearchParams();
    const productId = searchParams.get('product'); // Opsional jika dari detail barang
    
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
            }
        };
        fetchTargetUser();
    }, [targetUserId]);

    // Ambil pesan & Polling setiap 2 detik (Efek Real-Time)
    useEffect(() => {
        const fetchMessages = async () => {
            try {
                // PERBAIKAN 1: Tambahkan /chat/ pada URL
                const response = await api.get(`/messages/chat/${targetUserId}`);
                setMessages(response.data.data);
            } catch (error) {
                console.error("Gagal mengambil pesan");
            }
        };

        fetchMessages(); // Panggil pertama kali
        const interval = setInterval(fetchMessages, 2000); // Polling per 2 detik
        
        return () => clearInterval(interval); // Bersihkan interval saat keluar halaman
    }, [targetUserId]);

    // Scroll ke bawah setiap kali ada pesan baru
    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if (!inputText.trim()) return;

        const textToSend = inputText;
        setInputText(''); // Kosongkan input seketika agar UX cepat

        try {
            await api.post('/messages', {
                receiverId: targetUserId,
                productId: productId || null,
                text: textToSend
            });
            // Pesan akan otomatis muncul di layar berkat interval polling
        } catch (error) {
            alert('Gagal mengirim pesan');
            setInputText(textToSend); // Kembalikan teks jika gagal
        }
    };

    if (!targetUser) return <div className="text-center mt-20 font-bold">Memuat obrolan...</div>;

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8 h-[90vh] flex flex-col">
            {/* Header Chat */}
            <div className="bg-white p-4 rounded-t-3xl border border-gray-100 shadow-sm flex items-center gap-4 z-10">
                <button onClick={() => navigate(-1)} className="text-xl p-2 hover:bg-gray-100 rounded-full transition">
                    ←
                </button>
                <img src={targetUser.profilePicture || 'https://via.placeholder.com/150'} alt={targetUser.name} className="w-12 h-12 rounded-full object-cover border-2 border-brand-yellow" />
                <div>
                    <h2 className="font-black text-gray-900">{targetUser.name}</h2>
                    <p className="text-xs text-green-500 font-bold flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-green-500"></span> Online
                    </p>
                </div>
            </div>

            {/* Area Pesan */}
            <div className="flex-1 bg-gray-50 overflow-y-auto p-4 md:p-6 border-x border-gray-100 flex flex-col gap-4">
                <div className="bg-brand-yellow/10 border border-brand-yellow text-brand-dark p-3 rounded-xl text-center text-xs font-bold mb-4 shadow-sm">
                    ⚠️ Keamanan Escrow: Dilarang membagikan nomor WhatsApp. Sistem akan memblokir pesan yang mengandung nomor telepon demi keamanan transaksi Anda.
                </div>

                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-10 font-medium text-sm">
                        Belum ada pesan. Mulai percakapan sekarang!
                    </div>
                ) : (
                    messages.map((msg, index) => {
                        // Cek kepemilikan pesan (aman untuk .id atau ._id)
                        const isMe = msg.senderId === user?.id || msg.senderId === user?._id;
                        
                        // PERBAIKAN 2: Deteksi semua kata "DISENSOR" agar teks nomor HP dan "wa" kena merah
                        const isCensored = msg.text.includes('DISENSOR');

                        return (
                            <div key={index} className={`flex ${isMe ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[75%] p-4 rounded-2xl text-sm ${
                                    isMe ? 'bg-brand-dark text-white rounded-tr-none' : 'bg-white border border-gray-200 text-gray-800 rounded-tl-none shadow-sm'
                                }`}>
                                    {isCensored ? (
                                        <span className={isMe ? 'text-red-400 font-bold' : 'text-red-600 font-bold'}>
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

            {/* Input Form */}
            <form onSubmit={handleSendMessage} className="bg-white p-4 rounded-b-3xl border border-gray-100 shadow-sm flex gap-3">
                <input 
                    type="text" 
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    placeholder="Ketik pesan..." 
                    className="flex-1 px-4 py-3 bg-gray-100 border-transparent rounded-xl focus:ring-2 focus:ring-brand-yellow focus:bg-white transition outline-none"
                />
                <button type="submit" className="bg-brand-yellow text-brand-dark px-6 py-3 rounded-xl font-black hover:bg-yellow-500 transition shadow-md">
                    Kirim
                </button>
            </form>
        </div>
    );
}