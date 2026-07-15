// server/routes/tasks.js
// Endpoints:
//   GET    /api/tasks                   - Semua tugas
//   GET    /api/tasks/user/:userId      - Tugas yang ditugaskan ke user (JOIN task_assignments)
//   POST   /api/tasks                   - Buat tugas baru (+ task_assignments)
//   PUT    /api/tasks/:id               - Update tugas (+ sync task_assignments)
//   DELETE /api/tasks/:id               - Hapus tugas (+ cascade hapus assignments & completions)

const express = require('express');
const router = express.Router();
const { supabase } = require('../config/supabase');

// Sinkronisasi daftar penugasan (hapus lama, insert baru)
const syncTaskAssignments = async (taskId, userIds = []) => {
  // Hapus semua assignment lama untuk task ini
  const { error: deleteError } = await supabase
    .from('task_assignments')
    .delete()
    .eq('task_id', taskId);

  if (deleteError) throw deleteError;

  // Filter userId yang valid dan insert yang baru
  const cleanedUserIds = Array.isArray(userIds) ? userIds.filter(Boolean) : [];
  if (cleanedUserIds.length > 0) {
    const rows = cleanedUserIds.map((userId) => ({
      task_id: taskId,
      user_id: userId,
    }));
    const { error: insertError } = await supabase.from('task_assignments').insert(rows);
    if (insertError) throw insertError;
  }
};

