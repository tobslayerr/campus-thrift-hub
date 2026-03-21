import { useState, useEffect } from 'react';
import { useLocation, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore'; // IMPORT AUTH STORE
import { Search, MapPin, PackageSearch, ChevronLeft, ChevronRight, Filter, Star } from 'lucide-react';

// Helper hook untuk baca URL Query Params
function useQuery() {
    return new URLSearchParams(useLocation().search);
}

export default function Explore() {
    const query = useQuery();
    const { user } = useAuthStore(); // AMBIL DATA USER YANG SEDANG LOGIN
    
    // Initial states dari URL jika ada
    const [searchKey, setSearchKey] = useState(query.get('search') || '');
    const [campusFilter, setCampusFilter] = useState(query.get('campus') || 'Semua Kampus');
    const [ratingFilter, setRatingFilter] = useState(query.get('minRating') || '0');
    
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    
    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    const fetchProducts = async (page = 1) => {
        setLoading(true);
        try {
            const res = await api.get('/products', {
                params: {
                    search: searchKey,
                    campus: campusFilter === 'Semua Kampus' ? '' : campusFilter,
                    minRating: ratingFilter,
                    page: page,
                    limit: 12 // 12 Produk per halaman
                }
            });
            setProducts(res.data.data);
            setTotalPages(res.data.totalPages);
            setCurrentPage(res.data.currentPage);
        } catch (error) {
            console.error("Gagal memuat katalog", error);
        } finally {
            setLoading(false);
        }
    };

    // Fetch otomatis saat load pertama atau halaman diganti
    useEffect(() => {
        fetchProducts(currentPage);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentPage]);

    // Handle pencarian ulang (Update filter)
    const handleApplyFilter = (e) => {
        e.preventDefault();
        setCurrentPage(1); // Reset ke halaman 1
        fetchProducts(1);
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header Mini Filter */}
            <div className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
                <div className="max-w-7xl mx-auto px-4 py-4">
                    <form onSubmit={handleApplyFilter} className="flex flex-col md:flex-row gap-3">
                        <div className="flex-1 flex items-center bg-slate-50 rounded-2xl px-4 py-3 border border-slate-200 focus-within:border-[#00478F] transition-colors">
                            <Search size={18} className="text-slate-400 mr-3 shrink-0" />
                            <input 
                                type="text" 
                                placeholder="Cari jaket, sepatu, buku..." 
                                value={searchKey} 
                                onChange={(e) => setSearchKey(e.target.value)}
                                className="w-full bg-transparent outline-none font-bold text-slate-800 text-sm"
                            />
                        </div>
                        <div className="flex gap-3">
                            <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="bg-slate-50 px-4 py-3 rounded-2xl border border-slate-200 text-xs font-black text-slate-700 outline-none hover:bg-blue-50 transition-colors cursor-pointer">
                                <option value="0">Semua Rating</option>
                                <option value="4">⭐ 4.0 Keatas</option>
                                <option value="4.5">⭐ 4.5 Keatas</option>
                                <option value="5">⭐ 5.0 Sempurna</option>
                            </select>
                            <button type="submit" className="bg-[#00478F] text-white px-6 py-3 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-[#FF9500] transition-colors shrink-0 flex items-center gap-2 shadow-md">
                                <Filter size={16} /> Filter
                            </button>
                        </div>
                    </form>
                </div>
            </div>

            <div className="max-w-7xl mx-auto px-4 mt-10">
                <div className="flex justify-between items-end mb-8">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 mb-1 tracking-tight">Eksplorasi Katalog</h1>
                        <p className="text-slate-500 font-medium text-sm">
                            {campusFilter !== 'Semua Kampus' ? `Menampilkan barang eksklusif dari area ${campusFilter}` : 'Menampilkan semua barang yang tersedia saat ini.'}
                        </p>
                    </div>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center py-32"><div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div></div>
                ) : products.length === 0 ? (
                    <div className="bg-white p-20 rounded-[3rem] text-center border border-slate-100 shadow-sm">
                        <PackageSearch size={64} className="mx-auto text-slate-200 mb-4" />
                        <h3 className="text-xl font-black text-slate-800 mb-2 tracking-tight">Barang Tidak Ditemukan</h3>
                        <p className="text-slate-500 mb-6">Coba gunakan kata kunci lain atau turunkan kriteria filter Anda.</p>
                        <button onClick={() => {setSearchKey(''); setCampusFilter('Semua Kampus'); setRatingFilter('0'); setCurrentPage(1); fetchProducts(1);}} className="bg-[#FF9500] text-white px-8 py-3.5 rounded-xl font-black text-xs uppercase tracking-widest shadow-lg hover:bg-orange-600 transition-colors">Reset Semua Filter</button>
                    </div>
                ) : (
                    <>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                            {products.map(product => {
                                // 💡 LOGIKA DETEKSI IKLAN MILIK SENDIRI
                                const sellerId = product.sellerId?._id || product.sellerId;
                                const isMyProduct = user && (sellerId === user.id || sellerId === user._id);

                                return (
                                    <Link to={`/product/${product._id}`} key={product._id} className="group bg-white rounded-3xl border border-slate-100 overflow-hidden transition-all duration-500 hover:shadow-xl hover:-translate-y-1 relative flex flex-col">
                                        <div className="relative aspect-[4/5] overflow-hidden bg-slate-50">
                                            
                                            {/* 🎯 BADGE IKLAN ANDA */}
                                            {isMyProduct && (
                                                <div className="absolute top-3 left-3 z-10 bg-[#FF9500] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-md border border-orange-400/30 backdrop-blur-sm">
                                                    Iklan Anda
                                                </div>
                                            )}

                                            <img src={(product.images && product.images.length > 0) ? product.images[0] : product.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.title} />
                                        </div>
                                        
                                        <div className="p-5 flex-1 flex flex-col">
                                            <div className="flex items-center justify-between mb-2">
                                                <span className="text-[9px] font-black bg-blue-50 text-[#00478F] px-2 py-1 rounded-md uppercase tracking-widest w-fit line-clamp-1">{product.category?.name || product.category || 'Barang'}</span>
                                                
                                                {/* Tambahan Tampilan Rating Penjual di Card */}
                                                {product.sellerId?.rating > 0 && (
                                                    <span className="flex items-center gap-1 text-[10px] font-black text-slate-500">
                                                        <Star size={10} className="text-[#FF9500]" fill="currentColor" /> {product.sellerId.rating.toFixed(1)}
                                                    </span>
                                                )}
                                            </div>
                                            
                                            <h3 className="text-sm font-bold text-slate-800 line-clamp-2 group-hover:text-[#00478F] transition-colors mb-4 leading-snug">{product.title}</h3>
                                            
                                            <div className="mt-auto">
                                                <p className="text-lg font-black text-[#00478F] mb-3">Rp{product.price.toLocaleString('id-ID')}</p>
                                                <div className="flex items-center gap-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-t border-slate-100 pt-3">
                                                    <MapPin size={12} className="text-[#FF9500] shrink-0" />
                                                    <span className="truncate">{product.sellerId?.campus || 'Lokasi'}</span>
                                                </div>
                                            </div>
                                        </div>
                                    </Link>
                                );
                            })}
                        </div>

                        {/* PAGINATION CONTROLS */}
                        {totalPages > 1 && (
                            <div className="flex items-center justify-center gap-4 mt-12 bg-white w-fit mx-auto p-2 rounded-2xl shadow-sm border border-slate-100">
                                <button onClick={() => setCurrentPage(p => p - 1)} disabled={currentPage === 1} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-[#00478F] hover:text-white disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition-all"><ChevronLeft size={20}/></button>
                                <span className="font-black text-slate-700 px-4 text-sm uppercase tracking-widest">Halaman {currentPage} / {totalPages}</span>
                                <button onClick={() => setCurrentPage(p => p + 1)} disabled={currentPage === totalPages} className="p-3 bg-slate-50 text-slate-500 rounded-xl hover:bg-[#00478F] hover:text-white disabled:opacity-50 disabled:hover:bg-slate-50 disabled:hover:text-slate-500 transition-all"><ChevronRight size={20}/></button>
                            </div>
                        )}
                    </>
                )}
            </div>
        </div>
    );
}