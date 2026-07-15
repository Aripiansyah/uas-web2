// server/routes/users.js
// Endpoints:
//   GET    /api/users                 - Mengambil semua user (Leaderboard & dropdown)
//   GET    /api/users/:id             - Mengambil satu user detail
//   PUT    /api/users/:id             - Mengupdate profil user (name, avatar_url)
//   DELETE /api/users/:id             - Menghapus user
//   POST   /api/users/:id/reset-quiz   - Reset data kuis & poin per user
//   POST   /api/users/reset-all-quiz  - Reset data kuis & poin semua user

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// GET /api/users
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('total_points', { ascending: false });

    if (error) {
      console.error('[USERS GET ALL] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data user.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('[USERS GET ALL] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// GET /api/users/:id
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) {
      console.error('[USERS GET ONE] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail user.',
        error: error.message,
      });
    }

    if (!data) {
      return res.status(404).json({
        success: false,
        message: 'User tidak ditemukan.',
      });
    }

    return res.status(200).json({
      success: true,
      data,
    });
  } catch (err) {
    console.error('[USERS GET ONE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// PUT /api/users/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, avatarUrl, avatar_url } = req.body;

    const payload = {};
    if (name !== undefined) payload.name = name;
    if (avatarUrl !== undefined || avatar_url !== undefined) {
      payload.avatar_url = avatarUrl || avatar_url;
    }

    const { data, error } = await supabase
      .from('users')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[USERS UPDATE] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal memperbarui profil user.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Profil user berhasil diperbarui.',
      data,
    });
  } catch (err) {
    console.error('[USERS UPDATE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// DELETE /api/users/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('users').delete().eq('id', id);

    if (error) {
      console.error('[USERS DELETE] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus user.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `User dengan ID ${id} berhasil dihapus.`,
    });
  } catch (err) {
    console.error('[USERS DELETE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// POST /api/users/reset-all-quiz
router.post('/reset-all-quiz', async (req, res) => {
  try {
    await supabase.from('quiz_completions').delete().neq('id', '00000000-0000-0000-0000-000000000000');

    const { error } = await supabase
      .from('users')
      .update({ total_points: 0, quizzes_completed: 0 })
      .neq('role', 'Admin');

    if (error) {
      console.error('[USERS RESET ALL QUIZ] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mereset data kuis semua user.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data kuis dan poin semua mahasiswa berhasil direset.',
    });
  } catch (err) {
    console.error('[USERS RESET ALL QUIZ] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// POST /api/users/:id/reset-quiz
router.post('/:id/reset-quiz', async (req, res) => {
  try {
    const { id } = req.params;
    await supabase.from('quiz_completions').delete().eq('user_id', id);

    const { error } = await supabase
      .from('users')
      .update({ total_points: 0, quizzes_completed: 0 })
      .eq('id', id);

    if (error) {
      console.error('[USERS RESET ONE QUIZ] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mereset data kuis user.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Data kuis dan poin user berhasil direset.',
    });
  } catch (err) {
    console.error('[USERS RESET ONE QUIZ] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

module.exports = router;
