import React, { useState, useEffect } from 'react';
import {
  Search, Calendar, User, BookOpen, AlertCircle,
  CheckCircle, SlidersHorizontal, Loader2,
  Clock, Zap, Flag, TrendingUp
} from 'lucide-react';
import { taskService, userService } from '../services/firebase';

export default function UserTaskList() {
  // --- STATE MANAGEMENT ---
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState(null);

  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [sortBy, setSortBy] = useState('deadline'); // deadline, priority, newest

  // --- GET CURRENT USER & LOAD TASKS ---
  useEffect(() => {
    // Ambil user dari localStorage atau context (sesuaikan dengan auth Anda)
    const storedUser = localStorage.getItem('currentUser');
    if (storedUser) {
      const user = JSON.parse(storedUser);
      setCurrentUser(user);
    }
    setLoading(false);
  }, []);

  // --- LOAD TASKS ---
  useEffect(() => {
    setLoading(true);
    const unsubscribe = taskService.subscribeTasks((fetchedTasks) => {
      // Filter tasks yang di-assign ke current user atau ke semua user
      const userId = currentUser?.uid || currentUser?.id;

      const userTasks = fetchedTasks.filter(task => {
        if (!task.assignedTo) return false;
        if (!Array.isArray(task.assignedTo)) return false;

        const assignedToMatch = userId ? task.assignedTo.includes(userId) : false;

        // Jika assignedTo kosong => berarti task untuk semua user
        return assignedToMatch || task.assignedTo.length === 0;
      });

      setTasks(userTasks);
      setLoading(false);
    });
    return () => unsubscribe();
  }, [currentUser]);

  // --- HELPER FUNCTIONS ---
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

  const isDeadlineClose = (deadlineStr) => {
    if (!deadlineStr) return false;
    try {
      const deadline = new Date(deadlineStr);
      const now = new Date();
      const diffDays = (deadline - now) / (1000 * 60 * 60 * 24);
      return diffDays > 0 && diffDays <= 3;
    } catch (error) {
      return false;
    }
  };

  const isDeadlinePassed = (deadlineStr) => {
    if (!deadlineStr) return false;
    try {
      const deadline = new Date(deadlineStr);
      const now = new Date();
      return deadline < now;
    } catch (error) {
      return false;
    }
  };

  // --- FILTER & SEARCH LOGIC ---
  const filteredTasks = tasks
    .filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.matkul.toLowerCase().includes(searchTerm.toLowerCase()) ||
        task.lecturer.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
      const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
      return matchesSearch && matchesPriority && matchesStatus;
    })
    .sort((a, b) => {
      if (sortBy === 'deadline') {
        return new Date(a.deadline) - new Date(b.deadline);
      } else if (sortBy === 'priority') {
        const priorityOrder = { 'High': 0, 'Medium': 1, 'Low': 2 };
        return priorityOrder[a.priority] - priorityOrder[b.priority];
      } else if (sortBy === 'newest') {
        return new Date(b.createdAt) - new Date(a.createdAt);
      }
      return 0;
    });

  // --- STATISTICS ---
  const totalTasks = tasks.length;
  const completedTasks = tasks.filter(t => t.status === 'Selesai').length;
  const highPriorityTasks = tasks.filter(t => t.priority === 'High' && t.status !== 'Selesai').length;
  const urgentTasks = tasks.filter(t => (isDeadlineClose(t.deadline) || isDeadlinePassed(t.deadline)) && t.status !== 'Selesai').length;

  return (
    <div className="w-full space-y-8 pb-16">
      {/* --- HEADER --- */}
      <div className="border-b border-slate-100 pb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="p-2.5 bg-purple-50 text-purple-600 rounded-xl">
            <BookOpen size={24} />
          </div>
          <div>
            <h1 className="text-3xl font-black text-slate-900 tracking-tight">Daftar Tugas</h1>
            <p className="text-xs text-slate-400 mt-1 font-medium">Kelola dan pantau semua tugas yang telah di-assign untuk Anda</p>
          </div>
        </div>
      </div>

      {/* --- STATISTICS GRID --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1: Total Tasks */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-blue-50 text-blue-600 rounded-xl">
              <BookOpen size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-blue-400">Total Tugas</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{totalTasks}</div>
            </div>
          </div>
        </div>

        {/* Stat 2: Completed */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <CheckCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400">Selesai</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{completedTasks}</div>
            </div>
          </div>
        </div>

        {/* Stat 3: High Priority */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-rose-50 text-rose-600 rounded-xl">
              <Flag size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-rose-400">Prioritas Tinggi</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{highPriorityTasks}</div>
            </div>
          </div>
        </div>

        {/* Stat 4: Urgent */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs hover:shadow-md transition-all">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-amber-50 text-amber-600 rounded-xl">
              <AlertCircle size={20} />
            </div>
            <div>
              <div className="text-[10px] uppercase font-black tracking-wider text-amber-400">Mendesak</div>
              <div className="text-2xl font-black text-slate-900 mt-0.5">{urgentTasks}</div>
            </div>
          </div>
        </div>
      </div>

      {/* --- FILTER & SEARCH BAR --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-5 rounded-2xl border border-slate-100 shadow-xs">
        {/* Search Input */}
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-4 top-3.5 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari tugas, mata kuliah, atau dosen..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-purple-500 focus:bg-white transition-all"
          />
        </div>

        {/* Filter Controls */}
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-50 p-2 rounded-xl flex-shrink-0">
            <SlidersHorizontal size={13} />
            <span>Filter:</span>
          </div>

          {/* Priority Filter */}
          <select
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none"
          >
            <option value="All">Semua Prioritas</option>
            <option value="High">Tinggi</option>
            <option value="Medium">Sedang</option>
            <option value="Low">Rendah</option>
          </select>

          {/* Status Filter */}
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none"
          >
            <option value="All">Semua Status</option>
            <option value="Belum">Belum Selesai</option>
            <option value="Selesai">Selesai</option>
          </select>

          {/* Sort */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none"
          >
            <option value="deadline">Deadline</option>
            <option value="priority">Prioritas</option>
            <option value="newest">Terbaru</option>
          </select>
        </div>
      </div>

      {/* --- TASKS GRID --- */}
      {loading ? (
        <div className="w-full flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-purple-500" />
          <p className="text-xs font-bold">Memuat daftar tugas Anda...</p>
        </div>
      ) : filteredTasks.length === 0 ? (
        <div className="bg-white border border-dashed border-slate-200 p-16 rounded-3xl text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4">
            <AlertCircle size={26} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Belum Ada Tugas</h3>
          <p className="text-xs text-slate-400 mt-1 max-w-sm">Tidak ada tugas yang sesuai dengan filter Anda. Cek kembali nanti atau ubah kriteria pencarian.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredTasks.map((task) => {
            const isHigh = task.priority === 'High';
            const isMed = task.priority === 'Medium';
            const isDone = task.status === 'Selesai';
            const isClose = isDeadlineClose(task.deadline);
            const isPassed = isDeadlinePassed(task.deadline);

            return (
              <div
                key={task.id}
                className={`bg-white border rounded-2xl p-5 flex flex-col justify-between shadow-xs hover:shadow-lg hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group ${
                  isDone ? 'border-emerald-100 bg-emerald-50/5' : isPassed ? 'border-rose-100 bg-rose-50/5' : 'border-slate-100'
                }`}
              >
                {/* Penanda Garis Kiri Sesuai Prioritas */}
                <div className={`absolute top-0 left-0 bottom-0 w-1.5 ${
                  isDone ? 'bg-emerald-500' : isPassed ? 'bg-rose-500' : isHigh ? 'bg-rose-500' : isMed ? 'bg-amber-500' : 'bg-cyan-400'
                }`} />

                <div>
                  {/* Header Card: Meta & Badges */}
                  <div className="flex items-start justify-between gap-2 mb-3">
                    <span className="text-[9px] font-extrabold px-2 py-0.5 bg-purple-50 text-purple-600 rounded-md tracking-wide max-w-[120px] truncate">
                      {task.matkul}
                    </span>
                    <div className="flex items-center gap-1">
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        isHigh ? 'bg-rose-100 text-rose-700' : isMed ? 'bg-amber-100 text-amber-700' : 'bg-cyan-100 text-cyan-700'
                      }`}>
                        {task.priority}
                      </span>
                      <span className={`text-[8px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-sm ${
                        isDone ? 'bg-emerald-600 text-white' : isPassed ? 'bg-rose-600 text-white' : isClose ? 'bg-amber-600 text-white' : 'bg-slate-100 text-slate-600'
                      }`}>
                        {isDone ? 'Selesai' : isPassed ? 'Lewat' : isClose ? 'Dekat' : 'Aktif'}
                      </span>
                    </div>
                  </div>

                  {/* Judul Tugas */}
                  <h3 className={`text-sm font-extrabold text-slate-800 leading-snug tracking-tight group-hover:text-purple-600 transition-colors ${isDone ? 'line-through text-slate-400' : ''}`}>
                    {task.title}
                  </h3>

                  {/* Deskripsi */}
                  <p className="text-xs text-slate-400 mt-2 line-clamp-2 leading-relaxed font-medium">
                    {task.description || "Tidak ada rincian tambahan."}
                  </p>

                  {/* Detail Info */}
                  <div className="bg-gradient-to-br from-slate-50 to-slate-50/50 border border-slate-100 rounded-xl p-3 mt-4 space-y-1.5 text-[10px] text-slate-600 font-semibold">
                    <div className="flex items-center gap-2 truncate">
                      <User size={12} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">
                        Dosen: <strong className="text-slate-800">{task.lecturer}</strong>
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar size={12} className="text-slate-400 flex-shrink-0" />
                      <span className={isHigh && !isDone ? 'text-rose-600 font-bold' : ''}>
                        Deadline: <strong className="text-slate-800">{formatDeadlineWithTime(task.deadline)}</strong>
                      </span>
                    </div>
                  </div>
                </div>

                {/* Footer: Publisher Info */}
                <div className="border-t border-slate-100 pt-3 mt-4 flex items-center gap-2.5">
                  {/* Publisher Avatar */}
                  <div className="w-8 h-8 rounded-full overflow-hidden border-2 border-slate-200 shadow-xs flex-shrink-0 bg-slate-100">
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
                    <div style={{ display: task.publisherInfo?.avatar ? 'none' : 'flex' }} className="w-full h-full items-center justify-center bg-gradient-to-br from-purple-400 to-indigo-400 text-white text-xs font-bold">
                      {task.publisherInfo?.name?.charAt(0) || 'A'}
                    </div>
                  </div>

                  {/* Publisher Details */}
                  <div className="flex-1 min-w-0">
                    <div className="text-[9px] font-bold text-slate-700 truncate">
                      {task.publisherInfo?.name || task.publisher || 'Admin'}
                    </div>
                    <div className="text-[8px] text-slate-400">
                      {task.publisherInfo?.role || 'Admin'} • {formatPublishTime(task.createdAt)}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
