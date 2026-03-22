import { Link, useNavigate } from 'react-router-dom';
import { Ghost, ArrowLeft, Home, Search, ShieldAlert } from 'lucide-react';

export default function NotFound() {
    const navigate = useNavigate();

    return (
        <div className="min-h-[80vh] flex flex-col items-center justify-center p-6 text-center animate-in fade-in zoom-in duration-500">
            {/* ILLUSTRATION */}
            <div className="relative mb-8">
                <div className="w-32 h-32 md:w-44 md:h-44 bg-slate-100 rounded-full flex items-center justify-center animate-bounce duration-[2000ms]">
                    <Ghost size={80} className="text-slate-300 md:w-24 md:h-24" strokeWidth={1.5} />
                </div>
                <div className="absolute -top-2 -right-2 bg-red-500 text-white p-3 rounded-2xl shadow-lg animate-pulse">
                    <ShieldAlert size={24} />
                </div>
            </div>

            {/* TEXT */}
            <h1 className="text-6xl md:text-8xl font-black text-[#00478F] mb-4 tracking-tighter">404</h1>
            <h2 className="text-xl md:text-2xl font-black text-slate-900 mb-3 uppercase tracking-widest">Waduh, Hilang Bagai Mantan!</h2>
            <p className="text-slate-500 font-medium max-w-md mx-auto mb-10 leading-relaxed text-sm md:text-base">
                Barang yang kamu cari mungkin sudah **dihapus permanen**, atau pemiliknya terkena **sanksi (Banned)** karena melanggar aturan komunitas Campus Thrift Hub.
            </p>

            {/* BUTTONS */}
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button 
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 px-8 py-4 bg-slate-900 text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-800 transition-all shadow-xl active:scale-95"
                >
                    <ArrowLeft size={18} /> Kembali
                </button>
                <Link 
                    to="/explore"
                    className="flex items-center gap-2 px-8 py-4 bg-[#FF9500] text-white rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-[#e68600] transition-all shadow-xl active:scale-95 shadow-orange-900/10"
                >
                    <Search size={18} /> Cari Barang Lain
                </Link>
                <Link 
                    to="/"
                    className="flex items-center gap-2 px-8 py-4 bg-white border-2 border-slate-100 text-slate-400 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-50 transition-all active:scale-95"
                >
                    <Home size={18} /> Beranda
                </Link>
            </div>

            {/* DECORATION */}
            <div className="mt-20 opacity-20">
                <p className="text-[10px] font-black uppercase tracking-[0.5em] text-slate-400">Campus Thrift Hub Security System</p>
            </div>
        </div>
    );
}