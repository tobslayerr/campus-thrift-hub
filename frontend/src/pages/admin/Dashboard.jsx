/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
    Tags, Plus, Trash2, LayoutDashboard, Edit2, X, Check, 
    ArrowLeftRight, CheckCircle, ExternalLink, Clock, DollarSign, 
    AlertCircle, ShieldCheck, Wallet, CreditCard, Building, ImagePlus, QrCode,
    Users, Flag, ShieldBan, ShieldAlert, Image as ImageIcon
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
    const [paymentType, setPaymentType] = useState('bank');
    const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', ownerName: '' });
    const [qrFile, setQrFile] = useState(null);
    const [qrPreview, setQrPreview] = useState(null);

    // ================= STATE PENGGUNA (BARU) =================
    const [users, setUsers] = useState([]);
    const [showBanModal, setShowBanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [banForm, setBanForm] = useState({ reason: '', duration: '0' }); // 0 = permanen

    // ================= STATE LAPORAN (BARU) =================
    const [reports, setReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportStatus, setReportStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

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

    const fetchUsers = async () => {
        try {
            const res = await api.get('/users/admin/all');
            setUsers(res.data.data);
        } catch (error) { toast.error("Gagal memuat data pengguna"); }
    };

    const fetchReports = async () => {
        try {
            const res = await api.get('/reports');
            setReports(res.data.data);
        } catch (error) { toast.error("Gagal memuat data laporan"); }
    };

    useEffect(() => {
        setLoading(true);
        if (activeTab === 'kategori') fetchCategories();
        if (activeTab === 'transaksi') fetchTransactions();
        if (activeTab === 'rekening') fetchPaymentMethods();
        if (activeTab === 'pengguna') fetchUsers();
        if (activeTab === 'laporan') fetchReports();
        setLoading(false);
    }, [activeTab]);

    // ================= HANDLER PENGGUNA & BANNED =================
    const handleBanUser = async (e) => {
        e.preventDefault();
        if (!banForm.reason) return toast.error("Alasan harus diisi!");
        const toastId = toast.loading("Memproses pemblokiran...");
        try {
            await api.put(`/users/admin/ban/${selectedUser._id}`, {
                isBanned: true,
                banReason: banForm.reason,
                banDurationDays: banForm.duration
            });
            toast.success("User berhasil diblokir!", { id: toastId });
            setShowBanModal(false);
            fetchUsers();
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal memblokir user", { id: toastId });
        }
    };

    const handleUnban = async (id) => {
        if (!window.confirm("Yakin ingin mencabut blokir user ini?")) return;
        const toastId = toast.loading("Mencabut blokir...");
        try {
            await api.put(`/users/admin/ban/${id}`, { isBanned: false });
            toast.success("Blokir berhasil dicabut!", { id: toastId });
            fetchUsers();
        } catch (error) {
            toast.error("Gagal mencabut blokir", { id: toastId });
        }
    };

    // ================= HANDLER LAPORAN =================
    const handleUpdateReport = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Menyimpan status...");
        try {
            await api.put(`/reports/${selectedReport._id}`, {
                status: reportStatus,
                adminNotes: adminNotes
            });
            toast.success("Laporan berhasil diupdate!", { id: toastId });
            setShowReportModal(false);
            fetchReports();
        } catch (error) {
            toast.error("Gagal update laporan", { id: toastId });
        }
    };

    // ================= HANDLER REKENING ADMIN =================
    const handleQrChange = (e) => {
        const file = e.target.files[0];
        if (file) { setQrFile(file); setQrPreview(URL.createObjectURL(file)); }
    };

    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (paymentType === 'bank') {
            if (!newBank.bankName || !newBank.accountNumber || !newBank.ownerName) return toast.error("Harap isi semua kolom rekening!");
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
            await api.post('/payment-methods', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("Metode pembayaran berhasil ditambahkan!", { id: toastId });
            setNewBank({ bankName: '', accountNumber: '', ownerName: '' }); setQrFile(null); setQrPreview(null);
            fetchPaymentMethods();
        } catch (error) { toast.error("Gagal menambahkan metode pembayaran", { id: toastId }); }
    };

    const handleDeleteBank = async (id, name) => {
        if (!window.confirm(`Yakin ingin menghapus metode ${name}?`)) return;
        const toastId = toast.loading("Menghapus...");
        try {
            await api.delete(`/payment-methods/${id}`);
            toast.success("Berhasil dihapus!", { id: toastId });
            fetchPaymentMethods();
        } catch (error) { toast.error("Gagal menghapus", { id: toastId }); }
    };

    // ================= HANDLER KATEGORI =================
    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        const toastId = toast.loading('Menambahkan kategori...');
        try {
            await api.post('/categories', { name: newCategory });
            toast.success('Kategori berhasil ditambahkan!', { id: toastId });
            setNewCategory(''); fetchCategories();
        } catch (error) { toast.error('Gagal menambah kategori', { id: toastId }); }
    };
    const handleDeleteCategory = async (id, name) => {
        if (!window.confirm(`Yakin menghapus kategori "${name}"?`)) return;
        const toastId = toast.loading('Menghapus...');
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Kategori dihapus!', { id: toastId }); fetchCategories();
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
            toast.success('Pembayaran diverifikasi! Barang siap COD.', { id: toastId }); fetchTransactions();
        } catch (error) { toast.error('Gagal memverifikasi', { id: toastId }); }
    };
    const handleDisburseFunds = async (id) => {
        if (!window.confirm("Pastikan Anda sudah mentransfer uang ke rekening penjual. Lanjutkan pencairan?")) return;
        const toastId = toast.loading('Mencairkan dana...');
        try {
            await api.put(`/transactions/${id}/disburse`);
            toast.success('Dana Dicairkan!', { id: toastId }); fetchTransactions();
        } catch (error) {
            try {
                await api.put(`/transactions/${id}/status`, { status: 'Dana Dicairkan' });
                toast.success('Dana Dicairkan!', { id: toastId }); fetchTransactions();
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
                <button onClick={() => setActiveTab('pengguna')} className={`pb-4 font-black text-sm md:text-lg flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'pengguna' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Users size={20} /> Pengguna
                </button>
                <button onClick={() => setActiveTab('laporan')} className={`pb-4 font-black text-sm md:text-lg flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'laporan' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Flag size={20} /> Laporan
                </button>
                <button onClick={() => setActiveTab('kategori')} className={`pb-4 font-black text-sm md:text-lg flex items-center gap-2 whitespace-nowrap transition-colors ${activeTab === 'kategori' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400 hover:text-slate-600'}`}>
                    <Tags size={20} /> Kategori
                </button>
            </div>

            {/* ==================== TAB CONTENT: PENGGUNA ==================== */}
            {activeTab === 'pengguna' && (
                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                    <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                        <h3 className="font-black text-slate-800 text-xl flex items-center gap-2"><Users className="text-[#00478F]" /> Daftar Pengguna</h3>
                    </div>
                    <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                            <thead>
                                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-200">
                                    <th className="p-4 pl-8">Pengguna</th>
                                    <th className="p-4">Kampus</th>
                                    <th className="p-4">Status Akun</th>
                                    <th className="p-4 text-center">Aksi</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                                {users.map(u => (
                                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                        <td className="p-4 pl-8 flex items-center gap-3">
                                            <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&background=f1f5f9&color=00478F`} className="w-10 h-10 rounded-full object-cover border border-slate-200" alt="avatar"/>
                                            <div>
                                                <p className="font-black text-sm text-slate-800">{u.name}</p>
                                                <p className="text-xs font-bold text-slate-500">{u.email}</p>
                                            </div>
                                        </td>
                                        <td className="p-4 text-xs font-bold text-slate-600">{u.campus}</td>
                                        <td className="p-4">
                                            {u.isBanned ? (
                                                <div className="inline-flex flex-col items-start">
                                                    <span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><ShieldBan size={12}/> Banned</span>
                                                    {u.banUntil ? <span className="text-[9px] text-red-500 mt-1 font-bold">s/d {new Date(u.banUntil).toLocaleDateString('id-ID')}</span> : <span className="text-[9px] text-red-500 mt-1 font-bold">Permanen</span>}
                                                </div>
                                            ) : (
                                                <span className="bg-green-100 text-green-600 px-2 py-1 rounded-md text-[10px] font-black uppercase tracking-wider flex items-center gap-1"><ShieldCheck size={12}/> Aktif</span>
                                            )}
                                        </td>
                                        <td className="p-4 text-center">
                                            {u.isBanned ? (
                                                <button onClick={() => handleUnban(u._id)} className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-black hover:bg-green-600 transition-colors">Cabut Ban</button>
                                            ) : (
                                                <button onClick={() => { setSelectedUser(u); setShowBanModal(true); }} className="bg-red-50 text-red-600 border border-red-200 px-4 py-2 rounded-xl text-xs font-black hover:bg-red-500 hover:text-white transition-colors">Ban Akun</button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}

            {/* ==================== TAB CONTENT: LAPORAN ==================== */}
            {activeTab === 'laporan' && (
                <div className="grid gap-6">
                    {reports.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-200">
                            <ShieldCheck size={48} className="mx-auto text-green-500 mb-4" />
                            <h3 className="text-xl font-bold text-slate-600">Komunitas Aman, Tidak ada Laporan</h3>
                        </div>
                    ) : (
                        reports.map(report => (
                            <div key={report._id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-4">
                                        <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${report.status === 'Menunggu Review' ? 'bg-red-100 text-red-600' : report.status === 'Sedang Diproses' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>
                                            {report.status}
                                        </span>
                                        <span className="text-xs font-bold text-slate-400">{new Date(report.createdAt).toLocaleString('id-ID')}</span>
                                    </div>
                                    <h4 className="text-lg font-black text-slate-900 mb-2">{report.title}</h4>
                                    <p className="text-sm font-medium text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl border border-slate-100">{report.description}</p>
                                    
                                    <div className="grid grid-cols-2 gap-4 bg-blue-50/50 p-4 rounded-2xl border border-blue-100">
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Pelapor</p>
                                            <p className="text-sm font-bold text-[#00478F]">{report.reporterId?.name}</p>
                                        </div>
                                        <div>
                                            <p className="text-[10px] font-black text-slate-400 uppercase">Yang Dilaporkan (Tersangka)</p>
                                            <p className="text-sm font-black text-red-600">{report.reportedUserId?.name}</p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                                    <div className="bg-slate-100 rounded-xl overflow-hidden aspect-video border border-slate-200 relative group">
                                        <img src={report.evidenceImage} className="w-full h-full object-cover" alt="Bukti"/>
                                        <button onClick={() => window.open(report.evidenceImage, '_blank')} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-black gap-2">
                                            <ExternalLink size={16} /> Lihat Bukti
                                        </button>
                                    </div>
                                    <button onClick={() => { 
                                        setSelectedReport(report); 
                                        setReportStatus(report.status); 
                                        setAdminNotes(report.adminNotes || ''); 
                                        setShowReportModal(true); 
                                    }} className="w-full py-3 bg-[#00478F] text-white rounded-xl font-black text-xs uppercase tracking-widest hover:bg-[#FF9500] transition-colors">
                                        Proses Laporan
                                    </button>
                                </div>
                            </div>
                        ))
                    )}
                </div>
            )}

            {/* TAB REKENING ADMIN, TRANSAKSI, DAN KATEGORI (KODE LAMA) */}
            {/* ... (Kode Rekening Admin, Transaksi, & Kategori persis sama seperti sebelumnya) ... */}
            {activeTab === 'rekening' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Plus size={18} className="text-[#FF9500]" /> Tambah Metode</h3>
                            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                <button type="button" onClick={() => setPaymentType('bank')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${paymentType === 'bank' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400'}`}><Building size={14} /> Bank/E-Wallet</button>
                                <button type="button" onClick={() => setPaymentType('qris')} className={`flex-1 py-2 text-xs font-black rounded-lg transition-all flex items-center justify-center gap-2 ${paymentType === 'qris' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400'}`}><QrCode size={14} /> QRIS</button>
                            </div>
                            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                                {paymentType === 'bank' ? (
                                    <>
                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama Bank</label><input type="text" value={newBank.bankName} onChange={(e) => setNewBank({...newBank, bankName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none" /></div>
                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">No. Rekening</label><input type="text" value={newBank.accountNumber} onChange={(e) => setNewBank({...newBank, accountNumber: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none" /></div>
                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Atas Nama</label><input type="text" value={newBank.ownerName} onChange={(e) => setNewBank({...newBank, ownerName: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none" /></div>
                                    </>
                                ) : (
                                    <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 hover:border-[#00478F] transition-colors">
                                        <p className="text-[10px] font-black text-slate-400 uppercase mb-4 tracking-widest">Upload Foto QRIS</p>
                                        {qrPreview ? (
                                            <div className="relative group w-full flex flex-col items-center"><img src={qrPreview} alt="QRIS" className="w-40 h-40 object-cover rounded-xl shadow-lg border-4 border-white" /><label className="mt-4 px-4 py-2 bg-slate-200 text-slate-700 text-xs font-bold rounded-lg cursor-pointer hover:bg-slate-300 transition-colors">Ganti Gambar<input type="file" accept="image/*" onChange={handleQrChange} className="hidden" /></label></div>
                                        ) : (
                                            <label className="flex flex-col items-center gap-3 cursor-pointer text-slate-400 hover:text-[#00478F] w-full py-8"><ImagePlus size={40} className="mb-2" /><span className="text-[10px] font-black uppercase tracking-wider">Pilih File (JPG/PNG)</span><input type="file" accept="image/*" onChange={handleQrChange} className="hidden" /></label>
                                        )}
                                    </div>
                                )}
                                <button type="submit" className="w-full bg-[#00478F] text-white font-black py-4 rounded-xl hover:bg-[#FF9500] mt-6 uppercase tracking-widest text-xs shadow-lg">Simpan Metode</button>
                            </form>
                        </div>
                    </div>
                    <div className="md:col-span-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Building size={20} className="text-[#00478F]" /> Daftar Rekening Aktif</h3>
                            {paymentMethods.length === 0 ? (
                                <p className="text-slate-400 font-medium text-center py-10 border-2 border-dashed rounded-2xl">Belum ada rekening tujuan pembayaran yang diatur.</p>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {paymentMethods.map((method) => (
                                        <div key={method._id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative group overflow-hidden hover:border-[#00478F] transition-all flex flex-col justify-center">
                                            <div className="absolute top-0 right-0 bg-[#00478F] text-white px-4 py-1.5 rounded-bl-2xl text-[10px] font-black tracking-widest uppercase shadow-sm">{method.bankName.includes('QRIS') ? 'QRIS' : method.bankName}</div>
                                            {method.qrImageUrl ? (
                                                <div className="flex flex-col items-center mt-4"><img src={method.qrImageUrl} className="w-32 h-32 rounded-2xl object-cover bg-white p-2 border-2 border-slate-200 shadow-sm" alt="QRIS Admin" /></div>
                                            ) : (
                                                <div className="mt-4">
                                                    <div className="w-12 h-12 bg-blue-100 rounded-2xl flex items-center justify-center text-[#00478F] mb-3"><Wallet size={20} /></div>
                                                    <p className="text-2xl font-mono font-black text-slate-900 tracking-wider mb-1">{method.accountNumber}</p>
                                                    <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">a.n {method.ownerName}</p>
                                                </div>
                                            )}
                                            <button onClick={() => handleDeleteBank(method._id, method.bankName)} className="absolute bottom-4 right-4 text-slate-400 hover:text-red-500 bg-white p-2.5 rounded-xl shadow-md opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
            {activeTab === 'transaksi' && (
                <div className="space-y-6">
                    <div className="flex flex-wrap gap-2 mb-6">
                        {['Semua', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Selesai', 'Dana Dicairkan'].map(status => (
                            <button key={status} onClick={() => setStatusFilter(status)} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${statusFilter === status ? 'bg-[#00478F] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>{status}</button>
                        ))}
                    </div>
                    {displayedTransactions.length === 0 ? (
                        <div className="bg-white p-12 rounded-[2rem] text-center border-2 border-dashed border-slate-200"><ShieldCheck size={48} className="mx-auto text-slate-300 mb-4" /><h3 className="text-xl font-bold text-slate-600">Tidak ada transaksi ditemukan</h3></div>
                    ) : (
                        <div className="grid gap-6">
                            {displayedTransactions.map((trx) => (
                                <div key={trx._id} className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-100 shadow-sm flex flex-col lg:flex-row lg:items-start justify-between gap-8 hover:border-[#FF9500] transition-colors">
                                    <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-6">
                                        <div>
                                            <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 block">Barang & Harga</span>
                                            <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-1">{trx.productId?.title || 'Barang Dihapus'}</h4>
                                            <span className="font-black text-[#00478F] text-xl">Rp{trx.price.toLocaleString('id-ID')}</span>
                                            <div className="mt-4 space-y-1">
                                                <p className="text-sm"><span className="font-bold text-slate-500">Pembeli:</span> <span className="font-black text-slate-800">{trx.buyerId?.name || 'User Dihapus'}</span></p>
                                                <p className="text-sm"><span className="font-bold text-slate-500">Penjual:</span> <span className="font-black text-slate-800">{trx.sellerId?.name || 'User Dihapus'}</span></p>
                                            </div>
                                        </div>
                                        <div className="flex flex-col h-full">
                                            <div className="bg-blue-50 border-2 border-blue-200 p-4 rounded-2xl relative overflow-hidden mb-4">
                                                <div className="absolute top-0 right-0 p-2 opacity-10"><Wallet size={40} /></div>
                                                <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Pembeli Transfer Ke:</span>
                                                <div className="bg-white px-4 py-3 rounded-xl border border-blue-100 shadow-sm inline-block w-fit">
                                                    {trx.paymentMethod ? (
                                                        trx.paymentMethod.includes('-') ? (
                                                            <div className="flex flex-col"><span className="text-sm font-black text-[#00478F]">{trx.paymentMethod.split('-')[0].trim()}</span><span className="text-xs font-bold text-slate-500 mt-0.5">{trx.paymentMethod.substring(trx.paymentMethod.indexOf('-') + 1).trim()}</span></div>
                                                        ) : (<span className="text-sm font-black text-[#00478F]">{trx.paymentMethod}</span>)
                                                    ) : (<span className="text-slate-400 italic text-xs font-bold">Transaksi Lama</span>)}
                                                </div>
                                            </div>
                                            {(trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && trx.sellerId && (
                                                <div className="p-4 bg-orange-50 border-2 border-orange-200 rounded-2xl relative overflow-hidden mt-auto">
                                                    <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block flex items-center gap-1"><span className="w-2 h-2 rounded-full bg-[#FF9500] animate-pulse"></span> Tujuan Pencairan Penjual</span>
                                                    {trx.sellerId.bankName || trx.sellerId.bankAccount || trx.sellerId.qrisUrl ? (
                                                        <div className="relative z-10">
                                                            {(trx.sellerId.bankName || trx.sellerId.bankAccount) && (
                                                                <><p className="font-black text-slate-800 text-sm mb-0.5">{trx.sellerId.bankName || 'Bank Tidak Disebutkan'}</p><p className="font-mono text-slate-600 font-bold tracking-wider text-base bg-white px-3 py-1.5 rounded-lg border border-slate-200 inline-block mb-2">{trx.sellerId.bankAccount || 'Nomor Rekening Kosong'}</p></>
                                                            )}
                                                            {trx.sellerId.qrisUrl && (
                                                                <button onClick={() => window.open(trx.sellerId.qrisUrl, '_blank')} className="flex items-center justify-center gap-2 w-full px-4 py-2 bg-white text-[#FF9500] border-2 border-[#FF9500] font-bold text-xs rounded-xl hover:bg-[#FF9500] hover:text-white transition-all shadow-sm"><ExternalLink size={14} /> Lihat Foto QRIS</button>
                                                            )}
                                                        </div>
                                                    ) : (<div className="bg-red-50 text-red-500 p-2 rounded-lg border border-red-100 text-xs font-bold flex items-center gap-2"><AlertCircle size={16} /> Penjual belum melengkapi rekening.</div>)}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                    <div className="flex flex-col md:items-end gap-4 min-w-[250px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-8">
                                        <div className="flex items-center gap-2">
                                            <span className={`text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${trx.status === 'Menunggu Verifikasi' ? 'bg-orange-50 text-orange-600 border-orange-200' : trx.status === 'Selesai' ? 'bg-green-50 text-green-600 border-green-200' : 'bg-blue-50 text-blue-600 border-blue-200'}`}>{trx.status}</span>
                                        </div>
                                        <div className="flex flex-col gap-2 w-full md:w-auto mt-2">
                                            {trx.proofOfPayment && (<button onClick={() => window.open(trx.proofOfPayment, '_blank')} className="flex items-center justify-center gap-2 px-4 py-3 bg-blue-50 border border-blue-200 text-[#00478F] font-black text-xs rounded-xl hover:bg-[#00478F] hover:text-white transition-colors w-full"><ExternalLink size={14} /> Cek Bukti Transfer</button>)}
                                            {trx.status === 'Menunggu Verifikasi' && (<button onClick={() => handleVerifyPayment(trx._id)} className="flex items-center justify-center gap-2 px-4 py-4 bg-[#00478F] text-white font-black text-xs rounded-xl hover:bg-[#FF9500] transition-colors w-full uppercase"><CheckCircle size={16} /> Verifikasi Uang Masuk</button>)}
                                            {trx.status === 'Selesai' && (<button onClick={() => handleDisburseFunds(trx._id)} className="flex items-center justify-center gap-2 px-4 py-4 bg-green-500 text-white font-black text-xs rounded-xl hover:bg-green-600 transition-colors w-full uppercase"><DollarSign size={16} /> Cairkan ke Penjual</button>)}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            )}
            {activeTab === 'kategori' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-[#FF9500]" /> Tambah Kategori</h3>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <input type="text" placeholder="Contoh: Sepatu" value={newCategory} onChange={(e) => setNewCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                                <button type="submit" disabled={!newCategory.trim()} className="w-full bg-[#00478F] text-white font-black py-3 rounded-xl hover:bg-[#FF9500]">Simpan</button>
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

            {/* ========================================================= */}
            {/* MODAL: BAN USER */}
            {/* ========================================================= */}
            {showBanModal && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-red-600 flex items-center gap-2"><ShieldBan size={24}/> Blokir Pengguna</h2>
                            <button onClick={() => setShowBanModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 mb-6">
                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Target Blokir:</p>
                            <p className="font-black text-slate-800">{selectedUser.name}</p>
                        </div>
                        <form onSubmit={handleBanUser} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Durasi Hukuman</label>
                                <select value={banForm.duration} onChange={(e) => setBanForm({...banForm, duration: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-red-500 outline-none">
                                    <option value="0">Blokir Permanen (Selamanya)</option>
                                    <option value="3">3 Hari</option>
                                    <option value="7">7 Hari</option>
                                    <option value="30">30 Hari</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Alasan Pemblokiran</label>
                                <textarea required value={banForm.reason} onChange={(e) => setBanForm({...banForm, reason: e.target.value})} placeholder="Contoh: Mengajak transaksi di luar aplikasi (Fraud)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 uppercase tracking-widest text-xs shadow-lg shadow-red-500/30 transition-all">
                                Eksekusi Blokir
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: PROSES LAPORAN */}
            {/* ========================================================= */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Flag size={24} className="text-[#FF9500]"/> Proses Laporan</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>

                        <div className="mb-6">
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">Bukti Lampiran</label>
                            <img src={selectedReport.evidenceImage} className="w-full h-48 object-cover rounded-xl border border-slate-200" alt="Bukti"/>
                        </div>

                        <form onSubmit={handleUpdateReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ubah Status Laporan</label>
                                <select value={reportStatus} onChange={(e) => setReportStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#00478F] outline-none">
                                    <option value="Menunggu Review">🔴 Menunggu Review</option>
                                    <option value="Sedang Diproses">🟡 Sedang Diproses</option>
                                    <option value="Selesai">🟢 Selesai (Ditutup)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Admin (Opsional)</label>
                                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tuliskan tindakan yang diambil Admin (Misal: User telah di-ban)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-[#00478F] outline-none min-h-[100px]"></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#00478F] text-white font-black rounded-xl hover:bg-[#FF9500] uppercase tracking-widest text-xs shadow-lg transition-all mt-4">
                                Simpan Perubahan
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}