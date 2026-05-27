import React from 'react';
import { Navigate } from 'react-router-dom';

// Ganti ini dengan cara Anda mengambil data user yang sedang login saat ini (misal dari Context / Auth State)
// Di sini kita simulasikan dummy state untuk contoh logic-nya
const useAuth = () => {
  // Ambil data user dari localStorage atau state management Anda
  const user = JSON.parse(localStorage.getItem('currentUser')); 
  return user; // mengembalikan objek { name, role, ... } atau null
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = useAuth();

  const normalizeRole = (role) => {
    if (!role) return '';
    const r = String(role).trim().toLowerCase();

    // Exact/known tokens
    if (r === 'admin' || r === 'administrator' || r === 'role_admin' || r === 'role:admin') return 'Admin';
    if (r === 'user' || r === 'student' || r === 'mahasiswa' || r === 'role_user' || r === 'role:user') return 'User';

    // Fuzzy matching for cases like: "Administrator Utama", "admin utama", etc.
    if (r.includes('admin')) return 'Admin';
    if (r.includes('user') || r.includes('student') || r.includes('mahasiswa')) return 'User';

    // If already in expected casing, keep it
    if (role === 'Admin' || role === 'User') return role;

    return role;
  };

  const normalizedUserRole = normalizeRole(user?.role);

  // 1. Jika belum login sama sekali, tendang ke halaman login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // 2. Jika sudah login tapi role-nya tidak diizinkan mengakses halaman ini
  if (allowedRoles && !allowedRoles.includes(normalizedUserRole)) {
    // Kalau role tidak bisa dinormalisasi dengan benar, hindari redirect loop
    if (!normalizedUserRole) return <Navigate to="/login" replace />;

    // Redirect berdasarkan role yang sudah dinormalisasi
    if (normalizedUserRole === 'Admin') return <Navigate to="/" replace />;
    if (normalizedUserRole === 'User') return <Navigate to="/user-dashboard" replace />;

    // Fallback aman
    return <Navigate to="/login" replace />;
  }

  // 3. Jika lolos semua pengecekan, tampilkan halamannya
  return children;
}
