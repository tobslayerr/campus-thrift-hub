import { ShieldCheck } from 'lucide-react';
import Pagination from './Pagination';

export default function TabReports({ reports, currentPage, setCurrentPage, itemsPerPage, setSelectedReport, setReportStatus, setAdminNotes, setShowReportModal }) {
    const displayedReports = reports.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-6 animate-in fade-in duration-500">
            {displayedReports.length === 0 ? (
                <div className="bg-white p-12 rounded-[2.5rem] text-center border border-slate-100 shadow-sm"><ShieldCheck size={48} className="mx-auto text-green-100 mb-4" /><h3 className="text-lg font-bold text-slate-400 uppercase tracking-widest">Aman</h3></div>
            ) : (
                <>
                    <div className="grid gap-6">
                        {displayedReports.map(report => (
                            <div key={report._id} className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row gap-10 hover:border-red-400 transition-all group">
                                <div className="flex-1">
                                    <div className="flex items-center gap-3 mb-6">
                                        <span className={`px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border ${report.status === 'Menunggu Review' ? 'bg-red-50 text-red-600 border-red-100' : report.status === 'Sedang Diproses' ? 'bg-orange-50 text-orange-600 border-orange-100' : 'bg-green-50 text-green-600 border-green-100'}`}>{report.status}</span>
                                        <span className="text-[10px] font-black text-slate-300 uppercase tracking-widest">{new Date(report.createdAt).toLocaleDateString('id-ID')}</span>
                                    </div>
                                    <h4 className="text-xl font-black text-slate-900 mb-2 leading-tight group-hover:text-red-600 transition-colors">{report.title}</h4>
                                    <div className="bg-slate-50 p-6 rounded-3xl mb-8 border border-slate-100">
                                        <p className="text-sm font-medium text-slate-600 leading-relaxed italic">"{report.description}"</p>
                                    </div>
                                    <div className="flex flex-wrap gap-4">
                                        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="w-2 h-2 bg-blue-500 rounded-full"></div><div><p className="text-[8px] font-black text-slate-400 uppercase">Pelapor</p><p className="text-xs font-black text-slate-800">{report.reporterId?.name}</p></div></div>
                                        <div className="bg-white px-4 py-3 rounded-2xl border border-slate-100 shadow-sm flex items-center gap-3"><div className="w-2 h-2 bg-red-500 rounded-full"></div><div><p className="text-[8px] font-black text-slate-400 uppercase">Terlapor</p><p className="text-xs font-black text-slate-800">{report.reportedUserId?.name}</p></div></div>
                                    </div>
                                </div>
                                <div className="w-full md:w-64 flex flex-col gap-4 border-t md:border-t-0 md:border-l border-slate-50 pt-8 md:pt-0 md:pl-10 justify-center">
                                    <div className="bg-slate-50 rounded-[2rem] overflow-hidden aspect-video border-4 border-white shadow-xl relative group/img">
                                        <img src={report.evidenceImage} className="w-full h-full object-cover" alt="Bukti"/>
                                        <button onClick={() => window.open(report.evidenceImage, '_blank')} className="absolute inset-0 bg-black/60 flex items-center justify-center opacity-0 group-hover/img:opacity-100 transition-opacity text-white text-[10px] font-black uppercase tracking-widest gap-2">Zoom Bukti</button>
                                    </div>
                                    <button onClick={() => { setSelectedReport(report); setReportStatus(report.status); setAdminNotes(report.adminNotes || ''); setShowReportModal(true); }} className="w-full py-4 bg-slate-900 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:bg-red-600 transition-all shadow-lg active:scale-95 mt-4">Proses Kasus</button>
                                </div>
                            </div>
                        ))}
                    </div>
                    <Pagination totalItems={reports.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </>
            )}
        </div>
    );
}