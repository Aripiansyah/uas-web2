import React, { useState, useEffect, useRef } from 'react';
import { PieChart, Pie, Cell, ResponsiveContainer, AreaChart, Area, BarChart, Bar, Line, Legend, Tooltip, CartesianGrid, XAxis, YAxis, LabelList } from 'recharts';
import { CheckCircle2, Clock, BookOpen, User, Calendar, Award, Trash2, Trophy, Medal } from 'lucide-react';
import { taskService, userService, scheduleService, quizService } from '../../services/firebase';
import Toast from '../../components/Toast';
import { useNavigate } from 'react-router-dom';
import UserTaskAnalytics from '../../components/UserTaskAnalytics';
import SubjectCompletionBarChart from '../../components/SubjectCompletionBarChart';
import AssignmentFrequencyRadar from '../../components/AssignmentFrequencyRadar';
import TaskPriorityStatusBarChart from '../../components/TaskPriorityStatusBarChart';


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
  const usersByIdRef = useRef({});

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
      const usersMap = {};
      users.forEach((u) => {
        usersMap[u.id] = u.name || 'Anonymous';
      });
      usersByIdRef.current = usersMap;

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
    
  }, []);

  // Subscribe to current user's tasks (DB-driven)
  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribeTasks = taskService.subscribeTasks((fetchedTasks) => {
      const userId = currentUser.uid;

      const userTasks = fetchedTasks.filter((task) => {
        if (!task.assignedTo || !Array.isArray(task.assignedTo)) return false;
        // Include tasks assigned to this user OR tasks broadcast to all (assignedTo empty)
        return task.assignedTo.includes(userId) || task.assignedTo.length === 0;
      });

      setTasks(userTasks);
    });

    const unsubscribeCompletions = taskService.subscribeUserTaskCompletions(
      currentUser.uid,
      (completedTaskIds) => {
        setUserCompletedTasks(Array.isArray(completedTaskIds) ? completedTaskIds : []);
      }
    );

    return () => {
      unsubscribeTasks?.();
      unsubscribeCompletions?.();
    };
  }, [currentUser?.uid]);

 

  useEffect(() => {
    const completedCount = userCompletedTasks.length;
    const urgentCount = tasks.filter(
      (t) => !userCompletedTasks.includes(t.id) && t.priority === 'High'
    ).length;
    const mediumCount = tasks.filter(
      (t) => !userCompletedTasks.includes(t.id) && t.priority === 'Medium'
    ).length;
    const lowCount = tasks.filter(
      (t) => !userCompletedTasks.includes(t.id) && t.priority === 'Low'
    ).length;

    setSpeedData([
      { name: 'Done', nilai: completedCount, fill: '#10b981' },
      { name: 'High', nilai: urgentCount, fill: '#ef4444' },
      { name: 'Medium', nilai: mediumCount, fill: '#f59e0b' },
      { name: 'Low', nilai: lowCount, fill: '#3b82f6' },
    ]);
  }, [tasks, userCompletedTasks]);

  useEffect(() => {
    const unsubscribeAllCompletions = taskService.subscribeAllTaskCompletions((completions) => {
      const completionCountMap = {};

      completions.forEach((c) => {
        const userId = c.userId;
        if (!userId) return;
        completionCountMap[userId] = (completionCountMap[userId] || 0) + 1;
      });

      const formatted = Object.keys(completionCountMap)
        .map((userId) => ({
          name: usersByIdRef.current[userId] || 'Anonymous',
          jumlahTugas: completionCountMap[userId],
        }))
        .sort((a, b) => b.jumlahTugas - a.jumlahTugas)
        .slice(0, 5);

      setAnalyticsData(formatted);
    });

    return () => unsubscribeAllCompletions();
  }, []);

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

  // Fungsi untuk nge-hash nama user menjadi warna Tailwind yang konsisten
  function getUserColorClass(name) {
    if (!name) return 'text-purple-600';
    
    // Daftar variasi warna cerah yang kontras di background putih
    const colors = [
      'text-pink-600',
      'text-purple-600',
      'text-indigo-600',
      'text-cyan-600',
      'text-emerald-600',
      'text-rose-600',
      'text-amber-600',
      'text-orange-600',
      'text-sky-600',
      'text-violet-600'
    ];

    // Hitung nilai hash dari karakter nama
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }

    // Pilih warna berdasarkan sisa hasil bagi (modulus)
    const index = Math.abs(hash) % colors.length;
    return colors[index];
  }

  return (
    <div className="space-y-8">
      {toast && <Toast message={toast.msg} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="soft-card border border-slate-200 p-6 rounded-2xl shadow-sm">
        <h1 className="text-2xl md:text-3xl font-extrabold tracking-tight text-slate-900">
          Selamat Datang, 
          <span className={`font-bold ${getUserColorClass(currentUser.name)}`}>
            {currentUser.name}
          </span>! 👋
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

      {/* RECENT ACTIVITY */}
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

    {/* Ranking Badges */}
    <div className="mt-3 md:mt-6 grid grid-cols-3 md:grid-cols-3 gap-3 md:gap-4">
      {leaderboardData.slice(0, 3).map((user, idx) => {
        const medals = ['🥇', '🥈', '🥉'];
        return (
          <div key={idx} className="bg-gradient-to-br from-slate-50 to-slate-100 p-3 md:p-4 rounded-xl border border-slate-200 flex items-center gap-3">
            <span className="text-1xl md:text-1xl flex items-center justify-center w-8 h-8 md:w-10 md:h-10">{medals[idx]}</span>
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

      {/* Chart Section */}
    <div className=" soft-card border border-amber-700 border-2 hover:bor  rounded-2xl p-4 md:p-6 shadow-sm hover:shadow-md transition-shadow  w-full h-[280px] md:h-80">
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
              const colors = ['#06b6d4', '#ec4899', '#f59e0b', '#06b6d4', '#3b82f6'];
              return <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />;
            })}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>



      {/* DIAGRAMS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* DIAGRAM 1: Completed vs Pending by Subject (Realtime) */}
        <SubjectCompletionBarChart
          tasks={tasks}
          completedTaskIds={userCompletedTasks}
          title="Completed vs Pending by Subject"
          maxSubjects={8}
        />

        {/* DIAGRAM 2: Assignment Frequency Radar (Realtime) */}
        <div className="lg:col-span-1">
          <AssignmentFrequencyRadar tasks={tasks} />
        </div>

        {/* DIAGRAM 3: Priority vs Completion (Realtime) */}
        <TaskPriorityStatusBarChart
          tasks={tasks}
          completedTaskIds={userCompletedTasks}
          title="Priority vs Completion"
        />
      </div>
    </div>
  );
}
