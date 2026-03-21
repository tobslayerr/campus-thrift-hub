import axios from 'axios';

const api = axios.create({
    baseURL: 'http://localhost:5000/api',
    headers: {
        'Content-Type': 'application/json'
    }
});

// Interceptor Pintar: Mengecek URL di browser untuk menentukan token mana yang dikirim
api.interceptors.request.use((config) => {
    // Jika kita sedang berada di halaman admin atau portal rahasia...
    const isAdminPath = window.location.pathname.startsWith('/admin') || window.location.pathname.startsWith('/portal-');
    
    // Pilih token yang sesuai
    const token = isAdminPath ? localStorage.getItem('admin_token') : localStorage.getItem('token');

    if (token) {
        config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
});

export default api;