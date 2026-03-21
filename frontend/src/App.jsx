import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';

// Pages
import Home from './pages/buyer/Home';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import UploadProduct from './pages/seller/UploadProduct';
import Checkout from './pages/buyer/Checkout';
import ProductDetail from './pages/buyer/ProductDetail';
import SellerProfile from './pages/buyer/SellerProfile';
import Explore from './pages/buyer/Explore'; 
import MyProfile from './pages/user/MyProfile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ChatRoom from './pages/user/ChatRoom';
import ChatList from './pages/user/ChatList';
import MyTransactions from './pages/user/MyTransactions';
import HowItWorks from './pages/HowItWorks';
import About from './pages/About'; 
import BannedPage from './pages/user/BannedPage';
import Notifications from './pages/user/Notifications';

// Kebijakan & Privasi
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsAndConditions from './pages/TermsAndConditions';

// ---> IMPORT HALAMAN LUPA PASSWORD (HURUF DISAMAKAN) <---
import ForgotPassword from './pages/auth/ForgotPassword';
import VerifyOTP from './pages/auth/VerifyOTP'; // <-- PERBAIKAN DI SINI
import ResetPassword from './pages/auth/ResetPassword';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';
import Footer from './components/Footer'; 

function LayoutManager({ children }) {
    const location = useLocation();
    
    const isAdminDashboard = location.pathname.startsWith('/admin');
    const isAdminLogin = location.pathname.startsWith('/portal-auth-admin');
    const isBannedArea = location.pathname === '/banned';
    
    // Halaman Auth (Login, Register, Lupa Password) yang tidak perlu footer
    const isAuthPage = 
        location.pathname === '/login' || 
        location.pathname === '/register' ||
        location.pathname === '/forgot-password' ||
        location.pathname === '/verify-otp' ||
        location.pathname === '/reset-password';

    if (isAdminDashboard) {
        return <main className="font-sans bg-slate-50 text-slate-900 min-h-screen">{children}</main>;
    }

    return (
        <div className={isAdminLogin ? "min-h-screen bg-slate-50 font-sans flex flex-col" : "min-h-screen bg-brand-light font-sans text-gray-900 flex flex-col"}>
            {!isBannedArea && (isAdminLogin ? <AdminNavbar /> : <Navbar />)}
            <main className="flex-grow">{children}</main>
            {!isBannedArea && !isAdminLogin && !isAuthPage && <Footer />}
        </div>
    );
}

function App() {
  return (
    <Router>
        <Toaster 
            position="top-center" 
            reverseOrder={false} 
            toastOptions={{ duration: 4000, style: { borderRadius: '16px', fontWeight: 'bold' } }}
        />
        <LayoutManager>
          <Routes>
            {/* PUBLIC ROUTES */}
            <Route path="/" element={<Home />} />
            <Route path="/explore" element={<Explore />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            
            {/* ---> ROUTE LUPA PASSWORD <--- */}
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/verify-otp" element={<VerifyOTP />} /> {/* <-- PERBAIKAN DI SINI */}
            <Route path="/reset-password" element={<ResetPassword />} />

            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/about" element={<About />} /> 
            <Route path="/banned" element={<BannedPage />} />

            {/* ROUTE KEBIJAKAN */}
            <Route path="/privacy-policy" element={<PrivacyPolicy />} />
            <Route path="/terms" element={<TermsAndConditions />} />

            {/* PROTECTED ROUTES (HANYA BISA DIAKSES JIKA LOGIN) */}
            <Route path="/upload" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><MyTransactions /></ProtectedRoute>} />
            <Route path="/edit-product/:id" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            
            {/* ADMIN ROUTES */}
            <Route path="/portal-auth-admin-x7y9z-2026" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </LayoutManager>
    </Router>
  );
}

export default App;