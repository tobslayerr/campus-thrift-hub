import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Lock, CheckCircle2 } from 'lucide-react';

export default function ResetPassword() {
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    
    const email = location.state?.email;
    const otp = location.state?.otp;

    useEffect(() => {
        if (!email || !otp) navigate('/forgot-password');
    }, [email, otp, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (newPassword !== confirmPassword) return toast.error("Password tidak cocok!");
        if (newPassword.length < 6) return toast.error("Password minimal 6 karakter!");

        setLoading(true);
        const toastId = toast.loading('Mengubah password...');
        try {
            await api.post('/auth/reset-password', { email, otp, newPassword });
            toast.success('Password berhasil diubah! Silakan login.', { id: toastId });
            navigate('/login');
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengubah password', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-green-500 mb-4"><Lock size={48} /></div>
                <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">Password Baru</h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">Buat kata sandi baru untuk akun Anda.</p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-[2rem] sm:px-10 border border-slate-100">
                    <form className="space-y-5" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Password Baru</label>
                            <input type="password" required value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="block w-full px-4 py-4 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 focus:bg-white" placeholder="••••••••" />
                        </div>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Konfirmasi Password</label>
                            <input type="password" required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="block w-full px-4 py-4 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent bg-slate-50 focus:bg-white" placeholder="••••••••" />
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-green-500/20 text-sm font-black uppercase tracking-widest text-white bg-green-500 hover:bg-green-600 hover:-translate-y-0.5 transition-all disabled:opacity-50 mt-2">
                            {loading ? 'Menyimpan...' : <><span className="mr-2">Simpan Password</span> <CheckCircle2 size={18}/></>}
                        </button>
                    </form>
                </div>
            </div>
        </div>
    );
}