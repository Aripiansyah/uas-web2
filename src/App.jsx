import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";
import UserLayout from "./layouts/UserLayout";
import Dashboard from "./pages/admin/Dashboard";
import Schedule from "./pages/admin/Schedule";
import Tasks from "./pages/admin/Tasks";
import Users from "./pages/admin/Users";
import StudentQuizzes from "./pages/user/StudentQuizzes";
import ManageQuizzes from "./pages/admin/ManageQuizzes";
import AdminLeaderboard from "./pages/admin/AdminLeaderboard";
import Login from "./pages/Login";
import Registrasi from "./pages/registrasi";
import UserDashboard from "./pages/user/UserDashboard";
import UserSchedule from "./pages/user/UserSchedule";
import UserProfile from "./pages/user/UserProfile";
import UserTaskList from "./pages/user/UserTaskList";
import ResetQuizScores from "./pages/admin/ResetQuizScores";
import ResetScore from "./pages/admin/ResetScore";
import ProtectedRoute from "./components/ProtectedRoute";
import Announcement from "./pages/Announcement";
import Loading from "./components/Loading";

function AppRoutes() {
  const location = useLocation();
  const [navLoading, setNavLoading] = useState(false);

  useEffect(() => {
    // Trigger loading animation on every navigation
    setNavLoading(true);
    const t = window.setTimeout(() => setNavLoading(false), 650);
    return () => window.clearTimeout(t);
  }, [location.pathname, location.search, location.hash]);

  return (
    <>
      <Routes>
        {/* Rute Publik */}
        <Route path="/login" element={<Login />} />
        <Route path="/registrasi" element={<Registrasi />} />

        {/* 🏠 RUTE ADMIN - Dashboard dengan Layout Admin */}
        <Route element={<DashboardLayout />}>
          <Route
            path="/"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Dashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/schedule"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Schedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/tasks"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Tasks />
              </ProtectedRoute>
            }
          />
          <Route
            path="/users"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <Users />
              </ProtectedRoute>
            }
          />
          <Route
            path="/manage-quizzes"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <ManageQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin-leaderboard"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <AdminLeaderboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/reset-quiz-scores"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <ResetQuizScores />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/reset-score"
            element={
              <ProtectedRoute allowedRoles={["Admin"]}>
                <ResetScore />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* 👨‍🎓 RUTE USER - Dashboard dengan Layout User */}
        <Route element={<UserLayout />}>
          <Route
            path="/user-dashboard"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <UserDashboard />
              </ProtectedRoute>
            }
          />

          <Route
            path="/announcements"
            element={
              <ProtectedRoute allowedRoles={["Admin", "User"]}>
                <Announcement />
              </ProtectedRoute>
            }
          />

          <Route
            path="/user-schedule"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <UserSchedule />
              </ProtectedRoute>
            }
          />
          <Route
            path="/student-quizzes"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <StudentQuizzes />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-profile"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <UserProfile />
              </ProtectedRoute>
            }
          />
          <Route
            path="/user-task-list"
            element={
              <ProtectedRoute allowedRoles={["User"]}>
                <UserTaskList />
              </ProtectedRoute>
            }
          />
        </Route>

        {/* Default Route redirection */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      {navLoading && (
        <div className="fixed inset-0 z-[9999] bg-transparent flex items-center justify-center">
          <div className="rounded-2xl px-6 py-4 bg-transparent border border-transparent shadow-none">
            <Loading />
          </div>
        </div>
      )}
    </>
  );
}

export default function App() {
  return (
    <Router>
      <AppRoutes />
    </Router>
  );
}
