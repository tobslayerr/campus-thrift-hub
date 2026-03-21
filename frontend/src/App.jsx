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
import MyProfile from './pages/user/MyProfile';
import AdminDashboard from './pages/admin/Dashboard';
import AdminLogin from './pages/admin/AdminLogin';
import ChatRoom from './pages/user/ChatRoom';
import ChatList from './pages/user/ChatList';
import MyTransactions from './pages/user/MyTransactions';
import HowItWorks from './pages/HowItWorks';
import BannedPage from './pages/user/BannedPage';

// Components
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import AdminNavbar from './components/AdminNavbar';

// Layout Switcher
function LayoutManager({ children }) {
    const location = useLocation();
    const isAdminDashboard = location.pathname.startsWith('/admin');
    const isAdminLogin = location.pathname.startsWith('/portal-auth-admin');
    const isBannedArea = location.pathname === '/banned';

    // Jika di Admin Dashboard, biarkan Dashboard.jsx mengurus Sidebar-nya sendiri
    if (isAdminDashboard) {
        return <main className="font-sans bg-slate-50 text-slate-900 min-h-screen">{children}</main>;
    }

    return (
        <div className={isAdminLogin ? "min-h-screen bg-slate-50 font-sans" : "min-h-screen bg-brand-light font-sans text-gray-900"}>
            {!isBannedArea && (isAdminLogin ? <AdminNavbar /> : <Navbar />)}
            <main>{children}</main>
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
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/product/:id" element={<ProductDetail />} />
            <Route path="/seller/:id" element={<SellerProfile />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/banned" element={<BannedPage />} />

            <Route path="/upload" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            <Route path="/checkout/:id" element={<ProtectedRoute><Checkout /></ProtectedRoute>} />
            <Route path="/my-profile" element={<ProtectedRoute><MyProfile /></ProtectedRoute>} />
            <Route path="/chat/:id" element={<ProtectedRoute><ChatRoom /></ProtectedRoute>} />
            <Route path="/chats" element={<ProtectedRoute><ChatList /></ProtectedRoute>} />
            <Route path="/transactions" element={<ProtectedRoute><MyTransactions /></ProtectedRoute>} />
            <Route path="/edit-product/:id" element={<ProtectedRoute><UploadProduct /></ProtectedRoute>} />
            
            <Route path="/portal-auth-admin-x7y9z-2026" element={<AdminLogin />} />
            <Route path="/admin" element={<ProtectedRoute requireAdmin={true}><AdminDashboard /></ProtectedRoute>} />
          </Routes>
        </LayoutManager>
    </Router>
  );
}

export default App;