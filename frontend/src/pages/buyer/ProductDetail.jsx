/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
    ArrowLeft, MessageSquare, ShieldCheck, 
    Star, MapPin, School, PlusCircle, 
    ChevronRight, Clock, Award, Edit, Trash2, Box, ImagePlus, X
} from 'lucide-react';

export default function ProductDetail() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [product, setProduct] = useState(null);
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);

    // STATE UNTUK FORM ULASAN
    const [ratingForm, setRatingForm] = useState(5);
    const [commentForm, setCommentForm] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // STATE UNTUK UI
    const [isExpanded, setIsExpanded] = useState(false);
    const [activeImageIndex, setActiveImageIndex] = useState(0);

    const myId = user?.id || user?._id;

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productRes = await api.get(`/products/${id}`);
                setProduct(productRes.data.data);

                const reviewRes = await api.get(`/reviews/product/${id}`);
                setReviews(reviewRes.data.data); 
            } catch (error) {
                toast.error("Gagal memuat data barang.");
                navigate('/'); 
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, navigate]);

    // HANDLER HAPUS BARANG
    const handleDeleteProduct = async () => {
        if (window.confirm("Apakah Anda yakin ingin menghapus barang ini? Data transaksi lama tetap aman.")) {
            const toastId = toast.loading('Menghapus barang...');
            try {
                await api.delete(`/products/${id}`);
                toast.success('Barang berhasil dihapus!', { id: toastId });
                navigate('/my-profile');
            } catch (error) {
                toast.error('Gagal menghapus barang', { id: toastId });
            }
        }
    };

    // HANDLER GAMBAR ULASAN
    const handleAddReviewImages = (e) => {
        const files = Array.from(e.target.files);
        if (reviewImages.length + files.length > 5) return toast.error("Maksimal 5 gambar!");
        const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setReviewImages([...reviewImages, ...newImages]);
    };

    const removeReviewImage = (index) => {
        setReviewImages(reviewImages.filter((_, i) => i !== index));
    };

    // HANDLER SUBMIT ULASAN DARI HALAMAN DETAIL
    const handleSubmitReview = async (e) => {
        e.preventDefault();
        setSubmittingReview(true);
        const toastId = toast.loading('Mengirim ulasan...');
        
        const formData = new FormData();
        formData.append('productId', product._id);
        formData.append('sellerId', product.sellerId._id);
        formData.append('rating', ratingForm);
        formData.append('comment', commentForm);
        
        reviewImages.forEach(img => {
            formData.append('images', img.file);
        });

        try {
            const res = await api.post('/reviews', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            // Update UI langsung
            setReviews([res.data.data, ...reviews]);
            setCommentForm('');
            setReviewImages([]);
            toast.success('Ulasan berhasil dikirim!', { id: toastId });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengirim ulasan', { id: toastId });
        } finally {
            setSubmittingReview(false);
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-[#F8FAFC]">
            <div className="w-12 h-12 border-4 border-[#00478F] border-t-transparent rounded-full animate-spin"></div>
        </div>
    );
    
    if (!product) return <div className="text-center mt-20 font-black text-slate-400">Barang tidak ditemukan.</div>;

    const isMine = product.sellerId._id === myId;
    const hasReviewed = reviews.some(r => r.buyerId?._id === myId);
    
    // Syarat bisa mereview dari sini: Bukan pemilik, belum pernah review, barang tidak 'Tersedia'
    const canReview = !isMine && !hasReviewed && product.status !== 'Tersedia';

    const isLongText = product.description && product.description.length > 250;
    const displayText = isExpanded ? product.description : (isLongText ? product.description.slice(0, 250) + '...' : product.description);

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* TOP BAR / BREADCRUMB */}
            <div className="max-w-7xl mx-auto px-6 py-8">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#00478F] transition-colors">
                    <ArrowLeft size={20} /> Kembali
                </button>
            </div>

            <main className="max-w-7xl mx-auto px-6">
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
                    
                    {/* ================================== */}
                    {/* KIRI: VISUAL PRODUK (CAROUSEL)     */}
                    {/* ================================== */}
                    <div className="lg:col-span-7 space-y-4">
                        <div className="relative rounded-[2.5rem] overflow-hidden bg-slate-900 border border-slate-200 shadow-2xl group flex items-center justify-center h-[400px] md:h-[600px]">
                            {product.status === 'Terjual' && (
                                <div className="absolute inset-0 bg-slate-900/70 backdrop-blur-[2px] z-10 flex items-center justify-center pointer-events-none">
                                    <span className="bg-red-500 text-white px-8 py-3 rounded-2xl font-black tracking-widest shadow-2xl border-2 border-red-400 rotate-[-10deg] text-2xl">
                                        SOLD OUT
                                    </span>
                                </div>
                            )}
                            <img 
                                src={product.images && product.images.length > 0 ? product.images[activeImageIndex] : product.imageUrl} 
                                alt={product.title} 
                                className={`w-full h-full object-contain transition-transform duration-500 ${product.status === 'Terjual' ? 'grayscale opacity-60' : ''}`} 
                            />
                        </div>

                        {/* Thumbnail Carousel */}
                        {product.images && product.images.length > 1 && (
                            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide">
                                {product.images.map((img, idx) => (
                                    <button 
                                        key={idx} 
                                        onClick={() => setActiveImageIndex(idx)}
                                        className={`shrink-0 w-20 h-20 md:w-24 md:h-24 rounded-2xl overflow-hidden border-4 transition-all bg-slate-900 ${activeImageIndex === idx ? 'border-[#FF9500] opacity-100 scale-105' : 'border-transparent opacity-50 hover:opacity-100'}`}
                                    >
                                        <img src={img} alt={`Thumbnail ${idx}`} className="w-full h-full object-cover" />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* ================================== */}
                    {/* KANAN: INFORMASI & AKSI BARANG     */}
                    {/* ================================== */}
                    <div className="lg:col-span-5 flex flex-col">
                        <div className="bg-white p-8 md:p-10 rounded-[2.5rem] border border-slate-100 shadow-sm">
                            <div className="flex items-center justify-between mb-4">
                                <span className="bg-[#FF9500]/10 text-[#FF9500] px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border border-[#FF9500]/20">
                                    {product.category}
                                </span>
                                <div className="flex items-center gap-1 text-slate-500 text-xs font-black bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
                                    <Box size={14} className="text-[#00478F]" /> Stok: {product.stock || 0}
                                </div>
                            </div>

                            <h1 className="text-3xl md:text-4xl font-black text-slate-900 leading-tight mb-4">
                                {product.title}
                            </h1>

                            <div className="flex items-baseline gap-2 mb-8">
                                <span className="text-4xl font-black text-[#00478F]">
                                    Rp{product.price.toLocaleString('id-ID')}
                                </span>
                            </div>

                            {/* Info Keamanan */}
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
                            <div className="flex flex-col gap-4 pt-6 border-t border-slate-100">
                                {isMine ? (
                                    <>
                                        <div className="grid grid-cols-2 gap-4">
                                            <Link 
                                                to={`/edit-product/${product._id}`} 
                                                className="w-full py-4 bg-[#00478F] text-white flex items-center justify-center gap-2 font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-xs"
                                            >
                                                <Edit size={16} /> Edit Data
                                            </Link>
                                            <button 
                                                onClick={handleDeleteProduct} 
                                                className="w-full py-4 bg-red-50 text-red-500 border border-red-100 flex items-center justify-center gap-2 font-black rounded-2xl hover:bg-red-500 hover:text-white transition-all uppercase tracking-widest text-xs"
                                            >
                                                <Trash2 size={16} /> Hapus
                                            </button>
                                        </div>
                                    </>
                                ) : (
                                    product.status === 'Tersedia' && product.stock > 0 ? (
                                        <>
                                            <Link to={`/checkout/${product._id}`} className="w-full py-5 bg-[#00478F] text-white text-center font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#FF9500] hover:scale-[1.02] active:scale-95 transition-all uppercase tracking-widest text-sm">
                                                Beli Sekarang
                                            </Link>
                                            <Link to={`/chat/${product.sellerId._id}?product=${product._id}`} className="w-full py-5 bg-white text-[#00478F] text-center font-black rounded-2xl border-2 border-[#00478F] hover:bg-slate-50 transition-all uppercase tracking-widest text-sm flex justify-center items-center gap-2">
                                                <MessageSquare size={18} /> Chat Penjual
                                            </Link>
                                        </>
                                    ) : (
                                        <button disabled className="w-full py-5 bg-slate-200 text-slate-400 font-black rounded-2xl uppercase tracking-widest text-sm cursor-not-allowed border border-slate-300">
                                            Barang Sudah Laku
                                        </button>
                                    )
                                )}
                            </div>
                        </div>

                        {/* KARTU PROFIL PENJUAL */}
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
                                    <span className="flex items-center gap-1 text-[#FF9500]"><Star size={12} fill="#FF9500" /> {product.sellerId.rating?.toFixed(1) || '0.0'} Seller Rating</span>
                                </div>
                            </div>
                            <ChevronRight className="text-slate-300 group-hover:text-[#FF9500] transition-transform group-hover:translate-x-1" />
                        </Link>
                    </div>
                </div>

                {/* ================================== */}
                {/* BAGIAN BAWAH: DESKRIPSI & ULASAN   */}
                {/* ================================== */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mt-20">
                    <div className="lg:col-span-7 space-y-12">
                        
                        {/* 1. DESKRIPSI */}
                        <section>
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <PlusCircle className="text-[#FF9500]" size={20} /> Deskripsi Produk
                            </h3>
                            <div className="bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm relative">
                                <p className="leading-relaxed text-slate-600 whitespace-pre-line text-[15px] font-medium">
                                    {displayText}
                                </p>
                                {isLongText && (
                                    <button 
                                        onClick={() => setIsExpanded(!isExpanded)}
                                        className="mt-6 font-black text-[#00478F] hover:text-[#FF9500] flex items-center gap-2 transition-colors uppercase tracking-widest text-[11px] bg-slate-50 px-4 py-2 rounded-lg"
                                    >
                                        {isExpanded ? 'Sembunyikan Sebagian ↑' : 'Baca Selengkapnya ↓'}
                                    </button>
                                )}
                            </div>
                        </section>

                        {/* 2. ULASAN & RATING */}
                        <section>
                            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                                <MessageSquare className="text-[#00478F]" size={20} /> Ulasan Pembeli ({reviews.length})
                            </h3>

                            {/* FORM ULASAN (Bisa Upload Gambar) */}
                            {canReview && (
                                <form onSubmit={handleSubmitReview} className="bg-[#00478F] p-8 md:p-10 rounded-[2.5rem] text-white shadow-2xl mb-8">
                                    <h4 className="text-xl font-black mb-2">Barang sudah sampai? Beri ulasan!</h4>
                                    <p className="text-blue-200 text-sm mb-6 font-medium">Ulasan Anda membantu mahasiswa lain berbelanja dengan aman.</p>
                                    
                                    <div className="space-y-6">
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-blue-300 mb-2">Rating Bintang</label>
                                            <div className="flex gap-4">
                                                {[1,2,3,4,5].map(num => (
                                                    <button key={num} type="button" onClick={() => setRatingForm(num)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${ratingForm >= num ? 'bg-[#FF9500] text-white scale-110 shadow-lg' : 'bg-white/10 text-white hover:bg-white/20'}`}>
                                                        <Star size={20} fill={ratingForm >= num ? "currentColor" : "none"} />
                                                    </button>
                                                ))}
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-blue-300 mb-2">Tulis Pengalamanmu</label>
                                            <textarea required value={commentForm} onChange={(e) => setCommentForm(e.target.value)} className="w-full p-5 rounded-2xl bg-white/10 border border-white/10 text-white outline-none focus:ring-2 focus:ring-[#FF9500] placeholder:text-blue-300/50" placeholder="Contoh: Kondisi barang mulus, original, mantap!" rows="3"></textarea>
                                        </div>
                                        
                                        {/* UPLOAD GAMBAR REVIEW (ALA SHOPEE) */}
                                        <div>
                                            <label className="block text-[10px] font-black uppercase text-blue-300 mb-2">Upload Foto (Maks 5)</label>
                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                {reviewImages.map((img, idx) => (
                                                    <div key={idx} className="relative w-16 h-16 shrink-0 rounded-xl overflow-hidden group">
                                                        <img src={img.preview} alt="preview" className="w-full h-full object-cover" />
                                                        <button type="button" onClick={() => removeReviewImage(idx)} className="absolute inset-0 bg-black/50 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><X size={16}/></button>
                                                    </div>
                                                ))}
                                                {reviewImages.length < 5 && (
                                                    <label className="w-16 h-16 shrink-0 border-2 border-dashed border-white/30 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:bg-white/10 transition-colors">
                                                        <ImagePlus size={20} className="text-white/50" />
                                                        <input type="file" multiple accept="image/*" onChange={handleAddReviewImages} className="hidden" />
                                                    </label>
                                                )}
                                            </div>
                                        </div>

                                        <button type="submit" disabled={submittingReview} className="w-full bg-[#FF9500] text-white font-black py-4 rounded-2xl hover:bg-white hover:text-[#FF9500] uppercase text-xs transition-all tracking-widest">{submittingReview ? 'Mengirim...' : 'Kirim Ulasan'}</button>
                                    </div>
                                </form>
                            )}

                            {/* DAFTAR RIWAYAT ULASAN */}
                            <div className="space-y-4">
                                {reviews.length === 0 ? (
                                    <div className="p-10 text-center border-2 border-dashed border-slate-200 rounded-[2rem]">
                                        <p className="text-slate-400 font-bold italic">Belum ada ulasan untuk barang ini.</p>
                                    </div>
                                ) : (
                                    reviews.map((rev) => (
                                        <div key={rev._id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden">
                                            <div className="flex items-center gap-4 mb-4">
                                                <img src={rev.buyerId?.profilePicture || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover border border-slate-100" alt="" />
                                                <div>
                                                    <p className="font-black text-slate-800 text-sm">{rev.buyerId?.name || 'Pembeli'}</p>
                                                    <div className="flex text-[#FF9500] mt-1">
                                                        {[...Array(5)].map((_, i) => (<Star key={i} size={12} fill={i < rev.rating ? "#FF9500" : "none"} strokeWidth={2.5} />))}
                                                    </div>
                                                </div>
                                                <span className="ml-auto text-[10px] text-slate-400 font-bold bg-slate-50 px-2 py-1 rounded-md">{new Date(rev.createdAt).toLocaleDateString('id-ID')}</span>
                                            </div>
                                            
                                            <p className="text-slate-600 italic leading-relaxed text-sm font-medium mb-4">"{rev.comment}"</p>
                                            
                                            {/* TAMPILKAN GAMBAR ULASAN */}
                                            {rev.images && rev.images.length > 0 && (
                                                <div className="flex gap-2 overflow-x-auto pb-2">
                                                    {rev.images.map((img, idx) => (
                                                        <img 
                                                            key={idx} 
                                                            src={img} 
                                                            alt="Foto Ulasan" 
                                                            className="w-20 h-20 rounded-xl object-cover border border-slate-200 shrink-0 cursor-pointer hover:scale-105 transition-transform" 
                                                            onClick={() => window.open(img, '_blank')} 
                                                        />
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))
                                )}
                            </div>
                        </section>
                    </div>

                    <div className="lg:col-span-5">
                        <div className="bg-[#FF9500] p-8 rounded-[2.5rem] text-white relative overflow-hidden sticky top-24">
                            <h4 className="text-xl font-black mb-2 relative z-10">Keamanan Escrow</h4>
                            <p className="text-orange-100 text-sm font-medium relative z-10 mb-6">Uang Anda aman dan hanya akan cair ke penjual setelah Anda mengkonfirmasi barang diterima dengan baik.</p>
                            <ShieldCheck size={120} className="absolute -bottom-8 -right-8 text-white/20 rotate-12" />
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}