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
        <Route path="/login" element={<Login />} />
        
        {/* Protected layout routes */}
        <Route 
          path="/*" 
          element={
            <ProtectedRoute>
              {/* the Layout now automatically needs to know the userRole from auth */}
              <Layout view={userRole} />
            </ProtectedRoute>
          }
        >
          {/* Admin Routes */}
          <Route 
            path="admin" 
            element={
              <ProtectedRoute allowedRoles={['admin']}>
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="admin/members" 
            element={<ProtectedRoute allowedRoles={['admin']}><MembersList /></ProtectedRoute>} 
          />
          <Route 
            path="admin/members/:id" 
            element={<ProtectedRoute allowedRoles={['admin']}><MemberDetail /></ProtectedRoute>} 
          />
          <Route 
            path="admin/calendar" 
            element={<ProtectedRoute allowedRoles={['admin']}><Calendar role="admin" /></ProtectedRoute>} 
          />
          <Route 
            path="admin/subscriptions" 
            element={<ProtectedRoute allowedRoles={['admin']}><Subscriptions /></ProtectedRoute>} 
          />
          <Route 
            path="admin/communications" 
            element={<ProtectedRoute allowedRoles={['admin']}><Communications /></ProtectedRoute>} 
          />
          
          {/* Member Routes */}
          <Route 
            path="member" 
            element={
              <ProtectedRoute allowedRoles={['member']}>
                <MemberDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="member/calendar" 
            element={<ProtectedRoute allowedRoles={['member']}><Calendar role="member" /></ProtectedRoute>} 
          />
          <Route 
            path="member/leaderboard" 
            element={<ProtectedRoute allowedRoles={['member']}><Leaderboard /></ProtectedRoute>} 
          />

          {/* Fallback route: redirect to correct dashboard based on role */}
          <Route path="*" element={
            <Navigate to={userRole === 'admin' ? '/admin' : '/member'} replace />
          } />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;

