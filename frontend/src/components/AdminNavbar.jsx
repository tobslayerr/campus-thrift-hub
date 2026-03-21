import { useNavigate } from 'react-router-dom';
import useAdminAuthStore from '../store/adminAuthStore';

export default function AdminNavbar() {
  const { admin, logoutAdmin } = useAdminAuthStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logoutAdmin();
    navigate('/portal-auth-admin-x7y9z-2026'); 
  };

  return (
    <nav className="bg-slate-900 text-white p-4 sticky top-0 z-50 border-b border-slate-700 shadow-xl">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center gap-3">
            <span className="text-2xl">🛡️</span>
            <span className="text-lg font-bold tracking-widest text-slate-200">THRIFT<span className="text-red-500">ADMIN</span></span>
        </div>
        
        {admin && (
            <div className="flex items-center gap-6 text-sm font-semibold">
                <span className="text-slate-400">ID Otoritas: <span className="text-white">{admin.email}</span></span>
                <button onClick={handleLogout} className="bg-red-600/20 text-red-400 px-4 py-2 rounded-lg hover:bg-red-600 hover:text-white transition border border-red-500/30">
                    Akhiri Sesi
                </button>
            </div>
        )}
      </div>
    </nav>
  );
}