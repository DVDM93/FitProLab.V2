import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';
import logo from '../../assets/logo.png';

export default function Sidebar({ view }) {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error('Failed to log out', err);
    }
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Fit Pro Lab Logo" className="sidebar-logo" />
      </div>
      
      <nav className="sidebar-nav">
        {view === 'admin' && (
          <div className="nav-section">
            <p className="nav-label">Menu Admin</p>
            <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>Panoramica</Link>
            <Link to="/admin/members" className={`nav-link ${location.pathname.startsWith('/admin/members') ? 'active' : ''}`}>Lista Membri</Link>
            <Link to="/admin/calendar" className={`nav-link ${isActive('/admin/calendar')}`}>Corsi & Calendario</Link>
            <Link to="/admin/subscriptions" className={`nav-link ${isActive('/admin/subscriptions')}`}>Abbonamenti (Stripe)</Link>
            <Link to="/admin/communications" className={`nav-link ${isActive('/admin/communications')}`}>Comunicazioni</Link>
          </div>
        )}

        {view === 'member' && (
          <div className="nav-section">
            <p className="nav-label">Menu Membro</p>
            <Link to="/member" className={`nav-link ${isActive('/member')}`}>La Mia Dashboard</Link>
            <Link to="/member/calendar" className={`nav-link ${isActive('/member/calendar')}`}>Prenota un Corso</Link>
            <a href="#" className="nav-link">Check-in</a>
            <a href="#" className="nav-link">I Miei PR</a>
            <Link to="/member/leaderboard" className={`nav-link ${isActive('/member/leaderboard')}`}>Classifica</Link>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="secondary logout-btn" onClick={handleLogout}>Esci</button>
      </div>
    </aside>
  );
}
