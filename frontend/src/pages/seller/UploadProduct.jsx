import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../api/axios';

export default function UploadProduct() {
    const navigate = useNavigate();
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [formData, setFormData] = useState({ title: '', price: '', category: 'Buku', description: '' });
    const [image, setImage] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // Menggunakan FormData karena kita mengirim File Gambar (Bukan JSON biasa)
        const data = new FormData();
        data.append('title', formData.title);
        data.append('price', formData.price);
        data.append('category', formData.category);
        data.append('description', formData.description);
        data.append('image', image);

        try {
            await api.post('/products', data, {
                headers: { 'Content-Type': 'multipart/form-data' } // Penting untuk Multer
            });
            alert('Produk berhasil diupload!');
            navigate('/'); // Kembali ke Home
        } catch (error) {
            // Menangkap pesan dari Anti-Fraud Middleware
            setErrorMsg(error.response?.data?.message || 'Gagal mengupload produk.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="max-w-2xl mx-auto p-4 md:p-8">
            <h1 className="text-2xl font-extrabold text-gray-900 mb-6">Jual Barang Bekasmu</h1>
            
            {errorMsg && <div className="bg-red-50 text-red-700 p-4 rounded-xl font-medium mb-6 border border-red-200">{errorMsg}</div>}

            <form onSubmit={handleSubmit} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 space-y-4">
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Nama Barang</label>
                    <input type="text" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} className="w-full border p-2 rounded-lg" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Harga (Rp)</label>
                        <input type="number" required value={formData.price} onChange={e => setFormData({...formData, price: e.target.value})} className="w-full border p-2 rounded-lg" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Kategori</label>
                        <select value={formData.category} onChange={e => setFormData({...formData, category: e.target.value})} className="w-full border p-2 rounded-lg bg-white">
                            <option value="Buku">Buku</option>
                            <option value="Elektronik">Elektronik</option>
                            <option value="Fashion">Fashion</option>
                            <option value="Lainnya">Lainnya</option>
                        </select>
                    </div>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Deskripsi (Hati-hati: Dilarang mencantumkan no WA/Rekening)</label>
                    <textarea rows="4" required value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} className="w-full border p-2 rounded-lg"></textarea>
                </div>
                <div>
                    <label className="block text-sm font-bold text-gray-700 mb-1">Foto Produk</label>
                    <input type="file" accept="image/*" required onChange={e => setImage(e.target.files[0])} className="w-full border p-2 rounded-lg" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-brand-yellow text-brand-dark font-extrabold py-3 rounded-xl hover:bg-yellow-500 transition disabled:opacity-50 mt-4">
                    {loading ? 'Mengunggah ke Cloudinary...' : 'Upload Produk'}
                </button>
            </form>
        </div>
    );
}