import React from 'react';
import './Topbar.css';

export default function Topbar({ view }) {
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
            {view === 'admin' ? 'A' : 'M'}
          </div>
          <div className="user-info">
            <span className="user-name">{view === 'admin' ? 'Utente Admin' : 'Mario Rossi'}</span>
            <span className="user-role">{view === 'admin' ? 'Proprietario' : 'Membro Pro'}</span>
          </div>
        </div>
      </div>
    </header>
  );
}
