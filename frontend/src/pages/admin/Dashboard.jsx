/* eslint-disable react-hooks/static-components */
/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAdminAuthStore from '../../store/adminAuthStore';
import toast from 'react-hot-toast';
import { 
    Tags, Plus, Trash2, LayoutDashboard, Edit2, X, Check, 
    ArrowLeftRight,
    AlertCircle, ShieldCheck, CreditCard, Building, ImagePlus, QrCode,
    Users, Flag, ShieldBan, Menu, LogOut, ChevronLeft, ChevronRight, Eye, User, ImageIcon, HelpCircle, Loader2
} from 'lucide-react';

export default function Dashboard() {
    const { admin, logoutAdmin } = useAdminAuthStore();
    const navigate = useNavigate();

    // ================= STATE LAYOUT & PAGINATION =================
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('transaksi'); 
    const [loading, setLoading] = useState(true);
    const [isLoggingOut, setIsLoggingOut] = useState(false);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset pagination ketika ganti tab
    useEffect(() => { setCurrentPage(1); }, [activeTab]);

    // ================= STATE KONFIRMASI MODAL (PENGGANTI WINDOW.CONFIRM) =================
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });

    const openConfirm = (title, message, onConfirm, isDanger = false) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, isDanger });
    };
    const closeConfirm = () => setConfirmDialog({ ...confirmDialog, isOpen: false });

    // ================= STATE DATA =================
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [editingId, setEditingId] = useState(null);
    const [editName, setEditName] = useState('');

    const [transactions, setTransactions] = useState([]);
    const [statusFilter, setStatusFilter] = useState('Semua');

    const [paymentMethods, setPaymentMethods] = useState([]);
    const [paymentType, setPaymentType] = useState('bank');
    const [newBank, setNewBank] = useState({ bankName: '', accountNumber: '', ownerName: '' });
    const [qrFile, setQrFile] = useState(null);
    const [qrPreview, setQrPreview] = useState(null);

    const [users, setUsers] = useState([]);
    const [showBanModal, setShowBanModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);
    const [banForm, setBanForm] = useState({ reason: '', duration: '0' }); 

    const [reports, setReports] = useState([]);
    const [showReportModal, setShowReportModal] = useState(false);
    const [selectedReport, setSelectedReport] = useState(null);
    const [reportStatus, setReportStatus] = useState('');
    const [adminNotes, setAdminNotes] = useState('');

    // ================= FETCH DATA =================
    const fetchCategories = async () => { try { const res = await api.get('/categories'); setCategories(res.data.data || []); } catch (e) { toast.error("Gagal memuat kategori"); } };
    const fetchTransactions = async () => { try { const res = await api.get('/transactions'); setTransactions(res.data.data || []); } catch (e) { toast.error("Gagal memuat transaksi"); } };
    const fetchPaymentMethods = async () => { try { const res = await api.get('/payment-methods'); setPaymentMethods(res.data.data || []); } catch (e) { toast.error("Gagal memuat rekening"); } };
    const fetchReports = async () => { try { const res = await api.get('/reports'); setReports(res.data.data || []); } catch (e) { toast.error("Gagal memuat laporan"); } };
    const fetchUsers = async () => { 
        try { const res = await api.get('/users/admin/all'); setUsers(res.data.data || []); } 
        catch (e) { toast.error("Gagal memuat pengguna"); setUsers([]); } 
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

    // ================= HANDLERS =================
    const handleLogout = () => { 
        setIsLoggingOut(true);
        toast.loading("Mempersiapkan keluar sistem...", { id: 'logout' });
        setTimeout(() => {
            toast.success("Sesi Otoritas Berakhir", { id: 'logout' });
            logoutAdmin(); 
            navigate('/portal-auth-admin-x7y9z-2026'); 
        }, 1500);
    };
    
    const handleVerifyPayment = (id) => {
        openConfirm(
            "Verifikasi Uang Masuk",
            "Apakah Anda yakin dana sudah masuk ke rekening sistem? Aksi ini akan mengubah status transaksi menjadi siap COD.",
            async () => {
                const toastId = toast.loading('Memverifikasi...');
                try { await api.put(`/transactions/${id}/status`, { status: 'Dana Ditahan (Siap COD)' }); toast.success('Berhasil!', { id: toastId }); fetchTransactions(); } 
                catch (e) { toast.error('Gagal', { id: toastId }); }
            }
        );
    };

    const handleDisburseFunds = (id) => {
        openConfirm(
            "Cairkan Dana ke Penjual",
            "Pastikan Anda telah mentransfer dana ke rekening penjual. Konfirmasi ini akan mengakhiri siklus transaksi secara permanen.",
            async () => {
                const toastId = toast.loading('Memproses pencairan...');
                try { await api.put(`/transactions/${id}/disburse`); toast.success('Berhasil dicairkan!', { id: toastId }); fetchTransactions(); } 
                catch (e) { 
                    try { await api.put(`/transactions/${id}/status`, { status: 'Dana Dicairkan' }); toast.success('Berhasil dicairkan!', { id: toastId }); fetchTransactions(); } 
                    catch (err) { toast.error('Gagal', { id: toastId }); } 
                }
            }
        );
    };

    const handleBanUser = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Memblokir...");
        try { await api.put(`/users/admin/ban/${selectedUser._id}`, { isBanned: true, banReason: banForm.reason, banDurationDays: banForm.duration }); toast.success("Terblokir!", { id: toastId }); setShowBanModal(false); fetchUsers(); } 
        catch (e) { toast.error("Gagal memblokir", { id: toastId }); }
    };

    const handleUnban = (id) => {
        openConfirm(
            "Cabut Blokir Akun",
            "Pengguna ini akan diberikan kembali akses ke sistem Campus Thrift Hub. Anda yakin?",
            async () => {
                const toastId = toast.loading("Mencabut blokir...");
                try { await api.put(`/users/admin/ban/${id}`, { isBanned: false }); toast.success("Blokir dicabut!", { id: toastId }); fetchUsers(); } 
                catch (e) { toast.error("Gagal", { id: toastId }); }
            }
        );
    };

    const handleUpdateReport = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Menyimpan...");
        try { await api.put(`/reports/${selectedReport._id}`, { status: reportStatus, adminNotes: adminNotes }); toast.success("Disimpan!", { id: toastId }); setShowReportModal(false); fetchReports(); } 
        catch (e) { toast.error("Gagal", { id: toastId }); }
    };

    const handleAddCategory = async (e) => {
        e.preventDefault();
        try { await api.post('/categories', { name: newCategory }); setNewCategory(''); fetchCategories(); toast.success('Kategori ditambah!'); } catch (e) { /* empty */ }
    };

    const handleDeleteCategory = (id) => {
        openConfirm(
            "Hapus Kategori",
            "Kategori yang dihapus tidak bisa dikembalikan. Lanjutkan?",
            async () => {
                await api.delete(`/categories/${id}`); fetchCategories(); toast.success('Kategori dihapus!');
            }, true
        );
    };

    const saveEdit = async (id) => {
        try { await api.put(`/categories/${id}`, { name: editName }); setEditingId(null); fetchCategories(); toast.success('Diubah!'); } catch (e) { /* empty */ }
    };

    const handleQrChange = (e) => { const f = e.target.files[0]; if(f) { setQrFile(f); setQrPreview(URL.createObjectURL(f)); } };

    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (paymentType === 'bank') {
            formData.append('bankName', newBank.bankName); 
            formData.append('accountNumber', newBank.accountNumber); 
            formData.append('ownerName', newBank.ownerName);
        } else {
            formData.append('bankName', 'QRIS'); 
            formData.append('accountNumber', '-'); 
            formData.append('ownerName', 'Admin'); 
            formData.append('qrImage', qrFile);
        }
        const tid = toast.loading("Menambahkan...");
        try { 
            await api.post('/payment-methods', formData); 
            toast.success("Berhasil!", {id: tid}); 
            setNewBank({bankName:'', accountNumber:'', ownerName:''}); 
            setQrFile(null); 
            setQrPreview(null); 
            fetchPaymentMethods(); 
        } catch (e) { toast.error("Gagal", {id: tid}); }
    };

    const handleDeleteBank = (id) => {
        openConfirm(
            "Hapus Rekening Escrow",
            "Apakah Anda yakin ingin menghapus rekening ini? Ini akan menghilangkan metode pembayaran ini bagi pembeli baru.",
            async () => {
                await api.delete(`/payment-methods/${id}`); fetchPaymentMethods(); toast.success('Dihapus!');
            }, true
        );
    };

    // ================= PAGINATION HELPER =================
    const Pagination = ({ totalItems }) => {
        const totalPages = Math.ceil(totalItems / itemsPerPage);
        if (totalPages <= 1) return null;
        return (
            <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 mt-4 bg-white rounded-b-2xl">
                <span className="text-xs text-slate-500 font-bold">Halaman {currentPage} dari {totalPages}</span>
                <div className="flex items-center gap-2">
                    <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 border border-slate-200"><ChevronLeft size={16}/></button>
                    <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 border border-slate-200"><ChevronRight size={16}/></button>
                </div>
            </div>
        );
    };

    // Data Slicing
    const displayedTransactions = (statusFilter === 'Semua' ? transactions : transactions.filter(t => t.status === statusFilter)).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedReports = reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedPaymentMethods = paymentMethods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            
            {/* CUSTOM CONFIRMATION MODAL */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${confirmDialog.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#00478F]'}`}>
                            {confirmDialog.isDanger ? <AlertCircle size={32} /> : <HelpCircle size={32} />}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 text-center mb-2">{confirmDialog.title}</h2>
                        <p className="text-sm font-medium text-slate-500 text-center mb-8 leading-relaxed">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={closeConfirm} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                            <button onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} className={`flex-1 py-3 text-white rounded-xl font-black shadow-lg hover:-translate-y-0.5 transition-all ${confirmDialog.isDanger ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-[#00478F] shadow-[#00478F]/20 hover:bg-slate-900'}`}>Ya, Lanjutkan</button>
                        </div>
                    </div>
                </div>
            )}

            {/* SIDEBAR */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col shadow-2xl`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-gradient-to-tr from-[#00478F] to-[#FF9500] rounded-xl flex items-center justify-center shadow-lg">
                            <ShieldCheck className="text-white" size={24} />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">System Otoritas</span>
                            <span className="text-sm font-black tracking-tight text-white leading-none mt-1">Campus Thrift Hub</span>
                        </div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"><X size={20}/></button>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto font-sans">
                    {[
                        { id: 'transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
                        { id: 'pengguna', icon: Users, label: 'Manajemen Pengguna' },
                        { id: 'laporan', icon: Flag, label: 'Laporan & Sengketa' },
                        { id: 'rekening', icon: CreditCard, label: 'Rekening Escrow' },
                        { id: 'kategori', icon: Tags, label: 'Kategori Barang' },
                    ].map((item) => (
                        <button 
                            key={item.id} 
                            onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} 
                            className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-[#00478F] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}
                        >
                            <item.icon size={18} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3.5 rounded-xl font-bold transition-all border border-red-500/20 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
                        {isLoggingOut ? <><Loader2 size={16} className="animate-spin" /> Memutus Sesi...</> : <><LogOut size={16} /> Keluar</>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Menu size={24} /></button>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 capitalize tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="text-[#00478F] hidden md:block" size={24} /> {activeTab}
                        </h1>
                    </div>
                    <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full">
                        <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Online</span>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative font-sans">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-[#00478F] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="max-w-6xl mx-auto pb-20">
                            
                            {/* TAB TRANSAKSI */}
                            {activeTab === 'transaksi' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {['Semua', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Selesai', 'Dana Dicairkan'].map(status => (
                                            <button key={status} onClick={() => {setStatusFilter(status); setCurrentPage(1);}} className={`px-4 py-2 rounded-full text-[10px] font-black uppercase tracking-widest transition-all ${statusFilter === status ? 'bg-[#00478F] text-white shadow-md' : 'bg-white text-slate-400 border border-slate-200 hover:bg-slate-50'}`}>{status}</button>
                                        ))}
                                    </div>
                                    
                                    {displayedTransactions.length === 0 ? (
                                        <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-200 shadow-sm"><ShieldCheck size={48} className="mx-auto text-slate-200 mb-4" /><h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Tidak ada data</h3></div>
                                    ) : (
                                        <>
                                            <div className="grid gap-6">
                                                {displayedTransactions.map((trx) => {
                                                    const isQRISMethod = trx.paymentMethod?.toLowerCase().includes('qris');
                                                    
                                                    return (
                                                        <div key={trx._id} className="bg-white p-6 md:p-8 rounded-[2.5rem] border border-slate-100 shadow-[0_4px_20px_rgb(0,0,0,0.02)] flex flex-col lg:flex-row lg:items-start justify-between gap-8 hover:border-[#00478F]/30 transition-all group">
                                                            <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-8">
                                                                <div>
                                                                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 block">Informasi Barang</span>
                                                                    <h4 className="font-black text-slate-900 text-lg line-clamp-1 mb-1">{trx.productId?.title || 'Barang Dihapus'}</h4>
                                                                    <span className="font-black text-[#00478F] text-xl">Rp{trx.price.toLocaleString('id-ID')}</span>
                                                                    <div className="mt-4 space-y-2">
                                                                        <p className="text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 bg-blue-500 rounded-full"></span> <span className="font-bold text-slate-400">Pembeli:</span> <span className="font-black text-slate-700">{trx.buyerId?.name || 'User'}</span></p>
                                                                        <p className="text-xs flex items-center gap-2"><span className="w-1.5 h-1.5 bg-orange-500 rounded-full"></span> <span className="font-bold text-slate-400">Penjual:</span> <span className="font-black text-slate-700">{trx.sellerId?.name || 'User'}</span></p>
                                                                    </div>
                                                                </div>

                                                                <div className="flex flex-col gap-6">
                                                                    {/* Metode Bayar Pembeli */}
                                                                    <div className="bg-slate-50 border border-slate-100 p-4 rounded-3xl relative overflow-hidden">
                                                                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] mb-2 block">Pembayaran Pembeli</span>
                                                                        <div className={`px-4 py-2 rounded-xl border shadow-sm inline-block text-xs font-black uppercase tracking-widest ${isQRISMethod ? 'bg-orange-500 text-white border-orange-400' : 'bg-[#00478F] text-white border-blue-900'}`}>
                                                                            {isQRISMethod ? 'QRIS' : trx.paymentMethod || 'BANK'}
                                                                        </div>
                                                                    </div>

                                                                    {/* Info Pencairan Dana */}
                                                                    {(trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && trx.sellerId && (
                                                                        <div className="p-5 bg-slate-900 text-white rounded-[2rem] shadow-xl border border-slate-800">
                                                                            <span className="text-[9px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 block">Tujuan Pencairan (Penjual)</span>
                                                                            {trx.sellerId.qrisUrl ? (
                                                                                <div className="flex items-center gap-4">
                                                                                    <div className="relative group/qr">
                                                                                        <img src={trx.sellerId.qrisUrl} className="w-16 h-16 object-contain rounded-xl bg-white p-1 border-2 border-slate-700" alt="QR"/>
                                                                                        <button onClick={() => window.open(trx.sellerId.qrisUrl, '_blank')} className="absolute inset-0 bg-black/40 opacity-0 group-hover/qr:opacity-100 rounded-xl flex items-center justify-center transition-opacity"><Eye size={16}/></button>
                                                                                    </div>
                                                                                    <div>
                                                                                        <p className="font-black text-sm text-white">SCAN QRIS</p>
                                                                                        <p className="text-[10px] text-slate-400 uppercase font-bold">Pencairan via Gambar</p>
                                                                                    </div>
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
                                            <Pagination totalItems={statusFilter === 'Semua' ? transactions.length : transactions.filter(t => t.status === statusFilter).length} />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB PENGGUNA */}
                            {activeTab === 'pengguna' && (
                                <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden animate-in fade-in duration-500">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-[9px] uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 font-black">
                                                    <th className="p-6 pl-10">Identitas Pengguna</th>
                                                    <th className="p-6">Asal Kampus</th>
                                                    <th className="p-6 text-center">Status Akun</th>
                                                    <th className="p-6 text-center">Aksi Otoritas</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-50 font-sans">
                                                {displayedUsers.length === 0 && <tr><td colSpan="4" className="p-12 text-center text-slate-300 font-black uppercase tracking-widest">Kosong</td></tr>}
                                                {displayedUsers.map(u => (
                                                    <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                                        <td className="p-6 pl-10">
                                                            <div className="flex items-center gap-4">
                                                                <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&background=f1f5f9&color=00478F`} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" alt="avatar"/>
                                                                <div>
                                                                    <p className="font-black text-sm text-slate-800 leading-tight">{u.name}</p>
                                                                    <p className="text-[11px] font-bold text-slate-400">{u.email}</p>
                                                                </div>
                                                            </div>
                                                        </td>
                                                        <td className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">{u.campus}</td>
                                                        <td className="p-6 text-center">
                                                            {u.isBanned ? (
                                                                <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Banned</span>
                                                            ) : (
                                                                <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">Aktif</span>
                                                            )}
                                                        </td>
                                                        <td className="p-6 text-center">
                                                            {u.isBanned ? (
                                                                <button onClick={() => handleUnban(u._id)} className="bg-[#00478F] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md">Pulihkan</button>
                                                            ) : (
                                                                <button onClick={() => { setSelectedUser(u); setShowBanModal(true); }} className="bg-red-50 text-red-500 border border-red-100 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Blokir</button>
                                                            )}
                                                        </td>
                                                    </tr>
                                                ))}
                                            </tbody>
                                        </table>
                                    </div>
                                    <Pagination totalItems={users.length} />
                                </div>
                            )}

                            {/* TAB LAPORAN */}
                            {activeTab === 'laporan' && (
                                <div className="space-y-6 animate-in fade-in duration-500">
                                    {displayedReports.length === 0 ? (
                                        <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-sm"><ShieldCheck size={48} className="mx-auto text-green-100 mb-4" /><h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Aman</h3></div>
                                    ) : (
                                        <>
                                            <div className="grid gap-6">
                                                {displayedReports.map(report => (
                                                    <div key={report._id} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10 hover:border-red-400 transition-all group">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-6">
                                                                <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${report.status === 'Menunggu Review' ? 'bg-red-50 text-red-600 border-red-100' : report.status === 'Sedang Diproses' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{report.status}</span>
                                                                <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
                                                            </div>
                                                            <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-red-600 transition-colors">{report.title}</h4>
                                                            <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                                                                <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{report.description}"</p>
                                                            </div>
                                                            <div className="flex flex-wrap gap-4">
                                                                <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><div><p className="text-[8px] font-black text-slate-400 uppercase">Pelapor</p><p className="text-xs font-black text-slate-800">{report.reporterId?.name}</p></div></div>
                                                                <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="w-2 h-2 bg-red-500 rounded-full"></div><div><p className="text-[8px] font-black text-slate-400 uppercase">Terlapor</p><p className="text-xs font-black text-slate-800">{report.reportedUserId?.name}</p></div></div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-50 pt-8 md:pt-0 md:pl-10 justify-center">
                                                            <div className="bg-slate-50 rounded-[2rem] overflow-hidden aspect-video border-4 border-white shadow-xl relative group/img">
                                                                <img src={report.evidenceImage} className="w-full h-full object-cover" alt="Bukti"/>
                                                                <button onClick={() => window.open(report.evidenceImage, '_blank')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-[10px] font-black uppercase tracking-widest gap-2">Zoom Bukti</button>
                                                            </div>
                                                            <button onClick={() => { setSelectedReport(report); setReportStatus(report.status); setAdminNotes(report.adminNotes || ''); setShowReportModal(true); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-lg active:scale-95 mt-4">Proses Kasus</button>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Pagination totalItems={reports.length} />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB REKENING */}
                            {activeTab === 'rekening' && (
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="md:col-span-4">
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                                            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-lg"><Plus size={24} className="text-[#FF9500]" /> Input Rekening</h3>
                                            <div className="flex gap-2 mb-8 bg-slate-50 p-1.5 rounded-2xl border border-slate-100">
                                                <button onClick={() => setPaymentType('bank')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentType === 'bank' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>BANK</button>
                                                <button onClick={() => setPaymentType('qris')} className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${paymentType === 'qris' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}>QRIS</button>
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
                                                                <img src={qrPreview} className="w-40 h-40 object-contain rounded-2xl shadow-xl bg-white p-2 mb-4 border-2 border-blue-50"/>
                                                                <label className="px-5 py-2 bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest rounded-full cursor-pointer hover:bg-blue-600">Ganti QRIS<input type="file" accept="image/*" onChange={handleQrChange} className="hidden"/></label>
                                                            </div>
                                                        ) : (
                                                            <label className="flex flex-col items-center cursor-pointer text-slate-400 group-hover:text-blue-500 transition-colors">
                                                                <div className="w-16 h-16 bg-white rounded-3xl flex items-center justify-center shadow-sm mb-4 group-hover:scale-110 transition-transform"><ImagePlus size={32} /></div>
                                                                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Pilih File Gambar</span>
                                                                <input type="file" accept="image/*" onChange={handleQrChange} className="hidden"/>
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
                                            <Pagination totalItems={paymentMethods.length} />
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* TAB KATEGORI */}
                            {activeTab === 'kategori' && (
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
                                    <div className="md:col-span-4">
                                        <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                                            <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-lg"><Plus size={24} className="text-[#FF9500]" /> Kategori Baru</h3>
                                            <form onSubmit={handleAddCategory} className="space-y-6">
                                                <input type="text" placeholder="Nama Kategori" value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-sm focus:bg-white focus:border-[#00478F] outline-none transition-all shadow-inner" />
                                                <button type="submit" disabled={!newCategory.trim()} className="w-full bg-[#00478F] text-white font-black py-5 rounded-[1.5rem] hover:bg-slate-900 transition-all uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50">Tambahkan</button>
                                            </form>
                                        </div>
                                    </div>
                                    <div className="md:col-span-8">
                                        <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
                                            <h3 className="font-black text-slate-800 mb-10 flex items-center gap-3 text-lg"><Tags size={24} className="text-[#00478F]" /> Koleksi Kategori</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {displayedCategories.map((cat) => (
                                                    <div key={cat._id} className="bg-slate-50 p-5 rounded-[1.5rem] flex items-center justify-between group border border-transparent hover:border-[#FF9500] hover:bg-white transition-all">
                                                        {editingId === cat._id ? (
                                                            <div className="flex gap-2 w-full animate-in zoom-in-95">
                                                                <input autoFocus type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="flex-1 px-4 py-2 border-2 border-[#FF9500] rounded-xl font-bold outline-none text-sm" />
                                                                <button onClick={() => saveEdit(cat._id)} className="p-2 bg-green-500 text-white rounded-xl shadow-md"><Check size={20}/></button>
                                                                <button onClick={()=>setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X size={20}/></button>
                                                            </div>
                                                        ) : (
                                                            <><span className="font-black text-slate-700 tracking-tight">{cat.name}</span><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity"><button onClick={() => {setEditingId(cat._id); setEditName(cat.name);}} className="text-blue-500 bg-white shadow-sm p-2.5 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={16}/></button><button onClick={() => handleDeleteCategory(cat._id)} className="text-red-500 bg-white shadow-sm p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button></div></>
                                                        )}
                                                    </div>
                                                ))}
                                            </div>
                                            <Pagination totalItems={categories.length} />
                                        </div>
                                    </div>
                                </div>
                            )}

                        </div>
                    )}
                </main>
            </div>

            {/* MODAL BAN USER (GAYA BARU) */}
            {showBanModal && selectedUser && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-md w-full shadow-2xl border border-slate-100 animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3 text-red-600"><ShieldBan size={32}/><h2 className="text-2xl font-black tracking-tight">Blokir Akun</h2></div>
                            <button onClick={() => setShowBanModal(false)} className="text-slate-300 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="bg-red-50 p-6 rounded-[2rem] border border-red-100 mb-8">
                            <p className="text-[10px] font-black text-red-400 uppercase tracking-widest mb-1">Konfirmasi Target:</p>
                            <p className="font-black text-slate-800 text-lg">{selectedUser.name}</p>
                            <p className="text-xs font-bold text-slate-400 mt-1">{selectedUser.email}</p>
                        </div>
                        <form onSubmit={handleBanUser} className="space-y-6">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Durasi Penangguhan</label><select value={banForm.duration} onChange={(e) => setBanForm({...banForm, duration: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-2xl font-black text-sm outline-none transition-all"><option value="0">PERMANEN</option><option value="3">3 HARI</option><option value="7">7 HARI</option><option value="30">30 HARI</option></select></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Justifikasi Admin</label><textarea required value={banForm.reason} onChange={(e) => setBanForm({...banForm, reason: e.target.value})} placeholder="Sebutkan alasan detail..." className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-red-500 rounded-2xl font-bold text-sm outline-none transition-all min-h-[120px]"></textarea></div>
                            <button type="submit" className="w-full py-5 bg-red-600 text-white font-black rounded-[1.5rem] hover:bg-slate-900 uppercase tracking-[0.2em] text-xs shadow-xl shadow-red-900/20 active:scale-95 transition-all mt-4">Eksekusi Penalti</button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PROSES LAPORAN (GAYA BARU) */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-[100] flex items-center justify-center p-4 animate-in fade-in duration-300">
                    <div className="bg-white rounded-[3rem] p-10 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95 border border-slate-100">
                        <div className="flex justify-between items-center mb-8">
                            <div className="flex items-center gap-3 text-slate-900"><Flag size={32} className="text-orange-500"/><h2 className="text-2xl font-black tracking-tight">Otoritas Kasus</h2></div>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-300 hover:bg-slate-100 p-2 rounded-full transition-colors"><X size={24}/></button>
                        </div>
                        <div className="mb-8 p-1 bg-slate-50 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-inner">
                            <img src={selectedReport.evidenceImage} className="w-full h-56 object-cover rounded-[2.2rem]" alt="Bukti"/>
                        </div>
                        <form onSubmit={handleUpdateReport} className="space-y-8">
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Status Resolusi</label><select value={reportStatus} onChange={(e) => setReportStatus(e.target.value)} className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-black text-sm outline-none transition-all"><option value="Menunggu Review">MENUNGGU REVIEW</option><option value="Sedang Diproses">SEDANG DIPROSES</option><option value="Selesai">SELESAI (CLOSED)</option></select></div>
                            <div><label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3 ml-1">Catatan Resolusi Admin</label><textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tulis tindakan hukum yang diambil sistem..." className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent focus:border-blue-500 rounded-2xl font-bold text-sm outline-none transition-all min-h-[120px]"></textarea></div>
                            <button type="submit" className="w-full py-5 bg-slate-900 text-white font-black rounded-[1.5rem] hover:bg-[#00478F] uppercase tracking-[0.2em] text-xs shadow-xl active:scale-95 transition-all mt-4">Simpan Putusan</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}