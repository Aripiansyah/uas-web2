// server/index.js
// Entry point untuk Express.js backend Classify App
// Menggunakan Supabase (PostgreSQL) sebagai database

require('dotenv').config();

const express = require('express');
const cors = require('cors');

// ─── Import Route Modules ─────────────────────
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const completionRoutes = require('./routes/completions');
const scheduleRoutes = require('./routes/schedules');
const quizRoutes = require('./routes/quizzes');
const announcementRoutes = require('./routes/announcements');
const userRoutes = require('./routes/users');

// ─── Inisialisasi Express App ─────────────────
const app = express();
const PORT = process.env.PORT || 3001;

// ─── CORS Configuration ───────────────────────
// Izinkan request dari URL frontend (Vite dev server default: 5173)
const allowedOrigins = [
  process.env.FRONTEND_URL || 'http://localhost:5173',
  'http://localhost:3000', // Fallback jika frontend di port 3000
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Izinkan request tanpa origin (misalnya dari Postman/curl) dan dari daftar allowedOrigins
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origin ${origin} tidak diizinkan oleh CORS`));
      }
    },
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true,
  }),
);

// ─── Body Parser Middleware ───────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ─── Request Logger (Development) ────────────
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    const timestamp = new Date().toISOString();
    console.log(`[${timestamp}] ${req.method} ${req.originalUrl}`);
    next();
  });
}

// ─── Health Check ─────────────────────────────
app.get('/api/health', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Classify API Server berjalan dengan baik! 🚀',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
  });
});

// ─── API Routes ───────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/completions', completionRoutes);
app.use('/api/schedules', scheduleRoutes);
app.use('/api/quizzes', quizRoutes);
app.use('/api/announcements', announcementRoutes);
app.use('/api/users', userRoutes);

// ─── Root Route ───────────────────────────────
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'Classify Backend API',
    endpoints: {
      health: 'GET /api/health',
      auth: {
        login: 'POST /api/auth/login',
        register: 'POST /api/auth/register',
      },
      tasks: {
        getAll: 'GET /api/tasks',
        getByUser: 'GET /api/tasks/user/:userId',
        create: 'POST /api/tasks',
        update: 'PUT /api/tasks/:id',
        delete: 'DELETE /api/tasks/:id',
      },
      completions: {
        getByUser: 'GET /api/completions/user/:userId',
        toggle: 'POST /api/completions',
        delete: 'DELETE /api/completions',
      },
      schedules: {
        getAll: 'GET /api/schedules',
        create: 'POST /api/schedules',
        update: 'PUT /api/schedules/:id',
        delete: 'DELETE /api/schedules/:id',
      },
      quizzes: {
        getAll: 'GET /api/quizzes',
        getQuestions: 'GET /api/quizzes/:id/questions',
        getCompletions: 'GET /api/quizzes/completions/:userId',
        complete: 'POST /api/quizzes/complete',
        create: 'POST /api/quizzes',
        delete: 'DELETE /api/quizzes/:id',
      },
      announcements: {
        getAll: 'GET /api/announcements',
        create: 'POST /api/announcements',
        update: 'PUT /api/announcements/:id',
        delete: 'DELETE /api/announcements/:id',
      },
    },
  });
});

// ─── 404 Handler ──────────────────────────────
app.use((_req, res) => {
  res.status(404).json({
    success: false,
    message: 'Endpoint tidak ditemukan. Periksa URL dan HTTP method yang digunakan.',
  });
});

// ─── Global Error Handler ─────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('[GLOBAL ERROR]', err.message || err);

  // Handle CORS error khusus
  if (err.message && err.message.includes('tidak diizinkan oleh CORS')) {
    return res.status(403).json({
      success: false,
      message: err.message,
    });
  }

  return res.status(500).json({
    success: false,
    message: 'Terjadi kesalahan internal pada server.',
    error: process.env.NODE_ENV === 'production' ? 'Internal Server Error' : err.message,
  });
});

// ─── Start Server ─────────────────────────────
app.listen(PORT, () => {
  console.log('');
  console.log('╔═════════════════════════════════════════════╗');
  console.log('║        🎓 Classify Backend API Server        ║');
  console.log('╠═════════════════════════════════════════════╣');
  console.log(`║  Status  : ✅ Running                        ║`);
  console.log(`║  Port    : http://localhost:${PORT}              ║`);
  console.log(`║  Env     : ${(process.env.NODE_ENV || 'development').padEnd(32)} ║`);
  console.log('╚═════════════════════════════════════════════╝');
  console.log('');
});

module.exports = app;
