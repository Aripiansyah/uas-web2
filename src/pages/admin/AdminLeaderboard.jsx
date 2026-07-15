import React, { useState, useEffect } from 'react';
import { Trophy, Medal, RotateCcw, AlertCircle, Loader2 } from 'lucide-react';
import { userService, quizService } from '../../services/api';
import Toast from '../../components/Toast';

export default function AdminLeaderboard() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);
  const [resettingUser, setResettingUser] = useState(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [selectedUserForReset, setSelectedUserForReset] = useState(null);

  useEffect(() => {
    const unsubscribe = userService.subscribeUsers(async (fetchedUsers) => {
      // Filter only non-admin users
      const nonAdminUsers = fetchedUsers.filter(u => u.role !== 'Admin');
      
      // Get quiz stats for each user
      const usersWithStats = await Promise.all(
        nonAdminUsers.map(async (user) => {
          const stats = await quizService.getUserQuizStats(user.id);
          return {
            ...user,
            ...stats
          };
        })
      );

      // Sort by total points (descending) — support both camelCase and snake_case
      const sortedUsers = usersWithStats.sort((a, b) =>
        (b.total_points || b.totalPoints || 0) - (a.total_points || a.totalPoints || 0)
      );
      
      setUsers(sortedUsers);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const getRankingIcon = (index) => {
    if (index === 0) return <Trophy size={20} className="text-yellow-500" />;
    if (index === 1) return <Medal size={20} className="text-slate-400" />;
    if (index === 2) return <Medal size={20} className="text-orange-600" />;
    return <span className="text-lg font-bold text-slate-400">#{index + 1}</span>;
  };

  const getRankingBadge = (index) => {
    if (index === 0) return 'bg-yellow-50 text-yellow-700';
    if (index === 1) return 'bg-slate-100 text-slate-700';
    if (index === 2) return 'bg-orange-50 text-orange-700';
    return 'bg-slate-50 text-slate-600';
  };

  const handleResetPoints = async () => {
    if (!selectedUserForReset) return;

    setResettingUser(selectedUserForReset.id);
    try {
      await quizService.resetUserQuizData(selectedUserForReset.id);
      setToast({ message: `Point ${selectedUserForReset.name} berhasil direset`, type: 'success' });
      setShowConfirmModal(false);
      setSelectedUserForReset(null);
    } catch (error) {
      console.error('Error resetting points:', error);
      setToast({ message: 'Gagal mereset point user', type: 'error' });
    } finally {
      setResettingUser(null);
    }
  };

  return (
    <div className="space-y-8 pb-16 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}

      {/* HEADER */}
      <div className="bg-gradient-to-r from-indigo-600 to-indigo-800 p-8 rounded-3xl text-white shadow-lg">
        <div className="flex items-center gap-3 mb-2">
          <Trophy size={32} />
          <h1 className="text-3xl font-extrabold tracking-tight">
            Leaderboard User
          </h1>
        </div>
        <p className="text-indigo-100 font-medium">
          Kelola point dan statistik quiz semua user
        </p>
      </div>

      {/* STATS OVERVIEW */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold mb-2">Total User</p>
          <p className="text-3xl font-black text-slate-900">{users.length}</p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold mb-2">Total Point Terkumpul</p>
          <p className="text-3xl font-black text-indigo-600">
            {users.reduce((sum, u) => sum + (u.totalPoints || 0), 0)}
          </p>
        </div>
        <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm">
          <p className="text-sm text-slate-500 font-semibold mb-2">Rata-rata Quiz Diselesaikan</p>
          <p className="text-3xl font-black text-emerald-600">
            {(users.reduce((sum, u) => sum + (u.totalQuizzesCompleted || 0), 0) / Math.max(users.length, 1)).toFixed(1)}
          </p>
        </div>
      </div>

      {/* LEADERBOARD TABLE */}
      {loading ? (
        <div className="text-center py-20 text-slate-500">
          <Loader2 className="animate-spin inline mr-2" />
          Memuat data user...
        </div>
      ) : users.length === 0 ? (
        <div className="text-center py-20 text-slate-500">
          <AlertCircle className="inline mr-2 mb-2" size={32} />
          <p className="font-medium">Belum ada user terdaftar</p>
        </div>
      ) : (
        <div className="space-y-3">
          {users.map((user, index) => (
            <div
              key={user.id}
              className={`bg-white border rounded-2xl p-4 shadow-sm hover:shadow-md transition-shadow flex items-center justify-between ${
                getRankingBadge(index)
              }`}
            >
              <div className="flex items-center gap-4 flex-1">
                {/* Ranking Icon */}
                <div className="flex-shrink-0 w-10 h-10 flex items-center justify-center">
                  {getRankingIcon(index)}
                </div>

                {/* User Avatar & Info */}
                <div className="flex items-center gap-3 flex-1 min-w-0">
                  <div className={`w-12 h-12 rounded-full flex items-center justify-center text-white font-bold text-lg flex-shrink-0 ${
                    index === 0 ? 'bg-yellow-500' : index === 1 ? 'bg-slate-400' : index === 2 ? 'bg-orange-600' : 'bg-indigo-600'
                  }`}>
                    {user.name?.charAt(0).toUpperCase() || 'U'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <p className="font-bold text-slate-900 truncate">{user.name || 'User'}</p>
                    <p className="text-xs text-slate-500">{user.nim || '-'}</p>
                  </div>
                </div>
              </div>

              {/* Stats */}
              <div className="hidden md:grid grid-cols-3 gap-6 flex-shrink-0 mx-6">
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Total Point</p>
                  <p className="font-black text-lg text-slate-900">{user.totalPoints || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Quiz Selesai</p>
                  <p className="font-bold text-slate-900">{user.totalQuizzesCompleted || 0}</p>
                </div>
                <div className="text-center">
                  <p className="text-xs text-slate-500 mb-1">Rata-rata</p>
                  <p className="font-bold text-slate-900">{user.averageScore || 0}%</p>
                </div>
              </div>

              {/* Reset Button */}
              <button
                onClick={() => {
                  setSelectedUserForReset(user);
                  setShowConfirmModal(true);
                }}
                disabled={resettingUser === user.id}
                className="flex-shrink-0 p-2.5 hover:bg-red-100 text-red-600 rounded-lg transition-colors disabled:opacity-50"
              >
                {resettingUser === user.id ? (
                  <Loader2 size={18} className="animate-spin" />
                ) : (
                  <RotateCcw size={18} />
                )}
              </button>
            </div>
          ))}
        </div>
      )}

      {/* RESET CONFIRMATION MODAL */}
      {showConfirmModal && selectedUserForReset && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
              <AlertCircle className="text-red-600" size={24} />
            </div>

            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Reset Point User?
            </h3>
            <p className="text-slate-600 text-sm mb-6">
              Anda akan mereset semua point dan riwayat quiz dari <strong>{selectedUserForReset.name}</strong>. Aksi ini tidak dapat diulang!
            </p>

            <div className="space-y-3">
              <button
                onClick={handleResetPoints}
                disabled={resettingUser === selectedUserForReset.id}
                className="w-full py-2.5 bg-red-600 text-white font-bold rounded-xl hover:bg-red-700 transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {resettingUser === selectedUserForReset.id ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    Mereset...
                  </>
                ) : (
                  <>
                    <RotateCcw size={16} />
                    Reset Point
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setShowConfirmModal(false);
                  setSelectedUserForReset(null);
                }}
                disabled={resettingUser === selectedUserForReset.id}
                className="w-full py-2.5 bg-slate-100 text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors disabled:opacity-50"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
