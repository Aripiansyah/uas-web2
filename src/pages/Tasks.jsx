import React, { useState, useEffect } from 'react';
import { 
  Plus, Search, Calendar, User, BookOpen, AlertCircle, 
  Trash2, Edit3, CheckCircle, SlidersHorizontal, Loader2, 
  FileText, Check, ChevronDown, Folder, UserCheck
} from 'lucide-react';
import { taskService, userService } from '../services/firebase';

// Daftar Dosen Tetap sesuai Request
const DOSEN_LIST = [
  "Muhammad Reksa Ariansyah, M.Kom.",
  "Andri Nugraha Ramdhon, S.Kom., M.Kom.",
  "Muhammad Shalahuddin, ST., MT.",
  "Iis Ismawati, S.Kom., M.Kom.",
  "Brian Damastu, M.Kom.",
  "Muchamad Rusdan, ST., MT.",
  "Muhamad Fajar Rizkia, M.Pd."
];

// Daftar Mata Kuliah
const MATKUL_LIST = [
  "Pemrograman Web 2",
  "Android Development Associate (ADA)",
  "Metodologi Penelitian Informatika",
  "Penambangan Data",
  "Pengujian Perangkat Lunak",
  "Sistem Mikrokontroler",
  "Teknik Penulisan Literatur Ilmiah"
];

