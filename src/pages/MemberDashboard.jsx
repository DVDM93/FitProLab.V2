import React from 'react';
import './Dashboard.css';

export default function MemberDashboard() {
  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="title">La Mia Dashboard</h1>
          <p className="subtitle">Pronto a dare il massimo oggi?</p>
        </div>
        <button className="primary-btn">Check-in QR</button>
      </div>

      <div className="content-grid two-cols">
        <div className="card wod-card">
          <h3 className="card-title">Allenamento del Giorno</h3>
          <div className="wod-content">
            <h4>"FRAN"</h4>
            <p className="wod-type">21-15-9 Ripetizioni per Tempo</p>
            <ul>
              <li>Thrusters (43/29 kg)</li>
              <li>Pull-ups</li>
            </ul>
          </div>
          <button className="secondary-btn full-width mt-4">Registra Punteggio</button>
        </div>

        <div className="card schedule-card">
          <h3 className="card-title">Il Mio Prossimo Corso</h3>
          <div className="next-class-box">
            <div className="date-badge">
              <span className="day">OGGI</span>
              <span className="time">18:00</span>
            </div>
            <div className="class-info">
              <h4>CrossFit WOD</h4>
              <p>Fit Pro Lab Sala Principale</p>
            </div>
          </div>
          <div className="actions mt-4">
            <button className="danger-btn full-width">Cancella Prenotazione</button>
            <p className="cancel-rule">Puoi cancellare fino a 2 ore prima.</p>
          </div>
        </div>
      </div>

      <div className="card mt-4">
        <h3 className="card-title">I Miei PR Recenti</h3>
        <div className="pr-list">
          <div className="pr-item">
            <div className="pr-icon">🏋️</div>
            <div className="pr-details">
              <h4>Back Squat</h4>
              <p>120 kg</p>
            </div>
            <div className="pr-date">12 Ott</div>
          </div>
          <div className="pr-item">
            <div className="pr-icon">🏃</div>
            <div className="pr-details">
              <h4>Corsa 5k</h4>
              <p>22:45</p>
            </div>
            <div className="pr-date">05 Ott</div>
          </div>
        </div>
      </div>
    </div>
  );
}
