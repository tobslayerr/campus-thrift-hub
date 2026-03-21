import { useState } from 'react';
import { Link, NavLink } from 'react-router-dom';
import useAuthStore from '../store/authStore';
import { Menu, X, MessageSquare, ClipboardList, PlusCircle, LogOut, User as UserIcon, Bell } from 'lucide-react';

export default function Navbar() {
  const { user, logout } = useAuthStore();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  const userId = user?.id || user?._id;
  const toggleSidebar = () => setIsSidebarOpen(!isSidebarOpen);

  // Link Style: Menggunakan Biru Logo untuk teks, Orange Logo untuk aksen
  const navItemStyle = ({ isActive }) => `
    relative flex items-center gap-2 px-4 py-2 rounded-xl font-bold transition-all duration-300 group
    ${isActive 
      ? 'text-[#00478F] bg-[#00478F]/5 shadow-sm' 
      : 'text-slate-600 hover:text-[#00478F] hover:bg-slate-100'}
  `;

  return (
    <>
      {/* NAVBAR STICKY DENGAN GLASSMORPHISM TERANG */}
      <nav className="bg-white/80 backdrop-blur-md py-4 px-6 sticky top-0 z-[60] shadow-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          
          {/* LOGO AREA - PERBESAR MAKSIMAL */}
          <Link to="/" className="relative group">
            {/* Efek pendaran orange yang halus di belakang logo saat hover */}
            <div className="absolute -inset-4 bg-[#FF9500]/10 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <img 
              src="/iconweb.png" 
              alt="Logo" 
              className="h-20 md:h-24 w-auto object-contain relative transition-transform duration-500 ease-out group-hover:scale-110 group-hover:-rotate-2" 
            />
          </Link>

          {/* DESKTOP MENU */}
          <div className="hidden md:flex gap-2 items-center">
            {user ? (
              <>
                <NavLink to="/transactions" className={navItemStyle}>
                  <ClipboardList size={18} />
                  <span>Transaksi</span>
                </NavLink>
                
                <NavLink to="/chats" className={navItemStyle}>
                  <MessageSquare size={18} />
                  <span>Pesan</span>
                </NavLink>

                {/* Tombol Jual Barang dengan Orange Logo */}
                <NavLink to="/upload" className="ml-4 flex items-center gap-2 px-6 py-3 bg-[#FF9500] text-white font-black rounded-2xl hover:shadow-[0_10px_20px_-5px_rgba(255,149,0,0.4)] hover:-translate-y-0.5 transition-all active:scale-95">
                  <PlusCircle size={20} />
                  <span>Jual Barang</span>
                </NavLink>
                
                <div className="h-8 w-[1px] bg-slate-200 mx-4"></div>

                {/* Profile Section */}
                <div className="flex items-center gap-4">
                   <Link to={`/seller/${userId}`} className="flex items-center gap-3 p-1 pr-4 rounded-full border border-slate-200 hover:border-[#FF9500] hover:bg-white transition-all group">
                    <img 
                      src={user.profilePicture || 'https://via.placeholder.com/150'} 
                      alt={user.name} 
                      className="w-10 h-10 rounded-full object-cover ring-2 ring-slate-100 group-hover:ring-[#FF9500] transition-all" 
                    />
                    <span className="text-sm font-black text-slate-800">{user.name.split(' ')[0]}</span>
                  </Link>

                  <button 
                    onClick={logout}
                    className="p-3 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-2xl transition-all"
                  >
                    <LogOut size={20} />
                  </button>
                </div>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <Link to="/login" className="font-black text-slate-600 hover:text-[#00478F] transition-colors">
                  Masuk
                </Link>
                <Link to="/login" className="bg-[#00478F] text-white font-black px-8 py-3 rounded-2xl hover:bg-[#00356b] shadow-lg shadow-blue-900/10 transition-all active:scale-95">
                  Daftar
                </Link>
              </div>
            )}
          </div>

          {/* BURGER BUTTON (MOBILE) */}
          <button 
            onClick={toggleSidebar} 
            className="md:hidden p-3 rounded-2xl bg-slate-100 text-[#00478F] active:scale-90 transition-transform"
          >
            {isSidebarOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>
      </nav>

      {/* MOBILE SIDEBAR OVERLAY */}
      <div 
        className={`fixed inset-0 bg-slate-900/40 backdrop-blur-sm z-[70] transition-all duration-500 md:hidden ${isSidebarOpen ? 'opacity-100 visible' : 'opacity-0 invisible'}`}
        onClick={toggleSidebar}
      ></div>

      {/* MOBILE SIDEBAR CONTENT */}
      <aside className={`fixed top-0 right-0 h-full w-[320px] bg-white z-[80] shadow-2xl transform transition-all duration-500 ease-in-out md:hidden flex flex-col ${isSidebarOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-8 flex justify-between items-center border-b border-slate-50">
          <img src="/iconweb.png" alt="Logo" className="h-16 w-auto" />
          <button onClick={toggleSidebar} className="p-2 text-slate-400"><X size={30} /></button>
        </div>

        <div className="p-8 flex flex-col gap-4 flex-1">
          {user ? (
            <>
              <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 mb-6">
                <img src={user.profilePicture || 'https://via.placeholder.com/150'} className="w-20 h-20 rounded-full object-cover ring-4 ring-white shadow-xl mb-4" alt="" />
                <p className="text-2xl font-black text-slate-900">{user.name}</p>
                <div className="flex items-center gap-1 text-[#FF9500] font-black text-[10px] uppercase tracking-widest mt-1">
                  <span className="w-2 h-2 bg-[#FF9500] rounded-full animate-ping"></span>
                  Verified Student
                </div>
              </div>

              <NavLink to="/transactions" onClick={toggleSidebar} className={navItemStyle}>
                <ClipboardList size={22} /> <span>Riwayat Transaksi</span>
              </NavLink>
              <NavLink to="/chats" onClick={toggleSidebar} className={navItemStyle}>
                <MessageSquare size={22} /> <span>Pesan Chat</span>
              </NavLink>
              <NavLink to="/upload" onClick={toggleSidebar} className="flex items-center gap-3 px-6 py-5 bg-[#FF9500] text-white font-black rounded-2xl shadow-lg shadow-orange-200">
                <PlusCircle size={22} /> <span>Mulai Jual Barang</span>
              </NavLink>
              
              <div className="mt-auto pt-10 border-t border-slate-100 flex flex-col gap-4">
                <NavLink to={`/seller/${userId}`} onClick={toggleSidebar} className="flex items-center gap-3 text-slate-500 font-bold hover:text-[#00478F]">
                  <UserIcon size={20} /> Pengaturan Profil
                </NavLink>
                <button 
                  onClick={() => { logout(); toggleSidebar(); }}
                  className="flex items-center gap-3 text-red-500 font-black p-5 bg-red-50 rounded-2xl w-full"
                >
                  <LogOut size={20} /> Keluar Akun
                </button>
              </div>
            </>
          ) : (
            <div className="mt-10 space-y-4">
               <Link to="/login" onClick={toggleSidebar} className="block w-full bg-[#00478F] text-white font-black text-center py-5 rounded-2xl shadow-xl shadow-blue-100">
                Login / Register
              </Link>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}