export default function Tasks() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [users, setUsers] = useState([]);
  
  // Simulasi Akun Pengguna Aktif sebagai Publisher Otomatis
  const currentUser = { name: "Sahrul Aripiansyah" };

  // Form States
  const [isEditing, setIsEditing] = useState(false);
  const [currentTaskId, setCurrentTaskId] = useState(null);
  const [title, setTitle] = useState('');
  const [matkul, setMatkul] = useState('');
  const [lecturer, setLecturer] = useState('');
  const [description, setDescription] = useState('');
  const [deadline, setDeadline] = useState('');
  const [priority, setPriority] = useState('Medium');
  const [status, setStatus] = useState('Belum');
  const [assignedToUsers, setAssignedToUsers] = useState([]); // Track user IDs untuk di-assign
  const [assignAllUsers, setAssignAllUsers] = useState(true); // Default assign ke semua user

  // UI States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterMatkul, setFilterMatkul] = useState('All');
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });
  const [isDosenOpen, setIsDosenOpen] = useState(false);
  const [showUserSelect, setShowUserSelect] = useState(false);

  // --- REALTIME DATA SYNC ---
  useEffect(() => {
    setLoading(true);
    const unsubscribe = taskService.subscribeTasks((fetchedTasks) => {
      setTasks(fetchedTasks);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to users list for assignment
  useEffect(() => {
    const unsubscribe = userService.subscribeUsers((fetchedUsers) => {
      // Filter only non-admin users
      const nonAdminUsers = fetchedUsers.filter(u => u.role !== 'Admin');
      setUsers(nonAdminUsers);
    });
    return () => unsubscribe();
  }, []);

  // --- TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // --- HELPER FUNCTION TO FORMAT PUBLISH TIME ---
  const formatPublishTime = (date) => {
    if (!date) return '-';
    try {
      const publishDate = date instanceof Date ? date : new Date(date);
      const now = new Date();
      const diffMs = now - publishDate;
      const diffMins = Math.floor(diffMs / 60000);
      const diffHours = Math.floor(diffMs / 3600000);
      const diffDays = Math.floor(diffMs / 86400000);
      
      if (diffMins < 1) return 'Baru saja';
      if (diffMins < 60) return `${diffMins}m yang lalu`;
      if (diffHours < 24) return `${diffHours}h yang lalu`;
      if (diffDays < 7) return `${diffDays}d yang lalu`;
      
      return publishDate.toLocaleDateString('id-ID');
    } catch (error) {
      return '-';
    }
  };
  const formatDeadlineWithTime = (deadlineStr) => {
    if (!deadlineStr) return '-';
    try {
      const date = new Date(deadlineStr);
      const options = { 
        day: '2-digit', 
        month: '2-digit', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false
      };
      return date.toLocaleDateString('id-ID', options).replace(',', ' |');
    } catch (error) {
      return deadlineStr;
    }
  };

  // --- CRUD HANDLERS ---
  const resetForm = () => {
    setIsEditing(false);
    setCurrentTaskId(null);
    setTitle('');
    setMatkul('');
    setLecturer('');
    setDescription('');
    setDeadline('');
    setPriority('Medium');
    setStatus('Belum');
    setAssignedToUsers([]);
    setAssignAllUsers(true);
    setShowUserSelect(false);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title || !matkul || !lecturer || !deadline) {
      showToast('Mohon lengkapi seluruh field wajib!', 'error');
      return;
    }

    setSubmitting(true);
    
    // Tentukan assigned users
    let assignedTo = [];
    if (assignAllUsers) {
      // Assign ke semua non-admin users
      assignedTo = users.map(u => u.id);
    } else {
      // Assign ke user tertentu yang dipilih
      assignedTo = assignedToUsers;
    }

    const taskData = {
      title,
      matkul,
      lecturer,
      description,
      deadline,
      priority,
      status,
      publisher: currentUser.name,
      publisherInfo: {
        name: currentUser.name,
        role: 'Admin Akademik',
        avatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + encodeURIComponent(currentUser.name)
      },
      isCompleted: status === 'Selesai',
      assignedTo: assignedTo, // IMPORTANT: tambahkan field ini untuk filter per user
      updatedAt: new Date(),
      createdAt: isEditing ? undefined : new Date()
    };

    try {
      if (isEditing) {
        await taskService.updateTask(currentTaskId, taskData);
        showToast('Tugas berhasil diperbarui dengan user assignment baru!');
      } else {
        await taskService.addTask({ ...taskData, createdAt: new Date() });
        showToast('Tugas baru berhasil dipublikasi dan di-assign ke user!');
      }
      resetForm();
    } catch (error) {
      console.error(error);
      showToast('Terjadi kesalahan integrasi database.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditTrigger = (task) => {
    setIsEditing(true);
    setCurrentTaskId(task.id);
    setTitle(task.title);
    setMatkul(task.matkul || '');
    setLecturer(task.lecturer || '');
    setDescription(task.description || '');
    setDeadline(task.deadline || '');
    setPriority(task.priority || 'Medium');
    setStatus(task.status || 'Belum');
    
    // Restore assigned users
    if (task.assignedTo && task.assignedTo.length > 0) {
      const allUserIds = users.map(u => u.id);
      if (task.assignedTo.length === allUserIds.length) {
        setAssignAllUsers(true);
        setAssignedToUsers([]);
      } else {
        setAssignAllUsers(false);
        setAssignedToUsers(task.assignedTo);
      }
    }
    
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleDelete = async (id) => {
    if (confirm('Apakah Anda yakin ingin menghapus kartu tugas premium ini?')) {
      try {
        await taskService.deleteTask(id);
        showToast('Kartu tugas berhasil dihapus permanen.', 'success');
      } catch (error) {
        showToast('Gagal menghapus data.', 'error');
      }
    }
  };

  // --- ADVANCED SEARCH & FILTER LOGIC ---
  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.title?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          task.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesMatkul = filterMatkul === 'All' || task.matkul === filterMatkul;
    
    return matchesSearch && matchesStatus && matchesPriority && matchesMatkul;
  });

  return (
    <div className="w-full space-y-10 pb-16">
      
      {/* Toast Notification Premium */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 border ${
          toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' : 'bg-rose-50/95 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle size={18} className={toast.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* --- SECTION TITLE --- */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight md:text-3xl">Workspace Manajemen Tugas</h1>
          <p className="text-xs text-slate-400 mt-1 font-medium">Buat, kelola, dan pantau parameter penugasan akademik kelas Anda.</p>
        </div>
        <div className="flex items-center gap-2 bg-white px-4 py-2 border border-slate-100 rounded-xl shadow-2xs">
          <div className="w-2.5 h-2.5 rounded-full bg-indigo-600"></div>
          <span className="text-[11px] font-bold text-slate-500 tracking-wider uppercase">Publisher: {currentUser.name}</span>
        </div>
      </div>

      {/* --- FORM CONTAINER MODERN (GLASSMORPHISM STYLE) --- */}
      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-100/40 overflow-hidden transition-all">
        <div className="bg-slate-900 p-6 text-white flex justify-between items-center">
          <div>
            <h2 className="text-base font-extrabold flex items-center gap-2">
              <FileText size={18} className="text-indigo-400" />
              {isEditing ? 'Editor Spesifikasi Tugas' : 'Buat Kartu Tugas Baru'}
            </h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Seluruh field bertanda wajib disinkronkan langsung ke Cloud Firestore.</p>
          </div>
          {isEditing && (
            <button onClick={resetForm} className="px-3 py-1.5 bg-white/10 hover:bg-white/20 text-white rounded-lg text-xs font-bold transition-all">
              Batalkan Edit
            </button>
          )}
        </div>

        <form onSubmit={handleSubmit} className="p-6 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-6">
          
          {/* Nama Tugas */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Nama / Judul Tugas *</label>
            <div className="relative">
              <FileText className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <input 
                type="text" 
                placeholder="E.g., Analisis Algoritma Sorting Kompleksitas O(n)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all duration-200"
              />
            </div>
          </div>

          {/* Mata Kuliah Dropdown */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Mata Kuliah *</label>
            <div className="relative">
              <Folder className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <select
                value={matkul}
                onChange={(e) => {
                  const nextMatkul = e.target.value;
                  setMatkul(nextMatkul);

                  const idx = MATKUL_LIST.indexOf(nextMatkul);
                  const nextLecturer = idx >= 0 && idx < DOSEN_LIST.length ? DOSEN_LIST[idx] : '';
                  setLecturer(nextLecturer);

                  // tutup dropdown dosen kalau sedang terbuka
                  setIsDosenOpen(false);
                }}
                className="w-full pl-11 pr-10 py-3 bg-slate-50/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all appearance-none cursor-pointer"
              >
                <option value="">Pilih Mata Kuliah Terdaftar</option>
                {MATKUL_LIST.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
              </select>
              <ChevronDown className="absolute right-4 top-3.5 text-slate-400 pointer-events-none" size={16} />
            </div>
          </div>

          {/* CUSTOM DROPDOWN DOSEN (PREMIUM DESIGN) */}
          <div className="space-y-2 relative">
            <label className="text-xs font-bold text-slate-700 block">Dosen Pengampu *</label>
            <button
              type="button"
              onClick={() => setIsDosenOpen(!isDosenOpen)}
              className="w-full flex items-center justify-between pl-11 pr-4 py-3 bg-slate-50/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 bg-white transition-all text-left relative"
            >
              <User className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <span className={lecturer ? 'text-slate-800' : 'text-slate-400'}>
                {lecturer || "Pilih Dosen Pendamping"}
              </span>
              <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${isDosenOpen ? 'rotate-180' : ''}`} />
            </button>

            {isDosenOpen && (
              <div className="absolute left-0 right-0 top-[76px] z-30 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden p-1 animate-fade-in">
                {DOSEN_LIST.map((teacher, index) => (
                  <button
                    key={index}
                    type="button"
                    onClick={() => { setLecturer(teacher); setIsDosenOpen(false); }}
                    className="w-full text-left px-4 py-2.5 text-xs font-semibold rounded-lg text-slate-700 hover:bg-indigo-50 hover:text-indigo-600 transition-all flex items-center justify-between group"
                  >
                    {teacher}
                    {lecturer === teacher && <Check size={14} className="text-indigo-600" />}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Deadline Input */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Batas Waktu / Deadline *</label>
            <div className="relative">
              <Calendar className="absolute left-4 top-3.5 text-slate-400" size={16} />
              <input 
                type="datetime-local" 
                value={deadline}
                onChange={(e) => setDeadline(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-slate-50/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all"
              />
            </div>
          </div>

          {/* Deskripsi Tugas (Textarea Modern Multi-line) */}
          <div className="space-y-2 md:col-span-2">
            <label className="text-xs font-bold text-slate-700 block">Deskripsi Detail Tugas</label>
            <textarea
              rows="4"
              placeholder="Berikan rangkuman instruksi, link referensi dokumen, ketentuan format file (PDF/Zip), dan kriteria penilaian dosen..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 placeholder-slate-400 focus:outline-none focus:border-indigo-500 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 transition-all leading-relaxed"
            ></textarea>
          </div>

          {/* Prioritas Status Selector */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Tingkat Prioritas</label>
            <div className="grid grid-cols-3 gap-2">
              {['Low', 'Medium', 'High'].map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPriority(p)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                    priority === p 
                      ? p === 'High' ? 'bg-rose-50 border-rose-500 text-rose-700 ring-2 ring-rose-500/10' :
                        p === 'Medium' ? 'bg-amber-50 border-amber-500 text-amber-700 ring-2 ring-amber-500/10' :
                        'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/10'
                      : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          {/* Status Penugasan */}
          <div className="space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Status Awal</label>
            <div className="grid grid-cols-2 gap-2">
              {['Belum', 'Selesai'].map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2.5 text-xs font-bold rounded-xl border transition-all ${
                    status === s
                      ? s === 'Selesai' ? 'bg-emerald-50 border-emerald-500 text-emerald-700 ring-2 ring-emerald-500/10' : 'bg-slate-800 border-slate-900 text-white'
                      : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Assign to Users Section */}
          <div className="md:col-span-2 space-y-2">
            <label className="text-xs font-bold text-slate-700 block">Assign ke User</label>
            <div className="flex gap-3">
              {/* Toggle: All Users vs Custom Selection */}
              <button
                type="button"
                onClick={() => {
                  setAssignAllUsers(!assignAllUsers);
                  if (!assignAllUsers) setAssignedToUsers([]);
                }}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  assignAllUsers
                    ? 'bg-indigo-50 border-indigo-500 text-indigo-700 ring-2 ring-indigo-500/10'
                    : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <UserCheck size={14} className="inline mr-2" />
                Semua User
              </button>
              <button
                type="button"
                onClick={() => setAssignAllUsers(false)}
                className={`flex-1 py-3 px-4 rounded-xl border text-xs font-bold transition-all ${
                  !assignAllUsers
                    ? 'bg-violet-50 border-violet-500 text-violet-700 ring-2 ring-violet-500/10'
                    : 'bg-slate-50/50 border-slate-100 text-slate-500 hover:bg-slate-50'
                }`}
              >
                <User size={14} className="inline mr-2" />
                Pilih User
              </button>
            </div>

            {/* Custom User Selection */}
            {!assignAllUsers && (
              <div className="relative">
                <button
                  type="button"
                  onClick={() => setShowUserSelect(!showUserSelect)}
                  className="w-full flex items-center justify-between pl-4 pr-4 py-3 bg-slate-50/60 border border-slate-200/80 rounded-xl text-xs font-semibold text-slate-800 hover:bg-white transition-all text-left"
                >
                  <span className="text-slate-600">
                    {assignedToUsers.length === 0 
                      ? 'Belum ada user dipilih'
                      : `${assignedToUsers.length} user dipilih`}
                  </span>
                  <ChevronDown size={16} className={`text-slate-400 transition-transform duration-200 ${showUserSelect ? 'rotate-180' : ''}`} />
                </button>

                {showUserSelect && (
                  <div className="absolute left-0 right-0 top-[52px] z-30 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden p-1 max-h-40 overflow-y-auto">
                    {users.length === 0 ? (
                      <div className="px-4 py-2 text-xs text-slate-500">Tidak ada user tersedia</div>
                    ) : (
                      users.map(user => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => {
                            setAssignedToUsers(prev =>
                              prev.includes(user.id)
                                ? prev.filter(id => id !== user.id)
                                : [...prev, user.id]
                            );
                          }}
                          className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-all rounded-lg flex items-center gap-2 ${
                            assignedToUsers.includes(user.id)
                              ? 'bg-violet-100 text-violet-700'
                              : 'hover:bg-slate-100 text-slate-700'
                          }`}
                        >
                          <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                            assignedToUsers.includes(user.id)
                              ? 'bg-violet-500 border-violet-500'
                              : 'border-slate-300'
                          }`}>
                            {assignedToUsers.includes(user.id) && <Check size={12} className="text-white" />}
                          </div>
                          <span className="flex-1">{user.name} ({user.nim})</span>
                        </button>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Form Actions Buttons */}
          <div className="md:col-span-2 pt-4 flex justify-end gap-3 border-t border-slate-100">
            <button
              type="button"
              onClick={resetForm}
              className="px-6 py-3 rounded-xl border border-slate-200 text-xs font-bold text-slate-600 hover:bg-slate-50 active:scale-98 transition-all"
            >
              Reset Input
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 text-white text-xs font-bold shadow-md shadow-indigo-200 flex items-center gap-2 active:scale-98 transition-all disabled:opacity-50"
            >
              {submitting ? <Loader2 size={14} className="animate-spin" /> : <Plus size={14} />}
              {isEditing ? 'Simpan Pembaruan Data' : 'Publish ke Dashboard'}
            </button>
          </div>
        </form>
      </div>

      {/* --- LIVE WORKSPACE LIST FILTER & SEARCH --- */}
      <div className="space-y-5">
        <div className="flex flex-col lg:flex-row justify-between lg:items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100/80 shadow-xs">
          
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
            <input
              type="text"
              placeholder="Cari tugas berdasarkan judul atau deskripsi..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Dynamic Interactive Filters */}
          <div className="flex flex-wrap items-center gap-2">
            <div className="flex items-center gap-1.5 text-slate-400 text-xs font-bold mr-1 bg-slate-50 p-2 rounded-xl">
              <SlidersHorizontal size={13} />
              <span>Filter Workspace:</span>
            </div>

            {/* Matkul Filter */}
            <select
              value={filterMatkul}
              onChange={(e) => setFilterMatkul(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Matkul</option>
              {MATKUL_LIST.map((m, idx) => <option key={idx} value={m}>{m}</option>)}
            </select>

            {/* Priority Filter */}
            <select
              value={filterPriority}
              onChange={(e) => setFilterPriority(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Prioritas</option>
              <option value="High">High</option>
              <option value="Medium">Medium</option>
              <option value="Low">Low</option>
            </select>

            {/* Status Filter */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="px-3 py-2 bg-slate-50/80 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none focus:border-indigo-500 cursor-pointer"
            >
              <option value="All">Semua Status</option>
              <option value="Belum">Belum Selesai</option>
              <option value="Selesai">Selesai</option>
            </select>
          </div>
        </div>

        {/* --- PREMIUM KARTU GRID GRID LAYOUT --- */}
        {loading ? (
          <div className="w-full flex flex-col items-center justify-center py-20 gap-3 text-slate-400">
            <Loader2 size={36} className="animate-spin text-indigo-500" />
            <p className="text-xs font-bold">Sinkronisasi Database Firestore...</p>
          </div>
        ) : filteredTasks.length === 0 ? (
          // Empty State Premium
          <div className="bg-white border border-dashed border-slate-200/80 p-16 rounded-3xl text-center shadow-2xs max-w-xl mx-auto flex flex-col items-center">
            <div className="w-16 h-16 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-2xs">
              <AlertCircle size={28} />
            </div>
            <h3 className="text-base font-extrabold text-slate-800">Tidak Ada Tugas Ditemukan</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">Workspace kosong. Ubah parameter filter pencarian atau buat dokumen kartu tugas baru di form atas.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {filteredTasks.map((task) => {
              const isHigh = task.priority === 'High';
              const isMed = task.priority === 'Medium';
              const isDone = task.status === 'Selesai';
              
              return (
                <div 
                  key={task.id}
                  className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${
                    isDone ? 'border-emerald-100 bg-emerald-50/5' : 'border-slate-100/80'
                  }`}
                >
                  {/* Penanda Garis Kiri Sesuai Prioritas */}
                  <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                    isDone ? 'bg-emerald-500' : isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-emerald-400'
                  }`} />

                  <div>
                    {/* Header Card: Meta Matkul & Badges */}
                    <div className="flex items-center justify-between gap-2 mb-3">
                      <span className="text-[10px] font-extrabold px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md tracking-wide max-w-[150px] truncate">
                        {task.matkul}
                      </span>
                      <div className="flex items-center gap-1 flex-shrink-0">
                        {/* Badge Priority */}
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                          isHigh ? 'bg-rose-100 text-rose-700' : isMed ? 'bg-amber-100 text-amber-700' : 'bg-emerald-100 text-emerald-700'
                        }`}>
                          {task.priority}
                        </span>
                        {/* Badge Status */}
                        <span className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-sm ${
                          isDone ? 'bg-emerald-600 text-white' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {task.status}
                        </span>
                      </div>
                    </div>

                    {/* Judul Utama Tugas */}
                    <h3 className={`text-sm font-extrabold text-slate-800 leading-snug tracking-tight group-hover:text-indigo-600 transition-colors ${isDone ? 'line-through text-slate-400' : ''}`}>
                      {task.title}
                    </h3>

                    {/* Rangkuman Deskripsi Singkat */}
                    <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed font-medium">
                      {task.description || "Tidak ada rincian spesifikasi instruksi tambahan."}
                    </p>

                    {/* Meta Detail Pengampu & Waktu */}
                    <div className="bg-slate-50/80 border border-slate-100 rounded-xl p-3 mt-4 space-y-2 text-[11px] text-slate-500 font-semibold">
                      <div className="flex items-center gap-2 truncate">
                        <UserCheck size={13} className="text-slate-400 flex-shrink-0" />
                        <span className="truncate">Dosen: <strong className="text-slate-700 font-bold">{task.lecturer}</strong></span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar size={13} className="text-slate-400 flex-shrink-0" />
                        <span>Deadline: <strong className={isHigh && !isDone ? 'text-rose-600 font-bold' : 'text-slate-700 font-bold'}>{formatDeadlineWithTime(task.deadline)}</strong></span>
                      </div>
                    </div>
                  </div>

                  {/* Bagian Footer Card: Info Publisher dengan Avatar */}
                  <div className="border-t border-slate-100/80 pt-3 mt-4 flex items-center justify-between gap-3">
                    {/* Publisher Info */}
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      {/* Avatar Publisher */}
                      <div className="w-9 h-9 rounded-full overflow-hidden border-2 border-slate-200 shadow-xs flex-shrink-0 bg-slate-100">
                        {task.publisherInfo?.avatar ? (
                          <img 
                            src={task.publisherInfo.avatar} 
                            alt={task.publisherInfo.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.target.style.display = 'none';
                              e.target.nextSibling.style.display = 'flex';
                            }}
                          />
                        ) : null}
                        <div style={{ display: task.publisherInfo?.avatar ? 'none' : 'flex' }} className="w-full h-full items-center justify-center bg-gradient-to-br from-indigo-400 to-purple-400 text-white text-xs font-bold">
                          {task.publisherInfo?.name?.charAt(0) || 'A'}
                        </div>
                      </div>
                      
                      {/* Publisher Details */}
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] font-bold text-slate-700 truncate">
                          {task.publisherInfo?.name || task.publisher || 'Admin'}
                        </div>
                        <div className="text-[9px] text-slate-400 font-medium">
                          {task.publisherInfo?.role || 'Admin'} • {formatPublishTime(task.createdAt)}
                        </div>
                      </div>
                    </div>
                    
                    {/* CRUD Action Buttons */}
                    <div className="flex items-center gap-1 flex-shrink-0">
                      {/* Button Edit */}
                      <button
                        onClick={() => handleEditTrigger(task)}
                        className="p-1.5 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-all"
                        title="Ubah Rincian Tugas"
                      >
                        <Edit3 size={13} />
                      </button>
                      {/* Button Delete */}
                      <button
                        onClick={() => handleDelete(task.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-all"
                        title="Hapus Permanen"
                      >
                        <Trash2 size={13} />
                      </button>
                    </div>
                  </div>

                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
