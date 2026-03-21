import { FileText, ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function TermsAndConditions() {
    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-32">
            {/* Header */}
            <div className="bg-[#00478F] pt-20 pb-24 px-6 text-center relative overflow-hidden">
                <div className="absolute top-0 left-0 w-64 h-64 bg-[#FF9500]/20 rounded-full blur-[100px]"></div>
                <div className="max-w-3xl mx-auto relative z-10">
                    <Link to="/" className="inline-flex items-center gap-2 text-blue-200 hover:text-white transition-colors mb-6 text-sm font-bold">
                        <ArrowLeft size={16} /> Kembali ke Beranda
                    </Link>
                    <div className="w-16 h-16 bg-white/10 rounded-2xl flex items-center justify-center mx-auto mb-6 backdrop-blur-sm border border-white/20">
                        <FileText size={32} className="text-[#FF9500]" />
                    </div>
                    <h1 className="text-3xl md:text-5xl font-black text-white mb-4 tracking-tight">Syarat & Ketentuan</h1>
                    <p className="text-blue-100 font-medium">Berlaku efektif sejak: {new Date().toLocaleDateString('id-ID', { month: 'long', year: 'numeric' })}</p>
                </div>
            </div>

            {/* Content */}
            <div className="max-w-4xl mx-auto px-6 -translate-y-10 relative z-20">
                <div className="bg-white rounded-[2.5rem] p-8 md:p-12 shadow-xl shadow-slate-200/50 border border-slate-50 text-slate-600 space-y-8 leading-relaxed">
                    
                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">1. Ketentuan Pengguna</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Pengguna diwajibkan merupakan mahasiswa aktif di Indonesia.</li>
                            <li>Dilarang keras menggunakan identitas palsu, akun email kampus milik orang lain, atau memanipulasi data profil.</li>
                            <li>Setiap pengguna bertanggung jawab penuh atas keamanan kata sandi akun masing-masing.</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">2. Sistem Pembayaran & Escrow (Rekber)</h2>
                        <p className="mb-3">Untuk menghindari penipuan, seluruh transaksi wajib melewati rekening resmi Campus Thrift Hub:</p>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Pembeli mentransfer dana ke rekening Admin.</li>
                            <li>Dana akan <strong>ditahan</strong> hingga Pembeli dan Penjual bertemu (COD) dan Pembeli memberikan <strong>PIN Rahasia</strong> kepada Penjual.</li>
                            <li>Dilarang keras melakukan transaksi langsung (Transfer Pribadi) di luar sistem. Pelanggaran akan mengakibatkan pemblokiran akun permanen.</li>
                        </ul>
                    </section>

                    <section className="bg-orange-50 p-6 rounded-2xl border border-orange-100">
                        <h2 className="text-xl font-black text-[#FF9500] mb-4">3. Struktur Biaya & Potongan Admin</h2>
                        <p className="mb-3 text-slate-700">Layanan ini gratis bagi Pembeli. Namun, bagi <strong>Penjual</strong>, kami mengenakan potongan biaya admin saat dana dicairkan dengan ketentuan:</p>
                        <ul className="list-disc pl-5 space-y-2 text-slate-700 font-medium">
                            <li><strong>Potongan 5%:</strong> Dikenakan untuk barang yang terjual dengan harga <strong>Rp 100.000 ke bawah</strong>.</li>
                            <li><strong>Potongan 10%:</strong> Dikenakan untuk barang yang terjual dengan harga <strong>di atas Rp 100.000</strong>.</li>
                        </ul>
                        <p className="mt-3 text-sm text-slate-500 italic">*Biaya ini digunakan untuk pemeliharaan server dan operasional sistem keamanan Escrow.</p>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">4. Barang yang Dilarang</h2>
                        <p>Platform ini khusus untuk barang bekas layak pakai. Pengguna dilarang menjual:</p>
                        <ul className="list-disc pl-5 mt-3 space-y-2">
                            <li>Barang ilegal, curian, atau melanggar hukum Indonesia.</li>
                            <li>Senjata, obat-obatan terlarang, dan alkohol.</li>
                            <li>Barang yang tidak sesuai dengan deskripsi (penipuan kondisi).</li>
                        </ul>
                    </section>

                    <section>
                        <h2 className="text-xl font-black text-slate-900 mb-4">5. Sengketa & Pemblokiran (Banned)</h2>
                        <ul className="list-disc pl-5 space-y-2">
                            <li>Jika terjadi ketidaksesuaian barang saat COD, Pembeli berhak menolak memberikan PIN dan mengajukan Laporan Sengketa.</li>
                            <li>Admin berhak menjadi penengah dan mengambil keputusan mutlak (termasuk me-refund uang ke Pembeli).</li>
                            <li>Admin berhak memberikan sanksi Banned (Sementara/Permanen) kepada pengguna yang melanggar aturan, melakukan spam, atau terindikasi melakukan penipuan.</li>
                        </ul>
                    </section>
                </div>
            </div>
        </div>
    );
}