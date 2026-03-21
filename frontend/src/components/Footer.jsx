import { Link } from 'react-router-dom';
import { Clock, MapPin, Mail } from 'lucide-react';

export default function Footer() {
    return (
        <footer className="bg-[#00478F] text-blue-50 pt-16 pb-8 border-t-[16px] border-[#FF9500] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-64 h-64 bg-white/5 rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2"></div>
            
            <div className="max-w-7xl mx-auto px-6 relative z-10">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
                    
                    {/* Kolom 1: Branding dengan Logo */}
                    <div className="space-y-6">
                        <Link to="/" className="flex items-center gap-3">
                            <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center shadow-lg p-2">
                                <img src="/iconweb.png" alt="Logo" className="w-full h-full object-contain" />
                            </div>
                            <span className="text-xl font-black tracking-tight text-white">Campus Thrift Hub</span>
                        </Link>
                        <p className="text-sm text-blue-200 font-medium leading-relaxed">
                            Marketplace barang bekas khusus mahasiswa dengan keamanan transaksi terjamin melalui sistem Escrow (Rekber) 100% aman.
                        </p>
                    </div>

                    {/* Kolom 2: Tautan Cepat */}
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Tautan Cepat</h4>
                        <ul className="space-y-4">
                            <li><Link to="/explore" className="text-blue-200 hover:text-[#FF9500] font-medium transition-colors text-sm">Eksplorasi Katalog</Link></li>
                            <li><Link to="/how-it-works" className="text-blue-200 hover:text-[#FF9500] font-medium transition-colors text-sm">Cara Kerja (Sistem Escrow)</Link></li>
                            <li><Link to="/about" className="text-blue-200 hover:text-[#FF9500] font-medium transition-colors text-sm">Tentang Kami</Link></li>
                        </ul>
                    </div>

                    {/* Kolom 3: Info Operasional */}
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Operasional Admin</h4>
                        <ul className="space-y-4">
                            <li className="flex items-start gap-3 text-sm text-blue-200">
                                <Clock size={18} className="shrink-0 text-[#FF9500]" />
                                <div>
                                    <p className="font-bold text-white mb-1">Jam Operasional</p>
                                    <p className="font-medium">10.00 Pagi - 22.00 Malam</p>
                                    <p className="text-[10px] uppercase tracking-widest opacity-70 mt-1">Setiap Hari</p>
                                </div>
                            </li>
                            <li className="flex items-start gap-3 text-sm text-blue-200 mt-2">
                                <MapPin size={18} className="shrink-0 text-[#FF9500]" />
                                <p className="font-medium leading-relaxed">Dikelola oleh Mahasiswa, Untuk Mahasiswa Indonesia.</p>
                            </li>
                        </ul>
                    </div>

                    {/* Kolom 4: Hubungi Kami (Tanpa Sosmed) */}
                    <div>
                        <h4 className="text-white font-black uppercase tracking-widest text-sm mb-6">Hubungi Bantuan</h4>
                        <ul className="space-y-4">
                            <li className="flex items-center gap-3 text-sm text-blue-200">
                                <Mail size={18} className="text-[#FF9500] shrink-0" />
                                <a href="mailto:support@campusthrift.com" className="hover:text-white transition-colors truncate">support@campusthrift.com</a>
                            </li>
                        </ul>
                    </div>
                </div>

                <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-medium text-blue-300">
                    <p>&copy; {new Date().getFullYear()} Campus Thrift Hub. All rights reserved.</p>
                    <div className="flex gap-6">
                       <Link to="/privacy-policy" className="hover:text-white transition-colors">Kebijakan Privasi</Link>
                       <Link to="/terms" className="hover:text-white transition-colors">Syarat & Ketentuan</Link>
                   </div>
                </div>
            </div>
        </footer>
    );
}