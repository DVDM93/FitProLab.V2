import React, { useState, useEffect } from 'react';
import { getAllMembers } from '../../services/firestoreService';
import './Subscriptions.css';

const PLANS = [
  {
    key: 'Basic',
    price: '€60',
    period: '/mese',
    color: 'basic',
    features: [
      'Ingresso Open Gym',
      'Max 2 WOD a settimana',
      'Accesso App base',
    ],
    featured: false,
  },
  {
    key: 'Pro',
    price: '€90',
    period: '/mese',
    color: 'pro',
    features: [
      'Ingresso Open Gym illimitato',
      'WOD e Classi illimitate',
      'Classifiche & PR tracking',
      'Sconto 10% Shop',
    ],
    featured: true,
    badge: 'Più Popolare',
  },
  {
    key: 'Trimestrale Pro',
    price: '€250',
    period: '/3 mesi',
    color: 'elite',
    features: [
      'Tutti i benefit Pro',
      'Risparmio di €20 sul trimestre',
      '1 Personal Training incluso',
      'Priorità prenotazione classi',
    ],
    featured: false,
  },
];

export default function Subscriptions() {
  const [planCounts, setPlanCounts] = useState({});
  const [totalActive, setTotalActive] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadCounts() {
      try {
        // Fetch all members once, count per plan in JS — no composite index needed
        const allMembers = await getAllMembers();
        const activeMembers = allMembers.filter((m) => m.status === 'Attivo');
        const counts = {};
        PLANS.forEach((plan) => {
          counts[plan.key] = activeMembers.filter((m) => m.plan === plan.key).length;
        });
        const total = Object.values(counts).reduce((a, b) => a + b, 0);
        setPlanCounts(counts);
        setTotalActive(total);
      } catch (err) {
        console.error('Errore caricamento piani:', err);
      } finally {
        setLoading(false);
      }
    }
    loadCounts();
  }, []);

  const revenue = {
    Basic: (planCounts['Basic'] || 0) * 60,
    Pro: (planCounts['Pro'] || 0) * 90,
    'Trimestrale Pro': Math.round((planCounts['Trimestrale Pro'] || 0) * (250 / 3)),
  };

  const totalRevenue = Object.values(revenue).reduce((a, b) => a + b, 0);

  return (
    <div className="subscriptions-container">
      <div className="subscriptions-header">
        <div>
          <h1 className="title">Gestione Abbonamenti</h1>
          <p className="subtitle">
            {loading
              ? 'Caricamento dati...'
              : `${totalActive ?? '—'} membri attivi · Fatturato mensile stimato: €${totalRevenue.toLocaleString('it-IT')}`}
          </p>
        </div>
        <button className="stripe-btn">
          <span className="stripe-icon">S</span> Connetti Stripe
        </button>
      </div>

      {/* Revenue summary */}
      <div className="revenue-bar">
        {PLANS.map((plan) => {
          const count = planCounts[plan.key] || 0;
          const pct = totalActive ? Math.round((count / totalActive) * 100) : 0;
          return (
            <div key={plan.key} className={`revenue-segment segment-${plan.color}`} style={{ flex: pct || 1 }}>
              <span className="segment-label">{plan.key}</span>
              <span className="segment-count">{loading ? '—' : count}</span>
            </div>
          );
        })}
      </div>

      {/* Plan cards */}
      <div className="plans-grid">
        {PLANS.map((plan) => {
          const count = planCounts[plan.key];
          const pct = totalActive ? Math.round(((planCounts[plan.key] || 0) / totalActive) * 100) : 0;
          return (
            <div key={plan.key} className={`plan-card ${plan.featured ? 'featured' : ''}`}>
              {plan.badge && <div className="featured-badge">{plan.badge}</div>}

              <div className={`plan-header ${plan.color}`}>
                <h3>{plan.key}</h3>
                <div className="price">
                  {plan.price}<span>{plan.period}</span>
                </div>
                <div className="plan-members-stat">
                  {loading ? (
                    <span className="skeleton-pill" />
                  ) : (
                    <>
                      <span className="member-count">{count ?? '—'}</span>
                      <span className="member-label">iscritti attivi</span>
                      {totalActive > 0 && (
                        <span className="member-pct">{pct}%</span>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="plan-body">
                <ul>
                  {plan.features.map((f) => (
                    <li key={f}>{f}</li>
                  ))}
                </ul>
                <div className="plan-revenue">
                  <span className="revenue-label">Ricavo mensile stimato</span>
                  <span className="revenue-value">
                    {loading ? '—' : `€${revenue[plan.key].toLocaleString('it-IT')}`}
                  </span>
                </div>
                <button className={plan.featured ? 'primary-btn max-w mt-4' : 'secondary-btn max-w mt-4'}>
                  Modifica Piano
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
