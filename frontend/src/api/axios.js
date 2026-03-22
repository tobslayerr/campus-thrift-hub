import axios from 'axios';

const api = axios.create({
    // Mengambil dari file .env atau Vercel Environment Variables
    // Jika tidak ada, akan otomatis menggunakan localhost untuk development
    baseURL: import.meta.env.VITE_API_URL || 'http://127.0.0.1:5000/api', 
    headers: {
        'Content-Type': 'application/json'
    }
});

api.interceptors.request.use((config) => {
    const isAdminPath = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal-');
    const token = isAdminPath ? localStorage.getItem('admin_token') : localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;