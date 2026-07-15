import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Star, Award, BarChart2, Shield, Mail, ChevronRight, Camera, Key } from 'lucide-react';
import { quizService, userService } from '../../services/api';

export default function UserProfile() {
  const [userData, setUserData] = useState(null);
  const [ranking, setRanking] = useState('-');
  const [averageScore, setAverageScore] = useState(0);
  
  const currentUser = JSON.parse(localStorage.getItem('currentUser'));

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubUser = userService.subscribeUserById(currentUser.uid, async (data) => {
      if (data) {
        setUserData(data);
      }

      const history = await quizService.getUserQuizCompletions(currentUser.uid);
      if (history.length > 0) {
        const total = history.reduce((acc, curr) => acc + (curr.score || 0), 0);
        setAverageScore(Math.round(total / history.length));
      } else {
        setAverageScore(0);
      }
    });

    const unsubRank = userService.subscribeUsers((users) => {
      const sortedUsers = [...users].sort((a, b) => 
        (b.total_points || b.totalPoints || 0) - (a.total_points || a.totalPoints || 0)
      );
      const index = sortedUsers.findIndex((user) => (user.id || user.uid) === currentUser.uid);
      if (index !== -1) setRanking(index + 1);
    });

    return () => {
      unsubUser();
      unsubRank();
    };
  }, []);

  if (!userData) {
    return <div className="text-center py-20 text-xs font-bold text-slate-400">Memuat profil mahasiswa...</div>;
  }

  return (
    <motion.div 
      initial={{ opacity: 0, y: 20 }} 
      animate={{ opacity: 1, y: 0 }} 
      className="max-w-5xl mx-auto space-y-8 p-2"
    >
      {/* Profile Cover & Glassmorphism Avatar Header */}
      <div className="relative h-60 bg-gradient-to-r from-indigo-600 to-violet-600 rounded-[32px] overflow-hidden shadow-xl shadow-indigo-100">
        <div className="absolute inset-0 bg-white/5 backdrop-blur-[1px]" />
        
        <div className="absolute -bottom-2 left-10 transform flex items-end gap-6 pb-6">
          <div className="relative group">
            <img 
              src={`https://ui-avatars.com/api/?name=${userData.name}&background=4F46E5&color=fff&size=150`} 
              className="w-32 h-32 rounded-2xl border-4 border-white shadow-2xl object-cover bg-white" 
              alt="avatar" 
            />
            <div className="absolute inset-0 rounded-2xl bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer text-white">
              <Camera size={20} />
            </div>
          </div>
          <div className="mb-4 text-white">
            <h2 className="text-2xl font-black tracking-tight">{userData.name}</h2>
            <p className="text-xs text-white/80 font-semibold mt-0.5">{userData.nim || 'NIM Tidak Terdaftar'}</p>
          </div>
        </div>
      </div>

      {/* Real-time Gamification Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <MiniStats label="Total Poin" value={userData.total_points || userData.totalPoints || 0} icon={Trophy} gradient="from-amber-400 to-orange-500" />
        <MiniStats label="Quiz Selesai" value={userData.quizzes_completed || userData.quizzesCompleted || 0} icon={Award} gradient="from-indigo-500 to-violet-600" />
        <MiniStats label="Rata-Rata Nilai" value={`${averageScore}/100`} icon={Star} gradient="from-emerald-400 to-teal-500" />
        <MiniStats label="Peringkat Global" value={`#${ranking}`} icon={BarChart2} gradient="from-rose-500 to-pink-500" />
      </div>

      {/* Detail Form Data Akademik */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-2 bg-white p-8 rounded-[32px] border border-slate-100 shadow-xs space-y-6">
          <h3 className="text-base font-black text-slate-900 tracking-tight">Detail Profil Informasi Akademik</h3>
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <InfoBlock label="Nomor Induk Mahasiswa" value={userData.nim || '-'} />
            <InfoBlock label="Program Studi / Jurusan" value="Teknik Informatika" />
            <InfoBlock label="Angkatan Akademik" value="Angkatan 2023" />
            <InfoBlock label="Fakultas" value="Ilmu Komputer" />
          </div>

          <div className="pt-6 border-t border-slate-100 flex gap-3">
            <button className="px-6 py-2.5 bg-slate-900 hover:bg-indigo-600 text-white rounded-xl font-bold text-xs shadow-md transition-all active:scale-98">
              Update Data Profil
            </button>
          </div>
        </div>

        {/* Security Management Sidebar Panel */}
        <div className="bg-white p-6 rounded-[32px] border border-slate-100 shadow-xs h-max space-y-4">
          <h3 className="text-sm font-black text-slate-900 uppercase tracking-wider text-slate-400 mb-2">Keamanan Akun</h3>
          <SecurityRow icon={Shield} label="Ganti Password" color="text-indigo-500" />
          <SecurityRow icon={Mail} label="Ubah Email Utama" color="text-violet-500" />
        </div>
      </div>
    </motion.div>
  );
}

// --- SUB-KOMPONEN REUSABLE PREMIUM ---
const MiniStats = ({ label, value, icon: Icon, gradient }) => (
  <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-xs flex items-center justify-between group overflow-hidden relative">
    <div className="space-y-1">
      <span className="text-[10px] font-black uppercase text-slate-400 tracking-widest block">{label}</span>
      <span className="text-xl font-black text-slate-800 block tracking-tight">{value}</span>
    </div>
    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md group-hover:scale-105 transition-transform duration-300`}>
      <Icon size={18} />
    </div>
  </div>
);

const InfoBlock = ({ label, value }) => (
  <div className="bg-slate-50/50 p-4 rounded-xl border border-slate-100/60">
    <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{label}</p>
    <p className="text-xs font-bold text-slate-700">{value}</p>
  </div>
);

const SecurityRow = ({ icon: Icon, label, color }) => (
  <div className="flex items-center justify-between p-3.5 bg-slate-50/50 hover:bg-slate-50 border border-slate-100 rounded-xl cursor-pointer transition-all group">
    <div className="flex items-center gap-3">
      <Icon size={16} className={color} />
      <span className="text-xs font-bold text-slate-700">{label}</span>
    </div>
    <ChevronRight size={14} className="text-slate-400 group-hover:translate-x-0.5 transition-transform" />
  </div>
);
