import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function SellerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore(); 
    
    const [sellerInfo, setSellerInfo] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('katalog');

    // LOGIKA PINTAR: Cek apakah profil ini milik user yang sedang login
    const isMyProfile = user?.id === id || user?._id === id;

    useEffect(() => {
        const fetchSellerData = async () => {
            try {
                const response = await api.get(`/users/seller/${id}`);
                setSellerInfo(response.data.data.profile);
                setProducts(response.data.data.products);
                setReviews(response.data.data.reviews || []);
            } catch (error) {
                console.error("Gagal memuat profil penjual", error);
            } finally {
                setLoading(false);
            }
        };
        fetchSellerData();
    }, [id]);

    if (loading) return (
        <div className="flex justify-center items-center mt-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-brand-yellow"></div>
        </div>
    );
    
    if (!sellerInfo) return <div className="text-center mt-20 font-bold">Penjual tidak ditemukan.</div>;

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
            <button onClick={() => navigate(-1)} className="mb-8 text-gray-500 font-bold hover:text-black flex items-center gap-2 transition">
                ← Kembali
            </button>

            {/* --- HEADER PROFIL (OLX STYLE) --- */}
            <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 flex flex-col md:flex-row items-center md:items-start gap-8 mb-12 relative overflow-hidden">
                
                {/* Efek Latar Belakang */}
                <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-brand-yellow/20 to-transparent"></div>

                <img 
                    src={sellerInfo.profilePicture || 'https://via.placeholder.com/150'} 
                    alt={sellerInfo.name} 
                    className="w-32 h-32 md:w-40 md:h-40 rounded-full object-cover border-4 border-white shadow-xl ring-1 ring-gray-100 relative z-10"
                />
                
                <div className="flex-1 text-center md:text-left relative z-10 pt-2">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <div>
                            <span className="text-[10px] font-black bg-green-100 text-green-700 px-3 py-1 rounded-md uppercase tracking-widest">
                                Terverifikasi Kampus
                            </span>
                            
                            {/* NAMA & BADGE "ANDA" */}
                            <h1 className="text-4xl font-black text-gray-950 mt-3 flex items-center gap-3 justify-center md:justify-start">
                                {sellerInfo.name}
                                {isMyProfile && (
                                    <span className="bg-brand-dark text-brand-yellow text-[10px] font-black px-2 py-1 rounded-md uppercase tracking-widest translate-y-1">
                                        Anda
                                    </span>
                                )}
                            </h1>
                        </div>

                        {/* TOMBOL EDIT (HANYA MUNCUL JIKA PROFIL SENDIRI) */}
                        {isMyProfile && (
                            <Link 
                                to="/my-profile" 
                                className="inline-flex items-center justify-center gap-2 bg-white border-2 border-brand-dark text-brand-dark px-6 py-2.5 rounded-xl font-black hover:bg-brand-dark hover:text-brand-yellow transition-all shadow-sm"
                            >
                                <span>✏️</span> Edit Profil Saya
                            </Link>
                        )}
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-3 mt-6 text-gray-700 font-semibold text-sm">
                        <p className="flex items-center gap-2.5 justify-center md:justify-start">
                            <span className="text-xl">🏢</span> {sellerInfo.campus}
                        </p>
                        <p className="flex items-center gap-2.5 justify-center md:justify-start text-gray-500">
                            <span className="text-xl">📍</span> {sellerInfo.domisili}
                        </p>
                        <p className="flex items-center gap-2.5 justify-center md:justify-start mt-2 col-span-full">
                            <span className="text-xl">⭐</span> 
                            <span className="font-black text-gray-900">{sellerInfo.rating.toFixed(1)} / 5.0</span>
                            <span className="text-xs text-gray-400 font-medium">(Berdasarkan transaksi Escrow)</span>
                        </p>
                    </div>
                </div>
            </div>

            {/* --- NAVIGASI TAB: KATALOG vs ULASAN --- */}
            <div className="flex gap-6 border-b border-gray-200 mb-8 mt-10">
                <button 
                    onClick={() => setActiveTab('katalog')} 
                    className={`pb-4 font-black text-lg transition-all ${activeTab === 'katalog' ? 'text-brand-dark border-b-4 border-brand-yellow' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Barang Dijual ({products.length})
                </button>
                <button 
                    onClick={() => setActiveTab('ulasan')} 
                    className={`pb-4 font-black text-lg transition-all ${activeTab === 'ulasan' ? 'text-brand-dark border-b-4 border-brand-yellow' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Ulasan Pembeli ({reviews.length})
                </button>
            </div>

            {/* KONTEN TAB KATALOG */}
            {activeTab === 'katalog' && (
                products.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center">
                        <p className="text-gray-400 font-bold italic">
                            {isMyProfile ? 'Anda belum memiliki barang dagangan aktif.' : 'Penjual ini sedang tidak memiliki barang dagangan lain.'}
                        </p>
                    </div>
                ) : (
                    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
                        {products.map((product) => (
                            <div key={product._id} className="bg-white border border-gray-200 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 group flex flex-col justify-between h-full">
                                <Link to={`/product/${product._id}`}>
                                    <div className="h-40 bg-gray-100 overflow-hidden relative">
                                        <img src={product.imageUrl} alt={product.title} className="w-full h-full object-cover group-hover:scale-110 transition duration-500" />
                                    </div>
                                    <div className="p-4">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-1">{product.category}</p>
                                        <h3 className="font-bold text-gray-800 text-sm line-clamp-2 leading-tight group-hover:text-brand-yellow transition">{product.title}</h3>
                                    </div>
                                </Link>
                                <div className="p-4 pt-0 mt-auto">
                                    <span className="font-black text-brand-dark text-lg block mb-3">
                                        Rp {product.price.toLocaleString('id-ID')}
                                    </span>
                                    <Link to={`/product/${product._id}`} className="w-full block text-center bg-gray-900 text-white font-bold py-2.5 rounded-xl hover:bg-black transition text-xs shadow-md">
                                        Lihat Detail
                                    </Link>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}

            {/* KONTEN TAB ULASAN */}
            {activeTab === 'ulasan' && (
                reviews.length === 0 ? (
                    <div className="bg-gray-50 border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center text-gray-400 font-bold italic">
                        Belum ada ulasan untuk penjual ini.
                    </div>
                ) : (
                    <div className="space-y-4">
                        {reviews.map((rev) => (
                            <div key={rev._id} className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm flex gap-4">
                                <img 
                                    src={rev.buyerId?.profilePicture || 'https://via.placeholder.com/150'} 
                                    className="w-12 h-12 rounded-full object-cover border border-gray-200" 
                                    alt="avatar" 
                                />
                                <div>
                                    <h4 className="font-bold text-gray-900">{rev.buyerId?.name || 'Pembeli anonim'}</h4>
                                    <p className="text-yellow-400 text-lg mb-2">{'★'.repeat(rev.rating)}{'☆'.repeat(5 - rev.rating)}</p>
                                    <p className="text-gray-600 text-sm">"{rev.comment}"</p>
                                    <p className="text-xs text-gray-400 mt-3 font-semibold">Dibeli: {rev.productId?.title || 'Produk dihapus'}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                )
            )}
        </div>
    );
}