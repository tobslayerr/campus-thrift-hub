import { useState, useEffect } from 'react';
import { useLocation, useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { KeyRound, ArrowRight, ArrowLeft } from 'lucide-react';

export default function VerifyOtp() {
    const [otp, setOtp] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const email = location.state?.email;

    useEffect(() => {
        if (!email) navigate('/forgot-password');
    }, [email, navigate]);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        const toastId = toast.loading('Memverifikasi...');
        try {
            await api.post('/auth/verify-otp', { email, otp });
            toast.success('OTP Valid!', { id: toastId });
            navigate('/reset-password', { state: { email, otp } });
        } catch (error) {
            toast.error(error.response?.data?.message || 'OTP salah atau kadaluarsa', { id: toastId });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-slate-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
            <div className="sm:mx-auto sm:w-full sm:max-w-md">
                <div className="flex justify-center text-[#FF9500] mb-4"><KeyRound size={48} /></div>
                <h2 className="text-center text-3xl font-black text-slate-900 tracking-tight">Verifikasi OTP</h2>
                <p className="mt-2 text-center text-sm text-slate-600 font-medium">Kami telah mengirimkan 6-digit OTP ke <br/><strong className="text-[#00478F]">{email}</strong></p>
            </div>
            <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
                <div className="bg-white py-8 px-4 shadow-xl sm:rounded-[2rem] sm:px-10 border border-slate-100">
                    <form className="space-y-6" onSubmit={handleSubmit}>
                        <div>
                            <label className="block text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2 ml-1 text-center">Masukkan Kode OTP</label>
                            <input type="text" maxLength="6" required value={otp} onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))} className="block w-full py-4 text-center border border-slate-200 rounded-2xl text-3xl font-black tracking-[0.5em] placeholder-slate-300 focus:outline-none focus:ring-2 focus:ring-[#FF9500] focus:border-transparent transition-all bg-slate-50 focus:bg-white" placeholder="------" />
                        </div>
                        <button type="submit" disabled={loading || otp.length !== 6} className="w-full flex justify-center items-center py-4 px-4 border border-transparent rounded-2xl shadow-lg shadow-orange-500/20 text-sm font-black uppercase tracking-widest text-white bg-[#FF9500] hover:bg-[#00478F] hover:-translate-y-0.5 transition-all disabled:opacity-50">
                            {loading ? 'Memproses...' : <><span className="mr-2">Verifikasi OTP</span> <ArrowRight size={18}/></>}
                        </button>
                    </form>
                    <div className="mt-6 text-center">
                        <Link to="/forgot-password" className="font-bold text-slate-500 hover:text-slate-800 text-sm flex items-center justify-center gap-2 transition-colors"><ArrowLeft size={16}/> Ubah Email</Link>
                    </div>
                </div>
            </div>
        </div>
    );
}