// GET /api/tasks
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, task_assignments(user_id)')
      .order('created_at', { ascending: false });

    if (error) {
      console.error('[TASKS GET ALL] Supabase error:', error.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil daftar tugas.',
        error: error.message,
      });
    }

    // Map task_assignments to assignedTo array of user IDs
    const formattedTasks = data.map((task) => {
      const assignedTo = task.task_assignments
        ? task.task_assignments.map((assignment) => assignment.user_id)
        : [];
      const { task_assignments, ...taskRest } = task;
      return {
        ...taskRest,
        assignedTo,
      };
    });

    return res.status(200).json({
      success: true,
      count: formattedTasks.length,
      data: formattedTasks,
    });
  } catch (err) {
    console.error('[TASKS GET ALL] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// GET /api/tasks/user/:userId
router.get('/user/:userId', async (req, res) => {
  try {
    const { userId } = req.params;

    if (!userId) {
      return res.status(400).json({ success: false, message: 'userId wajib diisi.' });
    }

    // Ambil task_id dari tabel perantara task_assignments
    const { data: assignments, error: assignError } = await supabase
      .from('task_assignments')
      .select('task_id')
      .eq('user_id', userId);

    if (assignError) {
      console.error('[TASKS USER] Assignment error:', assignError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil data penugasan.',
        error: assignError.message,
      });
    }

    const taskIds = assignments.map((row) => row.task_id);

    // Jika tidak ada tugas yang ditugaskan, kembalikan array kosong
    if (taskIds.length === 0) {
      return res.status(200).json({ success: true, count: 0, data: [] });
    }

    // Ambil detail tugas berdasarkan task_id
    const { data: tasks, error: taskError } = await supabase
      .from('tasks')
      .select('*')
      .in('id', taskIds)
      .order('created_at', { ascending: false });

    if (taskError) {
      console.error('[TASKS USER] Task fetch error:', taskError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengambil detail tugas.',
        error: taskError.message,
      });
    }

    return res.status(200).json({
      success: true,
      count: tasks.length,
      data: tasks,
    });
  } catch (err) {
    console.error('[TASKS USER] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// POST /api/tasks
router.post('/', async (req, res) => {
  try {
    const {
      title,
      matkul,
      lecturer,
      description,
      status,
      deadline,
      priority,
      publisher_id,
      assignedTo,
    } = req.body;

    if (!title) {
      return res.status(400).json({ success: false, message: 'Judul tugas wajib diisi.' });
    }

    const payload = {
      title,
      matkul: matkul || null,
      lecturer: lecturer || null,
      description: description || null,
      status: status || 'Aktif',
      deadline: deadline || null,
      priority: priority || 'Medium',
      publisher_id: publisher_id || null,
    };

    const { data: newTask, error: insertError } = await supabase
      .from('tasks')
      .insert([payload])
      .select()
      .single();

    if (insertError) {
      console.error('[TASKS CREATE] Insert error:', insertError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal membuat tugas baru.',
        error: insertError.message,
      });
    }

    // Sync task_assignments jika ada daftar user yang ditugaskan
    if (Array.isArray(assignedTo) && assignedTo.length > 0) {
      try {
        await syncTaskAssignments(newTask.id, assignedTo);
      } catch (syncErr) {
        console.error('[TASKS CREATE] Sync assignments error:', syncErr.message);
        // Tugas tetap dibuat, tapi warning tentang assignments
        return res.status(207).json({
          success: true,
          message: 'Tugas dibuat, namun gagal menyimpan sebagian penugasan.',
          warning: syncErr.message,
          data: newTask,
        });
      }
    }

    return res.status(201).json({
      success: true,
      message: 'Tugas berhasil dibuat.',
      data: newTask,
    });
  } catch (err) {
    console.error('[TASKS CREATE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// PUT /api/tasks/:id
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      matkul,
      lecturer,
      description,
      status,
      deadline,
      priority,
      publisher_id,
      assignedTo,
    } = req.body;

    const payload = {};
    if (title !== undefined) payload.title = title;
    if (matkul !== undefined) payload.matkul = matkul;
    if (lecturer !== undefined) payload.lecturer = lecturer;
    if (description !== undefined) payload.description = description;
    if (status !== undefined) payload.status = status;
    if (deadline !== undefined) payload.deadline = deadline;
    if (priority !== undefined) payload.priority = priority;
    if (publisher_id !== undefined) payload.publisher_id = publisher_id;

    const { data: updatedTask, error: updateError } = await supabase
      .from('tasks')
      .update(payload)
      .eq('id', id)
      .select()
      .single();

    if (updateError) {
      console.error('[TASKS UPDATE] Update error:', updateError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal mengupdate tugas.',
        error: updateError.message,
      });
    }

    // Sync task_assignments jika dikirim
    if (Array.isArray(assignedTo)) {
      try {
        await syncTaskAssignments(id, assignedTo);
      } catch (syncErr) {
        console.error('[TASKS UPDATE] Sync error:', syncErr.message);
        return res.status(207).json({
          success: true,
          message: 'Tugas diupdate, namun gagal sinkronisasi penugasan.',
          warning: syncErr.message,
          data: updatedTask,
        });
      }
    }

    return res.status(200).json({
      success: true,
      message: 'Tugas berhasil diupdate.',
      data: updatedTask,
    });
  } catch (err) {
    console.error('[TASKS UPDATE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

// DELETE /api/tasks/:id
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Hapus semua penugasan terkait
    await supabase.from('task_assignments').delete().eq('task_id', id);

    // 2. Hapus semua data penyelesaian terkait
    await supabase.from('task_completions').delete().eq('task_id', id);

    // 3. Hapus tugas itu sendiri
    const { error: deleteError } = await supabase.from('tasks').delete().eq('id', id);

    if (deleteError) {
      console.error('[TASKS DELETE] Delete error:', deleteError.message);
      return res.status(500).json({
        success: false,
        message: 'Gagal menghapus tugas.',
        error: deleteError.message,
      });
    }

    return res.status(200).json({
      success: true,
      message: `Tugas dengan ID ${id} berhasil dihapus beserta data terkait.`,
    });
  } catch (err) {
    console.error('[TASKS DELETE] Unexpected error:', err.message);
    return res.status(500).json({ success: false, message: 'Kesalahan internal server.', error: err.message });
  }
});

module.exports = router;
