import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, User, Shield, CheckCircle, X, 
  Trash2, Edit3, Loader2, Key, Eye, EyeOff, 
  Filter, AlertTriangle, UserCheck, UserX, IdCard
} from 'lucide-react';
import { userService } from '../services/firebase';

export default function Users() {
  // --- STATE MANAGEMENT ---
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [currentUserId, setCurrentUserId] = useState(null);
  const [name, setName] = useState('');
  const [nim, setNim] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('User');
  const [status, setStatus] = useState('Active');
  
  // Password UI States
  const [showPassword, setShowPassword] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState({ score: 0, label: '', color: 'bg-slate-200' });

  // UI Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // --- REALTIME DATA SYNC ---
  useEffect(() => {
    setLoading(true);
    const unsubscribe = userService.subscribeUsers((fetchedUsers) => {
      setUsers(fetchedUsers);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // --- PASSWORD STRENGTH VALIDATOR ---
  const checkPasswordStrength = (val) => {
    setPassword(val);
    if (!val) {
      setPasswordStrength({ score: 0, label: '', color: 'bg-slate-200' });
      return;
    }
    
    let score = 0;
    if (val.length >= 6) score++;
    if (/[A-Z]/.test(val) && /[0-9]/.test(val)) score++;
    if (/[^A-Za-z0-9]/.test(val)) score++;

    if (score <= 1) {
      setPasswordStrength({ score: 33, label: 'Weak', color: 'bg-rose-500' });
    } else if (score === 2) {
      setPasswordStrength({ score: 66, label: 'Medium', color: 'bg-amber-500' });
    } else {
      setPasswordStrength({ score: 100, label: 'Strong', color: 'bg-emerald-500' });
    }
  };

  // --- TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // --- CRUD HANDLERS ---
  const openAddModal = () => {
    setIsEditing(false);
    setCurrentUserId(null);
    setName('');
    setNim('');
    setPassword('');
    setRole('User');
    setStatus('Active');
    setPasswordStrength({ score: 0, label: '', color: 'bg-slate-200' });
    setIsModalOpen(true);
  };

  const openEditModal = (user) => {
    setIsEditing(true);
    setCurrentUserId(user.id);
    setName(user.name || '');
    setNim(user.nim || '');
    setPassword(user.password || ''); // Menampilkan password jika tersimpan di DB
    setRole(user.role || 'User');
    setStatus(user.status || 'Active');
    checkPasswordStrength(user.password || '');
    setIsModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!name || !nim || !password) {
      showToast('Mohon lengkapi data profil, NIM, dan Password!', 'error');
      return;
    }

    setSubmitting(true);
    const userData = {
      name,
      nim,
      password,
      role,
      status,
      avatarUrl: `https://api.dicebear.com/7.x/adventurer/svg?seed=${nim}`, // Avatar otomatis estetik berdasarkan NIM
      updatedAt: new Date()
    };

    try {
      if (isEditing) {
        await userService.updateUser(currentUserId, userData);
        showToast('Data user berhasil diperbarui secara premium!');
      } else {
        await userService.addUser({ ...userData, createdAt: new Date() });
        showToast('User baru berhasil didaftarkan ke sistem SaaS!');
      }
      setIsModalOpen(false);
    } catch (error) {
      console.error(error);
      showToast('Gagal memproses data ke Firebase.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, userName) => {
    if (confirm(`Apakah Anda yakin ingin menghapus akun milik "${userName}" secara permanen?`)) {
      try {
        await userService.deleteUser(id);
        showToast('Akun pengguna berhasil dihapus dari basis data.', 'success');
      } catch (error) {
        showToast('Gagal menghapus pengguna.', 'error');
      }
    }
  };

  // --- SEARCH & FILTER LOGIC ---
  const filteredUsers = users.filter(user => {
    const userName = user?.name ? String(user.name).toLowerCase() : '';
    const userNim = user?.nim ? String(user.nim).toLowerCase() : '';
    const search = searchTerm.toLowerCase();
    
    const matchesSearch = userName.includes(search) || userNim.includes(search);
    const matchesRole = filterRole === 'All' || user.role === filterRole;
    const matchesStatus = filterStatus === 'All' || user.status === filterStatus;

    return matchesSearch && matchesRole && matchesStatus;
  });

  return (
    <div className="w-full space-y-8 pb-12 animate-fade-in">
      
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border ${
          toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' : 'bg-rose-50/95 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle size={18} className={toast.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* --- TOP HEADER --- */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight md:text-3xl">Kelola Pengguna</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Otorisasi hak akses, manajemen kredensial password, dan monitoring status user.</p>
        </div>
        <button
          onClick={openAddModal}
          className="px-5 py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-xl text-xs font-bold shadow-md shadow-indigo-100 flex items-center gap-2 active:scale-98 transition-all"
        >
          <Plus size={16} />
          Tambah Pengguna
        </button>
      </div>

      {/* --- CONTROLS: SEARCH & FILTER --- */}
      <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari berdasarkan nama atau NIM mahasiswa..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mr-1 bg-slate-50 p-2 rounded-xl">
            <Filter size={13} />
            <span>Filter Kategori:</span>
          </div>

          <select
            value={filterRole}
            onChange={(e) => setFilterRole(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Semua Role</option>
            <option value="Admin">Admin</option>
            <option value="User">User</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500"
          >
            <option value="All">Semua Status</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
          </select>
        </div>
      </div>

      {/* --- DATA TABLE CONTAINER --- */}
      {loading ? (
        <div className="w-full flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-xs font-bold">Sinkronisasi Pengguna Firestore...</p>
        </div>
      ) : filteredUsers.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 p-16 rounded-3xl text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <AlertTriangle size={24} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Data User Tidak Ditemukan</h3>
          <p className="text-xs text-slate-400 mt-1">Silakan sesuaikan filter kata kunci pencarian Anda atau tambahkan user baru.</p>
        </div>
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-100 text-slate-500 text-[11px] font-bold tracking-wider uppercase">
                  <th className="py-4 px-6">Identitas Pengguna</th>
                  <th className="py-4 px-6">Nomor Induk (NIM)</th>
                  <th className="py-4 px-6">Role Tersemat</th>
                  <th className="py-4 px-6">Status Akun</th>
                  <th className="py-4 px-6 text-right">Aksi Manajemen</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50 text-xs font-medium text-slate-700">
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/80 transition-colors group">
                    {/* Identitas / Avatar */}
                    <td className="py-4 px-6 flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-slate-100 border border-slate-200/60 overflow-hidden flex-shrink-0">
                        <img 
                          src={user.avatarUrl || `https://api.dicebear.com/7.x/adventurer/svg?seed=${user.nim}`} 
                          alt="avatar" 
                          className="w-full h-full object-cover"
                        />
                      </div>
                      <div>
                        <div className="font-bold text-slate-800 group-hover:text-indigo-600 transition-colors">
                          {user.name || 'User Tanpa Nama'}
                        </div>
                        <div className="text-[10px] text-slate-400 font-semibold flex items-center gap-1 mt-0.5">
                          <Key size={10} /> Password Terenkripsi
                        </div>
                      </div>
                    </td>

                    {/* NIM */}
                    <td className="py-4 px-6 font-mono text-slate-600 font-semibold">{user.nim || '-'}</td>

                    {/* Role Badge */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-1 rounded-lg text-[10px] font-black tracking-wide uppercase flex items-center gap-1.5 w-max ${
                        user.role === 'Admin' ? 'bg-purple-50 text-purple-700 border border-purple-100' : 'bg-blue-50 text-blue-700 border border-blue-100'
                      }`}>
                        <Shield size={11} />
                        {user.role || 'User'}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-4 px-6">
                      <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 w-max ${
                        user.status === 'Active' ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                      }`}>
                        {user.status === 'Active' ? <UserCheck size={11} /> : <UserX size={11} />}
                        {user.status || 'Active'}
                      </span>
                    </td>

                    {/* Action Buttons */}
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => openEditModal(user)}
                          className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-all"
                          title="Edit User"
                        >
                          <Edit3 size={14} />
                        </button>
                        <button
                          onClick={() => handleDelete(user.id, user.name)}
                          className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                          title="Hapus Akun"
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- MODAL POPUP MODERN (BACKDROP BLUR GLASSMORPHISM) --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-3xl border border-slate-100 shadow-2xl overflow-hidden transform transition-all scale-100 max-h-[90vh] overflow-y-auto">
            
            {/* Header Modal */}
            <div className="bg-linear-to-r from-slate-900 to-indigo-950 p-5 text-white flex justify-between items-center">
              <div>
                <h3 className="text-sm font-black flex items-center gap-2">
                  <User size={16} className="text-blue-400" />
                  {isEditing ? 'Perbarui Akses Akun' : 'Daftarkan Akun Baru'}
                </h3>
                <p className="text-[10px] text-slate-400 mt-0.5">Lengkapi form konfigurasi otorisasi data internal.</p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg transition-colors text-slate-300"
              >
                <X size={16} />
              </button>
            </div>

            {/* Form Modal */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              
              {/* Input Nama */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nama Lengkap *</label>
                <div className="relative">
                  <User className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="E.g., Sahrul Aripiansyah"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                </div>
              </div>

              {/* Input NIM */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Nomor Induk Mahasiswa (NIM) *</label>
                <div className="relative">
                  <IdCard className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  <input
                    type="text"
                    placeholder="E.g., 23552011001"
                    value={nim}
                    onChange={(e) => setNim(e.target.value)}
                    className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all font-mono"
                  />
                </div>
              </div>

              {/* INPUT PASSWORD MODERN & VALIDATOR */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Kredensial Password *</label>
                <div className="relative">
                  <Key className="absolute left-3.5 top-3 text-slate-400" size={15} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Masukkan sandi akses pengguna..."
                    value={password}
                    onChange={(e) => checkPasswordStrength(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200/80 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-3 text-slate-400 hover:text-slate-600 transition-colors"
                  >
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                
                {/* Strength Indicator Gauge */}
                {password && (
                  <div className="space-y-1 pt-1 animate-fade-in">
                    <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className={`h-full transition-all duration-300 ${passwordStrength.color}`}
                        style={{ width: `${passwordStrength.score}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-[9px] font-black tracking-wide uppercase">
                      <span className="text-slate-400">Security Strength:</span>
                      <span style={{
                        color: passwordStrength.label === 'Strong' ? '#10b981' : passwordStrength.label === 'Medium' ? '#f59e0b' : '#f43f5e'
                      }}>{passwordStrength.label}</span>
                    </div>
                  </div>
                )}
              </div>

              {/* Select Role */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Hak Akses / Role</label>
                <div className="grid grid-cols-2 gap-2">
                  {['User', 'Admin'].map((r) => (
                    <button
                      key={r}
                      type="button"
                      onClick={() => setRole(r)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        role === r 
                          ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/10' 
                          : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {r}
                    </button>
                  ))}
                </div>
              </div>

              {/* Select Status */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 block">Status Akun</label>
                <div className="grid grid-cols-2 gap-2">
                  {['Active', 'Inactive'].map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setStatus(s)}
                      className={`py-2 text-xs font-bold rounded-xl border transition-all ${
                        status === s
                          ? s === 'Active' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/10' : 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/10'
                          : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                      }`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-4 flex justify-end gap-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-bold text-slate-500 hover:bg-slate-50 transition-all"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className={`px-6 py-2.5 rounded-xl text-white text-xs font-bold shadow-md flex items-center gap-2 transition-all disabled:opacity-50 ${
                    isEditing 
                      ? 'bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 shadow-amber-100' 
                      : 'bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 shadow-emerald-100'
                  }`}
                >
                  {submitting ? <Loader2 size={13} className="animate-spin" /> : <CheckCircle size={13} />}
                  {isEditing ? 'Update User' : 'Add User'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}