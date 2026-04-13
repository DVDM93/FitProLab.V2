import React from 'react';
import { useParams, Link } from 'react-router-dom';
import './MemberDetail.css';

export default function MemberDetail() {
  const { id } = useParams();

  return (
    <div className="member-detail-container">
      <div className="detail-header">
        <Link to="/admin/members" className="back-link">← Torna alla Lista</Link>
        <div className="header-actions">
          <button className="secondary-btn">Invia Messaggio</button>
          <button className="primary-btn">Modifica Profilo</button>
        </div>
      </div>

      <div className="profile-top-section card">
        <div className="profile-info">
          <div className="profile-avatar">
            <span className="avatar-placeholder">MR</span>
          </div>
          <div className="profile-text">
            <h2>Mario Rossi</h2>
            <p className="text-muted">ID: {id} • Iscritto dal 12 Gen 2026</p>
            <div className="contact-info">
              <span>📧 mario.r@test.com</span>
              <span>📱 +39 333 1234567</span>
            </div>
          </div>
        </div>
        <div className="profile-status">
          <div className="status-box active">
            <span className="status-label">Stato</span>
            <span className="status-val">Attivo</span>
          </div>
        </div>
      </div>

      <div className="detail-grid">
        <div className="card subscription-card">
          <h3 className="card-title">Abbonamento Corrente (Stripe)</h3>
          <div className="sub-details">
            <div className="sub-row">
              <span className="text-muted">Piano</span>
              <strong>Pro Mensile (€90/mese)</strong>
            </div>
            <div className="sub-row">
              <span className="text-muted">Metodo</span>
              <span>💳 Visa terminante con 4242</span>
            </div>
            <div className="sub-row">
              <span className="text-muted">Prossimo Rinnovo</span>
              <strong>12 Mag 2026</strong>
            </div>
          </div>
          <div className="sub-actions">
            <button className="primary-btn max-w">Aggiorna Piano</button>
            <button className="danger-btn full-width mt-4">Cancella Abbonamento</button>
          </div>
        </div>

        <div className="card history-card">
          <h3 className="card-title">Storico e Performance Box</h3>
          <div className="stats-row">
            <div className="mini-stat">
              <span className="value">14</span>
              <span className="label">WOD Mese</span>
            </div>
            <div className="mini-stat">
              <span className="value">3</span>
              <span className="label">Nuovi PR</span>
            </div>
          </div>
          
          <h4 className="mt-4 mb-2">Ultimi Corsi</h4>
          <ul className="activity-list">
            <li>
              <span className="dot orange"></span>
              <p>CrossFit WOD (Coach Matt)</p>
              <span className="time">Ieri</span>
            </li>
            <li>
              <span className="dot orange"></span>
              <p>Weightlifting (Coach Sarah)</p>
              <span className="time">3 gg fa</span>
            </li>
            <li>
              <span className="dot gray"></span>
              <p className="text-muted">Cancellato: Open Gym</p>
              <span className="time">5 gg fa</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
