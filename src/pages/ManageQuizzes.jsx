import React, { useState, useEffect } from 'react';
import { Plus, HelpCircle, Trash2, Loader2, X, CheckCircle, Save, FileText } from 'lucide-react';
import { db } from '../services/firebase';
import { collection, query, onSnapshot, addDoc, deleteDoc, doc } from 'firebase/firestore';

export default function ManageQuizzes() {
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Form Kuis Utama
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Flutter');
  
  // State List Pertanyaan Sementara (Sebelum di-save ke Firebase)
  const [questionsList, setQuestionsList] = useState([]);

  // Form Pertanyaan Satuan (Input Terisolasi)
  const [currentQuestion, setCurrentQuestion] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('A');

  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  useEffect(() => {
    const q = query(collection(db, 'quizzes'));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setQuizzes(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });
    return () => unsubscribe();
  }, []);

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast({ show: false, message: '', type: 'success' }), 4000);
  };

  // Masukkan pertanyaan ke dalam list antrean lokal kuis
  const handleAddQuestionToQueue = () => {
    if (!currentQuestion || !optA || !optB || !optC || !optD) {
      showToast('Lengkapi teks pertanyaan dan semua opsi terlebih dahulu!', 'error');
      return;
    }

    const newQuestionObj = {
      question: currentQuestion,
      options: [optA, optB, optC, optD],
      correctAnswer
    };

    setQuestionsList([...questionsList, newQuestionObj]);
    
    // Reset form input pertanyaan saja
    setCurrentQuestion('');
    setOptA('');
    setOptB('');
    setOptC('');
    setOptD('');
    setCorrectAnswer('A');
    showToast('Pertanyaan berhasil ditambahkan ke dalam daftar bundel!');
  };

  const handleSubmitQuizBundle = async (e) => {
    e.preventDefault();
    if (!title || questionsList.length === 0) {
      showToast('Judul wajib diisi dan minimal harus ada 1 pertanyaan di dalam bundel!', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addDoc(collection(db, 'quizzes'), {
        title,
        category,
        questions: questionsList, // Menyimpan array berisi banyak pertanyaan sekaligus
        createdAt: new Date()
      });
      
      showToast('Bundel Paket Kuis Berhasil Diterbitkan!');
      setIsModalOpen(false);
      setTitle('');
      setQuestionsList([]);
    } catch (error) {
      showToast('Gagal menyimpan paket kuis.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (confirm('Hapus seluruh paket kuis ini beserta semua soal di dalamnya?')) {
      try {
        await deleteDoc(doc(db, 'quizzes', id));
        showToast('Paket kuis berhasil dihapus.', 'success');
      } catch (error) {
        showToast('Gagal menghapus data.', 'error');
      }
    }
  };

  return (
    <div className="w-full space-y-8 pb-16">
      {toast.show && (
        <div className={`fixed top-6 right-6 z-50 flex items-center gap-3 px-5 py-3.5 rounded-2xl shadow-xl backdrop-blur-md border ${
          toast.type === 'success' ? 'bg-emerald-50/95 border-emerald-200 text-emerald-800' : 'bg-rose-50/95 border-rose-200 text-rose-800'
        }`}>
          <span className="text-xs font-bold">{toast.message}</span>
        </div>
      )}

      <div className="flex justify-between items-center border-b border-slate-100 pb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Manajemen Paket Kuis</h1>
          <p className="text-xs text-slate-400 mt-1">Buat bundel topik kuis yang berisi banyak daftar pertanyaan interaktif sekaligus.</p>
        </div>
        <button
          onClick={() => { setQuestionsList([]); setIsModalOpen(true); }}
          className="px-5 py-3 bg-gradient-to-r from-violet-600 to-indigo-600 text-white rounded-xl text-xs font-bold flex items-center gap-2 shadow-md"
        >
          <Plus size={16} /> Buat Bundel Kuis Baru
        </button>
      </div>

      {loading ? (
        <div className="text-center py-20 text-xs font-bold text-slate-400">Loading kuis...</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {quizzes.map((quiz) => (
            <div key={quiz.id} className="bg-white border border-slate-100 rounded-2xl p-5 flex flex-col justify-between shadow-2xs">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 bg-indigo-50 text-indigo-600 rounded-md">
                  {quiz.category}
                </span>
                <h3 className="text-sm font-black text-slate-800 mt-3">{quiz.title}</h3>
                <p className="text-xs text-slate-400 font-semibold mt-1 flex items-center gap-1">
                  <FileText size={12} /> Berisi: {quiz.questions?.length || 0} Pertanyaan
                </p>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 flex justify-end">
                <button onClick={() => handleDelete(quiz.id)} className="p-2 text-slate-400 hover:text-rose-600 rounded-lg">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* --- MODAL BUNDELING GLASSMORPHISM --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-3xl border border-slate-100 shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">
            <div className="bg-slate-950 p-5 text-white flex justify-between items-center flex-shrink-0">
              <h3 className="text-sm font-black">Form Pembuatan Paket Bundel Kuis</h3>
              <button type="button" onClick={() => setIsModalOpen(false)} className="text-slate-300"><X size={16} /></button>
            </div>

            <div className="p-6 space-y-4 overflow-y-auto flex-1">
              {/* Meta Kuis */}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Nama Bundel Topik *</label>
                  <input type="text" placeholder="E.g., Flutter State & Riverpod" value={title} onChange={e => setTitle(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-700">Kategori</label>
                  <select value={category} onChange={e => setCategory(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none">
                    <option value="Flutter">Flutter & Dart</option>
                    <option value="Laravel">Laravel Framework</option>
                    <option value="Supabase">Supabase DB</option>
                  </select>
                </div>
              </div>

              {/* Antrean Pertanyaan Saat Ini */}
              <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/60">
                <span className="text-[10px] font-black uppercase text-slate-400 block mb-1">Daftar Soal di Bundel Ini ({questionsList.length} Soal Terdaftar)</span>
                {questionsList.length === 0 ? (
                  <p className="text-[11px] text-slate-400 font-medium">Belum ada pertanyaan yang dimasukkan ke paket ini.</p>
                ) : (
                  <div className="max-h-24 overflow-y-auto space-y-1">
                    {questionsList.map((q, idx) => (
                      <div key={idx} className="bg-white p-1.5 px-2.5 rounded-lg border border-slate-100 text-[11px] font-bold text-slate-700 flex justify-between items-center">
                        <span className="truncate">{idx + 1}. {q.question}</span>
                        <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 px-1.5 rounded">Kunci: {q.correctAnswer}</span>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="border-t border-dashed border-slate-200 pt-3 space-y-3">
                <span className="text-xs font-black text-indigo-600 block">Form Generator Pertanyaan Satuan:</span>
                
                <div className="space-y-1">
                  <label className="text-xs font-bold text-slate-600">Teks Pertanyaan</label>
                  <textarea rows="2" placeholder="Tulis pertanyaan di sini..." value={currentQuestion} onChange={e => setCurrentQuestion(e.target.value)} className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold focus:outline-none focus:border-indigo-500" />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <input type="text" placeholder="Opsi Jawaban A" value={optA} onChange={e => setOptA(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold" />
                  <input type="text" placeholder="Opsi Jawaban B" value={optB} onChange={e => setOptB(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold" />
                  <input type="text" placeholder="Opsi Jawaban C" value={optC} onChange={e => setOptC(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold" />
                  <input type="text" placeholder="Opsi Jawaban D" value={optD} onChange={e => setOptD(e.target.value)} className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-semibold" />
                </div>

                <div className="flex justify-between items-center bg-slate-50 p-2.5 rounded-xl">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-slate-700">Kunci Benar:</span>
                    {['A', 'B', 'C', 'D'].map(l => (
                      <button key={l} type="button" onClick={() => setCorrectAnswer(l)} className={`w-7 h-7 text-xs font-black rounded-lg border ${correctAnswer === l ? 'bg-slate-900 text-white' : 'bg-white text-slate-500'}`}>{l}</button>
                    ))}
                  </div>
                  <button type="button" onClick={handleAddQuestionToQueue} className="px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-600 rounded-lg text-xs font-bold">
                    + Masukkan Soal ke Paket
                  </button>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 flex-shrink-0">
              <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 rounded-xl text-xs font-bold text-slate-500">Cancel</button>
              <button type="button" onClick={handleSubmitQuizBundle} disabled={submitting} className="px-6 py-2 bg-gradient-to-r from-emerald-600 to-teal-600 text-white text-xs font-bold rounded-xl shadow-md flex items-center gap-1.5">
                {submitting ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                Terbitkan Seluruh Paket Kuis
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}