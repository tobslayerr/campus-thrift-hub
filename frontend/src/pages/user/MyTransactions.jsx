import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../api/axios';

export default function MyTransactions() {
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pembelian');
    
    // State untuk menyimpan input PIN dari penjual
    const [pinInputs, setPinInputs] = useState({});
    const [verifying, setVerifying] = useState(false);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions/my-transactions');
            setPurchases(response.data.data.purchases || []);
            setSales(response.data.data.sales || []);
        } catch (error) {
            console.error("Gagal memuat transaksi", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // FUNGSI: Penjual Memverifikasi PIN
    const handleVerifyPin = async (transactionId) => {
        const pin = pinInputs[transactionId];
        if (!pin || pin.length !== 4) {
            return alert('Masukkan 4 digit PIN dengan benar!');
        }

        setVerifying(true);
        try {
            const response = await api.post(`/transactions/${transactionId}/verify-pin`, { pin });
            alert(response.data.message);
            // Refresh data setelah berhasil agar lencana berubah jadi Selesai
            fetchTransactions(); 
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal memverifikasi PIN');
        } finally {
            setVerifying(false);
        }
    };

    const getStatusBadge = (status) => {
        switch (status) {
            case 'Menunggu Verifikasi':
                return <span className="bg-orange-100 text-orange-600 px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest border border-orange-200">⏳ Cek Admin</span>;
            case 'Dana Ditahan (Siap COD)':
                return <span className="bg-blue-100 text-blue-600 px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-200">🛡️ Dana Aman (COD)</span>;
            case 'Selesai':
                return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest border border-purple-200">⏳ Proses Pencairan</span>;
            case 'Dana Dicairkan':
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest border border-green-200">✅ Dana Cair</span>;
            case 'Sengketa':
                return <span className="bg-red-100 text-red-600 px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest border border-red-200">⚠️ Sengketa</span>;
            default:
                return <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-md text-[10px] md:text-xs font-black uppercase tracking-widest">{status || 'Diproses'}</span>;
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center mt-40">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-brand-yellow"></div>
        </div>
    );

    const activeData = activeTab === 'pembelian' ? purchases : sales;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-20 min-h-[80vh]">
            <h1 className="text-3xl font-black text-gray-900 mb-2 flex items-center gap-3">
                <span>📋</span> Status Transaksi
            </h1>
            <p className="text-gray-500 font-medium mb-8">Pantau keamanan dana dan status barang Anda yang dikelola oleh Admin.</p>

            <div className="flex gap-6 border-b border-gray-200 mb-6">
                <button 
                    onClick={() => setActiveTab('pembelian')} 
                    className={`pb-4 font-black text-base md:text-lg transition-all ${activeTab === 'pembelian' ? 'text-brand-dark border-b-4 border-brand-yellow' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Pembelian ({purchases.length})
                </button>
                <button 
                    onClick={() => setActiveTab('penjualan')} 
                    className={`pb-4 font-black text-base md:text-lg transition-all ${activeTab === 'penjualan' ? 'text-brand-dark border-b-4 border-brand-yellow' : 'text-gray-400 hover:text-gray-600'}`}
                >
                    Penjualan ({sales.length})
                </button>
            </div>

            {activeData.length === 0 ? (
                <div className="bg-white border-2 border-dashed border-gray-200 rounded-3xl p-12 text-center shadow-sm">
                    <p className="text-gray-400 font-bold italic text-lg mb-2">Belum ada transaksi di tab ini.</p>
                    <Link to="/" className="text-brand-yellow font-black hover:underline">Cari barang thrift sekarang!</Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeData.map((trx) => {
                        const productData = trx.productId || trx.product || {};
                        const opponentData = activeTab === 'pembelian' ? (trx.sellerId || trx.seller || {}) : (trx.buyerId || trx.buyer || {});
                        const priceToDisplay = trx.amount || trx.price || productData.price || 0;

                        return (
                            <div key={trx._id} className="bg-white p-5 rounded-3xl border border-gray-100 shadow-sm hover:shadow-md transition flex flex-col gap-4">
                                
                                <div className="flex flex-col md:flex-row gap-6 items-start md:items-center">
                                    {/* Info Produk */}
                                    <div className="flex items-center gap-4 flex-1">
                                        <img src={productData.imageUrl || 'https://via.placeholder.com/150'} alt="produk" className="w-20 h-20 rounded-xl object-cover border border-gray-100" />
                                        <div>
                                            <h3 className="font-bold text-gray-900 line-clamp-1">{productData.title || 'Produk Dihapus'}</h3>
                                            <p className="font-black text-brand-yellow mt-1">Rp {priceToDisplay.toLocaleString('id-ID')}</p>
                                            <p className="text-xs text-gray-400 font-bold mt-2">
                                                {new Date(trx.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'short', year:'numeric' })}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Info Lawan Transaksi */}
                                    <div className="flex-1 border-t md:border-t-0 md:border-l border-gray-100 pt-4 md:pt-0 md:pl-6 w-full md:w-auto">
                                        <p className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2">
                                            {activeTab === 'pembelian' ? 'Penjual' : 'Pembeli'}
                                        </p>
                                        <div className="flex items-center gap-3">
                                            <img src={opponentData.profilePicture || 'https://via.placeholder.com/150'} alt="avatar" className="w-8 h-8 rounded-full border border-gray-200" />
                                            <div>
                                                <p className="font-bold text-gray-800 text-sm">{opponentData.name || 'User Tidak Diketahui'}</p>
                                                <p className="text-xs text-gray-500 font-medium truncate max-w-[150px]">
                                                    {opponentData.campus || opponentData.domisili || 'Lokasi tidak diketahui'}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Status & Chat */}
                                    <div className="flex flex-row md:flex-col items-center md:items-end justify-between w-full md:w-auto border-t md:border-t-0 border-gray-100 pt-4 md:pt-0 gap-4">
                                        {getStatusBadge(trx.status)}
                                        {opponentData._id && (
                                            <Link to={`/chat/${opponentData._id}`} className="text-xs font-black text-brand-dark bg-gray-100 hover:bg-gray-200 px-4 py-2 rounded-lg transition">
                                                💬 Hubungi
                                            </Link>
                                        )}
                                    </div>
                                </div>

                                {/* ========================================== */}
                                {/* LOGIKA PIN COD (PEMBELI vs PENJUAL)        */}
                                {/* ========================================== */}
                                
                                {/* 1. JIKA PEMBELI: Tampilkan PIN Rahasia saat Dana Ditahan */}
                                {activeTab === 'pembelian' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                    <div className="mt-2 p-4 bg-yellow-50 border border-yellow-200 rounded-2xl flex flex-col items-center text-center">
                                        <p className="text-xs text-brand-dark font-black uppercase tracking-widest mb-1">PIN RAHASIA COD ANDA</p>
                                        <p className="text-4xl font-black tracking-[0.5em] text-gray-900 bg-white px-6 py-2 rounded-xl shadow-sm border border-yellow-100">{trx.codPin}</p>
                                        <p className="text-xs text-gray-500 mt-3 font-medium">Berikan PIN ini ke penjual <strong className="text-red-500 font-bold">HANYA</strong> jika Anda sudah menerima dan mengecek barang saat COD.</p>
                                    </div>
                                )}

                                {/* 2. JIKA PENJUAL: Tampilkan Form Input PIN saat Dana Ditahan */}
                                {activeTab === 'penjualan' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                    <div className="mt-2 p-4 bg-gray-50 border border-gray-200 rounded-2xl">
                                        <p className="text-xs text-gray-500 font-bold mb-3 text-center md:text-left">
                                            Masukkan 4-Digit PIN dari pembeli untuk menyelesaikan transaksi dan mencairkan dana.
                                        </p>
                                        <div className="flex flex-col md:flex-row gap-3">
                                            <input 
                                                type="text" 
                                                maxLength="4" 
                                                placeholder="0 0 0 0"
                                                value={pinInputs[trx._id] || ''}
                                                onChange={(e) => setPinInputs({...pinInputs, [trx._id]: e.target.value})}
                                                className="flex-1 px-4 py-3 bg-white border border-gray-300 rounded-xl text-center text-2xl tracking-[1em] font-black focus:ring-2 focus:ring-brand-yellow outline-none"
                                            />
                                            <button 
                                                onClick={() => handleVerifyPin(trx._id)}
                                                disabled={verifying}
                                                className="bg-brand-dark text-brand-yellow font-black px-8 py-3 rounded-xl hover:bg-black transition disabled:opacity-50"
                                            >
                                                {verifying ? 'Mengecek...' : 'Verifikasi PIN'}
                                            </button>
                                        </div>
                                    </div>
                                )}

                                {/* 3. JIKA STATUS SELESAI (NUNGGU ADMIN TRANSFER) */}
                                {trx.status === 'Selesai' && activeTab === 'penjualan' && (
                                    <div className="mt-2 p-4 bg-purple-50 border border-purple-200 rounded-2xl flex items-center gap-4">
                                        <div className="text-3xl">🏦</div>
                                        <div>
                                            <p className="text-sm font-black text-purple-900">COD Berhasil! Menunggu Pencairan Dana</p>
                                            <p className="text-xs text-purple-700 mt-1 font-medium">Dana sebesar <strong className="font-black">Rp {trx.sellerIncome?.toLocaleString('id-ID')}</strong> sedang diproses oleh Admin ke rekening Anda. Estimasi maksimal <strong>1x24 Jam Kerja</strong>.</p>
                                        </div>
                                    </div>
                                )}

                                {/* 4. JIKA STATUS DANA CAIR */}
                                {trx.status === 'Dana Dicairkan' && activeTab === 'penjualan' && (
                                    <div className="mt-2 p-4 bg-green-50 border border-green-200 rounded-2xl flex items-center gap-4">
                                        <div className="text-3xl">💸</div>
                                        <div>
                                            <p className="text-sm font-black text-green-900">Dana Telah Berhasil Dicairkan!</p>
                                            <p className="text-xs text-green-700 mt-1 font-medium">Silakan cek mutasi Rekening / E-Wallet / rekening QRIS Anda.</p>
                                        </div>
                                    </div>
                                )}
                                {/* ========================================== */}

                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
}