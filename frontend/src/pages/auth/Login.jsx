import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import api from '../../api/axios'; // Tambahkan impor API
import useAuthStore from '../../store/authStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        try {
            // 1. CEK API LANGSUNG DI SINI UNTUK MENANGKAP DATA BANNED LENGKAP
            // Kita hit ke backend sebelum store dijalankan.
            await api.post('/auth/login', { email, password });
            
            // 2. Jika lolos (tidak ada error 403/Banned), baru panggil fungsi dari store
            await login(email, password);
            
            if (!useAuthStore.getState().error) {
                navigate('/');
            }
        } catch (err) {
            // 3. TANGKAP RESPONSE BANNED DARI BACKEND
            if (err.response?.status === 403 && err.response?.data?.isBanned) {
                // Arahkan ke halaman banned dengan membawa alasan dan masa kadaluarsa
                navigate('/banned', { 
                    state: { 
                        reason: err.response.data.banReason, 
                        until: err.response.data.banUntil 
                    } 
                });
            } else {
                // Jika error biasa (seperti password salah / email tidak terdaftar),
                // jalankan fungsi store bawaan agar pesan error-nya muncul di UI kamu.
                await login(email, password);
            }
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">Masuk ke Campus Thrift</h2>
                
                {/* Menampilkan pesan error dari Store (misal: "Password salah") */}
                {error && <div className="bg-red-50 text-red-600 p-3 rounded-lg text-sm mb-4 border border-red-200">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Email Kampus (.ac.id)</label>
                        <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none" />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-1">Password</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none" />
                    </div>
                    <button type="submit" disabled={isLoading} 
                        className="w-full bg-brand-dark text-brand-yellow font-bold py-3 rounded-xl hover:bg-gray-800 transition disabled:opacity-50">
                        {isLoading ? 'Memproses...' : 'Masuk Sekarang'}
                    </button>
                </form>
                <p className="text-center text-sm text-gray-500 mt-6">
                    Belum punya akun? <Link to="/register" className="text-brand-yellow font-bold hover:underline">Daftar Mahasiswa Baru</Link>
                </p>
            </div>
        </div>
    );
}