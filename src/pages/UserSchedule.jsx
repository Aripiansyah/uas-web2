import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import { CalendarDays, Clock3, MapPin, Users, Monitor, SunMedium, Loader2, Info, BadgeCheck } from 'lucide-react';
import { scheduleService } from '../services/firebase';

const DAYS = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];

const getTodayName = () => {
  const name = DAYS[new Date().getDay()];
  return name === 'Minggu' || name === 'Sabtu' ? 'Senin' : name;
};

const getScheduleDay = (schedule) => schedule.hari || schedule.day || '';
const getTitle = (schedule) => schedule.matkul || schedule.subject || 'Mata Kuliah';
const getLecturer = (schedule) => schedule.lecturer || schedule.dosen || '-';
const getTime = (schedule) => {
  if (schedule.jamMulai || schedule.jamSelesai) return `${schedule.jamMulai || '--:--'} - ${schedule.jamSelesai || '--:--'}`;
  return schedule.time || '-';
};
const getRoom = (schedule) => schedule.ruangan || schedule.room || '-';
const getType = (schedule) => schedule.jenisKelas || schedule.classType || 'Offline';

export default function UserSchedule() {
  const [currentUser, setCurrentUser] = useState(() => JSON.parse(localStorage.getItem('currentUser')) || null);
  const [schedules, setSchedules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedDay, setSelectedDay] = useState(getTodayName());

  useEffect(() => {
    const user = JSON.parse(localStorage.getItem('currentUser'));
    setCurrentUser(user);
  }, []);

  useEffect(() => {
    const unsubscribe = scheduleService.subscribeSchedules((fetchedSchedules) => {
      setSchedules(fetchedSchedules || []);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    setSelectedDay(getTodayName());
  }, []);

  const visibleSchedules = useMemo(() => {
    return schedules.filter((schedule) => {
      const targetNim = schedule.targetNim;
      const targetUserIds = Array.isArray(schedule.assignedTo) ? schedule.assignedTo : [];
      const targetSemester = schedule.targetSemester;
      const targetMajor = schedule.targetMajor || schedule.major;

      const matchesUser =
        !currentUser ||
        (!targetNim && targetUserIds.length === 0 && !targetSemester && !targetMajor) ||
        targetNim === currentUser.nim ||
        targetUserIds.includes(currentUser.uid) ||
        targetUserIds.includes(currentUser.nim) ||
        (targetSemester ? String(targetSemester) === String(currentUser.semester || currentUser.sem) : true) &&
          (targetMajor ? String(targetMajor).toLowerCase() === String(currentUser.major || currentUser.program || '').toLowerCase() : true);

      const matchesDay = getScheduleDay(schedule).toLowerCase() === selectedDay.toLowerCase();
      return matchesUser && matchesDay;
    });
  }, [schedules, currentUser, selectedDay]);

  const todaySchedules = useMemo(() => {
    const today = getTodayName();
    return visibleSchedules.filter((schedule) => getScheduleDay(schedule).toLowerCase() === today.toLowerCase());
  }, [visibleSchedules]);

  const classCount = visibleSchedules.length;
  const todayName = getTodayName();

  return (
    <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="max-w-7xl mx-auto space-y-6">
      <div className="rounded-[32px] border border-cyan-100 bg-gradient-to-br from-indigo-600 via-violet-600 to-cyan-500 p-6 md:p-8 text-white shadow-2xl shadow-indigo-200/40 relative overflow-hidden">
        <div className="absolute inset-0 bg-white/10 backdrop-blur-[1px]" />
        <div className="relative flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="space-y-2">
            <div className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.22em]">
              <CalendarDays size={13} /> Real-time Schedule
            </div>
            <h1 className="text-3xl md:text-4xl font-black tracking-tight">Jadwal Kuliah Mahasiswa</h1>
            <p className="max-w-2xl text-sm text-white/85">Sinkron dengan data jadwal admin dan diperbarui langsung dari database.</p>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <StatPill icon={SunMedium} label="Hari Ini" value={todayName} />
            <StatPill icon={Users} label="Total Kelas" value={classCount} />
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-slate-100 bg-white/90 p-2 shadow-sm backdrop-blur">
        {DAYS.slice(1, 6).map((day) => {
          const isActive = selectedDay === day;
          const isToday = todayName === day;
          return (
            <button
              key={day}
              onClick={() => setSelectedDay(day)}
              className={`rounded-xl px-4 py-2 text-xs font-black transition-all ${isActive ? 'bg-slate-900 text-white shadow-md' : 'text-slate-600 hover:bg-slate-100'}`}
            >
              {day} {isToday ? '•' : ''}
            </button>
          );
        })}
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Today's Schedule</h2>
            <p className="text-xs text-slate-500">Kelas untuk hari {todayName.toLowerCase()}</p>
          </div>
          <span className="rounded-full bg-emerald-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-emerald-700">Live</span>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : todaySchedules.length === 0 ? (
          <EmptyState title="Tidak ada kelas hari ini" description="Jadwal admin belum memiliki kelas untuk hari ini atau belum ditujukan ke akun Anda." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {todaySchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} highlighted />
            ))}
          </div>
        )}
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900">Jadwal Hari {selectedDay}</h2>
            <p className="text-xs text-slate-500">Data realtime dari koleksi schedules</p>
          </div>
          <span className="rounded-full bg-violet-50 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em] text-violet-700">{visibleSchedules.length} kelas</span>
        </div>

        {loading ? (
          <SkeletonGrid />
        ) : visibleSchedules.length === 0 ? (
          <EmptyState title="Jadwal kosong" description="Tidak ada data jadwal yang cocok untuk hari ini atau filter pengguna." />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {visibleSchedules.map((schedule) => (
              <ScheduleCard key={schedule.id} schedule={schedule} highlighted={getScheduleDay(schedule).toLowerCase() === todayName.toLowerCase()} />
            ))}
          </div>
        )}
      </section>
    </motion.div>
  );
}

