import { Navigate } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import useAdminAuthStore from '../store/adminAuthStore'; // <-- Tambahkan ini

export default function ProtectedRoute({ children, requireAdmin = false }) {
    const { user, token } = useAuthStore();
    const { admin, adminToken } = useAdminAuthStore(); // <-- Tarik state admin

    if (requireAdmin) {
        // Jika minta akses admin, cek token admin
        if (!admin || !adminToken) {
            return <Navigate to="/portal-auth-admin-x7y9z-2026" replace />;
        }
        return children;
    } else {
        // Jika minta akses user biasa, cek token mahasiswa
        if (!user || !token) {
            return <Navigate to="/login" replace />;
        }
        return children;
    }
}