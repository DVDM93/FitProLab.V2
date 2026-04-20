import React, { useState, useEffect } from 'react';
import { getAllMembers, updateMember } from '../../services/firestoreService';
import './Subscriptions.css';

// ─── Piano definitions ───────────────────────────────────────────────────────
// priceMonthly is used for revenue estimates (12-pack and daily are approximated)
const PLANS_DEF = [
  {
    key: 'Basic',
    label: 'Basic',
    price: '€50',
    period: '/mese',
    priceMonthly: 50,
    color: 'basic',
    icon: '🥉',
    features: [
      '3 classi a settimana',
      'Accesso App',
      'Leaderboard & PR tracking',
    ],
  },
  {
    key: 'Pro',
    label: 'Pro',
    price: '€60',
    period: '/mese',
    priceMonthly: 60,
    color: 'pro',
    icon: '🥇',
    features: [
      '5 classi a settimana',
      'Accesso App completo',
      'Leaderboard & PR tracking',
      'Priorità prenotazione',
    ],
  },
  {
    key: 'Competitor',
    label: 'Competitor',
    price: '€60',
    period: '/mese',
    priceMonthly: 60,
    color: 'competitor',
    icon: '🏆',
    features: [
      'Classi illimitate',
      'Calendario competizioni',
      'Coaching specializzato',
      'PR tracking avanzato',
    ],
  },
  {
    key: 'Open Gym',
    label: 'Open Gym',
    price: '€50',
    period: '/mese',
    priceMonthly: 50,
    color: 'opengym',
    icon: '🏋️',
    features: [
      'Accesso libero alla palestra',
      'Nessuna prenotazione richiesta',
      'Spogliatoi & docce',
    ],
  },
  {
    key: 'Pacchetto 12',
    label: 'Pacchetto 12 Lezioni',
    price: '€55',
    period: '/pacchetto',
    priceMonthly: 55,   // per-pack; shown as revenue when active
    color: 'pack12',
    icon: '🎟️',
    features: [
      '12 lezioni prepagata',
      'Valido 6 mesi',
      'Nessun rinnovo automatico',
    ],
  },
  {
    key: 'Giornaliero',
    label: 'Ingresso Giornaliero',
    price: '€8',
    period: '/giorno',
    priceMonthly: 8,    // single entry
    color: 'daily',
    icon: '🎫',
    features: [
      'Accesso singolo',
      'Una classe a scelta',
      'Nessun abbonamento richiesto',
    ],
  },
];

