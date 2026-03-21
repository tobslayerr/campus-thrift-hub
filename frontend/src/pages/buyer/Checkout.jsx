/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';
import { CheckCircle, AlertCircle, Image as ImageIcon, ArrowLeft, Maximize2, X, Smartphone, Package, MapPin } from 'lucide-react';
import toast from 'react-hot-toast';

export default function Checkout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [product, setProduct] = useState(null);
    const [paymentMethods, setPaymentMethods] = useState([]);
    const [selectedMethod, setSelectedMethod] = useState('');
    const [deliveryMethod, setDeliveryMethod] = useState('COD'); 
    
    // STATE ALAMAT PENGIRIMAN
    const [shippingAddress, setShippingAddress] = useState('');
    const [shippingPhone, setShippingPhone] = useState('');
    const [shippingLocationPoint, setShippingLocationPoint] = useState('');

    const [proofImage, setProofImage] = useState(null);
    const [previewProof, setPreviewProof] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    
    const [zoomQR, setZoomQR] = useState(null);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const productRes = await api.get(`/products/${id}`);
                const fetchedProduct = productRes.data.data;
                
                if (fetchedProduct.sellerId._id === user?.id) {
                    setErrorMsg('Akses Ditolak: Anda tidak bisa membeli barang jualan Anda sendiri.');
                    setProduct(null);
                } else {
                    setProduct(fetchedProduct);
                }

                const methodsRes = await api.get('/payment-methods');
                setPaymentMethods(methodsRes.data.data);
                
                if (methodsRes.data.data.length > 0) {
                    const first = methodsRes.data.data[0];
                    setSelectedMethod(`${first.bankName} - ${first.accountNumber} (${first.ownerName})`);
                }
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
        
        // VALIDASI
        if (!selectedMethod) return toast.error('Pilih metode pembayaran!');
        if (deliveryMethod === 'Pengiriman') {
            if (!shippingAddress || !shippingPhone || !shippingLocationPoint) {
                return toast.error('Harap lengkapi Alamat, Nomor Telepon, dan Titik Patokan!');
            }
        }
        if (!proofImage) return toast.error('Upload bukti transfer wajib diisi!');

        setSubmitting(true);
        const toastId = toast.loading("Sedang memproses checkout...");

        const formData = new FormData();
        formData.append('productId', product._id);
        formData.append('paymentMethod', selectedMethod);
        formData.append('deliveryMethod', deliveryMethod); 
        
        // Kirim data alamat jika metode pengiriman dipilih
        if (deliveryMethod === 'Pengiriman') {
            formData.append('buyerAddress', shippingAddress);
            formData.append('buyerPhone', shippingPhone);
            formData.append('buyerLocationPoint', shippingLocationPoint);
        }

        formData.append('proofOfPayment', proofImage); 

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
        <div className="max-w-5xl mx-auto p-4 md:p-10 pb-32">
            {zoomQR && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="relative max-w-lg w-full bg-white p-6 rounded-[2.5rem] shadow-2xl">
                        <button onClick={() => setZoomQR(null)} className="absolute -top-4 -right-4 bg-red-500 text-white p-2 rounded-full hover:scale-110 transition shadow-lg z-10">
                            <X size={24} />
                        </button>
                        <div className="text-center mb-4">
                            <h3 className="font-black text-slate-900">QRIS PEMBAYARAN</h3>
                            <p className="text-xs text-slate-400 font-bold uppercase tracking-widest">Silakan Scan Melalui Aplikasi Bank/E-Wallet</p>
                        </div>
                        <img src={zoomQR} alt="QRIS Zoom" className="w-full aspect-square object-contain rounded-2xl border-4 border-slate-50" />
                        <button onClick={() => setZoomQR(null)} className="w-full mt-6 py-4 bg-slate-900 text-white font-black rounded-2xl">Tutup</button>
                    </div>
                </div>
            )}

            <button onClick={() => navigate(-1)} className="mb-6 flex items-center gap-2 text-slate-500 font-bold hover:text-[#00478F] transition">
                <ArrowLeft size={20} /> Kembali
            </button>

            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                        <img 
                            src={(product.images && product.images.length > 0) ? product.images[0] : product.imageUrl} 
                            className="w-full aspect-square object-cover rounded-[2rem] mb-6 bg-slate-50 shadow-inner" 
                            alt={product.title}
                        />
                        <div className="space-y-1">
                            <span className="text-[10px] font-black bg-[#FF9500]/10 text-[#FF9500] px-3 py-1 rounded-full uppercase tracking-widest inline-block">
                                {product.category?.name || 'Produk'}
                            </span>
                            <h2 className="text-xl font-black text-slate-900 leading-tight">{product.title}</h2>
                        </div>
                        <div className="flex items-center justify-between mt-6 pt-6 border-t border-slate-50">
                            <p className="text-slate-400 font-bold text-xs uppercase tracking-widest">Total Bayar</p>
                            <p className="text-2xl font-black text-[#00478F]">Rp{product.price.toLocaleString('id-ID')}</p>
                        </div>
                    </div>
                </div>

                <div className="lg:col-span-7">
                    <form onSubmit={handleCheckout} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50">
                        
                        {/* METODE PENGIRIMAN */}
                        <h3 className="text-xl font-black text-slate-900 mb-4 flex items-center gap-3">
                            <Package className="text-blue-500" /> Metode Pengiriman
                        </h3>
                        <div className="flex flex-col sm:flex-row gap-4 mb-4">
                            <label className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all ${deliveryMethod === 'COD' ? 'border-[#00478F] bg-blue-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <input type="radio" name="delivery" checked={deliveryMethod === 'COD'} onChange={() => setDeliveryMethod('COD')} className="w-4 h-4 accent-[#00478F]" />
                                    <p className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-1"><MapPin size={16} className="text-[#FF9500]"/> COD (Ketemuan)</p>
                                </div>
                                <p className="text-xs text-slate-500 font-medium pl-7">Aman, cek fisik barang langsung bersama penjual di area kampus.</p>
                            </label>
                            <label className={`flex-1 p-5 rounded-2xl border-2 cursor-pointer transition-all ${deliveryMethod === 'Pengiriman' ? 'border-[#00478F] bg-blue-50/30' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                                <div className="flex items-center gap-3 mb-2">
                                    <input type="radio" name="delivery" checked={deliveryMethod === 'Pengiriman'} onChange={() => setDeliveryMethod('Pengiriman')} className="w-4 h-4 accent-[#00478F]" />
                                    <p className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-1"><Package size={16} className="text-blue-500"/> Ekspedisi (Kirim)</p>
                                </div>
                                <p className="text-xs text-slate-500 font-medium pl-7">Penjual akan mengirimkan barang via kurir (JNE/J&T/dll) ke alamat Anda.</p>
                            </label>
                        </div>

                        {/* FORM ALAMAT (Hanya tampil jika Ekspedisi dipilih) */}
                        {deliveryMethod === 'Pengiriman' && (
                            <div className="mb-10 p-5 bg-blue-50/50 rounded-2xl border border-blue-100 space-y-4 animate-in fade-in zoom-in duration-300">
                                <div className="flex items-center gap-2 mb-2">
                                    <MapPin size={16} className="text-blue-500"/>
                                    <h4 className="font-black text-slate-800 text-sm uppercase tracking-widest">Informasi Alamat</h4>
                                </div>
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Alamat Lengkap</label>
                                        <textarea placeholder="Nama Jalan, RT/RW, Kecamatan, Kota, Kode Pos" value={shippingAddress} onChange={(e) => setShippingAddress(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#00478F] outline-none" rows="2" required></textarea>
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Titik Patokan / Maps</label>
                                        <input type="text" placeholder="Warna rumah, patokan bangunan, atau link G-Maps" value={shippingLocationPoint} onChange={(e) => setShippingLocationPoint(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#00478F] outline-none" required />
                                    </div>
                                    <div>
                                        <label className="block text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 ml-1">Nomor Telepon (Aktif)</label>
                                        <input type="tel" placeholder="081234567890" value={shippingPhone} onChange={(e) => setShippingPhone(e.target.value)} className="w-full px-4 py-3 bg-white border border-slate-200 rounded-xl text-sm font-bold focus:border-[#00478F] outline-none" required />
                                    </div>
                                </div>
                                <div className="mt-4 p-3 bg-orange-50 border border-orange-100 rounded-xl flex items-start gap-3">
                                    <AlertCircle size={16} className="text-[#FF9500] shrink-0 mt-0.5" />
                                    <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                        <strong className="text-slate-800">Perhatian:</strong> Biaya ongkos kirim akan menyesuaikan dengan alamat Anda. <br/>(Sistem perhitungan ongkir otomatis segera hadir. Saat ini pembayaran ongkir dikoordinasikan langsung melalui fitur Chat dengan penjual).
                                    </p>
                                </div>
                            </div>
                        )}
                        {deliveryMethod === 'COD' && <div className="mb-10"></div>}

                        {/* METODE PEMBAYARAN */}
                        <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                            <CheckCircle className="text-green-500" /> Konfirmasi Pembayaran
                        </h3>

                        <div className="space-y-4 mb-10">
                            {paymentMethods.length === 0 ? (
                                <p className="text-slate-400 text-sm italic">Metode pembayaran belum tersedia.</p>
                            ) : (
                                paymentMethods.map((method) => {
                                    const val = `${method.bankName} - ${method.accountNumber} (${method.ownerName})`;
                                    const isSelected = selectedMethod === val;
                                    return (
                                        <div key={method._id}>
                                            <label className={`group flex flex-col p-5 rounded-3xl border-2 transition-all cursor-pointer ${isSelected ? 'border-[#00478F] bg-blue-50/20' : 'border-slate-100 bg-slate-50 hover:border-slate-300'}`}>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-4">
                                                        <input type="radio" name="pay" checked={isSelected} onChange={() => setSelectedMethod(val)} className="w-5 h-5 accent-[#00478F]" />
                                                        <div>
                                                            <p className="font-black text-slate-900">{method.bankName}</p>
                                                            <p className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">a.n {method.ownerName}</p>
                                                        </div>
                                                    </div>
                                                    <p className="font-mono font-black text-[#00478F]">{method.accountNumber}</p>
                                                </div>

                                                {isSelected && method.qrImageUrl && (
                                                    <div className="mt-6 pt-6 border-t border-blue-100 flex flex-col items-center animate-in zoom-in duration-300">
                                                        <div className="bg-white p-4 rounded-[2rem] shadow-xl border border-blue-100 relative group/qr">
                                                            <div className="absolute inset-0 bg-black/40 rounded-[2rem] opacity-0 group-hover/qr:opacity-100 flex items-center justify-center transition-all cursor-zoom-in" onClick={() => setZoomQR(method.qrImageUrl)}>
                                                                <div className="bg-white p-3 rounded-full text-slate-900 flex items-center gap-2 font-black text-[10px] uppercase shadow-lg">
                                                                    <Maximize2 size={16} /> Perbesar
                                                                </div>
                                                            </div>
                                                            <img src={method.qrImageUrl} alt="QRIS" className="w-56 h-56 object-contain rounded-xl" />
                                                        </div>
                                                        <div className="mt-4 flex items-center gap-2 text-[#00478F] bg-blue-50 px-4 py-2 rounded-full">
                                                            <Smartphone size={14} className="animate-bounce" />
                                                            <p className="text-[10px] font-black uppercase tracking-wider">Scan atau Klik untuk perbesar</p>
                                                        </div>
                                                    </div>
                                                )}
                                            </label>
                                        </div>
                                    );
                                })
                            )}
                        </div>

                        <div className="mb-10 p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                            <h3 className="text-xs font-black text-slate-900 mb-4 uppercase tracking-[0.2em] text-center">Upload Bukti Transfer</h3>
                            {previewProof ? (
                                <div className="relative rounded-2xl overflow-hidden border-4 border-white shadow-xl max-w-xs mx-auto">
                                    <img src={previewProof} className="w-full h-56 object-cover" alt="Preview" />
                                    <button 
                                        type="button" 
                                        onClick={() => {setProofImage(null); setPreviewProof(null);}}
                                        className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-red-500 text-white px-4 py-2 rounded-xl text-xs font-black shadow-lg hover:scale-105 transition"
                                    >
                                        Ganti Foto
                                    </button>
                                </div>
                            ) : (
                                <label className="flex flex-col items-center justify-center w-full h-44 border-2 border-dashed border-slate-200 bg-white rounded-2xl cursor-pointer hover:bg-blue-50 hover:border-[#00478F] transition-all group shadow-sm">
                                    <div className="w-12 h-12 bg-slate-50 rounded-2xl flex items-center justify-center mb-3 group-hover:bg-white group-hover:scale-110 transition-all">
                                        <ImageIcon className="text-slate-300 group-hover:text-[#00478F]" size={28} />
                                    </div>
                                    <p className="text-[11px] font-black text-slate-400 group-hover:text-[#00478F] uppercase tracking-wider">Klik untuk upload bukti bayar</p>
                                    <input type="file" className="hidden" accept="image/*" onChange={handleFileChange} />
                                </label>
                            )}
                        </div>

                        <button 
                            type="submit" 
                            disabled={submitting || paymentMethods.length === 0}
                            className="w-full bg-[#00478F] text-white py-5 rounded-2xl font-black text-sm uppercase tracking-[0.2em] shadow-xl shadow-blue-900/20 hover:bg-black hover:-translate-y-1 transition-all disabled:opacity-50"
                        >
                            {submitting ? 'Memproses Transaksi...' : 'Konfirmasi & Selesaikan'}
                        </button>
                        
                        <div className="mt-8 flex items-center justify-center gap-4 opacity-30">
                            <img src="https://upload.wikimedia.org/wikipedia/commons/a/a2/Logo_QRIS.svg" className="h-5" alt="QRIS" />
                            <div className="h-4 w-[1px] bg-slate-400"></div>
                            <p className="text-[10px] font-black uppercase tracking-widest text-slate-900">Protected by Escrow</p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}