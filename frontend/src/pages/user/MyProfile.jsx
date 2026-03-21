import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';

export default function MyProfile() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();

    const [uploading, setUploading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });
    
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

    // 🔄 Sinkronisasi data dari Store ke Form
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
            setPhotoPreview(user.profilePicture || '');
            setQrisPreview(user.qrisUrl || '');
        }
    }, [user]);

    // 🧠 LOGIKA PINTAR: Cek perubahan data (Termasuk rekening & QRIS)
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
        setPhotoPreview(URL.createObjectURL(file));
    };

    // Handler QRIS
    const handleQrisChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, qrisFile: file });
        setQrisPreview(URL.createObjectURL(file));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!isChanged) return;

        setUploading(true);
        setMessage({ type: '', text: '' });

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('domisili', formData.domisili);
        submitData.append('campus', formData.campus);
        submitData.append('bankName', formData.bankName);
        submitData.append('bankAccount', formData.bankAccount);
        
        if (formData.photoFile) submitData.append('avatar', formData.photoFile);
        if (formData.qrisFile) submitData.append('qris', formData.qrisFile);

        try {
            const response = await api.put('/users/profile', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const updatedUser = response.data.data;
            setUser(updatedUser); 
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            setMessage({ type: 'success', text: 'Profil & Data Rekening berhasil diperbarui!' });
            
            // GUNAKAN updatedUser agar ID-nya akurat
            setTimeout(() => {
                navigate(`/seller/${updatedUser._id || updatedUser.id}`);
            }, 1500);

        } catch (error) {
            const errorMsg = error.response?.data?.message || 'Gagal update profil';
            setMessage({ type: 'error', text: errorMsg });
        } finally {
            setUploading(false);
        }
    };

    if (!user) return <div className="text-center mt-20 font-bold italic">Memuat data...</div>;

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-20">
            <h1 className="text-3xl font-black text-gray-900 mb-8">Pengaturan Profil</h1>

            <div className="space-y-8">
                {message.text && (
                    <div className={`p-4 rounded-xl font-bold text-sm border ${message.type === 'success' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>
                        {message.text}
                    </div>
                )}

                <form onSubmit={handleSaveProfile} className="space-y-8">
                    
                    {/* --- BAGIAN 1: INFORMASI PUBLIK --- */}
                    <div className="bg-white p-8 rounded-3xl shadow-sm border border-gray-100">
                        <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                            <span className="w-2 h-2 bg-brand-yellow rounded-full"></span> Informasi Publik
                        </h2>

                        <div className="flex flex-col md:flex-row items-center gap-8 pb-8 border-b border-gray-100 mb-8">
                            <div className="relative shrink-0">
                                <img 
    src={photoPreview || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=random&size=150`} 
    alt="Preview" 
    className="w-32 h-32 rounded-full object-cover border-4 border-brand-yellow/20 shadow-xl bg-gray-100" 
/>
                                <label className="absolute bottom-0 right-0 bg-brand-dark text-brand-yellow p-2.5 rounded-full cursor-pointer hover:bg-black transition shadow-lg">
                                    <span>📷</span>
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-bold text-gray-900">Foto Profil</h3>
                                <p className="text-sm text-gray-500 mt-1 italic">Gunakan foto asli agar pembeli percaya saat COD.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2">
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Nama Lengkap</label>
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-yellow transition font-semibold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Asal Kampus</label>
                                <input type="text" required value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-yellow transition font-semibold" />
                            </div>
                            <div>
                                <label className="block text-[10px] font-black text-gray-400 uppercase mb-2">Domisili (COD)</label>
                                <input type="text" required value={formData.domisili} onChange={(e) => setFormData({...formData, domisili: e.target.value})} className="w-full px-4 py-3 bg-gray-50 border-none rounded-xl focus:ring-2 focus:ring-brand-yellow transition font-semibold" />
                            </div>
                        </div>
                    </div>

                    {/* --- BAGIAN 2: DATA PENCAIRAN DANA (PRIVAT) --- */}
                    <div className="bg-slate-900 p-8 rounded-3xl shadow-xl text-white">
                        <h2 className="text-xs font-black text-slate-500 uppercase tracking-[0.2em] mb-2 flex items-center gap-2">
                            <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></span> Data Pencairan Dana (Privat)
                        </h2>
                        <p className="text-[10px] text-slate-400 mb-8 italic">Data ini hanya bisa dilihat oleh Anda dan Admin untuk keperluan transfer hasil jualan.</p>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Nama Bank / E-Wallet</label>
                                    <input type="text" placeholder="Contoh: BCA / DANA / OVO" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-yellow transition font-bold" />
                                </div>
                                <div>
                                    <label className="block text-[10px] font-black text-slate-500 uppercase mb-2">Nomor Rekening / No. HP</label>
                                    <input type="text" placeholder="Masukkan nomor akun Anda" value={formData.bankAccount} onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} className="w-full px-4 py-3 bg-slate-800 border-none rounded-xl focus:ring-2 focus:ring-brand-yellow transition font-bold" />
                                </div>
                            </div>

                            <div className="flex flex-col items-center justify-center border-2 border-dashed border-slate-700 rounded-2xl p-4 bg-slate-800/50">
                                <p className="text-[10px] font-black text-slate-500 uppercase mb-4">Upload QRIS (Opsional)</p>
                                {qrisPreview ? (
                                    <div className="relative group">
                                        <img src={qrisPreview} alt="QRIS" className="w-32 h-32 object-contain rounded-lg shadow-lg bg-white p-2" />
                                        <label className="absolute -top-2 -right-2 bg-red-500 p-1.5 rounded-full cursor-pointer shadow-lg hover:bg-red-600">
                                            <span className="text-xs">🔄</span>
                                            <input type="file" accept="image/*" onChange={handleQrisChange} className="hidden" />
                                        </label>
                                    </div>
                                ) : (
                                    <label className="flex flex-col items-center gap-2 cursor-pointer hover:text-brand-yellow transition">
                                        <span className="text-3xl">🖼️</span>
                                        <span className="text-[10px] font-bold">Pilih Foto QRIS</span>
                                        <input type="file" accept="image/*" onChange={handleQrisChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Tombol Simpan */}
                    <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6">
                        <button type="button" onClick={() => navigate(-1)} className="text-gray-400 font-bold hover:text-black transition">
                            ← Kembali ke Profil
                        </button>
                        <button 
                            type="submit" 
                            disabled={uploading || !isChanged}
                            className="w-full md:w-auto bg-brand-dark text-brand-yellow font-black px-12 py-5 rounded-2xl hover:bg-black transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-2xl shadow-brand-yellow/10 uppercase tracking-widest"
                        >
                            {uploading ? 'Sedang Menyimpan...' : 'Simpan Perubahan'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}