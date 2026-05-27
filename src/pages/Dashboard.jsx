import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, Legend, Tooltip, CartesianGrid, XAxis, YAxis, BarChart, Bar } from 'recharts';
import { CheckCircle2, Clock, BookOpen, User, Calendar, Trash2, ArrowRight, Award, BarChart as BarChartIcon, Trophy } from 'lucide-react';
import { taskService, userService } from '../services/firebase';

export default function Dashboard() {
  // 1. State untuk Data Dinamis
  const [currentUser, setCurrentUser] = useState({ name: 'Mahasiswa' });
  const [tasks, setTasks] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [speedData, setSpeedData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [barKey, setBarKey] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [toast, setToast] = useState(null);

  // Helper: Show Toast Notification
  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  // Color palette untuk bar chart yang lebih vibrant dan full color
  const barColors = [
    '#6366f1', // Indigo
    '#ec4899', // Pink
    '#f59e0b', // Amber
    '#10b981', // Emerald
    '#3b82f6', // Blue
    '#8b5cf6', // Violet
    '#06b6d4', // Cyan
    '#ef4444', // Red
  ];

  useEffect(() => {
    // Ambil data user aktif (Simulasi ID 'admin_utama_01' sesuai DashboardLayout)
    const unsubscribeUser = userService.subscribeUsers((users) => {
      // 1. Ambil data user, lalu urutkan berdasarkan totalPoints terbesar ke terkecil
      const sortedUsers = users
        .map(u => ({
          name: u.name || 'Anonymous',
          points: u.totalPoints || 0
        }))
        .sort((a, b) => b.points - a.points) // Sort Descending
        .slice(0, 5); // Ambil Top 5 saja agar grafik tidak kepenuhan

      setLeaderboardData(sortedUsers);
      setBarKey((prev) => prev + 1);
    });

    // Ambil data tugas secara real-time dari Firestore
    const unsubscribeTasks = taskService.subscribeTasks((fetchedTasks) => {
      setTasks(fetchedTasks);

      // KELOLA DATA UNTUK DIAGRAM 1: Top Kontributor dengan Realtime Update
      const contributorMap = {};
      fetchedTasks.forEach(task => {
        const pub = task.publisher || 'Anonim';
        contributorMap[pub] = (contributorMap[pub] || 0) + 1;
      });
      const formattedAnalytics = Object.keys(contributorMap).map(key => ({
        name: key,
        jumlahTugas: contributorMap[key]
      })).sort((a, b) => b.jumlahTugas - a.jumlahTugas).slice(0, 8); // Top 8
      setAnalyticsData(formattedAnalytics);
      setAnimationTrigger(prev => prev + 1);

      // DATA DIAGRAM 2: Tren Kecepatan Pengumpulan Realtime dari Task Data
      const completedTasks = fetchedTasks.filter(t => t.isCompleted).length;
      const totalTasks = fetchedTasks.length || 1;
      const completionRate = Math.round((completedTasks / totalTasks) * 100);

      const urgentCount = fetchedTasks.filter(t => !t.isCompleted && t.priority === 'Tinggi').length;
      const mediumCount = fetchedTasks.filter(t => !t.isCompleted && t.priority === 'Sedang').length;
      const lowCount = fetchedTasks.filter(t => !t.isCompleted && t.priority === 'Rendah').length;

      setSpeedData([
        { name: 'Selesai', nilai: completedTasks, fill: '#10b981' },
        { name: 'Tinggi', nilai: urgentCount, fill: '#ef4444' },
        { name: 'Sedang', nilai: mediumCount, fill: '#f59e0b' },
        { name: 'Rendah', nilai: lowCount, fill: '#3b82f6' },
      ]);
    });

    // Optional: Auto-refresh setiap 5 detik untuk real-time feel
    const interval = setInterval(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 5000);

    return () => {
      unsubscribeUser();
      unsubscribeTasks();
      clearInterval(interval);
    };
  }, []);

  // Fungsi Action: Mengubah status tugas menjadi Selesai langsung di Firestore
  const handleCompleteTask = async (taskId, currentStatus) => {
    try {
      await taskService.updateTask(taskId, { isCompleted: !currentStatus });
      showToast(currentStatus ? 'Tugas dibuka kembali!' : 'Tugas ditandai selesai! 🎉');
    } catch (error) {
      console.error("Gagal memperbarui status tugas:", error);
      showToast("Gagal memperbarui status tugas.", 'error');
    }
  };

  // Fungsi Delete Task
  const handleDeleteTask = async (taskId) => {
    if (confirm('Yakin ingin menghapus tugas ini?')) {
      try {
        await taskService.deleteTask(taskId);
        showToast('Tugas berhasil dihapus');
      } catch (error) {
        console.error("Gagal menghapus tugas:", error);
        showToast("Gagal menghapus tugas.", 'error');
      }
    }
  };

  // Filter tasks berdasarkan status dan priority
  const filteredTasks = tasks.filter(task => {
    const statusMatch = filterStatus === 'all' ||
      (filterStatus === 'completed' && task.isCompleted) ||
      (filterStatus === 'pending' && !task.isCompleted);
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  // Get priority styling
  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Tinggi':
        return { bg: 'from-red-500 to-rose-600', badge: 'bg-red-100 text-red-700' };
      case 'Sedang':
        return { bg: 'from-amber-500 to-orange-600', badge: 'bg-amber-100 text-amber-700' };
      case 'Rendah':
        return { bg: 'from-blue-500 to-cyan-600', badge: 'bg-blue-100 text-blue-700' };
      default:
        return { bg: 'from-slate-500 to-slate-600', badge: 'bg-slate-100 text-slate-700' };
    }
  };

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col gap-6 m-0 p-6 box-border text-slate-800">
      {/* HEADER */}
      <div className="soft-card border border-slate-200 p-8 rounded-2xl shadow-sm">
        <h1 className="text-slate-900 text-3xl md:text-4xl font-extrabold">
          Admin Dashboard
        </h1>
        <p className="text-slate-500 text-sm mt-2 font-medium">
          Ringkasan akademik dan statistik sistem pembelajaran
        </p>
      </div>

      {/* LEADERBOARD */}
      <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
        <div className="flex items-center justify-between mb-6 flex-wrap gap-4">
          <div>
            <h3 className="text-lg font-bold text-gradient flex items-center gap-2">
              <Trophy size={24} className="text-yellow-400" />Leaderboard Top 5
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
                  boxShadow: '0 10px 15px rgba(139, 92, 246, 0.3)'
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

                    fill={['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6'][index] || '#6366f1'}

                  />

                ))}

              </Bar>

            </BarChart>

          </ResponsiveContainer>

        </div>

      </div>



      {/* DIAGRAMS SECTION */}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">



        {/* Top Contributors Chart */}

        <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">

          <div className="mb-6">

            <h3 className="text-lg font-bold text-gradient">🏆 Top Dosen</h3>

            <p className="text-xs text-slate-400 mt-1">Distribusi tugas per pengajar</p>

          </div>

          <div className="w-full h-80 -ml-4 pl-4">

            <ResponsiveContainer width="140%" height={320}>

              <PieChart key={animationTrigger}>

                <Pie

                  data={analyticsData.length ? analyticsData : [{ name: 'Belum Ada', jumlahTugas: 1 }]}

                  cx="50%"

                  cy="50%"

                  innerRadius={60}

                  outerRadius={100}

                  paddingAngle={2}

                  dataKey="jumlahTugas"

                  animationDuration={800}

                  label={({ name, jumlahTugas }) => `${name}: ${jumlahTugas}`}

                >

                  {analyticsData.map((entry, index) => {

                    const colors = ['#a855f7', '#06b6d4', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#0891b2', '#ef4444'];

                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;

                  })}

                </Pie>

                <Tooltip

                  contentStyle={{

                    backgroundColor: '#1e1b4b',

                    border: '1px solid #8b5cf6',

                    borderRadius: '8px',

                    color: '#e0e7ff',

                    boxShadow: '0 10px 25px rgba(139, 92, 246, 0.3)'

                  }}

                  formatter={(value) => [value, 'Tugas']}

                />

              </PieChart>

            </ResponsiveContainer>

          </div>

        </div>



        {/* Status Chart Placeholder */}

        <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">

          <div className="mb-6">

            <h3 className="text-lg font-bold text-gradient">📊 Status Tugas</h3>

            <p className="text-xs text-slate-400 mt-1">Distribusi status penyelesaian</p>

          </div>

          <div className="w-full h-80 flex items-center justify-center">

            <p className="text-slate-400 text-sm">Chart loading...</p>

          </div>

        </div>

      </div>



      {/* TASK CARDS SECTION */}

      <div className="space-y-6">

        {/* Header & Filter */}

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



          {/* Filter Buttons */}

          <div className="flex flex-wrap gap-3">

            {/* Status Filter */}

            <div className="flex gap-2">

              {[

                { value: 'all', label: 'Semua', icon: '📌' },

                { value: 'pending', label: 'Pending', icon: '⏳' },

                { value: 'completed', label: 'Selesai', icon: '✅' }

              ].map(btn => (

                <button

                  key={btn.value}

                  onClick={() => setFilterStatus(btn.value)}

                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${filterStatus === btn.value

                    ? 'btn-primary'

                    : 'card-modern hover:border-purple-400/50'

                    }`}

                >

                  {btn.icon} {btn.label}

                </button>

              ))}

            </div>



            {/* Priority Filter */}

            <div className="flex gap-2 flex-wrap">

              {[

                { value: 'all', label: 'Semua' },

                { value: 'Tinggi', label: 'Tinggi' },

                { value: 'Sedang', label: 'Sedang' },

                { value: 'Rendah', label: 'Rendah' }

              ].map(btn => (

                <button

                  key={btn.value}

                  onClick={() => setFilterPriority(btn.value)}

                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${filterPriority === btn.value

                    ? 'btn-primary text-white'

                    : 'card-modern hover:border-cyan-400/50'

                    }`}

                >

                  {btn.label}

                </button>

              ))}

            </div>

          </div>

        </div>



        {/* Toast Notification */}

        {toast && (

          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-xl transition-all ${toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'

            }`}>

            {toast.msg}

          </div>

        )}



        {/* Grid Card List */}

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">

          {filteredTasks.map((task) => {

            const priorityStyle = getPriorityStyle(task.priority);

            return (

              <div

                key={task.id}

                className={`group card-modern overflow-hidden transition-all duration-300 flex flex-col ${task.isCompleted ? 'opacity-75 bg-slate-900/30' : ''

                  }`}

              >

                <div className={`h-1 bg-gradient-to-r ${priorityStyle.bg}`} />



                <div className="p-5 flex flex-col h-full">

                  <div className="mb-3">

                    <div className="flex gap-2 mb-3 flex-wrap">

                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${priorityStyle.badge}`}>

                        {task.priority || 'Normal'}

                      </span>

                      <span className={`px-2 py-1 rounded-full text-xs font-bold ${task.isCompleted ? 'bg-emerald-500/30 text-emerald-300 border border-emerald-500/30' : 'bg-amber-500/30 text-amber-300 border border-amber-500/30'

                        }`}>

                        {task.isCompleted ? '✓ Selesai' : '⏳ Pending'}

                      </span>

                    </div>



                    <h3 className={`font-bold text-base leading-tight mb-1 ${task.isCompleted ? 'line-through text-slate-500' : 'text-slate-100'

                      }`}>

                      {task.title}

                    </h3>

                    <p className={`text-xs ${task.isCompleted ? 'text-slate-500' : 'text-slate-400'

                      }`}>

                      {task.matkul || task.course || 'Mata Kuliah'}

                    </p>

                  </div>



                  {task.description && (

                    <p className={`text-xs mb-3 leading-relaxed line-clamp-2 ${task.isCompleted ? 'text-slate-500' : 'text-slate-300'

                      }`}>

                      {task.description}

                    </p>

                  )}



                  <div className="space-y-2 mb-3 pb-3 border-b border-slate-700/50 flex-1">

                    {task.lecturer && (

                      <div className="flex items-center gap-2 text-xs text-slate-400">

                        <BookOpen size={14} className="text-purple-400 shrink-0" />

                        <span className="truncate"><strong>Dosen:</strong> {task.lecturer}</span>

                      </div>

                    )}

                    {task.deadline && (
                      <div className="flex items-center gap-2 text-xs text-slate-400">
                        <Calendar size={14} className="text-cyan-400 shrink-0" />
                        <span className="truncate"><strong>Deadline:</strong> {task.deadline}</span>

                      </div>

                    )}

                    {task.publisher && (

                      <div className="flex items-center gap-2 text-xs text-slate-400">

                        <User size={14} className="text-aqua-400 shrink-0" />

                        <span className="truncate"><strong>By:</strong> {task.publisher}</span>

                      </div>

                    )}

                  </div>



                  <div className="flex gap-2 mt-auto">

                    <button

                      onClick={() => handleCompleteTask(task.id, task.isCompleted)}

                      className={`flex-1 py-2 px-3 rounded-lg font-semibold text-xs transition-all flex items-center justify-center gap-2 ${task.isCompleted

                        ? 'card-modern hover:bg-slate-800'

                        : 'btn-primary'

                        }`}

                    >

                      <CheckCircle2 size={14} />

                      {task.isCompleted ? 'Buka' : 'Selesai'}

                    </button>



                    <button

                      onClick={() => handleDeleteTask(task.id)}

                      className="btn-danger py-2 px-3 text-xs"

                    >

                      <Trash2 size={14} />

                    </button>

                  </div>

                </div>

              </div>

            );

          })}



          {/* Empty State */}

          {filteredTasks.length === 0 && (

            <div className="col-span-full">

            <div className="soft-card border border-slate-200 rounded-2xl p-12 text-center">

                <div className="text-6xl mb-4">📭</div>

                <h3 className="text-xl font-bold text-slate-100 mb-2">Tidak Ada Tugas</h3>

                <p className="text-slate-400 mb-6 max-w-md mx-auto">

                  {tasks.length === 0

                    ? 'Belum ada tugas yang dibuat'

                    : 'Tidak ada tugas yang sesuai filter'}

                </p>

              </div>

            </div>

          )}

        </div>

      </div>
      </div>
  );
}
