import { Plus, Building, CreditCard, Trash2, ImagePlus } from 'lucide-react';
import Pagination from './Pagination';

export default function TabAccounts({ 
    paymentMethods, paymentType, setPaymentType, 
    newBank, setNewBank, qrPreview, handleQrChange, 
    handleAddPaymentMethod, handleDeleteBank, 
    currentPage, setCurrentPage, itemsPerPage 
}) {
    const displayedPaymentMethods = paymentMethods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="md:col-span-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                    <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-lg"><Plus size={24} className="text-[#FF9500]" /> Input Rekening</h3>
                    <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                        <button type="button" onClick={() => setPaymentType('bank')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentType === 'bank' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>BANK</button>
                        <button type="button" onClick={() => setPaymentType('qris')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentType === 'qris' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>QRIS</button>
                    </div>
                    <form onSubmit={handleAddPaymentMethod} className="space-y-6">
                        {paymentType === 'bank' ? (
                            <div className="space-y-4">
                                <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Bank</label><input required type="text" value={newBank.bankName} onChange={e=>setNewBank({...newBank, bankName:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-[#00478F] font-bold text-sm outline-none transition-all" placeholder="Misal: BCA"/></div>
                                <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">No Rekening</label><input required type="text" value={newBank.accountNumber} onChange={e=>setNewBank({...newBank, accountNumber:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-[#00478F] font-bold text-sm outline-none transition-all" placeholder="12345678"/></div>
                                <div><label className="block text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Atas Nama</label><input required type="text" value={newBank.ownerName} onChange={e=>setNewBank({...newBank, ownerName:e.target.value})} className="w-full p-4 bg-slate-50 rounded-2xl border border-transparent focus:bg-white focus:border-[#00478F] font-bold text-sm outline-none transition-all" placeholder="Admin Hub"/></div>
                            </div>
                        ) : (
                            <div className="border-4 border-dashed border-slate-100 rounded-[2.5rem] p-8 bg-slate-50 flex flex-col items-center group hover:border-blue-200 transition-all cursor-pointer relative overflow-hidden">
                                {qrPreview ? (
                                    <div className="text-center">
                                        <img src={qrPreview} className="w-40 h-40 object-contain rounded-2xl shadow-xl bg-white p-2 mb-4 border-2 border-blue-50" alt="Preview"/>
                                        <label className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:bg-blue-600">Ganti QRIS<input type="file" accept="image/*" onChange={handleQrChange} className="hidden"/></label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center cursor-pointer text-slate-400 group-hover:text-blue-500 transition-colors w-full h-full">
                                        <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform"><ImagePlus size={32} /></div>
                                        <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pilih File Gambar</span>
                                        <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        )}
                        <button type="submit" className="w-full bg-slate-900 text-white font-black py-5 rounded-[1.5rem] hover:bg-[#00478F] uppercase tracking-[0.2em] text-[10px] shadow-xl shadow-blue-900/10 active:scale-95 transition-all mt-4">Simpan Otoritas</button>
                    </form>
                </div>
            </div>
            <div className="md:col-span-8">
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
                    <h3 className="font-black text-slate-800 mb-10 flex items-center gap-3 text-lg"><Building size={24} className="text-[#00478F]" /> Rekening Aktif Sistem</h3>
                    <div className="grid sm:grid-cols-2 gap-8">
                        {displayedPaymentMethods.map((method) => (
                            <div key={method._id} className="bg-gradient-to-br from-[#00478F] to-slate-900 p-8 rounded-[2rem] relative group overflow-hidden shadow-2xl shadow-blue-900/20 border border-blue-800">
                                <div className="absolute -top-10 -right-10 w-32 h-32 bg-white/5 rounded-full blur-2xl"></div>
                                <div className="absolute top-6 right-6 bg-white/10 text-white px-3 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest">{method.bankName}</div>
                                {method.qrImageUrl ? (
                                    <div className="mt-2 text-center">
                                        <img src={method.qrImageUrl} className="w-32 h-32 mx-auto rounded-2xl object-cover bg-white p-2 border-4 border-white/20 shadow-inner" alt="QR"/>
                                        <p className="text-[10px] text-blue-200 mt-4 font-black uppercase tracking-widest">SCAN QRIS SISTEM</p>
                                    </div>
                                ) : (
                                    <div className="mt-6">
                                        <p className="text-2xl font-mono font-black text-white tracking-[0.15em] mb-1">{method.accountNumber}</p>
                                        <p className="text-[10px] font-black text-blue-300 uppercase tracking-widest">a.n {method.ownerName}</p>
                                        <div className="mt-8 flex items-center gap-2 opacity-30"><CreditCard size={20} className="text-white"/><span className="text-[8px] font-black text-white uppercase tracking-[0.3em]">Official Escrow</span></div>
                                    </div>
                                )}
                                <button onClick={() => handleDeleteBank(method._id)} className="absolute bottom-6 right-6 text-white/50 hover:text-white bg-white/10 p-3 rounded-2xl backdrop-blur-md opacity-0 group-hover:opacity-100 transition-all hover:bg-red-500"><Trash2 size={18}/></button>
                            </div>
                        ))}
                    </div>
                    <Pagination totalItems={paymentMethods.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
            </div>
        </div>
    );
}