import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { Eye, EyeOff, Lock, Mail, ShieldAlert } from 'lucide-react'; // Ikon tambahan
import api from '../../api/axios';
import useAuthStore from '../../store/authStore';

export default function Login() {
    // Inisialisasi state dengan data dari localStorage jika ada (Remember Me)
    const [email, setEmail] = useState(localStorage.getItem('rememberedEmail') || '');
    const [password, setPassword] = useState(localStorage.getItem('rememberedPassword') || '');
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('rememberedEmail'));
    
    const [showPassword, setShowPassword] = useState(false);
    const { login, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // 1. CEK API UNTUK DATA BANNED
            await api.post('/auth/login', { email, password });
            
            // 2. Jika lolos, proses login ke store
            await login(email, password);
            
            // 3. Logika Simpan Info Login
            if (rememberMe) {
                localStorage.setItem('rememberedEmail', email);
                localStorage.setItem('rememberedPassword', password);
            } else {
                localStorage.removeItem('rememberedEmail');
                localStorage.removeItem('rememberedPassword');
            }

            if (!useAuthStore.getState().error) {
                navigate('/');
            }
        } catch (err) {
            if (err.response?.status === 403 && err.response?.data?.isBanned) {
                navigate('/banned', { 
                    state: { 
                        reason: err.response.data.banReason, 
                        until: err.response.data.banUntil 
                    } 
                });
            } else {
                await login(email, password);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-slate-50 px-4">
            <div className="bg-white p-8 rounded-[2rem] shadow-2xl shadow-slate-200 w-full max-w-md border border-slate-100 transition-all duration-300">
                {/* Header Section */}
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-[#FF9500]/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
                        <Lock className="text-[#FF9500]" size={32} />
                    </div>
                    <h2 className="text-3xl font-black text-slate-900 tracking-tight">Selamat Datang</h2>
                    <p className="text-slate-500 font-medium mt-2">Masuk untuk lanjut ke Campus Thrift Hub</p>
                </div>
                
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-50 text-red-600 p-4 rounded-2xl text-sm mb-6 border border-red-100 flex items-center gap-3 animate-in fade-in slide-in-from-top-2">
                        <ShieldAlert size={18} className="shrink-0" />
                        <span className="font-bold">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-5">
                    {/* Email Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Email Kampus (.ac.id)</label>
                        <div className="relative group">
                            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                            <input 
                                type="email" 
                                value={email} 
                                onChange={(e) => setEmail(e.target.value)} 
                                required
                                placeholder="nim@mhs.ac.id"
                                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium" 
                            />
                        </div>
                    </div>

                    {/* Password Input */}
                    <div className="space-y-1.5">
                        <label className="text-xs font-black text-slate-400 uppercase tracking-widest ml-1">Password</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-[#00478F] transition-colors" size={20} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required
                                placeholder="••••••••"
                                className="w-full pl-12 pr-12 py-4 bg-slate-50 border border-slate-200 rounded-2xl focus:ring-4 focus:ring-[#00478F]/5 focus:border-[#00478F] focus:bg-white outline-none transition-all font-bold text-slate-800 placeholder:text-slate-300 placeholder:font-medium" 
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                            >
                                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me & Forgot Password */}
                    <div className="flex items-center justify-between px-1">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <input 
                                type="checkbox" 
                                checked={rememberMe}
                                onChange={(e) => setRememberMe(e.target.checked)}
                                className="w-5 h-5 rounded-lg border-slate-300 text-[#00478F] focus:ring-[#00478F] cursor-pointer"
                            />
                            <span className="text-sm font-bold text-slate-500 group-hover:text-slate-700 transition-colors">Ingat Saya</span>
                        </label>
                        <Link to="/forgot-password" size={18} className="text-sm font-black text-[#FF9500] hover:underline underline-offset-4">Lupa Sandi?</Link>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full bg-[#00478F] text-white font-black py-4 rounded-2xl hover:bg-[#00356b] shadow-xl shadow-blue-900/10 transition-all active:scale-95 disabled:opacity-50 disabled:hover:bg-[#00478F] flex items-center justify-center gap-3"
                    >
                        {isLoading ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                        ) : (
                            "Masuk Sekarang"
                        )}
                    </button>
                </form>

                {/* Footer Section */}
                <div className="mt-10 pt-8 border-t border-slate-100 text-center">
                    <p className="text-slate-500 font-bold">
                        Belum punya akun? <br className="sm:hidden" />
                        <Link to="/register" className="text-[#FF9500] font-black hover:underline underline-offset-4 ml-1">Daftar Mahasiswa</Link>
                    </p>
                </div>
            </div>
        </div>
    );
}