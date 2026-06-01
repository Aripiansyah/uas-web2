import React, { useState, useEffect } from 'react';
import { 
  RotateCcw, Search, Filter, Loader2, AlertTriangle, Check, 
  Trash2, Users, Award, Clock, Zap
} from 'lucide-react';
import { taskService, userService, quizService } from '../../services/firebase';

export default function ResetQuizScores() {
  const [users, setUsers] = useState([]);
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  
  // Filter & Search States
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [selectedQuizzes, setSelectedQuizzes] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  // Modal state
  const [showConfirm, setShowConfirm] = useState(false);

  // Load users and quizzes
  useEffect(() => {
    setLoading(true);
    const unsubscribeUsers = userService.subscribeUsers((fetchedUsers) => {
      const nonAdminUsers = fetchedUsers.filter(u => u.role !== 'Admin');
      setUsers(nonAdminUsers);
    });

    const unsubscribeQuizzes = quizService.subscribeQuizzes?.((fetchedQuizzes) => {
      setQuizzes(fetchedQuizzes || []);
      setLoading(false);
    }) || (() => {
      setLoading(false);
      return () => {};
    });

    return () => {
      unsubscribeUsers?.();
      unsubscribeQuizzes?.();
    };
  }, []);

  // Show toast notification
  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Toggle select all users
  const handleSelectAllUsers = () => {
    if (selectAll) {
      setSelectedUsers([]);
    } else {
      setSelectedUsers(users.map(u => u.id));
    }
    setSelectAll(!selectAll);
  };

  // Toggle individual user selection
  const toggleUserSelection = (userId) => {
    setSelectedUsers(prev => {
      const newSelection = prev.includes(userId)
        ? prev.filter(id => id !== userId)
        : [...prev, userId];
      
      setSelectAll(newSelection.length === users.length);
      return newSelection;
    });
  };

  // Toggle individual quiz selection
  const toggleQuizSelection = (quizId) => {
    setSelectedQuizzes(prev =>
      prev.includes(quizId)
        ? prev.filter(id => id !== quizId)
        : [...prev, quizId]
    );
  };

  // Reset scores
  const handleResetScores = async () => {
    if (selectedUsers.length === 0 || selectedQuizzes.length === 0) {
      showToast('Pilih minimal 1 user dan 1 quiz!', 'error');
      return;
    }

    setShowConfirm(false);
    setSubmitting(true);

    try {
      // For each selected user and quiz combination
      for (const userId of selectedUsers) {
        for (const quizId of selectedQuizzes) {
          // Delete the quiz completion record
          await quizService.deleteQuizCompletion(userId, quizId);
        }
      }

      showToast(`✅ Berhasil reset ${selectedUsers.length} user × ${selectedQuizzes.length} quiz!`, 'success');
      setSelectedUsers([]);
      setSelectedQuizzes([]);
      setSelectAll(false);
    } catch (error) {
      console.error(error);
      showToast('Gagal reset skor quiz.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  // Filter users based on search
  const filteredUsers = users.filter(user =>
    user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.nim?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="w-full h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-glow-pulse text-cyan-400 mx-auto mb-3" size={40} />
          <p className="text-slate-300 font-semibold">Loading quiz data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-8 pb-16 min-h-screen bg-gradient-to-br from-slate-950 via-purple-900/20 to-slate-950">
      {/* Toast Notification */}
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl transition-all duration-300 animate-slideInRight backdrop-blur-md border ${
          toast.type === 'success' ? 'bg-emerald-500/90 border-emerald-400 text-white' : 'bg-rose-500/90 border-rose-400 text-white'
        }`}>
          <Check size={18} />
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="px-6 pt-6 pb-4 border-b border-purple-500/20">
        <div className="flex items-center gap-3 mb-2">
          <RotateCcw className="text-cyan-400" size={28} />
          <h1 className="text-3xl font-black text-gradient">Reset Skor Quiz</h1>
        </div>
        <p className="text-slate-300 text-sm">Atur ulang skor quiz siswa yang dipilih. Data lama akan dihapus permanent.</p>
      </div>

      {/* Main Content */}
      <div className="px-6 space-y-6">
        {/* Alert Warning */}
        <div className="glass-effect border-red-500/30 p-4 rounded-xl flex gap-3 items-start">
          <AlertTriangle className="text-red-400 flex-shrink-0 mt-0.5" size={20} />
          <div>
            <p className="text-red-300 font-semibold text-sm">⚠️ Tindakan Tidak Dapat Dibatalkan</p>
            <p className="text-slate-300 text-xs mt-1">Reset skor akan menghapus semua data completion quiz yang dipilih. Pastikan Anda yakin sebelum melanjutkan.</p>
          </div>
        </div>

        {/* Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* Left: User Selection */}
          <div className="glass-effect border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                <Users size={20} />
                Pilih Siswa
              </h2>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
                {selectedUsers.length}/{users.length}
              </span>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-2.5 text-cyan-400/50" size={16} />
              <input
                type="text"
                placeholder="Cari nama atau NIM..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="input-modern pl-10 w-full"
              />
            </div>

            {/* Select All Button */}
            <button
              onClick={handleSelectAllUsers}
              className={`w-full py-2.5 px-3 rounded-lg text-xs font-bold mb-3 transition-all border ${
                selectAll
                  ? 'bg-cyan-500/30 border-cyan-400 text-cyan-300'
                  : 'bg-slate-800/30 border-slate-700 text-slate-400 hover:border-slate-600'
              }`}
            >
              {selectAll ? '✓ Pilih Semua' : 'Pilih Semua'}
            </button>

            {/* User List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {filteredUsers.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">Tidak ada siswa ditemukan</p>
              ) : (
                filteredUsers.map(user => (
                  <button
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={`w-full p-3 rounded-lg text-left text-xs font-semibold transition-all border flex items-center gap-3 ${
                      selectedUsers.includes(user.id)
                        ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                        : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      selectedUsers.includes(user.id)
                        ? 'bg-purple-500 border-purple-300'
                        : 'border-slate-600'
                    }`}>
                      {selectedUsers.includes(user.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div>
                      <div className="font-bold">{user.name}</div>
                      <div className="text-[10px] text-slate-400">{user.nim}</div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

          {/* Right: Quiz Selection */}
          <div className="glass-effect border-purple-500/20 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-cyan-300 flex items-center gap-2">
                <Award size={20} />
                Pilih Quiz
              </h2>
              <span className="text-xs font-bold text-cyan-400 bg-cyan-500/20 px-2 py-1 rounded-full">
                {selectedQuizzes.length}/{quizzes.length}
              </span>
            </div>

            {/* Quiz List */}
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quizzes.length === 0 ? (
                <p className="text-slate-400 text-xs text-center py-6">Tidak ada quiz ditemukan</p>
              ) : (
                quizzes.map(quiz => (
                  <button
                    key={quiz.id}
                    onClick={() => toggleQuizSelection(quiz.id)}
                    className={`w-full p-3 rounded-lg text-left text-xs font-semibold transition-all border flex items-center gap-3 ${
                      selectedQuizzes.includes(quiz.id)
                        ? 'bg-purple-500/30 border-purple-400 text-purple-300'
                        : 'bg-slate-800/30 border-slate-700 text-slate-300 hover:border-slate-600'
                    }`}
                  >
                    <div className={`w-4 h-4 rounded border-2 flex items-center justify-center transition-all ${
                      selectedQuizzes.includes(quiz.id)
                        ? 'bg-purple-500 border-purple-300'
                        : 'border-slate-600'
                    }`}>
                      {selectedQuizzes.includes(quiz.id) && <Check size={12} className="text-white" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-bold">{quiz.title || 'Untitled Quiz'}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1 mt-0.5">
                        <Clock size={10} />
                        {quiz.duration || '-'} menit
                      </div>
                    </div>
                  </button>
                ))
              )}
            </div>
          </div>

        </div>

        {/* Summary & Action */}
        <div className="glass-effect border-cyan-500/20 rounded-2xl p-6">
          <div className="grid grid-cols-3 gap-4 mb-6">
            <div className="bg-purple-500/10 rounded-lg p-4 text-center border border-purple-500/30">
              <Zap className="text-purple-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-black text-purple-300">{selectedUsers.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Siswa Terpilih</div>
            </div>
            <div className="bg-cyan-500/10 rounded-lg p-4 text-center border border-cyan-500/30">
              <Award className="text-cyan-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-black text-cyan-300">{selectedQuizzes.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Quiz Terpilih</div>
            </div>
            <div className="bg-orange-500/10 rounded-lg p-4 text-center border border-orange-500/30">
              <RotateCcw className="text-orange-400 mx-auto mb-2" size={24} />
              <div className="text-2xl font-black text-orange-300">{selectedUsers.length * selectedQuizzes.length}</div>
              <div className="text-[11px] text-slate-400 mt-1">Reset Total</div>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={() => setShowConfirm(true)}
            disabled={selectedUsers.length === 0 || selectedQuizzes.length === 0 || submitting}
            className="w-full btn-danger py-3 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <RotateCcw size={16} />}
            {submitting ? 'Sedang Reset...' : 'Reset Skor Quiz'}
          </button>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="card-modern rounded-2xl border-red-500/30 max-w-md w-full p-6 animate-slideUp">
            <div className="flex items-center gap-3 mb-4">
              <AlertTriangle className="text-red-400" size={24} />
              <h3 className="text-lg font-bold text-red-300">Konfirmasi Reset Skor</h3>
            </div>
            
            <p className="text-slate-300 text-sm mb-6">
              Anda akan mereset skor {selectedUsers.length} siswa × {selectedQuizzes.length} quiz = <span className="font-bold text-orange-300">{selectedUsers.length * selectedQuizzes.length} data</span>.
            </p>

            <p className="text-red-300 text-xs mb-6 bg-red-500/10 border border-red-500/30 p-3 rounded-lg">
              ⚠️ Tindakan ini tidak dapat dibatalkan. Data akan dihapus permanen dari database.
            </p>

            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirm(false)}
                className="flex-1 px-4 py-2.5 rounded-lg border border-purple-500/30 text-cyan-300 font-semibold text-sm hover:bg-purple-500/10 transition-all"
              >
                Batal
              </button>
              <button
                onClick={handleResetScores}
                disabled={submitting}
                className="flex-1 btn-danger py-2.5 text-sm font-semibold disabled:opacity-50"
              >
                {submitting ? 'Sedang Reset...' : 'Konfirmasi Reset'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
