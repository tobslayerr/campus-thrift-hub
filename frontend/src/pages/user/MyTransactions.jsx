import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
    ClipboardList, Clock, ShieldCheck, 
    Landmark, CheckCircle, MessageSquare, 
    AlertTriangle, Lock, KeyRound, ArrowRight, User
} from 'lucide-react';

export default function MyTransactions() {
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pembelian');
    
    // State untuk PIN
    const [pinInputs, setPinInputs] = useState({});
    const [verifying, setVerifying] = useState(false);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions/my-transactions');
            setPurchases(response.data.data.purchases || []);
            setSales(response.data.data.sales || []);
        } catch (error) {
            console.error("Gagal memuat transaksi", error);
            toast.error("Gagal memuat data transaksi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    const handleVerifyPin = async (transactionId) => {
        const pin = pinInputs[transactionId];
        if (!pin || pin.length !== 4) {
            return toast.error('Masukkan 4 digit PIN dengan benar!');
        }

        setVerifying(true);
        const toastId = toast.loading('Memverifikasi PIN...');
        try {
            const response = await api.post(`/transactions/${transactionId}/verify-pin`, { pin });
            toast.success(response.data.message, { id: toastId });
            setPinInputs({ ...pinInputs, [transactionId]: '' }); // Clear input
            fetchTransactions(); // Refresh data
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal memverifikasi PIN', { id: toastId });
        } finally {
            setVerifying(false);
        }
    };

    // PREMIUM STATUS BADGES
    const getStatusBadge = (status) => {
        switch (status) {
            case 'Menunggu Verifikasi':
                return (
                    <span className="flex items-center gap-1.5 bg-orange-50 text-[#FF9500] px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-orange-200">
                        <Clock size={14} /> Cek Admin
                    </span>
                );
            case 'Dana Ditahan (Siap COD)':
                return (
                    <span className="flex items-center gap-1.5 bg-[#00478F]/10 text-[#00478F] px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-200">
                        <ShieldCheck size={14} /> Siap COD
                    </span>
                );
            case 'Selesai':
                return (
                    <span className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-purple-200">
                        <Landmark size={14} /> Proses Cair
                    </span>
                );
            case 'Dana Dicairkan':
                return (
                    <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-green-200">
                        <CheckCircle size={14} /> Selesai
                    </span>
                );
            case 'Sengketa':
                return (
                    <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-red-200">
                        <AlertTriangle size={14} /> Sengketa
                    </span>
                );
            default:
                return (
                    <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-slate-200">
                        <Clock size={14} /> Diproses
                    </span>
                );
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );

    const activeData = activeTab === 'pembelian' ? purchases : sales;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32 min-h-screen bg-[#F8FAFC]">
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3 tracking-tight">
                    <ClipboardList className="text-[#00478F]" size={36} strokeWidth={2.5} /> 
                    Status Transaksi
                </h1>
                <p className="text-slate-500 font-medium">Pantau keamanan dana dan jadwal COD barang Anda di sini.</p>
            </div>

            {/* TAB NAVIGASI MODERN */}
            <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                <button 
                    onClick={() => setActiveTab('pembelian')} 
                    className={`pb-4 font-black text-lg transition-all whitespace-nowrap relative ${activeTab === 'pembelian' ? 'text-[#00478F]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Pembelian Saya ({purchases.length})
                    {activeTab === 'pembelian' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#FF9500] rounded-t-lg"></span>}
                </button>
                <button 
                    onClick={() => setActiveTab('penjualan')} 
                    className={`pb-4 font-black text-lg transition-all whitespace-nowrap relative ${activeTab === 'penjualan' ? 'text-[#00478F]' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    Penjualan Saya ({sales.length})
                    {activeTab === 'penjualan' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#FF9500] rounded-t-lg"></span>}
                </button>
            </div>

            {activeData.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                        <ClipboardList size={32} className="text-slate-300" />
                    </div>
                    <p className="text-slate-800 font-black text-xl tracking-tight mb-2">Belum ada transaksi di tab ini.</p>
                    <Link to="/" className="inline-flex items-center gap-2 text-[#FF9500] font-bold hover:text-[#00478F] transition-colors mt-2">
                        Mulai berburu barang thrift <ArrowRight size={16} />
                    </Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeData.map((trx) => {
                        const productData = trx.productId || trx.product || {};
                        const opponentData = activeTab === 'pembelian' ? (trx.sellerId || trx.seller || {}) : (trx.buyerId || trx.buyer || {});
                        const priceToDisplay = trx.amount || trx.price || productData.price || 0;

                        return (
                            <div key={trx._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden">
                                
                                {/* HEADER KARTU (TANGGAL & STATUS) */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex justify-between items-center">
                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-2">
                                        <Clock size={14} /> 
                                        {new Date(trx.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}
                                    </span>
                                    {getStatusBadge(trx.status)}
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                                        
                                        {/* INFO PRODUK */}
                                        <div className="flex items-center gap-5 flex-1">
                                            <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200">
                                                <img src={productData.imageUrl || 'https://via.placeholder.com/150'} alt="produk" className="w-full h-full object-cover" />
                                            </div>
                                            <div>
                                                <h3 className="font-black text-slate-900 text-lg line-clamp-2 leading-tight hover:text-[#00478F] transition-colors cursor-pointer">
                                                    {productData.title || 'Produk Dihapus'}
                                                </h3>
                                                <p className="font-black text-[#00478F] mt-2 text-xl">Rp{priceToDisplay.toLocaleString('id-ID')}</p>
                                            </div>
                                        </div>

                                        {/* INFO LAWAN TRANSAKSI */}
                                        <div className="flex-1 lg:border-l border-slate-100 lg:pl-8 flex justify-between items-center pt-4 lg:pt-0 border-t lg:border-t-0 mt-4 lg:mt-0">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">
                                                    {activeTab === 'pembelian' ? 'Informasi Penjual' : 'Informasi Pembeli'}
                                                </p>
                                                <div className="flex items-center gap-3">
                                                    <img src={opponentData.profilePicture || 'https://via.placeholder.com/150'} alt="avatar" className="w-10 h-10 rounded-full ring-2 ring-slate-100 object-cover" />
                                                    <div>
                                                        <p className="font-bold text-slate-800">{opponentData.name || 'User Tidak Diketahui'}</p>
                                                        <p className="text-xs text-slate-500 font-medium truncate max-w-[150px] flex items-center gap-1">
                                                            <User size={12} /> {opponentData.campus || opponentData.domisili || 'Lokasi rahasia'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                            {/* TOMBOL CHAT */}
                                            {opponentData._id && (
                                                <Link to={`/chat/${opponentData._id}`} className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center hover:bg-[#FF9500] hover:text-white transition-all shadow-sm shrink-0" title="Chat Sekarang">
                                                    <MessageSquare size={20} />
                                                </Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* ========================================== */}
                                    {/* ZONA ESCROW (PIN COD & KEAMANAN)           */}
                                    {/* ========================================== */}
                                    
                                    {/* 1. PEMBELI: LIHAT PIN RAHASIA */}
                                    {activeTab === 'pembelian' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                        <div className="mt-6 p-6 bg-[#00478F] rounded-2xl flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-blue-900/10 gap-6 relative overflow-hidden">
                                            <div className="absolute -right-10 -top-10 text-white/5">
                                                <Lock size={150} />
                                            </div>
                                            <div className="relative z-10 flex items-center gap-4">
                                                <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center">
                                                    <KeyRound size={24} className="text-[#FF9500]" />
                                                </div>
                                                <div>
                                                    <p className="text-xs text-blue-200 font-black uppercase tracking-widest mb-1">PIN Rahasia COD</p>
                                                    <p className="text-sm font-medium opacity-90">Berikan ke penjual <strong className="text-[#FF9500]">HANYA</strong> jika barang sudah diterima & dicek.</p>
                                                </div>
                                            </div>
                                            <div className="relative z-10 bg-white text-[#00478F] px-8 py-3 rounded-xl font-black text-3xl tracking-[0.4em] shadow-inner border-2 border-[#FF9500]">
                                                {trx.codPin}
                                            </div>
                                        </div>
                                    )}

                                    {/* 2. PENJUAL: INPUT PIN PEMBELI */}
                                    {activeTab === 'penjualan' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                        <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                            <div className="flex items-start gap-4 flex-1">
                                                <div className="w-12 h-12 bg-[#FF9500]/10 rounded-full flex items-center justify-center shrink-0">
                                                    <Lock size={24} className="text-[#FF9500]" />
                                                </div>
                                                <div>
                                                    <p className="font-black text-slate-800 text-lg mb-1">Verifikasi Transaksi COD</p>
                                                    <p className="text-xs text-slate-500 font-medium leading-relaxed">Minta 4-Digit PIN dari pembeli saat ketemuan untuk mencairkan dana Anda ke rekening.</p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                                <input 
                                                    type="text" 
                                                    maxLength="4" 
                                                    placeholder="• • • •"
                                                    value={pinInputs[trx._id] || ''}
                                                    onChange={(e) => {
                                                        const val = e.target.value.replace(/\D/g, ''); // Hanya angka
                                                        setPinInputs({...pinInputs, [trx._id]: val})
                                                    }}
                                                    className="w-full sm:w-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-center text-xl tracking-[0.5em] font-black focus:border-[#00478F] outline-none transition-colors"
                                                />
                                                <button 
                                                    onClick={() => handleVerifyPin(trx._id)}
                                                    disabled={verifying || (pinInputs[trx._id]?.length !== 4)}
                                                    className="w-full sm:w-auto bg-[#00478F] text-white font-black px-8 py-3 rounded-xl hover:bg-[#FF9500] transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                                                >
                                                    {verifying ? 'Cek...' : 'Cairkan'}
                                                </button>
                                            </div>
                                        </div>
                                    )}

                                    {/* 3. PENJUAL: MENUNGGU TRANSFER ADMIN */}
                                    {trx.status === 'Selesai' && activeTab === 'penjualan' && (
                                        <div className="mt-6 p-5 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center shrink-0">
                                                <Landmark size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-purple-900">COD Berhasil! Menunggu Transfer Admin</p>
                                                <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">Dana <strong>Rp{(trx.sellerIncome || priceToDisplay).toLocaleString('id-ID')}</strong> akan ditransfer ke rekening Anda dalam waktu maksimal 1x24 jam kerja.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* 4. PENJUAL: DANA SUDAH CAIR */}
                                    {trx.status === 'Dana Dicairkan' && activeTab === 'penjualan' && (
                                        <div className="mt-6 p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0">
                                                <CheckCircle size={20} />
                                            </div>
                                            <div>
                                                <p className="text-sm font-black text-green-900">Transaksi Selesai & Dana Telah Cair</p>
                                                <p className="text-xs text-green-700 mt-1 font-medium">Silakan cek mutasi Rekening atau E-Wallet Anda.</p>
                                            </div>
                                        </div>
                                    )}

                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}