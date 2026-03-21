import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { 
    Search, MapPin, Sparkles, 
    ArrowRight, SlidersHorizontal, PackageSearch
} from 'lucide-react';

export default function Home() {
    const [products, setProducts] = useState([]);
    
    // STATE KATEGORI DARI DATABASE
    const [dbCategories, setDbCategories] = useState([]);
    const [activeCategory, setActiveCategory] = useState('Semua');
    
    const [loading, setLoading] = useState(true);
    const { user } = useAuthStore();

    useEffect(() => {
        const fetchData = async () => {
            try {
                // Fetch Produk
                const productRes = await api.get('/products');
                setProducts(productRes.data.data);

                // Fetch Kategori dari Admin (Database)
                const categoryRes = await api.get('/categories');
                setDbCategories(categoryRes.data.data);
            } catch (error) {
                console.error('Gagal memuat data utama', error);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, []);

    if (loading) return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#F8FAFC]">
            <div className="relative w-16 h-16">
                <div className="absolute inset-0 rounded-full border-4 border-slate-200"></div>
                <div className="absolute inset-0 rounded-full border-4 border-[#00478F] border-t-transparent animate-spin"></div>
            </div>
            <p className="mt-6 font-black text-slate-400 tracking-[0.2em] text-[10px] uppercase">Memuat Katalog...</p>
        </div>
    );

    // Gabungkan "Semua" dengan kategori dari Database
    const categories = ['Semua', ...dbCategories.map(c => c.name)];

    // Sembunyikan barang milik sendiri
    const catalogProducts = products.filter(p => {
        const sellerId = p.sellerId?._id || p.sellerId;
        const myId = user?.id || user?._id;
        return sellerId !== myId;
    });

    // Terapkan Filter Kategori
    const displayedProducts = activeCategory === 'Semua' 
        ? catalogProducts 
        : catalogProducts.filter(p => p.category === activeCategory);

    const ProductCard = ({ product }) => (
        <div className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:shadow-[#00478F]/10 hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">
            <div className="relative overflow-hidden aspect-[4/5] bg-slate-50">
                {product.isPremium && (
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2">
                        <span className="bg-[#FF9500] text-white text-[10px] font-black px-3 py-1.5 rounded-xl shadow-lg flex items-center gap-1.5 uppercase tracking-wider backdrop-blur-md">
                            <Sparkles size={12} /> Hot Item
                        </span>
                    </div>
                )}
                <Link to={`/product/${product._id}`}>
                    <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" />
                </Link>
                <div className="absolute inset-0 bg-[#00478F]/20 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center pointer-events-none backdrop-blur-[2px]">
                    <span className="bg-white text-[#00478F] px-6 py-3 rounded-full font-black text-[10px] uppercase tracking-widest transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500 shadow-xl">
                        Lihat Detail
                    </span>
                </div>
            </div>
            
            <div className="p-6 flex flex-col flex-1">
                <div className="flex justify-between items-center mb-3">
                    <span className="text-[10px] font-black text-[#FF9500] uppercase tracking-widest bg-[#FF9500]/10 px-2 py-1 rounded-md">
                        {product.category}
                    </span>
                    <span className="flex items-center gap-1 text-slate-400 text-[10px] font-bold truncate max-w-[50%]">
                        <MapPin size={12} className="shrink-0" /> {product.sellerId?.domisili || 'Area Kampus'}
                    </span>
                </div>
                
                <Link to={`/product/${product._id}`}>
                    <h3 className="font-black text-slate-800 text-base line-clamp-2 leading-snug group-hover:text-[#00478F] transition-colors mb-4">{product.title}</h3>
                </Link>
                
                <div className="mt-auto flex items-center justify-between pt-5 border-t border-slate-100">
                    <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-0.5">Harga</span>
                        <span className="font-black text-[#00478F] text-lg leading-none">Rp{product.price.toLocaleString('id-ID')}</span>
                    </div>
                    <Link to={`/checkout/${product._id}`} className="w-12 h-12 flex items-center justify-center bg-[#00478F] text-white rounded-2xl hover:bg-[#FF9500] hover:scale-105 active:scale-95 transition-all shadow-lg shadow-blue-900/20">
                        <ArrowRight size={20} />
                    </Link>
                </div>
            </div>
        </div>
    );

    return (
        <div className="min-h-screen bg-[#F8FAFC]">
            {/* HERO SECTION */}
            <header className="relative bg-[#00478F] pt-24 pb-40 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-[30rem] h-[30rem] bg-[#FF9500]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/3"></div>
                <div className="absolute bottom-0 left-0 w-80 h-80 bg-white/10 rounded-full blur-[80px] -translate-x-1/4 translate-y-1/4"></div>

                <div className="max-w-5xl mx-auto relative z-10 text-center">
                    <h1 className="text-5xl md:text-7xl font-black text-white mb-6 tracking-tight leading-tight mt-4">
                        Campus Thrift <span className="text-[#FF9500]">Hub.</span>
                    </h1>
                    <p className="text-blue-100/90 max-w-2xl mx-auto mb-12 font-medium text-base md:text-lg leading-relaxed">
                        Platform marketplace eksklusif untuk mahasiswa. Temukan barang pre-loved berkualitas atau ubah barang tak terpakaimu menjadi uang tunai dengan sistem transaksi Escrow yang 100% aman.
                    </p>

                    <div className="max-w-3xl mx-auto relative group">
                        <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none text-slate-400 group-focus-within:text-[#00478F] transition-colors">
                            <Search size={24} />
                        </div>
                        <input type="text" placeholder="Cari sneakers, buku, atau hoodie favoritmu..." className="w-full pl-16 pr-36 py-6 bg-white rounded-full shadow-2xl shadow-[#00478F]/50 text-slate-900 font-bold focus:outline-none focus:ring-4 focus:ring-[#FF9500]/30 transition-all text-base md:text-lg" />
                        <button className="absolute right-3 top-3 bottom-3 px-8 bg-[#FF9500] text-white font-black rounded-full hover:bg-slate-900 transition-all shadow-lg text-sm md:text-base tracking-wide">
                            Temukan
                        </button>
                    </div>
                </div>
            </header>

            {/* FILTER KATEGORI */}
            <div className="max-w-7xl mx-auto px-6 -translate-y-16 relative z-20">
                <div className="bg-white p-4 rounded-[2rem] shadow-xl shadow-slate-200/50 flex flex-wrap items-center justify-between gap-4 border border-slate-50">
                    <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 md:pb-0 scroll-smooth flex-1">
                        {categories.map((cat) => (
                            <button 
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-6 py-3.5 rounded-xl text-xs font-black transition-all whitespace-nowrap ${
                                    activeCategory === cat 
                                    ? 'bg-[#00478F] text-white shadow-lg shadow-blue-900/20' 
                                    : 'text-slate-500 bg-slate-50 hover:bg-slate-100 hover:text-slate-900'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>
                    <button className="hidden lg:flex items-center gap-3 px-6 py-3.5 bg-slate-50 rounded-xl text-slate-600 font-black text-xs uppercase tracking-wider hover:bg-slate-100 transition-all border border-slate-200">
                        <SlidersHorizontal size={16} className="text-[#00478F]" /> Filter Lanjutan
                    </button>
                </div>
            </div>

            {/* MAIN CATALOG CONTENT */}
            <main className="max-w-7xl mx-auto px-6 pb-32">
                <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4 mt-8">
                    <div className="flex items-center gap-4">
                        <div className="w-14 h-14 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center text-[#FF9500] shadow-inner">
                            <PackageSearch size={28} strokeWidth={2.5} />
                        </div>
                        <div>
                            <h2 className="text-3xl font-black text-slate-900 tracking-tight">Eksplorasi Katalog</h2>
                            <p className="text-slate-500 text-sm font-medium mt-1">Koleksi barang thrift terkurasi dari mahasiswa lain.</p>
                        </div>
                    </div>
                </div>

                {displayedProducts.length === 0 ? (
                    <div className="bg-white rounded-[3rem] p-24 text-center border border-slate-100 shadow-sm">
                        <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Search size={40} className="text-slate-300" />
                        </div>
                        <h3 className="text-2xl font-black text-slate-800 tracking-tight">Belum ada barang di kategori ini</h3>
                        <p className="text-slate-500 mt-2 font-medium">Coba cari kategori lain atau jadilah yang pertama menjualnya!</p>
                        <button onClick={() => setActiveCategory('Semua')} className="inline-block mt-8 px-8 py-4 bg-[#00478F] text-white font-black rounded-2xl hover:bg-[#FF9500] transition-colors shadow-lg">
                            Tampilkan Semua Barang
                        </button>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                        {displayedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                    </div>
                )}
            </main>
        </div>
    );
}