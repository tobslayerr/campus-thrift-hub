import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { CheckCircle, AlertCircle, Image as ImageIcon, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [product, setProduct] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [proofImage, setProofImage] = useState(null);
    const [previewProof, setPreviewProof] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchData = async () => {
            try {
                // 1. Ambil data produk
                const productRes = await api.get(`/products/${id}`);
                const fetchedProduct = productRes.data.data;
                
                // Proteksi: Tidak boleh beli barang sendiri
                if (fetchedProduct.sellerId._id === user?.id) {
                    setErrorMsg('Akses Ditolak: Anda tidak bisa membeli barang jualan Anda sendiri.');
                    setProduct(null);
                } else {
                    setProduct(fetchedProduct);
                }

                // 2. Ambil daftar rekening admin
                const methodsRes = await api.get('/payment-methods');
                setPaymentMethods(methodsRes.data.data);
                
                // Set default jika ada data
                if (methodsRes.data.data.length > 0) {
                    const first = methodsRes.data.data[0];
                    setSelectedMethod(`${first.bankName} - ${first.accountNumber} (${first.ownerName})`);
                }
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
                setErrorMsg('Barang tidak ditemukan atau sudah terjual.');
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, user]);

    const handleFileChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setProofImage(file);
            setPreviewProof(URL.createObjectURL(file));
        }
    };

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!selectedMethod) return toast.error('Pilih metode pembayaran!');
        if (!proofImage) return toast.error('Upload bukti transfer wajib diisi!');

        setSubmitting(true);
        const toastId = toast.loading("Sedang memproses checkout...");

        const formData = new FormData();
        formData.append('productId', product._id);
        formData.append('paymentMethod', selectedMethod);
        formData.append('proof', proofImage);

        try {
            await api.post('/transactions/checkout', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            toast.success('Checkout Berhasil! Menunggu verifikasi admin.', { id: toastId });
            navigate('/transactions');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal checkout', { id: toastId });
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-10 h-10 border-4 border-slate-200 border-t-[#00478F] rounded-full animate-spin"></div>
        </div>
    );
    
    if (!product) return (
        <div className="max-w-2xl mx-auto mt-20 p-10 bg-white rounded-[2.5rem] text-center shadow-xl border border-slate-100">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
                <AlertCircle size={40} />
            </div>
            <h2 className="text-2xl font-black text-slate-900 mb-2">Oops! Ada Kendala</h2>
            <p className="text-slate-500 font-medium mb-8">{errorMsg}</p>
            <button onClick={() => navigate(-1)} className="bg-[#00478F] text-white px-8 py-4 rounded-2xl font-black hover:bg-slate-800 transition shadow-lg flex items-center gap-2 mx-auto">
                <ArrowLeft size={18} /> Kembali
            </button>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-10 pb-32">
            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-[#00478F] transition">
                <ArrowLeft size={20} /> Kembali
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                {/* SISI KIRI: INFO PRODUK */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                        <img 
                            src={(product.images && product.images.length > 0) ? product.images[0] : product.imageUrl} 
                            alt={product.title} 
                            className="w-full aspect-square object-cover rounded-[2rem] mb-6 bg-slate-50" 
                        />
                        <span className="text-[10px] font-black bg-[#FF9500]/10 text-[#FF9500] px-3 py-1 rounded-full uppercase tracking-widest mb-3 inline-block">
                            {product.category?.name || 'Produk'}
                        </span>
                        <h2 className="text-xl font-black text-slate-900 leading-tight mb-2">{product.title}</h2>
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Bayar</p>
                            <p className="text-2xl font-black text-[#00478F]">Rp{product.price.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>

                {/* SISI KANAN: FORM PEMBAYARAN */}
                <div className="lg:col-span-7">
                    <form onSubmit={handleCheckout} className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-2">
                            <CheckCircle className="text-green-500" /> Metode Pembayaran
                        </h3>

                        {/* PILIHAN REKENING */}
                        <div className="space-y-4 mb-8">
                            {paymentMethods.length === 0 ? (
                                <p className="text-slate-400 text-sm italic">Metode pembayaran belum tersedia.</p>
                            ) : (
                                paymentMethods.map((method) => {
                                    const val = `${method.bankName} - ${method.accountNumber} (${method.ownerName})`;
                                    const isSelected = selectedMethod === val;
                                    return (
                                        <div key={method._id} className="relative">
                                            <label className={`flex flex-col p-5 rounded-2xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#00478F] bg-blue-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <input type="radio" name="pay" checked={isSelected} onChange={() => setSelectedMethod(val)} className="w-5 h-5 accent-[#00478F]" />
                                                        <div>
                                                            <p className="font-black text-slate-900">{method.bankName}</p>
                                                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter">a.n {method.ownerName}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-mono font-black text-[#00478F]">{method.accountNumber}</p>
                                                </div>

                                                {/* AUTO-DISPLAY QRIS JIKA DIPILIH */}
                                                {isSelected && method.qrImageUrl && (
                                                    <div className="mt-6 pt-6 border-t border-blue-100 flex flex-col items-center animate-in fade-in slide-in-from-top-4 duration-500">
                                                        <p className="text-[10px] font-black text-[#00478F] uppercase tracking-widest mb-3">Scan QRIS Berikut:</p>
                                                        <img src={method.qrImageUrl} alt="QRIS" className="w-48 h-48 object-cover rounded-2xl shadow-md border-4 border-white" />
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        {/* UPLOAD BUKTI */}
                        <div className="mb-10">
                            <h3 className="text-sm font-black text-slate-900 mb-4 uppercase tracking-widest">Upload Bukti Transfer</h3>
                            <div className="relative group">
                                {previewProof ? (
                                    <div className="relative rounded-2xl overflow-hidden border-2 border-[#00478F]">
                                        <img src={previewProof} className="w-full h-48 object-cover" alt="Preview" />
                                        <button 
                                            type="button" 
                                            onClick={() => {setProofImage(null); setPreviewProof(null);}}
                                            className="absolute top-3 right-3 bg-red-500 text-white p-2 rounded-xl shadow-lg hover:scale-110 transition"
                                        >
                                            Ganti Gambar
                                        </button>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-slate-200 bg-slate-50 rounded-2xl cursor-pointer hover:bg-slate-100 hover:border-[#00478F] transition-all group">
                                        <ImageIcon className="text-slate-300 group-hover:text-[#00478F] mb-2 transition-colors" size={32} />
                                        <p className="text-xs font-black text-slate-400 group-hover:text-[#00478F]">Klik untuk upload bukti bayar</p>
                                        <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                    </label>
                                )}
                            </div>
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting || paymentMethods.length === 0}
                            className="w-full bg-[#00478F] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:bg-[#FF9500] hover:-translate-y-1 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Memproses...' : 'Konfirmasi Pembayaran'}
                        </button>
                        
                        <p className="text-center text-[10px] font-bold text-slate-400 mt-6 leading-relaxed">
                            Dana Anda aman bersama tim Escrow Campus Thrift Hub.<br/>
                            Penjual baru akan menerima dana setelah Anda menerima barang.
                        </p>
                    </form>
                </div>
            </div>
        </div>
    );
}