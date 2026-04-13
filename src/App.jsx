import React, { useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout/Layout';
import AdminDashboard from './pages/AdminDashboard';
import MemberDashboard from './pages/MemberDashboard';
import MembersList from './pages/Admin/MembersList';
import Calendar from './pages/Shared/Calendar';

import MemberDetail from './pages/Admin/MemberDetail';
import Communications from './pages/Admin/Communications';
import Subscriptions from './pages/Admin/Subscriptions';
import Leaderboard from './pages/Member/Leaderboard';

function App() {
  const [view, setView] = useState('admin'); // Mock Auth view toggle

  return (
    <BrowserRouter>
      <Layout view={view} setView={setView}>
        <Routes>
          {view === 'admin' ? (
            <>
              <Route path="/" element={<Navigate to="/admin" replace />} />
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/members" element={<MembersList />} />
              <Route path="/admin/members/:id" element={<MemberDetail />} />
              <Route path="/admin/calendar" element={<Calendar role="admin" />} />
              <Route path="/admin/subscriptions" element={<Subscriptions />} />
              <Route path="/admin/communications" element={<Communications />} />
              <Route path="*" element={<Navigate to="/admin" replace />} />
            </>
          ) : (
            <>
              <Route path="/" element={<Navigate to="/member" replace />} />
              <Route path="/member" element={<MemberDashboard />} />
              <Route path="/member/calendar" element={<Calendar role="member" />} />
              <Route path="/member/leaderboard" element={<Leaderboard />} />
              <Route path="*" element={<Navigate to="/member" replace />} />
            </>
          )}
        </Routes>
      </Layout>
    </BrowserRouter>
  );
}

export default App;
