import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
    User, MapPin, School, CreditCard, QrCode, 
    ImagePlus, Save, ArrowLeft, Trash2, CheckCircle2 
} from 'lucide-react';
import useAuthStore from '../../store/authStore';
import api from '../../api/axios';
import toast from 'react-hot-toast';

export default function MyProfile() {
    const { user, setUser } = useAuthStore();
    const navigate = useNavigate();

    const [uploading, setUploading] = useState(false);
    const [paymentMethod, setPaymentMethod] = useState('bank'); // 'bank' atau 'qris'
    
    // State Preview
    const [photoPreview, setPhotoPreview] = useState('');
    const [qrisPreview, setQrisPreview] = useState('');
    
    // State Form Data
    const [formData, setFormData] = useState({
        name: '',
        domisili: '',
        campus: '',
        bankName: '',
        bankAccount: '',
        bankAccountName: '', // Field baru
        photoFile: null,
        qrisFile: null
    });

    // 🔄 Sinkronisasi data awal
    useEffect(() => {
        if (user) {
            setFormData({
                name: user.name || '',
                domisili: user.domisili || '',
                campus: user.campus || '',
                bankName: user.bankName || '',
                bankAccount: user.bankAccount || '',
                bankAccountName: user.bankAccountName || '',
                photoFile: null,
                qrisFile: null
            });
            setPhotoPreview(user.profilePicture || '');
            setQrisPreview(user.qrisUrl || '');
            
            // Tentukan tab aktif berdasarkan data yang ada
            if (user.qrisUrl && !user.bankName) {
                setPaymentMethod('qris');
            } else {
                setPaymentMethod('bank');
            }
        }
    }, [user]);

    const isChanged = 
        formData.name !== (user?.name || '') ||
        formData.domisili !== (user?.domisili || '') ||
        formData.campus !== (user?.campus || '') ||
        formData.bankName !== (user?.bankName || '') ||
        formData.bankAccount !== (user?.bankAccount || '') ||
        formData.bankAccountName !== (user?.bankAccountName || '') ||
        formData.photoFile !== null ||
        formData.qrisFile !== null;

    const handlePhotoChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, photoFile: file });
        setPhotoPreview(URL.createObjectURL(file));
    };

    const handleQrisChange = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        setFormData({ ...formData, qrisFile: file, bankName: '', bankAccount: '', bankAccountName: '' });
        setQrisPreview(URL.createObjectURL(file));
    };

    const handleSaveProfile = async (e) => {
        e.preventDefault();
        if (!isChanged) return;

        setUploading(true);
        const toastId = toast.loading('Menyimpan perubahan...', { id: 'profile-update' });

        const submitData = new FormData();
        submitData.append('name', formData.name);
        submitData.append('domisili', formData.domisili);
        submitData.append('campus', formData.campus);

        // LOGIKA EKSKLUSIF: Hanya kirim salah satu metode pencairan
        if (paymentMethod === 'bank') {
            submitData.append('bankName', formData.bankName);
            submitData.append('bankAccount', formData.bankAccount);
            submitData.append('bankAccountName', formData.bankAccountName);
            submitData.append('qrisUrl', ''); // Instruksi hapus qris di backend
        } else {
            if (formData.qrisFile) {
                submitData.append('qris', formData.qrisFile);
            }
            submitData.append('bankName', '');
            submitData.append('bankAccount', '');
            submitData.append('bankAccountName', '');
        }
        
        if (formData.photoFile) submitData.append('avatar', formData.photoFile);

        try {
            const response = await api.put('/users/profile', submitData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            
            const updatedUser = response.data.data;
            setUser(updatedUser); 
            localStorage.setItem('user', JSON.stringify(updatedUser));
            
            toast.success('Profil berhasil diperbarui!', { id: toastId });
            setTimeout(() => navigate(`/seller/${updatedUser._id || updatedUser.id}`), 1000);
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal menyimpan.', { id: toastId });
        } finally {
            setUploading(false);
        }
    };

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            <div className="max-w-4xl mx-auto p-4 md:p-8">
                
                <div className="flex items-center gap-4 mb-8">
                    <button onClick={() => navigate(-1)} className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-slate-600 transition-all shadow-sm">
                        <ArrowLeft size={20} />
                    </button>
                    <h1 className="text-2xl md:text-3xl font-black text-slate-900 tracking-tight">Pengaturan Profil</h1>
                </div>

                <form onSubmit={handleSaveProfile} className="space-y-8">
                    
                    {/* --- INFORMASI PUBLIK --- */}
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col md:flex-row items-center gap-8 mb-10 pb-10 border-b border-slate-50">
                            <div className="relative group">
                                <img 
                                    src={photoPreview || `https://ui-avatars.com/api/?name=${formData.name || 'User'}&background=random`} 
                                    className="w-36 h-36 rounded-[2.5rem] object-cover ring-8 ring-slate-50 group-hover:ring-[#00478F]/5 transition-all shadow-inner" 
                                />
                                <label className="absolute -bottom-2 -right-2 bg-[#00478F] text-white p-3 rounded-2xl cursor-pointer hover:scale-110 transition-all shadow-xl border-4 border-white">
                                    <ImagePlus size={20} />
                                    <input type="file" accept="image/*" onChange={handlePhotoChange} className="hidden" />
                                </label>
                            </div>
                            <div className="text-center md:text-left">
                                <h3 className="text-xl font-black text-slate-900">Identitas Publik</h3>
                                <p className="text-sm text-slate-400 font-medium mt-1">Data ini akan tampil di profil toko Anda.</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="md:col-span-2 space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap Sesuai KTM</label>
                                <div className="relative">
                                    <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#00478F] focus:ring-4 focus:ring-[#00478F]/5 transition-all font-bold text-slate-800 outline-none" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Asal Kampus</label>
                                <div className="relative">
                                    <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" required value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#00478F] outline-none font-bold text-slate-800" />
                                </div>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Domisili COD</label>
                                <div className="relative">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300" size={18} />
                                    <input type="text" required value={formData.domisili} onChange={(e) => setFormData({...formData, domisili: e.target.value})} className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-transparent rounded-2xl focus:bg-white focus:border-[#00478F] outline-none font-bold text-slate-800" />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* --- METODE PENCAIRAN DANA (EKSKLUSIF) --- */}
                    <div className="bg-white p-6 md:p-10 rounded-[2rem] border border-slate-100 shadow-[0_10px_40px_-15px_rgba(0,0,0,0.05)]">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-8">
                            <div>
                                <h2 className="text-xl font-black text-slate-900 flex items-center gap-2">
                                    Metode Pencairan Dana
                                </h2>
                                <p className="text-sm text-slate-400 font-medium">Pilih salah satu metode untuk menerima uang hasil jualan.</p>
                            </div>

                            {/* Toggle Switcher */}
                            <div className="flex bg-slate-100 p-1.5 rounded-2xl border border-slate-200 w-fit">
                                <button 
                                    type="button" 
                                    onClick={() => setPaymentMethod('bank')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${paymentMethod === 'bank' ? 'bg-white text-[#00478F] shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <CreditCard size={14} /> REKENING
                                </button>
                                <button 
                                    type="button" 
                                    onClick={() => setPaymentMethod('qris')}
                                    className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-black transition-all ${paymentMethod === 'qris' ? 'bg-[#FF9500] text-white shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                                >
                                    <QrCode size={14} /> QRIS
                                </button>
                            </div>
                        </div>

                        {paymentMethod === 'bank' ? (
                            <div className="space-y-6 animate-in fade-in slide-in-from-top-2 duration-300">
                                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Bank / E-Wallet</label>
                                        <input type="text" placeholder="Contoh: BCA, DANA, OVO" value={formData.bankName} onChange={(e) => setFormData({...formData, bankName: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#00478F] transition-all font-bold outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Nomor Rekening / HP</label>
                                        <input type="text" placeholder="Masukkan nomor" value={formData.bankAccount} onChange={(e) => setFormData({...formData, bankAccount: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#00478F] transition-all font-bold outline-none" />
                                    </div>
                                    <div className="space-y-2">
                                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1">Atas Nama (Sesuai Bank)</label>
                                        <input type="text" placeholder="Nama pemilik rekening" value={formData.bankAccountName} onChange={(e) => setFormData({...formData, bankAccountName: e.target.value})} className="w-full px-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:bg-white focus:border-[#00478F] transition-all font-bold outline-none" />
                                    </div>
                                </div>
                                <div className="p-4 bg-blue-50/50 rounded-2xl flex gap-3 items-start border border-blue-100">
                                    <CheckCircle2 className="text-blue-500 shrink-0 mt-0.5" size={18} />
                                    <p className="text-xs text-blue-700 leading-relaxed font-medium">Data rekening Anda bersifat privat. Admin akan menggunakan data ini untuk mengirimkan uang setelah pembeli menerima barang.</p>
                                </div>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center justify-center animate-in fade-in slide-in-from-top-2 duration-300">
                                {qrisPreview ? (
                                    <div className="relative group w-full max-w-sm">
                                        <div className="aspect-square bg-white border-4 border-slate-50 rounded-[2.5rem] overflow-hidden shadow-lg p-4">
                                            <img src={qrisPreview} alt="QRIS" className="w-full h-full object-contain" />
                                        </div>
                                        <button 
                                            type="button" 
                                            onClick={() => {setFormData({...formData, qrisFile: null}); setQrisPreview('');}}
                                            className="absolute -top-3 -right-3 bg-red-500 text-white p-3 rounded-2xl shadow-xl hover:bg-red-600 transition-all border-4 border-white"
                                        >
                                            <Trash2 size={18} />
                                        </button>
                                    </div>
                                ) : (
                                    <label className="w-full max-w-sm aspect-square border-4 border-dashed border-slate-100 rounded-[2.5rem] flex flex-col items-center justify-center bg-slate-50 cursor-pointer hover:bg-slate-100 hover:border-[#FF9500]/30 transition-all group p-10 text-center">
                                        <div className="w-16 h-16 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-sm group-hover:scale-110 transition-transform">
                                            <QrCode className="text-[#FF9500]" size={32} />
                                        </div>
                                        <span className="text-sm font-black text-slate-900">Upload Gambar QRIS</span>
                                        <p className="text-xs text-slate-400 font-medium mt-2">Dukung pembayaran via aplikasi bank atau e-wallet apa saja.</p>
                                        <input type="file" accept="image/*" onChange={handleQrisChange} className="hidden" />
                                    </label>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Tombol Aksi */}
                    <div className="flex flex-col-reverse md:flex-row justify-between items-center gap-6 pt-6">
                        <button type="button" onClick={() => navigate(-1)} className="text-slate-400 font-bold hover:text-slate-600 transition-colors flex items-center gap-2">
                             Kembali
                        </button>
                        <button 
                            type="submit" 
                            disabled={uploading || !isChanged}
                            className={`w-full md:w-auto flex items-center justify-center gap-3 px-12 py-4 rounded-[1.5rem] font-black text-sm uppercase tracking-widest transition-all shadow-xl
                                ${uploading || !isChanged 
                                    ? 'bg-slate-100 text-slate-400 cursor-not-allowed' 
                                    : 'bg-[#00478F] text-white hover:bg-black hover:-translate-y-1 active:scale-95 shadow-[#00478F]/20'
                                }`}
                        >
                            {uploading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            ) : (
                                <><Save size={18} /> Simpan Perubahan</>
                            )}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}