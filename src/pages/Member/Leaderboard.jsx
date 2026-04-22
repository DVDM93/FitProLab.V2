import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getLeaderboard, addScore } from '../../services/firestoreService';
import './Leaderboard.css';

const EXERCISES = [
  { key: 'fran', label: 'WOD "FRAN"', unit: 'mm:ss', type: 'time', lowerIsBetter: true },
  { key: 'back_squat', label: '1RM Back Squat', unit: 'kg', type: 'weight', lowerIsBetter: false },
  { key: 'deadlift', label: '1RM Deadlift', unit: 'kg', type: 'weight', lowerIsBetter: false },
  { key: 'run_5k', label: 'Corsa 5k', unit: 'mm:ss', type: 'time', lowerIsBetter: true },
  { key: 'snatch', label: '1RM Snatch', unit: 'kg', type: 'weight', lowerIsBetter: false },
];

export default function Leaderboard() {
  const { currentUser, userData } = useAuth();
  const [exercise, setExercise] = useState(EXERCISES[0]);
  const [board, setBoard] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddPR, setShowAddPR] = useState(false);
  const [prForm, setPrForm] = useState({ exerciseName: EXERCISES[0].key, value: '', unit: EXERCISES[0].unit });
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const currentUserName = userData?.name || currentUser?.email || 'Tu';

  const loadBoard = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getLeaderboard(exercise.key);
      setBoard(data);
    } catch (err) {
      console.error('Errore caricamento classifica:', err);
    } finally {
      setLoading(false);
    }
  }, [exercise.key]);

  useEffect(() => {
    loadBoard();
  }, [loadBoard]);

  function showToast(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3000);
  }

  async function handleAddPR(e) {
    e.preventDefault();
    if (!prForm.value) return;
    setSaving(true);
    try {
      await addScore(currentUser.uid, {
        exerciseName: exercise.key,
        displayName: currentUserName,
        value: parseFloat(prForm.value),
        unit: exercise.unit,
        label: exercise.label,
      });
      showToast('success', `PR registrato: ${prForm.value} ${exercise.unit} 🎉`);
      setShowAddPR(false);
      setPrForm({ ...prForm, value: '' });
      await loadBoard();
    } catch (err) {
      console.error(err);
      showToast('error', 'Errore nel salvataggio del PR.');
    } finally {
      setSaving(false);
    }
  }

  function selectExercise(ex) {
    setExercise(ex);
    setPrForm({ exerciseName: ex.key, value: '', unit: ex.unit });
    setShowAddPR(false);
  }

  // Find current user rank
  const myRank = board.findIndex((r) => r.userId === currentUser?.uid);

  return (
    <div className="leaderboard-container">
      {/* Toast */}
      {feedback && (
        <div className={`toast toast-${feedback.type}`}>{feedback.msg}</div>
      )}

      <div className="leaderboard-header">
        <div>
          <h1 className="title">Classifica del Box 🏆</h1>
          <p className="subtitle">
            Confronta i tuoi PR con gli altri atleti e scala la vetta.
          </p>
        </div>
        <button className="primary-btn" onClick={() => setShowAddPR(!showAddPR)}>
          {showAddPR ? '✕ Annulla' : '+ Registra PR'}
        </button>
      </div>

      {/* Add PR Form */}
      {showAddPR && (
        <div className="add-pr-card card">
          <h3 className="card-title-sm">Nuovo Personal Record — {exercise.label}</h3>
          <form className="pr-form" onSubmit={handleAddPR}>
            <div className="pr-form-row">
              <div className="form-field">
                <label>Il tuo risultato ({exercise.unit})</label>
                <input
                  type={exercise.type === 'weight' ? 'number' : 'text'}
                  placeholder={exercise.type === 'weight' ? 'Es. 120' : 'Es. 03:45'}
                  value={prForm.value}
                  onChange={(e) => setPrForm({ ...prForm, value: e.target.value })}
                  required
                />
              </div>
            </div>
            <button type="submit" className="primary-btn" disabled={saving}>
              {saving ? 'Salvando...' : '🏅 Salva il mio PR'}
            </button>
          </form>
        </div>
      )}

      {/* Exercise selector */}
      <div className="leaderboard-filters">
        {EXERCISES.map((ex) => (
          <button
            key={ex.key}
            className={`filter-btn ${exercise.key === ex.key ? 'active' : ''}`}
            onClick={() => selectExercise(ex)}
          >
            {ex.label}
          </button>
        ))}
      </div>

      {/* My rank banner */}
      {!loading && myRank >= 0 && (
        <div className="my-rank-banner">
          <span className="my-rank-label">La tua posizione</span>
          <span className="my-rank-value">#{myRank + 1}</span>
          <span className="my-rank-stat">
            {board[myRank]?.value} {exercise.unit}
          </span>
        </div>
      )}

      {/* Board table */}
      <div className="board-card card">
        {loading ? (
          <div className="board-loading">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="board-skeleton-row">
                <div className="skeleton-block" style={{ width: 32, height: 32, borderRadius: '50%' }} />
                <div className="skeleton-block" style={{ flex: 1, height: 18, borderRadius: 4 }} />
                <div className="skeleton-block" style={{ width: 80, height: 22, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : board.length === 0 ? (
          <div className="board-empty">
            <span style={{ fontSize: 40 }}>🏁</span>
            <p>Nessun risultato ancora. Sii il primo a registrare un PR!</p>
            <button className="primary-btn" onClick={() => setShowAddPR(true)}>
              + Registra il Primo PR
            </button>
          </div>
        ) : (
          <table className="board-table">
            <thead>
              <tr>
                <th width="80">Pos</th>
                <th>Atleta</th>
                <th className="text-right">Risultato</th>
                <th className="text-right">Data</th>
              </tr>
            </thead>
            <tbody>
              {board.map((row, idx) => {
                const rank = idx + 1;
                const isMe = row.userId === currentUser?.uid;
                return (
                  <tr key={row.id} className={isMe ? 'highlight-row' : ''}>
                    <td>
                      <span className={`rank-badge rank-${rank <= 3 ? rank : 'other'}`}>
                        {rank <= 3 ? ['🥇', '🥈', '🥉'][rank - 1] : rank}
                      </span>
                    </td>
                    <td className="athlete-name">
                      {isMe ? (
                        <span>
                          {currentUserName}
                          <span className="you-tag">Tu</span>
                        </span>
                      ) : (
                        row.displayName || 'Atleta'
                      )}
                      {rank === 1 && <span className="crown">👑</span>}
                    </td>
                    <td className="text-right stat-value">
                      {row.value} <span className="unit-label">{exercise.unit}</span>
                    </td>
                    <td className="text-right date-col">
                      {row.date
                        ? new Date(row.date).toLocaleDateString('it-IT', { day: 'numeric', month: 'short' })
                        : '—'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Note */}
      <p className="leaderboard-note">
        {exercise.lowerIsBetter
          ? '⏱ Per tempi: risultato più basso = migliore posizione'
          : '💪 Per carichi: risultato più alto = migliore posizione'}
      </p>
    </div>
  );
}
