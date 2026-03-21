import { useLocation, useNavigate } from 'react-router-dom';
import { AlertOctagon, ArrowLeft } from 'lucide-react';

export default function BannedPage() {
    const location = useLocation();
    const navigate = useNavigate();
    const { reason, until } = location.state || {};

    const isPermanent = !until;
    const dateFormatted = until ? new Date(until).toLocaleDateString('id-ID', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }) : 'Selamanya';

    return (
        <div className="min-h-screen bg-red-50 flex flex-col items-center justify-center p-6">
            <div className="bg-white max-w-lg w-full rounded-[2.5rem] p-10 text-center shadow-2xl border-4 border-red-500">
                <div className="w-24 h-24 bg-red-100 text-red-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-inner">
                    <AlertOctagon size={48} strokeWidth={2.5} />
                </div>
                <h1 className="text-3xl font-black text-slate-900 mb-2 uppercase tracking-widest">Akses Diblokir!</h1>
                <p className="text-slate-600 font-medium mb-8">Maaf, akun Anda telah di-banned dari platform Campus Thrift Hub karena melanggar ketentuan komunitas kami.</p>
                
                <div className="bg-red-50 border border-red-200 rounded-2xl p-5 mb-8 text-left">
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Alasan Pemblokiran:</p>
                    <p className="text-sm font-bold text-red-900 mb-4">{reason || 'Pelanggaran berat (Fraud/Spam)'}</p>
                    
                    <p className="text-[10px] font-black text-red-500 uppercase tracking-widest mb-1">Masa Hukuman:</p>
                    <p className="text-sm font-black text-red-900 bg-white inline-block px-3 py-1 rounded-lg border border-red-100">
                        {isPermanent ? '🚨 PERMANEN' : `Hingga ${dateFormatted}`}
                    </p>
                </div>

                <button onClick={() => navigate('/')} className="w-full bg-slate-900 text-white font-black py-4 rounded-xl hover:bg-[#FF9500] transition-colors flex items-center justify-center gap-2 uppercase tracking-widest text-xs">
                    <ArrowLeft size={16} /> Kembali ke Beranda
                </button>
            </div>
        </div>
    );
}