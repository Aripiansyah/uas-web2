import React, { useEffect, useMemo, useState } from 'react';
import { ResponsiveContainer, CartesianGrid, XAxis, YAxis, BarChart, Bar, Cell, Tooltip } from 'recharts';
import { CheckCircle2, BookOpen, User, Calendar, Trash2, Trophy } from 'lucide-react';
import { taskService, userService } from '../../services/api';
import AssignmentFrequencyRadar from '../../components/AssignmentFrequencyRadar';
import SubjectCompletionBarChart from '../../components/SubjectCompletionBarChart';

export default function Dashboard() {
  const [tasks, setTasks] = useState([]);
  const [speedData, setSpeedData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [barKey, setBarKey] = useState(0);

  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    const unsubscribeUser = userService.subscribeUsers((users) => {
      const sortedUsers = users
        .map((u) => ({
          name: u.name || 'Anonymous',
          points: u.total_points || u.totalPoints || 0,
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);

      setLeaderboardData(sortedUsers);
      setBarKey((prev) => prev + 1);
    });

    const unsubscribeTasks = taskService.subscribeTasks((fetchedTasks) => {
      setTasks(fetchedTasks);

      const completedCount = fetchedTasks.filter((t) => t.isCompleted || t.is_completed).length;
      const urgentCount = fetchedTasks.filter(
        (t) => !(t.isCompleted || t.is_completed) && t.priority === 'High'
      ).length;
      const mediumCount = fetchedTasks.filter(
        (t) => !(t.isCompleted || t.is_completed) && t.priority === 'Medium'
      ).length;
      const lowCount = fetchedTasks.filter(
        (t) => !(t.isCompleted || t.is_completed) && t.priority === 'Low'
      ).length;

      setSpeedData([
        { name: 'Selesai', nilai: completedCount, fill: '#10b981' },
        { name: 'High', nilai: urgentCount, fill: '#ef4444' },
        { name: 'Medium', nilai: mediumCount, fill: '#f59e0b' },
        { name: 'Low', nilai: lowCount, fill: '#3b82f6' },
      ]);
    });

    return () => {
      unsubscribeUser();
      unsubscribeTasks();
    };
  }, []);

  const handleCompleteTask = async (taskId, currentStatus) => {
    try {
      await taskService.updateTask(taskId, { isCompleted: !currentStatus });
      showToast(currentStatus ? 'Tugas dibuka kembali!' : 'Tugas ditandai selesai! 🎉');
    } catch (error) {
      console.error('Gagal memperbarui status tugas:', error);
      showToast('Gagal memperbarui status tugas.', 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (!confirm('Yakin ingin menghapus tugas ini?')) return;

    try {
      await taskService.deleteTask(taskId);
      showToast('Tugas berhasil dihapus');
    } catch (error) {
      console.error('Gagal menghapus tugas:', error);
      showToast('Gagal menghapus tugas.', 'error');
    }
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter((task) => {
      const statusMatch =
        filterStatus === 'all' ||
        (filterStatus === 'completed' && task.isCompleted) ||
        (filterStatus === 'pending' && !task.isCompleted);

      const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;

      return statusMatch && priorityMatch;
    });
  }, [tasks, filterStatus, filterPriority]);

  const stats = useMemo(() => {
    const total = tasks.length;
    const completed = tasks.filter((t) => t.isCompleted).length;
    const pending = tasks.filter((t) => !t.isCompleted).length;
    const activeSubjects = new Set(tasks.map((t) => t.matkul || t.course || 'Belum Ada')).size;

    return { total, completed, pending, activeSubjects };
  }, [tasks]);

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'High':
        return { bg: 'from-red-500 to-rose-600', badge: 'bg-red-100 text-red-700' };
      case 'Medium':
        return { bg: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700' };
      case 'Low':
        return { bg: 'from-blue-500 to-cyan-600', badge: 'bg-blue-100 text-blue-700' };
      default:
        return { bg: 'from-slate-500 to-slate-600', badge: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col gap-6 m-0 p-6 box-border text-slate-800">
      {/* HEADER */}
      <div className="soft-card border border-slate-200 p-8 rounded-2xl shadow-sm">
        <h1 className="text-slate-900 text-3xl md:text-4xl font-extrabold">Admin Dashboard</h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          Ringkasan akademik dan statistik sistem pembelajaran
        </p>
      </div>

      {/* LEADERBOARD */}
      <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gradient flex items-center gap-2">
              <Trophy size={24} className="text-yellow-400" />
              Leaderboard Top 5
            </h3>
            <p className="text-xs text-slate-400 mt-1">Ranking mahasiswa berdasarkan poin quiz</p>
          </div>
          <div className="px-3 py-1 bg-cyan-500/20 text-cyan-300 rounded-full text-xs font-bold tracking-wider border border-cyan-500/30">
            Live Ranking
          </div>
        </div>

        <div className="w-full h-80 -ml-4 pl-4">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart key={barKey} data={leaderboardData} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                fontSize={11}
                fontWeight={600}
                width={120}
              />
              <Tooltip
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #8b5cf6',
                  backgroundColor: '#1e1b4b',
                  color: '#e0e7ff',
                  boxShadow: '0 10px 15px rgba(139, 92, 246, 0.3)',
                }}
              />
              <Bar
                dataKey="points"
                radius={[0, 10, 10, 0]}
                barSize={35}
                animationDuration={800}
              >
                {leaderboardData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'][index] || '#6366f1'
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 1) Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-purple-500">
            Total Assignments
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.total}</p>
          <p className="text-[11px] text-slate-500 mt-1">All realtime tasks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-emerald-500">Completed</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.completed}</p>
          <p className="text-[11px] text-slate-500 mt-1">Finished tasks</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-cyan-500">Pending</p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.pending}</p>
          <p className="text-[11px] text-slate-500 mt-1">Awaiting completion</p>
        </div>

        <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <p className="text-[10px] font-black uppercase tracking-wider text-indigo-500">
            Active Subjects
          </p>
          <p className="text-2xl font-black text-slate-900 mt-1">{stats.activeSubjects}</p>
          <p className="text-[11px] text-slate-500 mt-1">Subjects with assignments</p>
        </div>
      </div>

      {/* 2) Assignment Frequency Radar Chart (includes 3) Analytics summary cards) */}
      <div className="soft-card border border-slate-200 p-0 rounded-2xl shadow-sm overflow-hidden">
        <AssignmentFrequencyRadar tasks={tasks} />
      </div>

      {/* 3) Additional Analytics Diagram: Completed vs Pending by Subject (realtime) */}
      <div className="mt-6">
        <SubjectCompletionBarChart
          tasks={tasks}
          completedTaskIds={undefined}
          title="Completed vs Pending by Subject"
          maxSubjects={8}
        />
      </div>

      {/* 4) Analytics (Status chart) */}
      <div className="mt-6 soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gradient">📊 Status Tugas</h3>
          <p className="text-xs text-slate-400 mt-1">Distribusi status penyelesaian</p>
        </div>

        <div className="w-full h-80 flex items-start justify-start overflow-hidden pt-2">
          <ResponsiveContainer width="100%" height={320}>
            <BarChart
              data={speedData.length ? speedData : [{ name: 'Belum Ada', nilai: 1, fill: '#8b5cf6' }]}
              layout="vertical"
              margin={{ top: 10, right: 10, left: 0, bottom: 10 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#374151" horizontal={false} />
              <XAxis type="number" hide />
              <YAxis
                dataKey="name"
                type="category"
                stroke="#94a3b8"
                fontSize={11}
                fontWeight={600}
                width={150}
              />
              <Tooltip
                cursor={{ fill: 'rgba(139, 92, 246, 0.1)' }}
                contentStyle={{
                  borderRadius: '12px',
                  border: '1px solid #8b5cf6',
                  backgroundColor: '#1e1b4b',
                  color: '#e0e7ff',
                  boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)',
                }}
                formatter={(value) => [value, 'Tugas']}
              />
              <Bar dataKey="nilai" barSize={22} radius={[0, 10, 10, 0]} animationDuration={800}>
                {speedData.map((entry, index) => (
                  <Cell key={`cell-speed-${index}`} fill={entry.fill || '#8b5cf6'} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 4) Recent Activity (task list) */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-start mb-4 flex-wrap gap-4">
            <div>
              <h2 className="text-2xl font-bold text-gradient">📋 Semua Tugas</h2>
              <p className="text-sm text-slate-400 mt-1">Kelola semua tugas dengan filtering</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 card-modern">
              <span className="text-2xl font-bold text-cyan-300">{filteredTasks.length}</span>
              <span className="text-xs text-slate-400 font-medium">Tugas</span>
            </div>
          </div>

          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Semua', icon: '📌' },
                { value: 'pending', label: 'Pending', icon: '⏳' },
                { value: 'completed', label: 'Selesai', icon: '✅' },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilterStatus(btn.value)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    filterStatus === btn.value
                      ? 'btn-primary bg-purple-400'
                      : 'card-modern hover:border-purple-400/50'
                  }`}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 flex-wrap">
              {[
                { value: 'all', label: 'All' },
                { value: 'High', label: 'High' },
                { value: 'Medium', label: 'Medium' },
                { value: 'Low', label: 'Low' },
              ].map((btn) => (
                <button
                  key={btn.value}
                  onClick={() => setFilterPriority(btn.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filterPriority === btn.value
                      ? 'btn-primary bg-cyan-300'
                      : 'card-modern hover:border-cyan-400'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {toast && (
          <div
            className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-xl transition-all ${
              toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
            }`}
          >
            {toast.msg}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const priorityStyle = getPriorityStyle(task.priority);
            return (
              <div
                key={task.id}
                className={`group card-modern overflow-hidden transition-all duration-300 flex flex-col ${
                  task.isCompleted ? 'opacity-75 bg-slate-900/30' : ''
                }`}
              >
                <div className={`h-1 bg-gradient-to-r ${priorityStyle.bg}`} />
                <div className="p-5 flex flex-col h-full">
                  <div className="mb-3">
                    <div className="flex gap-2 mb-3 flex-wrap">
                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityStyle.badge}`}>
                        {task.priority || 'Normal'}
                      </span>
                      <span
                        className={`px-2 py-1 rounded-full text-xs font-bold ${
                          task.isCompleted
                            ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/30 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {task.isCompleted ? '✓ Selesai' : '⏳ Pending'}
                      </span>
                    </div>

                    <h3
                      className={`font-bold text-base leading-tight mb-1 ${
                        task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'
                      }`}
                    >
                      {task.title}
                    </h3>
                    <p className={`text-xs ${task.isCompleted ? 'text-slate-500' : 'text-slate-400'}`}>
                      {task.matkul || task.course || 'Mata Kuliah'}
                    </p>
                  </div>

                  {task.description && (
                    <p
                      className={`text-xs mb-3 leading-relaxed line-clamp-2 ${
                        task.isCompleted ? 'text-slate-500' : 'text-slate-300'
                      }`}
                    >
                      {task.description}
                    </p>
                  )}

                  <div className="space-y-2 mb-3 pb-3 border-b border-slate-700/50 flex-1">
                    {task.lecturer && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <BookOpen size={14} className="text-purple-400 shrink-0" />
                        <span className="truncate">
                          <strong>Dosen:</strong> {task.lecturer}
                        </span>
                      </div>
                    )}
                    {task.deadline && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar size={14} className="text-cyan-400 shrink-0" />
                        <span className="truncate">
                          <strong>Deadline:</strong> {task.deadline}
                        </span>
                      </div>
                    )}
                    {task.publisher && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <User size={14} className="text-aqua-400 shrink-0" />
                        <span className="truncate">
                          <strong>By:</strong> {task.publisher}
                        </span>
                      </div>
                    )}
                  </div>

                  <div className="flex gap-2 mt-auto">
                    <button
                      onClick={() => handleCompleteTask(task.id, task.isCompleted)}
                      className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 ${
                        task.isCompleted ? 'card-modern hover:bg-slate-800' : 'btn-primary'
                      }`}
                    >
                      <CheckCircle2 size={14} />
                      {task.isCompleted ? 'Buka' : 'Selesai'}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="btn-danger py-2 px-3 text-xs"
                      type="button"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}

          {filteredTasks.length === 0 && (
            <div className="col-span-full">
              <div className="soft-card border border-slate-200 rounded-2xl p-12 text-center">
                <div className="text-6xl mb-4">📭</div>
                <h3 className="text-xl font-bold text-slate-100 mb-2">Tidak Ada Tugas</h3>
                <p className="text-slate-400 mb-6 max-w-md mx-auto">
                  {tasks.length === 0 ? 'Belum ada tugas yang dibuat' : 'Tidak ada tugas yang sesuai filter'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>

    </div>
  );
}
