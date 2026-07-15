import React, { useState, useEffect } from 'react';
import { 
  Search, Calendar, Clock, MapPin, User, 
  Filter, Loader2, CheckCircle, 
  BookOpen, Layers, Monitor, SlidersHorizontal, Info, AlertCircle
} from 'lucide-react';
import { scheduleService } from '../../services/api';


// Konfigurasi Pilihan Mata Kuliah & SKS bawaan (untuk warna di kartu & input SKS)
const MATKUL_DATA = [
  { name: "Pemrograman Web 2", sks: 3, color: "from-blue-600 to-cyan-600" },
  { name: "Android Development Associate (ADA)", sks: 3, color: "from-indigo-600 to-purple-600" },
  { name: "Metodologi Penelitian Informatika", sks: 3, color: "from-amber-500 to-orange-600" },
  { name: "Penambangan Data", sks: 3, color: "from-rose-500 to-pink-600" },
  { name: "Pengujian Perangkat Lunak", sks: 3, color: "from-emerald-500 to-teal-600" },

  // 2 matkul tambahan: pakai warna netral (tanpa tambah gradien baru)
  { name: "Sistem Mikrokontroler", sks: 3, color: "from-slate-700 to-slate-800" },
  { name: "Teknik Penulisan Literatur Ilmiah", sks: 2, color: "from-slate-700 to-slate-800" }
];

