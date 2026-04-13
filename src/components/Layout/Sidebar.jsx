import React from 'react';
import './Sidebar.css';
import logo from '../../assets/logo.png';

export default function Sidebar({ view, setView }) {
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
            onClick={() => setView('admin')}
          >
            Dashboard Admin
          </button>
          <button 
            className={`nav-btn ${view === 'member' ? 'active' : ''}`}
            onClick={() => setView('member')}
          >
            App Membri
          </button>
        </div>

        {view === 'admin' && (
          <div className="nav-section">
            <p className="nav-label">Menu Admin</p>
            <a href="#" className="nav-link active">Panoramica</a>
            <a href="#" className="nav-link">Membri</a>
            <a href="#" className="nav-link">Corsi & Calendario</a>
            <a href="#" className="nav-link">Abbonamenti</a>
            <a href="#" className="nav-link">Comunicazioni</a>
          </div>
        )}

        {view === 'member' && (
          <div className="nav-section">
            <p className="nav-label">Menu Membro</p>
            <a href="#" className="nav-link active">La Mia Dashboard</a>
            <a href="#" className="nav-link">Prenota un Corso</a>
            <a href="#" className="nav-link">Check-in</a>
            <a href="#" className="nav-link">I Miei PR</a>
            <a href="#" className="nav-link">Classifica</a>
          </div>
        )}
      </nav>

      <div className="sidebar-footer">
        <button className="secondary logout-btn">Esci</button>
      </div>
    </aside>
  );
}
