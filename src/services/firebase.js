import { initializeApp } from 'firebase/app';
import { getFirestore, collection, doc, setDoc, updateDoc, getDocs, addDoc, deleteDoc, onSnapshot, increment, query, where } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { getAnalytics } from "firebase/analytics";

// Masukkan konfigurasi dari Firebase Console Anda di sini
const firebaseConfig = {
  apiKey: "AIzaSyAaNnsNgL2jSiHhe2da1NuNPIJhz5U7tsA",
  authDomain: "classify-55382.firebaseapp.com",
  projectId: "classify-55382",
  storageBucket: "classify-55382.firebasestorage.app",
  messagingSenderId: "129952998365",
  appId: "1:129952998365:web:9be316943e5164c65e0c34",
  measurementId: "G-FHVKM0RJN5"
};

// Inisialisasi Firebase
const app = initializeApp(firebaseConfig);

// Ekspor layanan yang dibutuhkan

export const db = getFirestore(app);

export const taskService = {
  // Mengambil data tugas secara Realtime - SEMUA TASKS
  subscribeTasks: (callback) => {
    return onSnapshot(collection(db, 'tasks'), (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
  },

  // Mengambil tasks yang di-assign ke user tertentu (FILTERED BY USER)
  subscribeUserTasks: (userId, callback) => {
    const q = query(
      collection(db, 'tasks'),
      where('assignedTo', 'array-contains', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const tasks = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(tasks);
    });
  },

  // Alternative: Get tasks assigned to user (yang berisi array user IDs)
  getUserAssignedTasks: async (userId) => {
    try {
      const q = query(
        collection(db, 'tasks'),
        where('assignedTo', 'array-contains', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting user tasks:", error);
      return [];
    }
  },

  // Task completion data for per-user dashboard tracking
  saveUserTaskCompletion: async (userId, taskId) => {
    try {
      const q = query(
        collection(db, 'taskCompletions'),
        where('userId', '==', userId),
        where('taskId', '==', taskId)
      );
      const snapshot = await getDocs(q);

      if (!snapshot.empty) {
        const existing = snapshot.docs[0];
        await deleteDoc(doc(db, 'taskCompletions', existing.id));
        return false;
      }

      await addDoc(collection(db, 'taskCompletions'), {
        userId,
        taskId,
        completedAt: new Date(),
        timestamp: Date.now()
      });
      return true;
    } catch (error) {
      console.error("Error saving user task completion:", error);
      throw error;
    }
  },

  subscribeUserTaskCompletions: (userId, callback) => {
    const q = query(
      collection(db, 'taskCompletions'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const completedTaskIds = snapshot.docs.map(doc => doc.data().taskId);
      callback(completedTaskIds);
    });
  },

  getUserTaskCompletions: async (userId) => {
    try {
      const q = query(
        collection(db, 'taskCompletions'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting user task completions:", error);
      return [];
    }
  },

  addTask: async (task) => await addDoc(collection(db, 'tasks'), task),
  updateTask: async (id, task) => await updateDoc(doc(db, 'tasks', id), task),
  deleteTask: async (id) => await deleteDoc(doc(db, 'tasks', id)),

  // Get all task completions (admin/top completion dashboard helper)
  getAllTaskCompletions: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'taskCompletions'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting all task completions:", error);
      return [];
    }
  },

  // Realtime listener for all task completions
  subscribeAllTaskCompletions: (callback) => {
    return onSnapshot(collection(db, 'taskCompletions'), (snapshot) => {
      const completions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(completions);
    });
  },
};

export const userService = {
  // Fungsi login - cari user by NIM dan validasi password
  loginUser: async (nim, password) => {
    try {
      const q = query(collection(db, 'users'), where('nim', '==', nim));
      const snapshot = await getDocs(q);
      
      if (snapshot.empty) {
        throw new Error('NIM tidak ditemukan');
      }

      const userDoc = snapshot.docs[0];
      const userData = userDoc.data();

      // Validasi password (CATATAN: di production, password harus di-hash!)
      if (userData.password !== password) {
        throw new Error('Password salah');
      }

      // Return user data dengan id
      return {
        uid: userDoc.id,
        nim: userData.nim,
        name: userData.name,
        role: userData.role,
        avatarUrl: userData.avatarUrl || ''
      };
    } catch (error) {
      throw error;
    }
  },

  // Realtime snapshot listener untuk halaman Kelola User
  subscribeUsers: (callback) => {
    return onSnapshot(collection(db, 'users'), (snapshot) => {
      const users = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(users);
    });
  },

  // Fungsi untuk menambah poin user
  addPoints: async (userId, points) => {
    const userRef = doc(db, "users", userId);
    await updateDoc(userRef, {
      totalPoints: increment(points) // Menambah poin secara otomatis di Firestore
    });
  },
  
  // MENGGUNAKAN setDoc agar otomatis membuat dokumen baru jika id belum terdaftar
  updateUser: async (id, userData) => {
    return await setDoc(doc(db, 'users', id), userData, { merge: true });
  },
  
  addUser: async (user) => await addDoc(collection(db, 'users'), user),
  deleteUser: async (id) => await deleteDoc(doc(db, 'users', id)),

  // Fungsi upload ImgBB
  uploadAvatar: async (userId, file) => {
    const apiKey = "bbfa7d8f7094dee9a8ec023a38f8c184"; // Ganti dengan key ImgBB asli Anda!
    const formData = new FormData();
    formData.append("image", file);

    const response = await fetch(`https://api.imgbb.com/1/upload?key=${apiKey}`, {
      method: "POST",
      body: formData,
    });

    const result = await response.json();
    if (result.success) {
      return result.data.url;
    } else {
      throw new Error("Gagal mengunggah gambar ke ImgBB");
    }
  }
};

export const scheduleService = {
  // Realtime snapshot listener untuk halaman jadwal
  subscribeSchedules: (callback) => {
    return onSnapshot(collection(db, 'schedules'), (snapshot) => {
      const schedules = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(schedules);
    });
  },

  // Ambil semua jadwal sekali (bukan realtime)
  getSchedules: async () => {
    const snapshot = await getDocs(collection(db, 'schedules'));
    return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
  },

  // Tambah jadwal baru
  addSchedule: async (schedule) => {
    return await addDoc(collection(db, 'schedules'), {
      ...schedule,
      createdAt: new Date()
    });
  },

  // Update jadwal
  updateSchedule: async (id, schedule) => {
    return await updateDoc(doc(db, 'schedules', id), {
      ...schedule,
      updatedAt: new Date()
    });
  },

  // Hapus jadwal
  deleteSchedule: async (id) => {
    return await deleteDoc(doc(db, 'schedules', id));
  }
};

// Quiz Service - untuk track quiz completions dan scores
export const quizService = {
  // Simpan quiz completion
  saveQuizCompletion: async (userId, quizId, score, correctAnswers, totalQuestions) => {
    try {
      const completionRef = collection(db, 'quizCompletions');
      await addDoc(completionRef, {
        userId,
        quizId,
        score,
        correctAnswers,
        totalQuestions,
        completedAt: new Date(),
        timestamp: Date.now()
      });
      
      // Update user total points + quiz completion count
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        totalPoints: increment(score),
        quizzesCompleted: increment(1)
      });
      
      return true;
    } catch (error) {
      console.error("Error saving quiz completion:", error);
      throw error;
    }
  },

  // Cek apakah user sudah complete quiz ini
  checkQuizCompletion: async (userId, quizId) => {
    try {
      const q = query(
        collection(db, 'quizCompletions'),
        where('userId', '==', userId),
        where('quizId', '==', quizId)
      );
      const snapshot = await getDocs(q);
      return !snapshot.empty;
    } catch (error) {
      console.error("Error checking quiz completion:", error);
      return false;
    }
  },

  // Ambil semua quiz completions user
  getUserQuizCompletions: async (userId) => {
    try {
      const q = query(
        collection(db, 'quizCompletions'),
        where('userId', '==', userId)
      );
      const snapshot = await getDocs(q);
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting user quiz completions:", error);
      return [];
    }
  },

  // Hitung statistik quiz user
  getUserQuizStats: async (userId) => {
    try {
      const completions = await quizService.getUserQuizCompletions(userId);
      if (completions.length === 0) {
        return {
          totalQuizzesCompleted: 0,
          totalPoints: 0,
          averageScore: 0
        };
      }
      
      const totalPoints = completions.reduce((sum, c) => sum + (c.score || 0), 0);
      const averageScore = Math.round(totalPoints / completions.length);
      
      return {
        totalQuizzesCompleted: completions.length,
        totalPoints,
        averageScore,
        completions
      };
    } catch (error) {
      console.error("Error calculating quiz stats:", error);
      return {
        totalQuizzesCompleted: 0,
        totalPoints: 0,
        averageScore: 0
      };
    }
  },

  // Realtime listener untuk quiz completions user
  subscribeUserQuizCompletions: (userId, callback) => {
    const q = query(
      collection(db, 'quizCompletions'),
      where('userId', '==', userId)
    );
    return onSnapshot(q, (snapshot) => {
      const completions = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(completions);
    });
  },

  // Reset user quiz history dan points
  resetUserQuizData: async (userId) => {
    try {
      // Ambil semua quiz completions user
      const completions = await quizService.getUserQuizCompletions(userId);
      
      // Hapus semua quiz completions
      for (const completion of completions) {
        await deleteDoc(doc(db, 'quizCompletions', completion.id));
      }
      
      // Reset total points + stats quiz di user document
      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        totalPoints: 0,
        quizzesCompleted: 0
      });
      
      return true;
    } catch (error) {
      console.error("Error resetting user quiz data:", error);
      throw error;
    }
  },

  // Reset quiz completions untuk semua non-admin user (mass reset)
  resetAllUserQuizData: async () => {
    try {
      const usersSnapshot = await getDocs(collection(db, 'users'));
      const nonAdminUsers = usersSnapshot.docs
        .map(d => ({ id: d.id, ...d.data() }))
        .filter(u => u.role !== 'Admin');

      // Sequential to reduce write contention
      for (const user of nonAdminUsers) {
        await quizService.resetUserQuizData(user.id);
      }

      return true;
    } catch (error) {
      console.error("Error resetting all user quiz data:", error);
      throw error;
    }
  },

  // Subscribe to all quizzes (for admin pages)
  subscribeQuizzes: (callback) => {
    return onSnapshot(collection(db, 'quizzes'), (snapshot) => {
      const quizzes = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      callback(quizzes);
    });
  },

  // Delete a specific quiz completion record
  deleteQuizCompletion: async (userId, quizId) => {
    try {
      const q = query(
        collection(db, 'quizCompletions'),
        where('userId', '==', userId),
        where('quizId', '==', quizId)
      );
      const snapshot = await getDocs(q);

      // Sum scores so we can subtract points from user
      const totalScoreToSubtract = snapshot.docs.reduce((sum, docSnap) => {
        const data = docSnap.data();
        return sum + (Number(data?.score) || 0);
      }, 0);

      // Delete all matching records (should be only one)
      for (const docSnap of snapshot.docs) {
        await deleteDoc(docSnap.ref);
      }

      // Subtract points + decrement quiz completed count from user
      const quizzesCompletedToSubtract = snapshot.docs.length;

      const userRef = doc(db, "users", userId);
      await updateDoc(userRef, {
        totalPoints: increment(-totalScoreToSubtract),
        quizzesCompleted: increment(-quizzesCompletedToSubtract)
      });

      return true;
    } catch (error) {
      console.error("Error deleting quiz completion:", error);
      throw error;
    }
  },

  // Get all quiz completions (admin view)
  getAllQuizCompletions: async () => {
    try {
      const snapshot = await getDocs(collection(db, 'quizCompletions'));
      return snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } catch (error) {
      console.error("Error getting all quiz completions:", error);
      return [];
    }
  }
};
