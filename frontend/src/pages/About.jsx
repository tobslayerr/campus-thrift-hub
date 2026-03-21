import { ShieldCheck, Leaf, Users, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import useAuthStore from '../store/authStore';

export default function About() {
    const { user } = useAuthStore(); // Ambil state user untuk mengecek login

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* HERO SECTION */}
            <section className="bg-[#00478F] py-24 px-6 text-center">
                <div className="max-w-3xl mx-auto">
                    <h1 className="text-4xl md:text-5xl font-black text-white mb-6 tracking-tight leading-tight">
                        Misi Kami: <span className="text-[#FF9500]">Ekonomi Sirkular</span> di Lingkungan Kampus.
                    </h1>
                    <p className="text-blue-100 text-lg opacity-90 font-medium leading-relaxed">
                        Campus Thrift Hub lahir dari keresahan mahasiswa yang sering tertipu saat bertransaksi barang bekas secara online. Kami hadir untuk memberikan rasa aman.
                    </p>
                </div>
            </section>

            {/* THREE PILLARS */}
            <section className="max-w-6xl mx-auto px-6 -translate-y-12">
                <div className="grid md:grid-cols-3 gap-6">
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-blue-50 text-[#00478F] rounded-2xl flex items-center justify-center mb-6"><ShieldCheck size={32}/></div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">Keamanan Absolut</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">Sistem Rekber (Escrow) kami memastikan uang Anda aman. Penjual tidak dibayar sebelum barang Anda terima dengan baik.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-orange-50 text-[#FF9500] rounded-2xl flex items-center justify-center mb-6"><Users size={32}/></div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">Eksklusif Mahasiswa</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">Kami membatasi akses hanya untuk pengguna email dengan domain <b>.ac.id</b> untuk membangun komunitas yang terpercaya.</p>
                    </div>
                    <div className="bg-white p-8 rounded-[2rem] shadow-xl shadow-slate-200/50 border border-slate-50 text-center flex flex-col items-center">
                        <div className="w-16 h-16 bg-green-50 text-green-600 rounded-2xl flex items-center justify-center mb-6"><Leaf size={32}/></div>
                        <h3 className="text-xl font-black text-slate-900 mb-3">Gaya Hidup Berkelanjutan</h3>
                        <p className="text-slate-500 font-medium text-sm leading-relaxed">Dengan membeli barang thrift, Anda telah membantu mengurangi limbah fashion (fast fashion) di bumi kita.</p>
                    </div>
                </div>
            </section>

            {/* CTA - HANYA TAMPIL JIKA BELUM LOGIN */}
            {!user && (
                <section className="max-w-4xl mx-auto px-6 mt-16 text-center">
                    <h2 className="text-3xl font-black text-slate-900 mb-6">Bergabunglah dengan Ekosistem Kami</h2>
                    <div className="flex justify-center">
                        <Link to="/register" className="px-10 py-5 bg-[#FF9500] text-white font-black rounded-2xl shadow-xl shadow-orange-500/20 hover:bg-orange-600 transition-all active:scale-95 flex items-center justify-center gap-2 uppercase tracking-widest text-sm">
                            Buat Akun Sekarang <ArrowRight size={20} />
                        </Link>
                    </div>
                </section>
            )}
        </div>
    );
}