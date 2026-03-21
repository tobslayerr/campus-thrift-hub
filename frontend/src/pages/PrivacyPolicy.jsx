import { ShieldCheck, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function PrivacyPolicy() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <div className="bg-[#00478F] pt-20 pb-24 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full blur-[80px]"></div>
                <div className="max-w-3xl mx-auto relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm font-bold">
                        <ArrowLeft size={16} /> Kembali ke Beranda
                    </Link>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                        <ShieldCheck size={32} className="text-[#FF9500]" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Kebijakan Privasi</h1>
                    <p className="text-blue-100 font-medium">Terakhir diperbarui: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 -translate-y-10 relative z-20">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-50 text-slate-600 space-y-8 leading-relaxed">
                    
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">1. Pendahuluan</h2>
                        <p>Selamat datang di Campus Thrift Hub. Kami sangat menghargai privasi Anda dan berkomitmen untuk melindungi data pribadi mahasiswa yang menggunakan platform kami. Kebijakan ini menjelaskan bagaimana kami mengumpulkan, menggunakan, dan melindungi informasi Anda.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">2. Informasi yang Kami Kumpulkan</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li><strong>Informasi Pendaftaran:</strong> Nama lengkap, alamat email kampus (.ac.id), dan asal universitas.</li>
                            <li><strong>Informasi Transaksi:</strong> Data rekening bank atau E-Wallet (hanya untuk penjual guna keperluan pencairan dana), dan bukti transfer pembayaran.</li>
                            <li><strong>Data Aktivitas:</strong> Riwayat percakapan (chat) di dalam platform untuk keperluan moderasi dan penyelesaian sengketa.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">3. Penggunaan Informasi</h2>
                        <p className="mb-3">Informasi Anda kami gunakan semata-mata untuk:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Memverifikasi status Anda sebagai mahasiswa aktif.</li>
                            <li>Memfasilitasi sistem pembayaran aman (Escrow) dan pencairan dana.</li>
                            <li>Menampilkan identitas dasar (Nama, Kampus, Rating) kepada pengguna lain agar transaksi COD berjalan lancar.</li>
                            <li>Mencegah penipuan, spam, dan penyalahgunaan platform.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">4. Pembagian Data</h2>
                        <p>Kami <strong>tidak pernah</strong> menjual data Anda kepada pihak ketiga. Informasi Anda hanya dibagikan kepada:</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li><strong>Pengguna Lain:</strong> Hanya sebatas nama, kampus, dan foto profil saat Anda melakukan transaksi jual/beli.</li>
                            <li><strong>Otoritas Hukum:</strong> Jika diwajibkan oleh hukum yang berlaku di Indonesia untuk investigasi tindak kriminal/penipuan.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">5. Keamanan Data</h2>
                        <p>Kami menggunakan enkripsi standar industri dan penyimpanan cloud yang aman. Seluruh data rekening dan bukti transfer diawasi dengan ketat dan hanya dapat diakses oleh Admin berwenang untuk memproses pencairan (Payout).</p>
                    </section>
                </div>
            </div>
        </div>
    );
}