// ─── Edit Modal ──────────────────────────────────────────────────────────────
function EditPlanModal({ plan, onClose, onSave }) {
  const [label, setLabel]    = useState(plan.label);
  const [price, setPrice]    = useState(plan.price.replace('€', ''));
  const [period, setPeriod]  = useState(plan.period);
  const [feats, setFeats]    = useState(plan.features.join('\n'));
  const [saving, setSaving]  = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    setSaving(true);
    // In a real app you'd persist to Firestore; here we just update local state
    const updated = {
      ...plan,
      label,
      price: `€${price}`,
      period,
      priceMonthly: parseFloat(price) || plan.priceMonthly,
      features: feats.split('\n').map((f) => f.trim()).filter(Boolean),
    };
    await new Promise((r) => setTimeout(r, 400)); // simulate async
    setSaving(false);
    onSave(updated);
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="modal-title">Modifica Piano — {plan.icon} {plan.label}</h2>
          <button className="modal-close" onClick={onClose}>✕</button>
        </div>
        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-row">
            <div className="form-field">
              <label>Nome piano</label>
              <input value={label} onChange={(e) => setLabel(e.target.value)} required />
            </div>
            <div className="form-field">
              <label>Prezzo (€)</label>
              <input
                type="number"
                min="0"
                step="0.5"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                required
              />
            </div>
            <div className="form-field">
              <label>Periodo</label>
              <select value={period} onChange={(e) => setPeriod(e.target.value)}>
                <option value="/mese">/mese</option>
                <option value="/pacchetto">/pacchetto</option>
                <option value="/giorno">/giorno</option>
                <option value="/3 mesi">/3 mesi</option>
              </select>
            </div>
          </div>
          <div className="form-field">
            <label>Caratteristiche (una per riga)</label>
            <textarea
              rows={5}
              value={feats}
              onChange={(e) => setFeats(e.target.value)}
            />
          </div>
          <div className="modal-actions">
            <button type="button" className="secondary" onClick={onClose}>Annulla</button>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Salvataggio...' : '💾 Salva Modifiche'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────
export default function Subscriptions() {
  const [plans, setPlans]           = useState(PLANS_DEF);
  const [planCounts, setPlanCounts] = useState({});
  const [totalActive, setTotalActive] = useState(null);
  const [loading, setLoading]       = useState(true);
  const [editing, setEditing]       = useState(null);   // plan being edited
  const [toast, setToast]           = useState(null);

  useEffect(() => {
    async function loadCounts() {
      try {
        const allMembers = await getAllMembers();
        const activeMembers = allMembers.filter((m) => m.status === 'Attivo');
        const counts = {};
        plans.forEach((plan) => {
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
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Compute most popular plan key (highest subscriber count)
  const mostPopularKey = React.useMemo(() => {
    if (loading || !totalActive) return null;
    let best = null;
    let bestCount = -1;
    plans.forEach((p) => {
      const c = planCounts[p.key] || 0;
      if (c > bestCount) { bestCount = c; best = p.key; }
    });
    return bestCount > 0 ? best : null;
  }, [loading, totalActive, planCounts, plans]);

  // Monthly revenue estimate per plan
  function planRevenue(plan) {
    return (planCounts[plan.key] || 0) * plan.priceMonthly;
  }
  const totalRevenue = plans.reduce((sum, p) => sum + planRevenue(p), 0);

  function showToast(msg) {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  }

  function handleSave(updated) {
    setPlans((prev) => prev.map((p) => (p.key === updated.key ? updated : p)));
    setEditing(null);
    showToast(`Piano "${updated.label}" aggiornato ✅`);
  }

  // Colors for the distribution bar (extend for 6 plans)
  const segmentColors = {
    basic:      'rgba(255,255,255,0.08)',
    pro:        'rgba(255, 94, 0, 0.30)',
    competitor: 'rgba(255, 200, 0, 0.25)',
    opengym:    'rgba(0, 204, 102, 0.20)',
    pack12:     'rgba(100, 180, 255, 0.25)',
    daily:      'rgba(168, 85, 247, 0.20)',
  };
  const segmentBorders = {
    basic:      'transparent',
    pro:        'rgba(255,94,0,0.4)',
    competitor: 'rgba(255,200,0,0.4)',
    opengym:    'rgba(0,204,102,0.35)',
    pack12:     'rgba(100,180,255,0.35)',
    daily:      'rgba(168,85,247,0.35)',
  };
  const headerGradients = {
    basic:      'rgba(255,255,255,0.03)',
    pro:        'rgba(255,94,0,0.10)',
    competitor: 'rgba(255,200,0,0.10)',
    opengym:    'rgba(0,204,102,0.08)',
    pack12:     'rgba(100,180,255,0.10)',
    daily:      'rgba(168,85,247,0.10)',
  };

  return (
    <div className="subscriptions-container">
      {/* Toast */}
      {toast && <div className="sub-toast">{toast}</div>}

      {/* Edit Modal */}
      {editing && (
        <EditPlanModal
          plan={editing}
          onClose={() => setEditing(null)}
          onSave={handleSave}
        />
      )}

      {/* Header */}
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

      {/* Distribution bar */}
      <div className="revenue-bar">
        {plans.map((plan) => {
          const count = planCounts[plan.key] || 0;
          const pct = totalActive ? Math.round((count / totalActive) * 100) : 0;
          return (
            <div
              key={plan.key}
              className="revenue-segment"
              style={{
                flex: pct || 1,
                background: segmentColors[plan.color],
                border: `1px solid ${segmentBorders[plan.color]}`,
              }}
              title={`${plan.label}: ${count} iscritti (${pct}%)`}
            >
              <span className="segment-label">{plan.icon}</span>
              <span className="segment-count">{loading ? '—' : count}</span>
            </div>
          );
        })}
      </div>

      {/* Plan cards */}
      <div className="plans-grid">
        {plans.map((plan) => {
          const count = planCounts[plan.key] ?? null;
          const pct   = totalActive ? Math.round(((planCounts[plan.key] || 0) / totalActive) * 100) : 0;
          const isMostPopular = !loading && mostPopularKey === plan.key;

          return (
            <div
              key={plan.key}
              className={`plan-card ${isMostPopular ? 'featured' : ''}`}
            >
              {isMostPopular && (
                <div className="featured-badge">⭐ Più Popolare</div>
              )}

              <div
                className="plan-header"
                style={{ background: `linear-gradient(to bottom, ${headerGradients[plan.color]}, transparent)` }}
              >
                <div className="plan-icon">{plan.icon}</div>
                <h3>{plan.label}</h3>
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
                    {loading ? '—' : `€${planRevenue(plan).toLocaleString('it-IT')}`}
                  </span>
                </div>
                <button
                  className={`${isMostPopular ? 'primary-btn' : 'secondary'} max-w mt-4`}
                  onClick={() => setEditing(plan)}
                >
                  ✏️ Modifica Piano
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
