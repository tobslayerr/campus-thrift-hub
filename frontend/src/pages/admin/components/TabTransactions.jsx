import { useState, useMemo } from 'react';
import { ShieldCheck, ImageIcon, Package, MapPin, Eye, User, Search, Download, AlertCircle, FileText, X } from 'lucide-react';
import Pagination from './Pagination';
import toast from 'react-hot-toast';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable'; 

export default function TabTransactions({ 
    transactions, 
    statusFilter, 
    setStatusFilter, 
    currentPage, 
    setCurrentPage, 
    itemsPerPage, 
    handleVerifyPayment, 
    handleDisburseFunds 
}) {
    // State Filter Lokal untuk Kampus Penjual
    const [campusFilterText, setCampusFilterText] = useState('');

    // State untuk Modal Export PDF
    const [isExportModalOpen, setIsExportModalOpen] = useState(false);
    const [exportType, setExportType] = useState('system'); // 'system' | 'user'
    const [selectedExportUserId, setSelectedExportUserId] = useState('');
    const [exportUserRole, setExportUserRole] = useState('seller'); // 'seller' | 'buyer'

    // Ekstrak user unik dari daftar transaksi untuk dropdown filter spesifik user
    const uniqueUsers = useMemo(() => {
        const users = [];
        const map = new Map();
        transactions.forEach(t => {
            if (t.sellerId && typeof t.sellerId === 'object' && !map.has(t.sellerId._id)) {
                map.set(t.sellerId._id, true);
                users.push({ id: t.sellerId._id, name: t.sellerId.name, email: t.sellerId.email });
            }
            if (t.buyerId && typeof t.buyerId === 'object' && !map.has(t.buyerId._id)) {
                map.set(t.buyerId._id, true);
                users.push({ id: t.buyerId._id, name: t.buyerId.name, email: t.buyerId.email });
            }
        });
        return users;
    }, [transactions]);

    // Pertama, filter berdasarkan Status (Kecuali tab Refund)
    const statusFiltered = statusFilter === 'Semua' 
        ? transactions.filter(t => !['Refund Diajukan', 'Refund Diproses', 'Refund Selesai', 'Dibatalkan'].includes(t.status))
        : transactions.filter(t => t.status === statusFilter);

    // Kedua, filter berdasarkan text input Kampus Penjual
    const finalFiltered = campusFilterText.trim() === ''
        ? statusFiltered
        : statusFiltered.filter(t => {
            const campusName = t.sellerId?.campus || '';
            return campusName.toLowerCase().includes(campusFilterText.toLowerCase());
        });

    const displayedTransactions = finalFiltered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    
    const filterOptions = ['Semua', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Barang Dikirim', 'Selesai', 'Dana Dicairkan'];

    // Helper function untuk extract nama dan kampus dengan aman
    const getUserInfo = (userObj, defaultName = 'User Hapus') => {
        if (!userObj) return { name: defaultName, campus: '?' };
        if (typeof userObj === 'string') return { name: 'ID: ' + userObj.substring(0,6) + '...', campus: '?' };
        return { name: userObj.name || defaultName, campus: userObj.campus || '?' };
    };

    // ============================================================
    // 🌟 FUNGSI EXPORT KE PDF: LAPORAN SISTEM / ADMIN
    // ============================================================
    const exportPDFSystem = () => {
        const doc = new jsPDF('landscape');
        doc.setFontSize(18);
        doc.text('Laporan Keuangan & Transaksi Sistem (Campus Thrift Hub)', 14, 22);
        doc.setFontSize(11);
        doc.setTextColor(100);
        doc.text(`Tanggal Cetak: ${new Date().toLocaleString('id-ID')}`, 14, 30);

        // 1. Filter Data: Selesai / Profit Bersih
        const completedTrx = transactions.filter(t => ['Selesai', 'Dana Dicairkan'].includes(t.status));
        const totalProfit = completedTrx.reduce((sum, t) => sum + (t.adminFee || 0), 0);
        const totalGMV = completedTrx.reduce((sum, t) => sum + (t.price || 0), 0);

        // 2. Filter Data: Escrow / Dana Tertahan
        const escrowTrx = transactions.filter(t => ['Dana Ditahan (Siap COD)', 'Barang Dikirim'].includes(t.status));
        const totalEscrow = escrowTrx.reduce((sum, t) => sum + (t.price || 0), 0);

        // BAGIAN 1: TRANSAKSI SELESAI (PROFIT)
        doc.setFontSize(14);
        doc.setTextColor(0, 0, 0);
        doc.text(`1. Transaksi Selesai & Pencairan (Total Profit Admin: Rp${totalProfit.toLocaleString('id-ID')})`, 14, 45);
        doc.setFontSize(10);
        doc.text(`Total Nilai Transaksi (GMV): Rp${totalGMV.toLocaleString('id-ID')} dari ${completedTrx.length} transaksi`, 14, 52);

        const tableCompleted = completedTrx.map(t => [
            t.transactionId || '-',
            new Date(t.createdAt).toLocaleDateString('id-ID'),
            t.productId?.title || 'Barang Dihapus',
            getUserInfo(t.sellerId).name,
            `Rp${t.price.toLocaleString('id-ID')}`,
            `Rp${(t.adminFee || 0).toLocaleString('id-ID')}`, // Fee Admin
            `Rp${(t.sellerIncome || t.price).toLocaleString('id-ID')}`,
            t.status
        ]);

        autoTable(doc, {
            startY: 56,
            head: [['ID Trx', 'Tanggal', 'Nama Barang', 'Penjual', 'Harga Barang', 'Fee Admin', 'Diterima Penjual', 'Status']],
            body: tableCompleted,
            theme: 'grid',
            headStyles: { fillColor: [0, 71, 143] }, // Warna Biru CTH
            styles: { fontSize: 8 },
        });

        // BAGIAN 2: TRANSAKSI ESCROW (DANA TERTAHAN)
        const finalY = doc.lastAutoTable.finalY || 60;
        doc.setFontSize(14);
        doc.text(`2. Dana Tertahan / Escrow (Total Dana Mengendap: Rp${totalEscrow.toLocaleString('id-ID')})`, 14, finalY + 15);
        doc.setFontSize(10);
        doc.text(`Terdapat ${escrowTrx.length} transaksi yang masih dalam proses pengiriman/COD.`, 14, finalY + 22);

        const tableEscrow = escrowTrx.map(t => [
            t.transactionId || '-',
            new Date(t.createdAt).toLocaleDateString('id-ID'),
            t.productId?.title || 'Barang Dihapus',
            getUserInfo(t.buyerId).name,
            getUserInfo(t.sellerId).name,
            `Rp${t.price.toLocaleString('id-ID')}`,
            t.paymentMethod || 'BANK',
            t.status
        ]);

        autoTable(doc, {
            startY: finalY + 26,
            head: [['ID Trx', 'Tanggal', 'Nama Barang', 'Pembeli', 'Penjual', 'Dana Masuk', 'Metode Bayar', 'Status Pengiriman']],
            body: tableEscrow,
            theme: 'grid',
            headStyles: { fillColor: [255, 149, 0] }, // Warna Orange CTH
            styles: { fontSize: 8 },
        });

        doc.save(`Laporan_Sistem_CTH_${new Date().toISOString().slice(0,10)}.pdf`);
        toast.success("Laporan Sistem berhasil diunduh!");
        setIsExportModalOpen(false);
    };

    // ============================================================
    // 🌟 FUNGSI EXPORT KE PDF: REKAM JEJAK USER (SPESIFIK)
    // ============================================================
    const exportPDFUser = () => {
        if (!selectedExportUserId) return toast.error("Pilih pengguna terlebih dahulu!");

        const userObj = uniqueUsers.find(u => u.id === selectedExportUserId);
        const roleLabel = exportUserRole === 'seller' ? 'Penjual' : 'Pembeli';

        // Filter transaksi berdasarkan user ID dan perannya
        const userTransactions = transactions.filter(t => {
            const targetId = exportUserRole === 'seller' ? t.sellerId : t.buyerId;
            return targetId && (targetId._id === selectedExportUserId || targetId === selectedExportUserId);
        });

        const doc = new jsPDF('landscape');
        doc.setFontSize(18);
        doc.text(`Rekam Jejak Transaksi Pengguna`, 14, 22);
        doc.setFontSize(12);
        doc.text(`Nama: ${userObj?.name || 'Tidak Diketahui'} | Sebagai: ${roleLabel}`, 14, 30);
        doc.setFontSize(10);
        doc.setTextColor(100);
        doc.text(`Total Transaksi: ${userTransactions.length} | Dicetak: ${new Date().toLocaleString('id-ID')}`, 14, 36);

        const tableData = userTransactions.map(t => [
            t.transactionId || '-',
            new Date(t.createdAt).toLocaleDateString('id-ID'),
            t.productId?.title || 'Barang Dihapus',
            exportUserRole === 'seller' ? getUserInfo(t.buyerId).name : getUserInfo(t.sellerId).name, // Lawan transaksi
            `Rp${t.price.toLocaleString('id-ID')}`,
            exportUserRole === 'seller' ? `Rp${(t.sellerIncome || t.price).toLocaleString('id-ID')}` : '-', // Income jika dia penjual
            t.status
        ]);

        autoTable(doc, {
            startY: 42,
            head: [['ID Trx', 'Tanggal', 'Nama Barang', exportUserRole === 'seller' ? 'Pembeli' : 'Penjual', 'Harga Barang', 'Pendapatan (Net)', 'Status']],
            body: tableData,
            theme: 'grid',
            headStyles: { fillColor: [0, 71, 143] },
            styles: { fontSize: 9 },
        });

        doc.save(`Track_Record_${userObj?.name?.replace(/\s+/g, '_')}_${roleLabel}.pdf`);
        toast.success("Laporan Pengguna berhasil diunduh!");
        setIsExportModalOpen(false);
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Header Filter (Status & Pencarian Kampus & EXPORT) */}
            <div className="flex flex-col xl:flex-row xl:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map(status => (
                        <button key={status} onClick={() => {setStatusFilter(status); setCurrentPage(1);}} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-[#00478F] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>{status}</button>
                    ))}
                </div>
                
                <div className="flex items-center gap-3 w-full xl:w-auto">
                    <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center flex-1 xl:w-64 shadow-sm">
                        <Search size={16} className="text-slate-400 ml-2 mr-2 shrink-0" />
                        <input 
                            type="text" 
                            placeholder="Filter Kampus Penjual..." 
                            value={campusFilterText}
                            onChange={(e) => { setCampusFilterText(e.target.value); setCurrentPage(1); }}
                            className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-700 min-w-0"
                        />
                    </div>
                    
                    <button 
                        onClick={() => setIsExportModalOpen(true)}
                        className="flex items-center justify-center gap-2 bg-green-600 text-white px-5 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-green-700 transition-all shadow-sm active:scale-95 shrink-0"
                        title="Download Laporan PDF"
                    >
                        <FileText size={16} /> Export PDF
                    </button>
                </div>
            </div>
            
            {displayedTransactions.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-200 shadow-sm"><ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" /><h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Tidak ada data</h3></div>
            ) : (
                <>
                    <div className="grid gap-6">
                        {displayedTransactions.map((trx) => {
                            const isQRISMethod = trx.paymentMethod?.toLowerCase().includes('qris');
                            const buyerInfo = getUserInfo(trx.buyerId, 'Pembeli');
                            const sellerInfo = getUserInfo(trx.sellerId, 'Penjual');

                            // 🌟 PENGECEKAN STATUS UNTUK FOKUS TRANSFER ADMIN
                            const isPendingDisbursement = trx.status === 'Selesai';

                            return (
                                <div key={trx._id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-start justify-between gap-8 hover:border-[#00478F]/30 transition-all group">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                        
                                        <div>
                                            <div className="flex items-center gap-2 mb-2">
                                                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest block">Informasi Barang & Dana</span>
                                                <span className="bg-blue-50 text-[#00478F] border border-blue-100 font-mono text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">{trx.transactionId || 'CTH-LEGACY'}</span>
                                            </div>
                                            <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-3">{trx.productId?.title || 'Barang Dihapus'}</h4>
                                            
                                            <div className="bg-blue-50 p-3 rounded-xl border border-blue-100 mb-4">
                                                <div className="flex justify-between items-center text-xs font-bold text-slate-500 mb-1"><span>Pembeli Bayar:</span><span>Rp{trx.price.toLocaleString('id-ID')}</span></div>
                                                <div className="flex justify-between items-center text-xs font-bold text-red-500 mb-2 pb-2 border-b border-blue-200/50"><span>Potongan Sistem:</span><span>- Rp{(trx.adminFee || 0).toLocaleString('id-ID')}</span></div>
                                                <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Transfer ke Penjual:</span><span className="font-black text-[#00478F] text-lg">Rp{(trx.sellerIncome || trx.price).toLocaleString('id-ID')}</span></div>
                                            </div>

                                            <div className="mt-2 space-y-2">
                                                <p className="text-xs flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> 
                                                    <span className="font-bold text-slate-400 w-16">Pembeli</span> 
                                                    <span className="font-black text-slate-700 truncate">: {buyerInfo.name} 
                                                        <span className="font-medium text-[10px] text-slate-400 ml-1">({buyerInfo.campus})</span>
                                                    </span>
                                                </p>
                                                <p className="text-xs flex items-center gap-2">
                                                    <span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> 
                                                    <span className="font-bold text-slate-400 w-16">Penjual</span> 
                                                    <span className="font-black text-slate-700 truncate">: {sellerInfo.name} 
                                                        <span className="font-black text-[#FF9500] text-[10px] ml-1">({sellerInfo.campus})</span>
                                                    </span>
                                                </p>
                                            </div>
                                        </div>

                                        <div className="flex flex-col gap-6">
                                            
                                            {/* 🌟 SEMBUNYIKAN INFO PEMBELI JIKA ADMIN HARUS FOKUS TRANSFER ('Selesai') 🌟 */}
                                            {!isPendingDisbursement && (
                                                <>
                                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl relative overflow-hidden">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">Pembayaran Pembeli</span>
                                                        <div className={`px-4 py-2 rounded-xl border shadow-sm inline-block text-xs font-black uppercase tracking-widest ${isQRISMethod ? 'bg-orange-500 text-white border-orange-400' : 'bg-[#00478F] text-white border-blue-900'}`}>{isQRISMethod ? 'QRIS' : trx.paymentMethod || 'BANK'}</div>
                                                    </div>

                                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl relative overflow-hidden">
                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">Metode Pengiriman</span>
                                                        {trx.deliveryMethod === 'Pengiriman' ? (
                                                            <div>
                                                                <div className="px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-blue-100 text-blue-700 border-blue-200 mb-3"><Package size={12} /> Ekspedisi</div>
                                                                <div className="space-y-2 border-t border-slate-200 pt-3">
                                                                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Alamat Pengiriman</p><p className="text-xs font-bold text-slate-800 leading-relaxed">{trx.buyerAddress || 'Belum diatur'}</p></div>
                                                                    <div className="grid grid-cols-2 gap-2">
                                                                        <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Patokan</p><p className="text-xs font-bold text-slate-800 line-clamp-1">{trx.buyerLocationPoint || '-'}</p></div>
                                                                        <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">No. Telepon</p><p className="text-xs font-bold text-slate-800">{trx.buyerPhone || '-'}</p></div>
                                                                    </div>
                                                                    {trx.shippingCourier && (
                                                                        <div className="mt-3 p-3 bg-blue-50/50 rounded-xl border border-blue-100">
                                                                            <p className="text-[9px] font-bold text-blue-500 uppercase tracking-wider">Resi ({trx.shippingCourier})</p>
                                                                            <p className="text-xs font-mono font-black text-blue-800 tracking-widest">{trx.shippingResi}</p>
                                                                        </div>
                                                                    )}
                                                                </div>
                                                            </div>
                                                        ) : (
                                                            <div>
                                                                <div className="px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border-orange-200 mb-3"><MapPin size={12} /> COD (Ketemuan)</div>
                                                                <div className="space-y-2 border-t border-slate-200 pt-3">
                                                                    <div><p className="text-[9px] font-bold text-slate-400 uppercase tracking-wider">Titik Temu Spesifik</p><p className="text-xs font-bold text-slate-800 leading-relaxed">{trx.codMeetingPoint || 'Belum ditentukan'}</p></div>
                                                                </div>
                                                            </div>
                                                        )}
                                                    </div>
                                                </>
                                            )}

                                            {/* 🌟 HIGHLIGHT KOTAK TRANSFER JIKA STATUS 'SELESAI' 🌟 */}
                                            {(trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && typeof trx.sellerId === 'object' && (
                                                <div className={`p-5 rounded-[2rem] shadow-xl border transition-all ${isPendingDisbursement ? 'bg-[#FF9500] border-orange-600 ring-4 ring-orange-100 text-white animate-in zoom-in-95' : 'bg-slate-900 text-white border-slate-800'}`}>
                                                    <span className={`text-[9px] font-black uppercase tracking-[0.2em] mb-3 block ${isPendingDisbursement ? 'text-orange-100' : 'text-slate-400'}`}>
                                                        {isPendingDisbursement ? '⚠️ FOKUS: TRANSFER KE PENJUAL SEKARANG' : 'Tujuan Pencairan (Penjual)'}
                                                    </span>
                                                    {trx.sellerId.qrisUrl ? (
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative group/qr">
                                                                <img src={trx.sellerId.qrisUrl} className="w-16 h-16 object-contain rounded-xl bg-white p-1 border-2 border-slate-700" alt="QR"/>
                                                                <button onClick={() => window.open(trx.sellerId.qrisUrl, '_blank')} className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 rounded-xl flex items-center justify-center transition-opacity"><Eye size={16}/></button>
                                                            </div>
                                                            <div><p className="font-black text-sm text-white">SCAN QRIS</p><p className={`text-[10px] uppercase font-bold ${isPendingDisbursement ? 'text-orange-100' : 'text-slate-400'}`}>Pencairan via Gambar</p></div>
                                                        </div>
                                                    ) : trx.sellerId.bankName ? (
                                                        <div className="space-y-1">
                                                            <p className="font-black text-white text-base leading-tight">{trx.sellerId.bankName}</p>
                                                            <p className={`font-mono font-black text-sm tracking-widest ${isPendingDisbursement ? 'text-white' : 'text-blue-400'}`}>{trx.sellerId.bankAccount}</p>
                                                            <div className={`mt-2 pt-2 border-t flex items-center gap-2 ${isPendingDisbursement ? 'border-orange-400' : 'border-white/10'}`}>
                                                                <User size={12} className={isPendingDisbursement ? 'text-orange-200' : 'text-slate-400'}/>
                                                                <p className={`text-[10px] font-black uppercase tracking-widest ${isPendingDisbursement ? 'text-orange-100' : 'text-slate-300'}`}>A.N: {trx.sellerId.bankAccountName || 'BELUM DIISI'}</p>
                                                            </div>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-red-400 font-bold flex items-center gap-2"><AlertCircle size={14}/> Belum diatur penjual.</span>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    <div className="flex flex-col md:items-end gap-3 min-w-[220px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                                        <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${isPendingDisbursement ? 'bg-orange-100 text-orange-600 border-orange-200 animate-pulse' : 'bg-slate-50 text-slate-500 border-slate-200'}`}>
                                            {trx.status}
                                        </span>
                                        <div className="flex flex-col gap-2 w-full mt-4">
                                            {trx.proofOfPayment && (
                                                <button onClick={() => window.open(trx.proofOfPayment, '_blank')} className="py-3.5 bg-slate-100 text-slate-600 font-black text-[10px] uppercase tracking-widest rounded-2xl hover:bg-slate-900 hover:text-white transition-all border border-slate-200 shadow-sm flex items-center justify-center gap-2">
                                                    <ImageIcon size={14}/> Cek Bukti Transfer
                                                </button>
                                            )}
                                            {trx.status === 'Menunggu Verifikasi' && (
                                                <button onClick={() => handleVerifyPayment(trx._id)} className="py-3.5 bg-[#00478F] text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-[#FF9500] shadow-lg shadow-blue-900/10 active:scale-95 transition-all">Verifikasi Uang Masuk</button>
                                            )}
                                            {trx.status === 'Selesai' && (
                                                <button onClick={() => handleDisburseFunds(trx._id)} className="py-3.5 bg-green-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-green-700 shadow-lg shadow-green-900/10 active:scale-95 transition-all">Konfirmasi Transfer Selesai</button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <Pagination totalItems={finalFiltered.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </>
            )}

            {/* ============================================================ */}
            {/* MODAL PILIHAN EXPORT PDF */}
            {/* ============================================================ */}
            {isExportModalOpen && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4 animate-in fade-in duration-200">
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 max-w-md w-full shadow-2xl animate-in zoom-in-95 border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><FileText size={24} className="text-[#00478F]"/> Export Laporan PDF</h2>
                            <button onClick={() => setIsExportModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="space-y-6">
                            {/* PILIH JENIS LAPORAN */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-3">Jenis Laporan</label>
                                <div className="grid grid-cols-2 gap-3">
                                    <button onClick={() => setExportType('system')} className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${exportType === 'system' ? 'border-[#00478F] bg-blue-50 text-[#00478F]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                        Sistem (Admin)
                                    </button>
                                    <button onClick={() => setExportType('user')} className={`py-3 px-4 rounded-xl text-xs font-black uppercase tracking-widest transition-all border-2 ${exportType === 'user' ? 'border-[#FF9500] bg-orange-50 text-[#FF9500]' : 'border-slate-200 bg-white text-slate-500 hover:border-slate-300'}`}>
                                        Spesifik User
                                    </button>
                                </div>
                            </div>

                            {/* JIKA PILIH USER: TAMPILKAN DROPDOWN USER & PERAN */}
                            {exportType === 'user' && (
                                <div className="space-y-4 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Pilih Pengguna</label>
                                        <select 
                                            value={selectedExportUserId} 
                                            onChange={(e) => setSelectedExportUserId(e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#FF9500]"
                                        >
                                            <option value="" disabled>-- Pilih Pengguna --</option>
                                            {uniqueUsers.map(u => (
                                                <option key={u.id} value={u.id}>{u.name} ({u.email})</option>
                                            ))}
                                        </select>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2">Peran Laporan</label>
                                        <select 
                                            value={exportUserRole} 
                                            onChange={(e) => setExportUserRole(e.target.value)}
                                            className="w-full p-3 bg-white border border-slate-200 rounded-xl font-bold text-sm outline-none focus:border-[#FF9500]"
                                        >
                                            <option value="seller">Laporan Penjualan</option>
                                            <option value="buyer">Laporan Pembelian</option>
                                        </select>
                                    </div>
                                </div>
                            )}

                            {/* KETERANGAN PDF */}
                            <div className="bg-blue-50/50 border border-blue-100 p-3 rounded-xl flex gap-3 items-start">
                                <AlertCircle size={16} className="text-blue-500 shrink-0 mt-0.5" />
                                <p className="text-xs text-blue-700 font-medium">
                                    {exportType === 'system' 
                                        ? "Laporan Sistem memisahkan profit bersih Admin (dari transaksi Selesai) dengan Dana Tertahan (Escrow)." 
                                        : "Laporan Pengguna menampilkan rekam jejak sukses/batal secara lengkap untuk pengguna yang dipilih."}
                                </p>
                            </div>

                            <button 
                                onClick={exportType === 'system' ? exportPDFSystem : exportPDFUser}
                                className={`w-full py-4 text-white font-black rounded-xl uppercase tracking-widest text-xs flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg ${exportType === 'system' ? 'bg-[#00478F] hover:bg-slate-900 shadow-blue-900/20' : 'bg-[#FF9500] hover:bg-orange-600 shadow-orange-900/20'}`}
                            >
                                <Download size={16} /> Download {exportType === 'system' ? 'Laporan Sistem' : 'Laporan User'} (PDF)
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}