import React from 'react';
import './Subscriptions.css';

export default function Subscriptions() {
  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <div>
          <h1 className="title">Gestione Abbonamenti</h1>
          <p className="subtitle">Configura i piani e integra Stripe per i pagamenti automatici.</p>
        </div>
        <button className="stripe-btn">
          <span className="stripe-icon">S</span> Connetti Stripe
        </button>
      </div>

      <div className="plans-grid">
        <div className="plan-card">
          <div className="plan-header basic">
            <h3>Basic</h3>
            <div className="price">€60<span>/mese</span></div>
          </div>
          <div className="plan-body">
            <ul>
              <li>Ingresso Open Gym</li>
              <li>Max 2 WOD a settimana</li>
              <li>Accesso App base</li>
            </ul>
            <button className="secondary-btn max-w mt-4">Modifica Piano</button>
          </div>
        </div>

        <div className="plan-card featured">
          <div className="featured-badge">Più Popolare</div>
          <div className="plan-header pro">
            <h3>Pro</h3>
            <div className="price">€90<span>/mese</span></div>
          </div>
          <div className="plan-body">
            <ul>
              <li>Ingresso Open Gym Illimitato</li>
              <li>WOD e Classi illimitate</li>
              <li>Accesso App Premium (Classifiche)</li>
              <li>Sconto 10% Shop</li>
            </ul>
            <button className="primary-btn max-w mt-4">Modifica Piano</button>
          </div>
        </div>
        
        <div className="plan-card">
          <div className="plan-header elite">
            <h3>Trimestrale Pro</h3>
            <div className="price">€250<span>/3 mesi</span></div>
          </div>
          <div className="plan-body">
            <ul>
              <li>Tutti i benefit Pro</li>
              <li>Risparmio di 20€ sul trimestre</li>
              <li>1 Personal Training incluso</li>
            </ul>
            <button className="secondary-btn max-w mt-4">Modifica Piano</button>
          </div>
        </div>
      </div>
    </div>
  );
}
