import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import './Sidebar.css';
import logo from '../../assets/logo.png';

export default function Sidebar({ view, isOpen, onClose }) {
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

  const isActive = (path) => location.pathname === path ? 'active' : '';
  const startsWith = (path) => location.pathname.startsWith(path) ? 'active' : '';

  return (
    <aside className={`sidebar ${isOpen ? 'sidebar--open' : ''}`}>
      <div className="sidebar-header">
        <img src={logo} alt="Fit Pro Lab Logo" className="sidebar-logo" />
        {/* Close button visible only on mobile */}
        <button className="sidebar-close-btn" onClick={onClose} aria-label="Chiudi menu">✕</button>
      </div>

      <nav className="sidebar-nav">
        {view === 'admin' && (
          <div className="nav-section">
            <p className="nav-label">Menu Admin</p>
            <Link to="/admin" className={`nav-link ${isActive('/admin')}`}>
              <span className="nav-icon">📊</span> Panoramica
            </Link>
            <Link to="/admin/members" className={`nav-link ${startsWith('/admin/members')}`}>
              <span className="nav-icon">👥</span> Lista Membri
            </Link>
            <Link to="/admin/calendar" className={`nav-link ${isActive('/admin/calendar')}`}>
              <span className="nav-icon">📅</span> Corsi & Calendario
            </Link>
            <Link to="/admin/subscriptions" className={`nav-link ${isActive('/admin/subscriptions')}`}>
              <span className="nav-icon">💳</span> Abbonamenti
            </Link>
            <Link to="/admin/communications" className={`nav-link ${isActive('/admin/communications')}`}>
              <span className="nav-icon">📣</span> Comunicazioni
            </Link>
          </div>
        )}

        {view === 'member' && (
          <div className="nav-section">
            <p className="nav-label">Menu Membro</p>
            <Link to="/member" className={`nav-link ${isActive('/member')}`}>
              <span className="nav-icon">🏠</span> La Mia Dashboard
            </Link>
            <Link to="/member/calendar" className={`nav-link ${isActive('/member/calendar')}`}>
              <span className="nav-icon">📅</span> Prenota un Corso
            </Link>
            <Link to="/member/leaderboard" className={`nav-link ${isActive('/member/leaderboard')}`}>
              <span className="nav-icon">🏆</span> Classifica
            </Link>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="secondary logout-btn" onClick={handleLogout}>
          <span>🚪</span> Esci
        </button>
      </div>
    </aside>
  );
}
