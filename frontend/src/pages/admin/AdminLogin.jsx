import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Eye, EyeOff, ShieldCheck, Lock, Fingerprint, AlertCircle, Loader2 } from 'lucide-react';
import useAdminAuthStore from '../../store/adminAuthStore';

export default function AdminLogin() {
    // Inisialisasi state dari localStorage jika Remember Me pernah dicentang
    const [adminId, setAdminId] = useState(localStorage.getItem('remember_admin_id') || '');
    const [password, setPassword] = useState('');
    const [rememberMe, setRememberMe] = useState(!!localStorage.getItem('remember_admin_id'));
    const [showPassword, setShowPassword] = useState(false);

    const { loginAdmin, isLoading, error } = useAdminAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Logika Remember Me
        if (rememberMe) {
            localStorage.setItem('remember_admin_id', adminId);
        } else {
            localStorage.removeItem('remember_admin_id');
        }

        await loginAdmin(adminId, password);
        
        if (!useAdminAuthStore.getState().error) {
            navigate('/admin'); 
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0F172A] px-4 py-12">
            {/* Background Decor */}
            <div className="fixed inset-0 overflow-hidden pointer-events-none">
                <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-blue-900/20 blur-[120px] rounded-full"></div>
                <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-amber-900/10 blur-[120px] rounded-full"></div>
            </div>

            <div className="relative bg-slate-900/50 backdrop-blur-xl p-8 md:p-10 rounded-[2.5rem] shadow-2xl w-full max-w-md border border-slate-800 animate-in fade-in zoom-in-95 duration-500">
                
                {/* Header Otoritas */}
                <div className="text-center mb-10">
                    <div className="w-20 h-20 bg-gradient-to-tr from-slate-800 to-slate-700 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-2xl border border-slate-700 relative group">
                        <div className="absolute inset-0 bg-blue-500/10 blur-xl group-hover:bg-blue-500/20 transition-all"></div>
                        <ShieldCheck className="text-blue-400 relative z-10" size={40} strokeWidth={1.5} />
                    </div>
                    <h2 className="text-3xl font-black text-white tracking-tight">System Authority</h2>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Portal Enkripsi Akses Terbatas Staf Thrift Hub</p>
                </div>
                
                {/* Error Alert */}
                {error && (
                    <div className="bg-red-500/10 text-red-400 p-4 rounded-2xl text-xs mb-6 border border-red-500/20 flex items-center gap-3 animate-shake">
                        <AlertCircle size={18} className="shrink-0" />
                        <span className="font-bold uppercase tracking-wider">{error}</span>
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    {/* ID Otorisasi */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Credential ID</label>
                        <div className="relative group">
                            <Fingerprint className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input 
                                type="text" 
                                value={adminId} 
                                onChange={(e) => setAdminId(e.target.value)} 
                                required
                                className="w-full pl-12 pr-4 py-4 bg-slate-950/50 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-mono tracking-wider placeholder:text-slate-700" 
                                placeholder="ADMIN-XXXX-XXXX" 
                            />
                        </div>
                    </div>

                    {/* Password */}
                    <div className="space-y-2">
                        <label className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] ml-1">Access Key</label>
                        <div className="relative group">
                            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-500 group-focus-within:text-blue-400 transition-colors" size={20} />
                            <input 
                                type={showPassword ? "text" : "password"} 
                                value={password} 
                                onChange={(e) => setPassword(e.target.value)} 
                                required
                                className="w-full pl-12 pr-12 py-4 bg-slate-950/50 border border-slate-800 text-white rounded-2xl focus:ring-2 focus:ring-blue-500/50 focus:border-blue-500 outline-none transition-all font-bold tracking-widest placeholder:text-slate-700"
                                placeholder="••••••••"
                            />
                            <button 
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white transition-colors p-1"
                            >
                                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                            </button>
                        </div>
                    </div>

                    {/* Remember Me */}
                    <div className="flex items-center px-1">
                        <label className="flex items-center gap-3 cursor-pointer group">
                            <div className="relative flex items-center">
                                <input 
                                    type="checkbox" 
                                    checked={rememberMe}
                                    onChange={(e) => setRememberMe(e.target.checked)}
                                    className="peer h-5 w-5 cursor-pointer appearance-none rounded-lg border border-slate-700 bg-slate-950 checked:bg-blue-500 checked:border-blue-500 transition-all"
                                />
                                <ShieldCheck className="absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100 left-0.5 pointer-events-none transition-opacity" />
                            </div>
                            <span className="text-xs font-bold text-slate-500 group-hover:text-slate-300 transition-colors uppercase tracking-widest">Simpan ID Sesi</span>
                        </label>
                    </div>

                    {/* Submit Button */}
                    <button 
                        type="submit" 
                        disabled={isLoading} 
                        className="w-full relative group overflow-hidden bg-white text-slate-950 font-black py-4 rounded-2xl hover:bg-blue-400 transition-all active:scale-95 disabled:opacity-50 flex items-center justify-center gap-3 shadow-xl shadow-blue-500/10"
                    >
                        {isLoading ? (
                            <>
                                <Loader2 className="animate-spin" size={20} />
                                <span className="uppercase tracking-[0.2em] text-xs">Otorisasi...</span>
                            </>
                        ) : (
                            <span className="uppercase tracking-[0.2em] text-xs">Masuk ke System</span>
                        )}
                    </button>
                </form>

                {/* Footer Disclaimer */}
                <div className="mt-10 pt-8 border-t border-slate-800/50 text-center">
                    <p className="text-[10px] text-slate-600 font-bold uppercase tracking-[0.15em] leading-relaxed">
                        Seluruh aktivitas dipantau oleh log keamanan. <br/>
                        Akses ilegal akan diproses secara hukum.
                    </p>
                </div>
            </div>
        </div>
    );
}