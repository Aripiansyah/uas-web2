// server/routes/auth.js

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const { nim, password } = req.body;

    if (!nim || !password) {
      return res.status(400).json({
        success: false,
        message: 'NIM dan password wajib diisi.',
      });
    }

    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('nim', String(nim))
      .eq('password', String(password))
      .maybeSingle();

    if (error) {
      console.error('[AUTH LOGIN] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan pada server.',
        error: error.message,
      });
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'NIM atau password salah.',
      });
    }

    return res.status(200).json({
      success: true,
      message: 'Login berhasil.',
      data: {
        uid: user.id,
        nim: user.nim,
        name: user.name,
        role: user.role || 'User',
        avatarUrl: user.avatar_url || '',
        totalPoints: user.total_points || 0,
        quizzesCompleted: user.quizzes_completed || 0,
      },
    });
  } catch (err) {
    console.error('[AUTH LOGIN] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal pada server.',
      error: err.message,
    });
  }
});

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const { nim, name, role, password, avatar_url } = req.body;

    if (!nim || !name || !password) {
      return res.status(400).json({
        success: false,
        message: 'NIM, nama, dan password wajib diisi.',
      });
    }

    // NIM sudah terdaftar
    const { data: existing, error: checkError } = await supabase
      .from('users')
      .select('id')
      .eq('nim', String(nim))
      .maybeSingle();

    if (checkError) {
      console.error('[AUTH REGISTER] Check error:', checkError.message);
      return res.status(500).json({
        success: false,
        message: 'Terjadi kesalahan saat memverifikasi NIM.',
        error: checkError.message,
      });
    }

    if (existing) {
      return res.status(409).json({
        success: false,
        message: 'NIM sudah terdaftar. Gunakan NIM yang berbeda.',
      });
    }

    const payload = {
      nim: String(nim),
      name: String(name),
      role: role || 'User',
      password: String(password),
      avatar_url: avatar_url || '',
      total_points: 0,
      quizzes_completed: 0,
    };

    const { data: newUser, error: insertError } = await supabase
      .from('users')
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      console.error('[AUTH REGISTER] Insert error:', insertError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mendaftarkan user baru.',
        error: insertError.message,
      });
    }

    return res.status(201).json({
      success: true,
      message: 'Registrasi berhasil.',
      data: {
        uid: newUser.id,
        nim: newUser.nim,
        name: newUser.name,
        role: newUser.role,
        avatarUrl: newUser.avatar_url || '',
      },
    });
  } catch (err) {
    console.error('[AUTH REGISTER] Unexpected error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Terjadi kesalahan internal pada server.',
      error: err.message,
    });
  }
});

module.exports = router;
