import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { TrendingUp, Eye, PackageCheck, Wallet, ArrowLeft, BarChart2, Star } from 'lucide-react';
import toast from 'react-hot-toast';

export default function SellerDashboard() {
    const navigate = useNavigate();
    const [analytics, setAnalytics] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAnalytics = async () => {
            try {
                const res = await api.get('/users/seller/analytics');
                setAnalytics(res.data.data);
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
                toast.error("Gagal memuat analitik penjual");
            } finally {
                setLoading(false);
            }
        };
        fetchAnalytics();
    }, []);

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div></div>;

    const maxViews = Math.max(...(analytics?.topViewedProducts.map(p => p.views) || [0]), 1); // Hindari bagi nol

    return (
        // PERBAIKAN: Mengubah pt-24 menjadi pt-6 md:pt-10 agar jarak dengan navbar lebih pas
        <div className="bg-[#F8FAFC] min-h-screen pt-6 md:pt-10 pb-32 px-4 md:px-8">
            <div className="max-w-6xl mx-auto">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-500 font-bold hover:text-[#00478F] transition-colors mb-6 w-fit">
                    <ArrowLeft size={20} /> Kembali
                </button>

                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-[#FF9500]/10 text-[#FF9500] rounded-2xl flex items-center justify-center shadow-sm shrink-0">
                        <BarChart2 size={28} />
                    </div>
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Dashboard Penjual</h1>
                        <p className="text-slate-500 font-medium mt-1 text-sm md:text-base">Pantau performa jualan dan analitik produkmu bulan ini.</p>
                    </div>
                </div>

                {/* 4 KOTAK METRIK UTAMA */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-green-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-green-100 text-green-600 rounded-xl flex items-center justify-center mb-4"><Wallet size={24}/></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Pendapatan Bulan Ini</p>
                            <h2 className="text-2xl font-black text-slate-800">Rp{analytics?.totalRevenueThisMonth?.toLocaleString('id-ID')}</h2>
                        </div>
                    </div>
                    
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-blue-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center mb-4"><Eye size={24}/></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Total Dilihat (Semua Barang)</p>
                            <h2 className="text-2xl font-black text-slate-800">{analytics?.totalViews} <span className="text-sm font-bold text-slate-400">Kali</span></h2>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-orange-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-xl flex items-center justify-center mb-4"><TrendingUp size={24}/></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Barang Tersedia</p>
                            <h2 className="text-2xl font-black text-slate-800">{analytics?.activeProducts} <span className="text-sm font-bold text-slate-400">Produk</span></h2>
                        </div>
                    </div>

                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden group">
                        <div className="absolute -right-4 -top-4 w-24 h-24 bg-purple-50 rounded-full group-hover:scale-150 transition-transform duration-500"></div>
                        <div className="relative z-10">
                            <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-xl flex items-center justify-center mb-4"><PackageCheck size={24}/></div>
                            <p className="text-xs font-black text-slate-400 uppercase tracking-widest mb-1">Barang Terjual Keseluruhan</p>
                            <h2 className="text-2xl font-black text-slate-800">{analytics?.soldProducts} <span className="text-sm font-bold text-slate-400">Produk</span></h2>
                        </div>
                    </div>
                </div>

                {/* GRAFIK / RANKING PRODUK TERPOPULER */}
                <div className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-sm">
                    <h3 className="text-xl font-black text-slate-800 mb-2 flex items-center gap-2"><Star className="text-[#FF9500]" size={20}/> 5 Barang Paling Banyak Dilihat</h3>
                    <p className="text-sm text-slate-500 font-medium mb-8">Barang dengan grafik penuh menunjukkan minat pembeli yang sangat tinggi.</p>

                    {analytics?.topViewedProducts?.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-2xl">
                            <p className="text-slate-400 font-bold italic">Anda belum memiliki barang untuk dianalisa.</p>
                        </div>
                    ) : (
                        <div className="space-y-6">
                            {analytics?.topViewedProducts?.map((product, idx) => {
                                const percentage = (product.views / maxViews) * 100;
                                return (
                                    <div key={product._id} className="flex items-center gap-4">
                                        <div className="w-6 md:w-8 text-center font-black text-slate-300 text-base md:text-lg">#{idx + 1}</div>
                                        <img src={product.images[0]} alt={product.title} className="w-12 h-12 md:w-14 md:h-14 rounded-xl object-cover border border-slate-100 shadow-sm shrink-0" />
                                        <div className="flex-1 min-w-0">
                                            <div className="flex justify-between items-end mb-2 gap-2">
                                                <Link to={`/product/${product._id}`} className="font-bold text-slate-800 text-xs md:text-sm hover:text-[#00478F] truncate">{product.title}</Link>
                                                <span className="text-[10px] md:text-xs font-black text-slate-500 bg-slate-100 px-2 py-1 rounded-md shrink-0">{product.views} Views</span>
                                            </div>
                                            {/* Bar Chart Visual */}
                                            <div className="h-2.5 md:h-3 w-full bg-slate-100 rounded-full overflow-hidden">
                                                <div 
                                                    className="h-full bg-gradient-to-r from-[#FF9500] to-[#00478F] rounded-full transition-all duration-1000" 
                                                    style={{ width: `${percentage}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}