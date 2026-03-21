import { Link } from 'react-router-dom';
import { 
    ShieldCheck, Smartphone, Search, Wallet, Handshake, 
    Lock, ArrowRight, Info, Percent
} from 'lucide-react';

export default function HowItWorks() {
    const steps = [
        {
            title: "Cari Harta Karunmu",
            desc: "Temukan barang thrift terbaik dari teman sekampusmu. Gunakan filter untuk mencari berdasarkan kategori atau universitas.",
            icon: <Search size={32} />,
            color: "bg-blue-50 text-[#00478F]"
        },
        {
            title: "Bayar ke Rekening Hub",
            desc: "Lakukan pembayaran aman melalui Admin. Uang Anda tidak langsung ke penjual, melainkan ditahan oleh sistem Escrow kami.",
            icon: <Wallet size={32} />,
            color: "bg-orange-50 text-[#FF9500]"
        },
        {
            title: "Ketemuan & Cek Barang",
            desc: "Atur janji temu (COD) di area kampus. Periksa kondisi barang secara langsung untuk memastikan semuanya sesuai ekspektasi.",
            icon: <Handshake size={32} />,
            color: "bg-blue-50 text-[#00478F]"
        },
        {
            title: "Berikan PIN Rahasia",
            desc: "Jika barang sudah oke, berikan PIN Rahasia Anda kepada penjual. Ini adalah instruksi bagi sistem untuk mencairkan dana.",
            icon: <Smartphone size={32} />,
            color: "bg-orange-50 text-[#FF9500]"
        }
    ];

    return (
        <div className="min-h-screen bg-[#F8FAFC] pb-24">
            {/* --- HERO SECTION --- */}
            <section className="relative bg-[#00478F] py-24 px-6 overflow-hidden">
                <div className="absolute top-0 right-0 w-96 h-96 bg-[#FF9500]/20 rounded-full blur-[120px] -translate-y-1/2 translate-x-1/2"></div>
                <div className="max-w-4xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-blue-200 text-xs font-black uppercase tracking-widest mb-6 backdrop-blur-md border border-white/10">
                        <ShieldCheck size={14} /> 100% Student Protected
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black text-white mb-6 tracking-tight leading-tight">
                        Gak Perlu Takut <br />
                        <span className="text-[#FF9500]">Kena Tipu Lagi.</span>
                    </h1>
                    <p className="text-blue-100 text-lg opacity-80 font-medium">
                        Pelajari bagaimana sistem Escrow Campus Thrift Hub menjaga uang dan barangmu tetap aman selama transaksi di kampus.
                    </p>
                </div>
            </section>

            {/* --- CORE ESCROW LOGIC --- */}
            <section className="max-w-7xl mx-auto px-6 -translate-y-12 relative z-20">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    {steps.map((step, index) => (
                        <div key={index} className="bg-white p-8 rounded-[2.5rem] shadow-xl shadow-slate-200/50 border border-slate-50 flex flex-col group hover:border-[#FF9500] transition-all duration-500">
                            <div className={`w-16 h-16 ${step.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-500`}>
                                {step.icon}
                            </div>
                            <span className="text-[10px] font-black text-slate-300 uppercase tracking-[0.3em] mb-2">Langkah 0{index + 1}</span>
                            <h3 className="text-xl font-black text-slate-900 mb-3 tracking-tight">{step.title}</h3>
                            <p className="text-slate-500 text-sm leading-relaxed font-medium">{step.desc}</p>
                        </div>
                    ))}
                </div>
            </section>

            {/* --- VISUAL TIMELINE EXPLANATION --- */}
            <section className="max-w-5xl mx-auto px-6 mt-20">
                <div className="bg-white rounded-[3rem] p-8 md:p-16 border border-slate-100 shadow-sm overflow-hidden relative">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-slate-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    
                    <div className="relative z-10">
                        <h2 className="text-3xl font-black text-slate-900 mb-12 flex items-center gap-4">
                            <div className="w-12 h-12 bg-[#00478F] text-white rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200">
                                <Lock size={24} />
                            </div>
                            Kenapa Harus Escrow?
                        </h2>

                        <div className="space-y-10">
                            <div className="flex gap-6">
                                <div className="shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-black">1</div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg mb-1">Keamanan Dana</h4>
                                    <p className="text-slate-500 font-medium">Penjual tidak akan kabur setelah Anda bayar, karena uang dipegang oleh Admin sampai Anda mengonfirmasi barang telah diterima.</p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-black">2</div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg mb-1">Kualitas Barang Terjamin</h4>
                                    <p className="text-slate-500 font-medium">Anda punya kesempatan mengecek barang saat COD. Jika barang rusak atau tidak sesuai, Anda berhak membatalkan transaksi dan uang kembali 100%.</p>
                                </div>
                            </div>

                            <div className="flex gap-6">
                                <div className="shrink-0 w-10 h-10 bg-green-100 text-green-600 rounded-full flex items-center justify-center font-black">3</div>
                                <div>
                                    <h4 className="font-black text-slate-900 text-lg mb-1">Verifikasi Mahasiswa</h4>
                                    <p className="text-slate-500 font-medium">Setiap pengguna wajib mendaftar menggunakan email kampus. Kami meminimalisir orang luar masuk ke ekosistem thrift mahasiswa.</p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- STRUKTUR BIAYA LAYANAN (BARU) --- */}
            <section className="max-w-5xl mx-auto px-6 mt-12">
                <div className="bg-white border border-slate-200 shadow-sm rounded-[3rem] p-8 md:p-12 relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-40 h-40 bg-blue-50 rounded-full translate-x-1/2 -translate-y-1/2"></div>
                    <div className="relative z-10">
                        <h2 className="text-2xl font-black text-slate-900 mb-4 flex items-center gap-4">
                            <div className="w-12 h-12 bg-blue-100 text-[#00478F] rounded-2xl flex items-center justify-center">
                                <Percent size={24} />
                            </div>
                            Struktur Biaya Layanan
                        </h2>
                        <p className="text-slate-500 font-medium mb-8 max-w-2xl leading-relaxed">
                            Bagi <strong>Pembeli</strong>, layanan ini 100% GRATIS tanpa biaya tambahan. <br/> 
                            Bagi <strong>Penjual</strong>, kami menerapkan potongan admin yang sangat kecil dari total penjualan untuk menjaga server dan sistem keamanan Escrow tetap berjalan.
                        </p>
                        
                        <div className="grid md:grid-cols-2 gap-6">
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <h4 className="font-black text-slate-800 text-xl mb-2">Barang ≤ Rp 100.000</h4>
                                <p className="text-sm text-slate-500 mb-6 font-medium">Berlaku untuk produk dengan harga di bawah atau pas 100 ribu.</p>
                                <div className="text-4xl font-black text-[#FF9500]">Potongan 5%</div>
                            </div>
                            <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100">
                                <h4 className="font-black text-slate-800 text-xl mb-2">Barang &gt; Rp 100.000</h4>
                                <p className="text-sm text-slate-500 mb-6 font-medium">Berlaku untuk produk premium dengan harga di atas 100 ribu.</p>
                                <div className="text-4xl font-black text-[#FF9500]">Potongan 10%</div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* --- IMPORTANT NOTE / WARNING --- */}
            <section className="max-w-5xl mx-auto px-6 mt-12">
                <div className="bg-[#FF9500]/10 border-2 border-dashed border-[#FF9500]/30 rounded-[2.5rem] p-8 flex flex-col md:flex-row items-center gap-6">
                    <div className="w-16 h-16 bg-[#FF9500] text-white rounded-full flex items-center justify-center shrink-0 shadow-lg shadow-orange-200">
                        <Info size={32} />
                    </div>
                    <div>
                        <h4 className="font-black text-[#FF9500] text-xl mb-1 uppercase tracking-tight">Peringatan Penting!</h4>
                        <p className="text-slate-600 font-bold text-sm leading-relaxed">
                            Jangan pernah memberikan <span className="text-[#00478F]">PIN Rahasia</span> kepada penjual melalui Chat atau WhatsApp sebelum Anda memegang fisik barangnya. PIN adalah kunci pencairan uang Anda.
                        </p>
                    </div>
                </div>
            </section>

            {/* --- CTA --- */}
            <section className="max-w-4xl mx-auto px-6 mt-24 text-center">
                <h2 className="text-3xl font-black text-slate-900 mb-6">Siap berburu barang hits?</h2>
                <div className="flex flex-col md:flex-row gap-4 justify-center">
                    <Link to="/explore" className="px-10 py-5 bg-[#00478F] text-white font-black rounded-2xl shadow-xl shadow-blue-900/20 hover:bg-[#FF9500] hover:scale-105 transition-all active:scale-95 flex items-center justify-center gap-2">
                        Mulai Belanja <ArrowRight size={20} />
                    </Link>
                    <Link to="/upload" className="px-10 py-5 bg-white text-[#00478F] font-black rounded-2xl border-2 border-slate-200 hover:border-[#00478F] transition-all flex items-center justify-center gap-2">
                        Buka Lapak Jualan
                    </Link>
                </div>
            </section>
        </div>
    );
}