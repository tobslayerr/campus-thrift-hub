import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { Search, MapPin, Star, Building, ChevronLeft, ChevronRight, X, ArrowRight, CheckCircle2, School, PackageSearch, Store } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuthStore(); 

    const [topShops, setTopShops] = useState([]);
    const [campusProducts, setCampusProducts] = useState([]); 
    const [loading, setLoading] = useState(true);

    const [searchKey, setSearchKey] = useState('');
    const [ratingFilter, setRatingFilter] = useState('0');
    const [campusFilter, setCampusFilter] = useState('Semua Kampus');

    const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
    const [campuses, setCampuses] = useState([]);
    const [campusPage, setCampusPage] = useState(1);
    const [campusSearch, setCampusSearch] = useState('');
    const campusesPerPage = 10;

    useEffect(() => {
        const fetchHomeData = async () => {
            try {
                const promises = [
                    api.get('/products/top-shops'),
                    api.get('/products/campuses')
                ];

                if (user && user.campus) {
                    promises.push(api.get(`/products?status=Tersedia&campus=${encodeURIComponent(user.campus)}&limit=4`));
                }

                const results = await Promise.all(promises);
                
                setTopShops(results[0].data.data);
                setCampuses(results[1].data.data);

                if (results.length > 2) {
                    setCampusProducts(results[2].data.data);
                }
            } catch (error) {
                console.error("Gagal memuat data home", error);
            } finally {
                setLoading(false);
            }
        };
        fetchHomeData();
    }, [user]);

    const handleSearchSubmit = (e) => {
        e.preventDefault();
        navigate(`/explore?search=${searchKey}&campus=${campusFilter}&minRating=${ratingFilter}`);
    };

    const filteredCampuses = campuses.filter(c => c.toLowerCase().includes(campusSearch.toLowerCase()));
    const totalCampusPages = Math.ceil(filteredCampuses.length / campusesPerPage);
    const displayedCampuses = filteredCampuses.slice((campusPage - 1) * campusesPerPage, campusPage * campusesPerPage);

    const renderProductCard = (product) => {
        const isMyProduct = user && (product.sellerId?._id === user.id || product.sellerId === user.id);

        return (
            <Link to={`/product/${product._id}`} key={product._id} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-200 hover:border-blue-200 hover:shadow-xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">
                <div className="relative overflow-hidden aspect-[4/5] bg-slate-50">
                    <div className="absolute top-4 left-4 z-10 flex flex-col gap-2 items-start">
                        <span className="bg-white/90 backdrop-blur-md text-[#00478F] px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest shadow-sm">
                            {product.category?.name || product.category || 'Barang'}
                        </span>
                        {isMyProduct && (
                            <span className="bg-[#FF9500] text-white px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                Milikmu
                            </span>
                        )}
                    </div>
                    <img 
                        src={product.images && product.images.length > 0 ? product.images[0] : product.imageUrl} 
                        className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" 
                        alt={product.title} 
                    />
                </div>
                
                <div className="p-5 flex flex-col flex-1">
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-3 group-hover:text-[#00478F] transition-colors leading-snug">
                        {product.title}
                    </h3>
                    <div className="mt-auto pt-4 border-t border-slate-100 flex items-end justify-between">
                        <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Harga</span>
                            <span className="font-black text-lg text-[#00478F] leading-none">Rp{product.price.toLocaleString('id-ID')}</span>
                        </div>
                    </div>
                    <div className="mt-3 flex items-center gap-1.5 text-[10px] font-bold text-slate-400">
                        <MapPin size={12} className="text-[#FF9500]" />
                        <span className="truncate">{product.sellerId?.campus || 'Kampus Rahasia'}</span>
                    </div>
                </div>
            </Link>
        );
    };

    if (loading) return <div className="flex justify-center items-center min-h-screen"><div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div></div>;

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            
            {/* HERO SECTION DENGAN SPASI NORMAL */}
            {/* PERBAIKAN: Menghapus pb-48 agar tidak terlalu tinggi di bawah filter box */}
            <div className="bg-[#00478F] pt-24 pb-20 px-4 relative overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full blur-[100px]"></div>
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-4 tracking-tight leading-tight">
                        Cari Barang Thrift dari <span className="text-[#FF9500]">Mahasiswa Terpercaya</span>
                    </h1>
                    <p className="text-blue-100 mb-10 font-medium">Temukan barang berkualitas dengan sistem keamanan Escrow 100%.</p>

                    {/* SMART FILTER BOX */}
                    <form onSubmit={handleSearchSubmit} className="bg-white p-3 md:p-4 rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-3 relative z-30 border border-slate-100">
                        <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-4 py-3 border border-transparent focus-within:border-blue-200 transition-colors">
                            <Search size={20} className="text-slate-400 mr-3 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Cari jaket, buku, sepatu..." 
                                value={searchKey} 
                                onChange={(e) => setSearchKey(e.target.value)}
                                className="w-full bg-transparent outline-none font-bold text-slate-800"
                            />
                        </div>

                        <div className="flex gap-3">
                            <button type="button" onClick={() => setIsCampusModalOpen(true)} className="flex items-center gap-2 bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 hover:bg-blue-50 transition-colors shrink-0">
                                <Building size={18} className="text-[#00478F] shrink-0" />
                                <span className="text-sm font-black text-slate-700 truncate max-w-[120px]">{campusFilter}</span>
                            </button>

                            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="bg-slate-50 px-5 py-3 rounded-2xl border border-slate-100 text-sm font-black text-slate-700 outline-none hover:bg-blue-50 transition-colors cursor-pointer appearance-none">
                                <option value="0">Semua Rating</option>
                                <option value="4">⭐ 4.0+</option>
                                <option value="4.5">⭐ 4.5+</option>
                                <option value="5">⭐ 5.0</option>
                            </select>
                        </div>

                        <button type="submit" className="bg-[#FF9500] text-white px-8 py-3.5 rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-600 transition-all shadow-lg active:scale-95 shrink-0">
                            Cari Barang
                        </button>
                    </form>
                </div>
            </div>

            {/* SECTIONS BAWAH - KONTEN UTAMA */}
            {/* PERBAIKAN: Menghapus -mt-20, memakai padding top yang natural agar spasi antar konten terjaga */}
            <div className="w-full bg-[#F8FAFC]">
                <div className="max-w-6xl mx-auto px-4 py-16 space-y-20">
                    
                    {/* ============================================== */}
                    {/* RAK: EKSKLUSIF KAMPUSMU                        */}
                    {/* ============================================== */}
                    {user && (
                        <div>
                            <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 px-2 gap-4">
                                <div>
                                    <h2 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                                        <div className="bg-white p-2 rounded-2xl shadow-sm border border-slate-200 w-12 h-12 flex items-center justify-center shrink-0">
                                            <School className="text-[#FF9500]" />
                                        </div>
                                        Eksklusif Kampusmu
                                    </h2>
                                    <p className="text-slate-500 text-sm font-medium mt-2">
                                        Barang incaran dari sesama anak <span className="font-bold text-slate-700">{user.campus}</span>
                                    </p>
                                </div>
                                
                                {campusProducts.length > 0 && (
                                    <Link to={`/explore?campus=${user.campus}`} className="text-[#00478F] font-black text-xs uppercase tracking-widest hover:text-[#FF9500] transition-colors bg-white px-5 py-3 rounded-xl hidden md:block shadow-sm border border-slate-200">
                                        Lihat Semua
                                    </Link>
                                )}
                            </div>

                            {/* EMPTY STATE EKSKLUSIF KAMPUS */}
                            {campusProducts.length === 0 ? (
                                <div className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center border border-slate-200 shadow-sm">
                                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                        <PackageSearch className="text-slate-300" size={36} />
                                    </div>
                                    <h3 className="text-xl font-black text-slate-800 mb-2">Belum ada barang di kampusmu</h3>
                                    <p className="text-slate-500 text-sm md:text-base mb-8 max-w-md mx-auto">Jadilah yang pertama berjualan dan tawarkan barang ke teman sekampusmu!</p>
                                    <Link to="/upload" className="inline-block bg-[#00478F] text-white px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-slate-900 transition-colors shadow-lg">
                                        Mulai Jual Barang
                                    </Link>
                                </div>
                            ) : (
                                <>
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
                                        {campusProducts.map(renderProductCard)}
                                    </div>
                                    <Link to={`/explore?campus=${user.campus}`} className="md:hidden block mt-6 text-center text-[#00478F] font-black text-xs uppercase tracking-widest bg-white px-4 py-4 rounded-xl shadow-sm border border-slate-200">
                                        Lihat Semua di Kampus
                                    </Link>
                                </>
                            )}
                        </div>
                    )}

                    {/* ============================================== */}
                    {/* RAK: TOP 5 SHOPS & CATALOG                     */}
                    {/* ============================================== */}
                    <div className="space-y-10">
                        <div className="flex items-center justify-between bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-200">
                            <div>
                                <h2 className="text-2xl font-black text-slate-900 flex items-center gap-3">
                                    <Star className="text-[#FF9500]" fill="currentColor"/> Top 5 Toko Terpopuler
                                </h2>
                                <p className="text-sm text-slate-500 font-medium mt-1">Berdasarkan akumulasi rating dan jumlah ulasan terbanyak.</p>
                            </div>
                            <button onClick={() => navigate('/explore')} className="hidden md:flex items-center gap-2 bg-[#00478F] text-white px-6 py-4 rounded-xl font-black text-sm hover:bg-slate-900 transition-colors shadow-lg shrink-0">
                                Eksplor Barang <ArrowRight size={16} />
                            </button>
                        </div>

                        {/* EMPTY STATE TOKO POPULER */}
                        {topShops.length === 0 ? (
                            <div className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center border border-slate-200 shadow-sm mt-4">
                                <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                                    <Store className="text-slate-300" size={36} />
                                </div>
                                <h3 className="text-xl font-black text-slate-800 mb-2">Toko Terpopuler Belum Tersedia</h3>
                                <p className="text-slate-500 text-sm md:text-base mb-8 max-w-md mx-auto">Jadilah penjual pertama yang mendapatkan rating tinggi dari pembeli!</p>
                                <Link to="/explore" className="inline-block bg-orange-50 text-[#FF9500] border border-orange-200 px-8 py-4 rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FF9500] hover:text-white transition-colors shadow-sm">
                                    Jelajahi Katalog Barang
                                </Link>
                            </div>
                        ) : (
                            <div className="space-y-12">
                                {topShops.map((shop, index) => {
                                    const isMyShop = user && (shop.seller._id === user.id || shop.seller === user.id);

                                    return (
                                        <div key={shop.seller._id} className={`bg-white rounded-[2.5rem] p-6 md:p-8 shadow-sm border transition-colors ${isMyShop ? 'border-[#FF9500] bg-orange-50/10' : 'border-slate-200'}`}>
                                            {/* Identitas Toko */}
                                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8 pb-6 border-b border-slate-100">
                                                <div className="flex items-center gap-4">
                                                    <div className="relative">
                                                        <span className="absolute -top-3 -left-3 w-8 h-8 bg-[#FF9500] text-white font-black flex items-center justify-center rounded-full border-4 border-white shadow-md">#{index + 1}</span>
                                                        <img src={shop.seller.profilePicture || 'https://via.placeholder.com/150'} className="w-16 h-16 rounded-full object-cover ring-2 ring-slate-100" alt={shop.seller.name} />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-lg font-black text-slate-900 flex items-center gap-1.5 flex-wrap">
                                                            {shop.seller.name} 
                                                            {shop.seller.isVerified && <CheckCircle2 className="text-blue-500 shrink-0" size={16}/>}
                                                            {isMyShop && (
                                                                <span className="bg-[#FF9500] text-white px-2 py-0.5 rounded-lg text-[9px] font-black uppercase tracking-widest ml-1 shadow-sm">Toko Anda</span>
                                                            )}
                                                        </h3>
                                                        <div className="flex items-center gap-3 text-[11px] font-bold text-slate-500 uppercase tracking-wider mt-1">
                                                            <span className="flex items-center gap-1"><MapPin size={12}/> {shop.seller.campus}</span>
                                                            <span className="flex items-center gap-1 text-[#FF9500]"><Star size={12} fill="currentColor"/> {shop.seller.rating?.toFixed(1) || 'N/A'}</span>
                                                        </div>
                                                    </div>
                                                </div>
                                                <button onClick={() => navigate(`/seller/${shop.seller._id}`)} className="text-[#00478F] font-black text-xs uppercase tracking-widest hover:underline underline-offset-4 self-end sm:self-auto bg-blue-50 px-4 py-2 rounded-lg sm:bg-transparent sm:p-0">
                                                    Kunjungi Toko
                                                </button>
                                            </div>

                                            {/* Daftar Produk Horizontal */}
                                            <div className="flex gap-4 overflow-x-auto pb-4 custom-scrollbar snap-x">
                                                {shop.products.map(product => (
                                                    <div key={product._id} onClick={() => navigate(`/product/${product._id}`)} className="snap-start shrink-0 w-[180px] md:w-[200px] bg-slate-50 rounded-3xl overflow-hidden border border-slate-200 hover:border-blue-300 hover:shadow-lg transition-all cursor-pointer group">
                                                        <div className="w-full h-40 md:h-48 overflow-hidden bg-slate-200">
                                                            <img src={(product.images && product.images.length > 0) ? product.images[0] : product.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={product.title} />
                                                        </div>
                                                        <div className="p-4">
                                                            <p className="text-sm font-bold text-slate-800 line-clamp-1 group-hover:text-[#00478F]">{product.title}</p>
                                                            <p className="text-base font-black text-[#00478F] mt-1">Rp{product.price.toLocaleString('id-ID')}</p>
                                                        </div>
                                                    </div>
                                                ))}
                                                {/* Card Lihat Lainnya */}
                                                <div onClick={() => navigate(`/seller/${shop.seller._id}`)} className="snap-start shrink-0 w-[120px] md:w-[150px] bg-slate-50 rounded-3xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center cursor-pointer hover:bg-blue-50 hover:border-[#00478F] transition-all text-slate-400 hover:text-[#00478F]">
                                                    <ArrowRight size={32} className="mb-2" />
                                                    <span className="text-xs font-black uppercase tracking-widest text-center px-4">Lihat Lainnya</span>
                                                </div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>

                    <button onClick={() => navigate('/explore')} className="w-full md:hidden flex items-center justify-center gap-2 bg-[#00478F] text-white px-6 py-4 rounded-2xl font-black text-sm hover:bg-slate-900 transition-colors shadow-lg mt-6">
                        Eksplor Semua Barang <ArrowRight size={16} />
                    </button>
                </div>
            </div>

            {/* ================= MODAL KAMPUS PAGINATION ================= */}
            {isCampusModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900">Pilih Kampus</h2>
                            <button onClick={() => setIsCampusModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Cari nama kampus..." value={campusSearch} onChange={(e) => {setCampusSearch(e.target.value); setCampusPage(1);}} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#00478F]" />
                        </div>

                        <div className="space-y-2 mb-6 min-h-[300px]">
                            <button 
                                onClick={() => { setCampusFilter('Semua Kampus'); setIsCampusModalOpen(false); }}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors border ${campusFilter === 'Semua Kampus' ? 'bg-[#00478F] text-white border-[#00478F] shadow-md' : 'bg-slate-50 text-slate-700 border-transparent hover:bg-slate-100'}`}
                            >
                                🌍 Semua Kampus
                            </button>
                            {displayedCampuses.map(campus => (
                                <button 
                                    key={campus} 
                                    onClick={() => { setCampusFilter(campus); setIsCampusModalOpen(false); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors border ${campusFilter === campus ? 'bg-[#00478F] text-white border-[#00478F] shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-[#00478F]'}`}
                                >
                                    {campus}
                                </button>
                            ))}
                            {displayedCampuses.length === 0 && <p className="text-center text-slate-400 font-bold mt-10">Kampus tidak ditemukan.</p>}
                        </div>

                        {/* Pagination Kampus */}
                        {totalCampusPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hal {campusPage} / {totalCampusPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCampusPage(p => Math.max(1, p - 1))} disabled={campusPage === 1} className="p-2 bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-200"><ChevronLeft size={18}/></button>
                                    <button onClick={() => setCampusPage(p => Math.min(totalCampusPages, p + 1))} disabled={campusPage === totalCampusPages} className="p-2 bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-200"><ChevronRight size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}