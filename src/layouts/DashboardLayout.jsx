import React, { useState, useEffect } from "react";
import { useLocation, useNavigate, Link, Outlet } from "react-router-dom";
import { LayoutDashboard, CalendarDays, ClipboardList, Users, LogOut, Menu, X, Camera, Check, GraduationCap, HelpCircle, RotateCcw } from "lucide-react";
import { userService } from "../services/firebase";
import { MessageSquare } from 'lucide-react';

export default function DashboardLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  // State Profil Pengguna Aktif (Simulasi admin utama)
  const [currentUser, setCurrentUser] = useState({
    id: 'admin_utama_01', // ID unik dokumen di Firestore koleksi 'users'
    name: 'Administrator Utama',
    avatarUrl: ''
  });
  
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [newUsername, setNewUsername] = useState(currentUser.name);
  const [uploading, setUploading] = useState(false);

  // Mengambil data user aktif dari Firestore saat load
  useEffect(() => {
    // Trik: Jika dihubungkan auth asli, ID ini dinamis. Untuk sekarang, 
    // kita pakai ID tetap agar profil 'Administrator Utama' tersimpan permanen.
    const unsubscribe = userService.subscribeUsers((users) => {
      const activeUser = users.find(u => u.id === currentUser.id);
      if (activeUser) {
        setCurrentUser({
          id: activeUser.id,
          name: activeUser.name,
          avatarUrl: activeUser.avatarUrl || ''
        });
        setNewUsername(activeUser.name);
      }
    });
    return () => unsubscribe();
  }, [currentUser.id]);

  const menuItems = [
    { path: '/', name: 'Dashboard', icon: LayoutDashboard },
    { path: '/schedule', name: 'Jadwal Kuliah', icon: CalendarDays },
    { path: '/tasks', name: 'Tambah Tugas', icon: ClipboardList },
    { path: '/users', name: 'Kelola User', icon: Users },
    { path: '/manage-quizzes', name: 'Kelola Quiz', icon: HelpCircle },
    { path: '/admin/reset-score', name: 'Reset Skor Quiz', icon: RotateCcw },
  ];

  // Fungsi simpan perubahan profil ke Firestore
  const saveProfileChanges = async () => {
    if (!newUsername.trim()) return;
    try {
      await userService.updateUser(currentUser.id, { 
        name: newUsername,
        avatarUrl: currentUser.avatarUrl
      });
      setIsEditingProfile(false);
      alert("Nama berhasil diperbarui di database!");
    } catch (error) {
      alert("Gagal memperbarui profil.");
    }
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      setUploading(true);
      const downloadUrl = await userService.uploadAvatar(currentUser.id, file);
      
      await userService.updateUser(currentUser.id, { 
        name: currentUser.name, 
        avatarUrl: downloadUrl 
      });
      
      alert("Foto profil berhasil diperbarui!");
    } catch (error) {
      alert("Gagal mengunggah foto profil.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col md:flex-row m-0 p-0 box-border text-slate-800">
      {/* Mobile Top Header */}
      <div className="md:hidden w-full bg-white border-b border-slate-100 px-4 py-3 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-2">
          <GraduationCap className="text-indigo-600" size={24} />
          <span className="font-bold text-lg">Classify</span>
        </div>
        <button onClick={() => setIsOpen(!isOpen)} className="p-1 text-slate-600 rounded-lg hover:bg-slate-50">
          {isOpen ? <X size={24} /> : <Menu size={24} />}
        </button>
      </div>

      {/* Kontainer Sidebar Utama */}
      <aside className={`
        fixed inset-y-0 left-0 w-72 bg-white border-r border-slate-200 shadow-sm flex flex-col justify-between z-40
        transform transition-transform duration-200 ease-in-out md:translate-x-0 md:sticky md:h-screen top-0
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="w-full flex flex-col flex-1 overflow-y-auto">
          
          {/* SECTION PROFIL DI ATAS (MENGGANTIKAN LOGO & EDU TASK DASH) */}
          <div className="bg-white border-b border-slate-200 p-6 flex flex-col items-center text-center relative w-full mb-6">
            {/* Avatar Area */}
            <div className="relative w-20 h-20 mb-4 flex-shrink-0">
              <div className="w-full h-full rounded-full bg-indigo-600 flex items-center justify-center text-white font-bold text-2xl overflow-hidden shadow-sm">
                {currentUser.avatarUrl ? (
                  <img src={currentUser.avatarUrl} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  currentUser.name.charAt(0)
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-slate-900 text-white p-2 rounded-full cursor-pointer hover:scale-110 transition-transform shadow-xs">
                <Camera size={14} />
                <input type="file" accept="image/*" onChange={handleAvatarChange} className="hidden" disabled={uploading} />
              </label>
            </div>
            
            {uploading && <span className="text-[10px] text-indigo-600 font-bold animate-pulse mb-1">Uploading...</span>}

            {/* Nama & Edit */}
            {isEditingProfile ? (
              <div className="flex items-center gap-1.5 w-full mt-1">
                <input 
                  type="text" 
                  value={newUsername} 
                  onChange={(e) => setNewUsername(e.target.value)} 
                  className="flex-1 min-w-0 px-3 py-1.5 text-sm border border-slate-200 rounded-lg text-center font-semibold bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
                <button onClick={saveProfileChanges} className="p-2.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 flex-shrink-0">
                  <Check size={14} />
                </button>
              </div>
            ) : (
              <div className="w-full">
                <p className="text-base font-extrabold text-slate-900 truncate px-2">{currentUser.name}</p>
                <button onClick={() => setIsEditingProfile(true)} className="text-[11px] text-indigo-500 hover:underline font-bold mt-1">
                  Ubah Nama
                </button>
              </div>
            )}
          </div>

          {/* Menu Navigasi */}
          <nav className="w-full flex flex-col gap-1 px-6 pb-6">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.path;
              return (
                <Link key={item.path} to={item.path} onClick={() => setIsOpen(false)} className="w-full block">
                  <span className={`w-full flex items-center gap-4 px-4 py-3 rounded-xl text-sm font-semibold transition-all ${
                    isActive ? 'text-indigo-600 bg-indigo-50/70' : 'text-slate-500 hover:bg-slate-50 hover:text-slate-900'
                  }`}>
                    <Icon size={18} className={`${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                    {item.name}
                  </span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Bagian Bawah: Tombol Logout */}
        <div className="px-6 pb-6 mt-auto">
          <button 
            onClick={() => { 
               {
                localStorage.removeItem('currentUser');
                navigate('/login');
              }
            }}
            className="w-full flex items-center gap-4 px-4 py-3.5 rounded-xl text-sm font-semibold text-rose-500 hover:bg-rose-50/50 transition-all border border-transparent hover:border-rose-100"
          >
            <LogOut size={18} />
            Keluar Sistem
          </button>
        </div>
      </aside>

      {/* Konten Utama Aplikasi */}
      <main className="flex-1 min-w-0 bg-slate-50 p-4 md:p-8">
        <Outlet />
      </main>
    </div>
  );
}
