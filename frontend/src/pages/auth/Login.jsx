import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuthStore from '../../store/authStore';

export default function Login() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const { login, isLoading, error } = useAuthStore();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await login(email, password);
        // Jika tidak ada error di store, arahkan ke beranda
        if (!useAuthStore.getState().error) {
            navigate('/');
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh]">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md border border-gray-100">
                <h2 className="text-2xl font-extrabold text-gray-900 mb-6 text-center">Masuk ke Campus Thrift</h2>
                
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