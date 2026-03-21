import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { MapPin, School, Star, ShieldCheck, ArrowRight, Edit, PackageSearch, PlusCircle } from 'lucide-react';

export default function SellerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // STATE UNTUK KATEGORI FILTER
    const [activeCategory, setActiveCategory] = useState('Semua');

    const isMyProfile = user?.id === id || user?._id === id;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/seller/${id}`);
                setSeller(response.data.data.profile);
                setProducts(response.data.data.products);
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
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );
    
    if (!seller) return <div className="text-center mt-20 font-black text-slate-400">Pengguna tidak ditemukan.</div>;

    // LOGIKA PINTAR: Mengambil kategori unik HANYA dari barang yang dijual seller ini
    const availableCategories = ['Semua', ...new Set(products.map(p => p.category))];
    
    // Logika Filter Produk yang Ditampilkan
    const displayedProducts = activeCategory === 'Semua' 
        ? products 
        : products.filter(p => p.category === activeCategory);

    const ProductCard = ({ product }) => (
        <div className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-[#00478F]/10 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">
            <div className="relative overflow-hidden aspect-[4/5] bg-slate-50">
                {isMyProfile && (
                    <Link 
                        to={`/edit-product/${product._id}`} 
                        className="absolute top-4 right-4 bg-white/90 backdrop-blur-md text-[#FF9500] p-3 rounded-2xl shadow-lg hover:bg-[#FF9500] hover:text-white transition-all z-20 hover:scale-110" 
                        title="Edit Barang Ini"
                    >
                        <Edit size={18} />
                    </Link>
                )}
                <Link to={`/product/${product._id}`}>
                    <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                </Link>
                <div className="absolute inset-0 bg-[#00478F]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none backdrop-blur-[2px] z-10">
                    <span className="bg-white text-[#00478F] px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                        Lihat Detail
                    </span>
                </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
                <span className="text-[10px] font-black text-[#FF9500] uppercase tracking-widest bg-[#FF9500]/10 px-2 py-1 rounded-md w-max mb-3">
                    {product.category}
                </span>
                <Link to={`/product/${product._id}`}>
                    <h3 className="font-black text-slate-800 text-base line-clamp-2 leading-snug group-hover:text-[#00478F] transition-colors mb-4">
                        {product.title}
                    </h3>
                </Link>
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Harga</span>
                        <span className="font-black text-[#00478F] text-lg leading-none">
                            Rp{product.price.toLocaleString('id-ID')}
                        </span>
                    </div>
                    <Link 
                        to={`/product/${product._id}`} 
                        className="w-12 h-12 flex items-center justify-center bg-slate-50 text-slate-400 rounded-2xl hover:bg-[#00478F] hover:text-white transition-colors"
                    >
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* HEADER PROFIL */}
            <div className="bg-[#00478F] pt-20 pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FF9500]/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
                    <img src={seller.profilePicture || `https://ui-avatars.com/api/?name=${seller.name || 'User'}&background=f1f5f9&color=00478F`} alt={seller.name} className="w-32 h-32 rounded-full object-cover ring-4 ring-white/20 shadow-2xl mb-6 bg-white" />
                    <h1 className="text-4xl font-black text-white mb-2 flex items-center gap-2 justify-center tracking-tight">
                        {seller.name} {seller.isVerified && <ShieldCheck className="text-blue-300" size={24} title="Terverifikasi" />}
                    </h1>
                    <div className="flex flex-wrap justify-center items-center gap-4 text-blue-100 font-medium text-sm">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm"><School size={16} /> {seller.campus || 'Kampus tidak diketahui'}</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm"><MapPin size={16} /> {seller.domisili || 'Lokasi rahasia'}</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 backdrop-blur-sm text-[#FF9500] font-black"><Star size={16} fill="#FF9500"/> {seller.rating?.toFixed(1) || '5.0'}</span>
                    </div>

                    {isMyProfile && (
                        <button onClick={() => navigate('/my-profile')} className="mt-8 px-8 py-3 bg-white/10 backdrop-blur-md text-white border border-white/20 font-black rounded-full hover:bg-white hover:text-[#00478F] transition-all text-xs uppercase tracking-widest shadow-lg hover:scale-105 active:scale-95">
                            Pengaturan Akun & Rekening
                        </button>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 -translate-y-16 relative z-20">
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center text-[#FF9500] shadow-inner">
                                <PackageSearch size={28} strokeWidth={2.5} />
                            </div>
                            <div>
                                <h2 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Lapak {isMyProfile ? 'Saya' : seller.name.split(' ')[0]}</h2>
                                <p className="text-slate-500 text-sm font-medium mt-1">Total {products.length} barang aktif dijual.</p>
                            </div>
                        </div>
                        {isMyProfile && (
                            <Link to="/upload" className="flex items-center gap-2 bg-[#00478F] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#FF9500] transition-colors shadow-lg shadow-blue-900/20">
                                <PlusCircle size={18} /> Tambah Barang
                            </Link>
                        )}
                    </div>

                    {/* FILTER KATEGORI DINAMIS */}
                    {products.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar mb-8 pb-2 border-b border-slate-100">
                            {availableCategories.map((cat) => (
                                <button 
                                    key={cat}
                                    onClick={() => setActiveCategory(cat)}
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black transition-all whitespace-nowrap mb-4 ${
                                        activeCategory === cat 
                                        ? 'bg-[#00478F] text-white shadow-lg shadow-blue-900/20' 
                                        : 'bg-slate-50 text-slate-500 hover:bg-slate-100 hover:text-slate-900 border border-slate-100'
                                    }`}
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
                            {displayedProducts.map((product) => (
                                <ProductCard key={product._id} product={product} />
                            ))}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}