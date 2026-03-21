import { create } from 'zustand';
import api from '../api/axios';

const useAdminAuthStore = create((set) => ({
    // Kita simpan dengan nama key yang berbeda di LocalStorage
    admin: JSON.parse(localStorage.getItem('admin_user')) || null,
    adminToken: localStorage.getItem('admin_token') || null,
    isLoading: false,
    error: null,

    loginAdmin: async (adminId, password) => {
        set({ isLoading: true, error: null });
        try {
            // Backend tetap membaca parameter 'email', jadi kita lempar adminId ke sana
            const response = await api.post('/auth/login', { email: adminId, password });
            const { user, token } = response.data;
            
            // Validasi ekstra: Tolak jika yang login bukan role admin
            if (user.role !== 'admin') {
                throw new Error("Akses Ditolak! Kredensial ini bukan milik Admin.");
            }
            
            localStorage.setItem('admin_user', JSON.stringify(user));
            localStorage.setItem('admin_token', token);
            
            set({ admin: user, adminToken: token, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || error.message || 'Login Gagal', isLoading: false });
        }
    },

    logoutAdmin: () => {
        localStorage.removeItem('admin_user');
        localStorage.removeItem('admin_token');
        set({ admin: null, adminToken: null });
    }
}));

export default useAdminAuthStore;