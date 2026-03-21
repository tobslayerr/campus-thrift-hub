import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, MessageSquare, ShieldCheck, 
    Star, MapPin, School, PlusCircle, 
    ChevronRight, Clock, Award, Edit
} from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [product, setProduct] = useState(null);
    const [review, setReview] = useState(null); 
    const [loading, setLoading] = useState(true);

    // State Form Review
    const [ratingForm, setRatingForm] = useState(5);
    const [commentForm, setCommentForm] = useState('');
    const [submittingReview, setSubmittingReview] = useState(false);

    const myId = user?.id || user?._id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productRes = await api.get(`/products/${id}`);
                setProduct(productRes.data.data);

                const reviewRes = await api.get(`/reviews/product/${id}`);
                setReview(reviewRes.data.data);
            } catch (error) {
                console.error("Gagal memuat detail", error);
                toast.error("Gagal memuat data barang.");
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id]);

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );
    
    if (!product) return <div className="text-center mt-20 font-black text-slate-400">Barang tidak ditemukan.</div>;

    const isMine = product.sellerId._id === myId;
    const canReview = !isMine && !review && product.status === 'Terjual'; 

    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        const toastId = toast.loading('Mengirim ulasan...');
        try {
            const res = await api.post('/reviews', {
                productId: product._id,
                sellerId: product.sellerId._id,
                rating: ratingForm,
                comment: commentForm
            });
            setReview(res.data.data);
            toast.success('Ulasan berhasil dikirim!', { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengirim ulasan', { id: toastId });
        } finally {
            setSubmittingReview(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* --- TOP BAR / BREADCRUMB --- */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <button 
                    onClick={() => navigate(-1)} 
                    className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#00478F] transition-colors"
                >
                    <ArrowLeft size={20} /> Kembali
                </button>
            </div>

            <main className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* --- KIRI: VISUAL PRODUK --- */}
                    <div className="lg:col-span-7 space-y-6">
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-white border border-slate-100 shadow-2xl shadow-slate-200/50 group">
                            {product.status === 'Terjual' && (
                                <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                    <span className="bg-red-500 text-white px-8 py-3 rounded-2xl font-black tracking-[0.2em] shadow-2xl border-2 border-red-400">SOLD OUT</span>
                                </div>
                            )}
                            <img 
                                src={product.imageUrl} 
                                alt={product.title} 
                                className={`w-full h-full object-contain max-h-[700px] transition-transform duration-700 group-hover:scale-105 ${product.status === 'Terjual' ? 'grayscale' : ''}`} 
                            />
                        </div>
                    </div>

                    {/* --- KANAN: INFORMASI & AKSI --- */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className="bg-[#FF9500]/10 text-[#FF9500] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#FF9500]/20">
                                    {product.category}
                                </span>
                                <div className="flex items-center gap-1 text-slate-400 text-xs font-bold">
                                    <Clock size={14} /> Tersedia
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
                                {product.title}
                            </h1>

                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-4xl font-black text-[#00478F]">
                                    Rp{product.price.toLocaleString('id-ID')}
                                </span>
                                <span className="text-slate-400 text-sm font-bold">/ Harga Pas</span>
                            </div>

                            <div className="space-y-4 mb-8">
                                <div className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#00478F]">
                                        <ShieldCheck size={18} />
                                    </div>
                                    <span>Dana dijamin aman dengan sistem Escrow</span>
                                </div>
                                <div className="flex items-center gap-3 text-slate-600 font-medium text-sm">
                                    <div className="w-8 h-8 rounded-lg bg-slate-50 flex items-center justify-center text-[#FF9500]">
                                        <Award size={18} />
                                    </div>
                                    <span>Kondisi Barang Terverifikasi Pembeli saat COD</span>
                                </div>
                            </div>

                            {/* TOMBOL AKSI UTAMA */}
                            {product.status === 'Tersedia' && (
                                <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                                    {isMine ? (
                                        <>
                                            <Link 
                                                to={`/edit-product/${product._id}`} 
                                                className="w-full py-5 bg-[#FF9500] text-white flex items-center justify-center gap-2 font-black rounded-2xl shadow-xl shadow-orange-900/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm"
                                            >
                                                <Edit size={18} /> Edit Data Barang
                                            </Link>
                                            <button 
                                                onClick={() => navigate('/my-profile')} 
                                                className="w-full py-5 bg-slate-50 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-xs hover:bg-slate-100 transition-all"
                                            >
                                                Kelola Profil Saya
                                            </button>
                                        </>
                                    ) : (
                                        <>
                                            <Link to={`/checkout/${product._id}`} className="w-full py-5 bg-[#00478F] text-white text-center font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#FF9500] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
                                                Beli Sekarang
                                            </Link>
                                            <Link to={`/chat/${product.sellerId._id}?product=${product._id}`} className="w-full py-5 bg-white text-[#00478F] text-center font-black rounded-2xl border-2 border-[#00478F] hover:bg-slate-50 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2">
                                                <MessageSquare size={18} /> Chat Penjual
                                            </Link>
                                        </>
                                    )}
                                </div>
                            )}
                        </div>

                        {/* KARTU PENJUAL */}
                        <Link to={`/seller/${product.sellerId._id}`} className="mt-8 flex items-center gap-5 p-6 bg-white rounded-[2rem] border border-slate-100 hover:border-[#FF9500] transition-all group shadow-sm">
                            <img 
                                src={product.sellerId.profilePicture || 'https://via.placeholder.com/150'} 
                                alt={product.sellerId.name} 
                                className="w-16 h-16 rounded-full object-cover ring-4 ring-slate-50" 
                            />
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                    <h4 className="font-black text-slate-900 group-hover:text-[#00478F] transition-colors">{product.sellerId.name}</h4>
                                    {isMine && <span className="bg-[#00478F] text-white text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest">Anda</span>}
                                </div>
                                <div className="flex flex-col gap-1 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                    <span className="flex items-center gap-1"><School size={12} /> {product.sellerId.campus || 'Kampus tidak diketahui'}</span>
                                    <span className="flex items-center gap-1 text-[#FF9500]"><Star size={12} fill="#FF9500" /> {product.sellerId.rating?.toFixed(1) || '5.0'} Seller Rating</span>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-[#FF9500] transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* --- BAGIAN BAWAH: DESKRIPSI & ULASAN --- */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-20">
                    <div className="lg:col-span-7 space-y-12">
                        {/* Deskripsi */}
                        <section>
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <PlusCircle className="text-[#FF9500]" size={20} /> Deskripsi Produk
                            </h3>
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 leading-relaxed text-slate-600 whitespace-pre-line shadow-sm">
                                {product.description || "Penjual tidak memberikan deskripsi tambahan."}
                            </div>
                        </section>

                        {/* SEKSI ULASAN */}
                        <section>
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <MessageSquare className="text-[#00478F]" size={20} /> Ulasan Pembeli
                            </h3>

                            {review ? (
                                <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 bg-[#FF9500]/5 text-[#FF9500] rounded-bl-3xl font-black text-[10px] uppercase">Verified Purchase</div>
                                    <div className="flex items-center gap-4 mb-6">
                                        <img src={review.buyerId?.profilePicture || 'https://via.placeholder.com/150'} className="w-12 h-12 rounded-full border border-slate-100 object-cover" alt="" />
                                        <div>
                                            <p className="font-black text-slate-800">{review.buyerId?.name || 'Pembeli'}</p>
                                            <div className="flex text-[#FF9500] mt-0.5">
                                                {[...Array(5)].map((_, i) => (
                                                    <Star key={i} size={14} fill={i < review.rating ? "#FF9500" : "none"} strokeWidth={2.5} />
                                                ))}
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-slate-600 italic leading-relaxed text-lg">"{review.comment}"</p>
                                </div>
                            ) : canReview ? (
                                <form onSubmit={handleSubmitReview} className="bg-[#00478F] p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl shadow-blue-900/20">
                                    <h4 className="text-xl font-black mb-2">Bagaimana pengalaman Anda?</h4>
                                    <p className="text-blue-200 text-sm mb-8 font-medium">Ulasan Anda membantu mahasiswa lain berbelanja dengan aman.</p>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Pilih Rating</label>
                                            <div className="flex gap-4">
                                                {[1,2,3,4,5].map(num => (
                                                    <button 
                                                        key={num} 
                                                        type="button"
                                                        onClick={() => setRatingForm(num)}
                                                        className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${ratingForm >= num ? 'bg-[#FF9500] text-white scale-110 shadow-lg shadow-orange-500/40' : 'bg-white/10 text-white hover:bg-white/20'}`}
                                                    >
                                                        <Star size={20} fill={ratingForm >= num ? "currentColor" : "none"} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase tracking-widest text-blue-300 mb-2">Tulis Komentar</label>
                                            <textarea 
                                                required 
                                                value={commentForm} 
                                                onChange={(e) => setCommentForm(e.target.value)} 
                                                className="w-full p-5 rounded-2xl bg-white/10 border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#FF9500] transition-all placeholder:text-blue-300/50" 
                                                placeholder="Contoh: Kondisi barang sangat mulus, penjual ramah!"
                                                rows="4"
                                            ></textarea>
                                        </div>
                                        <button 
                                            type="submit" 
                                            disabled={submittingReview} 
                                            className="w-full bg-[#FF9500] text-white font-black py-5 rounded-2xl hover:bg-white hover:text-[#FF9500] transition-all shadow-xl shadow-orange-500/20 active:scale-95 uppercase tracking-widest text-xs"
                                        >
                                            {submittingReview ? 'Sedang Mengirim...' : 'Kirim Ulasan Sekarang'}
                                        </button>
                                    </div>
                                </form>
                            ) : (
                                <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                                    <p className="text-slate-400 font-bold italic">Belum ada ulasan untuk barang ini.</p>
                                </div>
                            )}
                        </section>
                    </div>

                    {/* --- KANAN BAWAH: REKOMENDASI / INFO --- */}
                    <div className="lg:col-span-5">
                        <div className="bg-[#FF9500] p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                            <h4 className="text-xl font-black mb-2 relative z-10">Keamanan Escrow</h4>
                            <p className="text-orange-100 text-sm font-medium relative z-10 mb-6">Uang Anda hanya akan cair ke penjual setelah Anda memasukkan PIN COD saat barang diterima secara langsung.</p>
                            <ShieldCheck size={120} className="absolute -bottom-8 -right-8 text-white/20 rotate-12" />
                            <Link to="/how-it-works" className="relative z-10 bg-white text-[#FF9500] px-6 py-3 rounded-xl font-black text-xs hover:bg-slate-900 hover:text-white transition-all inline-block">Pelajari Selengkapnya</Link>
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}