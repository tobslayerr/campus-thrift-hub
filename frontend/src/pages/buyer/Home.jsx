import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { Search, MapPin, Building, ChevronLeft, ChevronRight, X, PackageSearch, LayoutGrid, Tag } from 'lucide-react';

export default function Home() {
    const navigate = useNavigate();
    const { user } = useAuthStore(); 

    // STATE KATEGORI & PRODUK
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [loadingCategories, setLoadingCategories] = useState(true);
    const [loadingProducts, setLoadingProducts] = useState(true);

    // STATE PAGINATION FEED
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const productsPerPage = 12; // 12 cocok untuk grid 2, 3, dan 4 kolom

    // STATE PENCARIAN & FILTER KAMPUS
    const [searchKey, setSearchKey] = useState('');
    const [campusFilter, setCampusFilter] = useState('Semua Kampus');
    const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
    const [campuses, setCampuses] = useState([]);
    const [campusPage, setCampusPage] = useState(1);
    const [campusSearch, setCampusSearch] = useState('');
    const campusesPerPage = 10;

    // FETCH KATEGORI & KAMPUS (Hanya sekali saat komponen dimuat)
    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                const [campusesRes, categoriesRes] = await Promise.all([
                    api.get('/products/campuses'),
                    api.get('/categories') // Endpoint standar untuk mengambil kategori dari admin
                ]);
                setCampuses(campusesRes.data.data || []);
                setCategories(categoriesRes.data.data || []);
            } catch (error) {
                console.error("Gagal memuat data awal (kampus/kategori)", error);
            } finally {
                setLoadingCategories(false);
            }
        };
        fetchInitialData();
    }, []);

    // FETCH PRODUK UNTUK FEED (Setiap kali currentPage atau campusFilter berubah)
    useEffect(() => {
        const fetchProducts = async () => {
            setLoadingProducts(true);
            try {
                let url = `/products?status=Tersedia&page=${currentPage}&limit=${productsPerPage}`;
                if (campusFilter !== 'Semua Kampus') {
                    url += `&campus=${encodeURIComponent(campusFilter)}`;
                }
                const res = await api.get(url);
                setProducts(res.data.data || []);
                setTotalPages(res.data.pagination?.totalPages || 1);
            } catch (error) {
                console.error("Gagal memuat feed produk", error);
            } finally {
                setLoadingProducts(false);
            }
        };
        fetchProducts();
    }, [currentPage, campusFilter]);

    // HANDLE SEARCH UTAMA
    const handleSearchSubmit = (e) => {
        e.preventDefault();
        navigate(`/explore?search=${searchKey}&campus=${campusFilter}`);
    };

    // HANDLE KLIK KATEGORI
    const handleCategoryClick = (categoryName) => {
        // Mengarahkan ke halaman explore full dengan kategori tersebut, diurutkan rating tertinggi
        navigate(`/explore?category=${encodeURIComponent(categoryName)}&sort=rating_desc`);
    };

    // LOGIKA PAGINATION MODAL KAMPUS
    const filteredCampuses = campuses.filter(c => c.toLowerCase().includes(campusSearch.toLowerCase()));
    const totalCampusPages = Math.ceil(filteredCampuses.length / campusesPerPage);
    const displayedCampuses = filteredCampuses.slice((campusPage - 1) * campusesPerPage, campusPage * campusesPerPage);

    const renderProductCard = (product) => {
        const isMyProduct = user && (product.sellerId?._id === user.id || product.sellerId === user.id);

        return (
            <Link to={`/product/${product._id}`} key={product._id} className="group bg-white rounded-[1.5rem] overflow-hidden border border-slate-200 hover:border-[#00478F] hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col h-full relative">
                <div className="relative overflow-hidden aspect-square bg-slate-50">
                    <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
                        {isMyProduct && (
                            <span className="bg-[#FF9500] text-white px-2 py-1 rounded-lg text-[9px] font-black uppercase tracking-widest shadow-sm">
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
                
                <div className="p-4 flex flex-col flex-1">
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">
                        {product.category?.name || product.category || 'Barang'}
                    </p>
                    <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-3 group-hover:text-[#00478F] transition-colors leading-snug">
                        {product.title}
                    </h3>
                    <div className="mt-auto pt-3 border-t border-slate-100">
                        <span className="font-black text-lg text-[#00478F] block mb-2">Rp{product.price.toLocaleString('id-ID')}</span>
                        <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-500">
                            <MapPin size={12} className="text-[#FF9500] shrink-0" />
                            <span className="truncate">{product.sellerId?.campus || 'Kampus'}</span>
                        </div>
                    </div>
                </div>
            </Link>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            
            {/* HERO & SEARCH SECTION (OLX/CAROUSELL STYLE) */}
            <div className="bg-[#00478F] pt-20 pb-24 px-4 relative">
                <div className="max-w-4xl mx-auto relative z-10 text-center">
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-8 tracking-tight leading-tight">
                        Cari Apa Saja di <span className="text-[#FF9500]">Campus Thrift Hub</span>
                    </h1>

                    {/* SEARCH BOX */}
                    <form onSubmit={handleSearchSubmit} className="bg-white p-2.5 md:p-3 rounded-2xl md:rounded-[2rem] shadow-2xl flex flex-col md:flex-row gap-2 md:gap-3 relative z-30">
                        
                        {/* INPUT PENCARIAN */}
                        <div className="flex-1 flex items-center bg-slate-50 rounded-xl md:rounded-2xl px-4 py-3 border border-transparent focus-within:border-blue-200 transition-colors">
                            <Search size={20} className="text-slate-400 mr-3 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Cari jaket, buku, elektronik..." 
                                value={searchKey} 
                                onChange={(e) => setSearchKey(e.target.value)}
                                className="w-full bg-transparent outline-none font-bold text-slate-800 text-sm md:text-base"
                            />
                        </div>

                        {/* FILTER KAMPUS */}
                        <div className="flex gap-2">
                            <button type="button" onClick={() => setIsCampusModalOpen(true)} className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-slate-50 px-4 py-3 rounded-xl md:rounded-2xl border border-slate-100 hover:bg-blue-50 transition-colors shrink-0">
                                <Building size={18} className="text-[#00478F] shrink-0" />
                                <span className="text-sm font-black text-slate-700 truncate max-w-[120px]">{campusFilter}</span>
                            </button>

                            <button type="submit" className="bg-[#FF9500] text-white px-6 md:px-8 py-3 rounded-xl md:rounded-2xl font-black uppercase tracking-widest text-sm hover:bg-orange-600 transition-all shadow-md active:scale-95 shrink-0">
                                Cari
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            {/* DAFTAR KATEGORI (BERADA DI TENGAH-BAWAH SEARCH BAR) */}
            <div className="max-w-6xl mx-auto px-4 -mt-12 relative z-20 mb-10">
                <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-5 md:p-8">
                    <h2 className="text-lg md:text-xl font-black text-slate-800 mb-5 flex items-center gap-2">
                        <LayoutGrid className="text-[#00478F]" size={24} /> Kategori Pilihan
                    </h2>
                    
                    {loadingCategories ? (
                        <div className="flex justify-center py-8">
                            <div className="w-8 h-8 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div>
                        </div>
                    ) : categories.length === 0 ? (
                        <p className="text-center text-slate-400 font-bold text-sm">Kategori belum tersedia.</p>
                    ) : (
                        <div className="flex gap-4 md:gap-6 overflow-x-auto pb-4 custom-scrollbar snap-x">
                            {categories.map((cat) => (
                                <div 
                                    key={cat._id}
                                    onClick={() => handleCategoryClick(cat.name)}
                                    className="snap-start shrink-0 flex flex-col items-center gap-3 cursor-pointer group w-[70px] md:w-[90px]"
                                >
                                    <div className="w-16 h-16 md:w-[80px] md:h-[80px] bg-slate-50 rounded-2xl md:rounded-[1.5rem] flex items-center justify-center border border-slate-100 group-hover:border-[#00478F] group-hover:bg-blue-50 group-hover:shadow-md transition-all overflow-hidden relative">
                                        {cat.imageUrl ? (
                                            <img src={cat.imageUrl} alt={cat.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-300" />
                                        ) : (
                                            <Tag className="text-slate-400 group-hover:text-[#00478F] transition-colors" size={28} />
                                        )}
                                    </div>
                                    <span className="text-[10px] md:text-xs font-bold text-slate-600 text-center leading-tight group-hover:text-[#00478F] line-clamp-2 px-1">
                                        {cat.name}
                                    </span>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* FEED REKOMENDASI BARANG (DENGAN PAGINATION) */}
            <div className="max-w-6xl mx-auto px-4">
                <div className="flex items-center justify-between mb-6">
                    <h2 className="text-xl md:text-2xl font-black text-slate-900">Rekomendasi Untukmu</h2>
                </div>

                {loadingProducts ? (
                    <div className="flex justify-center py-20">
                        <div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div>
                    </div>
                ) : products.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-10 md:p-16 text-center border border-slate-200 shadow-sm mt-4">
                        <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <PackageSearch className="text-slate-300" size={36} />
                        </div>
                        <h3 className="text-xl font-black text-slate-800 mb-2">Belum ada barang</h3>
                        <p className="text-slate-500 text-sm max-w-md mx-auto">Barang untuk lokasi atau pencarian ini belum tersedia. Coba gunakan filter lain.</p>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {products.map(renderProductCard)}
                        </div>

                        {/* KONTROL PAGINATION HOME */}
                        {totalPages > 1 && (
                            <div className="flex justify-center items-center gap-3 mt-12">
                                <button 
                                    onClick={() => { setCurrentPage(p => Math.max(1, p - 1)); window.scrollTo({top: 400, behavior: 'smooth'}); }} 
                                    disabled={currentPage === 1} 
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
                                >
                                    <ChevronLeft size={20} className="text-slate-600" />
                                </button>
                                
                                <span className="px-6 py-3 bg-white border border-slate-200 rounded-xl font-black text-slate-700 text-sm shadow-sm">
                                    Halaman {currentPage} dari {totalPages}
                                </span>
                                
                                <button 
                                    onClick={() => { setCurrentPage(p => Math.min(totalPages, p + 1)); window.scrollTo({top: 400, behavior: 'smooth'}); }} 
                                    disabled={currentPage === totalPages} 
                                    className="p-3 bg-white border border-slate-200 rounded-xl hover:bg-slate-50 disabled:opacity-40 transition-colors shadow-sm"
                                >
                                    <ChevronRight size={20} className="text-slate-600" />
                                </button>
                            </div>
                        )}
                    </>
                )}
            </div>

            {/* ================= MODAL KAMPUS PAGINATION ================= */}
            {isCampusModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-slate-100">
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
                                onClick={() => { setCampusFilter('Semua Kampus'); setCurrentPage(1); setIsCampusModalOpen(false); }}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors border ${campusFilter === 'Semua Kampus' ? 'bg-[#00478F] text-white border-[#00478F] shadow-md' : 'bg-slate-50 text-slate-700 border-transparent hover:bg-slate-100'}`}
                            >
                                🌍 Semua Kampus
                            </button>
                            {displayedCampuses.map(campus => (
                                <button 
                                    key={campus} 
                                    onClick={() => { setCampusFilter(campus); setCurrentPage(1); setIsCampusModalOpen(false); }}
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