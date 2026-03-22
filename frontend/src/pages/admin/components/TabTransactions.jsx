import { useState } from 'react';
import { ShieldCheck, ImageIcon, Package, MapPin, Eye, User, Search } from 'lucide-react';
import Pagination from './Pagination';

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
        // Jika data belum ter-populate (hanya berupa string ID)
        if (typeof userObj === 'string') return { name: 'ID: ' + userObj.substring(0,6) + '...', campus: '?' };
        
        return {
            name: userObj.name || defaultName,
            campus: userObj.campus || '?'
        };
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            
            {/* Header Filter (Status & Pencarian Kampus) */}
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                <div className="flex flex-wrap gap-2">
                    {filterOptions.map(status => (
                        <button key={status} onClick={() => {setStatusFilter(status); setCurrentPage(1);}} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-[#00478F] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>{status}</button>
                    ))}
                </div>
                
                <div className="bg-white p-2 rounded-xl border border-slate-200 flex items-center w-full md:w-64 shadow-sm">
                    <Search size={16} className="text-slate-400 ml-2 mr-2" />
                    <input 
                        type="text" 
                        placeholder="Filter Kampus Penjual..." 
                        value={campusFilterText}
                        onChange={(e) => { setCampusFilterText(e.target.value); setCurrentPage(1); }}
                        className="flex-1 bg-transparent border-none outline-none text-xs font-bold text-slate-700"
                    />
                </div>
            </div>
            
            {displayedTransactions.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-200 shadow-sm"><ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" /><h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Tidak ada data</h3></div>
            ) : (
                <>
                    <div className="grid gap-6">
                        {displayedTransactions.map((trx) => {
                            const isQRISMethod = trx.paymentMethod?.toLowerCase().includes('qris');
                            
                            // Ekstrak info user dengan aman
                            const buyerInfo = getUserInfo(trx.buyerId, 'Pembeli');
                            const sellerInfo = getUserInfo(trx.sellerId, 'Penjual');

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

                                            {/* PERBAIKAN TAMPILAN NAMA DAN KAMPUS */}
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
                                                    <div className="px-3 py-1.5 rounded-lg border shadow-sm inline-flex items-center gap-1 text-[10px] font-black uppercase tracking-widest bg-orange-50 text-orange-600 border-orange-200"><MapPin size={12} /> COD (Ketemuan)</div>
                                                )}
                                            </div>

                                            {(trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && typeof trx.sellerId === 'object' && (
                                                <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl border border-slate-800">
                                                    <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tujuan Pencairan (Penjual)</span>
                                                    {trx.sellerId.qrisUrl ? (
                                                        <div className="flex items-center gap-4">
                                                            <div className="relative group/qr">
                                                                <img src={trx.sellerId.qrisUrl} className="w-16 h-16 object-contain rounded-xl bg-white p-1 border-2 border-slate-700" alt="QR"/>
                                                                <button onClick={() => window.open(trx.sellerId.qrisUrl, '_blank')} className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 rounded-xl flex items-center justify-center transition-opacity"><Eye size={16}/></button>
                                                            </div>
                                                            <div><p className="font-black text-sm text-white">SCAN QRIS</p><p className="text-[10px] text-slate-400 uppercase font-bold">Pencairan via Gambar</p></div>
                                                        </div>
                                                    ) : trx.sellerId.bankName ? (
                                                        <div className="space-y-1">
                                                            <p className="font-black text-white text-base leading-tight">{trx.sellerId.bankName}</p>
                                                            <p className="font-mono font-black text-blue-400 text-sm tracking-widest">{trx.sellerId.bankAccount}</p>
                                                            <div className="mt-2 pt-2 border-t border-white/10 flex items-center gap-2">
                                                                <User size={12} className="text-slate-400"/>
                                                                <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">A.N: {trx.sellerId.bankAccountName || 'BELUM DIISI'}</p>
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
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border bg-slate-50 text-slate-500">{trx.status}</span>
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
                                                <button onClick={() => handleDisburseFunds(trx._id)} className="py-3.5 bg-green-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-green-700 shadow-lg shadow-green-900/10 active:scale-95 transition-all">Cairkan Ke Penjual</button>
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
        </div>
    );
}