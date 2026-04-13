import React from 'react';
import './Dashboard.css';

export default function AdminDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="title">Panoramica</h1>
          <p className="subtitle">Bentornato nella dashboard di Fit Pro Lab.</p>
        </div>
        <button className="primary-btn">+ Nuovo Membro</button>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <h3 className="stat-label">Membri Attivi Totali</h3>
          <p className="stat-value">248</p>
          <span className="stat-trend positive">↑ 12% questo mese</span>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Fatturato Mensile</h3>
          <p className="stat-value">€ 14.200</p>
          <span className="stat-trend positive">↑ 5% questo mese</span>
        </div>
        <div className="stat-card">
          <h3 className="stat-label">Check-in di Oggi</h3>
          <p className="stat-value">84</p>
        </div>
        <div className="stat-card alert">
          <h3 className="stat-label">Rischio Abbandono</h3>
          <p className="stat-value">12</p>
          <span className="stat-trend negative">membri inattivi &gt; 14 giorni</span>
        </div>
      </div>

      <div className="content-grid two-cols">
        <div className="card">
          <h3 className="card-title">Capacità WOD di Oggi</h3>
          <div className="class-list">
            <div className="class-item">
              <div className="class-time">07:00 AM</div>
              <div className="class-details">
                <h4>CrossFit WOD</h4>
                <p>Coach Matt</p>
              </div>
              <div className="class-capacity full">20/20</div>
            </div>
            <div className="class-item">
              <div className="class-time">13:00 PM</div>
              <div className="class-details">
                <h4>Weightlifting</h4>
                <p>Coach Sarah</p>
              </div>
              <div className="class-capacity almost-full">18/20</div>
            </div>
            <div className="class-item">
              <div className="class-time">18:00 PM</div>
              <div className="class-details">
                <h4>CrossFit WOD</h4>
                <p>Coach Matt</p>
              </div>
              <div className="class-capacity">12/20</div>
            </div>
          </div>
        </div>

        <div className="card">
          <h3 className="card-title">Attività Recenti</h3>
          <ul className="activity-list">
            <li>
              <span className="dot magenta"></span>
              <p><strong>Marco R.</strong> ha rinnovato l'Abbonamento Pro.</p>
              <span className="time">10 min fa</span>
            </li>
            <li>
              <span className="dot orange"></span>
              <p><strong>Elisa B.</strong> ha prenotato il WOD delle 18:00.</p>
              <span className="time">25 min fa</span>
            </li>
            <li>
              <span className="dot gray"></span>
              <p><strong>Luca M.</strong> ha cancellato il WOD delle 13:00.</p>
              <span className="time">1 ora fa</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
