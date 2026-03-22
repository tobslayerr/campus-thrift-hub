/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import api from '../../api/axios';
import { Search, Filter, X, PackageSearch, MapPin, School, Building, ChevronLeft, ChevronRight, Check } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function Explore() {
    const [searchParams, setSearchParams] = useSearchParams();
    const initialSearch = searchParams.get('search') || '';
    const initialCampus = searchParams.get('campus') || ''; 
    const initialRating = searchParams.get('minRating') || '0';
    
    const { user } = useAuthStore(); 

    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    // Filter States
    const [searchTerm, setSearchTerm] = useState(initialSearch);
    const [selectedCategory, setSelectedCategory] = useState('');
    const [priceRange, setPriceRange] = useState({ min: '', max: '' });
    const [sortBy, setSortBy] = useState('newest');
    const [campusFilter, setCampusFilter] = useState(initialCampus ? initialCampus : 'Semua Kampus');
    const [ratingFilter, setRatingFilter] = useState(initialRating);
    
    const [isMobileFilterOpen, setIsMobileFilterOpen] = useState(false);

    // Modal Kampus State
    const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
    const [campuses, setCampuses] = useState([]);
    const [campusPage, setCampusPage] = useState(1);
    const [campusSearch, setCampusSearch] = useState('');
    const campusesPerPage = 10;

    // Mengunci scroll body saat Filter Mobile terbuka
    useEffect(() => {
        if (isMobileFilterOpen) {
            document.body.style.overflow = 'hidden';
        } else {
            document.body.style.overflow = 'auto';
        }
        return () => {
            document.body.style.overflow = 'auto';
        };
    }, [isMobileFilterOpen]);

    useEffect(() => {
        fetchCategories();
        fetchCampuses();
    }, []);

    useEffect(() => {
        fetchProducts();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchTerm, selectedCategory, priceRange, sortBy, campusFilter, ratingFilter]);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchCampuses = async () => {
        try {
            const res = await api.get('/products/campuses');
            setCampuses(res.data.data);
        } catch (error) { console.error(error); }
    };

    const fetchProducts = async () => {
        setLoading(true);
        try {
            let query = `/products?status=Tersedia`;
            if (searchTerm) query += `&search=${searchTerm}`;
            if (selectedCategory) query += `&category=${selectedCategory}`;
            if (priceRange.min) query += `&minPrice=${priceRange.min}`;
            if (priceRange.max) query += `&maxPrice=${priceRange.max}`;
            if (sortBy) query += `&sort=${sortBy}`;
            
            if (campusFilter && campusFilter !== 'Semua Kampus') {
                query += `&campus=${encodeURIComponent(campusFilter)}`;
            }

            const res = await api.get(query);
            let fetchedProducts = res.data.data;

            // Filter Rating Manual di Frontend
            if (ratingFilter !== '0') {
                const minRatingNum = parseFloat(ratingFilter);
                fetchedProducts = fetchedProducts.filter(p => {
                    const sellerRating = p.sellerId?.rating || 0;
                    return sellerRating >= minRatingNum;
                });
            }

            setProducts(fetchedProducts);
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const toggleMyCampus = () => {
        if (!user) return;
        if (campusFilter === user.campus) {
            setCampusFilter('Semua Kampus'); 
        } else {
            setCampusFilter(user.campus); 
        }
    };

    const filteredCampuses = campuses.filter(c => c.toLowerCase().includes(campusSearch.toLowerCase()));
    const totalCampusPages = Math.ceil(filteredCampuses.length / campusesPerPage);
    const displayedCampuses = filteredCampuses.slice((campusPage - 1) * campusesPerPage, campusPage * campusesPerPage);

    return (
        <div className="bg-slate-50 min-h-screen pb-32 pt-24 px-4 md:px-8 relative">
            <div className="max-w-7xl mx-auto flex flex-col md:flex-row gap-8">
                
                {/* TOMBOL FILTER MOBILE */}
                <button onClick={() => setIsMobileFilterOpen(true)} className="md:hidden w-full bg-white p-4 rounded-2xl border border-slate-200 font-black text-slate-700 flex justify-center items-center gap-2 shadow-sm active:scale-95 transition-transform">
                    <Filter size={18} /> Buka Filter Pencarian
                </button>

                {/* SIDEBAR FILTER (Dengan z-[999] agar berada di atas Navbar dan Footer) */}
                <aside className={`fixed inset-0 z-[999] bg-white md:bg-transparent md:static md:w-72 md:block md:z-0 flex flex-col transition-transform duration-300 ${isMobileFilterOpen ? 'translate-y-0' : 'translate-y-full md:translate-y-0'}`}>
                    
                    {/* HEADER MOBILE (Hanya tampil di HP) */}
                    <div className="flex justify-between items-center md:hidden p-5 border-b border-slate-100 bg-white shrink-0 shadow-sm z-10">
                        <h2 className="text-xl font-black text-slate-800 flex items-center gap-2"><Filter size={20} className="text-[#00478F]"/> Filter</h2>
                        <button onClick={() => setIsMobileFilterOpen(false)} className="p-2 bg-slate-100 text-slate-500 hover:text-red-500 hover:bg-red-50 rounded-full transition-colors">
                            <X size={20}/>
                        </button>
                    </div>

                    {/* KONTEN FILTER (Scrollable) */}
                    <div className="flex-1 overflow-y-auto p-5 md:p-0 bg-slate-50 md:bg-transparent relative">
                        <div className="bg-white md:p-6 md:rounded-[2rem] md:border md:border-slate-100 md:shadow-sm space-y-8 rounded-3xl p-5 border border-slate-100 shadow-sm">
                            
                            {/* FILTER KAMPUS EKSKLUSIF */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><School size={16} className="text-[#00478F]"/> Lokasi Kampus</h3>
                                
                                {user && user.campus && (
                                    <button 
                                        onClick={toggleMyCampus}
                                        className={`w-full p-3 mb-3 rounded-xl border-2 text-[10px] font-black uppercase tracking-widest transition-all flex justify-between items-center ${campusFilter === user.campus ? 'bg-blue-50 border-[#00478F] text-[#00478F]' : 'bg-white border-slate-200 text-slate-500 hover:border-slate-300'}`}
                                    >
                                        <span>Eksklusif Kampus Saya</span>
                                        {campusFilter === user.campus && <Check size={14} />}
                                    </button>
                                )}
                                
                                <button type="button" onClick={() => setIsCampusModalOpen(true)} className="w-full flex items-center justify-between bg-slate-50 px-4 py-3 rounded-xl border border-slate-200 hover:bg-blue-50 transition-colors">
                                    <div className="flex items-center gap-2 overflow-hidden">
                                        <Building size={16} className="text-[#FF9500] shrink-0" />
                                        <span className="text-sm font-bold text-slate-700 truncate">{campusFilter}</span>
                                    </div>
                                </button>
                            </div>

                            {/* FILTER KATEGORI */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-4">Kategori</h3>
                                <div className="space-y-3">
                                    <label className="flex items-center gap-3 cursor-pointer group">
                                        <input type="radio" name="category" checked={selectedCategory === ''} onChange={() => setSelectedCategory('')} className="w-4 h-4 accent-[#00478F]" />
                                        <span className="font-medium text-slate-600 group-hover:text-[#00478F] transition-colors">Semua Kategori</span>
                                    </label>
                                    {categories.map(cat => (
                                        <label key={cat._id} className="flex items-center gap-3 cursor-pointer group">
                                            <input type="radio" name="category" checked={selectedCategory === cat._id} onChange={() => setSelectedCategory(cat._id)} className="w-4 h-4 accent-[#00478F]" />
                                            <span className="font-medium text-slate-600 group-hover:text-[#00478F] transition-colors">{cat.name}</span>
                                        </label>
                                    ))}
                                </div>
                            </div>

                            {/* URUTKAN */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-4">Urutkan</h3>
                                <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#00478F] cursor-pointer appearance-none">
                                    <option value="newest">Paling Baru</option>
                                    <option value="lowest">Harga Terendah</option>
                                    <option value="highest">Harga Tertinggi</option>
                                    <option value="popular">Paling Populer</option>
                                </select>
                            </div>

                            {/* FILTER HARGA */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-4">Rentang Harga</h3>
                                <div className="flex items-center gap-2">
                                    <input type="number" placeholder="Min" value={priceRange.min} onChange={(e) => setPriceRange({...priceRange, min: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#00478F]"/>
                                    <span className="text-slate-400 font-bold">-</span>
                                    <input type="number" placeholder="Max" value={priceRange.max} onChange={(e) => setPriceRange({...priceRange, max: e.target.value})} className="w-full p-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold outline-none focus:border-[#00478F]"/>
                                </div>
                            </div>

                            {/* FILTER RATING PENJUAL */}
                            <div>
                                <h3 className="font-black text-slate-800 mb-4">Rating Penjual</h3>
                                <select value={ratingFilter} onChange={(e) => setRatingFilter(e.target.value)} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-slate-700 outline-none focus:border-[#00478F] cursor-pointer appearance-none">
                                    <option value="0">Semua Rating</option>
                                    <option value="4">⭐ 4.0 Ke Atas</option>
                                    <option value="4.5">⭐ 4.5 Ke Atas</option>
                                    <option value="5">⭐ 5.0 (Sempurna)</option>
                                </select>
                            </div>
                            
                            <button onClick={() => {setSearchTerm(''); setSelectedCategory(''); setPriceRange({min:'',max:''}); setSortBy('newest'); setCampusFilter('Semua Kampus'); setRatingFilter('0');}} className="w-full py-4 text-red-500 font-bold text-sm bg-red-50 rounded-xl hover:bg-red-100 transition-colors">
                                Reset Semua Filter
                            </button>
                        </div>
                    </div>

                    {/* FOOTER MOBILE (Tombol Terapkan - Hanya di HP) */}
                    <div className="md:hidden p-5 border-t border-slate-100 bg-white shrink-0 shadow-[0_-4px_10px_rgba(0,0,0,0.02)] z-10">
                        <button onClick={() => setIsMobileFilterOpen(false)} className="w-full bg-[#00478F] text-white font-black py-4 rounded-2xl uppercase tracking-widest text-sm shadow-lg shadow-blue-900/20 active:scale-95 transition-transform">
                            Tampilkan Produk ({products.length})
                        </button>
                    </div>
                </aside>

                {/* MAIN PRODUCT GRID */}
                <div className="flex-1">
                    <div className="bg-white p-2 rounded-2xl border border-slate-200 shadow-sm flex items-center mb-8 sticky top-24 z-10">
                        <Search className="text-slate-400 ml-4 mr-2 shrink-0" size={20} />
                        <input 
                            type="text" 
                            placeholder="Cari nama barang..." 
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="flex-1 p-3 bg-transparent outline-none font-bold text-slate-800 w-full"
                        />
                        {searchTerm && <button onClick={() => setSearchTerm('')} className="p-2 mr-2 text-slate-400 hover:bg-slate-100 rounded-xl"><X size={16}/></button>}
                    </div>

                    {loading ? (
                        <div className="flex justify-center py-20"><div className="w-10 h-10 border-4 border-[#00478F] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : products.length === 0 ? (
                        <div className="text-center py-20 bg-white rounded-[2.5rem] border border-slate-100">
                            <PackageSearch size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-black text-slate-800 mb-2">Barang Tidak Ditemukan</h3>
                            <p className="text-slate-500 font-medium">Coba gunakan kata kunci lain atau hapus filter kampus/kategori.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-6">
                            {products.map(product => (
                                <Link to={`/product/${product._id}`} key={product._id} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full">
                                    <div className="relative overflow-hidden aspect-[4/5] bg-slate-50">
                                        <img src={product.images && product.images.length > 0 ? product.images[0] : product.imageUrl} className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-110" alt={product.title} />
                                    </div>
                                    <div className="p-4 md:p-5 flex flex-col flex-1">
                                        <span className="text-[9px] font-black uppercase tracking-widest text-[#FF9500] mb-2">{product.category?.name || product.category || 'Barang'}</span>
                                        <h3 className="font-bold text-slate-800 text-sm line-clamp-2 mb-3 group-hover:text-[#00478F]">{product.title}</h3>
                                        <div className="mt-auto flex items-end justify-between">
                                            <span className="font-black text-[#00478F] text-lg">Rp{product.price.toLocaleString('id-ID')}</span>
                                        </div>
                                        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between gap-1.5 text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <MapPin size={12} className="text-[#FF9500] shrink-0" />
                                                <span className="truncate">{product.sellerId?.campus || 'Kampus Rahasia'}</span>
                                            </div>
                                            {product.sellerId?.rating > 0 && (
                                                <div className="flex items-center gap-1 shrink-0 text-[#FF9500]">
                                                    <Star size={10} fill="currentColor" />
                                                    <span>{product.sellerId.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                </Link>
                            ))}
                        </div>
                    )}
                </div>
            </div>

            {/* ================= MODAL KAMPUS PAGINATION ================= */}
            {isCampusModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95">
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
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${campusFilter === 'Semua Kampus' ? 'bg-[#00478F] text-white shadow-md' : 'bg-slate-50 text-slate-700 hover:bg-slate-100'}`}
                            >
                                🌍 Semua Kampus
                            </button>
                            {displayedCampuses.map(campus => (
                                <button 
                                    key={campus} 
                                    onClick={() => { setCampusFilter(campus); setIsCampusModalOpen(false); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors ${campusFilter === campus ? 'bg-[#00478F] text-white shadow-md' : 'bg-white border border-slate-100 text-slate-700 hover:border-[#00478F]'}`}
                                >
                                    {campus}
                                </button>
                            ))}
                            {displayedCampuses.length === 0 && <p className="text-center text-slate-400 font-bold mt-10">Kampus tidak ditemukan.</p>}
                        </div>

                        {totalCampusPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hal {campusPage} / {totalCampusPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCampusPage(p => Math.max(1, p - 1))} disabled={campusPage === 1} className="p-2 bg-slate-100 rounded-lg disabled:opacity-50 hover:bg-slate-200"><ChevronLeft size={18}/></button>
                                    <button onClick={() => setCampusPage(p => Math.min(totalCampusPages, p + 1))} disabled={campusPage === totalCampusPages} className="p-2 bg-slate-100 rounded-lg disabled:opacity-50 hover:bg-slate-200"><ChevronRight size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}