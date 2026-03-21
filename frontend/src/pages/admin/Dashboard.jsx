/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
    Tags, Plus, Trash2, LayoutDashboard, Edit2, X, Check, 
    ArrowLeftRight, CheckCircle, ExternalLink, Clock, DollarSign, 
    AlertCircle, ShieldCheck, Wallet, CreditCard, Building, ImagePlus, QrCode
} from 'lucide-react';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('transaksi'); 
    const [loading, setLoading] = useState(true);

    // ================= STATE KATEGORI =================
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    // ================= STATE TRANSAKSI =================
    const [transactions, setTransactions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Semua');

    // ================= STATE REKENING ADMIN =================
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentType, setPaymentType] = useState('bank'); // 'bank' atau 'qris'
    const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', ownerName: '' });
    const [qrFile, setQrFile] = useState(null);
    const [qrPreview, setQrPreview] = useState(null);

    // ================= FETCH DATA =================
    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) { toast.error("Gagal memuat kategori"); }
    };

    const fetchTransactions = async () => {
        try {
            const res = await api.get('/transactions');
            setTransactions(res.data.data);
        } catch (error) { toast.error("Gagal memuat data transaksi"); }
    };

    const fetchPaymentMethods = async () => {
        try {
            const res = await api.get('/payment-methods');
            setPaymentMethods(res.data.data);
        } catch (error) { toast.error("Gagal memuat data rekening admin"); }
    };

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect
        setLoading(true);
        if (activeTab === 'kategori') fetchCategories();
        if (activeTab === 'transaksi') fetchTransactions();
        if (activeTab === 'rekening') fetchPaymentMethods();
        setLoading(false);
    }, [activeTab]);

    // ================= HANDLER REKENING ADMIN =================
    const handleQrChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setQrFile(file);
            setQrPreview(URL.createObjectURL(file));
        }
    };

    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        
        const formData = new FormData();

        if (paymentType === 'bank') {
            if (!newBank.bankName || !newBank.accountNumber || !newBank.ownerName) {
                return toast.error("Harap isi semua kolom rekening!");
            }
            formData.append('bankName', newBank.bankName);
            formData.append('accountNumber', newBank.accountNumber);
            formData.append('ownerName', newBank.ownerName);
        } else {
            if (!qrFile) return toast.error("Harap upload gambar QRIS!");
            formData.append('bankName', 'QRIS Pembayaran');
            formData.append('accountNumber', 'SCAN GAMBAR BARCODE');
            formData.append('ownerName', 'Admin Campus Thrift Hub');
            formData.append('qrImage', qrFile);
        }

        const toastId = toast.loading("Menambahkan metode pembayaran...");
        try {
            await api.post('/payment-methods', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success("Metode pembayaran berhasil ditambahkan!", { id: toastId });
            
            setNewBank({ bankName: '', accountNumber: '', ownerName: '' });
            setQrFile(null);
            setQrPreview(null);
            fetchPaymentMethods();
        } catch (error) {
            toast.error("Gagal menambahkan metode pembayaran", { id: toastId });
        }
    };

    const handleDeleteBank = async (id, name) => {
        if (!window.confirm(`Yakin ingin menghapus metode ${name}?`)) return;
        const toastId = toast.loading("Menghapus...");
        try {
            await api.delete(`/payment-methods/${id}`);
            toast.success("Berhasil dihapus!", { id: toastId });
            fetchPaymentMethods();
        } catch (error) {
            toast.error("Gagal menghapus", { id: toastId });
        }
    };

    // ================= HANDLER KATEGORI =================
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        const toastId = toast.loading('Menambahkan kategori...');
        try {
            await api.post('/categories', { name: newCategory });
            toast.success('Kategori berhasil ditambahkan!', { id: toastId });
            setNewCategory('');
            fetchCategories();
        } catch (error) { toast.error('Gagal menambah kategori', { id: toastId }); }
    };
    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Yakin menghapus kategori "${name}"?`)) return;
        const toastId = toast.loading('Menghapus...');
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Kategori dihapus!', { id: toastId });
            fetchCategories();
        } catch (error) { toast.error('Gagal menghapus kategori', { id: toastId }); }
    };
    const startEdit = (category) => { setEditingId(category._id); setEditName(category.name); };
    const saveEdit = async (id) => {
        if (!editName.trim()) return toast.error("Nama tidak boleh kosong");
        const toastId = toast.loading('Menyimpan perubahan...');
        try {
            await api.put(`/categories/${id}`, { name: editName });
            toast.success('Kategori diubah!', { id: toastId });
            setEditingId(null); fetchCategories();
        } catch (error) { toast.error('Gagal mengubah', { id: toastId }); }
    };

    // ================= HANDLER TRANSAKSI =================
    const handleVerifyPayment = async (id) => {
        if (!window.confirm("Apakah bukti transfer valid dan uang sudah masuk ke rekening admin?")) return;
        const toastId = toast.loading('Memverifikasi pembayaran...');
        try {
            await api.put(`/transactions/${id}/status`, { status: 'Dana Ditahan (Siap COD)' });
            toast.success('Pembayaran diverifikasi! Barang siap COD.', { id: toastId });
            fetchTransactions();
        } catch (error) { toast.error('Gagal memverifikasi', { id: toastId }); }
    };
    const handleDisburseFunds = async (id) => {
        if (!window.confirm("Pastikan Anda sudah mentransfer uang ke rekening penjual. Lanjutkan pencairan?")) return;
        const toastId = toast.loading('Mencairkan dana...');
        try {
            await api.put(`/transactions/${id}/disburse`);
            toast.success('Dana Dicairkan!', { id: toastId });
            fetchTransactions();
        } catch (error) {
            try {
                await api.put(`/transactions/${id}/status`, { status: 'Dana Dicairkan' });
                toast.success('Dana Dicairkan!', { id: toastId });
                fetchTransactions();
            } catch (err) { toast.error('Gagal mencairkan dana', { id: toastId }); }
        }
    };

    const displayedTransactions = statusFilter === 'Semua' ? transactions : transactions.filter(t => t.status === statusFilter);

    if (loading) return <div className="text-center mt-20 font-black animate-pulse text-[#00478F] text-xl">Memuat Panel Admin...</div>;

    return (
        <div className="max-w-7xl mx-auto p-6 md:p-10 pb-32">
            <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <LayoutDashboard className="text-[#00478F]" size={32} /> Admin Control Panel
            </h1>

            {/* TAB NAVIGASI */}
            <div className="flex gap-6 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('transaksi')} className={`pb-4 font-black text-sm md:text-lg flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'transaksi' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <ArrowLeftRight size={20} /> Manajemen Transaksi
                </button>
                <button onClick={() => setActiveTab('rekening')} className={`pb-4 font-black text-sm md:text-lg flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'rekening' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <CreditCard size={20} /> Rekening Admin
                </button>
                <button onClick={() => setActiveTab('kategori')} className={`pb-4 font-black text-sm md:text-lg flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'kategori' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Tags size={20} /> Manajemen Kategori
                </button>
            </div>

            {/* ==================== TAB CONTENT: REKENING ADMIN ==================== */}
            {activeTab === 'rekening' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    
                    {/* KIRI: FORM TAMBAH REKENING/QRIS */}
                    <div className="md:col-span-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                                <Plus size={18} className="text-[#FF9500]" /> Tambah Metode
                            </h3>

                            {/* TOGGLE JENIS PEMBAYARAN */}
                            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <button type="button" onClick={() => setPaymentType('bank')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${paymentType === 'bank' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400'}`}>
                                    <Building size={14} /> Bank/E-Wallet
                                </button>
                                <button type="button" onClick={() => setPaymentType('qris')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${paymentType === 'qris' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400'}`}>
                                    <QrCode size={14} /> QRIS
                                </button>
                            </div>

                            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                                {paymentType === 'bank' ? (
                                    <>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama Bank / Wallet</label>
                                            <input type="text" placeholder="Contoh: BCA / DANA" value={newBank.bankName} onChange={(e) => setNewBank({...newBank, bankName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">No. Rekening / No. HP</label>
                                            <input type="text" placeholder="8291-1234-56" value={newBank.accountNumber} onChange={(e) => setNewBank({...newBank, accountNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none" />
                                        </div>
                                        <div>
                                            <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Atas Nama</label>
                                            <input type="text" placeholder="Campus Thrift Hub" value={newBank.ownerName} onChange={(e) => setNewBank({...newBank, ownerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 hover:border-[#00478F] transition-colors">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Upload Foto QRIS</p>
                                        {qrPreview ? (
                                            <div className="relative group w-full flex flex-col items-center">
                                                <img src={qrPreview} alt="QRIS" className="w-40 h-40 object-cover rounded-xl shadow-lg border-4 border-white" />
                                                <label className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-300 transition-colors">
                                                    Ganti Gambar
                                                    <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                                                </label>
                                            </div>
                                        ) : (
                                            <label className="flex flex-col items-center gap-3 cursor-pointer text-slate-400 hover:text-[#00478F] w-full py-8">
                                                <ImagePlus size={40} className="mb-2" />
                                                <span className="text-[10px] font-black uppercase tracking-wider">Pilih File (JPG/PNG)</span>
                                                <input type="file" accept="image/*" onChange={handleQrChange} className="hidden" />
                                            </label>
                                        )}
                                    </div>
                                )}

                                <button type="submit" className="w-full bg-[#00478F] text-white font-black py-4 rounded-xl hover:bg-[#FF9500] transition-colors flex items-center justify-center gap-2 mt-6 uppercase tracking-widest text-xs shadow-lg">
                                    Simpan Metode
                                </button>
                            </form>
                        </div>
                    </div>

                    {/* KANAN: DAFTAR REKENING AKTIF */}
                    <div className="md:col-span-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                                <Building size={20} className="text-[#00478F]" /> Daftar Rekening Aktif
                            </h3>
                            {paymentMethods.length === 0 ? (
                                <p className="text-slate-400 font-medium text-center py-10 border-2 border-dashed rounded-2xl">Belum ada rekening tujuan pembayaran yang diatur.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {paymentMethods.map((method) => (
                                        <div key={method._id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative group overflow-hidden hover:border-[#00478F] hover:shadow-xl transition-all flex flex-col justify-center">
                                            
                                            <div className="absolute top-0 right-0 bg-[#00478F] text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black tracking-widest uppercase shadow-sm">
                                                {method.bankName.includes('QRIS') ? 'QRIS' : method.bankName}
                                            </div>

                                            {method.qrImageUrl ? (
                                                <div className="flex flex-col items-center mt-4">
                                                    <img src={method.qrImageUrl} className="w-32 h-32 rounded-2xl object-cover bg-white p-2 border-2 border-slate-200 shadow-sm" alt="QRIS Admin" />
                                                </div>
                                            ) : (
                                                <div className="mt-4">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-[#00478F] mb-3">
                                                        <Wallet size={20} />
                                                    </div>
                                                    <p className="text-2xl font-mono font-black text-slate-900 tracking-wider mb-1">{method.accountNumber}</p>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">a.n {method.ownerName}</p>
                                                </div>
                                            )}
                                            
                                            <button onClick={() => handleDeleteBank(method._id, method.bankName)} className="absolute bottom-4 right-4 text-slate-400 hover:text-red-500 bg-white p-2.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all border border-slate-200" title="Hapus Metode">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}

            {/* ==================== TAB CONTENT: TRANSAKSI ==================== */}
            {activeTab === 'transaksi' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['Semua', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Selesai', 'Dana Dicairkan'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${statusFilter === status ? 'bg-[#00478F] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200 hover:bg-slate-50'}`}>{status}</button>
                        ))}
                    </div>

                    {displayedTransactions.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                            <ShieldCheck size={48} className="mx-auto text-slate-300 mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Tidak ada transaksi ditemukan</h3>
                        </div>
                    ) : (
                        <div className="grid gap-6">
                            {displayedTransactions.map((trx) => (
                                <div key={trx._id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-start justify-between gap-8 hover:border-[#FF9500] transition-colors">
                                    
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        {/* Kolom 1: Barang & User */}
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Barang & Harga</span>
                                            <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-1">{trx.productId?.title || 'Barang Dihapus'}</h4>
                                            <span className="font-black text-[#00478F] text-xl">Rp{trx.price.toLocaleString('id-ID')}</span>
                                            
                                            <div className="mt-4 space-y-1">
                                                <p className="text-sm"><span className="font-bold text-slate-500">Pembeli:</span> <span className="font-black text-slate-800">{trx.buyerId?.name || 'User Dihapus'}</span></p>
                                                <p className="text-sm"><span className="font-bold text-slate-500">Penjual:</span> <span className="font-black text-slate-800">{trx.sellerId?.name || 'User Dihapus'}</span></p>
                                            </div>
                                        </div>
                                        
                                        {/* Kolom 2: Detail Pembayaran & Pencairan */}
                                        <div className="flex flex-col h-full">
                                            
                                            {/* TAMPILAN PEMBAYARAN DIPERBAIKI */}
                                            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl relative overflow-hidden mb-4">
                                                <div className="absolute top-0 right-0 p-2 opacity-10"><Wallet size={40} /></div>
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Pembeli Transfer Ke:</span>
                                                
                                                <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm inline-block w-fit">
                                                    {trx.paymentMethod ? (
                                                        trx.paymentMethod.includes('-') ? (
                                                            <div className="flex flex-col">
                                                                <span className="text-sm font-black text-[#00478F]">{trx.paymentMethod.split('-')[0].trim()}</span>
                                                                <span className="text-xs font-bold text-slate-500 mt-0.5">{trx.paymentMethod.substring(trx.paymentMethod.indexOf('-') + 1).trim()}</span>
                                                            </div>
                                                        ) : (
                                                            <span className="text-sm font-black text-[#00478F]">{trx.paymentMethod}</span>
                                                        )
                                                    ) : (
                                                        <span className="text-slate-400 italic text-xs font-bold">Transaksi Lama</span>
                                                    )}
                                                </div>
                                                <p className="text-[10px] text-slate-400 mt-3 font-bold">{new Date(trx.createdAt).toLocaleString('id-ID')}</p>
                                            </div>

                                            {/* TAMPILAN JELAS: TUJUAN PENCAIRAN KE PENJUAL */}
                                            {(trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && trx.sellerId && (
                                                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl relative overflow-hidden mt-auto">
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block flex items-center gap-1">
                                                        <span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse"></span> Tujuan Pencairan Penjual
                                                    </span>
                                                    
                                                    {trx.sellerId.bankName || trx.sellerId.bankAccount || trx.sellerId.qrisUrl ? (
                                                        <div className="relative z-10">
                                                            {(trx.sellerId.bankName || trx.sellerId.bankAccount) && (
                                                                <>
                                                                    <p className="font-black text-slate-800 text-sm mb-0.5">{trx.sellerId.bankName || 'Bank Tidak Disebutkan'}</p>
                                                                    <p className="font-mono text-slate-600 font-bold tracking-wider text-base bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block mb-2">
                                                                        {trx.sellerId.bankAccount || 'Nomor Rekening Kosong'}
                                                                    </p>
                                                                </>
                                                            )}
                                                            {trx.sellerId.qrisUrl && (
                                                                <button onClick={() => window.open(trx.sellerId.qrisUrl, '_blank')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white text-[#FF9500] border-2 border-[#FF9500] font-bold text-xs rounded-xl hover:bg-[#FF9500] hover:text-white transition-all shadow-sm">
                                                                    <ExternalLink size={14} /> Lihat Foto QRIS Penjual
                                                                </button>
                                                            )}
                                                        </div>
                                                    ) : (
                                                        <div className="bg-red-50 text-red-500 p-2 rounded-lg border border-red-100 text-xs font-bold flex items-center gap-2">
                                                            <AlertCircle size={16} /> Penjual belum melengkapi data rekening.
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    </div>

                                    {/* Status & Aksi Admin */}
                                    <div className="flex flex-col md:items-end gap-4 min-w-[250px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                                        <div className="flex items-center gap-2">
                                            {trx.status === 'Menunggu Verifikasi' && <Clock size={16} className="text-[#FF9500]" />}
                                            {trx.status === 'Selesai' && <CheckCircle size={16} className="text-green-500" />}
                                            {trx.status === 'Dana Dicairkan' && <DollarSign size={16} className="text-[#00478F]" />}
                                            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border
                                                ${trx.status === 'Menunggu Verifikasi' ? 'bg-orange-50 text-orange-600 border-orange-200' : ''}
                                                ${trx.status === 'Dana Ditahan (Siap COD)' ? 'bg-blue-50 text-blue-600 border-blue-200' : ''}
                                                ${trx.status === 'Selesai' ? 'bg-green-50 text-green-600 border-green-200' : ''}
                                                ${trx.status === 'Dana Dicairkan' ? 'bg-slate-100 text-slate-600 border-slate-200' : ''}
                                            `}>
                                                {trx.status}
                                            </span>
                                        </div>

                                        <div className="flex flex-col gap-2 w-full md:w-auto mt-2">
                                            {trx.proofOfPayment && (
                                                <button onClick={() => window.open(trx.proofOfPayment, '_blank')} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 text-[#00478F] font-black text-xs rounded-xl hover:bg-[#00478F] hover:text-white transition-colors w-full shadow-sm">
                                                    <ExternalLink size={14} /> Cek Bukti Transfer Pembeli
                                                </button>
                                            )}

                                            {trx.status === 'Menunggu Verifikasi' && (
                                                <button onClick={() => handleVerifyPayment(trx._id)} className="flex items-center justify-center gap-2 px-4 py-4 bg-[#00478F] text-white font-black text-xs rounded-xl hover:bg-[#FF9500] transition-colors shadow-lg w-full uppercase tracking-widest">
                                                    <CheckCircle size={16} /> Verifikasi Uang Masuk
                                                </button>
                                            )}

                                            {trx.status === 'Selesai' && (
                                                <button onClick={() => handleDisburseFunds(trx._id)} className="flex items-center justify-center gap-2 px-4 py-4 bg-green-500 text-white font-black text-xs rounded-xl hover:bg-green-600 transition-colors shadow-lg w-full uppercase tracking-widest">
                                                    <DollarSign size={16} /> Cairkan ke Penjual
                                                </button>
                                            )}
                                        </div>
                                    </div>

                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}

            {/* TAB KATEGORI (TETAP SAMA SEPERTI SEBELUMNYA) */}
            {activeTab === 'kategori' && ( 
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-[#FF9500]" /> Tambah Kategori</h3>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <input type="text" placeholder="Contoh: Sepatu" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                                <button type="submit" disabled={!newCategory.trim()} className="w-full bg-[#00478F] text-white font-black py-3 rounded-xl hover:bg-[#FF9500]">Simpan Kategori</button>
                            </form>
                        </div>
                    </div>
                    <div className="md:col-span-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Tags size={20} className="text-[#00478F]" /> Daftar Kategori</h3>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {categories.map((cat) => (
                                    <div key={cat._id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group border border-transparent hover:border-[#FF9500]">
                                        {editingId === cat._id ? (
                                            <div className="flex items-center gap-2 w-full">
                                                <input type="text" value={editName} onChange={(e) => setEditName(e.target.value)} className="flex-1 px-3 py-2 border border-[#FF9500] rounded-lg font-bold" autoFocus />
                                                <button onClick={() => saveEdit(cat._id)} className="p-2 bg-green-500 text-white rounded-lg"><Check size={16} /></button>
                                                <button onClick={() => setEditingId(null)} className="p-2 bg-slate-300 rounded-lg"><X size={16} /></button>
                                            </div>
                                        ) : (
                                            <>
                                                <span className="font-bold text-slate-700">{cat.name}</span>
                                                <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100">
                                                    <button onClick={() => startEdit(cat)} className="text-slate-400 hover:text-[#00478F] bg-white p-2 rounded-lg"><Edit2 size={16} /></button>
                                                    <button onClick={() => handleDeleteCategory(cat._id, cat.name)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-lg"><Trash2 size={16} /></button>
                                                </div>
                                            </>
                                        )}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}