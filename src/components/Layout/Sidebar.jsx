import React, { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Sidebar.css';
import logo from '../../assets/logo.png';

export default function Sidebar({ view, setView }) {
  const location = useLocation();

  const handleSwitchView = (newView) => {
    setView(newView);
  };

  const isActive = (path) => {
    return location.pathname === path ? 'active' : '';
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <img src={logo} alt="Fit Pro Lab Logo" className="logo-image" />
      </div>
      
      <nav className="sidebar-nav">
        <div className="nav-section">
          <p className="nav-label">Cambia Vista</p>
          <button 
            className={`nav-btn ${view === 'admin' ? 'active' : ''}`}
            onClick={() => handleSwitchView('admin')}
          >
            Dashboard Admin
          </button>
          <button 
            className={`nav-btn ${view === 'member' ? 'active' : ''}`}
            onClick={() => handleSwitchView('member')}
          >
            App Membri
          </button>
        </div>

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
        <button className="secondary logout-btn">Esci</button>
      </div>
    </aside>
  );
}
