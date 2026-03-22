import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { 
    ClipboardList, Clock, ShieldCheck, 
    Landmark, CheckCircle, MessageSquare, 
    AlertTriangle, Lock, KeyRound, ArrowRight, User,
    Star, ImagePlus, X, RotateCcw, Package, MapPin, ExternalLink, Info
} from 'lucide-react';

export default function MyTransactions() {
    const navigate = useNavigate(); 
    const [purchases, setPurchases] = useState([]);
    const [sales, setSales] = useState([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState('pembelian');
    
    // STATE TRANSAKSI & PENGIRIMAN
    const [pinInputs, setPinInputs] = useState({});
    const [verifying, setVerifying] = useState(false);
    const [shippingForm, setShippingForm] = useState({}); 

    // STATE ULASAN
    const [reviewingTrxId, setReviewingTrxId] = useState(null);
    const [ratingForm, setRatingForm] = useState(5);
    const [commentForm, setCommentForm] = useState('');
    const [reviewImages, setReviewImages] = useState([]);
    const [submittingReview, setSubmittingReview] = useState(false);

    // STATE SISTEM LAPORAN PENGGUNA
    const [showReportModal, setShowReportModal] = useState(false);
    const [reportForm, setReportForm] = useState({ 
        reportedUserId: '', transactionId: '', title: '', description: '', evidenceImage: null 
    });
    const [reportPreview, setReportPreview] = useState(null);
    const [submittingReport, setSubmittingReport] = useState(false);

    // STATE SISTEM PENGAJUAN REFUND
    const [showRefundModal, setShowRefundModal] = useState(false);
    const [refundingTrxId, setRefundingTrxId] = useState(null);
    const [refundForm, setRefundForm] = useState({ title: '', reason: '' });
    const [submittingRefund, setSubmittingRefund] = useState(false);

    const fetchTransactions = async () => {
        try {
            const response = await api.get('/transactions/my-transactions');
            setPurchases(response.data.data.purchases || []);
            setSales(response.data.data.sales || []);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat data transaksi.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTransactions(); }, []);

    // HANDLERS (COD, RESI, PROGRESS, KONFIRMASI)
    const handleVerifyPin = async (transactionId) => {
        const pin = pinInputs[transactionId];
        if (!pin || pin.length !== 4) return toast.error('Masukkan 4 digit PIN dengan benar!');
        setVerifying(true);
        const toastId = toast.loading('Memverifikasi PIN...');
        try {
            const response = await api.post(`/transactions/${transactionId}/verify-pin`, { pin });
            toast.success(response.data.message, { id: toastId });
            setPinInputs({ ...pinInputs, [transactionId]: '' }); 
            fetchTransactions(); 
        } catch (error) { toast.error(error.response?.data?.message || 'Gagal memverifikasi PIN', { id: toastId }); } 
        finally { setVerifying(false); }
    };

    const handleUpdateProgress = async (trxId, progress) => {
        const tid = toast.loading("Memperbarui status...");
        try {
            await api.put(`/transactions/${trxId}/shipping-progress`, { progress });
            toast.success("Status pengemasan diperbarui!", { id: tid });
            fetchTransactions();
        } catch (e) { toast.error(e.response?.data?.message || "Gagal memperbarui status", { id: tid }); }
    };

    // 🌟 PERBAIKAN: Fungsi Pengiriman Ekspedisi (Menambahkan Validasi Cost/Ongkir) 🌟
    const handleShipItem = async (trxId) => {
        const data = shippingForm[trxId];
        if (!data?.courier || !data?.resi || !data?.cost) return toast.error("Kurir, Nomor Resi, dan Nominal Ongkir wajib diisi!");
        
        const tid = toast.loading("Menyimpan info pengiriman...");
        try {
            await api.put(`/transactions/${trxId}/ship`, { 
                shippingCourier: data.courier, 
                shippingResi: data.resi,
                shippingCost: Number(data.cost) // <--- Ongkir masuk ke backend
            });
            toast.success("Barang ditandai terkirim!", { id: tid });
            fetchTransactions();
        } catch (e) { toast.error(e.response?.data?.message || "Gagal update pengiriman", { id: tid }); }
    };

    const handleConfirmDelivery = async (trxId) => {
        if(!window.confirm("Pastikan fisik barang sudah Anda terima dan sesuai dengan pesanan. Lanjutkan konfirmasi?")) return;
        const tid = toast.loading("Mengonfirmasi penerimaan...");
        try {
            await api.put(`/transactions/${trxId}/confirm-delivery`);
            toast.success("Pesanan Selesai! Terima kasih.", { id: tid });
            fetchTransactions();
        } catch (e) { toast.error(e.response?.data?.message || "Gagal mengonfirmasi", { id: tid }); }
    };

    // HANDLER GAMBAR & SUBMIT FORMS
    const handleAddReviewImages = (e) => {
        const files = Array.from(e.target.files);
        if (reviewImages.length + files.length > 5) return toast.error("Maksimal 5 gambar!");
        const newImages = files.map(file => ({ file, preview: URL.createObjectURL(file) }));
        setReviewImages([...reviewImages, ...newImages]);
    };
    const removeReviewImage = (index) => { setReviewImages(reviewImages.filter((_, i) => i !== index)); };
    const handleReportImageChange = (e) => {
        const file = e.target.files[0];
        if (file) { setReportForm({ ...reportForm, evidenceImage: file }); setReportPreview(URL.createObjectURL(file)); }
    };

    const handleSubmitReview = async (e, trx) => {
        e.preventDefault();
        setSubmittingReview(true);
        const toastId = toast.loading('Mengirim ulasan...');
        
        const formData = new FormData();
        const productData = trx.productId || trx.product;
        const sellerData = trx.sellerId || trx.seller;
        formData.append('productId', productData._id);
        formData.append('sellerId', sellerData._id);
        formData.append('transactionId', trx._id); 
        formData.append('rating', ratingForm);
        formData.append('comment', commentForm);
        reviewImages.forEach(img => { formData.append('images', img.file); });

        try {
            const res = await api.post('/reviews', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success('Ulasan berhasil dikirim! Terima kasih.', { id: toastId });
            setPurchases(prevPurchases => prevPurchases.map(p => p._id === trx._id ? { ...p, review: res.data.data } : p));
            setReviewingTrxId(null);
        } catch (error) { toast.error(error.response?.data?.message || 'Gagal mengirim ulasan', { id: toastId }); } 
        finally { setSubmittingReview(false); }
    };

    const handleSubmitReport = async (e) => {
        e.preventDefault();
        if (!reportForm.title || !reportForm.description) return toast.error("Harap isi semua kolom!");
        if (!reportForm.evidenceImage) return toast.error("Harap lampirkan bukti foto (Screenshot)!");

        setSubmittingReport(true);
        const toastId = toast.loading("Mengirim laporan ke Admin...");

        const formData = new FormData();
        formData.append('reportedUserId', reportForm.reportedUserId);
        formData.append('transactionId', reportForm.transactionId);
        formData.append('title', reportForm.title);
        formData.append('description', reportForm.description);
        formData.append('evidenceImage', reportForm.evidenceImage);

        try {
            await api.post('/reports', formData, { headers: { 'Content-Type': 'multipart/form-data' } });
            toast.success("Laporan berhasil dikirim. Admin akan segera menindaklanjuti.", { id: toastId });
            setShowReportModal(false);
            setReportForm({ reportedUserId: '', transactionId: '', title: '', description: '', evidenceImage: null });
            setReportPreview(null);
        } catch (error) { toast.error(error.response?.data?.message || "Gagal mengirim laporan", { id: toastId }); } 
        finally { setSubmittingReport(false); }
    };

    const handleSubmitRefund = async (e) => {
        e.preventDefault();
        if (!refundForm.title || !refundForm.reason) return toast.error("Harap isi semua kolom!");

        setSubmittingRefund(true);
        const toastId = toast.loading("Mengajukan refund...");

        try {
            await api.post(`/transactions/${refundingTrxId}/refund`, { title: refundForm.title, reason: refundForm.reason });
            toast.success("Pengajuan refund berhasil dikirim. Menunggu proses Admin.", { id: toastId });
            setShowRefundModal(false);
            setRefundForm({ title: '', reason: '' });
            fetchTransactions(); 
        } catch (error) { toast.error(error.response?.data?.message || "Gagal mengajukan refund", { id: toastId }); } 
        finally { setSubmittingRefund(false); }
    };

    // BADGE STATUS 
    const getStatusBadge = (trx, tab) => {
        const displayStatus = (tab === 'pembelian' && trx.status === 'Dana Dicairkan') ? 'Selesai' : trx.status;

        switch (displayStatus) {
            case 'Menunggu Verifikasi': return <span className="flex items-center gap-1.5 bg-orange-50 text-[#FF9500] px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-orange-200"><Clock size={14} /> Cek Admin</span>;
            case 'Dana Ditahan (Siap COD)': 
                return trx.deliveryMethod === 'Pengiriman' 
                    ? <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-200"><Package size={14} /> {tab === 'penjualan' ? 'Perlu Dikirim' : 'Sedang Diproses'}</span>
                    : <span className="flex items-center gap-1.5 bg-[#00478F]/10 text-[#00478F] px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-200"><ShieldCheck size={14} /> Bayar Aman</span>;
            case 'Barang Dikirim': return <span className="flex items-center gap-1.5 bg-blue-50 text-blue-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-blue-200"><Package size={14} /> Dikirim</span>;
            case 'Selesai': return <span className="flex items-center gap-1.5 bg-purple-50 text-purple-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-purple-200"><Landmark size={14} /> Selesai</span>;
            case 'Dana Dicairkan': return <span className="flex items-center gap-1.5 bg-green-50 text-green-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-green-200"><CheckCircle size={14} /> Dana Cair</span>;
            case 'Sengketa': return <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-red-200"><AlertTriangle size={14} /> Sengketa</span>;
            
            case 'Refund Diajukan': return <span className="flex items-center gap-1.5 bg-red-50 text-red-600 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-red-200"><AlertTriangle size={14} /> Refund Diajukan</span>;
            case 'Refund Diproses': return <span className="flex items-center gap-1.5 bg-orange-50 text-[#FF9500] px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-orange-200"><RotateCcw size={14} className="animate-spin-slow" /> Refund Diproses</span>;
            case 'Refund Selesai': return <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-slate-300"><RotateCcw size={14} /> Dikembalikan</span>;
            
            default: return <span className="flex items-center gap-1.5 bg-slate-100 text-slate-500 px-3 py-1.5 rounded-lg text-[10px] md:text-xs font-black uppercase tracking-widest border border-slate-200"><Clock size={14} /> Diproses</span>;
        }
    };

    if (loading) return <div className="flex justify-center items-center min-h-[60vh]"><div className="w-12 h-12 border-4 border-slate-100 border-t-[#00478F] rounded-full animate-spin"></div></div>;

    const activeData = activeTab === 'pembelian' ? purchases : sales;

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32 min-h-screen bg-[#F8FAFC]">
            
            {/* HEADER */}
            <div className="mb-10">
                <h1 className="text-3xl font-black text-slate-900 mb-2 flex items-center gap-3 tracking-tight">
                    <ClipboardList className="text-[#00478F]" size={36} strokeWidth={2.5} /> Status Transaksi
                </h1>
                <p className="text-slate-500 font-medium">Pantau keamanan dana dan jadwal pengiriman barang Anda di sini.</p>
            </div>

            {/* TAB NAVIGASI */}
            <div className="flex gap-8 border-b border-slate-200 mb-8 overflow-x-auto no-scrollbar">
                <button onClick={() => setActiveTab('pembelian')} className={`pb-4 font-black text-lg transition-all whitespace-nowrap relative ${activeTab === 'pembelian' ? 'text-[#00478F]' : 'text-slate-400 hover:text-slate-600'}`}>Pembelian Saya ({purchases.length}){activeTab === 'pembelian' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#FF9500] rounded-t-lg"></span>}</button>
                <button onClick={() => setActiveTab('penjualan')} className={`pb-4 font-black text-lg transition-all whitespace-nowrap relative ${activeTab === 'penjualan' ? 'text-[#00478F]' : 'text-slate-400 hover:text-slate-600'}`}>Penjualan Saya ({sales.length}){activeTab === 'penjualan' && <span className="absolute bottom-0 left-0 w-full h-1 bg-[#FF9500] rounded-t-lg"></span>}</button>
            </div>

            {/* KONTEN */}
            {activeData.length === 0 ? (
                <div className="bg-white rounded-[3rem] p-16 text-center shadow-sm border border-slate-100">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6"><ClipboardList size={32} className="text-slate-300" /></div>
                    <p className="text-slate-800 font-black text-xl tracking-tight mb-2">Belum ada transaksi di tab ini.</p>
                    <Link to="/explore" className="inline-flex items-center gap-2 text-[#FF9500] font-bold hover:text-[#00478F] transition-colors mt-2">Mulai berburu barang thrift <ArrowRight size={16} /></Link>
                </div>
            ) : (
                <div className="space-y-6">
                    {activeData.map((trx) => {
                        const productData = trx.productId || trx.product || {};
                        const opponentData = activeTab === 'pembelian' ? (trx.sellerId || trx.seller || {}) : (trx.buyerId || trx.buyer || {});
                        const priceToDisplay = trx.amount || trx.price || productData.price || 0;
                        const isDelivery = trx.deliveryMethod === 'Pengiriman';

                        return (
                            <div key={trx._id} className="bg-white rounded-[2rem] border border-slate-100 shadow-sm hover:shadow-xl hover:shadow-blue-900/5 transition-all duration-300 overflow-hidden">
                                
                                {/* HEADER CARD TRANSAKSI */}
                                <div className="bg-slate-50 px-6 py-4 border-b border-slate-100 flex flex-wrap justify-between items-center gap-3">
                                    <div className="flex items-center gap-3 flex-wrap">
                                        <span className="bg-white border border-slate-200 text-slate-600 font-mono text-[10px] font-black px-2.5 py-1 rounded-md tracking-wider shadow-sm">{trx.transactionId || 'CTH-LEGACY'}</span>
                                        <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${isDelivery ? 'bg-blue-100 text-blue-700' : 'bg-[#FF9500]/10 text-[#FF9500]'}`}>{isDelivery ? 'EKSPEDISI' : 'COD'}</span>
                                        <span className="text-xs font-bold text-slate-400 flex items-center gap-2"><Clock size={14} /> {new Date(trx.createdAt).toLocaleDateString('id-ID', { day:'numeric', month:'long', year:'numeric' })}</span>
                                    </div>
                                    {getStatusBadge(trx, activeTab)}
                                </div>

                                <div className="p-6">
                                    <div className="flex flex-col lg:flex-row gap-6 lg:items-center">
                                        {/* INFO PRODUK DAN RINCIAN FEE */}
                                        <div className="flex items-start gap-5 flex-1">
                                            <div className="w-24 h-24 rounded-2xl bg-slate-100 overflow-hidden shrink-0 border border-slate-200"><img src={(productData.images && productData.images.length > 0) ? productData.images[0] : (productData.imageUrl || 'https://via.placeholder.com/150')} alt="produk" className="w-full h-full object-cover" /></div>
                                            <div className="w-full">
                                                <h3 className="font-black text-slate-900 text-lg line-clamp-2 leading-tight hover:text-[#00478F] transition-colors cursor-pointer" onClick={() => navigate(`/product/${productData._id}`)}>{productData.title || 'Produk Dihapus'}</h3>
                                                {activeTab === 'penjualan' ? (
                                                    <div className="mt-3 bg-slate-50 p-3 rounded-xl border border-slate-100 w-full max-w-sm">
                                                        <div className="flex justify-between items-center text-[10px] font-bold text-slate-500 mb-1"><span>Harga Jual:</span> <span>Rp{priceToDisplay.toLocaleString('id-ID')}</span></div>
                                                        <div className="flex justify-between items-center text-[10px] font-bold text-red-500 mb-2 pb-2 border-b border-slate-200"><span>Biaya Layanan:</span> <span>-Rp{(trx.adminFee || 0).toLocaleString('id-ID')}</span></div>
                                                        <div className="flex justify-between items-center"><span className="text-[10px] font-black uppercase text-slate-600 tracking-widest">Diterima:</span><span className="font-black text-[#00478F] text-base">Rp{(trx.sellerIncome || priceToDisplay).toLocaleString('id-ID')}</span></div>
                                                    </div>
                                                ) : (<p className="font-black text-[#00478F] mt-2 text-xl">Rp{priceToDisplay.toLocaleString('id-ID')}</p>)}
                                            </div>
                                        </div>

                                        {/* Info Lawan Bicara */}
                                        <div className="flex-1 lg:border-l border-slate-100 lg:pl-8 flex justify-between items-center pt-4 lg:pt-0 border-t lg:border-t-0 mt-4 lg:mt-0 h-full">
                                            <div>
                                                <p className="text-[10px] text-slate-400 font-black uppercase tracking-widest mb-3">{activeTab === 'pembelian' ? 'Informasi Penjual' : 'Informasi Pembeli'}</p>
                                                <div className="flex items-center gap-3">
                                                    <img src={opponentData.profilePicture || 'https://via.placeholder.com/150'} alt="avatar" className="w-10 h-10 rounded-full ring-2 ring-slate-100 object-cover" />
                                                    <div>
                                                        <p className="font-bold text-slate-800">{opponentData.name || 'User Tidak Diketahui'}</p>
                                                        <p className="text-[10px] text-slate-500 font-medium truncate max-w-[150px] flex items-center gap-1">{isDelivery ? <MapPin size={12} className="text-blue-500"/> : <User size={12} />} {opponentData.campus || opponentData.domisili || 'Lokasi rahasia'}</p>
                                                    </div>
                                                </div>
                                                
                                                {opponentData._id && (
                                                    <button onClick={() => { setReportForm({ ...reportForm, reportedUserId: opponentData._id, transactionId: trx._id }); setShowReportModal(true); }} className="mt-3 text-[10px] font-black text-red-500 hover:text-red-700 transition-all flex items-center gap-1">
                                                        <AlertTriangle size={12} /> Laporkan Pengguna
                                                    </button>
                                                )}
                                            </div>
                                            {opponentData._id && (
                                                <Link to={`/chat/${opponentData._id}`} className="w-12 h-12 rounded-2xl bg-[#FF9500]/10 text-[#FF9500] flex items-center justify-center hover:bg-[#FF9500] hover:text-white transition-all shadow-sm shrink-0"><MessageSquare size={20} /></Link>
                                            )}
                                        </div>
                                    </div>

                                    {/* ========================================== */}
                                    {/* AREA AKSI BERDASARKAN METODE PENGIRIMAN */}
                                    {/* ========================================== */}
                                    {isDelivery ? (
                                        <>
                                            {/* PEMBELI SAJA: LIHAT STATUS PENGEMASAN */}
                                            {activeTab === 'pembelian' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                                <div className="mt-4 mb-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl flex items-center gap-4">
                                                    <div className="w-10 h-10 bg-white rounded-full flex items-center justify-center shadow-sm shrink-0"><Package size={18} className="text-blue-500"/></div>
                                                    <div>
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1">Status Pengerjaan Penjual</p>
                                                        <p className="font-black text-slate-800 text-sm">{trx.shippingProgress || 'Menunggu diproses penjual'}</p>
                                                    </div>
                                                </div>
                                            )}

                                            {/* PENJUAL SAJA: TAMPILAN ALAMAT PEMBELI */}
                                            {activeTab === 'penjualan' && trx.buyerAddress && (
                                                <div className="mt-4 mb-4 p-5 bg-blue-50 border border-blue-100 rounded-2xl">
                                                    <div className="flex items-center gap-2 mb-3">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-2"><MapPin size={14}/> Tujuan Pengiriman Ekspedisi</p>
                                                        <span className="px-2 py-0.5 rounded-md border shadow-sm inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 border-orange-200"><Info size={10} /> Ongkir DFOD</span>
                                                    </div>
                                                    <div className="space-y-2">
                                                        <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Alamat Lengkap</p><p className="text-sm font-bold text-slate-800 leading-relaxed">{trx.buyerAddress}</p></div>
                                                        <div className="grid grid-cols-2 gap-4 pt-2">
                                                            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Patokan / Titik</p><p className="text-sm font-bold text-slate-800 line-clamp-1">{trx.buyerLocationPoint}</p></div>
                                                            <div><p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Nomor Telepon</p><p className="text-sm font-bold text-slate-800">{trx.buyerPhone}</p></div>
                                                        </div>
                                                    </div>
                                                </div>
                                            )}

                                            {/* PENJUAL SAJA: UPDATE STATUS PENGEMASAN & INPUT RESI + ONGKIR */}
                                            {activeTab === 'penjualan' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                                <div className="mt-6 p-6 bg-white border-2 border-blue-100 rounded-2xl shadow-sm">
                                                    {/* Update Status Pengemasan */}
                                                    <div className="mb-6 pb-6 border-b border-slate-100">
                                                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Update Status Pengerjaan Anda</p>
                                                        <div className="flex flex-wrap gap-2">
                                                            {['Menunggu diproses penjual', 'Sedang Dikemas', 'Diantar ke Ekspedisi'].map(prog => (
                                                                <button key={prog} onClick={() => handleUpdateProgress(trx._id, prog)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all border ${trx.shippingProgress === prog ? 'bg-blue-600 text-white border-blue-600 shadow-md' : 'bg-slate-50 text-slate-500 border-slate-200 hover:bg-blue-50 hover:text-blue-600'}`}>{prog}</button>
                                                            ))}
                                                        </div>
                                                    </div>

                                                    {/* 🌟 INPUT RESI FINAL BESERTA TAGIHAN ONGKIR 🌟 */}
                                                    <p className="font-black text-blue-900 mb-1 text-lg">Input Resi & Tagihan Ongkos Kirim</p>
                                                    <p className="text-xs text-blue-700 mb-4 font-medium leading-relaxed">Saat menyerahkan paket ke kurir, masukkan resi dan nominal ongkir yang tertera pada struk agar pembeli bisa menyiapkan uang pas.</p>
                                                    <div className="flex gap-3 flex-col lg:flex-row">
                                                        <input type="text" placeholder="Kurir (Contoh: J&T / JNE)" value={shippingForm[trx._id]?.courier || ''} onChange={(e) => setShippingForm({...shippingForm, [trx._id]: { ...shippingForm[trx._id], courier: e.target.value }})} className="flex-1 px-4 py-3 border border-blue-200 rounded-xl font-bold focus:outline-blue-500 text-sm" />
                                                        <input type="text" placeholder="Nomor Resi" value={shippingForm[trx._id]?.resi || ''} onChange={(e) => setShippingForm({...shippingForm, [trx._id]: { ...shippingForm[trx._id], resi: e.target.value }})} className="flex-1 px-4 py-3 border border-blue-200 rounded-xl font-bold focus:outline-blue-500 text-sm" />
                                                        <input type="number" placeholder="Nominal Ongkir (Rp)" value={shippingForm[trx._id]?.cost || ''} onChange={(e) => setShippingForm({...shippingForm, [trx._id]: { ...shippingForm[trx._id], cost: e.target.value }})} className="flex-1 px-4 py-3 border border-blue-200 rounded-xl font-bold focus:outline-blue-500 text-sm" />
                                                        <button onClick={() => handleShipItem(trx._id)} className="bg-blue-600 text-white px-6 py-3 rounded-xl font-black hover:bg-blue-700 shadow-md whitespace-nowrap text-sm shrink-0">Kirim Paket</button>
                                                    </div>
                                                </div>
                                            )}

                                            {/* PEMBELI & PENJUAL: TAMPILAN RESI BESERTA ONGKIR */}
                                            {trx.status === 'Barang Dikirim' && (
                                                <div className="mt-6 p-6 bg-blue-50 border border-blue-200 rounded-2xl flex flex-col md:flex-row justify-between items-start gap-4">
                                                    <div className="w-full md:w-auto">
                                                        <div className="flex items-center justify-start gap-2 mb-3">
                                                            <p className="text-[10px] font-black uppercase tracking-widest text-blue-600 flex items-center gap-1"><Package size={14}/> Status Ekspedisi</p>
                                                            <span className="px-2 py-0.5 rounded-md border shadow-sm inline-flex items-center gap-1 text-[9px] font-black uppercase tracking-widest bg-orange-100 text-orange-700 border-orange-200"><Info size={10} /> Bayar Tujuan</span>
                                                        </div>
                                                        <p className="font-black text-slate-800 text-sm">Kurir: {trx.shippingCourier}</p>
                                                        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 mt-2">
                                                            <p className="font-mono text-blue-900 text-xl font-bold tracking-widest bg-white px-3 py-1 rounded-md border border-blue-100 inline-block">{trx.shippingResi}</p>
                                                            <a href={`https://www.google.com/search?q=cek+resi+${trx.shippingCourier}+${trx.shippingResi}`} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 bg-white border border-blue-200 text-blue-600 px-4 py-2 rounded-xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-600 hover:text-white transition-all shadow-sm shrink-0">
                                                                <ExternalLink size={14} /> Lacak Resi (Google)
                                                            </a>
                                                        </div>

                                                        {/* 🌟 HINT TAGIHAN ONGKIR UNTUK PEMBELI 🌟 */}
                                                        {trx.shippingCost > 0 && (
                                                            <div className="mt-5 bg-orange-100/50 border border-orange-200 p-4 rounded-xl max-w-sm">
                                                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-1 flex items-center gap-1"><AlertTriangle size={12}/> Tagihan Ongkos Kirim</p>
                                                                <div className="flex items-baseline gap-2">
                                                                    <span className="font-black text-orange-700 text-2xl">Rp{trx.shippingCost.toLocaleString('id-ID')}</span>
                                                                </div>
                                                                {activeTab === 'pembelian' ? (
                                                                    <p className="text-xs font-bold text-orange-600 mt-2 leading-relaxed">⚠️ Siapkan uang tunai (pas) untuk diserahkan ke kurir ekspedisi saat paket sampai di lokasi Anda.</p>
                                                                ) : (
                                                                    <p className="text-xs font-bold text-orange-600 mt-2 leading-relaxed">Informasi ongkir telah disampaikan ke pembeli.</p>
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    
                                                    {/* PEMBELI SAJA YG BISA KONFIRMASI */}
                                                    {activeTab === 'pembelian' && (
                                                        <button onClick={() => handleConfirmDelivery(trx._id)} className="w-full md:w-auto bg-green-500 text-white font-black px-6 py-4 rounded-xl hover:bg-green-600 shadow-lg hover:-translate-y-0.5 transition-all text-xs uppercase tracking-widest md:mt-8">
                                                            Konfirmasi Terima Barang
                                                        </button>
                                                    )}
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <>
                                            {/* TAMPILAN LOKASI COD UNTUK PEMBELI DAN PENJUAL */}
                                            <div className="mt-4 mb-4 p-5 bg-orange-50 border border-orange-100 rounded-2xl">
                                                <p className="text-[10px] font-black uppercase tracking-widest text-orange-600 mb-2 flex items-center gap-2"><MapPin size={14}/> Titik Temu COD (Ketemuan)</p>
                                                <p className="text-sm font-bold text-slate-800 leading-relaxed">{trx.codMeetingPoint || 'Belum ditentukan oleh pembeli'}</p>
                                            </div>

                                            {/* LOGIKA COD (KETEMUAN) */}
                                            {activeTab === 'pembelian' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                                <div className="mt-6 p-6 bg-[#00478F] rounded-2xl flex flex-col md:flex-row items-center justify-between text-white shadow-xl shadow-blue-900/10 gap-6 relative overflow-hidden mb-4">
                                                    <div className="absolute -right-10 -top-10 text-white/5"><Lock size={150} /></div>
                                                    <div className="relative z-10 flex items-center gap-4">
                                                        <div className="w-12 h-12 bg-white/10 rounded-full flex items-center justify-center"><KeyRound size={24} className="text-[#FF9500]" /></div>
                                                        <div><p className="text-xs text-blue-200 font-black uppercase tracking-widest mb-1">PIN Rahasia COD</p><p className="text-sm font-medium opacity-90">Berikan ke penjual <strong className="text-[#FF9500]">HANYA</strong> jika barang sudah diterima.</p></div>
                                                    </div>
                                                    <div className="relative z-10 bg-white text-[#00478F] px-8 py-3 rounded-xl font-black text-3xl tracking-[0.4em] shadow-inner border-2 border-[#FF9500]">{trx.codPin}</div>
                                                </div>
                                            )}

                                            {activeTab === 'penjualan' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                                <div className="mt-6 p-6 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div className="flex items-start gap-4 flex-1">
                                                        <div className="w-12 h-12 bg-[#FF9500]/10 rounded-full flex items-center justify-center shrink-0"><Lock size={24} className="text-[#FF9500]" /></div>
                                                        <div><p className="font-black text-slate-800 text-lg mb-1">Verifikasi Transaksi COD</p><p className="text-xs text-slate-500 font-medium leading-relaxed">Minta 4-Digit PIN dari pembeli saat ketemuan untuk mencairkan dana Anda ke rekening.</p></div>
                                                    </div>
                                                    <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
                                                        <input type="text" maxLength="4" placeholder="• • • •" value={pinInputs[trx._id] || ''} onChange={(e) => { const val = e.target.value.replace(/\D/g, ''); setPinInputs({...pinInputs, [trx._id]: val}) }} className="w-full sm:w-32 px-4 py-3 bg-white border-2 border-slate-200 rounded-xl text-center text-xl tracking-[0.5em] font-black focus:border-[#00478F] outline-none transition-colors" />
                                                        <button onClick={() => handleVerifyPin(trx._id)} disabled={verifying || (pinInputs[trx._id]?.length !== 4)} className="w-full sm:w-auto bg-[#00478F] text-white font-black px-8 py-3 rounded-xl hover:bg-[#FF9500] transition-colors disabled:opacity-50 whitespace-nowrap">Cairkan</button>
                                                    </div>
                                                </div>
                                            )}
                                        </>
                                    )}

                                    {/* TOMBOL BATALKAN & AJUKAN REFUND */}
                                    {activeTab === 'pembelian' && trx.status === 'Dana Ditahan (Siap COD)' && (
                                        <div className="flex justify-end mt-4 border-t border-slate-100 pt-4">
                                            <button onClick={() => { setRefundingTrxId(trx._id); setShowRefundModal(true); }} className="px-6 py-3 bg-red-50 text-red-600 font-black uppercase text-[10px] tracking-widest rounded-xl hover:bg-red-500 hover:text-white transition-colors border border-red-100 flex items-center gap-2">
                                                <RotateCcw size={16} /> Batalkan Pesanan & Ajukan Refund
                                            </button>
                                        </div>
                                    )}

                                    {/* PEMBELI: TAMPILAN STATUS REFUND */}
                                    {activeTab === 'pembelian' && ['Refund Diajukan', 'Refund Diproses', 'Refund Selesai'].includes(trx.status) && (
                                        <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl">
                                            <h4 className="font-black text-red-600 mb-2 flex items-center gap-2"><RotateCcw size={16}/> Informasi Pengembalian Dana</h4>
                                            <p className="text-sm font-bold text-slate-800 mb-1">Alasan Batal: <span className="font-medium text-slate-600">{trx.cancelTitle}</span></p>
                                            <p className="text-xs text-slate-500 italic">"{trx.cancelReason}"</p>
                                            {trx.status === 'Refund Selesai' && (
                                                <div className="mt-4 pt-3 border-t border-red-200/50">
                                                    <p className="text-xs font-black text-green-600">✅ Dana 100% sebesar Rp{trx.price.toLocaleString('id-ID')} telah ditransfer ke rekening Anda.</p>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    {/* FORM BERI ULASAN */}
                                    {activeTab === 'pembelian' && (trx.status === 'Selesai' || trx.status === 'Dana Dicairkan') && (
                                        <div className="mt-6 border-t border-slate-100 pt-6">
                                            {trx.review ? (
                                                <div className="bg-slate-50 p-6 rounded-2xl border border-slate-200 relative overflow-hidden">
                                                    <div className="absolute top-0 right-0 bg-[#FF9500] text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">Ulasan Anda</div>
                                                    <div className="flex items-center gap-3 mb-3">
                                                        <img src={trx.review.buyerId?.profilePicture || 'https://via.placeholder.com/150'} className="w-10 h-10 rounded-full object-cover" alt=""/>
                                                        <div className="flex-1">
                                                            <p className="font-black text-slate-800 text-sm">Anda</p>
                                                            <div className="flex text-[#FF9500] mt-1">{[...Array(5)].map((_, i) => (<Star key={i} size={10} fill={i < trx.review.rating ? "#FF9500" : "none"} strokeWidth={2.5} />))}</div>
                                                        </div>
                                                        <span className="text-[10px] text-slate-400 font-bold">{new Date(trx.review.createdAt).toLocaleDateString('id-ID')}</span>
                                                    </div>
                                                    <p className="text-slate-600 text-sm font-medium italic mb-3">"{trx.review.comment}"</p>
                                                    {trx.review.images && trx.review.images.length > 0 && (
                                                        <div className="flex gap-2 overflow-x-auto pb-1">
                                                            {trx.review.images.map((img, idx) => (<img key={idx} src={img} alt="ulasan" className="w-16 h-16 rounded-xl object-cover border border-slate-200 shrink-0 hover:scale-105 transition-transform" onClick={() => window.open(img, '_blank')} />))}
                                                        </div>
                                                    )}
                                                </div>
                                            ) : reviewingTrxId === trx._id ? (
                                                <div className="bg-slate-50 p-6 md:p-8 rounded-2xl border border-slate-200">
                                                    <div className="flex justify-between items-center mb-6 border-b border-slate-200 pb-4">
                                                        <h4 className="font-black text-slate-800 text-lg">Nilai Pembelian Ini</h4>
                                                        <button onClick={() => setReviewingTrxId(null)} className="text-slate-400 hover:text-red-500 bg-white p-2 rounded-full shadow-sm"><X size={18}/></button>
                                                    </div>
                                                    <form onSubmit={(e) => handleSubmitReview(e, trx)} className="space-y-6">
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Kualitas Barang & Pelayanan</label>
                                                            <div className="flex gap-3">
                                                                {[1,2,3,4,5].map(num => (
                                                                    <button type="button" key={num} onClick={() => setRatingForm(num)} className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all shadow-sm ${ratingForm >= num ? 'bg-[#FF9500] text-white scale-110' : 'bg-white border border-slate-200 text-slate-300'} `}><Star size={20} fill={ratingForm >= num ? "currentColor" : "none"} /></button>
                                                                ))}
                                                            </div>
                                                        </div>
                                                        <div><label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Tulis Ulasan</label><textarea required value={commentForm} onChange={(e) => setCommentForm(e.target.value)} className="w-full p-4 rounded-xl border border-slate-200 focus:border-[#00478F] outline-none text-sm font-medium text-slate-700 bg-white" placeholder="Bagaimana kondisi barangnya? Apakah penjual ramah?" rows="3"></textarea></div>
                                                        <div>
                                                            <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-3">Upload Foto (Maks 5)</label>
                                                            <div className="flex gap-3 overflow-x-auto pb-2">
                                                                {reviewImages.map((img, idx) => (
                                                                    <div key={idx} className="relative w-20 h-20 shrink-0 rounded-xl overflow-hidden group border border-slate-200 bg-white p-1 shadow-sm">
                                                                        <img src={img.preview} alt="preview" className="w-full h-full object-cover rounded-lg" />
                                                                        <button type="button" onClick={() => removeReviewImage(idx)} className="absolute inset-0 bg-black/60 text-white flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all rounded-lg m-1"><X size={18}/></button>
                                                                    </div>
                                                                ))}
                                                                {reviewImages.length < 5 && (
                                                                    <label className="w-20 h-20 shrink-0 border-2 border-dashed border-slate-300 bg-white rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9500] hover:text-[#FF9500] transition-colors text-slate-400 shadow-sm">
                                                                        <ImagePlus size={24} className="mb-1" /><span className="text-[9px] font-bold">Tambah</span><input type="file" multiple accept="image/*" onChange={handleAddReviewImages} className="hidden" />
                                                                    </label>
                                                                )}
                                                            </div>
                                                        </div>
                                                        <button type="submit" disabled={submittingReview} className="w-full bg-[#00478F] text-white font-black py-4 rounded-xl hover:bg-[#FF9500] uppercase text-xs tracking-widest transition-all shadow-lg shadow-blue-900/20 disabled:opacity-50">
                                                            {submittingReview ? 'Mengirim...' : 'Kirim Penilaian'}
                                                        </button>
                                                    </form>
                                                </div>
                                            ) : (
                                                <button onClick={() => { setReviewingTrxId(trx._id); setRatingForm(5); setCommentForm(''); setReviewImages([]); }} className="w-full flex items-center justify-center gap-2 py-4 bg-[#FF9500]/10 text-[#FF9500] font-black rounded-xl hover:bg-[#FF9500] hover:text-white transition-all uppercase text-xs tracking-widest border border-[#FF9500]/20">
                                                    <Star size={18} fill="currentColor" /> Beri Ulasan & Penilaian
                                                </button>
                                            )}
                                        </div>
                                    )}

                                    {/* PENJUAL: TAMPILAN STATUS REFUND */}
                                    {activeTab === 'penjualan' && ['Refund Diajukan', 'Refund Diproses', 'Refund Selesai'].includes(trx.status) && (
                                        <div className="mt-6 p-5 bg-red-50 border border-red-100 rounded-2xl">
                                            <h4 className="font-black text-red-600 mb-2 flex items-center gap-2"><AlertTriangle size={16}/> Pesanan Dibatalkan Pembeli</h4>
                                            <p className="text-sm font-bold text-slate-800 mb-1">Alasan: <span className="font-medium text-slate-600">{trx.cancelTitle}</span></p>
                                            <p className="text-xs text-slate-500 italic">"{trx.cancelReason}"</p>
                                            {trx.status === 'Refund Selesai' && (
                                                <div className="mt-3 pt-3 border-t border-red-200/50"><p className="text-xs font-black text-green-600">📦 Stok barang telah dikembalikan ke etalase toko Anda.</p></div>
                                            )}
                                        </div>
                                    )}

                                    {/* PENJUAL: MENUNGGU TRANSFER ADMIN */}
                                    {trx.status === 'Selesai' && activeTab === 'penjualan' && (
                                        <div className="mt-6 p-5 bg-purple-50 border border-purple-100 rounded-2xl flex items-center gap-4">
                                            <div className="w-10 h-10 bg-purple-200 text-purple-700 rounded-full flex items-center justify-center shrink-0"><Landmark size={20} /></div>
                                            <div>
                                                <p className="text-sm font-black text-purple-900">Transaksi Berhasil! Menunggu Transfer Admin</p>
                                                <p className="text-xs text-purple-700 mt-1 font-medium leading-relaxed">Dana bersih <strong>Rp{(trx.sellerIncome || priceToDisplay).toLocaleString('id-ID')}</strong> akan ditransfer ke rekening Anda dalam waktu maksimal 1x24 jam kerja.</p>
                                            </div>
                                        </div>
                                    )}

                                    {/* PENJUAL: DANA SUDAH CAIR */}
                                    {trx.status === 'Dana Dicairkan' && activeTab === 'penjualan' && (
                                        <div className="mt-6 p-5 bg-green-50 border border-green-100 rounded-2xl flex items-center gap-4">
                                            <div className="w-10 h-10 bg-green-200 text-green-700 rounded-full flex items-center justify-center shrink-0"><CheckCircle size={20} /></div>
                                            <div>
                                                <p className="text-sm font-black text-green-900">Transaksi Selesai & Dana Telah Cair</p>
                                                <p className="text-xs text-green-700 mt-1 font-medium">Silakan cek mutasi Rekening atau E-Wallet Anda.</p>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {/* MODAL LAPORKAN PENGGUNA */}
            {showReportModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl max-h-[90vh] overflow-y-auto no-scrollbar">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-red-600 flex items-center gap-2"><AlertTriangle size={24}/> Laporkan Pengguna</h2>
                            <button onClick={() => setShowReportModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-6">Bantu kami menjaga komunitas tetap aman. Laporkan jika ada tindakan penipuan, barang palsu, atau pelecehan.</p>
                        <form onSubmit={handleSubmitReport} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Jenis Pelanggaran</label>
                                <select required value={reportForm.title} onChange={(e) => setReportForm({...reportForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-red-500 outline-none">
                                    <option value="" disabled>Pilih Jenis Pelanggaran...</option>
                                    <option value="Penipuan / Fraud">Penipuan / Barang Tidak Dikirim</option>
                                    <option value="Barang Tidak Sesuai Deskripsi">Barang Rusak / Tidak Sesuai</option>
                                    <option value="Pelecehan / Kata Kasar">Pelecehan / Kata-kata Kasar</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Deskripsi Kejadian</label>
                                <textarea required value={reportForm.description} onChange={(e) => setReportForm({...reportForm, description: e.target.value})} placeholder="Ceritakan detail kejadian secara kronologis..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:ring-2 focus:ring-red-500 outline-none min-h-[100px]"></textarea>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Upload Bukti (Wajib)</label>
                                {reportPreview ? (
                                    <div className="relative rounded-xl overflow-hidden border border-slate-200 mb-2">
                                        <img src={reportPreview} className="w-full h-32 object-cover" alt="preview" />
                                        <button type="button" onClick={() => {setReportForm({...reportForm, evidenceImage: null}); setReportPreview(null);}} className="absolute top-2 right-2 bg-black/50 text-white p-1.5 rounded-lg hover:bg-red-500"><X size={16}/></button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 hover:bg-red-50 hover:border-red-300 hover:text-red-500 cursor-pointer transition-colors text-slate-400">
                                        <ImagePlus size={28} className="mb-2" />
                                        <span className="text-[10px] font-black uppercase tracking-widest">Pilih Gambar (Screenshot)</span>
                                        <input type="file" required accept="image/*" onChange={handleReportImageChange} className="hidden" />
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

            {/* MODAL PENGAJUAN REFUND */}
            {showRefundModal && (
                <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl">
                        <div className="flex justify-between items-center mb-6">
                            <h2 className="text-xl font-black text-red-600 flex items-center gap-2"><RotateCcw size={24}/> Ajukan Refund 100%</h2>
                            <button onClick={() => setShowRefundModal(false)} className="text-slate-400 hover:bg-slate-100 p-2 rounded-full"><X size={20}/></button>
                        </div>
                        <p className="text-sm text-slate-500 font-medium mb-6">Pastikan profil Anda sudah diisi dengan nomor Rekening/E-Wallet yang valid untuk menerima pengembalian dana.</p>
                        <form onSubmit={handleSubmitRefund} className="space-y-4">
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Alasan Pembatalan</label>
                                <select required value={refundForm.title} onChange={(e) => setRefundForm({...refundForm, title: e.target.value})} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:border-[#00478F] outline-none">
                                    <option value="" disabled>Pilih Alasan...</option>
                                    <option value="Berubah Pikiran / Batal Beli">Berubah Pikiran / Batal Beli</option>
                                    <option value="Penjual Tidak Merespons">Penjual Tidak Merespons (Ghosting)</option>
                                    <option value="Barang Tidak Sesuai Saat COD">Barang Tidak Sesuai Saat COD / Diterima</option>
                                    <option value="Lainnya">Lainnya</option>
                                </select>
                            </div>
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">Detail Alasan</label>
                                <textarea required value={refundForm.reason} onChange={(e) => setRefundForm({...refundForm, reason: e.target.value})} placeholder="Jelaskan alasan batal Anda secara singkat..." className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-medium focus:border-[#00478F] outline-none min-h-[100px]"></textarea>
                            </div>
                            <button type="submit" disabled={submittingRefund} className="w-full py-4 bg-red-600 text-white font-black rounded-xl hover:bg-red-700 uppercase tracking-widest text-xs shadow-lg shadow-red-500/30 transition-all mt-4 disabled:opacity-50">
                                {submittingRefund ? 'Mengajukan...' : 'Kirim Pengajuan Refund'}
                            </button>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}