// server/routes/schedules.js
// Endpoints:
//   GET    /api/schedules        - Mengambil semua jadwal kuliah
//   POST   /api/schedules        - Menambah jadwal baru
//   PUT    /api/schedules/:id    - Update jadwal
//   DELETE /api/schedules/:id    - Hapus jadwal

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

function toDbPayload(body) {
  return {
    matkul: body.matkul || body.subject || undefined,
    lecturer: body.lecturer || body.dosen || undefined,
    hari: body.hari || body.day || undefined,
    jam_mulai: body.jam_mulai || body.jamMulai || body.startTime || undefined,
    jam_selesai: body.jam_selesai || body.jamSelesai || body.endTime || undefined,
    ruangan: body.ruangan || body.room || undefined,
    jenis_kelas: body.jenis_kelas || body.jenisKelas || body.classType || undefined,
    sks: body.sks != null ? Number(body.sks) : undefined,
  };
}

function toFrontendFormat(row) {
  if (!row) return row;
  return {
    id: row.id,
    matkul: row.matkul,
    lecturer: row.lecturer,
    hari: row.hari,
    jamMulai: row.jam_mulai ? String(row.jam_mulai).slice(0, 5) : '',
    jamSelesai: row.jam_selesai ? String(row.jam_selesai).slice(0, 5) : '',
    ruangan: row.ruangan,
    jenisKelas: row.jenis_kelas,
    sks: row.sks,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─────────────────────────────────────────────
// GET /api/schedules
// ─────────────────────────────────────────────
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('schedules')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('[SCHEDULES GET] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil jadwal kuliah.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: data.length,
      data: data.map(toFrontendFormat),
    });
  } catch (err) {
    console.error('[SCHEDULES GET] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// POST /api/schedules
router.post('/', async (req, res) => {
  try {
    const body = req.body || {};

    if (!body || Object.keys(body).length === 0) {
      return res.status(400).json({ success: false, message: 'Data jadwal tidak boleh kosong.' });
    }

    const payload = toDbPayload(body);

    // Validasi field wajib
    if (!payload.matkul || !payload.lecturer || !payload.hari || !payload.jam_mulai || !payload.jam_selesai || !payload.ruangan) {
      return res.status(400).json({
        success: false,
        message: 'Field wajib: matkul, lecturer, hari, jamMulai, jamSelesai, ruangan.',
        received: payload,
      });
    }

    console.log('[SCHEDULES POST] Payload ke Supabase:', payload);

    const { data, error } = await supabase
      .from('schedules')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.error('[SCHEDULES POST] Supabase error:', { message: error.message, details: error.details, hint: error.hint, code: error.code });
      return res.status(500).json({
        success: false,
        message: 'Gagal menambah jadwal.',
        error: error.message,
        hint: error.hint,
        code: error.code,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Jadwal berhasil ditambahkan.',
      data: toFrontendFormat(data),
    });
  } catch (err) {
    console.error('[SCHEDULES POST] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// PUT /api/schedules/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const body = req.body || {};

    const payload = toDbPayload(body);

    // Hapus field undefined agar tidak overwrite dengan NULL
    Object.keys(payload).forEach((k) => payload[k] === undefined && delete payload[k]);

    console.log('[SCHEDULES PUT] Payload ke Supabase:', payload);

    const { data, error } = await supabase
      .from('schedules')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (error) {
      console.error('[SCHEDULES PUT] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate jadwal.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Jadwal berhasil diupdate.',
      data: toFrontendFormat(data),
    });
  } catch (err) {
    console.error('[SCHEDULES PUT] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// DELETE /api/schedules/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase.from('schedules').delete().eq('id', id);

    if (error) {
      console.error('[SCHEDULES DELETE] Supabase error:', error);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus jadwal.',
        error: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Jadwal berhasil dihapus.`,
    });
  } catch (err) {
    console.error('[SCHEDULES DELETE] Unexpected error:', err);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

module.exports = router;
