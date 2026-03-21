/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { ImagePlus, Package, Tag, AlignLeft, DollarSign, ArrowLeft, X, Star, Layers } from 'lucide-react';
import useAuthStore from '../../store/authStore';

export default function UploadProduct() {
    const { id } = useParams(); 
    const isEditMode = !!id; 
    const navigate = useNavigate();
    const { user } = useAuthStore();

    const [categories, setCategories] = useState([]);
    const [uploading, setUploading] = useState(false);
    
    // STATE BARU: Array Gambar & Stok
    const [imageFiles, setImageFiles] = useState([]); 
    
    const [formData, setFormData] = useState({
        title: '',
        category: '',
        price: '',
        description: '',
        stock: 1 // Default stok 1
    });

    useEffect(() => {
        const fetchCategories = async () => {
            try {
                const res = await api.get('/categories');
                setCategories(res.data.data);
            } catch (error) {
                setCategories([{ name: 'Pakaian' }, { name: 'Elektronik' }]); // Fallback
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
                        stock: product.stock || 1
                    });
                    
                    // Memasukkan array gambar dari database ke state
                    if (product.images && product.images.length > 0) {
                        const loadedImages = product.images.map(url => ({ existingUrl: url, previewUrl: url }));
                        setImageFiles(loadedImages);
                    } else if (product.imageUrl) {
                        // Fallback jika barang lama hanya punya 1 gambar
                        setImageFiles([{ existingUrl: product.imageUrl, previewUrl: product.imageUrl }]);
                    }
                    toast.dismiss(toastId);
                } catch (error) {
                    toast.error("Gagal memuat data produk", { id: toastId });
                    navigate(-1);
                }
            };
            fetchProduct();
        }
    }, [id, isEditMode, navigate]);

    // HANDLER GAMBAR: Tambah, Hapus, Jadikan Utama (Reorder)
    const handleAddImages = (e) => {
        const files = Array.from(e.target.files);
        if (imageFiles.length + files.length > 5) {
            return toast.error("Maksimal 5 gambar diperbolehkan!");
        }
        
        const newImages = files.map(file => ({
            file,
            previewUrl: URL.createObjectURL(file)
        }));
        
        setImageFiles([...imageFiles, ...newImages]);
    };

    const handleRemoveImage = (indexToRemove) => {
        setImageFiles(imageFiles.filter((_, index) => index !== indexToRemove));
    };

    const handleMakePrimary = (indexToMove) => {
        if (indexToMove === 0) return;
        const newImages = [...imageFiles];
        const [movedImage] = newImages.splice(indexToMove, 1);
        newImages.unshift(movedImage); // Pindahkan ke index 0
        setImageFiles(newImages);
    };

   const handleSubmit = async (e) => {
        e.preventDefault();
        
        // 1. Mencegah fungsi berjalan berkali-kali jika tombol di-spam click
        if (uploading) return; 
        
        if (imageFiles.length === 0) {
            // Beri ID statis agar toast error tidak bertumpuk jika di-spam
            return toast.error("Minimal 1 foto produk wajib diunggah!", { id: 'upload-error' });
        }

        setUploading(true);
        
        // 2. Beri ID statis 'submit-toast' agar toast loading hanya muncul 1 kali
        toast.loading(isEditMode ? 'Menyimpan perubahan...' : 'Mengunggah produk...', { id: 'submit-toast' });

        const submitData = new FormData();
        submitData.append('title', formData.title);
        submitData.append('category', formData.category);
        submitData.append('price', formData.price);
        submitData.append('description', formData.description);
        submitData.append('stock', formData.stock);
        
        // LOOP GAMBAR: Kunci utamanya ada di sini (menggunakan nama 'images')
        imageFiles.forEach((img) => {
            if (img.file) {
                submitData.append('images', img.file); // Mengirim file baru ke multer
            } else if (img.existingUrl) {
                submitData.append('existingImages', img.existingUrl); // String url lama dipertahankan saat edit
            }
        });

        // 3. SOLUSI UTAMA ERROR: Paksa Axios menggunakan format Multipart
        // Ini akan mengesampingkan default 'application/json' di axios.js
        const config = {
            headers: {
                'Content-Type': 'multipart/form-data'
            }
        };

        try {
            if (isEditMode) {
                // Jangan lupa masukkan parameter config di parameter ketiga
                await api.put(`/products/${id}`, submitData, config);
                toast.success('Barang berhasil diperbarui!', { id: 'submit-toast' }); // Menimpa toast loading
            } else {
                // Jangan lupa masukkan parameter config di parameter ketiga
                await api.post('/products', submitData, config);
                toast.success('Barang berhasil diunggah!', { id: 'submit-toast' }); // Menimpa toast loading
            }
            
            setTimeout(() => {
                if (isEditMode) {
                    window.location.href = `/product/${id}`; // Hard refresh untuk membersihkan cache
                } else {
                    navigate(`/seller/${user?._id || user?.id}`);
                }
            }, 1500);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan barang', { id: 'submit-toast' });
            setUploading(false); // Reset statenya jika gagal agar bisa di klik lagi
        }
    };

    return (
        <div className="max-w-5xl mx-auto p-4 md:p-8 pb-32">
            <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-slate-400 hover:text-[#00478F] font-bold mb-8 transition-colors">
                <ArrowLeft size={20} /> Kembali
            </button>

            <h1 className="text-3xl md:text-4xl font-black text-slate-900 mb-2 tracking-tight flex items-center gap-3">
                <Package className="text-[#00478F]" size={36} strokeWidth={2.5} /> 
                {isEditMode ? 'Edit Data Barang' : 'Jual Barang Baru'}
            </h1>
            <p className="text-slate-500 font-medium mb-10">Gambar di urutan pertama otomatis akan menjadi Thumbnail / Sampul.</p>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-10">
                
                {/* KIRI: AREA UPLOAD & MANAJEMEN GAMBAR */}
                <div className="lg:col-span-5 space-y-4">
                    <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm relative h-fit">
                        {/* Preview Gambar Utama (Index 0) */}
                        <div className="w-full aspect-square bg-slate-100 rounded-2xl overflow-hidden mb-4 relative flex items-center justify-center border-2 border-dashed border-slate-300">
                            {imageFiles.length > 0 ? (
                                <img src={imageFiles[0].previewUrl} alt="Main" className="w-full h-full object-contain bg-slate-900" />
                            ) : (
                                <div className="text-slate-400 text-center">
                                    <ImagePlus size={48} className="mx-auto mb-2 opacity-50" />
                                    <p className="font-bold text-sm">Belum ada gambar</p>
                                </div>
                            )}
                            {imageFiles.length > 0 && (
                                <span className="absolute top-4 left-4 bg-[#FF9500] text-white text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">
                                    Foto Utama (Sampul)
                                </span>
                            )}
                        </div>

                        {/* List Thumbnail (Grid) */}
                        <div className="grid grid-cols-3 gap-3">
                            {imageFiles.map((img, index) => (
                                <div key={index} className="relative aspect-square rounded-xl overflow-hidden group border-2 border-slate-200 hover:border-[#00478F] transition-all bg-slate-900">
                                    <img src={img.previewUrl} alt={`Thumb ${index}`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100" />
                                    
                                    {/* Overlay Action Buttons */}
                                    <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                                        {index !== 0 && (
                                            <button type="button" onClick={() => handleMakePrimary(index)} className="bg-white text-slate-900 text-[9px] font-black px-2 py-1 rounded shadow hover:bg-[#FF9500] hover:text-white transition-colors">
                                                Jadikan Utama
                                            </button>
                                        )}
                                        <button type="button" onClick={() => handleRemoveImage(index)} className="bg-red-500 text-white p-1.5 rounded-full hover:bg-red-600 transition-colors">
                                            <X size={14} />
                                        </button>
                                    </div>
                                    {index === 0 && <div className="absolute bottom-1 right-1 bg-[#FF9500] p-1 rounded-full text-white"><Star size={10} fill="white" /></div>}
                                </div>
                            ))}

                            {/* Tombol Tambah Gambar */}
                            {imageFiles.length < 5 && (
                                <label className="aspect-square border-2 border-dashed border-slate-300 rounded-xl flex flex-col items-center justify-center cursor-pointer hover:border-[#FF9500] hover:bg-orange-50/50 transition-all text-slate-400 hover:text-[#FF9500]">
                                    <ImagePlus size={24} className="mb-1" />
                                    <span className="text-[10px] font-bold">Tambah ({5 - imageFiles.length})</span>
                                    <input type="file" multiple accept="image/*" onChange={handleAddImages} className="hidden" />
                                </label>
                            )}
                        </div>
                    </div>
                </div>

                {/* KANAN: FORM DATA */}
                <div className="lg:col-span-7 space-y-6 bg-white p-8 rounded-[2rem] border border-slate-100 shadow-sm">
                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <Tag size={14} /> Nama Barang
                        </label>
                        <input type="text" required maxLength="50" value={formData.title} onChange={(e) => setFormData({...formData, title: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 outline-none" placeholder="Contoh: Sepatu Converse Original" />
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div className="md:col-span-1">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Package size={14} /> Kategori
                            </label>
                            <select required value={formData.category} onChange={(e) => setFormData({...formData, category: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-bold text-slate-800 outline-none">
                                <option value="" disabled>Pilih Kategori</option>
                                {categories.map((cat, idx) => (
                                    <option key={idx} value={cat.name}>{cat.name}</option>
                                ))}
                            </select>
                        </div>
                        <div className="md:col-span-1">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <Layers size={14} /> Stok
                            </label>
                            <input type="number" required min="1" value={formData.stock} onChange={(e) => setFormData({...formData, stock: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-black text-slate-800 text-center outline-none" />
                        </div>
                        <div className="md:col-span-1">
                            <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                                <DollarSign size={14} /> Harga (Rp)
                            </label>
                            <input type="number" required min="1000" value={formData.price} onChange={(e) => setFormData({...formData, price: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-black text-[#00478F] outline-none" />
                        </div>
                    </div>

                    <div>
                        <label className="flex items-center gap-2 text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
                            <AlignLeft size={14} /> Deskripsi Kondisi
                        </label>
                        <textarea required rows="5" value={formData.description} onChange={(e) => setFormData({...formData, description: e.target.value})} className="w-full px-5 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#FF9500] focus:ring-4 focus:ring-orange-500/10 transition-all font-medium text-slate-600 resize-none leading-relaxed outline-none" placeholder="Ceritakan detail barang..."></textarea>
                    </div>

                    <button type="submit" disabled={uploading} className="w-full bg-[#00478F] text-white font-black py-5 rounded-2xl hover:bg-[#FF9500] transition-all uppercase tracking-widest text-sm disabled:opacity-50">
                        {uploading ? 'Memproses...' : (isEditMode ? 'Simpan Perubahan' : 'Terbitkan Barang')}
                    </button>
                </div>
            </form>
        </div>
    );
}