import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { getUpcomingBooking, cancelBooking, getUserScores, getTodayWOD } from '../services/firestoreService';
import CheckInModal from '../components/CheckInModal';
import './Dashboard.css';

const DEFAULT_WOD = {
  name: 'FRAN',
  type: '21-15-9 Ripetizioni per Tempo',
  exercises: ['Thrusters (43/29 kg)', 'Pull-ups'],
};

export default function MemberDashboard() {
  const { currentUser, userData } = useAuth();
  const [isQrOpen, setIsQrOpen] = useState(false);
  const [nextBooking, setNextBooking] = useState(null);
  const [scores, setScores] = useState([]);
  const [wod, setWod] = useState(null);
  const [loading, setLoading] = useState(true);
  const [cancelLoading, setCancelLoading] = useState(false);

  const displayName = userData?.name?.split(' ')[0] || 'Atleta';
  const planName = userData?.plan || 'Basic';
  const todayLabel = new Date().toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long',
  });

  useEffect(() => {
    if (!currentUser) return;
    async function load() {
      try {
        const [booking, userScores, todayWod] = await Promise.all([
          getUpcomingBooking(currentUser.uid),
          getUserScores(currentUser.uid),
          getTodayWOD(),
        ]);
        setNextBooking(booking);
        setScores(userScores.slice(0, 4));
        setWod(todayWod);
      } catch (err) {
        console.error('Errore caricamento dashboard membro:', err);
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [currentUser]);

  async function handleCancelBooking() {
    if (!nextBooking) return;
    setCancelLoading(true);
    try {
      await cancelBooking(nextBooking.id, nextBooking.classId, undefined);
      setNextBooking(null);
    } catch (err) {
      console.error('Errore cancellazione:', err);
    } finally {
      setCancelLoading(false);
    }
  }

  const PR_ICONS = {
    'Back Squat': '🏋️', 'Front Squat': '🏋️', 'Deadlift': '💪',
    'Snatch': '🏋️', 'Clean & Jerk': '🏋️', 'FRAN': '⏱️',
    'Corsa 5k': '🏃', 'back_squat': '🏋️', 'deadlift': '💪',
    'snatch': '🏋️', 'run_5k': '🏃', 'fran': '⏱️', 'default': '🎯',
  };

  // Use WOD from Firestore or fallback to default
  const activeWod = wod || DEFAULT_WOD;
  const exercises = wod?.exercises || DEFAULT_WOD.exercises;

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="title">Ciao, {displayName}! 👋</h1>
          <p className="subtitle">
            {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)} — Piano <strong>{planName}</strong>
          </p>
        </div>
        <button className="primary-btn" onClick={() => setIsQrOpen(true)}>
          📱 Check-in QR
        </button>
      </div>

      <CheckInModal isOpen={isQrOpen} onClose={() => setIsQrOpen(false)} />

      <div className="content-grid two-cols">
        {/* WOD del Giorno */}
        <div className="card wod-card">
          <div className="card-header-row">
            <h3 className="card-title">Allenamento del Giorno</h3>
            {wod && <span className="wod-source-badge">🔥 Dal box</span>}
          </div>
          <div className="wod-content">
            <h4>"{activeWod.name}"</h4>
            <p className="wod-type">{activeWod.type || activeWod.scheme}</p>
            <ul>
              {(Array.isArray(exercises) ? exercises : [exercises]).map((ex, i) => (
                <li key={i}>{ex}</li>
              ))}
            </ul>
            {activeWod.scoreType && (
              <p className="wod-score-type">Score: {activeWod.scoreType}</p>
            )}
          </div>
          <Link to="/member/calendar">
            <button className="secondary-btn full-width mt-4">Prenota una Classe</button>
          </Link>
        </div>

        {/* Prossima prenotazione */}
        <div className="card schedule-card">
          <h3 className="card-title">Il Mio Prossimo Corso</h3>
          {loading ? (
            <div className="loading-state">
              <span className="skeleton-block" style={{ width: '100%', height: '80px', borderRadius: '8px' }} />
            </div>
          ) : nextBooking ? (
            <>
              <div className="next-class-box">
                <div className="date-badge">
                  <span className="day">
                    {new Date(nextBooking.date + 'T12:00:00').toLocaleDateString('it-IT', { weekday: 'short' }).toUpperCase()}
                  </span>
                  <span className="time">{nextBooking.time || '—'}</span>
                  <span className="day">
                    {new Date(nextBooking.date + 'T12:00:00').toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                  </span>
                </div>
                <div className="class-info">
                  <h4>{nextBooking.classTitle || 'Classe'}</h4>
                  <p>Coach {nextBooking.coach || '—'}</p>
                  <span className="confirmed-badge">✓ Confermato</span>
                </div>
              </div>
              <div className="actions mt-4">
                <button
                  className="danger-btn full-width"
                  onClick={handleCancelBooking}
                  disabled={cancelLoading}
                >
                  {cancelLoading ? 'Cancellando...' : 'Cancella Prenotazione'}
                </button>
                <p className="cancel-rule">Puoi cancellare fino a 2 ore prima.</p>
              </div>
            </>
          ) : (
            <div className="no-booking-state">
              <span className="no-booking-icon">📅</span>
              <p className="text-muted">Nessuna prenotazione attiva.</p>
              <Link to="/member/calendar">
                <button className="primary-btn mt-4">Prenota Ora</button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* PR Recenti */}
      <div className="card mt-4">
        <div className="card-header-row">
          <h3 className="card-title">I Miei PR Recenti</h3>
          <Link to="/member/leaderboard" className="see-all-link">Vedi classifica →</Link>
        </div>
        {loading ? (
          <div className="pr-list">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pr-item">
                <div className="skeleton-block" style={{ width: 48, height: 48, borderRadius: 12 }} />
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 6 }}>
                  <div className="skeleton-block" style={{ width: '60%', height: 14, borderRadius: 4 }} />
                  <div className="skeleton-block" style={{ width: '40%', height: 20, borderRadius: 4 }} />
                </div>
              </div>
            ))}
          </div>
        ) : scores.length === 0 ? (
          <div className="no-pr-state">
            <p className="text-muted">Nessun PR registrato ancora. Vai ad allenarti! 💪</p>
            <Link to="/member/leaderboard">
              <button className="secondary-btn mt-4">Registra il tuo primo PR</button>
            </Link>
          </div>
        ) : (
          <div className="pr-list">
            {scores.map((s) => (
              <div key={s.id} className="pr-item">
                <div className="pr-icon">
                  {PR_ICONS[s.exerciseName] || PR_ICONS['default']}
                </div>
                <div className="pr-details">
                  <h4>{s.label || s.exerciseName}</h4>
                  <p>{s.value} <span style={{ fontSize: 13, fontWeight: 400, color: 'var(--color-text-muted)' }}>{s.unit || ''}</span></p>
                </div>
                <div className="pr-date">
                  {new Date(s.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
