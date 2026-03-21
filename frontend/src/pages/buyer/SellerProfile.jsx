import { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import toast from 'react-hot-toast';
import { 
    MapPin, School, Star, ShieldCheck, 
    Edit2, PackageSearch, PlusCircle, 
    MessageSquare, AlertTriangle, X, ImagePlus, 
    Trash2, CheckCircle, Loader2, Tag, HelpCircle,
    ChevronLeft, ChevronRight, Plus
} from 'lucide-react';

export default function SellerProfile() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [seller, setSeller] = useState(null);
    const [products, setProducts] = useState([]);
    const [reviews, setReviews] = useState([]); 
    const [loading, setLoading] = useState(true);
    
    const [activeCategory, setActiveCategory] = useState('Semua');

    // ==========================================
    // STATE KONFIRMASI MODAL (PENGGANTI WINDOW.CONFIRM)
    // ==========================================
    const [confirmDialog, setConfirmDialog] = useState({ isOpen: false, title: '', message: '', onConfirm: null, isDanger: false });

    const openConfirm = (title, message, onConfirm, isDanger = false) => {
        setConfirmDialog({ isOpen: true, title, message, onConfirm, isDanger });
    };
    const closeConfirm = () => setConfirmDialog({ ...confirmDialog, isOpen: false });

    // ==========================================
    // STATE SISTEM LAPORAN PENGGUNA
    // ==========================================
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ title: '', description: '', evidenceImage: null });
    const [reportPreview, setReportPreview] = useState(null);
    const [submittingReport, setSubmittingReport] = useState(false);

    // ==========================================
    // STATE SELLER TOOLS (EDIT PRODUK & CAROUSEL)
    // ==========================================
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null);
    const [editForm, setEditForm] = useState({ 
        title: '', price: '', description: '', category: '', stock: '', 
        existingImages: [], newPhotos: [] 
    });
    const [activeImageIndex, setActiveImageIndex] = useState(0);
    const [isSaving, setIsSaving] = useState(false);

    const isMyProfile = user?.id === id || user?._id === id;

    useEffect(() => {
        const fetchProfile = async () => {
            try {
                const response = await api.get(`/users/seller/${id}`);
                setSeller(response.data.data.profile);
                
                if (user?.id === id || user?._id === id) {
                    const prodRes = await api.get(`/products/seller/${id}`);
                    setProducts(prodRes.data.data);
                } else {
                    setProducts(response.data.data.products);
                }
                
                setReviews(response.data.data.reviews || []);
            } catch (error) {
                console.error("Gagal memuat profil seller", error);
            } finally {
                setLoading(false);
            }
        };
        fetchProfile();
    }, [id, user]);

    // ==========================================
    // HANDLER LAPORAN
    // ==========================================
    const handleReportImageChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setReportForm({ ...reportForm, evidenceImage: file });
            setReportPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportForm.title || !reportForm.description) return toast.error("Harap isi semua kolom!");
        if (!reportForm.evidenceImage) return toast.error("Harap lampirkan bukti foto (Screenshot)!");

        setSubmittingReport(true);
        const toastId = toast.loading("Mengirim laporan ke Admin...");

        const formData = new FormData();
        formData.append('reportedUserId', id); 
        formData.append('title', reportForm.title);
        formData.append('description', reportForm.description);
        formData.append('evidenceImage', reportForm.evidenceImage);

        try {
            await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("Laporan berhasil dikirim. Admin akan segera menindaklanjuti.", { id: toastId });
            setShowReportModal(false);
            setReportForm({ title: '', description: '', evidenceImage: null });
            setReportPreview(null);
        } catch (error) {
            toast.error(error.response?.data?.message || "Gagal mengirim laporan", { id: toastId });
        } finally {
            setSubmittingReport(false);
        }
    };

    // ==========================================
    // HANDLER SELLER TOOLS (HAPUS & TERJUAL)
    // ==========================================
    const handleDelete = (productId) => {
        openConfirm(
            "Hapus Produk Permanen",
            "Apakah Anda yakin ingin menghapus produk ini dari etalase toko secara permanen? Tindakan ini tidak bisa dibatalkan.",
            async () => {
                const toastId = toast.loading('Menghapus produk...');
                try {
                    await api.delete(`/products/${productId}`);
                    setProducts(products.filter(p => p._id !== productId));
                    toast.success('Produk berhasil dihapus!', { id: toastId });
                // eslint-disable-next-line no-unused-vars
                } catch (error) {
                    toast.error('Gagal menghapus produk.', { id: toastId });
                }
            },
            true 
        );
    };

    const handleMarkAsSold = (productId) => {
        openConfirm(
            "Tandai Barang Laku",
            "Apakah barang ini sudah laku di luar aplikasi? Status akan diubah menjadi Sold Out dan stok dikosongkan.",
            async () => {
                const toastId = toast.loading('Memperbarui status...');
                try {
                    const res = await api.put(`/products/${productId}/sold`);
                    setProducts(products.map(p => p._id === productId ? res.data.data : p));
                    toast.success('Produk ditandai terjual!', { id: toastId });
                // eslint-disable-next-line no-unused-vars
                } catch (error) {
                    toast.error('Gagal memperbarui status.', { id: toastId });
                }
            }
        );
    };

    // ==========================================
    // HANDLER EDIT PRODUK & CAROUSEL GAMBAR
    // ==========================================
    const openEditModal = (product) => {
        setEditingProduct(product);
        
        let existing = [];
        if (product.images && product.images.length > 0) existing = [...product.images];
        else if (product.imageUrl) existing = [product.imageUrl];

        setEditForm({
            title: product.title,
            price: product.price,
            description: product.description,
            category: product.category?.name || product.category || '',
            stock: product.stock === 0 ? 1 : product.stock, // Jika ngedit barang sold out, default kasih 1 stok
            existingImages: existing,
            newPhotos: []
        });
        setActiveImageIndex(0);
        setIsEditModalOpen(true);
    };

    // Menggabungkan preview gambar lama dan gambar baru yang belum disubmit
    const allPreviews = [
        ...editForm.existingImages.map(url => ({ type: 'existing', url })),
        ...editForm.newPhotos.map((file, idx) => ({ type: 'new', url: URL.createObjectURL(file), fileIndex: idx }))
    ];

    const handleAddPhoto = (e) => {
        const files = Array.from(e.target.files);
        const totalAllowed = 5 - allPreviews.length;
        const filesToAdd = files.slice(0, totalAllowed);
        
        if (filesToAdd.length > 0) {
            setEditForm({ ...editForm, newPhotos: [...editForm.newPhotos, ...filesToAdd] });
        }
        if (files.length > totalAllowed) {
            toast.error(`Maksimal 5 foto produk. Sisa slot: ${totalAllowed}`);
        }
    };

    const handleRemoveImage = (index) => {
        if (allPreviews.length <= 1) {
            return toast.error("Produk minimal harus memiliki 1 foto!");
        }

        const target = allPreviews[index];
        if (target.type === 'existing') {
            setEditForm({ 
                ...editForm, 
                existingImages: editForm.existingImages.filter(url => url !== target.url) 
            });
        } else {
            setEditForm({ 
                ...editForm, 
                newPhotos: editForm.newPhotos.filter((_, i) => i !== target.fileIndex) 
            });
        }

        if (activeImageIndex >= allPreviews.length - 1) {
            setActiveImageIndex(Math.max(0, allPreviews.length - 2));
        }
    };

    const submitEditProduct = async (e) => {
        e.preventDefault();
        if (allPreviews.length === 0) return toast.error("Minimal 1 foto produk!");

        setIsSaving(true);
        const toastId = toast.loading('Menyimpan perubahan...');
        
        const formData = new FormData();
        formData.append('title', editForm.title);
        formData.append('price', editForm.price);
        formData.append('description', editForm.description);
        formData.append('category', editForm.category);
        formData.append('stock', editForm.stock);
        
        // Kirim array URL gambar yang dipertahankan
        editForm.existingImages.forEach(img => formData.append('existingImages', img));
        // Kirim file gambar baru
        editForm.newPhotos.forEach(file => formData.append('images', file));

        try {
            const res = await api.put(`/products/${editingProduct._id}`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setProducts(products.map(p => p._id === editingProduct._id ? res.data.data : p));
            toast.success('Produk berhasil diperbarui!', { id: toastId });
            setIsEditModalOpen(false);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal memperbarui produk.', { id: toastId });
        } finally {
            setIsSaving(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div>
        </div>
    );
    
    if (!seller) return <div className="text-center mt-20 font-black text-slate-400">Pengguna tidak ditemukan.</div>;

    const availableCategories = ['Semua', ...new Set(products.map(p => p.category?.name || p.category || 'Uncategorized'))];
    const displayedProducts = activeCategory === 'Semua' 
        ? products 
        : products.filter(p => (p.category?.name || p.category) === activeCategory);

    // ==========================================
    // KOMPONEN PRODUCT CARD
    // ==========================================
    const ProductCard = ({ product }) => {
        const isSoldOut = product.status !== 'Tersedia';
        const statusLabel = (product.status === 'Terjual' || product.status === 'Selesai') ? 'TERJUAL' : product.status;

        return (
            <div className="group bg-white rounded-[2rem] overflow-hidden border border-slate-100 hover:shadow-2xl hover:-translate-y-1 transition-all duration-500 flex flex-col h-full relative">
                
                {/* SELLER TOOLS ACTION MENU */}
                {isMyProfile && (
                    <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5 bg-white/90 backdrop-blur-md p-1.5 rounded-[1rem] shadow-lg border border-white opacity-100 lg:opacity-0 group-hover:opacity-100 transition-opacity">
                        <button onClick={(e) => { e.preventDefault(); openEditModal(product); }} className="p-2 text-[#00478F] hover:bg-blue-50 rounded-xl transition" title="Edit Barang"><Edit2 size={16} /></button>
                        {!isSoldOut && (
                            <button onClick={(e) => { e.preventDefault(); handleMarkAsSold(product._id); }} className="p-2 text-green-600 hover:bg-green-50 rounded-xl transition" title="Tandai Laku Manual"><CheckCircle size={16} /></button>
                        )}
                        <button onClick={(e) => { e.preventDefault(); handleDelete(product._id); }} className="p-2 text-red-500 hover:bg-red-50 rounded-xl transition" title="Hapus Permanen"><Trash2 size={16} /></button>
                    </div>
                )}

                <div className="relative overflow-hidden aspect-[4/5] bg-slate-50 cursor-pointer" onClick={() => !isMyProfile && navigate(`/product/${product._id}`)}>
                    {isSoldOut && (
                        <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-[2px] z-10 flex items-center justify-center">
                            <span className="bg-slate-800 text-white px-6 py-2 rounded-xl font-black tracking-widest shadow-lg rotate-[-10deg] text-xl border-2 border-slate-600 uppercase">
                                {statusLabel}
                            </span>
                        </div>
                    )}
                    <img 
                        src={(product.images && product.images.length > 0) ? product.images[0] : product.imageUrl} 
                        className={`w-full h-full object-cover transition-transform duration-700 group-hover:scale-110 ${isSoldOut ? 'grayscale opacity-70' : ''}`} 
                        alt={product.title} 
                    />
                </div>
                
                <div className="p-6 flex flex-col flex-1 z-20 bg-white" onClick={() => !isMyProfile && navigate(`/product/${product._id}`)}>
                    <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-md w-max mb-3 ${isSoldOut ? 'bg-slate-100 text-slate-400' : 'bg-[#FF9500]/10 text-[#FF9500]'}`}>
                        {product.category?.name || product.category || 'Uncategorized'}
                    </span>
                    <h3 className={`font-black text-base line-clamp-2 mb-4 cursor-pointer ${isSoldOut ? 'text-slate-400' : 'text-slate-800 hover:text-[#00478F]'}`}>
                        {product.title}
                    </h3>
                    <div className="mt-auto flex flex-col pt-5 border-t border-slate-100">
                        <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Harga</span>
                        <span className={`font-black text-lg ${isSoldOut ? 'text-slate-400' : 'text-[#00478F]'}`}>
                            Rp{product.price.toLocaleString('id-ID')}
                        </span>
                    </div>

                    {/* TOMBOL IKLANKAN LAGI (Republish) */}
                    {isMyProfile && isSoldOut && (
                        <button 
                            onClick={(e) => { e.preventDefault(); openEditModal(product); }}
                            className="mt-5 w-full py-3 bg-white text-[#00478F] border-2 border-[#00478F] flex justify-center items-center gap-2 font-black rounded-xl hover:bg-[#00478F] hover:text-white text-xs uppercase transition-colors"
                        >
                            <PlusCircle size={16} /> Iklankan Lagi
                        </button>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32 relative">
            
            {/* ========================================================= */}
            {/* CUSTOM CONFIRMATION MODAL */}
            {/* ========================================================= */}
            {confirmDialog.isOpen && (
                <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                        <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${confirmDialog.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#00478F]'}`}>
                            {confirmDialog.isDanger ? <AlertTriangle size={32} /> : <HelpCircle size={32} />}
                        </div>
                        <h2 className="text-xl font-black text-slate-900 text-center mb-2">{confirmDialog.title}</h2>
                        <p className="text-sm font-medium text-slate-500 text-center mb-8 leading-relaxed">{confirmDialog.message}</p>
                        <div className="flex gap-3">
                            <button onClick={closeConfirm} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                            <button onClick={() => { confirmDialog.onConfirm(); closeConfirm(); }} className={`flex-1 py-3 text-white rounded-xl font-black shadow-lg hover:-translate-y-0.5 transition-all ${confirmDialog.isDanger ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-[#00478F] shadow-[#00478F]/20 hover:bg-slate-900'}`}>
                                Ya, Lanjutkan
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* HEADER PROFIL */}
            <div className="bg-[#00478F] pt-20 pb-32 px-6 relative overflow-hidden">
                <div className="absolute top-0 left-0 w-96 h-96 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
                <div className="absolute bottom-0 right-0 w-80 h-80 bg-[#FF9500]/20 rounded-full blur-[100px] translate-x-1/3 translate-y-1/3"></div>

                <div className="max-w-5xl mx-auto relative z-10 text-center flex flex-col items-center">
                    <img src={seller.profilePicture || `https://ui-avatars.com/api/?name=${seller.name}`} alt={seller.name} className="w-32 h-32 rounded-full object-cover ring-4 ring-white/20 shadow-2xl mb-6 bg-white" />
                    <h1 className="text-4xl font-black text-white mb-2 flex items-center justify-center gap-2">
                        {seller.name} {seller.isVerified && <ShieldCheck className="text-blue-300" size={24}/>}
                    </h1>
                    <div className="flex flex-wrap justify-center gap-4 text-blue-100 font-medium text-sm">
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10"><School size={16} /> {seller.campus}</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10"><MapPin size={16} /> {seller.domisili}</span>
                        <span className="flex items-center gap-1.5 bg-white/10 px-3 py-1 rounded-full border border-white/10 text-[#FF9500] font-black">
                            <Star size={16} fill="#FF9500"/> {seller.rating?.toFixed(1) || '0.0'} / 5.0
                        </span>
                    </div>

                    {/* ACTION BUTTONS */}
                    {isMyProfile ? (
                        <button onClick={() => navigate('/my-profile')} className="mt-8 px-8 py-3 bg-white/10 backdrop-blur-md text-white font-black rounded-full border border-white/20 hover:bg-white hover:text-[#00478F] text-xs uppercase shadow-lg transition-all hover:scale-105 active:scale-95">
                            Pengaturan Akun & Rekening
                        </button>
                    ) : (
                        <div className="mt-8 flex flex-wrap justify-center gap-3">
                            <button onClick={() => navigate(`/chat/${id}`)} className="px-8 py-3 bg-white text-[#00478F] font-black rounded-full shadow-lg transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <MessageSquare size={16} /> Chat Penjual
                            </button>
                            <button onClick={() => setShowReportModal(true)} className="px-6 py-3 bg-red-500/20 backdrop-blur-md border border-red-500/50 text-red-100 font-black rounded-full hover:bg-red-500 hover:text-white transition-all hover:scale-105 active:scale-95 flex items-center gap-2 text-xs uppercase tracking-widest">
                                <AlertTriangle size={16} /> Laporkan Toko
                            </button>
                        </div>
                    )}
                </div>
            </div>

            <main className="max-w-7xl mx-auto px-6 -translate-y-16 relative z-20 space-y-8">
                
                {/* SECTION 1: LAPAK SAYA */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
                        <div className="flex items-center gap-4">
                            <div className="w-14 h-14 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center text-[#FF9500]"><PackageSearch size={28} /></div>
                            <div>
                                <h2 className="text-2xl font-black text-slate-900">Lapak {isMyProfile ? 'Saya' : seller.name.split(' ')[0]}</h2>
                                <p className="text-slate-500 text-sm">Total {products.length} barang di etalase.</p>
                            </div>
                        </div>
                        {isMyProfile && (
                            <Link to="/upload" className="flex items-center justify-center gap-2 bg-[#00478F] text-white px-6 py-3 rounded-xl font-black text-sm hover:bg-[#FF9500] transition-colors shadow-lg">
                                <PlusCircle size={18} /> Tambah Barang
                            </Link>
                        )}
                    </div>

                    {products.length > 0 && (
                        <div className="flex items-center gap-2 overflow-x-auto mb-8 pb-2">
                            {availableCategories.map((cat) => (
                                <button 
                                    key={cat} 
                                    onClick={() => setActiveCategory(cat)} 
                                    className={`px-6 py-2.5 rounded-xl text-xs font-black whitespace-nowrap transition-all ${activeCategory === cat ? 'bg-[#00478F] text-white shadow-lg' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}

                    {products.length === 0 ? (
                        <div className="py-20 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                                <PackageSearch size={32} className="text-slate-300" />
                            </div>
                            <p className="text-slate-500 font-bold text-lg">Belum ada barang yang dijual saat ini.</p>
                            {isMyProfile && <Link to="/upload" className="inline-block mt-4 text-[#FF9500] font-black hover:text-[#00478F] transition-colors underline underline-offset-4">Mulai Jual Barang Pertamamu</Link>}
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
                            {displayedProducts.map((product) => <ProductCard key={product._id} product={product} />)}
                        </div>
                    )}
                </div>

                {/* SECTION 2: KUMPULAN ULASAN */}
                <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                    <div className="flex items-center gap-4 mb-8 pb-6 border-b border-slate-100">
                        <div className="w-14 h-14 bg-green-50 rounded-2xl flex items-center justify-center text-green-500">
                            <MessageSquare size={28} />
                        </div>
                        <div>
                            <h2 className="text-2xl font-black text-slate-900">Ulasan & Rating Toko</h2>
                            <p className="text-slate-500 text-sm flex items-center gap-1 font-bold mt-1">
                                Total <Star size={14} fill="#FF9500" className="text-[#FF9500]"/> {seller.rating?.toFixed(1) || '0.0'} dari {reviews.length} Ulasan
                            </p>
                        </div>
                    </div>

                    {reviews.length === 0 ? (
                        <div className="text-center py-10 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                            <p className="text-slate-400 font-bold">Toko ini belum memiliki ulasan.</p>
                        </div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {reviews.map((rev) => (
                                <div key={rev._id} className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100 flex flex-col">
                                    <div className="flex items-center gap-3 mb-4">
                                        <img src={rev.buyerId?.profilePicture || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover" alt=""/>
                                        <div className="flex-1">
                                            <p className="font-black text-slate-800 text-sm leading-tight">{rev.buyerId?.name || 'Pembeli'}</p>
                                            <div className="flex text-[#FF9500] mt-1">
                                                {[...Array(5)].map((_, i) => (<Star key={i} size={10} fill={i < rev.rating ? "#FF9500" : "none"} strokeWidth={2.5}/>))}
                                            </div>
                                        </div>
                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(rev.createdAt).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    
                                    <Link to={`/product/${rev.productId?._id}`} className="bg-white p-2 rounded-xl border border-slate-100 flex items-center gap-3 mb-3 hover:border-[#00478F] transition-colors group">
                                        <img src={(rev.productId?.images && rev.productId.images.length > 0) ? rev.productId.images[0] : rev.productId?.imageUrl} className="w-10 h-10 rounded-lg object-cover bg-slate-100" alt=""/>
                                        <p className="text-xs font-bold text-slate-600 line-clamp-1 group-hover:text-[#00478F]">
                                            {rev.productId?.title || 'Produk Dihapus'}
                                        </p>
                                    </Link>

                                    <p className="text-slate-600 text-sm font-medium leading-relaxed italic">"{rev.comment}"</p>

                                    {rev.images && rev.images.length > 0 && (
                                        <div className="flex gap-2 mt-4 overflow-x-auto pb-1">
                                            {rev.images.map((img, idx) => (
                                                <img key={idx} src={img} alt="Foto Ulasan" className="w-16 h-16 rounded-xl object-cover shrink-0 border border-slate-200 hover:scale-105 cursor-pointer transition-transform" onClick={() => window.open(img, '_blank')} />
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </main>

            {/* ========================================================= */}
            {/* MODAL: EDIT PRODUK SELLER (WITH CAROUSEL) */}
            {/* ========================================================= */}
            {isEditModalOpen && editingProduct && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white rounded-[2.5rem] p-6 md:p-8 w-full max-w-xl shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-slate-900 flex items-center gap-2"><Edit2 size={24} className="text-[#00478F]"/> Edit Produk</h2>
                            <button onClick={() => setIsEditModalOpen(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full transition"><X size={20}/></button>
                        </div>

                        <form onSubmit={submitEditProduct} className="space-y-6">
                            
                            {/* CAROUSEL GAMBAR MULTIPLE */}
                            <div className="flex flex-col">
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Galeri Produk (Maks 5 Foto)</label>
                                
                                {/* Gambar Utama */}
                                {allPreviews.length > 0 && (
                                    <div className="relative w-full aspect-video rounded-[2rem] overflow-hidden bg-slate-100 group border border-slate-200">
                                        <img src={allPreviews[activeImageIndex]?.url} className="w-full h-full object-cover" alt="Preview"/>
                                        
                                        {/* Navigasi Kiri Kanan */}
                                        {allPreviews.length > 1 && (
                                            <>
                                                <button type="button" onClick={() => setActiveImageIndex(prev => prev === 0 ? allPreviews.length - 1 : prev - 1)} className="absolute left-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white text-slate-700 transition opacity-0 group-hover:opacity-100"><ChevronLeft size={20}/></button>
                                                <button type="button" onClick={() => setActiveImageIndex(prev => prev === allPreviews.length - 1 ? 0 : prev + 1)} className="absolute right-3 top-1/2 -translate-y-1/2 bg-white/80 p-2 rounded-full shadow-lg hover:bg-white text-slate-700 transition opacity-0 group-hover:opacity-100"><ChevronRight size={20}/></button>
                                            </>
                                        )}
                                        
                                        {/* Tombol Hapus Gambar */}
                                        <button type="button" onClick={() => handleRemoveImage(activeImageIndex)} className="absolute top-3 right-3 bg-red-500/90 text-white p-2 rounded-xl opacity-0 group-hover:opacity-100 transition shadow-lg hover:bg-red-600" title="Hapus Foto Ini">
                                            <Trash2 size={16}/>
                                        </button>
                                    </div>
                                )}

                                {/* Daftar Thumbnail */}
                                <div className="flex gap-3 mt-4 overflow-x-auto pb-2 custom-scrollbar">
                                    {allPreviews.map((prev, idx) => (
                                        <div key={idx} onClick={() => setActiveImageIndex(idx)} className={`w-16 h-16 md:w-20 md:h-20 rounded-2xl overflow-hidden cursor-pointer border-2 flex-shrink-0 transition-all ${activeImageIndex === idx ? 'border-[#00478F] scale-105 shadow-md' : 'border-transparent opacity-70 hover:opacity-100'}`}>
                                            <img src={prev.url} className="w-full h-full object-cover" alt="Thumb"/>
                                        </div>
                                    ))}
                                    
                                    {/* Tombol Tambah Gambar */}
                                    {allPreviews.length < 5 && (
                                        <label className="w-16 h-16 md:w-20 md:h-20 rounded-2xl border-2 border-dashed border-slate-300 flex flex-col items-center justify-center text-slate-400 cursor-pointer hover:bg-blue-50 hover:border-[#00478F] hover:text-[#00478F] flex-shrink-0 transition-colors">
                                            <Plus size={20} />
                                            <span className="text-[8px] font-black uppercase mt-1">Tambah</span>
                                            <input type="file" multiple accept="image/*" className="hidden" onChange={handleAddPhoto} />
                                        </label>
                                    )}
                                </div>
                            </div>

                            {/* Form Input Detail */}
                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Nama Barang</label>
                                <input required type="text" value={editForm.title} onChange={e => setEditForm({...editForm, title: e.target.value})} className="w-full p-4 bg-slate-50 border border-transparent focus:border-[#00478F] focus:bg-white rounded-2xl font-bold outline-none transition-all" />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Harga (Rp)</label>
                                    <input required type="number" value={editForm.price} onChange={e => setEditForm({...editForm, price: e.target.value})} className="w-full p-4 bg-slate-50 border border-transparent focus:border-[#00478F] focus:bg-white rounded-2xl font-bold outline-none transition-all" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Stok (Isi {'>'} 0 untuk tayang)</label>
                                    <input required type="number" min="0" value={editForm.stock} onChange={e => setEditForm({...editForm, stock: e.target.value})} className="w-full p-4 bg-slate-50 border border-transparent focus:border-[#00478F] focus:bg-white rounded-2xl font-bold outline-none transition-all" />
                                </div>
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Kategori</label>
                                <input required type="text" value={editForm.category} onChange={e => setEditForm({...editForm, category: e.target.value})} placeholder="Misal: Pakaian, Buku" className="w-full p-4 bg-slate-50 border border-transparent focus:border-[#00478F] focus:bg-white rounded-2xl font-bold outline-none transition-all" />
                            </div>

                            <div>
                                <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1 ml-1">Deskripsi</label>
                                <textarea required value={editForm.description} onChange={e => setEditForm({...editForm, description: e.target.value})} className="w-full p-4 bg-slate-50 border border-transparent focus:border-[#00478F] focus:bg-white rounded-2xl font-medium outline-none transition-all min-h-[120px]"></textarea>
                            </div>

                            <button type="submit" disabled={isSaving} className="w-full bg-[#00478F] text-white py-4 rounded-2xl font-black text-sm uppercase tracking-widest hover:bg-slate-900 transition-all shadow-xl active:scale-95 disabled:opacity-50 mt-4 flex justify-center items-center gap-2">
                                {isSaving ? <><Loader2 size={18} className="animate-spin" /> Mengunggah...</> : 'Simpan Perubahan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* ========================================================= */}
            {/* MODAL: LAPORKAN PENGGUNA */}
            {/* ========================================================= */}
            {showReportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-red-600 flex items-center gap-2"><AlertTriangle size={24}/> Laporkan Toko</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        
                        <p className="text-sm text-slate-500 font-medium mb-6">Bantu kami menjaga komunitas tetap aman. Laporkan toko ini jika terindikasi melakukan penipuan atau menjual barang terlarang.</p>

                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Pelanggaran</label>
                                <select required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-red-500 outline-none">
                                    <option value="" disabled>Pilih Jenis Pelanggaran...</option>
                                    <option value="Toko Penipu / Scam">Terindikasi Penipuan / Scam</option>
                                    <option value="Barang Palsu / Terlarang">Menjual Barang Terlarang/Palsu</option>
                                    <option value="Spam / Iklan Mengganggu">Spam atau Iklan Mengganggu</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Kejadian</label>
                                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} placeholder="Ceritakan detail kecurigaan Anda..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"></textarea>
                            </div>

                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti (Opsional)</label>
                                {reportPreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                                        <img src={reportPreview} className="w-full h-32 object-cover" alt="preview" />
                                        <button type="button" onClick={() => {setReportForm({...reportForm, evidenceImage: null}); setReportPreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-500"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-red-50 hover:border-red-300 hover:text-red-500 cursor-pointer transition-colors text-slate-400">
                                        <ImagePlus size={28} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pilih Gambar (Screenshot)</span>
                                        <input type="file" accept="image/*" onChange={handleReportImageChange} className="hidden" />
                                    </label>
                                )}
                            </div>

                            <button type="submit" disabled={submittingReport} className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 uppercase tracking-widest text-xs shadow-lg shadow-red-500/30 transition-all mt-4 disabled:opacity-50">
                                {submittingReport ? 'Mengirim Laporan...' : 'Kirim Laporan'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}