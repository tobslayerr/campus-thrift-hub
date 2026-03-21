/* eslint-disable no-unused-vars */
import { useState, useEffect } from 'react';
import api from '../../api/axios';
import toast from 'react-hot-toast';
import { Tags, Plus, Trash2, LayoutDashboard } from 'lucide-react';

export default function Dashboard() {
    const [activeTab, setActiveTab] = useState('kategori');
    const [categories, setCategories] = useState([]);
    const [newCategory, setNewCategory] = useState('');
    const [loading, setLoading] = useState(true);

    const fetchCategories = async () => {
        try {
            const res = await api.get('/categories');
            setCategories(res.data.data);
        } catch (error) {
            toast.error("Gagal memuat kategori");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchCategories();
    }, []);

    const handleAddCategory = async (e) => {
        e.preventDefault();
        if (!newCategory.trim()) return;
        
        const toastId = toast.loading('Menambahkan kategori...');
        try {
            await api.post('/categories', { name: newCategory });
            toast.success('Kategori berhasil ditambahkan!', { id: toastId });
            setNewCategory('');
            fetchCategories();
        } catch (error) {
            toast.error('Gagal menambah kategori', { id: toastId });
        }
    };

    const handleDeleteCategory = async (id) => {
        if (!window.confirm('Yakin ingin menghapus kategori ini?')) return;
        
        const toastId = toast.loading('Menghapus...');
        try {
            await api.delete(`/categories/${id}`);
            toast.success('Kategori dihapus!', { id: toastId });
            fetchCategories();
        } catch (error) {
            toast.error('Gagal menghapus kategori', { id: toastId });
        }
    };

    if (loading) return <div className="text-center mt-20 font-black animate-pulse">Memuat Panel Admin...</div>;

    return (
        <div className="max-w-6xl mx-auto p-6 md:p-10 pb-32">
            <h1 className="text-3xl font-black text-slate-900 mb-8 flex items-center gap-3">
                <LayoutDashboard className="text-[#00478F]" size={32} /> Admin Control Panel
            </h1>

            {/* TAB NAVIGASI */}
            <div className="flex gap-4 border-b border-slate-200 mb-8">
                <button 
                    onClick={() => setActiveTab('kategori')}
                    className={`pb-4 font-black text-lg flex items-center gap-2 ${activeTab === 'kategori' ? 'text-[#00478F] border-b-4 border-[#FF9500]' : 'text-slate-400'}`}
                >
                    <Tags size={20} /> Manajemen Kategori
                </button>
                {/* Kamu bisa menambahkan tab Pengguna/Transaksi di sini nantinya */}
            </div>

            {/* TAB CONTENT: KATEGORI */}
            {activeTab === 'kategori' && (
                <div className="grid grid-cols-1 md:grid-cols-12 gap-8">
                    <div className="md:col-span-4">
                        <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 sticky top-24">
                            <h3 className="font-black text-slate-800 mb-4">Tambah Kategori Baru</h3>
                            <form onSubmit={handleAddCategory} className="space-y-4">
                                <input 
                                    type="text" 
                                    placeholder="Contoh: Sepatu" 
                                    value={newCategory}
                                    onChange={(e) => setNewCategory(e.target.value)}
                                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl font-bold focus:ring-2 focus:ring-[#FF9500] outline-none"
                                />
                                <button type="submit" disabled={!newCategory.trim()} className="w-full bg-[#00478F] text-white font-black py-3 rounded-xl hover:bg-[#FF9500] transition-colors flex items-center justify-center gap-2 disabled:opacity-50">
                                    <Plus size={18} /> Tambahkan
                                </button>
                            </form>
                        </div>
                    </div>

                    <div className="md:col-span-8">
                        <div className="bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100">
                            <h3 className="font-black text-slate-800 mb-6">Daftar Kategori Aktif</h3>
                            {categories.length === 0 ? (
                                <p className="text-slate-400 font-medium text-center py-10 border-2 border-dashed rounded-2xl">Belum ada kategori.</p>
                            ) : (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                    {categories.map((cat) => (
                                        <div key={cat._id} className="bg-slate-50 p-4 rounded-2xl flex items-center justify-between group border border-transparent hover:border-[#FF9500] transition-colors">
                                            <span className="font-bold text-slate-700">{cat.name}</span>
                                            <button onClick={() => handleDeleteCategory(cat._id)} className="text-slate-300 hover:text-red-500 transition-colors bg-white p-2 rounded-lg shadow-sm">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}