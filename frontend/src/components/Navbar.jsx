import { useState, useEffect } from 'react';
import { Link, NavLink, useNavigate, useLocation } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import api from '../api/axios';
import { 
  Menu, X, MessageSquare, ClipboardList, 
  PlusCircle, LogOut, User as UserIcon, Bell, Loader2, Heart, BarChart2 
} from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const location = useLocation(); // Untuk melacak posisi URL saat ini
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoggingOut, setIsLoggingOut] = useState(false); 
  
  const userId = user?.id || user?._id;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  useEffect(() => {
      if (user) {
          const fetchUnreadNotifs = async () => {
              try {
                  const res = await api.get('/notifications');
                  const unread = res.data.data.filter(n => !n.isRead).length;
                  setUnreadCount(unread);
              } catch (e) { console.error(e); }
          };
          fetchUnreadNotifs();
          const interval = setInterval(fetchUnreadNotifs, 10000);
          return () => clearInterval(interval);
      }
  }, [user]);

  const handleLogout = async () => {
    setIsLoggingOut(true); 
    setIsSidebarOpen(false); 
    
    setTimeout(async () => {
      await logout();
      setIsLoggingOut(false); 
      navigate('/login');
    }, 800);
  };

  const navItemStyle = ({ isActive }) => `
    relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 group
    ${isActive 
      ? 'text-[#00478F] bg-[#00478F]/5 shadow-sm' 
      : 'text-slate-600 hover:text-[#00478F] hover:bg-slate-100'}
  `;

  // LOGIKA TOMBOL MENGAMBANG (FAB): Sembunyikan di halaman tertentu
  const hideFabPaths = ['/upload', '/login', '/register', '/chats'];
  const isChatRoom = location.pathname.startsWith('/chat/');
  const shouldShowFab = user && !hideFabPaths.includes(location.pathname) && !isChatRoom;

  return (
    <>
      {isLoggingOut && (
        <div className="fixed inset-0 bg-white/60 backdrop-blur-md z-[9999] flex flex-col items-center justify-center animate-in fade-in duration-300">
          <Loader2 className="w-12 h-12 text-[#00478F] animate-spin mb-4" />
          <p className="font-black text-[#00478F] tracking-widest text-sm uppercase">Keluar dari Akun...</p>
        </div>
      )}

      <nav className="bg-white/80 backdrop-blur-md py-4 px-6 sticky top-0 z-[60] shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          <Link to="/" className="relative group">
            <div className="absolute -inset-4 bg-[#FF9500]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            <img src="/iconweb.png" alt="Logo" className="h-16 md:h-24 w-auto object-contain relative transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-2" />
          </Link>

          <div className="hidden md:flex gap-2 items-center">
            {user ? (
              <>
                <NavLink to="/transactions" className={navItemStyle}>
                  <ClipboardList size={18} /><span>Transaksi</span>
                </NavLink>
                
                <NavLink to="/chats" className={navItemStyle}>
                  <MessageSquare size={18} /><span>Pesan</span>
                </NavLink>

                <NavLink to="/seller/dashboard" className={navItemStyle} title="Analitik Toko">
                  <BarChart2 size={18} className="group-hover:text-[#FF9500] transition-colors" /><span>Analitik</span>
                </NavLink>

                <NavLink to="/wishlist" className={navItemStyle} title="Barang Tersimpan">
                  <Heart size={18} className="group-hover:text-red-500 transition-colors" /><span>Wishlist</span>
                </NavLink>

                <NavLink to="/notifications" className={navItemStyle}>
                  <div className="relative">
                      <Bell size={20} />
                      {unreadCount > 0 && (
                          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[9px] font-black w-[18px] h-[18px] rounded-full flex items-center justify-center animate-bounce shadow-md border-2 border-white">
                              {unreadCount > 9 ? '9+' : unreadCount}
                          </span>
                      )}
                  </div>
                  <span className="ml-1">Notifikasi</span>
                </NavLink>

                <NavLink to="/upload" className="ml-4 flex items-center gap-2 px-6 py-3 bg-[#FF9500] text-white font-black rounded-2xl hover:shadow-[0_10px_20px_-5px_rgba(255,149,0,0.4)] hover:-translate-y-0.5 transition-all active:scale-95">
                  <PlusCircle size={20} /><span>Jual Barang</span>
                </NavLink>
                
                <div className="h-8 w-[1px] bg-slate-200 mx-4"></div>

                <div className="flex items-center gap-4">
                   <Link to={`/seller/${userId}`} className="flex items-center gap-3 p-1 pr-4 rounded-full border border-slate-200 hover:border-[#FF9500] hover:bg-white transition-all group">
                    <img src={user.profilePicture || 'https://via.placeholder.com/150'} alt={user.name} className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#FF9500] transition-all" />
                    <span className="text-sm font-black text-slate-800">{user.name.split(' ')[0]}</span>
                  </Link>

                  <button 
                    onClick={handleLogout} 
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                    title="Keluar Akun"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-black text-slate-600 hover:text-[#00478F] transition-colors">Masuk</Link>
                <Link to="/login" className="bg-[#00478F] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#00356b] shadow-lg shadow-blue-900/10 transition-all active:scale-95">Daftar</Link>
              </div>
            )}
          </div>

          <div className="md:hidden flex items-center gap-2">
              {user && (
                  <>
                      <Link to="/chats" className="p-2.5 text-[#00478F] bg-slate-100 rounded-2xl active:scale-90 transition-transform">
                          <MessageSquare size={22} />
                      </Link>
                      
                      <Link to="/notifications" className="relative p-2.5 text-[#00478F] bg-slate-100 rounded-2xl active:scale-90 transition-transform">
                          <Bell size={22} />
                          {unreadCount > 0 && (
                              <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[9px] font-black w-5 h-5 rounded-full flex items-center justify-center animate-bounce shadow-sm border-2 border-white">
                                  {unreadCount > 9 ? '9+' : unreadCount}
                              </span>
                          )}
                      </Link>
                  </>
              )}
              <button onClick={toggleSidebar} className="p-2.5 rounded-2xl bg-slate-100 text-[#00478F] active:scale-90 transition-transform ml-1">
                {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
              </button>
          </div>
        </div>
      </nav>

      {/* MOBILE SIDEBAR */}
      <div className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-all duration-500 md:hidden ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`} onClick={toggleSidebar}></div>

      <aside className={`fixed top-0 right-0 h-full w-[320px] bg-white z-[80] shadow-2xl transform transition-all duration-500 ease-in-out md:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-6 flex justify-between items-center border-b border-slate-50 bg-slate-50">
          <img src="/iconweb.png" alt="Logo" className="h-12 w-auto" />
          <button onClick={toggleSidebar} className="p-2 text-slate-400 bg-white rounded-full shadow-sm"><X size={20} /></button>
        </div>

        <div className="p-6 flex flex-col gap-4 flex-1 overflow-y-auto">
          {user ? (
            <>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-4 text-center flex flex-col items-center">
                <img src={user.profilePicture || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-xl mb-4" alt="" />
                <p className="text-xl font-black text-slate-900">{user.name}</p>
              </div>

              <NavLink to="/transactions" onClick={toggleSidebar} className={navItemStyle}><ClipboardList size={22} /> <span>Riwayat Transaksi</span></NavLink>
              
              <NavLink to="/seller/dashboard" onClick={toggleSidebar} className={navItemStyle}>
                <BarChart2 size={22} /> <span>Analitik Toko (Dashboard)</span>
              </NavLink>
              
              <NavLink to="/wishlist" onClick={toggleSidebar} className={navItemStyle}>
                  <Heart size={22} className="group-hover:text-red-500 transition-colors" /> 
                  <span>Barang Tersimpan</span>
              </NavLink>

              <NavLink to="/upload" onClick={toggleSidebar} className="flex items-center justify-center gap-3 px-6 py-4 mt-2 bg-[#FF9500] text-white font-black rounded-2xl shadow-lg shadow-orange-200">
                <PlusCircle size={22} /> <span>Mulai Jual Barang</span>
              </NavLink>
              
              <div className="mt-auto pt-8 border-t border-slate-100 flex flex-col gap-4">
                <NavLink to={`/seller/${userId}`} onClick={toggleSidebar} className="flex items-center justify-center gap-3 text-slate-500 font-bold hover:text-[#00478F] py-3 bg-slate-50 rounded-2xl border border-slate-100">
                  <UserIcon size={20} /> Pengaturan Profil
                </NavLink>
                <button 
                  onClick={handleLogout} 
                  className="flex items-center justify-center gap-3 text-red-500 font-black py-4 bg-red-50 hover:bg-red-500 hover:text-white rounded-2xl w-full transition-colors border border-red-100"
                >
                  <LogOut size={20} /> Keluar Akun
                </button>
              </div>
            </>
          ) : (
            <div className="mt-10 space-y-4 flex flex-col items-center justify-center h-full">
                <img src="/iconweb.png" className="w-32 opacity-50 mb-4" alt=""/>
               <Link to="/login" onClick={toggleSidebar} className="w-full bg-[#00478F] text-white font-black text-center py-4 rounded-2xl shadow-xl shadow-blue-100">Login Mahasiswa</Link>
               <Link to="/register" onClick={toggleSidebar} className="w-full bg-white text-[#00478F] border-2 border-[#00478F] font-black text-center py-4 rounded-2xl hover:bg-slate-50">Daftar Akun Baru</Link>
            </div>
          )}
        </div>
      </aside>

      {/* ======================================================= */}
      {/* FLOATING ACTION BUTTON (HANYA MUNCUL DI MOBILE)           */}
      {/* ======================================================= */}
      {shouldShowFab && (
          <Link 
              to="/upload" 
              className="md:hidden fixed bottom-6 right-6 z-[90] bg-[#FF9500] text-white w-14 h-14 rounded-full shadow-[0_10px_25px_-5px_rgba(255,149,0,0.5)] flex items-center justify-center border-4 border-white hover:scale-105 active:scale-90 transition-all duration-300"
              title="Jual Barang Sekarang"
          >
              <PlusCircle size={26} className="shrink-0" />
          </Link>
      )}
    </>
  );
}