import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { getTodayNewBookingsCount } from '../../services/firestoreService';
import './Topbar.css';

export default function Topbar({ view, onMenuToggle }) {
  const { currentUser, userRole, userData, logout } = useAuth();
  const navigate = useNavigate();
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);
  const dropdownRef = useRef(null);

  const displayName = userData?.name || currentUser?.email || (view === 'admin' ? 'Admin' : 'Membro');
  const firstLetter = displayName.charAt(0).toUpperCase();
  const planLabel = userData?.plan || null;

  // Load notification count (today's bookings for admin)
  useEffect(() => {
    if (userRole !== 'admin') return;
    getTodayNewBookingsCount()
      .then(setNotifCount)
      .catch(() => setNotifCount(0));
  }, [userRole]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setProfileOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  async function handleLogout() {
    try {
      await logout();
      navigate('/login');
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <header className="topbar">
      <div className="topbar-left">
        {/* Hamburger — only visible on mobile */}
        <button
          className="hamburger-btn"
          onClick={onMenuToggle}
          aria-label="Apri menu"
        >
          <span /><span /><span />
        </button>

        <div className="topbar-search">
          <span className="search-icon">🔍</span>
          <input type="text" placeholder="Cerca membri, corsi..." />
        </div>
      </div>

      <div className="topbar-actions">
        {/* Notification bell */}
        <div className="notification-bell" title={`${notifCount} prenotazioni oggi`}>
          {notifCount > 0 && <span className="badge">{notifCount > 9 ? '9+' : notifCount}</span>}
          🔔
        </div>

        {/* Profile dropdown */}
        <div className="user-profile" ref={dropdownRef} onClick={() => setProfileOpen(!profileOpen)}>
          <div className="avatar">{firstLetter}</div>
          <div className="user-info hide-mobile">
            <span className="user-name">{displayName}</span>
            <span className="user-role">
              {userRole === 'admin' ? 'Amministratore' : planLabel ? `Piano ${planLabel}` : 'Membro'}
            </span>
          </div>
          <span className="dropdown-arrow hide-mobile">{profileOpen ? '▲' : '▼'}</span>

          {profileOpen && (
            <div className="profile-dropdown">
              <div className="dropdown-header">
                <div className="dropdown-avatar">{firstLetter}</div>
                <div>
                  <p className="dropdown-name">{displayName}</p>
                  <p className="dropdown-email">{currentUser?.email}</p>
                </div>
              </div>
              <div className="dropdown-divider" />
              <button className="dropdown-item danger" onClick={handleLogout}>
                🚪 Esci dall'account
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
