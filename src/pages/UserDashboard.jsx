import React, { useState, useEffect } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Legend, Tooltip, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { CheckCircle2, Clock, BookOpen, User, Calendar, Award, Trash2, Trophy, Medal } from 'lucide-react';
import { taskService, userService, scheduleService, quizService } from '../services/firebase';
import Toast from '../components/Toast';
import { useNavigate } from 'react-router-dom';

export default function UserDashboard() {
  const navigate = useNavigate();
  const [currentUser, setCurrentUser] = useState({ name: 'User' });
  const [tasks, setTasks] = useState([]);
  const [userCompletedTasks, setUserCompletedTasks] = useState([]);
  const [analyticsData, setAnalyticsData] = useState([]);
  const [speedData, setSpeedData] = useState([]);
  const [leaderboardData, setLeaderboardData] = useState([]);
  const [quizStats, setQuizStats] = useState({ totalPoints: 0, totalQuizzesCompleted: 0, averageScore: 0 });
  const [animationTrigger, setAnimationTrigger] = useState(0);
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPriority, setFilterPriority] = useState('all');
  const [toast, setToast] = useState(null);

  const showToast = (msg, type = 'success') => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 3000);
  };

  useEffect(() => {
    // Get current user dari localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (user) {
      const normalizeRole = (role) => {
        if (!role) return '';
        const r = String(role).trim().toLowerCase();
        if (r.includes('admin')) return 'Admin';
        if (r === 'user' || r.includes('user') || r.includes('student') || r.includes('mahasiswa')) return 'User';
        return role;
      };

      const normalizedRole = normalizeRole(user.role);
      if (normalizedRole === 'Admin') {
        navigate('/');
        return;
      }

      setCurrentUser(user);

      // Subscribe to user's quiz completions and fetch stats whenever they change
      const unsubscribeQuizCompletions = quizService.subscribeUserQuizCompletions(user.uid, async () => {
        const stats = await quizService.getUserQuizStats(user.uid);
        setQuizStats(stats);
      });

      return () => unsubscribeQuizCompletions();
    }
  }, [navigate]);

  useEffect(() => {
    // Get current user dari localStorage
    const user = JSON.parse(localStorage.getItem('currentUser'));
    if (!user) return;

    // Subscribe to leaderboard
    const unsubscribeUser = userService.subscribeUsers((users) => {
      const sortedUsers = users
        .map((u, idx) => ({
          name: u.name || 'Anonymous',
          points: u.totalPoints || 0,
          rank: idx + 1
        }))
        .sort((a, b) => b.points - a.points)
        .slice(0, 5);
      setLeaderboardData(sortedUsers);
    });

    // Subscribe to user's completed tasks (per-user isolation)
    const unsubscribeCompletions = taskService.subscribeUserTaskCompletions(user.uid, (completedTaskIds) => {
      setUserCompletedTasks(completedTaskIds);
    });

    // Subscribe to tasks - FILTER BY CURRENT USER ONLY
    const unsubscribeTasks = taskService.subscribeUserTasks(user.uid, (fetchedTasks) => {
      setTasks(fetchedTasks);
      setAnimationTrigger(prev => prev + 1);
    });

    const interval = setInterval(() => {
      setAnimationTrigger(prev => prev + 1);
    }, 5000);

    return () => {
      unsubscribeUser();
      unsubscribeTasks();
      unsubscribeCompletions();
      clearInterval(interval);
    };
  }, []);

  const handleCompleteTask = async (taskId, isCurrentlyCompleted) => {
    try {
      await taskService.saveUserTaskCompletion(currentUser.uid, taskId);
      showToast(isCurrentlyCompleted ? 'Tugas dibuka kembali!' : 'Tugas ditandai selesai! 🎉');
    } catch (error) {
      showToast("Gagal memperbarui status tugas.", 'error');
    }
  };

  const handleDeleteTask = async (taskId) => {
    if (confirm('Yakin ingin menghapus tugas ini?')) {
      try {
        await taskService.deleteTask(taskId);
        showToast('Tugas berhasil dihapus');
      } catch (error) {
        showToast("Gagal menghapus tugas.", 'error');
      }
    }
  };

  useEffect(() => {
    if (tasks.length > 0) {
      const contributorMap = {};
      tasks.forEach(task => {
        const pub = task.publisher || 'Anonim';
        contributorMap[pub] = (contributorMap[pub] || 0) + 1;
      });
      const formattedAnalytics = Object.keys(contributorMap).map(key => ({
        name: key,
        jumlahTugas: contributorMap[key]
      })).sort((a,b) => b.jumlahTugas - a.jumlahTugas).slice(0, 8);
      setAnalyticsData(formattedAnalytics);
      
      const completedCount = userCompletedTasks.length;
      const urgentCount = tasks.filter(t => !userCompletedTasks.includes(t.id) && t.priority === 'Tinggi').length;
      const mediumCount = tasks.filter(t => !userCompletedTasks.includes(t.id) && t.priority === 'Sedang').length;
      const lowCount = tasks.filter(t => !userCompletedTasks.includes(t.id) && t.priority === 'Rendah').length;
      
      setSpeedData([
        { name: 'Selesai', nilai: completedCount, fill: '#10b981' },
        { name: 'Tinggi', nilai: urgentCount, fill: '#ef4444' },
        { name: 'Sedang', nilai: mediumCount, fill: '#f59e0b' },
        { name: 'Rendah', nilai: lowCount, fill: '#3b82f6' },
      ]);
    }
  }, [tasks, userCompletedTasks]);

  const filteredTasks = tasks.filter(task => {
    const isCompleted = userCompletedTasks.includes(task.id);
    const statusMatch = filterStatus === 'all' || 
      (filterStatus === 'completed' && isCompleted) || 
      (filterStatus === 'pending' && !isCompleted);
    const priorityMatch = filterPriority === 'all' || task.priority === filterPriority;
    return statusMatch && priorityMatch;
  });

  const getPriorityStyle = (priority) => {
    switch(priority) {
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
    <div className="space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Selamat Datang, {currentUser.name}! 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1 font-medium">
          Berikut adalah ringkasan aktivitas kuliah dan statistik tugas Anda saat ini.
        </p>
      </div>

     {/* QUIZ STATS CARDS */}
<div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4">
  
  {/* Card 1: Total Poin */}
  <div className="soft-card border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] md:text-xs font-bold text-purple-600 uppercase tracking-wider">Total Poin</p>
      <Trophy className="text-purple-600 w-4 h-4 md:w-5 md:h-5" />
    </div>
    <p className="text-2xl md:text-3xl font-black text-purple-900">{quizStats.totalPoints || 0}</p>
    <p className="text-[10px] md:text-xs text-purple-600 mt-1 md:mt-2">Dari semua quiz yang diselesaikan</p>
  </div>

  {/* Card 2: Quiz Selesai */}
  <div className="soft-card border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] md:text-xs font-bold text-emerald-600 uppercase tracking-wider">Quiz Selesai</p>
      <CheckCircle2 className="text-emerald-600 w-4 h-4 md:w-5 md:h-5" />
    </div>
    <p className="text-2xl md:text-3xl font-black text-emerald-900">{quizStats.totalQuizzesCompleted || 0}</p>
    <p className="text-[10px] md:text-xs text-emerald-600 mt-1 md:mt-2">Kuis yang telah Anda kerjakan</p>
  </div>

  {/* Card 3: Rata-rata Nilai (Dibuat memanjang 2 kolom di mobile agar rapi) */}
  <div className="soft-card border border-slate-200 rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow col-span-2 md:col-span-1">
    <div className="flex items-center justify-between mb-2">
      <p className="text-[10px] md:text-xs font-bold text-blue-600 uppercase tracking-wider">Rata-rata Nilai</p>
      <Award className="text-blue-600 w-4 h-4 md:w-5 md:h-5" />
    </div>
    <p className="text-2xl md:text-3xl font-black text-blue-900">{quizStats.averageScore || 0}%</p>
    <p className="text-[10px] md:text-xs text-blue-600 mt-1 md:mt-2">Performa rata-rata Anda</p>
  </div>

</div>

      {/* LEADERBOARD */}
<div className="grid grid-cols-1 gap-4 md:gap-6">
  <div className="bg-white p-4 md:p-6 rounded-2xl md:rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/50">
    
    {/* Header Section (Diubah agar bisa turun ke bawah di layar sangat kecil) */}
    <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 md:mb-6 gap-3 sm:gap-0">
      <div>
        <h3 className="text-base md:text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
          <Award className="text-amber-500 w-5 h-5 md:w-6 md:h-6" /> 
          Leaderboard Trivia Mahasiswa
        </h3>
        <p className="text-[10px] md:text-xs text-slate-400 font-medium mt-1">Peringkat 5 besar mahasiswa dengan akumulasi poin kuis terbanyak.</p>
      </div>
      <div className="px-2 md:px-3 py-1 bg-amber-50 text-amber-600 rounded-md md:rounded-lg text-[9px] md:text-[10px] font-black uppercase tracking-wider self-start sm:self-auto">
        Live Ranking
      </div>
    </div>

    {/* Chart Section */}
    <div className="w-full h-[280px] md:h-80">
      <ResponsiveContainer width="100%" height="100%">
        {/* Margin left dikurangi sedikit agar bar chart tetap terlihat luas di HP */}
        <BarChart data={leaderboardData} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" horizontal={false} />
          <XAxis type="number" hide />
          <YAxis 
            dataKey="name" 
            type="category" 
            stroke="#64748b" 
            fontSize={11} 
            fontWeight={700}
            width={90}
          />
          <Tooltip 
            cursor={{fill: '#f8fafc'}}
            contentStyle={{ 
              borderRadius: '12px', 
              border: 'none', 
              backgroundColor: '#1e293b',
              color: '#fff',
              boxShadow: '0 20px 25px -5px rgba(0,0,0,0.3)' 
            }}
            formatter={(value) => [`${value} poin`, 'Total Points']}
          />
          <Bar 
            dataKey="points" 
            radius={[0, 12, 12, 0]} 
            barSize={32}
            animationDuration={800}
            isAnimationActive={true}
          >
            <LabelList dataKey="points" position="right" fontSize={11} fontWeight="bold" fill="#1e293b" />
            {leaderboardData.map((entry, index) => {
              const colors = ['#a855f7', '#ec4899', '#f59e0b', '#06b6d4', '#3b82f6'];
              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>

    {/* Ranking Badges */}
    <div className="mt-4 md:mt-6 grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4">
      {leaderboardData.slice(0, 3).map((user, idx) => {
        const medals = ['🥇', '🥈', '🥉'];
        return (
          <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <span className="text-2xl md:text-3xl">{medals[idx]}</span>
            <div className="flex-1">
              <p className="font-bold text-slate-900 text-xs md:text-sm line-clamp-1">{user.name}</p>
              <p className="text-[10px] md:text-xs text-slate-500">{user.points} poin</p>
            </div>
          </div>
        );
      })}
    </div>
  </div>
</div>

      {/* DIAGRAMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* DIAGRAM 1: Top Kontributor */}
        <div className="soft-card border border-slate-200 p-6 rounded-2x5 min-w-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">🏆 Top Kontributor Tugas</h3>
            <p className="text-xs text-slate-400">Distribusi penerbitan tugas per dosen</p>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="140%" height={320}>
              <PieChart key={animationTrigger}>
                <Pie
                  data={analyticsData.length ? analyticsData : [{name: 'Belum Ada', jumlahTugas: 1}]}
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
                    const colors = ['#a855f7', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6', '#06b6d4', '#ef4444'];
                    return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
                  })}
                </Pie>
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff',
                    boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                  }}
                  formatter={(value) => [value, 'Tugas']}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-4 p-3 bg-purple-50 border border-purple-100 rounded-lg">
            <p className="text-xs text-purple-700 font-medium">
              Total Kontributor: <span className="font-bold text-purple-900">{analyticsData.length}</span> | 
              Total Tugas: <span className="font-bold text-purple-900">{analyticsData.reduce((sum, item) => sum + item.jumlahTugas, 0)}</span>
            </p>
          </div>
        </div>

        {/* DIAGRAM 2: Status Tugas */}
        <div className="soft-card border border-slate-200 p-6 rounded-2xl min-w-0 shadow-sm hover:shadow-md transition-shadow">
          <div className="mb-6">
            <h3 className="text-base font-bold text-slate-900">📊 Status Penyelesaian Tugas</h3>
            <p className="text-xs text-slate-400">Distribusi status tugas</p>
          </div>
          <div className="w-full h-80">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={speedData} key={animationTrigger}>
                <defs>
                  <linearGradient id="colorSelesai" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorTinggi" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorSedang" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorRendah" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={11} tickLine={false} />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: '#1e293b', 
                    border: '1px solid #475569',
                    borderRadius: '8px',
                    color: '#fff'
                  }}
                  formatter={(value) => [value, 'Jumlah']}
                />
                <Area 
                  type="monotone" 
                  dataKey="nilai" 
                  stroke="#10b981" 
                  strokeWidth={3} 
                  fillOpacity={1} 
                  fill="url(#colorSelesai)"
                  animationDuration={800}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="grid grid-cols-4 gap-2 mt-4">
            {speedData.map((item, idx) => (
              <div 
                key={idx}
                className="flex items-center gap-2 text-xs p-2 rounded-lg bg-slate-50 border border-slate-200"
              >
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{backgroundColor: item.fill}}
                />
                <span className="font-medium text-slate-700">{item.name}: {item.nilai}</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* TASKS SECTION */}
      <div className="space-y-6">
        <div>
          <div className="flex justify-between items-start mb-4">
            <div>
              <h2 className="text-2xl font-bold text-slate-900">📋 Daftar Tugas</h2>
              <p className="text-sm text-slate-500 mt-1">Kelola pengerjaan tugas kuliah dengan smart filtering</p>
            </div>
            <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-purple-50 to-violet-50 border border-purple-100 rounded-full">
              <span className="text-2xl font-bold text-purple-600">{filteredTasks.length}</span>
              <span className="text-xs text-purple-600 font-medium">Tugas</span>
            </div>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3">
            <div className="flex gap-2">
              {[
                { value: 'all', label: 'Semua', icon: '📌' },
                { value: 'pending', label: 'Belum Selesai', icon: '⏳' },
                { value: 'completed', label: 'Selesai', icon: '✅' }
              ].map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setFilterStatus(btn.value)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                    filterStatus === btn.value
                      ? 'bg-purple-600 text-white shadow-lg shadow-purple-200'
                      : 'bg-white border border-slate-200 text-slate-700 hover:border-purple-300'
                  }`}
                >
                  {btn.icon} {btn.label}
                </button>
              ))}
            </div>

            <div className="flex gap-2 ml-auto">
              {[
                { value: 'all', label: 'Semua Prioritas' },
                { value: 'Tinggi', label: '🔴 Tinggi' },
                { value: 'Sedang', label: '🟡 Sedang' },
                { value: 'Rendah', label: '🔵 Rendah' }
              ].map(btn => (
                <button
                  key={btn.value}
                  onClick={() => setFilterPriority(btn.value)}
                  className={`px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                    filterPriority === btn.value
                      ? 'bg-amber-600 text-white'
                      : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                  }`}
                >
                  {btn.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Toast */}
        {toast && (
          <div className={`fixed top-6 right-6 z-50 px-6 py-3 rounded-xl text-white font-medium shadow-xl transition-all ${
            toast.type === 'error' ? 'bg-red-500' : 'bg-emerald-500'
          }`}>
            {toast.msg}
          </div>
        )}

        {/* Task Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredTasks.map((task) => {
            const priorityStyle = getPriorityStyle(task.priority);
            const isTaskCompleted = userCompletedTasks.includes(task.id);
            return (
              <div
                key={task.id}
                className={`group relative bg-white rounded-2xl overflow-hidden shadow-md hover:shadow-2xl transition-all duration-300 border border-slate-100 hover:border-slate-300 flex flex-col ${
                  isTaskCompleted ? 'opacity-75' : ''
                }`}
              >
                <div className={`h-1.5 bg-gradient-to-r ${priorityStyle.bg}`} />

                <div className="p-6 flex flex-col h-full">
                  <div className="mb-4">
                    <div className="flex flex-wrap gap-2 mb-3">
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${priorityStyle.badge}`}>
                        {task.priority || 'Normal'}
                      </span>
                      <span className={`px-3 py-1 rounded-full text-xs font-bold ${
                        isTaskCompleted ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {isTaskCompleted ? '✓ Selesai' : '⏸ Pending'}
                      </span>
                    </div>
                    
                    <h3 className={`font-bold text-lg leading-tight mb-2 ${
                      isTaskCompleted ? 'line-through text-slate-400' : 'text-slate-900'
                    }`}>
                      {task.title}
                    </h3>
                    <p className={`text-sm ${
                      isTaskCompleted ? 'text-slate-300' : 'text-slate-500'
                    }`}>
                      {task.course || 'Mata Kuliah'}
                    </p>
                  </div>

                  {task.description && (
                    <p className={`text-sm mb-4 leading-relaxed line-clamp-3 ${
                      isTaskCompleted ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      {task.description}
                    </p>
                  )}

                  <div className="grid grid-cols-1 gap-3 mb-4 pb-4 border-b border-slate-100">
                    <div className={`flex items-start gap-2 text-xs ${
                      isTaskCompleted ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <BookOpen size={14} className="flex-shrink-0 text-purple-500 mt-0.5" />
                      <div className="break-words min-w-0">
                        <strong>Dosen:</strong> {task.lecturer || '-'}
                      </div>
                    </div>
                    <div className={`flex items-start gap-2 text-xs ${
                      isTaskCompleted ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <Calendar size={14} className="flex-shrink-0 text-violet-500 mt-0.5" />
                      <div className="break-words min-w-0">
                        <strong>Deadline:</strong> {task.deadline || '-'}
                      </div>
                    </div>
                    <div className={`flex items-start gap-2 text-xs ${
                      isTaskCompleted ? 'text-slate-300' : 'text-slate-600'
                    }`}>
                      <User size={14} className="flex-shrink-0 text-fuchsia-500 mt-0.5" />
                      <div className="break-words min-w-0">
                        <strong>Publisher:</strong> {task.publisher || 'Admin'}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-3 mt-auto">
                    <button
                      onClick={() => handleCompleteTask(task.id, isTaskCompleted)}
                      className={`flex-1 py-2.5 px-4 rounded-xl font-semibold text-sm transition-all flex items-center justify-center gap-2 ${
                        isTaskCompleted
                          ? 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                          : 'bg-gradient-to-r from-purple-500 to-violet-600 text-white hover:shadow-lg hover:shadow-purple-200'
                      }`}
                    >
                      <CheckCircle2 size={16} />
                      {isTaskCompleted ? 'Buka Lagi' : 'Tandai Selesai'}
                    </button>

                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="py-2.5 px-4 rounded-xl bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm transition-all flex items-center justify-center"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {filteredTasks.length === 0 && (
          <div className="text-center py-12">
            <p className="text-slate-500 font-medium">Tidak ada tugas yang cocok dengan filter</p>
          </div>
        )}
      </div>
    </div>
  );
}
