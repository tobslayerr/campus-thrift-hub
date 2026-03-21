import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Mail, ArrowRight, ShieldCheck, ArrowLeft } from 'lucide-react';

export default function ForgotPassword() {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Mengirim OTP...');
        try {
            await api.post('/auth/forgot-password', { email });
            toast.success('OTP terkirim ke email Anda!', { id: toastId });
            navigate('/verify-otp', { state: { email } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'Gagal mengirim OTP', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-[#00478F] mb-4"><ShieldCheck size={48} /></div>
                <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">Lupa Password?</h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">Masukkan email Anda untuk menerima kode OTP.</p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-[2rem] sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1">Email Kampus</label>
                            <div className="relative">
                                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none"><Mail className="h-5 w-5 text-slate-400" /></div>
                                <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="block w-full pl-11 pr-4 py-4 border border-slate-200 rounded-2xl text-sm font-bold placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#00478F] focus:border-transparent transition-all bg-slate-50 focus:bg-white" placeholder="contoh@mhs.kampus.ac.id" />
                            </div>
                        </div>
                        <button type="submit" disabled={loading} className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-blue-900/20 text-sm font-black uppercase tracking-widest text-white bg-[#00478F] hover:bg-[#FF9500] hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {loading ? 'Memproses...' : <><span className="mr-2">Kirim Kode OTP</span> <ArrowRight size={18}/></>}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link to="/login" className="font-bold text-[#00478F] hover:text-[#FF9500] text-sm flex items-center justify-center gap-2 transition-colors"><ArrowLeft size={16}/> Kembali ke Login</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}