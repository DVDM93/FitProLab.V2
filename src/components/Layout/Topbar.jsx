import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Topbar.css';

export default function Topbar({ view }) {
  const { currentUser, userRole, userData } = useAuth();

  const displayName = userData?.name || currentUser?.email || (view === 'admin' ? 'Admin' : 'Membro');
  const firstLetter = displayName.charAt(0).toUpperCase();
  const planLabel = userData?.plan || null;

  return (
    <header className="topbar">
      <div className="topbar-search">
        <span className="search-icon">🔍</span>
        <input type="text" placeholder="Cerca membri, corsi..." />
      </div>
      <div className="topbar-actions">
        <div className="notification-bell" title="Notifiche">
          <span className="badge">3</span>
          🔔
        </div>
        <div className="user-profile">
          <div className="avatar">{firstLetter}</div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">
              {userRole === 'admin' ? 'Amministratore' : planLabel ? `Piano ${planLabel}` : 'Membro'}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
}
