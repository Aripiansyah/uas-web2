import React, { useState, useEffect } from 'react';
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid
} from 'recharts';
import { Users, Loader2 } from 'lucide-react';
import { taskService, userService } from '../services/api';

export default function UserTaskAnalytics() {
  const [chartData, setChartData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let usersList = [];
    let completions = [];

    const computeChartData = () => {
      const aggregatedData = usersList.map((user) => {
        const totalSelesai = completions.filter(
          (comp) => comp.userId === user.id || comp.senderId === user.id,
        ).length;

        return {
          name: user.name?.length > 10 ? `${user.name.substring(0, 8)}..` : user.name || 'Unknown',
          fullName: user.name || 'Unknown User',
          jumlahTugas: totalSelesai,
        };
      });

      const top8Users = aggregatedData
        .sort((a, b) => b.jumlahTugas - a.jumlahTugas)
        .slice(0, 8);

      setChartData(top8Users);
      setLoading(false);
    };

    const unsubUsers = userService.subscribeUsers((users) => {
      usersList = users;
      computeChartData();
    });

    const unsubCompletions = taskService.subscribeAllTaskCompletions((data) => {
      completions = data;
      computeChartData();
    });

    return () => {
      unsubUsers();
      unsubCompletions();
    };
  }, []);

  // Custom Tooltip Pop-up saat batang di-hover kursor
  const CustomTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white/95 backdrop-blur-sm p-3 border border-slate-100 rounded-xl shadow-md">
          <p className="text-xs font-black text-slate-800">{payload[0].payload.fullName}</p>
          <p className="text-[11px] font-bold text-indigo-600 mt-0.5">
            Total Pengumpulan: {payload[0].value} Tugas
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <div className="w-full h-96 bg-white border border-slate-200/80 rounded-2xl flex flex-col items-center justify-center gap-2">
        <Loader2 className="text-indigo-500 animate-spin" size={24} />
        <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Memuat Data...</span>
      </div>
    );
  }

  return (
    <div className="w-full bg-white border border-slate-200/80 p-5 rounded-2xl shadow-sm">
      {/* Header Chart */}
      <div className="flex items-center gap-2.5 mb-6">
        <div className="w-8 h-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-600 flex items-center justify-center">
          <Users size={16} />
        </div>
        <div>
          <h3 className="text-xs font-black text-slate-800 tracking-tight">Peringkat Pengumpulan Tugas</h3>
          <p className="text-[10px] text-slate-400 font-semibold mt-0.5">8 Mahasiswa Paling Aktif Mengumpulkan Tugas</p>
        </div>
      </div>

      {/* Area Grafik Berdiri */}
      <div className="w-full h-80">
        {chartData.length === 0 || chartData.every(d => d.jumlahTugas === 0) ? (
          <div className="w-full h-full border border-dashed border-slate-200 rounded-xl bg-slate-50/50 flex flex-col items-center justify-center p-4">
            <p className="text-xs font-bold text-slate-400 uppercase">Belum ada tugas yang dikumpulkan</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={chartData}
              layout="horizontal"
              margin={{ top: 10, right: 5, left: -25, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />

              <XAxis
                dataKey="name"
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
              />

              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#94a3b8', fontSize: 10, fontWeight: 700 }}
                allowDecimals={false}
              />

              <Tooltip content={<CustomTooltip />} cursor={{ fill: '#f8fafc' }} />

              <Bar
                dataKey="jumlahTugas"
                fill="url(#taskGradasi)"
                radius={[6, 6, 0, 0]}
                maxBarSize={30}
              />

              <defs>
                <linearGradient id="taskGradasi" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#6366f1" stopOpacity={1} /> {/* Indigo */}
                  <stop offset="100%" stopColor="#a855f7" stopOpacity={0.8} /> {/* Purple */}
                </linearGradient>
              </defs>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}