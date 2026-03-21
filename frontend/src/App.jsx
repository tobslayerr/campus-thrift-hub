import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // IMPORT TOASTER DI SINI

// Pages
import Home from './pages/buyer/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UploadProduct from './pages/seller/UploadProduct';
import Checkout from './pages/buyer/Checkout';
import ProductDetail from './pages/buyer/ProductDetail';
import SellerProfile from './pages/buyer/SellerProfile';
import MyProfile from './pages/user/MyProfile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ChatRoom from './pages/user/ChatRoom';
import ChatList from './pages/user/ChatList';
import MyTransactions from './pages/user/MyTransactions';
import HowItWorks from './pages/HowItWorks';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';

// Layout Switcher
function LayoutManager({ children }) {
    const location = useLocation();
    const isAdminArea = location.pathname.startsWith('/admin') || location.pathname.startsWith('/portal-auth-admin');

    return (
        <div className={isAdminArea ? "min-h-screen bg-slate-50 font-sans" : "min-h-screen bg-brand-light font-sans text-gray-900"}>
            {isAdminArea ? <AdminNavbar /> : <Navbar />}
            <main>{children}</main>
        </div>
    );
}

function App() {
  return (
    <Router>
        {/* KOMPONEN TOASTER WAJIB ADA DI SINI AGAR POP-UP MUNCUL DI SELURUH HALAMAN */}
        <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{
                duration: 4000,
                style: {
                    borderRadius: '16px',
                    fontWeight: 'bold',
                },
            }}
        />
        
        <LayoutManager>
          <Routes>
            {/* RUTE MAHASISWA (PUBLIK) */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/how-it-works" element={<HowItWorks />} />

            {/* RUTE MAHASISWA (TERPROTEKSI) */}
            <Route path="/upload" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><MyTransactions /></ProtectedRoute>} />
            <Route path="/edit-product/:id" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            
            {/* RUTE ADMIN */}
            <Route path="/portal-auth-admin-x7y9z-2026" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </LayoutManager>
    </Router>
  );
}

export default App;