import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { MapPin, School, Star, ShieldCheck, ArrowRight, Edit, PackageSearch, PlusCircle, MessageSquare } from 'lucide-react';

export default function SellerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]); // State untuk menampung ulasan
    const [loading, setLoading] = useState(true);
    
    const [activeCategory, setActiveCategory] = useState('Semua');

    const isMyProfile = user?.id === id || user?._id === id;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/seller/${id}`);
                setSeller(response.data.data.profile);
                setProducts(response.data.data.products);
                setReviews(response.data.data.reviews || []); // Ambil ulasan dari backend
            } catch (error) {
                console.error("Gagal memuat profil seller", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div>
        </div>
    );
    
    if (!seller) return <div className="text-center mt-20 font-black text-slate-400">Pengguna tidak ditemukan.</div>;

    const availableCategories = ['Semua', ...new Set(products.map(p => p.category))];
    const displayedProducts = activeCategory === 'Semua' ? products : products.filter(p => p.category === activeCategory);

    // ==========================================
    // KOMPONEN PRODUCT CARD
    // ==========================================
    const ProductCard = ({ product }) => {
        const isSoldOut = product.status !== 'Tersedia';
        const statusLabel = (product.status === 'Terjual' || product.status === 'Selesai') ? 'TERJUAL' : 'DIBOOKING';

        return (
            <div className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">
                <div className="relative overflow-hidden aspect-[4/5] bg-slate-50">
                    {/* Tombol Edit */}
                    {isMyProfile && !isSoldOut && (
                        <Link to={`/edit-product/${product._id}`} className="absolute top-4 right-4 bg-white/90 text-[#FF9500] p-3 rounded-2xl shadow-lg hover:bg-[#FF9500] hover:text-white transition-all z-20">
                            <Edit size={18} />
                        </Link>
                    )}
                    
                    {/* Overlay Terjual */}
                    {isSoldOut && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <span className="bg-slate-800 text-white px-6 py-2 rounded-xl font-black tracking-widest shadow-lg rotate-[-10deg] text-xl border-2 border-slate-600">
                                {statusLabel}
                            </span>
                        </div>
                    )}
                    
                    {/* Gambar Produk */}
                    <Link to={`/product/${product._id}`}>
                        <img 
                            src={(product.images && product.images.length > 0) ? product.images[0] : product.imageUrl} 
                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-70' : ''}`} 
                            alt={product.title} 
                        />
                    </Link>
                </div>
                
                <div className="p-6 flex flex-col flex-1 z-20 bg-white">
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md w-max mb-3 ${isSoldOut ? 'bg-slate-100 text-slate-400' : 'bg-[#FF9500]/10 text-[#FF9500]'}`}>
                        {product.category}
                    </span>
                    <Link to={`/product/${product._id}`}>
                        <h3 className={`font-black text-base line-clamp-2 mb-4 ${isSoldOut ? 'text-slate-400' : 'text-slate-800 hover:text-[#00478F]'}`}>
                            {product.title}
                        </h3>
                    </Link>
                    <div className="mt-auto flex justify-between pt-5 border-t border-slate-100">
                        <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga</span>
                            <span className={`font-black text-lg ${isSoldOut ? 'text-slate-400' : 'text-[#00478F]'}`}>
                                Rp{product.price.toLocaleString('id-ID')}
                            </span>
                        </div>
                    </div>
                    
                    {/* TOMBOL IKLANKAN LAGI */}
                    {isMyProfile && isSoldOut && (
                        <div className="mt-4 pt-4 border-t border-slate-100">
                            <Link to={`/edit-product/${product._id}`} className="w-full py-3 bg-white text-[#00478F] border-2 border-[#00478F] flex justify-center items-center gap-2 font-black rounded-xl hover:bg-[#00478F] hover:text-white text-xs uppercase transition-colors">
                                <PlusCircle size={16} /> Iklankan Lagi
                            </Link>
                        </div>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* HEADER PROFIL */}
            <div className="bg-[#00478F] pt-20 pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FF9500]/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
                    <img src={seller.profilePicture || `https://ui-avatars.com/api/?name=${seller.name}`} alt={seller.name} className="w-32 h-32 rounded-full object-cover ring-4 ring-white/20 shadow-2xl mb-6 bg-white" />
                    <h1 className="text-4xl font-black text-white mb-2 flex items-center justify-center gap-2">
                        {seller.name} {seller.isVerified && <ShieldCheck className="text-blue-300" size={24}/>}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-blue-100 font-medium text-sm">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10"><School size={16} /> {seller.campus}</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10"><MapPin size={16} /> {seller.domisili}</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 text-[#FF9500] font-black">
                            <Star size={16} fill="#FF9500"/> {seller.rating?.toFixed(1) || '0.0'} / 5.0
                        </span>
                    </div>
                    {isMyProfile && (
                        <button onClick={() => navigate('/my-profile')} className="mt-8 px-8 py-3 bg-white/10 backdrop-blur-md text-white font-black rounded-full border border-white/20 hover:bg-white hover:text-[#00478F] text-xs uppercase shadow-lg transition-all hover:scale-105 active:scale-95">
                            Pengaturan Akun & Rekening
                        </button>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 -translate-y-16 relative z-20 space-y-8">
                
                {/* SECTION 1: LAPAK SAYA */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center text-[#FF9500]"><PackageSearch size={28} /></div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Lapak {isMyProfile ? 'Saya' : seller.name.split(' ')[0]}</h2>
                                <p className="text-slate-500 text-sm">Total {products.length} barang di etalase.</p>
                            </div>
                        </div>
                        {isMyProfile && (
                            <Link to="/upload" className="flex items-center justify-center gap-2 bg-[#00478F] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#FF9500] transition-colors shadow-lg">
                                <PlusCircle size={18} /> Tambah Barang
                            </Link>
                        )}
                    </div>

                    {products.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto mb-8 pb-2">
                            {availableCategories.map((cat) => (
                                <button 
                                    key={cat} 
                                    onClick={() => setActiveCategory(cat)} 
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#00478F] text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {products.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <PackageSearch size={32} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold text-lg">Belum ada barang yang dijual saat ini.</p>
                            {isMyProfile && <Link to="/upload" className="inline-block mt-4 text-[#FF9500] font-black hover:text-[#00478F] transition-colors underline underline-offset-4">Mulai Jual Barang Pertamamu</Link>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {displayedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                        </div>
                    )}
                </div>

                {/* SECTION 2: KUMPULAN ULASAN & RATING TOKO */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Ulasan & Rating Toko</h2>
                            <p className="text-slate-500 text-sm flex items-center gap-1 font-bold mt-1">
                                Total <Star size={14} fill="#FF9500" className="text-[#FF9500]"/> {seller.rating?.toFixed(1) || '0.0'} dari {reviews.length} Ulasan
                            </p>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Toko ini belum memiliki ulasan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((rev) => (
                                <div key={rev._id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col">
                                    
                                    {/* Info Pembeli & Waktu */}
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={rev.buyerId?.profilePicture || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover" alt=""/>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 text-sm leading-tight">{rev.buyerId?.name || 'Pembeli'}</p>
                                            <div className="flex text-[#FF9500] mt-1">
                                                {[...Array(5)].map((_, i) => (<Star key={i} size={10} fill={i < rev.rating ? "#FF9500" : "none"} strokeWidth={2.5}/>))}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(rev.createdAt).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    
                                    {/* Info Produk Yang Di-Review */}
                                    <Link to={`/product/${rev.productId?._id}`} className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-3 mb-3 hover:border-[#00478F] transition-colors group">
                                        <img 
                                            src={(rev.productId?.images && rev.productId.images.length > 0) ? rev.productId.images[0] : rev.productId?.imageUrl} 
                                            className="w-10 h-10 rounded-lg object-cover bg-slate-100" 
                                            alt=""
                                        />
                                        <p className="text-xs font-bold text-slate-600 line-clamp-1 group-hover:text-[#00478F]">
                                            {rev.productId?.title || 'Produk Dihapus'}
                                        </p>
                                    </Link>

                                    {/* Komentar */}
                                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic">"{rev.comment}"</p>

                                    {/* Gambar Ulasan */}
                                    {rev.images && rev.images.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                                            {rev.images.map((img, idx) => (
                                                <img 
                                                    key={idx} 
                                                    src={img} 
                                                    alt="Foto Ulasan" 
                                                    className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 hover:scale-105 cursor-pointer transition-transform" 
                                                    onClick={() => window.open(img, '_blank')} 
                                                />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>

            </main>
        </div>
    );
}