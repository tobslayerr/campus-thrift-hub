import { useState, useEffect } from 'react';
import api from '../../api/axios';
import { Bell, CheckCheck, Package, AlertTriangle, Info, ArrowLeft } from 'lucide-react';
import toast from 'react-hot-toast';
import { useNavigate } from 'react-router-dom';

export default function Notifications() {
    const [notifications, setNotifications] = useState([]);
    const [loading, setLoading] = useState(true);
    const navigate = useNavigate();

    const fetchNotifications = async () => {
        try {
            const res = await api.get('/notifications');
            setNotifications(res.data.data);
        } catch (error) {
            console.error(error);
            toast.error("Gagal memuat notifikasi");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchNotifications();
    }, []);

    const markAllAsRead = async () => {
        const toastId = toast.loading('Menandai sudah dibaca...');
        try {
            await api.put('/notifications/read');
            // Update UI secara instan
            setNotifications(notifications.map(n => ({ ...n, isRead: true })));
            toast.success("Semua notifikasi ditandai dibaca", { id: toastId });
        // eslint-disable-next-line no-unused-vars
        } catch (error) {
            toast.error("Gagal memperbarui notifikasi", { id: toastId });
        }
    };

    if (loading) return (
        <div className="flex justify-center items-center min-h-[60vh]">
            <div className="w-12 h-12 border-4 border-t-[#00478F] border-slate-100 rounded-full animate-spin"></div>
        </div>
    );

    return (
        <div className="max-w-4xl mx-auto p-4 md:p-8 pb-32 min-h-screen bg-[#F8FAFC]">
            
            <div className="flex items-center gap-4 mb-8">
                <button onClick={() => navigate(-1)} className="p-3 bg-white rounded-full shadow-sm hover:bg-slate-50 transition-colors text-slate-500">
                    <ArrowLeft size={24} />
                </button>
                <div className="flex-1 flex items-center justify-between">
                    <div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 flex items-center gap-3">
                            <Bell className="text-[#00478F]" size={32} /> Notifikasi
                        </h1>
                        <p className="text-sm text-slate-500 font-medium mt-1">Pemberitahuan aktivitas akun dan transaksi Anda.</p>
                    </div>
                    {notifications.some(n => !n.isRead) && (
                        <button onClick={markAllAsRead} className="hidden md:flex items-center gap-2 text-sm font-bold text-[#00478F] hover:text-[#FF9500] transition-colors bg-white px-5 py-2.5 rounded-xl shadow-sm border border-slate-200">
                            <CheckCheck size={18} /> Tandai Semua Dibaca
                        </button>
                    )}
                </div>
            </div>

            {/* Tombol Mobile */}
            {notifications.some(n => !n.isRead) && (
                <button onClick={markAllAsRead} className="md:hidden w-full flex justify-center items-center gap-2 text-sm font-bold text-[#00478F] hover:text-[#FF9500] transition-colors bg-white px-5 py-3 rounded-xl shadow-sm border border-slate-200 mb-6">
                    <CheckCheck size={18} /> Tandai Semua Dibaca
                </button>
            )}

            {notifications.length === 0 ? (
                <div className="text-center py-20 bg-white rounded-[3rem] border border-slate-100 shadow-sm">
                    <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Bell size={32} className="text-slate-300" />
                    </div>
                    <h3 className="text-xl font-black text-slate-700">Belum ada notifikasi</h3>
                    <p className="text-slate-500 font-medium mt-2">Anda akan menerima pemberitahuan di sini.</p>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {notifications.map(notif => (
                        <div key={notif._id} className={`p-6 rounded-[2rem] border transition-all flex flex-col sm:flex-row gap-4 sm:gap-6 relative overflow-hidden ${notif.isRead ? 'bg-white border-slate-100 shadow-sm' : 'bg-blue-50/50 border-blue-200 shadow-md'}`}>
                            
                            {/* Indikator Belum Dibaca (Garis Biru di Kiri) */}
                            {!notif.isRead && <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-[#00478F]"></div>}

                            <div className={`shrink-0 w-14 h-14 rounded-2xl flex items-center justify-center self-start ${notif.type === 'REPORT' ? 'bg-red-100 text-red-500' : notif.type === 'TRANSACTION' ? 'bg-blue-100 text-blue-500' : 'bg-slate-100 text-slate-500'}`}>
                                {notif.type === 'REPORT' ? <AlertTriangle size={28} /> : notif.type === 'TRANSACTION' ? <Package size={28} /> : <Info size={28} />}
                            </div>

                            <div className="flex-1">
                                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-2">
                                    <h3 className={`font-black text-lg ${notif.isRead ? 'text-slate-700' : 'text-slate-900'}`}>
                                        {notif.title}
                                    </h3>
                                    <span className="text-[10px] font-bold text-slate-400 whitespace-nowrap bg-white px-3 py-1.5 rounded-lg border border-slate-100 shadow-sm w-fit">
                                        {new Date(notif.createdAt).toLocaleString('id-ID', {day: 'numeric', month: 'long', hour: '2-digit', minute: '2-digit'})}
                                    </span>
                                </div>
                                <p className={`text-sm leading-relaxed ${notif.isRead ? 'text-slate-500' : 'text-slate-700 font-medium'}`}>
                                    {notif.message}
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}