const HARI_LIST = ["Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];

export default function Schedules() {
  // --- STATE MANAGEMENT ---
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);

  // UI Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [filterHari, setFilterHari] = useState('All');
  const [filterMatkul, setFilterMatkul] = useState('All');
  const [selectedDayTab, setSelectedDayTab] = useState('All'); // Planner Tab
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Get Today's Date String for Header
  const todayFormatted = new Date().toLocaleDateString('id-ID', { 
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' 
  });

  // --- REALTIME DATA SYNC ---
  useEffect(() => {
    setLoading(true);
    // Menggunakan scheduleService dari backend API
    if (scheduleService && scheduleService.subscribeSchedules) {
      const unsubscribe = scheduleService.subscribeSchedules((fetched) => {
        setSchedules(fetched);
        setLoading(false);
      });
      return () => unsubscribe();
    } else {
      // Data Mock-up Premium jika backend service Schedules belum siap
      setTimeout(() => {
        setSchedules([
          { id: '1', matkul: 'Pemrograman Mobile 2', lecturer: 'Budi Rahman, M.Kom', hari: 'Senin', jamMulai: '08:00', jamSelesai: '10:30', ruangan: 'Lab Komputer 3', jenisKelas: 'Offline', sks: 3 },
          { id: '2', matkul: 'Rekayasa Perangkat Lunak', lecturer: 'Siti Nurhaliza, S.T., M.T.', hari: 'Selasa', jamMulai: '13:00', jamSelesai: '15:30', ruangan: 'Ruang Teori 2.4', jenisKelas: 'Offline', sks: 3 },
          { id: '3', matkul: 'Kecerdasan Buatan', lecturer: 'Dr. Andi Saputra', hari: 'Kamis', jamMulai: '10:00', jamSelesai: '12:00', ruangan: 'Zoom Cloud Meeting', jenisKelas: 'Online', sks: 3 },
        ]);
        setLoading(false);
      }, 8000);
    }
  }, []);

  // --- TOAST HELPER ---
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // --- STATISTIK KALKULATOR ---
  const totalMatkul = schedules.length;
  const totalSKS = schedules.reduce((acc, curr) => acc + (Number(curr.sks) || 3), 0);
  const kelasOnlineCount = schedules.filter(s => s.jenisKelas === 'Online').length;
  
  const currentDayName = new Date().toLocaleDateString('id-ID', { weekday: 'long' });
  const jadwalHariIniCount = schedules.filter(s => s.hari?.toLowerCase() === currentDayName?.toLowerCase()).length;

  // --- FILTER & SEARCH PROCESSING ---
  const filteredSchedules = schedules.filter(sch => {
    const matkulValue = sch.matkul || sch.subject || '';
    const matchesSearch = matkulValue?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          sch.lecturer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesHariSelect = filterHari === 'All' || sch.hari === filterHari;
    const matchesMatkulSelect = filterMatkul === 'All' || matkulValue === filterMatkul;
    
    // Sinkronisasi dengan Tab Filter Horizontal Mingguan
    const matchesTabHari = selectedDayTab === 'All' || sch.hari === selectedDayTab;

    return matchesSearch && matchesHariSelect && matchesMatkulSelect && matchesTabHari;
  });

  // Helper badge waktu (Pagi/Siang/Malam)
  const getWaktuBadge = (jamStr) => {
    if (!jamStr) return 'Pagi';
    const hour = parseInt(jamStr.split(':')[0]);
    if (hour < 11) return 'Pagi';
    if (hour < 16) return 'Siang';
    return 'Malam';
  };

  return (
    <div className="w-full space-y-8 pb-16">
      
      {/* Toast Notification Premium */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl border ${
          toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' : 'bg-rose-50/95 border-rose-200 text-rose-800'
        }`}>
          <CheckCircle size={18} className={toast.type === 'success' ? 'text-emerald-600' : 'text-rose-600'} />
          <span className="text-xs font-bold tracking-wide">{toast.message}</span>
        </div>
      )}

      {/* --- PREMIUM COMPREHENSIVE HEADER --- */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-slate-100 pb-6">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl">
              <Calendar size={22} />
            </div>
            <h1 className="text-2xl font-black text-slate-900 tracking-tight md:text-3xl">Jadwal Perkuliahan</h1>
          </div>
          <p className="text-xs text-slate-400 mt-1 font-medium">Manajemen waktu kelas, alokasi ruangan, sinkronisasi SKS, dan agenda mingguan terintegrasi.</p>
        </div>
        
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 w-full lg:w-auto">
          <div className="bg-slate-40 border border-blue-500/90 rounded-xl px-2 py-2.5 text-center flex flex-col justify-center items-end gap-0.5">
            <span className="text-[10px] uppercase font-black tracking-wider text-cyan-400">Kalender Hari Ini</span>
            <span className="text-xs font-bold text-red-700 mt-0.5">{todayFormatted}</span>
          </div>
        </div>
      </div>

      {/* --- METRIC STATS GRID CARDS --- */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Stat 1 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Layers size={20} /></div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-blue-400">Total Matkul</div>
            <div className="text-xl font-black text-yellow-400 mt-0.5">{totalMatkul} <span className="text-xs font-medium text-shadow-fuchsia-400">Kelas</span></div>
          </div>
        </div>
        {/* Stat 2 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-purple-50 text-purple-600 rounded-xl"><BookOpen size={20} /></div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-purple-400">Akumulasi SKS</div>
            <div className="text-xl font-black text-green-400 mt-0.5">{totalSKS} <span className="text-xs font-medium text-shadow-fuchsia-400">Bobot</span></div>
          </div>
        </div>
        {/* Stat 3 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Clock size={20} /></div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-amber-600">Jadwal Hari Ini</div>
            <div className="text-xl font-black text-fuchsia-500 mt-0.5">{jadwalHariIniCount} <span className="text-xs font-medium text-shadow-indigo-600">Matkul</span></div>
          </div>
        </div>
        {/* Stat 4 */}
        <div className="bg-white p-4 rounded-2xl border border-slate-100 shadow-xs flex items-center gap-4">
          <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl"><Monitor size={20} /></div>
          <div>
            <div className="text-[10px] uppercase font-black tracking-wider text-emerald-400">Kelas Online</div>
            <div className="text-xl font-black text-cyan-400 mt-0.5">{kelasOnlineCount} <span className="text-xs font-medium text-shadow-cyan-400">Vicon</span></div>
          </div>
        </div>
      </div>

      {/* --- WEEKLY HORIZONTAL CALENDAR PLANNER ROW --- */}
      <div className="bg-gradient-to-r from-cyan-500 to-purple-500 text-white p-2.5 rounded-2xl flex flex-wrap gap-1 shadow-md">
        <button
          onClick={() => setSelectedDayTab('All')}
          className={`flex-1 min-w-[70px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all ${
            selectedDayTab === 'All' ? 'bg-white text-green-400 shadow-xs' : 'text-black-800 hover:text-white'
          }`}
        >
          Semua Hari
        </button>
        {HARI_LIST.map((day) => {
          const isToday = day.toLowerCase() === currentDayName.toLowerCase();
          return (
            <button
              key={day}
              onClick={() => setSelectedDayTab(day)}
              className={`flex-1 min-w-[70px] text-center py-2 px-3 rounded-xl text-xs font-bold transition-all relative ${
                selectedDayTab === day 
                  ? 'bg-white text-purple-600 shadow-md' 
                  : 'text-white-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {day}
              {isToday && <span className="absolute bottom-1 left-1/2 transform -translate-x-1/2 w-1 h-1 bg-emerald-400 rounded-full" />}
            </button>
          );
        })}
      </div>

      {/* --- ADVANCED FILTER BAR CONTROLS --- */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-2xs">
        <div className="relative w-full md:flex-1">
          <Search className="absolute left-3.5 top-3 text-slate-400" size={16} />
          <input
            type="text"
            placeholder="Cari jadwal berdasarkan nama dosen atau nama mata kuliah..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-xs font-semibold text-slate-700 focus:outline-none focus:border-indigo-500 focus:bg-white transition-all"
          />
        </div>

        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto">
          <div className="flex items-center gap-1 text-slate-400 text-xs font-bold bg-slate-50 p-2 rounded-xl flex-shrink-0">
            <SlidersHorizontal size={13} />
            <span>Filter:</span>
          </div>
          <select
            value={filterHari}
            onChange={(e) => setFilterHari(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none"
          >
            <option value="All">Pilih Hari</option>
            {HARI_LIST.map(h => <option key={h} value={h}>{h}</option>)}
          </select>
          <select
            value={filterMatkul}
            onChange={(e) => setFilterMatkul(e.target.value)}
            className="px-3 py-2 bg-slate-50 border border-slate-200/60 rounded-xl text-[11px] font-bold text-slate-600 focus:outline-none max-w-[160px] truncate"
          >
            <option value="All">Semua Matkul</option>
            {MATKUL_DATA.map((m, idx) => <option key={idx} value={m.name}>{m.name}</option>)}
          </select>
        </div>
      </div>

      {/* --- ACADEMIC GRID CARD INTERACTIVE SCHEDULER LAYOUT --- */}
      {loading ? (
        <div className="w-full flex flex-col items-center justify-center py-24 gap-3 text-slate-400">
          <Loader2 size={36} className="animate-spin text-indigo-500" />
          <p className="text-xs font-bold">Sinkronisasi Basis Data Kalender Akademik...</p>
        </div>
      ) : filteredSchedules.length === 0 ? (
        /* Empty State */
        <div className="bg-white border border-dashed border-slate-200 p-16 rounded-3xl text-center max-w-xl mx-auto flex flex-col items-center">
          <div className="w-14 h-14 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center text-slate-400 mb-4 shadow-3xs">
            <AlertCircle size={26} />
          </div>
          <h3 className="text-base font-extrabold text-slate-800">Tidak Ada Agenda Kelas</h3>
          <p className="text-xs text-slate-400 mt-1">Planner kosong untuk kriteria filter ini. Tambahkan agenda kelas baru di atas.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredSchedules.map((sch) => {
            // Pasangkan warna dinamis berdasarkan mata kuliah
            const matkulValue = sch.matkul || sch.subject || '-';
            const matchedMatkul = MATKUL_DATA.find(m => m.name === matkulValue);
            const gradientColor = matchedMatkul ? matchedMatkul.color : "from-slate-700 to-slate-800";
            const isTodayClass = sch.hari?.toLowerCase() === currentDayName?.toLowerCase();
            const waktuLabel = getWaktuBadge(sch.jamMulai);
            return (
              <div 
                key={sch.id}
                className={`bg-white border rounded-2xl shadow-2xs hover:shadow-xl hover:-translate-y-1 transition-all duration-300 flex flex-col justify-between overflow-hidden relative group ${
                  isTodayClass ? 'ring-2 ring-indigo-500 ring-offset-2' : 'border-slate-100'
                }`}
              >
                {/* Header Bagian Atas Card */}
                <div className={`bg-gradient-to-r ${gradientColor} p-4 text-white relative`}>
                  {isTodayClass && (
                    <span className="absolute top-3 right-3 px-2 py-0.5 bg-white/10 rounded-md text-[9px] font-black tracking-wider uppercase text-white">
                      Hari Ini
                    </span>
                  )}
                  <span className="text-[10px] font-bold tracking-wider uppercase opacity-75 block">Mata Kuliah</span>
                  <h3 className="text-sm font-black mt-1 leading-snug tracking-tight truncate-2-lines h-10 text-[#ffffff]">
                    {matkulValue}
                  </h3>
                </div>

                {/* Konten Detail Parameter Jadwal */}
                <div className="p-4 space-y-3 flex-1">
                  {/* Badges Bar Row */}
                  <div className="flex flex-wrap gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-extrabold text-[9px] uppercase tracking-wide">
                      {sch.hari}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-extrabold uppercase tracking-wide ${
                      waktuLabel === 'Pagi' ? 'bg-sky-50 text-sky-700' : waktuLabel === 'Siang' ? 'bg-amber-50 text-amber-700' : 'bg-indigo-50 text-indigo-700'
                    }`}>
                      {waktuLabel}
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-wide ${
                      sch.jenisKelas === 'Online' ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-800 text-white'
                    }`}>
                      {sch.jenisKelas || 'Offline'}
                    </span>
                  </div>

                  {/* Detil Jam, Ruangan, Dosen */}
                  <div className="pt-2 border-t border-slate-50 space-y-2.5 text-[11px] text-purple-900 from-indigo-900 to-violet-600ont-semibold">
                    <div className="flex items-center gap-2">
                      <Clock size={13} className="text-slate-400 flex-shrink-0" />
                      <span>Jam: <strong className="text-green-700 font-bold">{sch.jamMulai} - {sch.jamSelesai}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <MapPin size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">Ruang: <strong className="text-purple-700 font-bold">{sch.ruangan}</strong></span>
                    </div>
                    <div className="flex items-center gap-2 truncate">
                      <User size={13} className="text-slate-400 flex-shrink-0" />
                      <span className="truncate">Dosen: <strong className="text-indigo-600 font-bold">{sch.lecturer}</strong></span>
                    </div>
                  </div>
                </div>

                {/* Footer Card: Info Bobot SKS */}
                <div className="bg-slate-50/70 border-t border-slate-100/80 px-4 py-3">
                  <span className="text-[10px] font-black text-slate-400 uppercase tracking-wide">
                    Bobot: {sch.sks || 3} SKS
                  </span>
                </div>

              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}
