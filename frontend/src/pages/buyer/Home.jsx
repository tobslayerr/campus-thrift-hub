import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { 
    Search, MapPin, School, 
    ChevronDown, Filter, Sparkles, 
    ArrowRight, Tag, SlidersHorizontal 
} from 'lucide-react';

export default function Home() {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();
    
    // State untuk Dummy Filter (UI Only)
    const categories = ['Semua', 'Pakaian', 'Elektronik', 'Buku', 'Alat Tulis', 'Hobi'];
    const [activeCategory, setActiveCategory] = useState('Semua');

    useEffect(() => {
        const fetchProducts = async () => {
            try {
                const response = await api.get('/products');
                setProducts(response.data.data);
            } catch (error) {
                console.error('Gagal mengambil data produk', error);
            } finally {
                setLoading(false);
            }
        };
        fetchProducts();
    }, []);

    // Loader Elegan
    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-[60vh]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-100"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#00478F] border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 font-bold text-slate-400 tracking-widest text-[10px] uppercase">Curating Campus Trends...</p>
        </div>
    );

    // Filter barang: milik sendiri vs milik orang lain
    const myProducts = products.filter(p => p.sellerId === user?.id);
    const otherProducts = products.filter(p => p.sellerId !== user?.id);

    const ProductCard = ({ product, isMine }) => (
        <div className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-[#00478F]/10 transition-all duration-500 flex flex-col h-full">
            <div className="relative overflow-hidden aspect-[4/5]">
                {/* Badge Status */}
                <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                    {product.isPremium && (
                        <span className="bg-[#FF9500] text-white text-[10px] font-black px-3 py-1 rounded-full shadow-lg flex items-center gap-1 uppercase tracking-wider">
                            <Sparkles size={10} /> Hot Item
                        </span>
                    )}
                </div>

                <Link to={`/product/${product._id}`}>
                    <img 
                        src={product.imageUrl} 
                        alt={product.title} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                    />
                </Link>

                {/* Quick Action Overlay */}
                <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none">
                    <span className="bg-white text-[#00478F] px-6 py-2 rounded-full font-black text-[10px] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                        Lihat Detail
                    </span>
                </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                    <span className="text-[10px] font-black text-[#FF9500] uppercase tracking-widest">{product.category}</span>
                    <span className="flex items-center gap-1 text-slate-400 text-[9px] font-bold">
                        <MapPin size={10} /> {product.sellerId?.domisili || 'Area Kampus'}
                    </span>
                </div>
                
                <Link to={`/product/${product._id}`}>
                    <h3 className="font-bold text-slate-800 text-sm md:text-base line-clamp-2 leading-tight hover:text-[#00478F] transition-colors mb-4">
                        {product.title}
                    </h3>
                </Link>
                
                <div className="mt-auto flex items-center justify-between pt-4 border-t border-slate-50">
                    <span className="font-black text-[#00478F] text-lg">
                        Rp{product.price.toLocaleString('id-ID')}
                    </span>
                    <Link 
                        to={isMine ? `/product/${product._id}` : `/checkout/${product._id}`}
                        className={`p-3 rounded-xl transition-all ${isMine ? 'bg-slate-100 text-slate-400' : 'bg-[#00478F] text-white hover:bg-[#FF9500]'}`}
                    >
                        <ArrowRight size={18} />
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            
            {/* --- HERO SECTION: MODERN & BOLD --- */}
            <header className="relative bg-[#00478F] pt-24 pb-36 px-6 overflow-hidden">
                {/* Dekorasi Background Bulat */}
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9500]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>

                <div className="max-w-7xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-[1.1]">
                        Gaya Kampus, <br />
                        <span className="text-[#FF9500]">Harga Mahasiswa.</span>
                    </h1>
                    <p className="text-blue-100 max-w-2xl mx-auto mb-12 font-medium opacity-80 text-sm md:text-base">
                        Marketplace terpercaya antar mahasiswa. Temukan barang thrift berkualitas atau jual barang tak terpakaimu dengan aman lewat sistem Escrow.
                    </p>

                    {/* SEARCH BAR MODERN */}
                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#FF9500] transition-colors">
                            <Search size={24} />
                        </div>
                        <input 
                            type="text" 
                            placeholder="Cari sneakers, buku, atau hoodie favoritmu..." 
                            className="w-full pl-16 pr-32 py-6 bg-white rounded-[2.5rem] shadow-2xl shadow-blue-900/40 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-[#FF9500]/30 transition-all text-lg"
                        />
                        <button className="absolute right-3 top-3 bottom-3 px-8 bg-[#FF9500] text-white font-black rounded-full hover:bg-[#00478F] transition-all shadow-lg text-sm">
                            Cari
                        </button>
                    </div>
                </div>
            </header>

            {/* --- FILTER & CATEGORY BAR (STICKY STYLE) --- */}
            <div className="max-w-7xl mx-auto px-6 -translate-y-12">
                <div className="bg-white p-4 rounded-[2.5rem] shadow-xl shadow-slate-200/50 flex flex-wrap items-center justify-between gap-4">
                    {/* Kategori Horizontal */}
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth">
                        {categories.map((cat) => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3 rounded-full text-xs font-black transition-all whitespace-nowrap ${
                                    activeCategory === cat 
                                    ? 'bg-[#00478F] text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-slate-400 hover:bg-slate-50'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    {/* Filter Dropdown Dummy */}
                    <div className="flex items-center gap-2">
                        <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl text-slate-600 font-bold text-[10px] uppercase tracking-wider border border-slate-100 cursor-pointer hover:bg-white transition-all">
                            <School size={14} className="text-[#00478F]" />
                            <span>Universitas</span>
                            <ChevronDown size={14} />
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl text-slate-600 font-bold text-[10px] uppercase tracking-wider border border-slate-100 cursor-pointer hover:bg-white transition-all">
                            <Tag size={14} className="text-[#FF9500]" />
                            <span>Range Harga</span>
                            <ChevronDown size={14} />
                        </div>
                        <div className="hidden lg:flex items-center gap-2 px-4 py-3 bg-slate-50 rounded-2xl text-slate-600 font-bold text-[10px] uppercase tracking-wider border border-slate-100 cursor-pointer hover:bg-white transition-all">
                            <MapPin size={14} className="text-slate-400" />
                            <span>Jarak</span>
                            <ChevronDown size={14} />
                        </div>
                        <button className="p-3 bg-slate-900 text-white rounded-2xl hover:bg-[#FF9500] transition-all">
                            <SlidersHorizontal size={20} />
                        </button>
                    </div>
                </div>
            </div>

            {/* --- MAIN CONTENT --- */}
            <main className="max-w-7xl mx-auto px-6 pb-32">
                
                {/* --- SECTION 1: BARANG JUALAN SAYA --- */}
                {myProducts.length > 0 && (
                    <section className="mb-20">
                        <div className="flex items-center gap-3 mb-10">
                            <div className="w-12 h-12 bg-[#00478F]/10 rounded-2xl flex items-center justify-center text-[#00478F]">
                                <Tag size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Barang Jualan Saya</h2>
                                <p className="text-slate-400 text-sm font-medium">Lacak dan kelola produk yang sedang Anda tawarkan.</p>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {myProducts.map((product) => (
                                <ProductCard key={product._id} product={product} isMine={true} />
                            ))}
                        </div>
                    </section>
                )}

                {/* --- SECTION 2: KATALOG UTAMA --- */}
                <section>
                    <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center text-[#FF9500]">
                                <Sparkles size={24} />
                            </div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 tracking-tight">Terbaru di Kampus</h2>
                                <p className="text-slate-400 text-sm font-medium">Koleksi terkurasi dari mahasiswa di sekitarmu.</p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2 text-xs font-black text-[#00478F] hover:underline cursor-pointer group uppercase tracking-widest">
                            Lihat Semua <ArrowRight size={14} className="group-hover:translate-x-1 transition-transform" />
                        </div>
                    </div>

                    {otherProducts.length === 0 ? (
                        <div className="bg-white rounded-[3rem] p-20 text-center border border-slate-100 shadow-sm">
                            <div className="bg-slate-50 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-6">
                                <Search size={32} className="text-slate-200" />
                            </div>
                            <h3 className="text-xl font-black text-slate-800 tracking-tight">Katalog masih kosong</h3>
                            <p className="text-slate-400 mt-2 font-medium">Jadilah pionir jualan di kampusmu hari ini!</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-8">
                            {otherProducts.map((product) => (
                                <ProductCard key={product._id} product={product} isMine={false} />
                            ))}
                        </div>
                    )}
                </section>
            </main>

            {/* --- CTA BANNER --- */}
            <section className="max-w-7xl mx-auto px-6 pb-20">
                <div className="bg-slate-900 rounded-[3rem] p-12 relative overflow-hidden flex flex-col md:flex-row items-center justify-between text-white">
                    <div className="relative z-10 text-center md:text-left mb-8 md:mb-0">
                        <h2 className="text-3xl font-black mb-4 tracking-tight">Ingin barangmu cepat laku?</h2>
                        <p className="font-medium text-slate-400 max-w-md">Gunakan fitur promosi premium untuk menampilkan barangmu di baris teratas pencarian kampus.</p>
                    </div>
                    <Link to="/upload" className="relative z-10 px-10 py-5 bg-[#FF9500] text-brand-dark font-black rounded-2xl hover:bg-white transition-all shadow-xl shadow-orange-900/20 active:scale-95">
                        Mulai Jual Barang
                    </Link>
                    {/* Hiasan */}
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2"></div>
                </div>
            </section>
        </div>
    );
}