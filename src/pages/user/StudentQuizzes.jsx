import React, { useState, useEffect } from 'react';
import { Loader2, ArrowRight, CheckCircle, Award, HelpCircle, Lock } from 'lucide-react';
import { quizService, userService } from '../../services/api';
import Toast from '../../components/Toast';

export default function StudentQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [completedQuizzes, setCompletedQuizzes] = useState([]);
  const [toast, setToast] = useState(null);

  // Engine State untuk Bundel Kuis
  const [activeBundle, setActiveBundle] = useState(null);
  const [currentQuestionIdx, setCurrentQuestionIdx] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState(null);
  const [answersLog, setAnswersLog] = useState([]);
  const [quizFinished, setQuizFinished] = useState(false);
  const [isSavingScore, setIsSavingScore] = useState(false);

  const currentUser = JSON.parse(localStorage.getItem('currentUser')) || {};

  useEffect(() => {
    const unsubscribe = quizService.subscribeQuizzes((items) => {
      setQuizzes(items);
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  // Subscribe to user's quiz completions
  useEffect(() => {
    if (!currentUser.uid) return;
    
    const unsubscribe = quizService.subscribeUserQuizCompletions(currentUser.uid, (completions) => {
      const completedIds = completions.map(c => c.quiz_id || c.quizId);
      setCompletedQuizzes(completedIds);
    });
    
    return () => unsubscribe();
  }, [currentUser.uid]);

  const handleStartQuiz = async (bundle) => {
    // Check if already completed
    const isCompleted = await quizService.checkQuizCompletion(currentUser.uid, bundle.id);
    if (isCompleted) {
      setToast({ message: 'Quiz sudah pernah dikerjakan', type: 'warning' });
      return;
    }

    setActiveBundle(bundle);
    setCurrentQuestionIdx(0);
    setSelectedAnswer(null);
    setAnswersLog([]);
    setQuizFinished(false);
  };

  const handleNextQuestion = async () => {
    if (!selectedAnswer) return;

    const currentQuestionObj = activeBundle.questions[currentQuestionIdx];
    const isCorrect = selectedAnswer === (currentQuestionObj.correct_answer || currentQuestionObj.correctAnswer);
    const updatedLogs = [...answersLog, isCorrect];
    setAnswersLog(updatedLogs);

    if (currentQuestionIdx + 1 < activeBundle.questions.length) {
      setCurrentQuestionIdx(currentQuestionIdx + 1);
      setSelectedAnswer(null);
    } else {
      // Save quiz completion
      const totalTrue = updatedLogs.filter(val => val === true).length;
      const finalScore = Math.round((totalTrue / activeBundle.questions.length) * 100);
      
      setIsSavingScore(true);
      try {
        await quizService.saveQuizCompletion(
          currentUser.uid,
          activeBundle.id,
          finalScore,
          totalTrue,
          activeBundle.questions.length
        );
        setToast({ message: `Quiz selesai! Poin +${finalScore} berhasil disimpan`, type: 'success' });
        setQuizFinished(true);
      } catch (error) {
        console.error("Error saving quiz:", error);
        setToast({ message: 'Gagal menyimpan skor quiz', type: 'error' });
      } finally {
        setIsSavingScore(false);
      }
    }
  };

  const calculateFinalScore = () => {
    const totalTrue = answersLog.filter(val => val === true).length;
    return Math.round((totalTrue / activeBundle.questions.length) * 100);
  };

  const handleCloseArena = () => {
    setActiveBundle(null);
    setQuizFinished(false);
    setAnswersLog([]);
  };

  return (
    <div className="w-full space-y-8 pb-16 animate-fade-in">
      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight">SyncTask Trivia Bundel</h1>
        <p className="text-xs text-slate-400 mt-1">Selesaikan seluruh rangkaian pertanyaan paket topik kuliah untuk menguji batas kompetensimu.</p>
      </div>

      {loading ? (
        <div className="text-center py-20 text-slate-400"><Loader2 className="animate-spin inline mr-2" />Syncing Arena...</div>
      ) : !activeBundle ? (
        /* --- TAMPILAN PEMILIHAN BUNDEL TOPIK KUIS --- */
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {quizzes.map((quiz) => {
            const isCompleted = completedQuizzes.includes(quiz.id);
            return (
              <div key={quiz.id} className="bg-white border-1 border-cyan-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between hover:shadow-md transition-shadow  --tw-shadow: 0 4px 6px -1px var(--tw-shadow-color, rgb(0 0 0 / 0.1)), 0 2px 4px -2px var(--tw-shadow-color, rgb(0 0 0 / 0.1));
            box-shadow: var(--tw-inset-shadow), var(--tw-inset-ring-shadow), var(--tw-ring-offset-shadow), var(--tw-ring-shadow), var(--tw-shadow)">
                <div>
                  <span className="text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded bg-indigo-50 text-indigo-600">
                    {quiz.category}
                  </span>
                  <h3 className="text-sm font-black text-slate-800 mt-3">{quiz.title}</h3>
                  <p className="text-xs text-slate-400 font-semibold mt-1">Total: {quiz.questions?.length || 0} Masalah Soal</p>
                  {isCompleted && (
                    <div className="flex items-center gap-1.5 mt-3 p-2 bg-emerald-50 rounded-lg">
                      <CheckCircle size={14} className="text-emerald-600" />
                      <span className="text-[10px] font-bold text-emerald-700">Selesai</span>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => handleStartQuiz(quiz)}
                  disabled={!quiz.questions || quiz.questions.length === 0 || isCompleted}
                  className={`w-full mt-5 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                    isCompleted
                      ? 'bg-slate-100 text-slate-400 cursor-not-allowed'
                      : 'bg-slate-900 text-white hover:bg-slate-800 active:scale-95'
                  }`}
                >
                  {isCompleted ? (
                    <>
                      <Lock size={14} />
                      Quiz Selesai
                    </>
                  ) : (
                    <>
                      Mulai Ujian Paket <ArrowRight size={14} />
                    </>
                  )}
                </button>
              </div>
            );
          })}
        </div>
      ) : (
        /* --- ARENA BERJALAN: MULTIPLE QUESTIONS BUNDLE ENGINE --- */
        <div className="max-w-xl mx-auto bg-white border border-green-700 rounded-3xl shadow-3xl overflow-hidden">
          <div className="bg-cyan-300 p-5 text-amber-300 flex justify-between items-center">
            <div>
              <span className="text-[9px] font-black text-indigo-400 uppercase tracking-wider">{activeBundle.category}</span>
              <h3 className="text-xs font-bold text-slate-300">{activeBundle.title}</h3>
            </div>
            <button onClick={handleCloseArena} className="text-xs font-bold px-3 py-1 bg-green-600 text-slate-300 rounded-lg">Keluar</button>
          </div>

          {!quizFinished ? (
            /* Tampilan Soal Berjalan Per Nomor */
            <div className="p-6 space-y-5">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-600">Pertanyaan No. {currentQuestionIdx + 1} dari {activeBundle.questions.length}</span>
                <span className="text-[10px] font-bold text-slate-700 font-mono">Progress: {Math.round(((currentQuestionIdx)/activeBundle.questions.length)*100)}%</span>
              </div>

              <p className="text-sm font-bold text-slate-800 leading-relaxed bg-purple-400 p-4 rounded-2xl border border-amber-100">
                {activeBundle.questions[currentQuestionIdx].question}
              </p>

              <div className="space-y-2 border-purple-400 border rounded-2xl p-8 bg-purple-50">
                {['A', 'B', 'C', 'D'].map((letter, index) => {
                  const optText = activeBundle.questions[currentQuestionIdx].options[index];
                  const isSelected = selectedAnswer === letter;

                  return (
                    <button
                      key={letter}
                      type="button"
                      onClick={() => setSelectedAnswer(letter)}
                      className={`w-full text-left p-3.5 rounded-xl border text-xs font-bold flex items-center gap-3 transition-all ${
                        isSelected ? 'border-indigo-600 bg-indigo-50/50 text-indigo-900 ring-2 ring-indigo-600/10' : 'border-slate-200 bg-white text-slate-700'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded flex items-center justify-center text-[10px] font-black ${isSelected ? 'bg-indigo-600 text-white' : 'bg-slate-100 text-slate-500'}`}>{letter}</span>
                      <span>{optText}</span>
                    </button>
                  );
                })}
              </div>

              <button
                onClick={handleNextQuestion}
                disabled={!selectedAnswer || isSavingScore}
                className="w-full py-3 bg-purple-400 disabled:opacity-200 text-blue-700 text-sm font-bold rounded-xl flex items-center justify-center gap-1.5 transition-all"
              >
                {isSavingScore ? (
                  <>
                    <Loader2 size={14} className="animate-spin" />
                    Menyimpan...
                  </>
                ) : (
                  <>
                    {currentQuestionIdx + 1 === activeBundle.questions.length ? 'Selesaikan Kuis' : 'Pertanyaan Selanjutnya'} 
                    <ArrowRight size={14} />
                  </>
                )}
              </button>
            </div>
          ) : (
            /* --- RINGKASAN SCORE AKHIR BUNDEL --- */
            <div className="p-8 text-center space-y-4">
              <div className="w-16 h-16 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-3xl flex items-center justify-center mx-auto shadow-md">
                <Award size={32} />
              </div>
              <div>
                <h3 className="text-base font-black text-slate-800">Paket Kuis Selesai!</h3>
                <p className="text-xs text-slate-400 mt-0.5">Berikut hasil evaluasi perolehan performa pengerjaan kuis kamu:</p>
              </div>

              <div className="bg-slate-50 p-5 rounded-2xl border border-slate-100 grid grid-cols-2 gap-4">
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Skor Akumulasi</span>
                  <span className="text-2xl font-black text-amber-500 mt-0.5">{calculateFinalScore()} / 100</span>
                </div>
                <div>
                  <span className="text-[10px] font-black uppercase text-slate-400 block">Jawaban Benar</span>
                  <span className="text-2xl font-black text-emerald-600 mt-0.5">
                    {answersLog.filter(v => v === true).length} <span className="text-xs font-bold text-emerald-600">dari {activeBundle.questions.length}</span>
                  </span>
                </div>
              </div>

              <button
                onClick={handleCloseArena}
                className="px-6 py-2.5 bg-cyan-300 text-cyan-900 font-bold text-sm rounded-xl shadow-md transition-all active:scale-98"
              >
                Kembali Ke Arena Utama
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}