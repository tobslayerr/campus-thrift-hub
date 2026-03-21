import { useState, useEffect } from 'react';
import api from '../../api/axios';
import useAdminAuthStore from '../../store/adminAuthStore';

export default function AdminDashboard() {
    const { admin } = useAdminAuthStore();
    const [transactions, setTransactions] = useState([]);
    const [loading, setLoading] = useState(true);
    const [actionLoading, setActionLoading] = useState(null);

    const fetchTransactions = async () => {
        try {
            // Mengambil semua transaksi (Khusus Admin)
            const response = await api.get('/transactions');
            setTransactions(response.data.data);
        } catch (error) {
            console.error("Gagal memuat data admin", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTransactions();
    }, []);

    // FUNGSI 1: Admin Memvalidasi Uang Masuk dari Pembeli
    const handleValidasiPembayaran = async (id) => {
        if (!window.confirm('Yakin ingin memvalidasi pembayaran ini? Dana akan dianggap sudah masuk ke rekening sistem.')) return;
        
        setActionLoading(id);
        try {
            await api.put(`/transactions/${id}/status`, { 
                status: 'Dana Ditahan (Siap COD)' 
            });
            alert('Validasi Berhasil! Penjual dan Pembeli sekarang bisa melakukan COD.');
            fetchTransactions(); 
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal memvalidasi');
        } finally {
            setActionLoading(null);
        }
    };

    // FUNGSI 2: Admin Mengonfirmasi Uang Sudah Ditransfer Manual ke Penjual
    const handleDisburse = async (id) => {
        if (!window.confirm('YAKIN? Pastikan Anda SUDAH mentransfer uang ke rekening penjual sebelum menekan OK!')) return;
        
        setActionLoading(id);
        try {
            await api.put(`/transactions/${id}/disburse`);
            alert('Sukses! Transaksi sepenuhnya selesai dan dana telah dicairkan.');
            fetchTransactions(); 
        } catch (error) {
            alert(error.response?.data?.message || 'Gagal mengubah status pencairan');
        } finally {
            setActionLoading(null);
        }
    };

    // Helper: Badge untuk Status Escrow (Aliran Uang)
    const getEscrowBadge = (status) => {
        switch (status) {
            case 'Menunggu Verifikasi': 
                return <span className="bg-orange-100 text-orange-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-orange-200">Cek Struk</span>;
            case 'Dana Ditahan (Siap COD)': 
                return <span className="bg-blue-100 text-blue-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-blue-200">Dana Aman</span>;
            case 'Selesai': 
                return <span className="bg-purple-100 text-purple-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-purple-200">Wajib Cairkan</span>;
            case 'Dana Dicairkan': 
                return <span className="bg-green-100 text-green-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest border border-green-200">Dana Cair</span>;
            default: 
                return <span className="bg-gray-100 text-gray-700 px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest">{status}</span>;
        }
    };

    // Helper: Laporan Fisik Barang (Diterima / Belum)
    const getBarangStatus = (status) => {
        switch (status) {
            case 'Menunggu Verifikasi': 
                return <span className="text-gray-400 font-bold text-sm">📦 Menunggu Validasi</span>;
            case 'Dana Ditahan (Siap COD)': 
                return <span className="text-blue-500 font-bold text-sm">🚚 Sedang COD (Belum Diterima)</span>;
            case 'Selesai': 
            case 'Dana Dicairkan':
                return <span className="text-green-600 font-bold text-sm flex items-center gap-1">✅ Sudah Diterima Pembeli</span>;
            default: 
                return <span className="text-gray-500 font-bold text-sm">-</span>;
        }
    };

    if (loading) return (
        <div className="min-h-screen flex items-center justify-center bg-slate-50">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-slate-900"></div>
        </div>
    );

    return (
        <div className="max-w-7xl mx-auto p-4 md:p-8 pb-20">
            {/* Header Admin */}
            <div className="bg-slate-900 text-white p-8 rounded-3xl shadow-xl mb-8 flex flex-col md:flex-row justify-between items-center gap-6">
                <div>
                    <h1 className="text-3xl font-black tracking-tight mb-2">Pusat Kendali Escrow</h1>
                    <p className="text-slate-400 font-medium">Selamat datang, <span className="text-brand-yellow font-bold">{admin?.email}</span>. Pantau lalu lintas uang dan barang di sini.</p>
                </div>
                <div className="bg-slate-800 p-4 rounded-2xl border border-slate-700 text-center min-w-[200px]">
                    <p className="text-xs text-slate-400 font-black uppercase tracking-widest mb-1">Total Transaksi</p>
                    <p className="text-3xl font-black text-brand-yellow">{transactions.length}</p>
                </div>
            </div>

            {/* Tabel Transaksi */}
            <div className="bg-white rounded-3xl shadow-sm border border-gray-200 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse min-w-[1000px]">
                        <thead>
                            <tr className="bg-slate-50 text-slate-500 text-[10px] uppercase tracking-widest font-black border-b border-gray-200">
                                <th className="p-5">ID & Tanggal</th>
                                <th className="p-5">Produk & Harga</th>
                                <th className="p-5">Aktor (P vs P)</th>
                                <th className="p-5">Status Uang</th>
                                <th className="p-5">Status Barang</th>
                                <th className="p-5 text-right">Aksi Admin</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100">
                            {transactions.length === 0 ? (
                                <tr>
                                    <td colSpan="6" className="p-10 text-center text-gray-400 font-bold italic">Belum ada transaksi di platform ini.</td>
                                </tr>
                            ) : (
                                transactions.map((trx) => (
                                    <tr key={trx._id} className="hover:bg-slate-50 transition">
                                        
                                        <td className="p-5 align-top">
                                            <p className="font-mono text-xs text-slate-400 font-bold mb-1">#{trx._id.slice(-6).toUpperCase()}</p>
                                            <p className="text-sm font-bold text-slate-700">
                                                {new Date(trx.createdAt).toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' })}
                                            </p>
                                        </td>

                                        <td className="p-5 align-top">
                                            <p className="font-bold text-slate-900 line-clamp-1 max-w-[200px]">{trx.productId?.title || 'Produk Dihapus'}</p>
                                            <p className="font-black text-brand-yellow mt-1">Rp {trx.price?.toLocaleString('id-ID')}</p>
                                            {trx.proofOfPayment && (
                                                <a href={trx.proofOfPayment} target="_blank" rel="noreferrer" className="text-[10px] text-blue-500 font-black hover:underline mt-2 inline-block">
                                                    📄 Lihat Struk Pembeli
                                                </a>
                                            )}
                                        </td>

                                        <td className="p-5 align-top">
                                            <div className="space-y-2">
                                                <p className="text-xs"><span className="font-black text-slate-300 uppercase tracking-widest text-[9px]">Pembeli:</span> <br/><span className="font-bold text-slate-800">{trx.buyerId?.name || '-'}</span></p>
                                                <p className="text-xs"><span className="font-black text-slate-300 uppercase tracking-widest text-[9px]">Penjual:</span> <br/><span className="font-bold text-slate-800">{trx.sellerId?.name || '-'}</span></p>
                                            </div>
                                        </td>

                                        <td className="p-5 align-top">
                                            {getEscrowBadge(trx.status)}
                                        </td>

                                        <td className="p-5 align-top">
                                            {getBarangStatus(trx.status)}
                                        </td>

                                        <td className="p-5 align-top text-right">
                                            
                                            {/* TAHAP 1: VALIDASI PEMBAYARAN */}
                                            {trx.status === 'Menunggu Verifikasi' && (
                                                <button 
                                                    onClick={() => handleValidasiPembayaran(trx._id)}
                                                    disabled={actionLoading === trx._id}
                                                    className="bg-slate-900 text-white font-black text-[10px] px-4 py-2 rounded-lg hover:bg-slate-800 transition disabled:opacity-50 whitespace-nowrap uppercase tracking-wider"
                                                >
                                                    {actionLoading === trx._id ? 'Memproses...' : 'Validasi Uang Masuk'}
                                                </button>
                                            )}

                                            {/* TAHAP 2: COD BERLANGSUNG */}
                                            {trx.status === 'Dana Ditahan (Siap COD)' && (
                                                <span className="text-xs text-slate-400 font-bold italic">Menunggu PIN dari User...</span>
                                            )}
                                            
                                            {/* TAHAP 3: COD SELESAI (ADMIN WAJIB TRANSFER KE PENJUAL) */}
                                            {trx.status === 'Selesai' && (
                                                <div className="flex flex-col items-end gap-2 text-left w-full">
                                                    <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100 text-xs w-full max-w-[280px] mb-2 shadow-sm">
                                                        <p className="font-black text-purple-900 mb-2 border-b border-purple-100 pb-1">🏦 DATA TRANSFER PENJUAL:</p>
                                                        <div className="space-y-1 font-bold text-slate-700">
                                                            <p>Bank: <span className="text-slate-900">{trx.sellerId?.bankName || 'N/A'}</span></p>
                                                            <p>No Rek: <span className="text-slate-900">{trx.sellerId?.bankAccount || 'N/A'}</span></p>
                                                            {trx.sellerId?.qrisUrl && (
                                                                <a href={trx.sellerId.qrisUrl} target="_blank" rel="noreferrer" className="text-blue-600 font-black hover:underline mt-2 flex items-center gap-1">
                                                                    📷 Lihat QRIS Penjual
                                                                </a>
                                                            )}
                                                        </div>
                                                        <hr className="my-3 border-purple-200" />
                                                        <p className="font-black text-green-700 text-sm">Transfer: Rp {trx.sellerIncome?.toLocaleString('id-ID')}</p>
                                                        <p className="font-bold text-slate-500 text-[10px]">Komisi Admin: Rp {trx.adminFee?.toLocaleString('id-ID')}</p>
                                                    </div>
                                                    
                                                    <button 
                                                        onClick={() => handleDisburse(trx._id)} 
                                                        disabled={actionLoading === trx._id} 
                                                        className="bg-green-600 text-white font-black text-[10px] px-5 py-3 rounded-xl hover:bg-green-700 transition disabled:opacity-50 w-full max-w-[280px] shadow-lg shadow-green-100 uppercase tracking-widest"
                                                    >
                                                        {actionLoading === trx._id ? 'Processing...' : '✅ Selesai Ditransfer'}
                                                    </button>
                                                </div>
                                            )}

                                            {/* TAHAP 4: TRANSAKSI CLOSED */}
                                            {trx.status === 'Dana Dicairkan' && (
                                                <div className="flex flex-col items-end gap-1">
                                                    <span className="text-xs text-green-600 font-black flex items-center justify-end gap-1">
                                                        ✅ TRANSAKSI CLOSED
                                                    </span>
                                                    <p className="text-[10px] text-slate-400 font-bold italic">Dana telah sampai di penjual.</p>
                                                </div>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}