import { useState } from 'react';
import { Search } from 'lucide-react';
import Pagination from './Pagination';

export default function TabUsers({ users, currentPage, setCurrentPage, itemsPerPage, handleUnban, setSelectedUser, setShowBanModal }) {
    
    // State Filter Lokal untuk Kampus
    const [campusFilterText, setCampusFilterText] = useState('');

    // Logika Pemfilteran
    const filteredUsers = campusFilterText.trim() === '' 
        ? users 
        : users.filter(u => u.campus.toLowerCase().includes(campusFilterText.toLowerCase()));

    const displayedUsers = filteredUsers.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

    return (
        <div className="space-y-4 animate-in fade-in duration-500">
            {/* Input Pencarian Kampus Khusus Admin */}
            <div className="bg-white p-3 rounded-[1.5rem] border border-slate-200 flex items-center w-full max-w-sm shadow-sm">
                <Search size={18} className="text-slate-400 ml-3 mr-2" />
                <input 
                    type="text" 
                    placeholder="Filter berdasarkan kampus..." 
                    value={campusFilterText}
                    onChange={(e) => { setCampusFilterText(e.target.value); setCurrentPage(1); }}
                    className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-slate-700"
                />
            </div>

            <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                        <thead>
                            <tr className="bg-slate-50 text-[9px] uppercase tracking-[0.25em] text-slate-400 border-b border-slate-100 font-black">
                                <th className="p-6 pl-10">Identitas Pengguna</th>
                                <th className="p-6">Asal Kampus</th>
                                <th className="p-6 text-center">Status Akun</th>
                                <th className="p-6 text-center">Aksi Otoritas</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 font-sans">
                            {displayedUsers.length === 0 && <tr><td colSpan="4" className="p-12 text-center text-slate-300 font-black uppercase tracking-widest">Data Tidak Ditemukan</td></tr>}
                            {displayedUsers.map(u => (
                                <tr key={u._id} className="hover:bg-slate-50/50 transition-colors">
                                    <td className="p-6 pl-10">
                                        <div className="flex items-center gap-4">
                                            <img src={u.profilePicture || `https://ui-avatars.com/api/?name=${u.name}&background=f1f5f9&color=00478F`} className="w-11 h-11 rounded-full object-cover border-2 border-white shadow-sm" alt="avatar"/>
                                            <div>
                                                <p className="font-black text-sm text-slate-800 leading-tight">{u.name}</p>
                                                <p className="text-[11px] font-bold text-slate-400">{u.email}</p>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="p-6 text-[11px] font-black text-slate-500 uppercase tracking-widest">{u.campus}</td>
                                    <td className="p-6 text-center">
                                        {u.isBanned ? (
                                            <span className="bg-red-50 text-red-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-red-100">Banned</span>
                                        ) : (
                                            <span className="bg-green-50 text-green-600 px-3 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest border border-green-100">Aktif</span>
                                        )}
                                    </td>
                                    <td className="p-6 text-center">
                                        {u.isBanned ? (
                                            <button onClick={() => handleUnban(u._id)} className="bg-[#00478F] text-white px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-slate-900 transition-all shadow-md">Pulihkan</button>
                                        ) : (
                                            <button onClick={() => { setSelectedUser(u); setShowBanModal(true); }} className="bg-red-50 text-red-500 border border-red-100 px-5 py-2.5 rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Blokir</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                <Pagination totalItems={filteredUsers.length} itemsPerPage={itemsPerPage} currentPage={currentPage} setCurrentPage={setCurrentPage} />
            </div>
        </div>
    );
}