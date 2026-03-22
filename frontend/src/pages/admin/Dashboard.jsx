/* eslint-disable react-hooks/set-state-in-effect */
/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAdminAuthStore from '../../store/adminAuthStore';
import toast from 'react-hot-toast';
import { 
    Tags, LayoutDashboard, ArrowLeftRight, ShieldCheck, 
    CreditCard, Users, Flag, ShieldBan, Menu, LogOut, X, 
    AlertTriangle, RotateCcw, Filter, Search, ChevronLeft, ChevronRight
} from 'lucide-react';

// IMPORT KOMPONEN TAB YANG SUDAH DIPECAH
import CustomConfirmModal from './components/CustomConfirmModal';
import TabTransactions from './components/TabTransactions';
import TabRefunds from './components/TabRefunds';
import TabUsers from './components/TabUsers';
import TabReports from './components/TabReports';
import TabAccounts from './components/TabAccounts';
import TabCategories from './components/TabCategories';

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

    // ================= STATE KONFIRMASI MODAL =================
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });
    const openConfirm = (title, message, onConfirm, isDanger = false) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, isDanger });
    };
    const closeConfirm = () => setConfirmDialog({ ...confirmDialog, isOpen: false });

    // ================= STATE FILTER KAMPUS & MODAL =================
    const [adminCampusFilter, setAdminCampusFilter] = useState('Semua Kampus');
    const [campuses, setCampuses] = useState([]);
    
    // State khusus untuk Modal Kampus
    const [isCampusModalOpen, setIsCampusModalOpen] = useState(false);
    const [campusSearch, setCampusSearch] = useState('');
    const [campusPage, setCampusPage] = useState(1);
    const campusesPerPage = 10;

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
    const fetchCampuses = async () => {
        try {
            const res = await api.get('/products/campuses');
            setCampuses(res.data.data || []);
        } catch (error) {
            console.error("Gagal memuat daftar kampus", error);
        }
    };

    const fetchCategories = async () => { try { const res = await api.get('/categories'); setCategories(res.data.data || []); } catch (e) { toast.error("Gagal memuat kategori"); } };
    const fetchTransactions = async () => { try { const res = await api.get('/transactions'); setTransactions(res.data.data || []); } catch (e) { toast.error("Gagal memuat transaksi"); } };
    const fetchPaymentMethods = async () => { try { const res = await api.get('/payment-methods'); setPaymentMethods(res.data.data || []); } catch (e) { toast.error("Gagal memuat rekening"); } };
    const fetchReports = async () => { try { const res = await api.get('/reports'); setReports(res.data.data || []); } catch (e) { toast.error("Gagal memuat laporan"); } };
    const fetchUsers = async () => { try { const res = await api.get('/users/admin/all'); setUsers(res.data.data || []); } catch (e) { toast.error("Gagal memuat pengguna"); setUsers([]); } };

    useEffect(() => {
        fetchCampuses(); // Load kampus sekali saat komponen mount
    }, []);

    useEffect(() => {
        setLoading(true);
        if (activeTab === 'kategori') fetchCategories();
        if (activeTab === 'transaksi' || activeTab === 'refund') fetchTransactions();
        if (activeTab === 'rekening') fetchPaymentMethods();
        if (activeTab === 'pengguna') fetchUsers();
        if (activeTab === 'laporan') fetchReports();
        setLoading(false);
    }, [activeTab]);

    // ================= FILTERING LOGIC KAMPUS UTAMA =================
    const filteredTransactions = transactions.filter(t => {
        if (adminCampusFilter === 'Semua Kampus') return true;
        return t.sellerId?.campus === adminCampusFilter || t.buyerId?.campus === adminCampusFilter;
    });

    const filteredUsers = users.filter(u => {
        if (adminCampusFilter === 'Semua Kampus') return true;
        return u.campus === adminCampusFilter;
    });

    const filteredReports = reports.filter(r => {
        if (adminCampusFilter === 'Semua Kampus') return true;
        return r.reportedUserId?.campus === adminCampusFilter || r.reporterId?.campus === adminCampusFilter;
    });

    // ================= PAGINATION LOGIC MODAL KAMPUS =================
    const filteredCampusesModal = campuses.filter(c => c.toLowerCase().includes(campusSearch.toLowerCase()));
    const totalCampusPages = Math.ceil(filteredCampusesModal.length / campusesPerPage);
    const displayedCampuses = filteredCampusesModal.slice((campusPage - 1) * campusesPerPage, campusPage * campusesPerPage);


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
        openConfirm("Verifikasi Uang Masuk", "Apakah Anda yakin dana sudah masuk ke rekening sistem? Aksi ini akan mengubah status transaksi menjadi siap COD/Dikirim.", async () => {
            const toastId = toast.loading('Memverifikasi...');
            try { await api.put(`/transactions/${id}/status`, { status: 'Dana Ditahan (Siap COD)' }); toast.success('Berhasil!', { id: toastId }); fetchTransactions(); } 
            catch (e) { toast.error('Gagal', { id: toastId }); }
        });
    };

    const handleDisburseFunds = (id) => {
        openConfirm("Cairkan Dana ke Penjual", "Pastikan Anda telah mentransfer dana ke rekening penjual sesuai nominal bersih. Konfirmasi ini akan mengakhiri transaksi.", async () => {
            const toastId = toast.loading('Memproses pencairan...');
            try { await api.put(`/transactions/${id}/disburse`); toast.success('Berhasil dicairkan!', { id: toastId }); fetchTransactions(); } 
            catch (e) { 
                try { await api.put(`/transactions/${id}/status`, { status: 'Dana Dicairkan' }); toast.success('Berhasil dicairkan!', { id: toastId }); fetchTransactions(); } 
                catch (err) { toast.error('Gagal', { id: toastId }); } 
            }
        });
    };

    const handleBanUser = async (e) => {
        e.preventDefault();
        const toastId = toast.loading("Memblokir...");
        try { await api.put(`/users/admin/ban/${selectedUser._id}`, { isBanned: true, banReason: banForm.reason, banDurationDays: banForm.duration }); toast.success("Terblokir!", { id: toastId }); setShowBanModal(false); fetchUsers(); } 
        catch (e) { toast.error("Gagal memblokir", { id: toastId }); }
    };

    const handleUnban = (id) => {
        openConfirm("Cabut Blokir Akun", "Pengguna ini akan diberikan kembali akses ke sistem. Anda yakin?", async () => {
            const toastId = toast.loading("Mencabut blokir...");
            try { await api.put(`/users/admin/ban/${id}`, { isBanned: false }); toast.success("Blokir dicabut!", { id: toastId }); fetchUsers(); } 
            catch (e) { toast.error("Gagal", { id: toastId }); }
        });
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
        openConfirm("Hapus Kategori", "Kategori yang dihapus tidak bisa dikembalikan. Lanjutkan?", async () => {
            await api.delete(`/categories/${id}`); fetchCategories(); toast.success('Kategori dihapus!');
        }, true);
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
            // Validasi agar admin tidak lupa upload gambar QRIS
            if (!qrFile) return toast.error("Harap upload gambar QRIS terlebih dahulu!");

            formData.append('bankName', 'QRIS'); 
            formData.append('accountNumber', '-'); 
            formData.append('ownerName', 'Admin'); 
            formData.append('qrImage', qrFile); // File masuk ke Form Data
        }
        
        const tid = toast.loading("Menambahkan...");
        try { 
            // 🌟 PERBAIKAN FATAL: Tambahkan header multipart/form-data di sini
            await api.post('/payment-methods', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            }); 
            
            toast.success("Berhasil!", {id: tid}); 
            setNewBank({bankName:'', accountNumber:'', ownerName:''}); 
            setQrFile(null); 
            setQrPreview(null); 
            fetchPaymentMethods(); 
        } catch (e) { 
            toast.error("Gagal", {id: tid}); 
        }
    };

    const handleDeleteBank = (id) => {
        openConfirm("Hapus Rekening Escrow", "Apakah Anda yakin ingin menghapus rekening ini?", async () => {
            await api.delete(`/payment-methods/${id}`); fetchPaymentMethods(); toast.success('Dihapus!');
        }, true);
    };

    return (
        <div className="flex h-screen bg-slate-50 overflow-hidden relative">
            
            {/* CUSTOM CONFIRMATION MODAL DARI KOMPONEN REUSABLE */}
            <CustomConfirmModal dialog={confirmDialog} closeConfirm={closeConfirm} />

            {/* SIDEBAR */}
            {isSidebarOpen && <div className="fixed inset-0 bg-slate-900/50 z-40 lg:hidden backdrop-blur-sm" onClick={() => setIsSidebarOpen(false)}></div>}
            
            <aside className={`fixed inset-y-0 left-0 z-50 w-72 bg-slate-900 text-white transition-transform duration-300 transform ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 lg:static lg:flex lg:flex-col shadow-2xl`}>
                <div className="flex items-center justify-between p-6 border-b border-slate-800">
                    <div className="flex items-center gap-4">
                        <img 
                            src="/iconweb.png" 
                            alt="Logo" 
                            className="w-10 h-10 object-contain rounded-xl shadow-lg bg-white/10 p-1"
                        />
                        <div className="flex flex-col"><span className="text-[11px] font-black tracking-widest text-slate-400 uppercase">System Otoritas</span><span className="text-sm font-black tracking-tight text-white leading-none mt-1">Campus Thrift Hub</span></div>
                    </div>
                    <button onClick={() => setIsSidebarOpen(false)} className="lg:hidden text-slate-400 hover:text-white p-1 rounded-md bg-slate-800"><X size={20}/></button>
                </div>
                
                <nav className="flex-1 px-4 py-6 space-y-2 overflow-y-auto font-sans no-scrollbar">
                    {[
                        { id: 'transaksi', icon: ArrowLeftRight, label: 'Transaksi' },
                        { id: 'refund', icon: RotateCcw, label: 'Pengajuan Refund' }, 
                        { id: 'pengguna', icon: Users, label: 'Manajemen Pengguna' },
                        { id: 'laporan', icon: Flag, label: 'Laporan' },
                        { id: 'rekening', icon: CreditCard, label: 'Rekening Escrow' },
                        { id: 'kategori', icon: Tags, label: 'Kategori Barang' },
                    ].map((item) => (
                        <button key={item.id} onClick={() => { setActiveTab(item.id); setIsSidebarOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-xl font-bold text-sm transition-all ${activeTab === item.id ? 'bg-[#00478F] text-white shadow-lg' : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'}`}>
                            <item.icon size={18} /> {item.label}
                        </button>
                    ))}
                </nav>

                <div className="p-4 border-t border-slate-800">
                    <button onClick={handleLogout} disabled={isLoggingOut} className="w-full flex items-center justify-center gap-2 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white px-4 py-3.5 rounded-xl font-bold transition-all border border-red-500/20 text-sm disabled:opacity-50">
                        {isLoggingOut ? <><Loader2 size={16} className="animate-spin" /> Memutus Sesi...</> : <><LogOut size={16} /> Keluar</>}
                    </button>
                </div>
            </aside>

            {/* MAIN CONTENT */}
            <div className="flex-1 flex flex-col h-screen overflow-hidden">
                <header className="bg-white border-b border-slate-200 px-6 py-5 flex items-center justify-between shadow-sm z-10 shrink-0">
                    <div className="flex items-center gap-4">
                        <button onClick={() => setIsSidebarOpen(true)} className="lg:hidden p-2 -ml-2 bg-slate-100 rounded-lg text-slate-600 hover:bg-slate-200"><Menu size={24} /></button>
                        <h1 className="text-xl md:text-2xl font-black text-slate-800 capitalize tracking-tight flex items-center gap-2"><LayoutDashboard className="text-[#00478F] hidden md:block" size={24} /> {activeTab}</h1>
                    </div>
                    
                    <div className="flex items-center gap-4">
                        {/* 🌟 FILTER KAMPUS HEADER (SEKARANG MENGGUNAKAN TOMBOL MODAL) 🌟 */}
                        {['transaksi', 'refund', 'pengguna', 'laporan'].includes(activeTab) && (
                            <button 
                                onClick={() => setIsCampusModalOpen(true)}
                                className="flex items-center gap-2 bg-slate-50 border border-slate-200 text-slate-700 text-xs md:text-sm rounded-full px-4 py-2 font-bold hover:border-[#00478F] transition-colors shadow-sm max-w-[150px] md:max-w-[200px]"
                            >
                                <Filter size={16} className="text-[#00478F] shrink-0" />
                                <span className="truncate">{adminCampusFilter}</span>
                            </button>
                        )}

                        <div className="hidden md:flex items-center gap-3 bg-slate-50 border border-slate-200 px-4 py-2 rounded-full">
                            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div><span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Admin Online</span>
                        </div>
                    </div>
                </header>

                <main className="flex-1 overflow-y-auto p-4 md:p-8 relative font-sans">
                    {loading ? (
                        <div className="flex items-center justify-center h-full"><div className="w-10 h-10 border-4 border-[#00478F] border-t-transparent rounded-full animate-spin"></div></div>
                    ) : (
                        <div className="max-w-6xl mx-auto pb-20">
                            {/* RENDER TAB BERDASARKAN STATE DENGAN DATA YANG SUDAH DIFILTER */}
                            {activeTab === 'transaksi' && (
                                <TabTransactions 
                                    transactions={filteredTransactions} statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
                                    currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} 
                                    handleVerifyPayment={handleVerifyPayment} handleDisburseFunds={handleDisburseFunds} 
                                />
                            )}
                            
                            {activeTab === 'refund' && (
                                <TabRefunds 
                                    transactions={filteredTransactions} statusFilter={statusFilter} setStatusFilter={setStatusFilter} 
                                    currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} 
                                    fetchTransactions={fetchTransactions} 
                                />
                            )}
                            
                            {activeTab === 'pengguna' && (
                                <TabUsers 
                                    users={filteredUsers} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} 
                                    handleUnban={handleUnban} setSelectedUser={setSelectedUser} setShowBanModal={setShowBanModal} 
                                />
                            )}
                            
                            {activeTab === 'laporan' && (
                                <TabReports 
                                    reports={filteredReports} currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} 
                                    setSelectedReport={setSelectedReport} setReportStatus={setReportStatus} setAdminNotes={setAdminNotes} 
                                    setShowReportModal={setShowReportModal} 
                                />
                            )}
                            
                            {/* Rekening dan Kategori tidak difilter berdasarkan kampus karena sifatnya global */}
                            {activeTab === 'rekening' && (
                                <TabAccounts 
                                    paymentMethods={paymentMethods} paymentType={paymentType} setPaymentType={setPaymentType} 
                                    newBank={newBank} setNewBank={setNewBank} qrPreview={qrPreview} handleQrChange={handleQrChange} 
                                    handleAddPaymentMethod={handleAddPaymentMethod} handleDeleteBank={handleDeleteBank} 
                                    currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} 
                                />
                            )}
                            
                            {activeTab === 'kategori' && (
                                <TabCategories 
                                    categories={categories} newCategory={newCategory} setNewCategory={setNewCategory} 
                                    handleAddCategory={handleAddCategory} editingId={editingId} setEditingId={setEditingId} 
                                    editName={editName} setEditName={setEditName} saveEdit={saveEdit} handleDeleteCategory={handleDeleteCategory} 
                                    currentPage={currentPage} setCurrentPage={setCurrentPage} itemsPerPage={itemsPerPage} 
                                />
                            )}
                        </div>
                    )}
                </main>
            </div>

            {/* ================= MODAL KAMPUS PAGINATION (FILTER ADMIN) ================= */}
            {isCampusModalOpen && (
                <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-6 w-full max-w-md shadow-2xl animate-in zoom-in-95 border border-slate-100">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900">Filter Kampus</h2>
                            <button onClick={() => setIsCampusModalOpen(false)} className="p-2 bg-slate-100 rounded-full text-slate-500 hover:bg-red-100 hover:text-red-500 transition-colors"><X size={20}/></button>
                        </div>
                        
                        <div className="relative mb-4">
                            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                            <input type="text" placeholder="Cari nama kampus..." value={campusSearch} onChange={(e) => {setCampusSearch(e.target.value); setCampusPage(1);}} className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold outline-none focus:border-[#00478F]" />
                        </div>

                        <div className="space-y-2 mb-6 min-h-[300px]">
                            <button 
                                onClick={() => { setAdminCampusFilter('Semua Kampus'); setIsCampusModalOpen(false); setCurrentPage(1); }}
                                className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors border ${adminCampusFilter === 'Semua Kampus' ? 'bg-[#00478F] text-white border-[#00478F] shadow-md' : 'bg-slate-50 text-slate-700 border-transparent hover:bg-slate-100'}`}
                            >
                                🌍 Semua Kampus
                            </button>
                            {displayedCampuses.map(campus => (
                                <button 
                                    key={campus} 
                                    onClick={() => { setAdminCampusFilter(campus); setIsCampusModalOpen(false); setCurrentPage(1); }}
                                    className={`w-full text-left px-4 py-3 rounded-xl font-bold text-sm transition-colors border ${adminCampusFilter === campus ? 'bg-[#00478F] text-white border-[#00478F] shadow-md' : 'bg-white border-slate-200 text-slate-700 hover:border-[#00478F]'}`}
                                >
                                    {campus}
                                </button>
                            ))}
                            {displayedCampuses.length === 0 && <p className="text-center text-slate-400 font-bold mt-10">Kampus tidak ditemukan.</p>}
                        </div>

                        {/* Pagination Kampus */}
                        {totalCampusPages > 1 && (
                            <div className="flex items-center justify-between border-t border-slate-100 pt-4">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Hal {campusPage} / {totalCampusPages}</span>
                                <div className="flex gap-2">
                                    <button onClick={() => setCampusPage(p => Math.max(1, p - 1))} disabled={campusPage === 1} className="p-2 bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-200"><ChevronLeft size={18}/></button>
                                    <button onClick={() => setCampusPage(p => Math.min(totalCampusPages, p + 1))} disabled={campusPage === totalCampusPages} className="p-2 bg-slate-100 border border-slate-200 rounded-lg disabled:opacity-50 hover:bg-slate-200"><ChevronRight size={18}/></button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            )}

            {/* MODAL BAN USER */}
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

            {/* MODAL PROSES LAPORAN */}
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