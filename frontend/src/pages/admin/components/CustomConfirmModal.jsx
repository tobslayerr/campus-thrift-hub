import { AlertCircle, HelpCircle } from 'lucide-react';

export default function CustomConfirmModal({ dialog, closeConfirm }) {
    if (!dialog.isOpen) return null;

    return (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-[2rem] p-8 max-w-sm w-full shadow-2xl border border-slate-100 animate-in zoom-in-95 duration-300">
                <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto ${dialog.isDanger ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-[#00478F]'}`}>
                    {dialog.isDanger ? <AlertCircle size={32} /> : <HelpCircle size={32} />}
                </div>
                <h2 className="text-xl font-black text-slate-900 text-center mb-2">{dialog.title}</h2>
                <p className="text-sm font-medium text-slate-500 text-center mb-8 leading-relaxed">{dialog.message}</p>
                <div className="flex gap-3">
                    <button onClick={closeConfirm} className="flex-1 py-3 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors">Batal</button>
                    <button 
                        onClick={() => { dialog.onConfirm(); closeConfirm(); }} 
                        className={`flex-1 py-3 text-white rounded-xl font-black shadow-lg hover:-translate-y-0.5 transition-all ${dialog.isDanger ? 'bg-red-500 shadow-red-500/20 hover:bg-red-600' : 'bg-[#00478F] shadow-[#00478F]/20 hover:bg-slate-900'}`}
                    >
                        Ya, Lanjutkan
                    </button>
                </div>
            </div>
        </div>
    );
}