import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { 
    User, Mail, MapPin, School, Lock, Eye, EyeOff, 
    ShieldCheck, ArrowLeft, KeyRound, AlertCircle 
} from 'lucide-react';
import api from '../../api/axios';

export default function Register() {
    const navigate = useNavigate();
    
    // State Navigasi Form (Step 1: Register, Step 2: OTP)
    const [step, setStep] = useState(1);
    
    // State Data Form
    const [formData, setFormData] = useState({
        name: '',
        email: '',
        domisili: '',
        campus: '',
        password: '',
        confirmPassword: ''
    });
    const [otp, setOtp] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    
    // State Status (Loading & Pesan)
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // --- HANDLE STEP 1: REGISTRASI AWAL ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        if (formData.password !== formData.confirmPassword) {
            setErrorMsg('Password dan Konfirmasi Password tidak cocok!');
            setLoading(false);
            return;
        }
        if (!formData.email.endsWith('.ac.id')) {
            setErrorMsg('Gunakan email kampus resmi (berakhiran .ac.id)!');
            setLoading(false);
            return;
        }

        try {
            const response = await api.post('/auth/register', {
                name: formData.name,
                email: formData.email,
                domisili: formData.domisili,
                campus: formData.campus,
                password: formData.password
            });
            
            setSuccessMsg(response.data.message || 'Cek email Anda untuk kode OTP!');
            setStep(2);
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Gagal melakukan registrasi.');
        } finally {
            setLoading(false);
        }
    };

    // --- HANDLE STEP 2: VERIFIKASI OTP ---
    const handleVerify = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        try {
            await api.post('/auth/verify', {
                email: formData.email,
                otp: otp
            });
            
            navigate('/login', { state: { message: 'Akun berhasil diaktifkan! Silakan masuk.' } });
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Kode OTP salah atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4 py-12">
            <div className="bg-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl shadow-slate-200 w-full max-w-xl border border-slate-100 transition-all duration-500 animate-in fade-in zoom-in-95">
                
                {/* Header Section */}
                <div className="text-center mb-10">
                    <div className="w-16 h-16 bg-[#00478F]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        {step === 1 ? (
                            <User className="text-[#00478F]" size={32} />
                        ) : (
                            <KeyRound className="text-[#FF9500]" size={32} />
                        )}
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">
                        {step === 1 ? 'Daftar Akun Baru' : 'Verifikasi Email'}
                    </h2>
                    <p className="text-slate-500 font-medium mt-2 max-w-xs mx-auto">
                        {step === 1 
                            ? 'Gabung di ekosistem thrift kampus terbesar dan aman.' 
                            : `Masukkan 6 digit kode yang kami kirimkan ke email kampus Anda.`}
                    </p>
                </div>
                
                {/* Error Alert */}
                {errorMsg && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 border border-red-100 flex items-center gap-3 font-bold animate-shake">
                        <AlertCircle size={18} className="shrink-0" />
                        <span>{errorMsg}</span>
                    </div>
                )}

                {/* FORM STEP 1: DATA DIRI */}
                {step === 1 && (
                    <form onSubmit={handleRegister} className="space-y-5">
                        {/* Input Nama */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Nama Lengkap (Sesuai KTM)</label>
                            <div className="relative group">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                                <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                    placeholder="Masukkan nama lengkap"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300" />
                            </div>
                        </div>

                        {/* Input Email */}
                        <div className="space-y-1.5">
                            <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Kampus (.ac.id)</label>
                            <div className="relative group">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                                <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                    placeholder="nama@mahasiswa.ac.id"
                                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300" />
                            </div>
                        </div>

                        {/* Grid Kampus & Domisili */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Asal Kampus</label>
                                <div className="relative group">
                                    <School className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                                    <input type="text" required value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})}
                                        placeholder="Contoh: UNJ"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800" />
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Domisili (Area COD)</label>
                                <div className="relative group">
                                    <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                                    <input type="text" required value={formData.domisili} onChange={(e) => setFormData({...formData, domisili: e.target.value})}
                                        placeholder="Contoh: Rawamangun"
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800" />
                                </div>
                            </div>
                        </div>

                        {/* Input Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                                    <input type={showPassword ? "text" : "password"} required minLength="6" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                                        className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800" />
                                    <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600">
                                        {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                                    </button>
                                </div>
                            </div>
                            <div className="space-y-1.5">
                                <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Konfirmasi</label>
                                <div className="relative group">
                                    <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                                    <input type={showPassword ? "text" : "password"} required minLength="6" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                        className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800" />
                                </div>
                            </div>
                        </div>
                        
                        <button type="submit" disabled={loading} 
                            className="w-full bg-[#00478F] text-white font-black py-4 rounded-2xl hover:bg-[#00356b] shadow-xl shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-50 mt-4 flex items-center justify-center gap-3">
                            {loading ? (
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                            ) : (
                                <>Daftar Sekarang <ShieldCheck size={20} /></>
                            )}
                        </button>
                    </form>
                )}

                {/* FORM STEP 2: VERIFIKASI OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerify} className="space-y-8">
                        {successMsg && <div className="bg-green-50 text-green-600 p-4 rounded-2xl text-center font-bold border border-green-100 animate-bounce">{successMsg}</div>}
                        
                        <div className="space-y-4">
                            <label className="block text-xs font-black text-slate-400 uppercase tracking-widest text-center">Kode Verifikasi 6-Digit</label>
                            <input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full px-4 py-6 border-2 border-slate-100 rounded-[2rem] focus:border-[#FF9500] focus:ring-4 focus:ring-[#FF9500]/5 outline-none text-center text-5xl font-black tracking-[1.2rem] bg-slate-50 transition-all text-[#FF9500]" />
                        </div>
                        
                        <div className="space-y-4">
                            <button type="submit" disabled={loading} 
                                className="w-full bg-[#FF9500] text-white font-black py-4 rounded-2xl hover:bg-[#e68600] transition-all disabled:opacity-50 shadow-xl shadow-orange-200 active:scale-95 flex items-center justify-center gap-3 uppercase tracking-widest text-sm">
                                {loading ? 'Memverifikasi...' : 'Aktifkan Akun Saya'}
                            </button>
                            
                            <button type="button" onClick={() => setStep(1)} className="w-full flex items-center justify-center gap-2 text-sm text-slate-400 hover:text-slate-800 font-bold transition">
                                <ArrowLeft size={16} /> Salah email? Perbaiki data
                            </button>
                        </div>
                    </form>
                )}

                {/* Footer Link */}
                {step === 1 && (
                    <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                        <p className="text-slate-500 font-bold">
                            Sudah punya akun? 
                            <Link to="/login" className="text-[#FF9500] font-black hover:underline underline-offset-4 ml-2">Masuk Sekarang</Link>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
}