import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../../store/adminAuthStore'; // <-- Ubah import ini

export default function AdminLogin() {
    const [adminId, setAdminId] = useState('');
    const [password, setPassword] = useState('');
    const { loginAdmin, isLoading, error } = useAdminAuthStore(); // <-- Ubah hook ini
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        await loginAdmin(adminId, password); // <-- Panggil loginAdmin
        
        if (!useAdminAuthStore.getState().error) {
            navigate('/admin'); 
        }
    };

    return (
        <div className="flex items-center justify-center min-h-[80vh] bg-gray-900 -mt-8 pt-8 pb-12 rounded-b-3xl">
            <div className="bg-gray-800 p-8 rounded-2xl shadow-2xl w-full max-w-md border border-gray-700">
                <div className="text-center mb-6">
                    <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">🕵️‍♂️</div>
                    <h2 className="text-2xl font-extrabold text-white">Portal Akses Terbatas</h2>
                    <p className="text-gray-400 text-sm mt-1">Hanya untuk staf otoritas Thrift Hub.</p>
                </div>
                
                {error && <div className="bg-red-900/50 text-red-400 p-3 rounded-lg text-sm mb-4 border border-red-800 text-center">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">ID Otorisasi</label>
                        <input type="text" value={adminId} onChange={(e) => setAdminId(e.target.value)} required
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none" 
                            placeholder="Masukkan ID Angka..." />
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-300 mb-1">Kata Sandi</label>
                        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required
                            className="w-full px-4 py-2 bg-gray-900 border border-gray-600 text-white rounded-xl focus:ring-2 focus:ring-brand-yellow focus:outline-none" />
                    </div>
                    <button type="submit" disabled={isLoading} 
                        className="w-full bg-brand-yellow text-brand-dark font-extrabold py-3 rounded-xl hover:bg-yellow-500 transition disabled:opacity-50 mt-4 shadow-lg">
                        {isLoading ? 'Mengautentikasi...' : 'Akses Sistem'}
                    </button>
                </form>
            </div>
        </div>
    );
}