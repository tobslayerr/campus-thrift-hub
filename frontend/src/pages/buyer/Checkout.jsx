import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function Checkout() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { user } = useAuthStore();
    
    const [product, setProduct] = useState(null);
    const [proofImage, setProofImage] = useState(null);
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');

    useEffect(() => {
        const fetchProduct = async () => {
            try {
                const response = await api.get(`/products/${id}`);
                const fetchedProduct = response.data.data;
                
                // 🛡️ PAGAR FRONTEND: Cek apakah ID penjual sama dengan ID user yang sedang login
                if (fetchedProduct.sellerId._id === user?.id) {
                    setErrorMsg('⚠️ Akses Ditolak: Anda tidak bisa melakukan checkout pada barang jualan Anda sendiri!');
                    setProduct(null);
                } else {
                    setProduct(fetchedProduct);
                }
            // eslint-disable-next-line no-unused-vars
            } catch (error) {
                setErrorMsg('Barang tidak ditemukan atau sudah terjual.');
            } finally {
                setLoading(false);
            }
        };
        fetchProduct();
    }, [id, user]);

    const handleCheckout = async (e) => {
        e.preventDefault();
        if (!proofImage) {
            setErrorMsg('Harap upload bukti transfer terlebih dahulu!');
            return;
        }

        setSubmitting(true);
        setErrorMsg('');

        const formData = new FormData();
        formData.append('productId', product._id);
        formData.append('proof', proofImage);

        try {
            await api.post('/transactions/checkout', formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            alert('Pembayaran berhasil dikirim! Menunggu verifikasi Admin.');
            navigate('/');
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Gagal memproses pembayaran.');
        } finally {
            setSubmitting(false);
        }
    };

    if (loading) return <div className="text-center mt-20 font-bold">Memuat rincian pembayaran...</div>;
    
    // Jika ada error (termasuk error karena mencoba beli barang sendiri), tampilkan pesan saja tanpa form
    if (!product) return (
        <div className="max-w-2xl mx-auto mt-20 p-8 bg-red-50 border border-red-200 rounded-2xl text-center">
            <span className="text-4xl block mb-4">🚫</span>
            <h2 className="text-xl font-bold text-red-700 mb-2">Checkout Dibatalkan</h2>
            <p className="text-red-600 font-medium">{errorMsg}</p>
            <button onClick={() => navigate('/')} className="mt-6 bg-red-600 text-white px-6 py-2 rounded-xl font-bold hover:bg-red-700 transition">
                Kembali ke Beranda
            </button>
        </div>
    );

    return (
        <div className="max-w-3xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Checkout Pembayaran Escrow</h1>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200 mb-6 flex gap-6">
                <img src={product.imageUrl} alt={product.title} className="w-32 h-32 object-cover rounded-xl border border-gray-100" />
                <div>
                    <span className="text-xs font-bold bg-gray-100 text-gray-600 px-2 py-1 rounded uppercase tracking-wider">{product.category}</span>
                    <h2 className="text-xl font-bold text-gray-900 mt-2">{product.title}</h2>
                    <p className="text-sm text-gray-500 mt-1">Penjual: {product.sellerId?.name}</p>
                    <p className="text-2xl font-extrabold text-brand-yellow mt-3">Rp {product.price.toLocaleString('id-ID')}</p>
                </div>
            </div>

            <form onSubmit={handleCheckout} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-200">
                <div className="bg-blue-50 border border-blue-200 p-5 rounded-xl mb-6 text-center">
                    <p className="text-xs text-blue-600 font-bold uppercase tracking-wider mb-2">Transfer ke Rekening Resmi Thrift Hub</p>
                    <p className="text-sm text-gray-700 font-medium mb-1">BANK BCA</p>
                    <p className="text-3xl font-black text-gray-900 tracking-widest">8291-1234-56</p>
                    <p className="text-xs text-gray-500 mt-2">a.n Admin Campus Thrift Hub</p>
                    <div className="mt-4 p-2 bg-white rounded border border-blue-100 text-sm font-bold">
                        Total: Rp {product.price.toLocaleString('id-ID')}
                    </div>
                </div>

                {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">{errorMsg}</div>}

                <div className="mb-6">
                    <label className="block text-sm font-bold text-gray-700 mb-2">Upload Bukti Transfer (JPG/PNG)</label>
                    <input 
                        type="file" 
                        accept="image/*" 
                        onChange={(e) => setProofImage(e.target.files[0])} 
                        className="w-full border-2 border-dashed border-gray-300 p-4 rounded-xl text-sm focus:outline-none focus:border-brand-yellow"
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting} 
                    className="w-full bg-brand-dark text-brand-yellow font-extrabold py-4 rounded-xl hover:bg-gray-800 transition disabled:opacity-50 shadow-lg"
                >
                    {submitting ? 'Mengirim Bukti...' : 'Saya Sudah Transfer'}
                </button>
            </form>
        </div>
    );
}