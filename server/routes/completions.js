// server/routes/completions.js

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Semua data penyelesaian 
router.get('/all', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[COMPLETIONS GET ALL] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil semua data penyelesaian tugas.',
        error: error.message,
      });
    }

    return res.status(200).json({ success: true, count: data.length, data });
  } catch (err) {
    console.error('[COMPLETIONS GET ALL] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Riwayat penyelesaian tugas milik user
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId wajib diisi.' });
    }

    const { data, error } = await supabase
      .from('task_completions')
      .select('*')
      .eq('user_id', userId)
      .order('completed_at', { ascending: false });

    if (error) {
      console.error('[COMPLETIONS GET USER] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil riwayat penyelesaian tugas.',
        error: error.message,
      });
    }

    const taskIds = data.map((row) => row.task_id);
    return res.status(200).json({ success: true, count: taskIds.length, data: taskIds });
  } catch (err) {
    console.error('[COMPLETIONS GET USER] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// POST /api/completions
router.post('/', async (req, res) => {
  try {
    const rawBody = req.body || {};
    const user_id = rawBody.user_id || rawBody.userId;
    const task_id = rawBody.task_id || rawBody.taskId;

    console.log('[COMPLETIONS POST] Received:', { user_id, task_id });

    if (!user_id || !task_id) {
      return res.status(400).json({
        success: false,
        message: 'user_id dan task_id wajib diisi.',
        received: rawBody,
      });
    }

    // Cek record
    const { data: existing, error: checkError } = await supabase
      .from('task_completions')
      .select('user_id, task_id')
      .eq('user_id', user_id)
      .eq('task_id', task_id)
      .maybeSingle();

    if (checkError) {
      console.error('[COMPLETIONS POST] Check error:', {
        message: checkError.message,
        details: checkError.details,
        hint: checkError.hint,
        code: checkError.code,
      });
      return res.status(500).json({
        success: false,
        message: 'Gagal memeriksa status penyelesaian tugas.',
        error: checkError.message,
        code: checkError.code,
      });
    }

    // Jika sudah ada — batalkan 
    if (existing) {
      console.log('[COMPLETIONS POST] Deleting existing record...');
      const { error: deleteError } = await supabase
        .from('task_completions')
        .delete()
        .eq('user_id', user_id)
        .eq('task_id', task_id);

      if (deleteError) {
        console.error('[COMPLETIONS POST] Delete error:', deleteError);
        return res.status(500).json({
          success: false,
          message: 'Gagal membatalkan penyelesaian tugas.',
          error: deleteError.message,
        });
      }

      return res.status(200).json({
        success: true,
        completed: false,
        message: 'Status penyelesaian tugas berhasil dibatalkan.',
      });
    }

    // Jika belum ada — insert baru
    console.log('[COMPLETIONS POST] Inserting new record...');
    const insertPayload = { user_id, task_id };
    try {
      const { data: newCompletion, error: insertError } = await supabase
        .from('task_completions')
        .insert([{ ...insertPayload, completed_at: new Date().toISOString() }])
        .select()
        .single();

      if (insertError) {
        if (insertError.code === '42703') {
          console.warn('[COMPLETIONS POST] completed_at tidak ada, retry tanpa kolom itu...');
          const { data: newCompletion2, error: insertError2 } = await supabase
            .from('task_completions')
            .insert([insertPayload])
            .select()
            .single();

          if (insertError2) {
            console.error('[COMPLETIONS POST] Insert error (retry):', insertError2);
            return res.status(500).json({
              success: false,
              message: 'Gagal menyimpan penyelesaian tugas.',
              error: insertError2.message,
              code: insertError2.code,
            });
          }

          console.log('[COMPLETIONS POST] Berhasil disimpan (tanpa completed_at):', newCompletion2);
          return res.status(201).json({
            success: true,
            completed: true,
            message: 'Tugas berhasil ditandai selesai.',
            data: newCompletion2,
          });
        }

        console.error('[COMPLETIONS POST] Insert error:', {
          message: insertError.message,
          details: insertError.details,
          hint: insertError.hint,
          code: insertError.code,
        });
        return res.status(500).json({
          success: false,
          message: 'Gagal menyimpan penyelesaian tugas.',
          error: insertError.message,
          code: insertError.code,
        });
      }

      console.log('[COMPLETIONS POST] Berhasil disimpan:', newCompletion);
      return res.status(201).json({
        success: true,
        completed: true,
        message: 'Tugas berhasil ditandai selesai.',
        data: newCompletion,
      });
    } catch (insertErr) {
      console.error('[COMPLETIONS POST] Insert threw:', insertErr);
      return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: insertErr.message });
    }
  } catch (err) {
    console.error('[COMPLETIONS POST] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// Hapus data penyelesaian 
router.delete('/', async (req, res) => {
  try {
    const rawBody = req.body || {};
    const user_id = rawBody.user_id || rawBody.userId;
    const task_id = rawBody.task_id || rawBody.taskId;

    if (!user_id || !task_id) {
      return res.status(400).json({ success: false, message: 'user_id dan task_id wajib diisi.' });
    }

    const { error } = await supabase
      .from('task_completions')
      .delete()
      .eq('user_id', user_id)
      .eq('task_id', task_id);

    if (error) {
      console.error('[COMPLETIONS DELETE] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus data penyelesaian tugas.',
        error: error.message,
      });
    }

    return res.status(200).json({ success: true, message: 'Data penyelesaian tugas berhasil dihapus.' });
  } catch (err) {
    console.error('[COMPLETIONS DELETE] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

module.exports = router;
