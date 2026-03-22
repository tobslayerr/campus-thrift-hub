import { ChevronLeft, ChevronRight } from 'lucide-react';

export default function Pagination({ totalItems, itemsPerPage, currentPage, setCurrentPage }) {
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    if (totalPages <= 1) return null;

    return (
        <div className="flex items-center justify-between border-t border-slate-200 px-4 py-4 mt-4 bg-white rounded-b-2xl">
            <span className="text-xs text-slate-500 font-bold">Halaman {currentPage} dari {totalPages}</span>
            <div className="flex items-center gap-2">
                <button onClick={() => setCurrentPage(p => Math.max(1, p - 1))} disabled={currentPage === 1} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 border border-slate-200"><ChevronLeft size={16}/></button>
                <button onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))} disabled={currentPage === totalPages} className="p-2 bg-slate-50 rounded-lg hover:bg-slate-200 disabled:opacity-50 disabled:cursor-not-allowed text-slate-600 border border-slate-200"><ChevronRight size={16}/></button>
            </div>
        </div>
    );
}