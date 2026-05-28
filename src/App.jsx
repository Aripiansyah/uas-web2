import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import UserLayout from './layouts/UserLayout';
import Dashboard from './pages/Dashboard';
import Schedule from './pages/Schedule';
import Tasks from './pages/Tasks';
import Users from './pages/Users';
import StudentQuizzes from './pages/StudentQuizzes';
import ManageQuizzes from './pages/ManageQuizzes';
import AdminLeaderboard from './pages/AdminLeaderboard';
import Login from './pages/Login';
import UserDashboard from './pages/UserDashboard';
import UserSchedule from './pages/UserSchedule';
import UserProfile from './pages/UserProfile';
import UserTaskList from './pages/UserTaskList';
import ResetQuizScores from './pages/ResetQuizScores';
import ResetScore from './pages/admin/ResetScore';
import ProtectedRoute from './components/ProtectedRoute';
import Announcement from './pages/Announcement';


export default function App() {
  return (
    <Router>
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />

        {/* 🏠 RUTE ADMIN - Dashboard dengan Layout Admin */}
        <Route element={<DashboardLayout />}>
          <Route path="/" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Dashboard />
            </ProtectedRoute>
          } />
          <Route path="/schedule" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Schedule />
            </ProtectedRoute>
          } />
          <Route path="/tasks" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Tasks />
            </ProtectedRoute>
          } />
          <Route path="/users" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <Users />
            </ProtectedRoute>
          } />
          <Route path="/manage-quizzes" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ManageQuizzes />
            </ProtectedRoute>
          } />
          <Route path="/admin-leaderboard" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <AdminLeaderboard />
            </ProtectedRoute>
          } />
          <Route path="/reset-quiz-scores" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ResetQuizScores />
            </ProtectedRoute>
          } />
          <Route path="/admin/reset-score" element={
            <ProtectedRoute allowedRoles={['Admin']}>
              <ResetScore />
            </ProtectedRoute>
          } />
        </Route>

        {/* 👨‍🎓 RUTE USER - Dashboard dengan Layout User */}
        <Route element={<UserLayout />}>
          <Route path="/user-dashboard" element={
            <ProtectedRoute allowedRoles={['User']}>
              <UserDashboard />
            </ProtectedRoute>
          } />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute allowedRoles={['Admin', 'User']}>
                <Announcement />
              </ProtectedRoute>
            }
          />

          <Route path="/user-schedule" element={
            <ProtectedRoute allowedRoles={['User']}>
              <UserSchedule />
            </ProtectedRoute>
          } />
          <Route path="/student-quizzes" element={
            <ProtectedRoute allowedRoles={['User']}>
              <StudentQuizzes />
            </ProtectedRoute>
          } />
          <Route path="/user-profile" element={
            <ProtectedRoute allowedRoles={['User']}>
              <UserProfile />
            </ProtectedRoute>
          } />
          <Route path="/user-task-list" element={
            <ProtectedRoute allowedRoles={['User']}>
              <UserTaskList />
            </ProtectedRoute>
          } />
        </Route>

        {/* Default Route redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Router>
  );
}
