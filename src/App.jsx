import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';
import Layout from './components/Layout/Layout';
import ProtectedRoute from './components/ProtectedRoute';

import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MembersList from './pages/Admin/MembersList';
import Calendar from './pages/Shared/Calendar';
import MemberDetail from './pages/Admin/MemberDetail';
import Communications from './pages/Admin/Communications';
import Subscriptions from './pages/Admin/Subscriptions';
import Leaderboard from './pages/Member/Leaderboard';

function App() {
  const { currentUser, userRole } = useAuth();

  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<Login />} />

        {/* Admin Layout — protetto, solo admin */}
        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <Layout view="admin" />
            </ProtectedRoute>
          }
        >
          <Route index element={<AdminDashboard />} />
          <Route path="members" element={<MembersList />} />
          <Route path="members/:id" element={<MemberDetail />} />
          <Route path="calendar" element={<Calendar role="admin" />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="communications" element={<Communications />} />
        </Route>

        {/* Member Layout — protetto, solo member */}
        <Route
          path="/member"
          element={
            <ProtectedRoute allowedRoles={['member']}>
              <Layout view="member" />
            </ProtectedRoute>
          }
        >
          <Route index element={<MemberDashboard />} />
          <Route path="calendar" element={<Calendar role="member" />} />
          <Route path="leaderboard" element={<Leaderboard />} />
        </Route>

        {/* Root redirect basato su ruolo */}
        <Route
          path="/"
          element={
            currentUser
              ? <Navigate to={userRole === 'admin' ? '/admin' : '/member'} replace />
              : <Navigate to="/login" replace />
          }
        />

        {/* Catch-all */}
        <Route
          path="*"
          element={
            currentUser
              ? <Navigate to={userRole === 'admin' ? '/admin' : '/member'} replace />
              : <Navigate to="/login" replace />
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
