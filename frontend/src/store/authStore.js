import { create } from 'zustand';
import api from '../api/axios';

const useAuthStore = create((set) => ({
    user: JSON.parse(localStorage.getItem('user')) || null,
    token: localStorage.getItem('token') || null,
    isLoading: false,
    error: null,

    // Fungsi Login (Nanti disambungkan ke Backend Login)
    login: async (email, password) => {
        set({ isLoading: true, error: null });
        try {
            // Catatan: Endpoint login belum kita buat di backend, ini persiapan strukturnya
            const response = await api.post('/auth/login', { email, password });
            const { user, token } = response.data;
            
            localStorage.setItem('user', JSON.stringify(user));
            localStorage.setItem('token', token);
            
            set({ user, token, isLoading: false });
        } catch (error) {
            set({ error: error.response?.data?.message || 'Login Gagal', isLoading: false });
        }
    },

    // Fungsi Logout
    logout: () => {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        set({ user: null, token: null });
    }
}));

export default useAuthStore;