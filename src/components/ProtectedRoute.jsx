import React from 'react';
import { Navigate } from 'react-router-dom';

const useAuth = () => {
  const user = JSON.parse(localStorage.getItem('currentUser'));
  return user;
};

export default function ProtectedRoute({ children, allowedRoles }) {
  const user = useAuth();

  const normalizeRole = (role) => {
    if (!role) return '';
    const r = String(role).trim().toLowerCase();

    if (r === 'admin' || r === 'administrator' || r === 'role_admin' || r === 'role:admin') return 'Admin';
    if (r === 'user' || r === 'student' || r === 'mahasiswa' || r === 'role_user' || r === 'role:user') return 'User';

    if (r.includes('admin')) return 'Admin';
    if (r.includes('user') || r.includes('student') || r.includes('mahasiswa')) return 'User';

    if (role === 'Admin' || role === 'User') return role;

    return role;
  };

  const normalizedUserRole = normalizeRole(user?.role);

  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (allowedRoles && !allowedRoles.includes(normalizedUserRole)) {
    if (!normalizedUserRole) return <Navigate to="/login" replace />;

    if (normalizedUserRole === 'Admin') return <Navigate to="/" replace />;
    if (normalizedUserRole === 'User') return <Navigate to="/user-dashboard" replace />;

    return <Navigate to="/login" replace />;
  }

  return children;
}
