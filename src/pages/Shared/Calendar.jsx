import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import {
  getClassesForDate,
  bookClass,
  cancelBooking,
  getUpcomingBooking,
  addClass,
  deleteClass,
  getBookingsForClass,
  getAllWODs,
} from '../../services/firestoreService';
import './Calendar.css';

const DAYS_IT = ['Dom', 'Lun', 'Mar', 'Mer', 'Gio', 'Ven', 'Sab'];
const MONTHS_IT = [
  'Gennaio', 'Febbraio', 'Marzo', 'Aprile', 'Maggio', 'Giugno',
  'Luglio', 'Agosto', 'Settembre', 'Ottobre', 'Novembre', 'Dicembre',
];

function toDateStr(date) {
  return date.toISOString().split('T')[0];
}

export default function Calendar({ role }) {
  const { currentUser, userData } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedClass, setSelectedClass] = useState(null);
  const [userBooking, setUserBooking] = useState(null); // current user's booking for today
  const [actionLoading, setActionLoading] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success'|'error', msg }
  const [classBookings, setClassBookings] = useState([]);
  const [loadingBookings, setLoadingBookings] = useState(false);

  // Admin: new class form
  const [showAddForm, setShowAddForm] = useState(false);
  const [showStandardForm, setShowStandardForm] = useState(false);
  const [newClass, setNewClass] = useState({ title: 'CrossFit WOD', coach: '', time: '07:00', capacity: 12, wodId: '' });
  const [availableWods, setAvailableWods] = useState([]);
  const [standardWodId, setStandardWodId] = useState('');

  const dateStr = toDateStr(currentDate);

  const displayDate = currentDate.toLocaleDateString('it-IT', {
    weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
  });

  const loadClasses = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getClassesForDate(dateStr);
      setClasses(data);
    } catch (err) {
      console.error('Errore caricamento classi:', err);
    } finally {
      setLoading(false);
    }
  }, [dateStr]);

  useEffect(() => {
    loadClasses();
    // load user's upcoming booking to check if they have one today
    if (role === 'member' && currentUser) {
      getUpcomingBooking(currentUser.uid).then(setUserBooking).catch(console.error);
    }
    if (role === 'admin') {
      getAllWODs().then(setAvailableWods).catch(console.error);
    }
  }, [loadClasses, role, currentUser]);

  useEffect(() => {
    if (role === 'admin' && selectedClass) {
      setLoadingBookings(true);
      getBookingsForClass(selectedClass.id)
        .then(data => setClassBookings(data))
        .catch(err => console.error('Error fetching bookings:', err))
        .finally(() => setLoadingBookings(false));
    } else {
      setClassBookings([]);
    }
  }, [selectedClass, role]);

  function showFeedback(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleBook(cls) {
    if (!currentUser) return;
    setActionLoading(true);
    try {
      await bookClass(currentUser.uid, { ...cls, date: dateStr }, userData?.name || currentUser?.email || '');
      showFeedback('success', `Prenotato: ${cls.title} alle ${cls.time} ✓`);
      await loadClasses();
      setUserBooking({ classId: cls.id, classTitle: cls.title, date: dateStr, status: 'confirmed' });
      setSelectedClass(null);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Errore durante la prenotazione. Riprova.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleCancel() {
    if (!userBooking) return;
    setActionLoading(true);
    try {
      await cancelBooking(userBooking.id, userBooking.classId, selectedClass?.booked);
      showFeedback('success', 'Prenotazione cancellata.');
      setUserBooking(null);
      await loadClasses();
      setSelectedClass(null);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Errore nella cancellazione.');
    } finally {
      setActionLoading(false);
    }
  }

  async function handleAdminDelete(cls) {
    if (!window.confirm(`Eliminare la classe "${cls.title}" ?`)) return;
    try {
      await deleteClass(cls.id);
      showFeedback('success', 'Classe eliminata.');
      await loadClasses();
      setSelectedClass(null);
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Errore nella eliminazione.');
    }
  }

  async function handleAddClass(e) {
    e.preventDefault();
    try {
      let wodDataToSave = {};
      if (newClass.wodId) {
        const selectedWod = availableWods.find(w => w.id === newClass.wodId);
        if (selectedWod) {
          wodDataToSave = {
            wodId: selectedWod.id,
            wodTitle: selectedWod.title,
            wodScheme: selectedWod.scheme || '',
            wodExercises: selectedWod.exercises || []
          };
        }
      }

      await addClass({ 
        title: newClass.title,
        coach: newClass.coach,
        time: newClass.time,
        capacity: Number(newClass.capacity),
        date: dateStr, 
        booked: 0,
        ...wodDataToSave
      });
      showFeedback('success', 'Classe aggiunta con successo.');
      setShowAddForm(false);
      setNewClass({ title: 'CrossFit WOD', coach: '', time: '07:00', capacity: 12, wodId: '' });
      await loadClasses();
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Errore nell\'aggiunta della classe.');
    }
  }

  function changeDay(delta) {
    const next = new Date(currentDate);
    next.setDate(next.getDate() + delta);
    setCurrentDate(next);
    setSelectedClass(null);
  }

  async function handleGenerateStandardWODs() {
    setActionLoading(true);
    const standardTimes = ['10:00', '14:30', '16:30', '18:45', '20:00'];

    let wodDataToSave = {};
    if (standardWodId) {
      const selectedWod = availableWods.find(w => w.id === standardWodId);
      if (selectedWod) {
        wodDataToSave = {
          wodId: selectedWod.id,
          wodTitle: selectedWod.title,
          wodScheme: selectedWod.scheme || '',
          wodExercises: selectedWod.exercises || []
        };
      }
    }

    try {
      const promises = standardTimes.map(time => {
        return addClass({
          title: 'CrossFit WOD',
          coach: 'Team',
          time: time,
          capacity: 12,
          date: dateStr,
          booked: 0,
          ...wodDataToSave
        });
      });
      await Promise.all(promises);
      showFeedback('success', 'Giornata WOD generata con successo.');
      setShowStandardForm(false);
      setStandardWodId('');
      await loadClasses();
    } catch (err) {
      console.error(err);
      showFeedback('error', 'Errore nella generazione delle classi.');
    } finally {
      setActionLoading(false);
    }
  }

  const isUserBooked = (cls) =>
    userBooking && userBooking.classId === cls.id && userBooking.status === 'confirmed';

  const hasStandardClasses = classes.some(c => c.title === 'CrossFit WOD');

  return (
    <div className="calendar-container">
      {/* Feedback Toast */}
      {feedback && (
        <div className={`toast toast-${feedback.type}`}>{feedback.msg}</div>
      )}

      <div className="calendar-header">
        <div>
          <h1 className="title">Calendario Corsi</h1>
          <p className="subtitle">
            {role === 'admin'
              ? 'Gestisci i WOD e visualizza le classi'
              : 'Scegli e prenota il tuo prossimo allenamento'}
          </p>
        </div>
        <div className="date-picker">
          <button className="secondary-btn nav-btn-sm" onClick={() => changeDay(-1)}>‹</button>
          <span className="current-date">{displayDate.charAt(0).toUpperCase() + displayDate.slice(1)}</span>
          <button className="secondary-btn nav-btn-sm" onClick={() => changeDay(1)}>›</button>
        </div>
      </div>

      {role === 'admin' && (
        <div className="admin-toolbar" style={{ display: 'flex', gap: '12px' }}>
          <button className="primary-btn" onClick={() => { setShowAddForm(!showAddForm); setShowStandardForm(false); }}>
            {showAddForm ? '✕ Annulla' : '+ Aggiungi Classe'}
          </button>
          {!showAddForm && (
            <button
              className={`secondary-btn ${hasStandardClasses ? 'disabled' : ''}`}
              onClick={() => {
                if (hasStandardClasses) {
                  showFeedback('error', 'Le classi standard sono già state generate per questa data.');
                  return;
                }
                setShowStandardForm(!showStandardForm);
              }}
              disabled={actionLoading || hasStandardClasses}
              style={hasStandardClasses ? { opacity: 0.5, cursor: 'not-allowed' } : {}}
            >
              {showStandardForm ? '✕ Annulla' : '⚡ Classi Standard'}
            </button>
          )}
        </div>
      )}

      {/* Admin: Generate Standard Classes form */}
      {showStandardForm && role === 'admin' && (
        <div className="add-class-card card" style={{ borderColor: 'var(--color-orange)' }}>
          <h3 className="card-title-sm" style={{ color: 'var(--color-orange)' }}>Genera Classi Standard — {displayDate}</h3>
          <p className="text-muted" style={{ marginBottom: '16px', fontSize: '14px' }}>
            Verranno generate 5 classi "CrossFit WOD" (12 posti) agli orari: 10:00, 14:30, 16:30, 18:45, 20:00.
          </p>
          <form className="add-class-form" onSubmit={(e) => { e.preventDefault(); handleGenerateStandardWODs(); }}>
            <div className="form-row">
              <div className="form-field" style={{ flex: 1 }}>
                <label>Assegna WOD del Giorno (Opzionale)</label>
                <select
                  value={standardWodId}
                  onChange={(e) => setStandardWodId(e.target.value)}
                >
                  <option value="">-- Nessun WOD associato --</option>
                  {availableWods.map(w => (
                    <option key={w.id} value={w.id}>{w.title} ({w.scheme || 'Misto'})</option>
                  ))}
                </select>
              </div>
            </div>
            <button type="submit" className="primary-btn" disabled={actionLoading}>
              {actionLoading ? 'Generazione in corso...' : 'Conferma Generazione'}
            </button>
          </form>
        </div>
      )}

      {/* Admin: Add class form */}
      {showAddForm && role === 'admin' && (
        <div className="add-class-card card">
          <h3 className="card-title-sm">Nuova Classe — {displayDate}</h3>
          <form className="add-class-form" onSubmit={handleAddClass}>
            <div className="form-row">
              <div className="form-field">
                <label>Tipo di Classe</label>
                <select
                  value={newClass.title}
                  onChange={(e) => setNewClass({ ...newClass, title: e.target.value })}
                >
                  <option>CrossFit WOD</option>
                  <option>Weightlifting</option>
                  <option>Endurance</option>
                  <option>Open Gym</option>
                  <option>Gymnastics</option>
                  <option>Olympic Lifting</option>
                </select>
              </div>
              <div className="form-field">
                <label>Orario</label>
                <input
                  type="time"
                  value={newClass.time}
                  onChange={(e) => setNewClass({ ...newClass, time: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Libreria WOD (Opzionale)</label>
                <select
                  value={newClass.wodId || ''}
                  onChange={(e) => setNewClass({ ...newClass, wodId: e.target.value })}
                >
                  <option value="">-- Nessun WOD associato --</option>
                  {availableWods.map(w => (
                    <option key={w.id} value={w.id}>{w.title} ({w.scheme || 'Misto'})</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="form-row">
              <div className="form-field">
                <label>Coach</label>
                <input
                  type="text"
                  placeholder="Es. Coach Matt"
                  value={newClass.coach}
                  onChange={(e) => setNewClass({ ...newClass, coach: e.target.value })}
                  required
                />
              </div>
              <div className="form-field">
                <label>Capacità massima</label>
                <input
                  type="number"
                  min="1"
                  max="50"
                  value={newClass.capacity}
                  onChange={(e) => setNewClass({ ...newClass, capacity: e.target.value })}
                />
              </div>
            </div>
            <button type="submit" className="primary-btn">Aggiungi Classe</button>
          </form>
        </div>
      )}

      {/* Classes list */}
      <div className="schedule-grid">
        {loading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="schedule-card skeleton-card">
              <div className="skeleton-block tall" />
              <div className="skeleton-block wide" />
              <div className="skeleton-block short" />
            </div>
          ))
        ) : classes.length === 0 ? (
          <div className="no-classes-msg">
            <span className="no-classes-icon">📅</span>
            <p>Nessuna classe programmata per questo giorno.</p>
            {role === 'admin' && (
              <button className="primary-btn mt-4" onClick={() => setShowAddForm(true)}>
                + Aggiungi la Prima Classe
              </button>
            )}
          </div>
        ) : (
          classes.map((cls) => {
            const isFull = (cls.booked || 0) >= cls.capacity;
            const isAlmostFull = (cls.booked || 0) >= cls.capacity - 3 && !isFull;
            const booked = isUserBooked(cls);

            return (
              <div
                key={cls.id}
                className={`schedule-card ${isFull ? 'full' : ''} ${booked ? 'user-booked' : ''}`}
                onClick={() => setSelectedClass(cls)}
              >
                <div className="time-col">
                  <span className="time-text">{cls.time}</span>
                </div>
                <div className="details-col">
                  <h3>{cls.title}</h3>
                  <p>Coach: {cls.coach || '—'}</p>
                  {booked && <span className="booked-tag">✓ Prenotato</span>}
                </div>
                <div className="capacity-col">
                  <span className={`capacity-badge ${isFull ? 'badge-full' : isAlmostFull ? 'badge-warn' : 'badge-ok'}`}>
                    {cls.booked || 0} / {cls.capacity}
                  </span>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Modal */}
      {selectedClass && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedClass(null)}>
          <div className="modal-content">
            <button className="close-btn" onClick={() => setSelectedClass(null)}>✕</button>
            <h2 className="modal-title">{selectedClass.title}</h2>
            <p className="modal-subtitle">
              {selectedClass.time} — Coach {selectedClass.coach || '—'}
            </p>

            {selectedClass.wodId && (role === 'admin' || isUserBooked(selectedClass)) && (
              <div className="wod-preview-box" style={{ background: 'rgba(255,94,0,0.1)', padding: '12px', borderRadius: '8px', margin: '16px 0', border: '1px solid rgba(255,94,0,0.2)' }}>
                <h4 style={{ color: 'var(--color-orange)', marginBottom: '8px', fontSize: '14px' }}>WOD: {selectedClass.wodTitle}</h4>
                {selectedClass.wodScheme && <span className="wod-scheme" style={{ fontSize: '11px', display: 'inline-block', marginBottom: '8px', background: 'rgba(255,94,0,0.15)', padding: '2px 6px', borderRadius: '4px', color: 'var(--color-orange)', fontWeight: 'bold' }}>{selectedClass.wodScheme}</span>}
                <ul style={{ listStyle: 'none', padding: 0, margin: 0, fontSize: '13px' }}>
                  {selectedClass.wodExercises?.map((ex, i) => (
                    <li key={i} style={{ marginBottom: '4px' }}>• {ex}</li>
                  ))}
                </ul>
              </div>
            )}
            {selectedClass.wodId && role === 'member' && !isUserBooked(selectedClass) && (
              <div className="wod-preview-box" style={{ background: 'rgba(255,255,255,0.05)', padding: '12px', borderRadius: '8px', margin: '16px 0', textAlign: 'center' }}>
                <span style={{ fontSize: '20px' }}>🔒</span>
                <p style={{ fontSize: '13px', color: 'var(--color-text-muted)', marginTop: '4px' }}>Prenota questa classe per scoprire il WOD assegnato!</p>
              </div>
            )}

            <div className="modal-body">
              <div className="capacity-status">
                <strong>Posti occupati:</strong>{' '}
                <span className={selectedClass.booked >= selectedClass.capacity ? 'text-danger' : 'text-ok'}>
                  {selectedClass.booked || 0} / {selectedClass.capacity}
                </span>
              </div>

              {role === 'member' ? (
                <div className="booking-actions">
                  <p className="rule-text">
                    Puoi cancellare gratuitamente fino a 2 ore prima dell'inizio del corso.
                  </p>
                  {isUserBooked(selectedClass) ? (
                    <button
                      className="danger-btn max-w"
                      onClick={handleCancel}
                      disabled={actionLoading}
                    >
                      {actionLoading ? 'Attendere...' : 'Cancella la Mia Prenotazione'}
                    </button>
                  ) : (
                    <button
                      className="primary-btn max-w"
                      onClick={() => handleBook(selectedClass)}
                      disabled={selectedClass.booked >= selectedClass.capacity || actionLoading}
                    >
                      {actionLoading
                        ? 'Attendere...'
                        : selectedClass.booked >= selectedClass.capacity
                          ? 'Lista d\'Attesa'
                          : 'Prenota Ora'}
                    </button>
                  )}
                </div>
              ) : (
                <div className="admin-actions">
                  <div className="class-bookings-list" style={{ marginTop: '16px', marginBottom: '24px', textAlign: 'left', background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px' }}>
                    <h4 style={{ color: 'var(--color-orange)', marginBottom: '12px', fontSize: '13px', textTransform: 'uppercase' }}>Persone Prenotate</h4>
                    {loadingBookings ? (
                      <p className="text-muted" style={{ fontSize: '13px' }}>Caricamento in corso...</p>
                    ) : classBookings.length === 0 ? (
                      <p className="text-muted" style={{ fontSize: '13px' }}>Nessuna prenotazione attiva.</p>
                    ) : (
                      <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        {classBookings.map((b, i) => (
                          <li key={b.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '14px', color: 'var(--color-text)' }}>
                            <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '24px', height: '24px', borderRadius: '50%', background: 'rgba(255,255,255,0.1)', fontSize: '11px', color: 'var(--color-text-muted)' }}>{i + 1}</span>
                            {b.userName || 'Utente senza nome'}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                  <button
                    className="danger-btn"
                    onClick={() => handleAdminDelete(selectedClass)}
                  >
                    🗑 Elimina Classe
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
