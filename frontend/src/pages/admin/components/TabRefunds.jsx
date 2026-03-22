import { RotateCcw, AlertTriangle, User, AlertCircle } from 'lucide-react';
import Pagination from './Pagination';
import api from '../../../api/axios';
import toast from 'react-hot-toast';

export default function TabRefunds({ transactions, statusFilter, setStatusFilter, currentPage, setCurrentPage, itemsPerPage, fetchTransactions }) {
    const filterOptions = ['Semua', 'Refund Diajukan', 'Refund Diproses', 'Refund Selesai'];
    const refundTransactions = transactions.filter(t => ['Refund Diajukan', 'Refund Diproses', 'Refund Selesai'].includes(t.status));
    const displayedRefunds = (statusFilter === 'Semua' ? refundTransactions : refundTransactions.filter(t => t.status === statusFilter)).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    const handleProcessRefund = async (id) => {
        const tid = toast.loading('Memproses...');
        // eslint-disable-next-line no-unused-vars
        try { await api.put(`/transactions/${id}/refund/process`); toast.success('Berhasil diproses', {id: tid}); fetchTransactions(); } catch(e) { toast.error('Gagal', {id: tid}); }
    };

    const handleCompleteRefund = async (id) => {
        if(!window.confirm("Yakin sudah mentransfer uang kembali ke pembeli?")) return;
        const tid = toast.loading('Mencairkan...');
        // eslint-disable-next-line no-unused-vars
        try { await api.put(`/transactions/${id}/refund/complete`); toast.success('Berhasil dikembalikan!', {id: tid}); fetchTransactions(); } catch(e) { toast.error('Gagal', {id: tid}); }
    };

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            <div className="flex flex-wrap gap-2 mb-6">
                {filterOptions.map(status => (
                    <button key={status} onClick={() => {setStatusFilter(status); setCurrentPage(1);}} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-red-600 text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>{status}</button>
                ))}
            </div>
            
            {displayedRefunds.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-200 shadow-sm"><RotateCcw size={48} className="mx-auto text-slate-200 mb-4" /><h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Tidak ada pengajuan refund</h3></div>
            ) : (
                <div className="grid gap-6">
                    {displayedRefunds.map((trx) => (
                        <div key={trx._id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-red-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-start justify-between gap-8 hover:border-red-400/50 transition-all group">
                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                <div>
                                    <div className="flex items-center justify-between mb-2">
                                        <span className="text-[10px] font-black text-red-500 uppercase tracking-widest flex items-center gap-2"><AlertTriangle size={14}/> Klaim Refund 100%</span>
                                        <span className="bg-red-50 text-red-600 border border-red-100 font-mono text-[10px] font-black px-2 py-0.5 rounded-md tracking-wider">{trx.transactionId || 'CTH-LEGACY'}</span>
                                    </div>
                                    <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-2">{trx.productId?.title || 'Barang Dihapus'}</h4>
                                    <span className="font-black text-red-600 text-2xl block mb-4">Rp{trx.price.toLocaleString('id-ID')}</span>
                                    
                                    <div className="space-y-2 mb-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Informasi Pihak Terlibat</p>
                                        <p className="text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> <span className="font-bold text-slate-500 w-16">Pembeli</span> <span className="font-black text-slate-700">: {trx.buyerId?.name || 'User Tidak Diketahui'}</span></p>
                                        <p className="text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> <span className="font-bold text-slate-500 w-16">Penjual</span> <span className="font-black text-slate-700">: {trx.sellerId?.name || 'User Tidak Diketahui'}</span></p>
                                    </div>
                                    
                                    <div className="mt-4 bg-red-50 p-4 rounded-2xl border border-red-100">
                                        <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1 block">Alasan Refund</p>
                                        <p className="text-sm font-black text-slate-800 mb-1">{trx.cancelTitle}</p>
                                        <p className="text-xs text-slate-600 italic leading-relaxed">"{trx.cancelReason}"</p>
                                    </div>
                                </div>

                                <div className="flex flex-col gap-4">
                                    <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl border border-slate-800 h-full">
                                        <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tujuan Transfer (Pembeli)</span>
                                        {trx.buyerId?.bankName ? (
                                            <div className="space-y-1">
                                                <p className="font-black text-white text-base leading-tight">{trx.buyerId.bankName}</p>
                                                <p className="font-mono font-black text-blue-400 text-lg tracking-widest">{trx.buyerId.bankAccount}</p>
                                                <div className="mt-3 pt-3 border-t border-white/10 flex items-center gap-2">
                                                    <User size={12} className="text-slate-400"/>
                                                    <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">A.N: {trx.buyerId.bankAccountName || 'BELUM DIISI'}</p>
                                                </div>
                                            </div>
                                        ) : (
                                            <span className="text-xs text-red-400 font-bold flex items-center gap-2"><AlertCircle size={14}/> Pembeli belum mengisi data rekening di profilnya.</span>
                                        )}
                                    </div>
                                </div>
                            </div>

                            <div className="flex flex-col md:items-end gap-3 min-w-[220px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                                <span className={`text-[10px] font-black uppercase tracking-[0.2em] px-3 py-1.5 rounded-full border ${trx.status === 'Refund Selesai' ? 'bg-slate-100 text-slate-500' : 'bg-red-50 text-red-600 border-red-200'}`}>{trx.status}</span>
                                <div className="flex flex-col gap-2 w-full mt-4">
                                    {trx.status === 'Refund Diajukan' && (
                                        <button onClick={() => handleProcessRefund(trx._id)} className="py-3.5 bg-orange-500 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all">Proses Refund</button>
                                    )}
                                    {trx.status === 'Refund Diproses' && (
                                        <button onClick={() => handleCompleteRefund(trx._id)} className="py-3.5 bg-red-600 text-white font-black text-[10px] uppercase tracking-[0.2em] rounded-2xl hover:bg-slate-900 transition-all shadow-lg shadow-red-900/20">Tandai Uang Telah Ditransfer</button>
                                    )}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}
            <Pagination totalItems={refundTransactions.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
        </div>
    );
}