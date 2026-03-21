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
    ArrowLeftRight, CheckCircle, ExternalLink, Clock, DollarSign, 
    AlertCircle, ShieldCheck, Wallet, CreditCard, Building, ImagePlus, QrCode,
    Users, Flag, ShieldBan, Menu, LogOut, ChevronLeft, ChevronRight
} from 'lucide-react';

export default function Dashboard() {
    const { admin, logoutAdmin } = useAdminAuthStore();
    const navigate = useNavigate();

    // ================= STATE LAYOUT & PAGINATION =================
    const [isSidebarOpen, setIsSidebarOpen] = useState(false);
    const [activeTab, setActiveTab] = useState('transaksi'); 
    const [loading, setLoading] = useState(true);
    const [currentPage, setCurrentPage] = useState(1);
    const itemsPerPage = 10;

    // Reset pagination ketika ganti tab
    useEffect(() => { setCurrentPage(1); }, [activeTab]);

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
        try { 
            const res = await api.get('/users/admin/all'); 
            setUsers(res.data.data || []); 
        } catch (e) { 
            toast.error("Gagal memuat pengguna"); 
            setUsers([]); 
        } 
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

    // ================= HANDLERS (Singkat) =================
    const handleLogout = () => { logoutAdmin(); navigate('/portal-auth-admin-x7y9z-2026'); };
    
    // Transaksi
    const handleVerifyPayment = async (id) => {
        if (!window.confirm("Verifikasi uang masuk?")) return;
        const toastId = toast.loading('Memverifikasi...');
        try { await api.put(`/transactions/${id}/status`, { status: 'Dana Ditahan (Siap COD)' }); toast.success('Berhasil!', { id: toastId }); fetchTransactions(); } 
        catch (e) { toast.error('Gagal', { id: toastId }); }
    };
    const handleDisburseFunds = async (id) => {
        if (!window.confirm("Cairkan dana ke penjual?")) return;
        const toastId = toast.loading('Mencairkan...');
        try { await api.put(`/transactions/${id}/disburse`); toast.success('Berhasil!', { id: toastId }); fetchTransactions(); } 
        catch (e) { try { await api.put(`/transactions/${id}/status`, { status: 'Dana Dicairkan' }); toast.success('Berhasil!', { id: toastId }); fetchTransactions(); } catch (err) { toast.error('Gagal', { id: toastId }); } }
    };

    // Pengguna
    const handleBanUser = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Memblokir...");
        try { await api.put(`/users/admin/ban/${selectedUser._id}`, { isBanned: true, banReason: banForm.reason, banDurationDays: banForm.duration }); toast.success("Terblokir!", { id: toastId }); setShowBanModal(false); fetchUsers(); } 
        catch (e) { toast.error("Gagal memblokir", { id: toastId }); }
    };
    const handleUnban = async (id) => {
        if (!window.confirm("Cabut blokir?")) return;
        const toastId = toast.loading("Mencabut...");
        try { await api.put(`/users/admin/ban/${id}`, { isBanned: false }); toast.success("Blokir dicabut!", { id: toastId }); fetchUsers(); } 
        catch (e) { toast.error("Gagal", { id: toastId }); }
    };

    // Laporan
    const handleUpdateReport = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Menyimpan...");
        try { await api.put(`/reports/${selectedReport._id}`, { status: reportStatus, adminNotes: adminNotes }); toast.success("Disimpan!", { id: toastId }); setShowReportModal(false); fetchReports(); } 
        catch (e) { toast.error("Gagal", { id: toastId }); }
    };

    // Kategori
    const handleAddCategory = async (e) => {
        e.preventDefault();
        try { await api.post('/categories', { name: newCategory }); setNewCategory(''); fetchCategories(); toast.success('Kategori ditambah!'); } catch (e) {/* empty */ }
    };
    const handleDeleteCategory = async (id) => {
        if (window.confirm("Hapus kategori?")) { await api.delete(`/categories/${id}`); fetchCategories(); toast.success('Kategori dihapus!'); }
    };
    const saveEdit = async (id) => {
        try { await api.put(`/categories/${id}`, { name: editName }); setEditingId(null); fetchCategories(); toast.success('Diubah!'); } catch (e) { /* empty */ }
    };

    // Rekening
    const handleQrChange = (e) => { const f = e.target.files[0]; if(f) { setQrFile(f); setQrPreview(URL.createObjectURL(f)); } };
    const handleAddPaymentMethod = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (paymentType === 'bank') {
            formData.append('bankName', newBank.bankName); formData.append('accountNumber', newBank.accountNumber); formData.append('ownerName', newBank.ownerName);
        } else {
            formData.append('bankName', 'QRIS'); formData.append('accountNumber', '-'); formData.append('ownerName', 'Admin'); formData.append('qrImage', qrFile);
        }
        const tid = toast.loading("Menambahkan...");
        try { await api.post('/payment-methods', formData); toast.success("Berhasil!", {id: tid}); setNewBank({bankName:'', accountNumber:'', ownerName:''}); setQrFile(null); setQrPreview(null); fetchPaymentMethods(); } 
        catch (e) { toast.error("Gagal", {id: tid}); }
    };
    const handleDeleteBank = async (id) => {
        if (window.confirm("Hapus rekening?")) { await api.delete(`/payment-methods/${id}`); fetchPaymentMethods(); toast.success('Dihapus!'); }
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

    // Data Slicing for active tabs
    const displayedTransactions = (statusFilter === 'Semua' ? transactions : transactions.filter(t => t.status === statusFilter)).slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedUsers = users.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedReports = reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);
    const displayedPaymentMethods = paymentMethods.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    // ================= RENDER =================
    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden">
            
            {/* OVERLAY MOBILE */}
            {isSidebarOpen && (
                <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>
            )}

            {/* SIDEBAR NAVIGATION */}
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col shadow-2xl`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-3">
                        <ShieldCheck className="text-[#FF9500]" size={28} />
                        <span className="text-lg font-black tracking-widest text-slate-100">THRIFT<span className="text-[#FF9500]">ADMIN</span></span>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"><X size={20}/></button>
                </div>
                
                <div className="p-4 border-b border-slate-800">
                    <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black mb-1">Otoritas Aktif</p>
                    <p className="text-sm font-bold text-blue-300 truncate">{admin?.email || 'admin@campusthrift.com'}</p>
                </div>

                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto">
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
                    <button onClick={handleLogout} className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3 rounded-xl font-bold transition-colors border border-red-500/20 text-sm">
                        <LogOut size={16} /> Keluar
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT AREA */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                
                {/* HEADER MOBILE & DESKTOP TITLE */}
                <header className="bg-white border-b border-slate-200 px-6 py-4 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Menu size={24} /></button>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 capitalize tracking-tight flex items-center gap-2">
                            <LayoutDashboard className="text-[#00478F] hidden md:block" size={24} /> {activeTab.replace('-', ' ')}
                        </h1>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-[#00478F] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="max-w-6xl mx-auto pb-20">
                            
                            {/* TAB TRANSAKSI */}
                            {activeTab === 'transaksi' && (
                                <div className="space-y-6">
                                    <div className="flex flex-wrap gap-2 mb-6">
                                        {['Semua', 'Menunggu Verifikasi', 'Dana Ditahan (Siap COD)', 'Selesai', 'Dana Dicairkan'].map(status => (
                                            <button key={status} onClick={() => {setStatusFilter(status); setCurrentPage(1);}} className={`px-4 py-2 rounded-full text-xs font-black transition-all ${statusFilter === status ? 'bg-[#00478F] text-white shadow-md' : 'bg-white text-slate-500 border border-slate-200'}`}>{status}</button>
                                        ))}
                                    </div>
                                    
                                    {displayedTransactions.length === 0 ? (
                                        <div className="bg-white p-12 rounded-[2rem] text-center border border-slate-200"><ShieldCheck size={48} className="mx-auto text-slate-300 mb-4" /><h3 className="text-lg font-bold text-slate-500">Tidak ada transaksi ditemukan.</h3></div>
                                    ) : (
                                        <>
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
                                                                <div className="bg-blue-50 border border-blue-200 p-4 rounded-2xl relative overflow-hidden mb-4">
                                                                    <span className="text-[10px] font-black text-blue-500 uppercase tracking-widest mb-2 block">Tujuan Transfer Pembeli:</span>
                                                                    <div className="bg-white px-3 py-2 rounded-xl border border-blue-100 shadow-sm inline-block w-fit text-sm font-black text-[#00478F]">
                                                                        {trx.paymentMethod || 'Metode Lama'}
                                                                    </div>
                                                                </div>
                                                                {(trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && trx.sellerId && (
                                                                    <div className="p-4 bg-orange-50 border border-orange-200 rounded-2xl">
                                                                        <span className="text-[10px] font-black text-orange-500 uppercase tracking-widest mb-2 block">Rekening Pencairan Penjual</span>
                                                                        {trx.sellerId.bankName || trx.sellerId.bankAccount ? (
                                                                            <><p className="font-black text-slate-800 text-sm mb-0.5">{trx.sellerId.bankName}</p><p className="font-mono font-bold text-slate-600 bg-white px-3 py-1.5 rounded-lg border">{trx.sellerId.bankAccount}</p></>
                                                                        ) : (<span className="text-xs text-red-500 font-bold">Belum dilengkapi penjual.</span>)}
                                                                    </div>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <div className="flex flex-col md:items-end gap-3 min-w-[200px] border-t lg:border-t-0 lg:border-l border-slate-100 pt-6 lg:pt-0 lg:pl-6">
                                                            <span className="text-xs font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border bg-slate-50 text-slate-600">{trx.status}</span>
                                                            <div className="flex flex-col gap-2 w-full mt-2">
                                                                {trx.proofOfPayment && (<button onClick={() => window.open(trx.proofOfPayment, '_blank')} className="py-3 bg-blue-50 text-[#00478F] font-black text-xs rounded-xl hover:bg-[#00478F] hover:text-white transition-colors border border-blue-200">Cek Bukti Transfer</button>)}
                                                                {trx.status === 'Menunggu Verifikasi' && (<button onClick={() => handleVerifyPayment(trx._id)} className="py-3 bg-[#00478F] text-white font-black text-xs rounded-xl hover:bg-[#FF9500] uppercase">Verifikasi Uang Masuk</button>)}
                                                                {trx.status === 'Selesai' && (<button onClick={() => handleDisburseFunds(trx._id)} className="py-3 bg-green-500 text-white font-black text-xs rounded-xl hover:bg-green-600 uppercase">Cairkan ke Penjual</button>)}
                                                            </div>
                                                        </div>
                                                    </div>
                                                ))}
                                            </div>
                                            <Pagination totalItems={statusFilter === 'Semua' ? transactions.length : transactions.filter(t => t.status === statusFilter).length} />
                                        </>
                                    )}
                                </div>
                            )}

                            {/* TAB PENGGUNA */}
                            {activeTab === 'pengguna' && (
                                <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                                    <div className="overflow-x-auto">
                                        <table className="w-full text-left border-collapse">
                                            <thead>
                                                <tr className="bg-slate-50 text-[10px] uppercase tracking-widest text-slate-400 border-b border-slate-200">
                                                    <th className="p-4 pl-8">Pengguna</th>
                                                    <th className="p-4">Kampus</th>
                                                    <th className="p-4 text-center">Status</th>
                                                    <th className="p-4 text-center">Aksi</th>
                                                </tr>
                                            </thead>
                                            <tbody className="divide-y divide-slate-100">
                                                {displayedUsers.length === 0 && <tr><td colSpan="4" className="p-8 text-center text-slate-400 font-bold">Tidak ada data pengguna.</td></tr>}
                                                {displayedUsers.map(u => (
                                                    <tr key={u._id} className="hover:bg-slate-50 transition-colors">
                                                        <td className="p-4 pl-8 flex items-center gap-3">
                                                            <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&background=f1f5f9&color=00478F`} className="w-10 h-10 rounded-full object-cover border" alt="avatar"/>
                                                            <div><p className="font-black text-sm text-slate-800">{u.name}</p><p className="text-xs font-bold text-slate-500">{u.email}</p></div>
                                                        </td>
                                                        <td className="p-4 text-xs font-bold text-slate-600">{u.campus}</td>
                                                        <td className="p-4 text-center">
                                                            {u.isBanned ? (<span className="bg-red-100 text-red-600 px-2 py-1 rounded-md text-[10px] font-black uppercase"><ShieldBan size={12} className="inline mr-1"/> Banned</span>) : (<span className="bg-green-100 text-green-600 px-2 py-1 rounded-md text-[10px] font-black uppercase"><ShieldCheck size={12} className="inline mr-1"/> Aktif</span>)}
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
                                    <Pagination totalItems={users.length} />
                                </div>
                            )}

                            {/* TAB LAPORAN */}
                            {activeTab === 'laporan' && (
                                <div className="space-y-6">
                                    {displayedReports.length === 0 ? (
                                        <div className="bg-white p-12 rounded-[2rem] text-center border border-slate-200"><ShieldCheck size={48} className="mx-auto text-green-500 mb-4" /><h3 className="text-lg font-bold text-slate-600">Komunitas Aman, Tidak ada Laporan</h3></div>
                                    ) : (
                                        <>
                                            <div className="grid gap-6">
                                                {displayedReports.map(report => (
                                                    <div key={report._id} className="bg-white p-6 md:p-8 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-6">
                                                        <div className="flex-1">
                                                            <div className="flex items-center gap-3 mb-4">
                                                                <span className={`px-3 py-1 rounded-md text-[10px] font-black uppercase tracking-widest ${report.status === 'Menunggu Review' ? 'bg-red-100 text-red-600' : report.status === 'Sedang Diproses' ? 'bg-orange-100 text-orange-600' : 'bg-green-100 text-green-600'}`}>{report.status}</span>
                                                                <span className="text-xs font-bold text-slate-400">{new Date(report.createdAt).toLocaleString('id-ID')}</span>
                                                            </div>
                                                            <h4 className="text-lg font-black text-slate-900 mb-2">{report.title}</h4>
                                                            <p className="text-sm font-medium text-slate-600 mb-6 bg-slate-50 p-4 rounded-xl">{report.description}</p>
                                                            <div className="grid grid-cols-2 gap-4 bg-slate-50 p-4 rounded-xl border border-slate-100">
                                                                <div><p className="text-[10px] font-black text-slate-400 uppercase">Pelapor</p><p className="text-sm font-bold text-[#00478F]">{report.reporterId?.name}</p></div>
                                                                <div><p className="text-[10px] font-black text-slate-400 uppercase">Terlapor</p><p className="text-sm font-black text-red-600">{report.reportedUserId?.name}</p></div>
                                                            </div>
                                                        </div>
                                                        <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-100 pt-6 md:pt-0 md:pl-6">
                                                            <div className="bg-slate-100 rounded-xl overflow-hidden aspect-video border relative group">
                                                                <img src={report.evidenceImage} className="w-full h-full object-cover" alt="Bukti"/>
                                                                <button onClick={() => window.open(report.evidenceImage, '_blank')} className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-white text-xs font-black gap-2">Lihat Bukti</button>
                                                            </div>
                                                            <button onClick={() => { setSelectedReport(report); setReportStatus(report.status); setAdminNotes(report.adminNotes || ''); setShowReportModal(true); }} className="w-full py-3 bg-[#00478F] text-white rounded-xl font-black text-xs uppercase hover:bg-[#FF9500]">Proses Laporan</button>
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
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4">
                                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Plus size={18} className="text-[#FF9500]" /> Tambah Metode</h3>
                                            <div className="flex gap-2 mb-6 bg-slate-50 p-1.5 rounded-xl border border-slate-200">
                                                <button onClick={() => setPaymentType('bank')} className={`flex-1 py-2 text-xs font-black rounded-lg ${paymentType === 'bank' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400'}`}>Bank</button>
                                                <button onClick={() => setPaymentType('qris')} className={`flex-1 py-2 text-xs font-black rounded-lg ${paymentType === 'qris' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400'}`}>QRIS</button>
                                            </div>
                                            <form onSubmit={handleAddPaymentMethod} className="space-y-4">
                                                {paymentType === 'bank' ? (
                                                    <>
                                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Bank</label><input required type="text" value={newBank.bankName} onChange={e=>setNewBank({...newBank, bankName:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm outline-none" /></div>
                                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">No Rekening</label><input required type="text" value={newBank.accountNumber} onChange={e=>setNewBank({...newBank, accountNumber:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm outline-none" /></div>
                                                        <div><label className="block text-[10px] font-black text-slate-400 uppercase mb-1">Atas Nama</label><input required type="text" value={newBank.ownerName} onChange={e=>setNewBank({...newBank, ownerName:e.target.value})} className="w-full p-3 bg-slate-50 rounded-xl border font-bold text-sm outline-none" /></div>
                                                    </>
                                                ) : (
                                                    <div className="border-2 border-dashed border-slate-300 rounded-2xl p-6 bg-slate-50 flex flex-col items-center">
                                                        {qrPreview ? (
                                                            <div className="text-center"><img src={qrPreview} className="w-32 h-32 object-cover rounded-xl shadow border mb-3"/><label className="px-4 py-2 bg-slate-200 text-xs font-bold rounded-lg cursor-pointer">Ganti<input type="file" accept="image/*" onChange={handleQrChange} className="hidden"/></label></div>
                                                        ) : (
                                                            <label className="flex flex-col items-center cursor-pointer text-slate-400"><ImagePlus size={32} className="mb-2"/><span className="text-[10px] font-black uppercase">Pilih QRIS (Gambar)</span><input type="file" accept="image/*" onChange={handleQrChange} className="hidden"/></label>
                                                        )}
                                                    </div>
                                                )}
                                                <button type="submit" className="w-full bg-[#00478F] text-white font-black py-4 rounded-xl hover:bg-[#FF9500] uppercase text-xs">Simpan Metode</button>
                                            </form>
                                        </div>
                                    </div>
                                    <div className="md:col-span-8">
                                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Building size={20} className="text-[#00478F]" /> Rekening Aktif</h3>
                                            <div className="grid sm:grid-cols-2 gap-6">
                                                {displayedPaymentMethods.map((method) => (
                                                    <div key={method._id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 relative group overflow-hidden">
                                                        <div className="absolute top-0 right-0 bg-[#00478F] text-white px-3 py-1 rounded-bl-xl text-[10px] font-black uppercase">{method.bankName}</div>
                                                        {method.qrImageUrl ? (
                                                            <img src={method.qrImageUrl} className="w-24 h-24 mt-2 rounded-xl object-cover border" alt="QR"/>
                                                        ) : (
                                                            <div className="mt-4"><p className="text-xl font-mono font-black text-slate-900">{method.accountNumber}</p><p className="text-xs font-bold text-slate-500 uppercase">a.n {method.ownerName}</p></div>
                                                        )}
                                                        <button onClick={() => handleDeleteBank(method._id)} className="absolute bottom-4 right-4 text-slate-400 hover:text-red-500 bg-white p-2 rounded-lg shadow-sm opacity-0 group-hover:opacity-100 transition-all"><Trash2 size={16}/></button>
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
                                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                                    <div className="md:col-span-4">
                                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                                            <h3 className="font-black text-slate-800 mb-4 flex items-center gap-2"><Plus size={18} className="text-[#FF9500]" /> Tambah Kategori</h3>
                                            <form onSubmit={handleAddCategory} className="space-y-4">
                                                <input type="text" placeholder="Nama Kategori" value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none" />
                                                <button type="submit" disabled={!newCategory.trim()} className="w-full bg-[#00478F] text-white font-black py-3 rounded-xl hover:bg-[#FF9500]">Simpan</button>
                                            </form>
                                        </div>
                                    </div>
                                    <div className="md:col-span-8">
                                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                                            <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2"><Tags size={20} className="text-[#00478F]" /> Daftar Kategori</h3>
                                            <div className="grid sm:grid-cols-2 gap-4">
                                                {displayedCategories.map((cat) => (
                                                    <div key={cat._id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group border">
                                                        {editingId === cat._id ? (
                                                            <div className="flex gap-2 w-full"><input autoFocus type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="flex-1 px-3 py-1 border border-[#FF9500] rounded-lg font-bold outline-none" /><button onClick={() => saveEdit(cat._id)} className="p-1.5 bg-green-500 text-white rounded-lg"><Check size={16}/></button><button onClick={()=>setEditingId(null)} className="p-1.5 bg-slate-300 rounded-lg"><X size={16}/></button></div>
                                                        ) : (
                                                            <><span className="font-bold text-slate-700">{cat.name}</span><div className="flex items-center gap-2 opacity-0 group-hover:opacity-100"><button onClick={() => {setEditingId(cat._id); setEditName(cat.name);}} className="text-slate-400 hover:text-[#00478F] bg-white p-1.5 rounded-lg"><Edit2 size={14}/></button><button onClick={() => handleDeleteCategory(cat._id)} className="text-slate-400 hover:text-red-500 bg-white p-1.5 rounded-lg"><Trash2 size={14}/></button></div></>
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

            {/* ================= MODALS (BAN & REPORT) ================= */}
            {/* MODAL BAN USER */}
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
                                <select value={banForm.duration} onChange={(e) => setBanForm({...banForm, duration: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none">
                                    <option value="0">Permanen (Selamanya)</option>
                                    <option value="3">3 Hari</option>
                                    <option value="7">7 Hari</option>
                                    <option value="30">30 Hari</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Alasan Pemblokiran</label>
                                <textarea required value={banForm.reason} onChange={(e) => setBanForm({...banForm, reason: e.target.value})} placeholder="Contoh: Terbukti melakukan fraud" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none min-h-[100px]"></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 uppercase tracking-widest text-xs shadow-lg shadow-red-500/30">
                                Eksekusi Blokir
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* MODAL PROSES LAPORAN */}
            {showReportModal && selectedReport && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2rem] p-8 max-w-lg w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Flag size={24} className="text-[#FF9500]"/> Proses Laporan</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        <div className="mb-6">
                            <img src={selectedReport.evidenceImage} className="w-full h-48 object-cover rounded-xl border border-slate-200" alt="Bukti"/>
                        </div>
                        <form onSubmit={handleUpdateReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Ubah Status</label>
                                <select value={reportStatus} onChange={(e) => setReportStatus(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none">
                                    <option value="Menunggu Review">Menunggu Review</option>
                                    <option value="Sedang Diproses">Sedang Diproses</option>
                                    <option value="Selesai">Selesai (Ditutup)</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Catatan Admin</label>
                                <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Tindakan yang diambil (Misal: User telah di-ban)" className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium outline-none min-h-[100px]"></textarea>
                            </div>
                            <button type="submit" className="w-full py-4 bg-[#00478F] text-white font-black rounded-xl hover:bg-[#FF9500] uppercase tracking-widest text-xs shadow-lg mt-4">Simpan Perubahan</button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}