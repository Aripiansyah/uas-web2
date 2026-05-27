import React, { useEffect, useMemo, useState } from 'react';
import {
  RotateCcw,
  Users,
  Search,
  AlertTriangle,
  Loader2,
  ArrowUpDown,
  Check
} from 'lucide-react';
import { quizService, userService } from '../../services/firebase';
import Toast from '../../components/Toast';

export default function ResetScore() {
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(true);

  const [searchTerm, setSearchTerm] = useState('');
  const [sortBy, setSortBy] = useState('points'); // 'points' | 'name'

  const [toast, setToast] = useState(null);

  const [confirmOpen, setConfirmOpen] = useState(false);
  const [confirmMode, setConfirmMode] = useState('single'); // 'single' | 'all'
  const [selectedUser, setSelectedUser] = useState(null);

  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoadingUsers(true);

    const unsubscribe = userService.subscribeUsers((fetchedUsers) => {
      const nonAdminUsers = fetchedUsers.filter((u) => u.role !== 'Admin');
      setUsers(nonAdminUsers);
      setLoadingUsers(false);
    });

    return () => unsubscribe?.();
  }, []);

  const filteredAndSortedUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();

    const filtered = !q
      ? users
      : users.filter((u) => {
          const name = (u.name || '').toLowerCase();
          const nim = (u.nim || '').toLowerCase();
          return name.includes(q) || nim.includes(q);
        });

    const sorted = [...filtered].sort((a, b) => {
      if (sortBy === 'name') {
        return String(a.name || '').localeCompare(String(b.name || ''));
      }
      return (b.totalPoints || 0) - (a.totalPoints || 0);
    });

    return sorted;
  }, [users, searchTerm, sortBy]);

  const openSingleReset = (user) => {
    setConfirmMode('single');
    setSelectedUser({ id: user.id, name: user.name });
    setConfirmOpen(true);
  };

  const openAllReset = () => {
    setConfirmMode('all');
    setSelectedUser(null);
    setConfirmOpen(true);
  };

  const closeModal = () => {
    if (submitting) return;
    setConfirmOpen(false);
    setSelectedUser(null);
  };

  const handleConfirmReset = async () => {
    if (!confirmOpen) return;

    setSubmitting(true);
    try {
      if (confirmMode === 'single') {
        if (!selectedUser?.id) throw new Error('User tidak valid.');
        await quizService.resetUserQuizData(selectedUser.id);
        setToast({ message: `Score user "${selectedUser.name}" berhasil direset`, type: 'success' });
      } else {
        await quizService.resetAllUserQuizData();
        setToast({ message: 'Semua score berhasil direset', type: 'success' });
      }

      setConfirmOpen(false);
      setSelectedUser(null);
    } catch (e) {
      console.error(e);
      setToast({ message: 'Gagal mereset score.', type: 'error' });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full space-y-8 pb-16 min-h-screen">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* Header */}
      <div className="soft-card border border-slate-200 p-6 md:p-8 rounded-2xl shadow-sm">
        <div className="flex items-start justify-between gap-6 flex-wrap">
          <div>
            <div className="flex items-center gap-3">
              <RotateCcw size={26} className="text-indigo-600" />
              <h1 className="text-2xl md:text-3xl font-extrabold text-slate-900">Reset Quiz Score</h1>
            </div>
            <p className="text-sm text-slate-500 mt-2">
              Kelola dan reset point quiz mahasiswa secara aman (konfirmasi wajib).
            </p>
          </div>

          <button
            onClick={openAllReset}
            disabled={submitting}
            className="px-4 py-3 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-600 font-bold text-sm hover:bg-rose-500/15 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2 justify-center">
              {submitting ? <Loader2 size={16} className="animate-spin" /> : <AlertTriangle size={16} />}
              Reset All Scores
            </div>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="soft-card border border-slate-200 p-4 md:p-6 rounded-2xl shadow-sm">
        <div className="flex flex-col md:flex-row gap-3 md:items-center md:justify-between">
          <div className="flex items-center gap-2">
            <Users size={18} className="text-indigo-600" />
            <span className="font-bold text-slate-900">Daftar User</span>
            <span className="text-xs font-bold text-slate-500">
              ({filteredAndSortedUsers.length}/{users.length})
            </span>
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Cari nama atau NIM..."
                className="pl-9 pr-3 py-2 rounded-xl border border-slate-200 bg-white text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500/50"
              />
            </div>

            <button
              onClick={() => setSortBy((p) => (p === 'points' ? 'name' : 'points'))}
              className="px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-sm font-bold flex items-center gap-2 transition-all"
              type="button"
            >
              <ArrowUpDown size={16} className="text-indigo-600" />
              Sort: {sortBy === 'points' ? 'Point Teratas' : 'Nama A-Z'}
            </button>
          </div>
        </div>
      </div>

      {/* Table / Cards */}
      {loadingUsers ? (
        <div className="text-center py-16 text-slate-500">
          <Loader2 className="animate-spin inline mr-2" size={18} />
          Memuat user...
        </div>
      ) : filteredAndSortedUsers.length === 0 ? (
        <div className="soft-card border border-slate-200 rounded-2xl p-10 text-center">
          <div className="text-4xl mb-3">🔎</div>
          <div className="font-bold text-slate-800">Tidak ada user ditemukan</div>
          <div className="text-sm text-slate-500 mt-1">Coba ubah kata kunci pencarian.</div>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Desktop table */}
          <div className="hidden lg:block overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="grid grid-cols-12 gap-0 bg-slate-50 border-b border-slate-200 px-4 py-3 text-xs font-bold text-slate-600">
              <div className="col-span-4">User</div>
              <div className="col-span-2">Total Poin</div>
              <div className="col-span-2">Quiz Selesai</div>
              <div className="col-span-2">Status Score</div>
              <div className="col-span-2 text-right">Aksi</div>
            </div>

            <div>
              {filteredAndSortedUsers.map((u) => {
                const hasScore = (u.totalPoints || 0) > 0 || (u.quizzesCompleted || 0) > 0;
                const status = hasScore ? 'Ada skor' : 'Belum ada skor';
                return (
                  <div
                    key={u.id}
                    className="grid grid-cols-12 px-4 py-3 items-center border-b border-slate-100 text-sm"
                  >
                    <div className="col-span-4 flex items-center gap-3 min-w-0">
                      <div className="w-10 h-10 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{u.name || '-'}</div>
                        <div className="text-xs text-slate-500 truncate">{u.nim || '-'}</div>
                      </div>
                    </div>

                    <div className="col-span-2 font-bold text-slate-900">{u.totalPoints || 0}</div>
                    <div className="col-span-2 font-bold text-slate-900">{u.quizzesCompleted || 0}</div>
                    <div className="col-span-2">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-bold ${
                          hasScore ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-50 text-slate-600 border border-slate-200'
                        }`}
                      >
                        {status}
                      </span>
                    </div>

                    <div className="col-span-2 text-right">
                      <button
                        onClick={() => openSingleReset(u)}
                        disabled={submitting}
                        className="px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-600 font-bold text-xs hover:bg-rose-500/15 transition-all disabled:opacity-50"
                      >
                        Reset Score
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Mobile cards */}
          <div className="lg:hidden grid grid-cols-1 gap-3">
            {filteredAndSortedUsers.map((u) => {
              const hasScore = (u.totalPoints || 0) > 0 || (u.quizzesCompleted || 0) > 0;
              const status = hasScore ? 'Ada skor' : 'Belum ada skor';
              return (
                <div key={u.id} className="soft-card border border-slate-200 rounded-2xl p-4">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-11 h-11 rounded-full bg-indigo-600 text-white font-bold flex items-center justify-center flex-shrink-0">
                        {u.name?.charAt(0)?.toUpperCase() || 'U'}
                      </div>
                      <div className="min-w-0">
                        <div className="font-bold text-slate-900 truncate">{u.name || '-'}</div>
                        <div className="text-xs text-slate-500 truncate">{u.nim || '-'}</div>
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-3 gap-2 mt-3">
                    <div className="rounded-xl border border-slate-200 p-2 text-center">
                      <div className="text-[10px] font-bold text-slate-500">Poin</div>
                      <div className="font-extrabold text-slate-900">{u.totalPoints || 0}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-2 text-center">
                      <div className="text-[10px] font-bold text-slate-500">Quiz</div>
                      <div className="font-extrabold text-slate-900">{u.quizzesCompleted || 0}</div>
                    </div>
                    <div className="rounded-xl border border-slate-200 p-2 text-center">
                      <div className="text-[10px] font-bold text-slate-500">Status</div>
                      <div className="text-[11px] font-bold text-slate-900 mt-1">{status}</div>
                    </div>
                  </div>

                  <div className="mt-3">
                    <button
                      onClick={() => openSingleReset(u)}
                      disabled={submitting}
                      className="w-full px-3 py-2 rounded-xl bg-rose-500/10 border border-rose-400/30 text-rose-600 font-bold text-xs hover:bg-rose-500/15 transition-all disabled:opacity-50"
                    >
                      Reset Score
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Confirmation Modal */}
      {confirmOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="soft-card rounded-2xl border border-rose-400/30 max-w-md w-full p-6">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-rose-500" size={22} />
              <h3 className="text-lg font-extrabold text-slate-900">
                {confirmMode === 'single' ? 'Konfirmasi Reset Score' : 'Konfirmasi Reset Semua Score'}
              </h3>
            </div>

            <p className="text-sm text-slate-600 mb-3">
              {confirmMode === 'single' ? (
                <>
                  Apakah Anda yakin ingin mereset score user <span className="font-extrabold">{selectedUser?.name}</span>?
                  {' '}
                  Semua riwayat quiz user tersebut akan dihapus dan kembali ke kondisi awal.
                </>
              ) : (
                <>
                  Semua score, riwayat quiz, dan progress quiz akan dihapus.
                  Tindakan ini tidak dapat dibatalkan.
                </>
              )}
            </p>

            <div className="bg-rose-50 border border-rose-200 rounded-xl p-3 mb-5">
              <div className="flex items-center gap-2 text-rose-700 text-xs font-bold">
                <Check size={14} />
                Warning: perubahan tersimpan langsung ke database.
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={closeModal}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 font-bold text-sm disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={handleConfirmReset}
                disabled={submitting}
                className="flex-1 px-4 py-2.5 rounded-xl bg-rose-600 text-white hover:bg-rose-700 font-extrabold text-sm disabled:opacity-50"
              >
                {submitting ? 'Sedang Reset...' : confirmMode === 'single' ? 'Confirm Reset' : 'Confirm Reset All'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
