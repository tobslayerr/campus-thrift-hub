import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast'; 

export default function MyProfile() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();

    const [uploading, setUploading] = useState(false);
    
    // State Preview Foto
    const [photoPreview, setPhotoPreview] = useState('');
    const [qrisPreview, setQrisPreview] = useState('');
    
    // State Form Data
    const [formData, setFormData] = useState({
        name: '',
        domisili: '',
        campus: '',
        bankName: '',
        bankAccount: '',
        photoFile: null,
        qrisFile: null
    });

    // 🔄 Sinkronisasi data dari Store ke Form (Otomatis Terisi)
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                domisili: user.domisili || '',
                campus: user.campus || '',
                bankName: user.bankName || '',
                bankAccount: user.bankAccount || '',
                photoFile: null,
                qrisFile: null
            });
            // Pastikan URL foto lama langsung masuk ke preview
            setPhotoPreview(user.profilePicture || '');
            setQrisPreview(user.qrisUrl || '');
        }
    }, [user]);

    // 🧠 LOGIKA PINTAR: Cek apakah ada perubahan data
    const isChanged = 
        formData.name !== (user?.name || '') ||
        formData.domisili !== (user?.domisili || '') ||
        formData.campus !== (user?.campus || '') ||
        formData.bankName !== (user?.bankName || '') ||
        formData.bankAccount !== (user?.bankAccount || '') ||
        formData.photoFile !== null ||
        formData.qrisFile !== null;

    // Handler Foto Profil
    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, photoFile: file });
        setPhotoPreview(URL.createObjectURL(file)); // Langsung ganti preview
    };

    // Handler QRIS
    const handleQrisChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, qrisFile: file });
        setQrisPreview(URL.createObjectURL(file)); // Langsung ganti preview
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!isChanged) return;

        setUploading(true);
        // Memulai Toast Loading
        const toastId = toast.loading('Menyimpan perubahan profil...');

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('domisili', formData.domisili);
        submitData.append('campus', formData.campus);
        submitData.append('bankName', formData.bankName);
        submitData.append('bankAccount', formData.bankAccount);
        
        // Append file hanya jika user mengunggah file baru
        if (formData.photoFile) submitData.append('avatar', formData.photoFile);
        if (formData.qrisFile) submitData.append('qris', formData.qrisFile);

        try {
            // PERBAIKAN KRUSIAL: 
            // Jangan memasang { headers: { 'Content-Type': 'multipart/form-data' } }
            // Biarkan Axios otomatis membuatnya bersama dengan kode Boundary
            const response = await api.put('/users/profile', submitData);
            
            // Pagar Keamanan: Pastikan data dari backend benar-benar ada
            if (!response || !response.data) throw new Error("Respons dari server tidak valid");
            
            const updatedUser = response.data.data;
            if (!updatedUser) throw new Error("Gagal mengambil data user terbaru");
            
            // Update global state & localStorage agar tidak hilang saat direfresh
            setUser(updatedUser); 
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            // Toast Sukses menggantikan Toast Loading
            toast.success('Profil & Data Rekening berhasil diperbarui!', { id: toastId });
            
            // Redirect setelah sukses
            setTimeout(() => {
                navigate(`/seller/${updatedUser._id || updatedUser.id}`);
            }, 1500);

        } catch (error) {
            // ERROR TRACKER di Console (sangat berguna jika masih error)
            console.error("❌ ERROR SAAT UPDATE PROFIL:", error);

            // Logika pintar untuk menangkap pesan error yang paling akurat
            let errorMsg = 'Terjadi kesalahan sistem yang tidak diketahui.';
            if (error.response && error.response.data && error.response.data.message) {
                errorMsg = error.response.data.message; // Error murni dari backend
            } else if (error.message) {
                errorMsg = error.message; // Error dari frontend (Network/Type error)
            }

            // Toast Error menggantikan Toast Loading
            toast.error(`Gagal: ${errorMsg}`, { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    if (!user) return (
        <div className="flex justify-center items-center min-h-[50vh]">
            <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-brand-yellow"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
            <h1 className="text-3xl font-black text-gray-900 mb-8">Pengaturan Profil</h1>

            <div className="space-y-8">
                <form onSubmit={handleSaveProfile} className="space-y-8">
                    
                    {/* --- BAGIAN 1: INFORMASI PUBLIK --- */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100 relative overflow-hidden">
                        <div className="absolute top-0 left-0 w-full h-1 bg-brand-yellow"></div>
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-yellow rounded-full"></span> Informasi Publik
                        </h2>

                        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-100 mb-8">
                            <div className="relative shrink-0">
                                <img 
                                    src={photoPreview || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=random&size=150`} 
                                    alt="Preview" 
                                    className="w-32 h-32 rounded-full object-cover border-4 border-brand-yellow/20 shadow-xl bg-gray-50" 
                                />
                                <label className="absolute bottom-0 right-0 bg-brand-dark text-brand-yellow p-2.5 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-lg">
                                    <span>📷</span>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-black text-gray-900">Foto Profil</h3>
                                <p className="text-sm text-gray-500 mt-1 font-medium">Gunakan foto asli agar pembeli percaya saat bertransaksi.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nama Lengkap</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 transition font-bold text-gray-800 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Asal Kampus</label>
                                <input type="text" required value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 transition font-bold text-gray-800 outline-none" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Domisili (COD)</label>
                                <input type="text" required value={formData.domisili} onChange={(e) => setFormData({...formData, domisili: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border border-transparent rounded-xl focus:bg-white focus:border-brand-yellow focus:ring-4 focus:ring-brand-yellow/10 transition font-bold text-gray-800 outline-none" />
                            </div>
                        </div>
                    </div>

                    {/* --- BAGIAN 2: DATA PENCAIRAN DANA (PRIVAT) --- */}
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white relative overflow-hidden">
                        {/* Aksen Background */}
                        <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/5 rounded-full blur-2xl"></div>
                        
                        <h2 className="text-xs font-black text-slate-400 uppercase tracking-[0.2em] mb-2 flex items-center gap-2 relative z-10">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Data Rekening (Privat)
                        </h2>
                        <p className="text-xs text-slate-500 mb-8 font-medium relative z-10">Data ini hanya bisa dilihat oleh Anda dan Admin untuk keperluan transfer hasil pencairan Escrow.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 relative z-10">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nama Bank / E-Wallet</label>
                                    <input type="text" placeholder="Contoh: BCA / DANA / OVO" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-brand-yellow focus:bg-slate-800 transition font-bold text-white outline-none placeholder:text-slate-600" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-400 uppercase mb-2">Nomor Rekening / No. HP</label>
                                    <input type="text" placeholder="Masukkan nomor akun Anda" value={formData.bankAccount} onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} className="w-full px-4 py-3 bg-slate-800/50 border border-slate-700 rounded-xl focus:border-brand-yellow focus:bg-slate-800 transition font-bold text-white outline-none placeholder:text-slate-600" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-6 bg-slate-800/30 hover:border-slate-500 transition-colors">
                                <p className="text-[10px] font-black text-slate-400 uppercase mb-4">Upload QRIS (Opsional)</p>
                                {qrisPreview ? (
                                    <div className="relative group">
                                        <img src={qrisPreview} alt="QRIS" className="w-32 h-32 object-contain rounded-xl shadow-lg bg-white p-2" />
                                        <label className="absolute -top-3 -right-3 bg-red-500 text-white p-2 rounded-full cursor-pointer shadow-lg hover:bg-red-600 hover:scale-110 transition-transform">
                                            <span className="text-xs font-bold">Ganti</span>
                                            <input type="file" accept="image/*" onChange={handleQrisChange} className="hidden" />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-3 cursor-pointer text-slate-500 hover:text-brand-yellow transition-colors">
                                        <div className="w-12 h-12 bg-slate-800 rounded-full flex items-center justify-center text-xl">🖼️</div>
                                        <span className="text-[10px] font-black uppercase tracking-wider">Pilih Foto QRIS</span>
                                        <input type="file" accept="image/*" onChange={handleQrisChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tombol Simpan */}
                    <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6 pt-4">
                        <button type="button" onClick={() => navigate(-1)} className="text-slate-500 font-bold hover:text-brand-dark transition-colors">
                            ← Batal & Kembali
                        </button>
                        <button 
                            type="submit" 
                            disabled={uploading || !isChanged}
                            className={`w-full md:w-auto font-black px-12 py-4 rounded-2xl transition-all shadow-xl uppercase tracking-widest text-sm
                                ${uploading || !isChanged 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-brand-dark text-brand-yellow hover:bg-black hover:-translate-y-1 shadow-brand-dark/20 active:scale-95'
                                }`}
                        >
                            {uploading ? 'Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}