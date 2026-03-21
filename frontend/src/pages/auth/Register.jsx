import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
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
    
    // State Status (Loading & Pesan)
    const [loading, setLoading] = useState(false);
    const [errorMsg, setErrorMsg] = useState('');
    const [successMsg, setSuccessMsg] = useState('');

    // --- HANDLE STEP 1: REGISTRASI AWAL ---
    const handleRegister = async (e) => {
        e.preventDefault();
        setLoading(true);
        setErrorMsg('');

        // Validasi Frontend
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
            // Mengirim data lengkap ke Backend
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
            
            alert('Verifikasi berhasil! Silakan login.');
            navigate('/login');
        } catch (error) {
            setErrorMsg(error.response?.data?.message || 'Kode OTP salah atau kadaluarsa.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[90vh] px-4 py-10">
            <div className="bg-white p-8 rounded-3xl shadow-xl w-full max-w-lg border border-gray-100">
                
                {/* Header */}
                <h2 className="text-3xl font-black text-gray-900 mb-2 text-center">
                    {step === 1 ? 'Daftar Akun' : 'Verifikasi Email'}
                </h2>
                <p className="text-sm text-gray-500 text-center mb-8">
                    {step === 1 ? 'Gabung di ekosistem thrift kampus terbesar.' : `Masukkan 6 digit kode yang dikirim ke ${formData.email}`}
                </p>
                
                {/* Notifikasi */}
                {errorMsg && <div className="bg-red-50 text-red-600 p-3 rounded-xl text-sm mb-4 border border-red-200 text-center font-bold">{errorMsg}</div>}
                {successMsg && step === 2 && <div className="bg-green-50 text-green-600 p-3 rounded-xl text-sm mb-4 border border-green-200 text-center font-bold">{successMsg}</div>}

                {/* FORM STEP 1: DATA DIRI */}
                {step === 1 && (
                    <form onSubmit={handleRegister} className="space-y-4">
                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Nama Lengkap</label>
                            <input type="text" required value={formData.name} onChange={(e) => setFormData({...formData, name: e.target.value})}
                                placeholder="Masukkan nama sesuai KTM"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none transition" />
                        </div>

                        <div>
                            <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Email Kampus (.ac.id)</label>
                            <input type="email" required value={formData.email} onChange={(e) => setFormData({...formData, email: e.target.value})}
                                placeholder="nama@mahasiswa.ac.id"
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none transition" />
                        </div>

                        {/* Grid Kampus & Domisili */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Asal Kampus</label>
                                <input type="text" required value={formData.campus} onChange={(e) => setFormData({...formData, campus: e.target.value})}
                                    placeholder="Contoh: UNJ"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Domisili (Area COD)</label>
                                <input type="text" required value={formData.domisili} onChange={(e) => setFormData({...formData, domisili: e.target.value})}
                                    placeholder="Contoh: Rawamangun"
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none transition" />
                            </div>
                        </div>

                        {/* Grid Password */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Password</label>
                                <input type="password" required minLength="6" value={formData.password} onChange={(e) => setFormData({...formData, password: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none transition" />
                            </div>
                            <div>
                                <label className="block text-xs font-black text-gray-400 uppercase tracking-widest mb-1">Konfirmasi</label>
                                <input type="password" required minLength="6" value={formData.confirmPassword} onChange={(e) => setFormData({...formData, confirmPassword: e.target.value})}
                                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none transition" />
                            </div>
                        </div>
                        
                        <button type="submit" disabled={loading} 
                            className="w-full bg-brand-dark text-brand-yellow font-black py-4 rounded-2xl hover:bg-black transition-all disabled:opacity-50 mt-4 shadow-lg shadow-brand-yellow/5">
                            {loading ? 'Mendaftarkan...' : 'Daftar Sekarang'}
                        </button>
                    </form>
                )}

                {/* FORM STEP 2: VERIFIKASI OTP */}
                {step === 2 && (
                    <form onSubmit={handleVerify} className="space-y-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-4 text-center">Masukkan Kode OTP</label>
                            <input type="text" required maxLength="6" value={otp} onChange={(e) => setOtp(e.target.value)}
                                placeholder="000000"
                                className="w-full px-4 py-4 border border-gray-200 rounded-2xl focus:ring-2 focus:ring-brand-yellow focus:outline-none text-center text-4xl font-black tracking-[1rem] bg-gray-50" />
                        </div>
                        
                        <button type="submit" disabled={loading} 
                            className="w-full bg-brand-yellow text-brand-dark font-black py-4 rounded-2xl hover:bg-yellow-500 transition-all disabled:opacity-50 shadow-xl shadow-yellow-200">
                            {loading ? 'Memverifikasi...' : 'Verifikasi & Aktifkan Akun'}
                        </button>
                        
                        <button type="button" onClick={() => setStep(1)} className="w-full text-center text-sm text-gray-400 hover:text-gray-800 font-bold underline transition">
                            Salah email? Kembali perbaiki data
                        </button>
                    </form>
                )}

                {/* Footer Link */}
                {step === 1 && (
                    <p className="text-center text-sm text-gray-500 mt-8 font-medium">
                        Sudah punya akun? <Link to="/login" className="text-brand-yellow font-black hover:underline ml-1">Masuk Sekarang</Link>
                    </p>
                )}
            </div>
        </div>
    );
}