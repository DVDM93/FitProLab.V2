import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import './Topbar.css';

export default function Topbar({ view }) {
  const { currentUser, userRole } = useAuth();
  
  // Extract first letter for avatar or fallback
  const firstLetter = currentUser?.email ? currentUser.email.charAt(0).toUpperCase() : (view === 'admin' ? 'A' : 'M');
  const displayName = currentUser?.displayName || currentUser?.email || (view === 'admin' ? 'Utente Admin' : 'Membro');

  return (
    <header className="topbar">
      <div className="topbar-search">
        <input type="text" placeholder="Cerca membri, corsi..." />
      </div>
      <div className="topbar-actions">
        <div className="notification-bell">
          <span className="badge">3</span>
          🔔
        </div>
        <div className="user-profile">
          <div className="avatar">
            {firstLetter}
          </div>
          <div className="user-info">
            <span className="user-name">{displayName}</span>
            <span className="user-role">{userRole === 'admin' ? 'Amministratore' : 'Utente'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
