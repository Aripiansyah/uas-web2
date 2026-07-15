// server/routes/announcements.js

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('announcements')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[ANNOUNCEMENTS GET] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar pengumuman.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data,
    });
  } catch (err) {
    console.error('[ANNOUNCEMENTS GET] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

router.post('/', async (req, res) => {
  try {
    const { title, body, created_by } = req.body;

    if (!title || !body) {
      return res.status(400).json({
        success: false,
        message: 'Judul dan isi pengumuman wajib diisi.',
      });
    }

    const { data, error } = await supabase
      .from('announcements')
      .insert([
        {
          title,
          body,
          created_by: created_by || null,
          created_at: new Date().toISOString(),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error('[ANNOUNCEMENTS POST] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat pengumuman baru.',
        error: error.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Pengumuman berhasil dibuat.',
      data,
    });
  } catch (err) {
    console.error('[ANNOUNCEMENTS POST] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, body, created_by } = req.body;

    const payload = {};
    if (title !== undefined) payload.title = title;
    if (body !== undefined) payload.body = body;
    if (created_by !== undefined) payload.created_by = created_by;

    const { data, error } = await supabase
      .from('announcements')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[ANNOUNCEMENTS PUT] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate pengumuman.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Pengumuman berhasil diupdate.',
      data,
    });
  } catch (err) {
    console.error('[ANNOUNCEMENTS PUT] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('announcements').delete().eq('id', id);

    if (error) {
      console.error('[ANNOUNCEMENTS DELETE] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus pengumuman.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Pengumuman dengan ID ${id} berhasil dihapus.`,
    });
  } catch (err) {
    console.error('[ANNOUNCEMENTS DELETE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

module.exports = router;
