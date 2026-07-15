// src/services/api.js
// Pengganti firebase.js - semua request diarahkan ke Express.js backend

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// ─── Helper Fetch ─────────────────────────────────────────────────────────────
async function apiFetch(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  const json = await res.json();
  if (!res.ok || !json.success) {
    throw new Error(json.message || `HTTP ${res.status}`);
  }
  return json;
}

// ─── User / Auth Service ──────────────────────────────────────────────────────
export const userService = {
  loginUser: async (nim, password) => {
    const json = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ nim, password }),
    });
    return json.data; // { uid, nim, name, role, avatarUrl, totalPoints, quizzesCompleted }
  },

  getUserByNim: async (nim) => {
    // Digunakan di registrasi untuk cek duplikat.
    // Backend /api/auth/register sudah handle ini, tapi tetap sediakan wrapper.
    try {
      const json = await apiFetch('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify({ nim, password: '__CHECK_ONLY__' }),
      });
      return json.data;
    } catch {
      return null; // null = NIM belum ada
    }
  },

  addUser: async (user) => {
    const json = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({
        nim: user.nim,
        name: user.name,
        role: user.role || 'User',
        password: user.password,
        avatar_url: user.avatarUrl || user.avatar_url || '',
      }),
    });
    return json.data; // { uid, nim, name, role, avatarUrl }
  },

  updateUser: async (id, userData) => {
    await apiFetch(`/api/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id) => {
    await apiFetch(`/api/users/${id}`, { method: 'DELETE' });
  },

  getUserById: async (id) => {
    const json = await apiFetch(`/api/users/${id}`);
    return json.data;
  },

  subscribeUserById: (userId, callback) => {
    apiFetch(`/api/users/${userId}`)
      .then((json) => callback(json.data))
      .catch((err) => console.error('[userService.subscribeUserById]', err));

    const interval = setInterval(() => {
      apiFetch(`/api/users/${userId}`)
        .then((json) => callback(json.data))
        .catch((err) => console.error('[userService.subscribeUserById poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  // Digunakan oleh Sidebar untuk daftar semua user — fetch biasa (tidak realtime)
  subscribeUsers: (callback) => {
    apiFetch('/api/users')
      .then((json) => callback(json.data))
      .catch((err) => console.error('[userService.subscribeUsers]', err));

    // Polling ringan tiap 30 detik sebagai pengganti realtime
    const interval = setInterval(() => {
      apiFetch('/api/users')
        .then((json) => callback(json.data))
        .catch((err) => console.error('[userService.subscribeUsers poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  // Upload avatar ke ImgBB (tidak perlu backend)
  uploadAvatar: async (_userId, file) => {
    const apiKey = 'bbfa7d8f7094dee9a8ec023a38f8c184';
    const formData = new FormData();
    formData.append('image', file);
    const res = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: 'POST',
      body: formData,
    });
    const result = await res.json();
    if (result.success) return result.data.url;
    throw new Error('Gagal mengunggah gambar ke ImgBB');
  },
};

// ─── Task Service ─────────────────────────────────────────────────────────────
export const taskService = {
  // Fetch semua tugas (polling 30 detik)
  subscribeTasks: (callback) => {
    apiFetch('/api/tasks')
      .then((json) => callback(json.data))
      .catch((err) => console.error('[taskService.subscribeTasks]', err));

    const interval = setInterval(() => {
      apiFetch('/api/tasks')
        .then((json) => callback(json.data))
        .catch((err) => console.error('[taskService.subscribeTasks poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  // Fetch tugas milik user tertentu
  subscribeUserTasks: (userId, callback) => {
    apiFetch(`/api/tasks/user/${userId}`)
      .then((json) => callback(json.data))
      .catch((err) => console.error('[taskService.subscribeUserTasks]', err));

    const interval = setInterval(() => {
      apiFetch(`/api/tasks/user/${userId}`)
        .then((json) => callback(json.data))
        .catch((err) => console.error('[taskService.subscribeUserTasks poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  getUserAssignedTasks: async (userId) => {
    const json = await apiFetch(`/api/tasks/user/${userId}`);
    return json.data;
  },

  addTask: async (task) => {
    const json = await apiFetch('/api/tasks', {
      method: 'POST',
      body: JSON.stringify({
        title: task.title,
        matkul: task.matkul,
        lecturer: task.lecturer,
        description: task.description,
        status: task.status,
        deadline: task.deadline,
        priority: task.priority,
        publisher_id: task.publisherId || task.publisher_id,
        assignedTo: task.assignedTo || [],
      }),
    });
    return json.data;
  },

  updateTask: async (id, task) => {
    const json = await apiFetch(`/api/tasks/${id}`, {
      method: 'PUT',
      body: JSON.stringify({
        title: task.title,
        matkul: task.matkul,
        lecturer: task.lecturer,
        description: task.description,
        status: task.status,
        deadline: task.deadline,
        priority: task.priority,
        publisher_id: task.publisherId || task.publisher_id,
        assignedTo: task.assignedTo,
      }),
    });
    return json.data;
  },

  deleteTask: async (id) => {
    await apiFetch(`/api/tasks/${id}`, { method: 'DELETE' });
  },

  // Toggle penyelesaian tugas (backend return { completed: true/false })
  saveUserTaskCompletion: async (userId, taskId) => {
    const json = await apiFetch('/api/completions', {
      method: 'POST',
      body: JSON.stringify({ user_id: userId, task_id: taskId }),
    });
    return json.completed; // true = baru selesai, false = dibatalkan
  },

  // Riwayat penyelesaian tugas milik user
  subscribeUserTaskCompletions: (userId, callback) => {
    apiFetch(`/api/completions/user/${userId}`)
      .then((json) => callback(json.data))
      .catch((err) => console.error('[taskService.subscribeUserTaskCompletions]', err));

    const interval = setInterval(() => {
      apiFetch(`/api/completions/user/${userId}`)
        .then((json) => callback(json.data))
        .catch((err) => console.error('[subscribeUserTaskCompletions poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  getUserTaskCompletions: async (userId) => {
    const json = await apiFetch(`/api/completions/user/${userId}`);
    return json.data;
  },

  // Semua penyelesaian tugas (untuk chart admin)
  getAllTaskCompletions: async () => {
    const json = await apiFetch('/api/completions/all');
    return json.data;
  },

  subscribeAllTaskCompletions: (callback) => {
    apiFetch('/api/completions/all')
      .then((json) => callback(json.data))
      .catch((err) => console.error('[subscribeAllTaskCompletions]', err));

    const interval = setInterval(() => {
      apiFetch('/api/completions/all')
        .then((json) => callback(json.data))
        .catch((err) => console.error('[subscribeAllTaskCompletions poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },
};

// ─── Schedule Service ─────────────────────────────────────────────────────────
export const scheduleService = {
  getSchedules: async () => {
    const json = await apiFetch('/api/schedules');
    return json.data;
  },

  subscribeSchedules: (callback) => {
    apiFetch('/api/schedules')
      .then((json) => callback(json.data))
      .catch((err) => console.error('[scheduleService.subscribeSchedules]', err));

    const interval = setInterval(() => {
      apiFetch('/api/schedules')
        .then((json) => callback(json.data))
        .catch((err) => console.error('[scheduleService.subscribeSchedules poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  addSchedule: async (schedule) => {
    const json = await apiFetch('/api/schedules', {
      method: 'POST',
      body: JSON.stringify(schedule),
    });
    return json.data;
  },

  updateSchedule: async (id, schedule) => {
    await apiFetch(`/api/schedules/${id}`, {
      method: 'PUT',
      body: JSON.stringify(schedule),
    });
  },

  deleteSchedule: async (id) => {
    await apiFetch(`/api/schedules/${id}`, { method: 'DELETE' });
  },
};

// ─── Quiz Service ─────────────────────────────────────────────────────────────
export const quizService = {
  subscribeQuizzes: (callback) => {
    apiFetch('/api/quizzes')
      .then((json) => callback(json.data))
      .catch((err) => console.error('[quizService.subscribeQuizzes]', err));

    const interval = setInterval(() => {
      apiFetch('/api/quizzes')
        .then((json) => callback(json.data))
        .catch((err) => console.error('[quizService.subscribeQuizzes poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  getQuizQuestions: async (quizId) => {
    const json = await apiFetch(`/api/quizzes/${quizId}/questions`);
    return json.data;
  },

  saveQuizCompletion: async (userId, quizId, score, correctAnswers, totalQuestions) => {
    await apiFetch('/api/quizzes/complete', {
      method: 'POST',
      body: JSON.stringify({
        user_id: userId,
        quiz_id: quizId,
        score,
        correct_answers: correctAnswers,
        total_questions: totalQuestions,
      }),
    });
    return true;
  },

  getUserQuizCompletions: async (userId) => {
    const json = await apiFetch(`/api/quizzes/completions/${userId}`);
    return json.data;
  },

  subscribeUserQuizCompletions: (userId, callback) => {
    apiFetch(`/api/quizzes/completions/${userId}`)
      .then((json) => callback(json.data))
      .catch((err) => console.error('[subscribeUserQuizCompletions]', err));

    const interval = setInterval(() => {
      apiFetch(`/api/quizzes/completions/${userId}`)
        .then((json) => callback(json.data))
        .catch((err) => console.error('[subscribeUserQuizCompletions poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  getUserQuizStats: async (userId) => {
    try {
      const completions = await quizService.getUserQuizCompletions(userId);
      if (!completions || completions.length === 0) {
        return { totalQuizzesCompleted: 0, totalPoints: 0, averageScore: 0 };
      }
      const totalPoints = completions.reduce((sum, c) => sum + (c.score || 0), 0);
      const averageScore = Math.round(totalPoints / completions.length);
      return { totalQuizzesCompleted: completions.length, totalPoints, averageScore, completions };
    } catch {
      return { totalQuizzesCompleted: 0, totalPoints: 0, averageScore: 0 };
    }
  },

  checkQuizCompletion: async (userId, quizId) => {
    try {
      const completions = await quizService.getUserQuizCompletions(userId);
      return completions.some((c) => c.quiz_id === quizId);
    } catch {
      return false;
    }
  },

  createQuiz: async ({ title, category, questions }) => {
    const json = await apiFetch('/api/quizzes', {
      method: 'POST',
      body: JSON.stringify({ title, category, questions }),
    });
    return json.data;
  },

  deleteQuiz: async (quizId) => {
    await apiFetch(`/api/quizzes/${quizId}`, { method: 'DELETE' });
  },

  resetUserQuizData: async (userId) => {
    await apiFetch(`/api/users/${userId}/reset-quiz`, { method: 'POST' });
    return true;
  },

  resetAllUserQuizData: async () => {
    await apiFetch('/api/users/reset-all-quiz', { method: 'POST' });
    return true;
  },

  deleteQuizCompletion: async (userId, quizId) => {
    await apiFetch('/api/quizzes/completion', {
      method: 'DELETE',
      body: JSON.stringify({ user_id: userId, quiz_id: quizId }),
    });
    return true;
  },
};

// ─── Announcement Service ─────────────────────────────────────────────────────
export const announcementService = {
  subscribeAnnouncements: (callback) => {
    apiFetch('/api/announcements')
      .then((json) => callback(json.data))
      .catch((err) => console.error('[announcementService.subscribeAnnouncements]', err));

    const interval = setInterval(() => {
      apiFetch('/api/announcements')
        .then((json) => callback(json.data))
        .catch((err) => console.error('[subscribeAnnouncements poll]', err));
    }, 30_000);

    return () => clearInterval(interval);
  },

  addAnnouncement: async ({ title, body, createdBy }) => {
    const json = await apiFetch('/api/announcements', {
      method: 'POST',
      body: JSON.stringify({ title, body, created_by: createdBy }),
    });
    return json.data;
  },

  updateAnnouncement: async (id, data) => {
    await apiFetch(`/api/announcements/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteAnnouncement: async (id) => {
    await apiFetch(`/api/announcements/${id}`, { method: 'DELETE' });
  },
};
