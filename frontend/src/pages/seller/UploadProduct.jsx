/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ImagePlus, Package, Tag, AlignLeft, DollarSign, ArrowLeft } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function UploadProduct() {
    const { id } = useParams(); 
    const isEditMode = !!id; 
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    const [preview, setPreview] = useState('');
    
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        price: '',
        description: '',
        imageFile: null
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data.data);
            } catch (error) {
                setCategories([{ name: 'Pakaian' }, { name: 'Elektronik' }]);
            }
        };
        fetchCategories();
    }, []);

    useEffect(() => {
        if (isEditMode) {
            const fetchProduct = async () => {
                const toastId = toast.loading('Memuat data produk...');
                try {
                    const res = await api.get(`/products/${id}`);
                    const product = res.data.data;
                    setFormData({
                        title: product.title,
                        category: product.category,
                        price: product.price,
                        description: product.description,
                        imageFile: null
                    });
                    setPreview(product.imageUrl);
                    toast.dismiss(toastId);
                } catch (error) {
                    toast.error("Gagal memuat data produk", { id: toastId });
                    navigate(-1);
                }
            };
            fetchProduct();
        }
    }, [id, isEditMode, navigate]);

    const handleImageChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, imageFile: file });
        setPreview(URL.createObjectURL(file));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!isEditMode && !formData.imageFile) {
            return toast.error("Foto produk wajib diunggah!");
        }

        setUploading(true);
        const toastId = toast.loading(isEditMode ? 'Menyimpan perubahan...' : 'Mengunggah produk...');

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('category', formData.category);
        submitData.append('price', formData.price);
        submitData.append('description', formData.description);
        
        if (formData.imageFile) {
            submitData.append('image', formData.imageFile);
        }

        try {
            if (isEditMode) {
                await api.put(`/products/${id}`, submitData);
                toast.success('Barang berhasil diperbarui!', { id: toastId });
            } else {
                await api.post('/products', submitData);
                toast.success('Barang berhasil diunggah!', { id: toastId });
            }
            
            // PERBAIKAN REDIRECT DI SINI
            setTimeout(() => {
                if (isEditMode) {
                    navigate(`/product/${id}`); // Jika edit, kembali ke detail barang
                } else {
                    navigate(`/seller/${user?._id || user?.id}`); // Jika upload baru, pergi ke lapak
                }
            }, 1500);
            
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan barang', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#00478F] font-bold mb-8 transition-colors">
                <ArrowLeft size={20} /> Kembali
            </button>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                <Package className="text-[#00478F]" size={36} strokeWidth={2.5} /> 
                {isEditMode ? 'Edit Barang Jualan' : 'Jual Barang Baru'}
            </h1>
            <p className="text-slate-500 font-medium mb-10">
                {isEditMode ? 'Perbarui informasi barangmu agar lebih menarik pembeli.' : 'Pastikan foto jelas dan deskripsi jujur agar cepat laku!'}
            </p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* KIRI: UPLOAD FOTO */}
                <div className="lg:col-span-5">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative overflow-hidden h-full flex flex-col items-center justify-center min-h-[400px]">
                        {preview ? (
                            <div className="relative w-full h-full group">
                                <img src={preview} alt="Preview" className="w-full h-full object-cover rounded-2xl" />
                                <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition-opacity rounded-2xl flex items-center justify-center">
                                    <label className="bg-white text-slate-900 font-black px-6 py-3 rounded-full cursor-pointer hover:bg-[#FF9500] hover:text-white transition-colors shadow-xl">
                                        Ganti Foto
                                        <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                                    </label>
                                </div>
                            </div>
                        ) : (
                            <label className="w-full h-full border-2 border-dashed border-slate-300 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9500] hover:bg-orange-50/50 transition-all group">
                                <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center text-slate-400 group-hover:text-[#FF9500] group-hover:scale-110 transition-all mb-4">
                                    <ImagePlus size={36} />
                                </div>
                                <span className="font-black text-slate-700 text-lg">Unggah Foto</span>
                                <span className="text-xs text-slate-400 font-medium mt-1">Maksimal 5MB (JPG/PNG)</span>
                                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
                            </label>
                        )}
                    </div>
                </div>

                {/* KANAN: FORM DATA */}
                <div className="lg:col-span-7 space-y-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <Tag size={14} /> Nama Barang
                        </label>
                        <input 
                            type="text" 
                            required 
                            maxLength="50"
                            value={formData.title} 
                            onChange={(e) => setFormData({...formData, title: e.target.value})} 
                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 outline-none" 
                            placeholder="Contoh: Hoodie H&M Size L" 
                        />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Package size={14} /> Kategori
                            </label>
                            <select 
                                required 
                                value={formData.category} 
                                onChange={(e) => setFormData({...formData, category: e.target.value})} 
                                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 outline-none cursor-pointer appearance-none"
                            >
                                <option value="" disabled>Pilih Kategori</option>
                                {categories.map((cat, idx) => (
                                    <option key={idx} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <DollarSign size={14} /> Harga (Rp)
                            </label>
                            <input 
                                type="number" 
                                required 
                                min="1000"
                                value={formData.price} 
                                onChange={(e) => setFormData({...formData, price: e.target.value})} 
                                className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-black text-[#00478F] outline-none" 
                                placeholder="150000" 
                            />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <AlignLeft size={14} /> Deskripsi Kondisi
                        </label>
                        <textarea 
                            required 
                            rows="5"
                            value={formData.description} 
                            onChange={(e) => setFormData({...formData, description: e.target.value})} 
                            className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-slate-600 outline-none resize-none leading-relaxed" 
                            placeholder="Ceritakan detail kondisi barang, ukuran, minus (jika ada), atau alasan dijual..." 
                        />
                    </div>

                    <button 
                        type="submit" 
                        disabled={uploading} 
                        className="w-full bg-[#00478F] text-white font-black py-5 rounded-2xl hover:bg-[#FF9500] hover:shadow-xl hover:-translate-y-1 active:scale-95 transition-all uppercase tracking-widest text-sm disabled:opacity-50 disabled:cursor-not-allowed mt-4"
                    >
                        {uploading ? 'Memproses...' : (isEditMode ? 'Simpan Perubahan' : 'Terbitkan Barang')}
                    </button>
                </div>
            </form>
        </div>
    );
}