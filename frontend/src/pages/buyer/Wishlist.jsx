import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import { Heart, MapPin, Star, Trash2, ShoppingBag } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Wishlist() {
    const navigate = useNavigate();
    const [wishlist, setWishlist] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchWishlist = async () => {
            try {
                const res = await api.get('/users/wishlist');
                setWishlist(res.data.data);
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
                toast.error("Gagal memuat wishlist");
            } finally {
                setLoading(false);
            }
        };
        fetchWishlist();
    }, []);

    const handleRemove = async (e, productId) => {
        e.preventDefault(); // Mencegah klik masuk ke halaman detail
        e.stopPropagation();
        try {
            await api.post(`/users/wishlist/${productId}`);
            setWishlist(wishlist.filter(p => p._id !== productId));
            toast.success("Dihapus dari wishlist");
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Gagal menghapus barang");
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div></div>;

    return (
        <div className="bg-[#F8FAFC] min-h-screen pt-24 pb-32 px-4 md:px-8 relative z-0">
            <div className="max-w-6xl mx-auto">
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shadow-sm">
                        <Heart size={28} fill="currentColor" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight">Wishlist Saya</h1>
                        <p className="text-slate-500 font-medium mt-1">Barang-barang yang Anda simpan untuk dibeli nanti.</p>
                    </div>
                </div>

                {wishlist.length === 0 ? (
                    <div className="bg-white rounded-[2.5rem] p-16 text-center border border-slate-100 shadow-sm animate-in fade-in zoom-in duration-300">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                            <Heart size={40} className="text-slate-300" />
                        </div>
                        <h2 className="text-2xl font-black text-slate-800 mb-2">Wishlist Masih Kosong</h2>
                        <p className="text-slate-500 mb-8 max-w-sm mx-auto leading-relaxed">Anda belum menyimpan barang apa pun. Eksplorasi katalog kami dan tekan tombol hati untuk menyimpannya di sini!</p>
                        <Link to="/explore" className="inline-block bg-[#00478F] text-white px-8 py-4 rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition-all shadow-lg active:scale-95">
                            Eksplor Katalog
                        </Link>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                        {wishlist.map(product => {
                            const isSoldOut = product.status !== 'Tersedia';

                            return (
                                <Link to={`/product/${product._id}`} key={product._id} className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:border-red-200 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative animate-in fade-in">
                                    
                                    {/* Tombol Hapus X/Trash */}
                                    <button 
                                        onClick={(e) => handleRemove(e, product._id)}
                                        className="absolute top-3 right-3 z-20 bg-white/90 backdrop-blur-sm p-2.5 rounded-xl text-slate-400 hover:text-red-500 hover:bg-red-50 transition-colors shadow-sm"
                                        title="Hapus dari Wishlist"
                                    >
                                        <Trash2 size={16} />
                                    </button>

                                    <div className="relative overflow-hidden aspect-[4/5] bg-slate-50">
                                        {isSoldOut && (
                                            <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                                                <span className="bg-slate-800 text-white px-4 py-1.5 rounded-lg font-black tracking-widest shadow-lg rotate-[-10deg] text-sm border-2 border-slate-600 uppercase">
                                                    TERJUAL
                                                </span>
                                            </div>
                                        )}
                                        <div className="absolute top-3 left-3 z-10 flex flex-col gap-2 items-start">
                                            <span className="bg-white/90 backdrop-blur-md text-[#00478F] px-3 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">
                                                {product.category?.name || product.category || 'Barang'}
                                            </span>
                                        </div>
                                        <img 
                                            src={product.images && product.images.length > 0 ? product.images[0] : product.imageUrl} 
                                            className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-70' : ''}`} 
                                            alt={product.title} 
                                        />
                                    </div>
                                    
                                    <div className="p-5 flex flex-col flex-1">
                                        <h3 className={`font-bold text-sm line-clamp-2 mb-3 transition-colors leading-snug ${isSoldOut ? 'text-slate-400' : 'text-slate-800 group-hover:text-[#00478F]'}`}>
                                            {product.title}
                                        </h3>
                                        <div className="mt-auto pt-3 border-t border-slate-100 flex items-end justify-between">
                                            <div>
                                                <span className="font-black text-lg text-[#00478F] leading-none">Rp{product.price.toLocaleString('id-ID')}</span>
                                            </div>
                                        </div>
                                        <div className="mt-3 flex items-center justify-between gap-1.5 text-[10px] font-bold text-slate-400">
                                            <div className="flex items-center gap-1 min-w-0">
                                                <MapPin size={12} className="text-[#FF9500] shrink-0" />
                                                <span className="truncate">{product.sellerId?.campus || 'Kampus'}</span>
                                            </div>
                                            {product.sellerId?.rating > 0 && (
                                                <div className="flex items-center gap-1 shrink-0 text-[#FF9500]">
                                                    <Star size={10} fill="currentColor" />
                                                    <span>{product.sellerId.rating.toFixed(1)}</span>
                                                </div>
                                            )}
                                        </div>

                                        {!isSoldOut && (
                                            <button 
                                                onClick={(e) => { e.preventDefault(); e.stopPropagation(); navigate(`/checkout/${product._id}`); }}
                                                className="mt-4 w-full py-2.5 bg-blue-50 border border-blue-100 text-[#00478F] font-black text-[10px] uppercase tracking-widest rounded-xl hover:bg-[#00478F] hover:text-white transition-all flex items-center justify-center gap-2 active:scale-95"
                                            >
                                                <ShoppingBag size={14}/> Beli Langsung
                                            </button>
                                        )}
                                    </div>
                                </Link>
                            );
                        })}
                    </div>
                )}
            </div>
        </div>
    );
}