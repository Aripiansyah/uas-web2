// server/routes/quizzes.js

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Mengambil semua paket kuis 
router.get('/', async (req, res) => {
  try {
    // Ambil semua kuis
    const { data: quizzes, error: quizError } = await supabase
      .from('quizzes')
      .select('*')
      .order('created_at', { ascending: false });

    if (quizError) {
      console.error('[QUIZZES GET ALL] Supabase error:', quizError);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar kuis.',
        error: quizError.message,
      });
    }

    if (!quizzes || quizzes.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Ambil semua soal 
    const quizIds = quizzes.map((q) => q.id);
    const { data: allQuestions, error: qError } = await supabase
      .from('quiz_questions')
      .select('*')
      .in('quiz_id', quizIds)
      .order('id', { ascending: true });

    if (qError) {
      console.error('[QUIZZES GET ALL] Questions fetch error:', qError);
    }

    // Gabungkan soal ke dalam masing-masing kuis
    const data = quizzes.map((quiz) => ({
      ...quiz,
      questions: (allQuestions || [])
        .filter((q) => q.quiz_id === quiz.id)
        .map((q) => ({
          id: q.id,
          question: q.question,
          options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
          correctAnswer: q.correct_answer,
          correct_answer: q.correct_answer,
        })),
    }));

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[QUIZZES GET ALL] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Riwayat penyelesaian kuis milik user
router.get('/completions/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    const { data, error } = await supabase
      .from('quiz_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[QUIZ COMPLETIONS GET] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat kuis.',
        error: error.message,
      });
    }

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[QUIZ COMPLETIONS GET] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Menyimpan hasil kuis + update poin user
router.post('/complete', async (req, res) => {
  try {
    const { user_id, quiz_id, score, correct_answers, total_questions } = req.body;

    if (!user_id || !quiz_id || score === undefined) {
      return res.status(400).json({
        success: false,
        message: 'user_id, quiz_id, dan score wajib diisi.',
      });
    }

    // 1. Insert data penyelesaian kuis
    const { data: completion, error: insertError } = await supabase
      .from('quiz_completions')
      .insert([
        {
          user_id,
          quiz_id,
          score: Number(score),
          correct_answers: Number(correct_answers) || 0,
          total_questions: Number(total_questions) || 0,
          completed_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (insertError) {
      console.error('[QUIZ COMPLETE] Insert error:', insertError);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan hasil kuis.',
        error: insertError.message,
      });
    }

    // 2. Ambil data user saat ini
    const { data: currentUser, error: getUserError } = await supabase
      .from('users')
      .select('total_points, quizzes_completed')
      .eq('id', user_id)
      .single();

    if (getUserError) {
      console.error('[QUIZ COMPLETE] Get user error:', getUserError);
      return res.status(207).json({
        success: true,
        message: 'Hasil kuis tersimpan, namun gagal memperbarui poin user.',
        warning: getUserError.message,
        data: completion,
      });
    }

    const newTotalPoints = (currentUser.total_points || 0) + Number(score);
    const newQuizzesCompleted = (currentUser.quizzes_completed || 0) + 1;

    // 3. Update poin user
    const { error: updateError } = await supabase
      .from('users')
      .update({ total_points: newTotalPoints, quizzes_completed: newQuizzesCompleted })
      .eq('id', user_id);

    if (updateError) {
      console.error('[QUIZ COMPLETE] Update user error:', updateError);
      return res.status(207).json({
        success: true,
        message: 'Hasil kuis tersimpan, namun gagal memperbarui poin user.',
        warning: updateError.message,
        data: completion,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Hasil kuis berhasil disimpan dan poin user diperbarui.',
      data: {
        completion,
        updated_user_stats: { total_points: newTotalPoints, quizzes_completed: newQuizzesCompleted },
      },
    });
  } catch (err) {
    console.error('[QUIZ COMPLETE] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Soal-soal dari kuis tertentu
router.get('/:id/questions', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('quiz_questions')
      .select('*')
      .eq('quiz_id', id)
      .order('id', { ascending: true });

    if (error) {
      console.error('[QUIZ QUESTIONS GET] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil soal kuis.',
        error: error.message,
      });
    }

    const normalized = data.map((q) => ({
      id: q.id,
      quiz_id: q.quiz_id,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : JSON.parse(q.options || '[]'),
      correctAnswer: q.correct_answer,
      correct_answer: q.correct_answer,
    }));

    return res.status(200).json({
      success: true,
      quiz_id: id,
      count: normalized.length,
      data: normalized,
    });
  } catch (err) {
    console.error('[QUIZ QUESTIONS GET] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Buat kuis baru beserta soal-soalnya
router.post('/', async (req, res) => {
  try {
    const { title, category, questions } = req.body;

    console.log('[QUIZZES CREATE] Payload diterima:', { title, category, questionsCount: questions?.length });

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul kuis wajib diisi.' });
    }

    if (!Array.isArray(questions) || questions.length === 0) {
      return res.status(400).json({ success: false, message: 'Minimal harus ada 1 pertanyaan.' });
    }

    // 1. Insert kuis ke tabel 'quizzes'
    const { data: newQuiz, error: quizError } = await supabase
      .from('quizzes')
      .insert([{ title, category: category || null }])
      .select()
      .single();

    if (quizError) {
      console.error('[QUIZZES CREATE] Quiz insert error:', quizError);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat kuis baru.',
        error: quizError.message,
      });
    }

    console.log('[QUIZZES CREATE] Kuis dibuat:', newQuiz.id, '— inserting', questions.length, 'soal...');

    // 2. Insert soal-soal ke tabel 'quiz_questions'
    const questionRows = questions.map((q) => ({
      quiz_id: newQuiz.id,
      question: q.question,
      options: Array.isArray(q.options) ? q.options : [q.options],
      correct_answer: q.correct_answer || q.correctAnswer || 'A',
    }));

    console.log('[QUIZZES CREATE] Question rows sample:', JSON.stringify(questionRows[0]));

    const { error: questionError } = await supabase.from('quiz_questions').insert(questionRows);

    if (questionError) {
      console.error('[QUIZZES CREATE] Question insert error:', questionError);
      // Hapus kuis 
      await supabase.from('quizzes').delete().eq('id', newQuiz.id);
      return res.status(500).json({
        success: false,
        message: 'Gagal menyimpan soal-soal kuis. Kuis dibatalkan.',
        error: questionError.message,
        hint: questionError.hint,
        code: questionError.code,
      });
    }

    console.log('[QUIZZES CREATE] Semua soal berhasil disimpan.');

    return res.status(201).json({
      success: true,
      message: 'Kuis baru berhasil dibuat.',
      data: { ...newQuiz, questions_count: questions.length },
    });
  } catch (err) {
    console.error('[QUIZZES CREATE] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Hapus penyelesaian kuis
router.delete('/completion', async (req, res) => {
  try {
    const { user_id, quiz_id } = req.body || {};

    if (!user_id || !quiz_id) {
      return res.status(400).json({ success: false, message: 'user_id dan quiz_id wajib diisi.' });
    }

    const { error } = await supabase
      .from('quiz_completions')
      .delete()
      .eq('user_id', user_id)
      .eq('quiz_id', quiz_id);

    if (error) {
      return res.status(500).json({ success: false, message: 'Gagal menghapus data penyelesaian.', error: error.message });
    }

    return res.status(200).json({ success: true, message: 'Data penyelesaian berhasil dihapus.' });
  } catch (err) {
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Hapus kuis beserta soal-soalnya
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Hapus semua soal terkait
    const { error: questionError } = await supabase
      .from('quiz_questions')
      .delete()
      .eq('quiz_id', id);

    if (questionError) {
      console.error('[QUIZZES DELETE] Question delete error:', questionError);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus soal-soal kuis.',
        error: questionError.message,
      });
    }

    // 2. Hapus data penyelesaian kuis
    await supabase.from('quiz_completions').delete().eq('quiz_id', id);

    // 3. Hapus kuis itu sendiri
    const { error: quizError } = await supabase.from('quizzes').delete().eq('id', id);

    if (quizError) {
      console.error('[QUIZZES DELETE] Quiz delete error:', quizError);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus kuis.',
        error: quizError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Kuis beserta soal-soalnya berhasil dihapus.`,
    });
  } catch (err) {
    console.error('[QUIZZES DELETE] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

module.exports = router;