function StatPill({ icon: Icon, label, value }) {
  return (
    <div className="rounded-2xl border border-white/20 bg-white/10 p-3 backdrop-blur-md">
      <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-white/80">
        <Icon size={12} /> {label}
      </div>
      <div className="mt-1 text-sm font-black">{value}</div>
    </div>
  );
}

function ScheduleCard({ schedule, highlighted = false }) {
  const title = getTitle(schedule);
  const lecturer = getLecturer(schedule);
  const day = getScheduleDay(schedule);
  const time = getTime(schedule);
  const room = getRoom(schedule);
  const type = getType(schedule);
  const gradient = highlighted ? 'from-cyan-500 via-violet-600 to-indigo-700' : 'from-slate-900 via-slate-800 to-violet-900';

  return (
    <motion.article whileHover={{ y: -4 }} className={`overflow-hidden rounded-[28px] border ${highlighted ? 'border-cyan-200 ring-2 ring-cyan-100' : 'border-slate-100'} bg-white shadow-lg`}>
      <div className={`bg-gradient-to-br ${gradient} p-5 text-white`}>
        <div className="flex items-center justify-between">
          <span className="rounded-full bg-white/15 px-3 py-1 text-[10px] font-black uppercase tracking-[0.2em]">{day}</span>
          {highlighted && <BadgeCheck size={16} className="text-cyan-200" />}
        </div>
        <h3 className="mt-4 text-lg font-black leading-tight">{title}</h3>
        <p className="mt-1 text-sm text-white/80">{lecturer}</p>
      </div>

      <div className="space-y-3 p-5">
        <DetailRow icon={Clock3} label="Waktu" value={time} />
        <DetailRow icon={MapPin} label="Ruangan" value={room} />
        <DetailRow icon={Monitor} label="Kelas" value={type} />
      </div>
    </motion.article>
  );
}

function DetailRow({ icon: Icon, label, value }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-slate-50 px-4 py-3">
      <Icon size={16} className="mt-0.5 text-violet-600" />
      <div className="min-w-0">
        <p className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</p>
        <p className="break-words text-sm font-bold text-slate-800">{value}</p>
      </div>
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="animate-pulse rounded-[28px] border border-slate-100 bg-white p-5 shadow-sm">
          <div className="h-40 rounded-2xl bg-slate-100" />
          <div className="mt-4 space-y-3">
            <div className="h-4 w-2/3 rounded bg-slate-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
            <div className="h-16 rounded-2xl bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}

function EmptyState({ title, description }) {
  return (
    <div className="rounded-[28px] border border-dashed border-slate-200 bg-white p-12 text-center shadow-sm">
      <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-violet-50 text-violet-600">
        <Info size={26} />
      </div>
      <h3 className="text-base font-black text-slate-900">{title}</h3>
      <p className="mx-auto mt-1 max-w-md text-xs font-medium text-slate-500">{description}</p>
    </div>
  );
}
