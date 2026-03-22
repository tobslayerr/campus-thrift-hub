import { Plus, Tags, Edit2, Trash2, Check, X } from 'lucide-react';
import Pagination from './Pagination';

export default function TabCategories({
    categories, newCategory, setNewCategory, handleAddCategory,
    editingId, setEditingId, editName, setEditName, saveEdit, handleDeleteCategory,
    currentPage, setCurrentPage, itemsPerPage
}) {
    const displayedCategories = categories.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 animate-in slide-in-from-bottom-4 duration-500">
            <div className="md:col-span-4">
                <div className="bg-white p-8 rounded-[2.5rem] shadow-sm border border-slate-100 sticky top-24">
                    <h3 className="font-black text-slate-800 mb-8 flex items-center gap-3 text-lg"><Plus size={24} className="text-[#FF9500]" /> Kategori Baru</h3>
                    <form onSubmit={handleAddCategory} className="space-y-6">
                        <input type="text" placeholder="Nama Kategori" value={newCategory} onChange={e=>setNewCategory(e.target.value)} className="w-full p-4 bg-slate-50 border border-transparent rounded-2xl font-bold text-sm focus:bg-white focus:border-[#00478F] outline-none transition-all shadow-inner" />
                        <button type="submit" disabled={!newCategory.trim()} className="w-full bg-[#00478F] text-white font-black py-5 rounded-[1.5rem] hover:bg-slate-900 transition-all uppercase tracking-widest text-[10px] shadow-lg disabled:opacity-50">Tambahkan</button>
                    </form>
                </div>
            </div>
            <div className="md:col-span-8">
                <div className="bg-white p-8 md:p-12 rounded-[2.5rem] shadow-sm border border-slate-100 min-h-[500px]">
                    <h3 className="font-black text-slate-800 mb-10 flex items-center gap-3 text-lg"><Tags size={24} className="text-[#00478F]" /> Koleksi Kategori</h3>
                    <div className="grid sm:grid-cols-2 gap-4">
                        {displayedCategories.map((cat) => (
                            <div key={cat._id} className="bg-slate-50 p-5 rounded-[1.5rem] flex items-center justify-between group border border-transparent hover:border-[#FF9500] hover:bg-white transition-all">
                                {editingId === cat._id ? (
                                    <div className="flex gap-2 w-full animate-in zoom-in-95">
                                        <input autoFocus type="text" value={editName} onChange={e=>setEditName(e.target.value)} className="flex-1 px-4 py-2 border-2 border-[#FF9500] rounded-xl font-bold outline-none text-sm" />
                                        <button onClick={() => saveEdit(cat._id)} className="p-2 bg-green-500 text-white rounded-xl shadow-md"><Check size={20}/></button>
                                        <button onClick={()=>setEditingId(null)} className="p-2 bg-slate-200 text-slate-600 rounded-xl"><X size={20}/></button>
                                    </div>
                                ) : (
                                    <>
                                        <span className="font-black text-slate-700 tracking-tight">{cat.name}</span>
                                        <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                            <button onClick={() => {setEditingId(cat._id); setEditName(cat.name);}} className="text-blue-500 bg-white shadow-sm p-2.5 rounded-xl hover:bg-blue-500 hover:text-white transition-all"><Edit2 size={16}/></button>
                                            <button onClick={() => handleDeleteCategory(cat._id)} className="text-red-500 bg-white shadow-sm p-2.5 rounded-xl hover:bg-red-500 hover:text-white transition-all"><Trash2 size={16}/></button>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    <Pagination totalItems={categories.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
                </div>
            </div>
        </div>
    );
}