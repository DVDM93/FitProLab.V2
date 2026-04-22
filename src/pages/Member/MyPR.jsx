import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { getUserScores, addScore } from '../../services/firestoreService';
import './MyPR.css';

const EXERCISES = [
  { key: 'back_squat',  label: '1RM Back Squat',  unit: 'kg',    type: 'weight', icon: '🏋️', lowerIsBetter: false },
  { key: 'deadlift',    label: '1RM Deadlift',     unit: 'kg',    type: 'weight', icon: '💪', lowerIsBetter: false },
  { key: 'snatch',      label: '1RM Snatch',        unit: 'kg',    type: 'weight', icon: '🎯', lowerIsBetter: false },
  { key: 'fran',        label: 'WOD "FRAN"',        unit: 'mm:ss', type: 'time',   icon: '⏱', lowerIsBetter: true  },
  { key: 'run_5k',      label: 'Corsa 5k',          unit: 'mm:ss', type: 'time',   icon: '🏃', lowerIsBetter: true  },
];

function formatDate(dateStr) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('it-IT', { day: 'numeric', month: 'short', year: 'numeric' });
}

function getBestScore(scores, lowerIsBetter) {
  if (!scores || scores.length === 0) return null;
  return scores.reduce((best, s) => {
    if (!best) return s;
    if (lowerIsBetter) return s.value < best.value ? s : best;
    return s.value > best.value ? s : best;
  }, null);
}

function ProgressBar({ scores, lowerIsBetter }) {
  if (scores.length < 2) return null;
  const sorted = [...scores].sort((a, b) => (a.date || '').localeCompare(b.date || ''));
  const first = sorted[0].value;
  const last = sorted[sorted.length - 1].value;
  const improved = lowerIsBetter ? last < first : last > first;
  const pct = first === 0 ? 0 : Math.min(100, Math.abs(((last - first) / first) * 100));
  return (
    <div className="pr-progress-bar-wrap">
      <div className="pr-progress-bar" style={{ width: `${pct.toFixed(1)}%` }} />
      <span className={`pr-progress-label ${improved ? 'improved' : 'regressed'}`}>
        {improved ? '↑' : '↓'} {pct.toFixed(1)}%
      </span>
    </div>
  );
}

export default function MyPR() {
  const { currentUser, userData } = useAuth();
  const [allScores, setAllScores]   = useState([]);
  const [loading, setLoading]       = useState(true);
  const [selected, setSelected]     = useState(EXERCISES[0]);
  const [showForm, setShowForm]     = useState(false);
  const [formValue, setFormValue]   = useState('');
  const [saving, setSaving]         = useState(false);
  const [toast, setToast]           = useState(null);

  const loadScores = useCallback(async () => {
    if (!currentUser) return;
    setLoading(true);
    try {
      const data = await getUserScores(currentUser.uid);
      setAllScores(data);
    } catch (err) {
      console.error('Errore caricamento PR:', err);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => { loadScores(); }, [loadScores]);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!formValue) return;
    setSaving(true);
    try {
      await addScore(currentUser.uid, {
        exerciseName: selected.key,
        displayName: userData?.name || currentUser?.email || 'Atleta',
        value: parseFloat(formValue),
        unit: selected.unit,
        label: selected.label,
      });
      showToast('success', `PR aggiunto: ${formValue} ${selected.unit} 🏅`);
      setFormValue('');
      setShowForm(false);
      await loadScores();
    } catch (err) {
      console.error(err);
      showToast('error', 'Errore nel salvataggio. Riprova.');
    } finally {
      setSaving(false);
    }
  }

  // Scores for currently selected exercise
  const exerciseScores = allScores
    .filter((s) => s.exerciseName === selected.key)
    .sort((a, b) => (b.date || '').localeCompare(a.date || ''));

  const bestScore = getBestScore(exerciseScores, selected.lowerIsBetter);

  // Summary: best PR per exercise
  const prSummary = EXERCISES.map((ex) => {
    const exScores = allScores.filter((s) => s.exerciseName === ex.key);
    const best = getBestScore(exScores, ex.lowerIsBetter);
    return { ...ex, best, count: exScores.length };
  });

  return (
    <div className="mypr-container">
      {/* Toast */}
      {toast && <div className={`pr-toast pr-toast-${toast.type}`}>{toast.msg}</div>}

      {/* Header */}
      <div className="mypr-header">
        <div>
          <h1 className="title">I Miei Personal Record 🏅</h1>
          <p className="subtitle">Traccia i tuoi progressi e rompi ogni limite.</p>
        </div>
        <button className="primary-btn" onClick={() => setShowForm(!showForm)}>
          {showForm ? '✕ Annulla' : '+ Registra PR'}
        </button>
      </div>

      {/* Add PR form */}
      {showForm && (
        <div className="pr-form-card card" id="add-pr-form">
          <p className="pr-form-title">Nuovo PR — {selected.label}</p>
          <form className="pr-form" onSubmit={handleSubmit}>
            <div className="pr-form-body">
              <div className="form-field">
                <label>Il tuo risultato ({selected.unit})</label>
                <input
                  type={selected.type === 'weight' ? 'number' : 'text'}
                  placeholder={selected.type === 'weight' ? 'Es. 120' : 'Es. 03:45'}
                  value={formValue}
                  onChange={(e) => setFormValue(e.target.value)}
                  required
                  autoFocus
                  min={selected.type === 'weight' ? '0' : undefined}
                  step={selected.type === 'weight' ? '0.5' : undefined}
                />
              </div>
              <button type="submit" className="primary-btn" disabled={saving}>
                {saving ? 'Salvando...' : '💾 Salva'}
              </button>
            </div>
            <p className="pr-form-hint">
              {selected.lowerIsBetter ? '⏱ Inserisci il tempo nel formato MM:SS' : '💪 Inserisci il peso in kg'}
            </p>
          </form>
        </div>
      )}

      {/* Exercise tabs */}
      <div className="mypr-tabs">
        {EXERCISES.map((ex) => {
          const hasData = allScores.some((s) => s.exerciseName === ex.key);
          return (
            <button
              key={ex.key}
              className={`pr-tab ${selected.key === ex.key ? 'active' : ''}`}
              onClick={() => { setSelected(ex); setShowForm(false); setFormValue(''); }}
            >
              <span className="pr-tab-icon">{ex.icon}</span>
              <span className="pr-tab-label">{ex.label}</span>
              {hasData && <span className="pr-tab-dot" />}
            </button>
          );
        })}
      </div>

      {/* Summary cards */}
      {!loading && (
        <div className="pr-summary-row">
          {/* Best PR card */}
          <div className="card pr-stat-card pr-stat-best">
            <p className="pr-stat-label">🏆 Miglior PR</p>
            {bestScore ? (
              <>
                <p className="pr-stat-value">{bestScore.value} <span className="pr-stat-unit">{selected.unit}</span></p>
                <p className="pr-stat-sub">{formatDate(bestScore.date)}</p>
              </>
            ) : (
              <p className="pr-stat-empty">Nessun PR registrato</p>
            )}
          </div>

          {/* Total attempts */}
          <div className="card pr-stat-card">
            <p className="pr-stat-label">📈 Tentativi</p>
            <p className="pr-stat-value">{exerciseScores.length}</p>
            <p className="pr-stat-sub">risultati registrati</p>
          </div>

          {/* Progress */}
          <div className="card pr-stat-card">
            <p className="pr-stat-label">🔥 Progresso</p>
            {exerciseScores.length >= 2 ? (
              <ProgressBar scores={exerciseScores} lowerIsBetter={selected.lowerIsBetter} />
            ) : (
              <p className="pr-stat-empty">Registra almeno 2 PR</p>
            )}
          </div>
        </div>
      )}

      {/* History table */}
      <div className="card pr-history-card">
        <div className="pr-history-header">
          <p className="pr-history-title">{selected.icon} Storico — {selected.label}</p>
          <button
            className="secondary pr-add-inline-btn"
            onClick={() => { setShowForm(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
          >
            + Aggiungi
          </button>
        </div>

        {loading ? (
          <div className="pr-skeleton-wrap">
            {[1, 2, 3].map((i) => (
              <div key={i} className="pr-skeleton-row">
                <div className="skeleton-block" style={{ width: 48, height: 16, borderRadius: 4 }} />
                <div className="skeleton-block" style={{ flex: 1, height: 16, borderRadius: 4 }} />
                <div className="skeleton-block" style={{ width: 80, height: 16, borderRadius: 4 }} />
              </div>
            ))}
          </div>
        ) : exerciseScores.length === 0 ? (
          <div className="pr-empty">
            <span style={{ fontSize: 40 }}>🎯</span>
            <p>Nessun PR registrato per <strong>{selected.label}</strong>.</p>
            <button className="primary-btn" onClick={() => setShowForm(true)}>
              + Aggiungi il Primo PR
            </button>
          </div>
        ) : (
          <table className="pr-table">
            <thead>
              <tr>
                <th>#</th>
                <th>Data</th>
                <th className="text-right">Risultato</th>
                <th className="text-right">vs Precedente</th>
              </tr>
            </thead>
            <tbody>
              {exerciseScores.map((score, idx) => {
                const prev = exerciseScores[idx + 1];
                let delta = null;
                let deltaPositive = false;
                if (prev) {
                  const diff = score.value - prev.value;
                  deltaPositive = selected.lowerIsBetter ? diff < 0 : diff > 0;
                  delta = diff > 0 ? `+${diff.toFixed(1)}` : diff.toFixed(1);
                }
                const isBest = bestScore && score.id === bestScore.id;
                return (
                  <tr key={score.id} className={isBest ? 'pr-row-best' : ''}>
                    <td>
                      <span className="pr-index">{idx + 1}</span>
                      {isBest && <span className="pr-best-tag">PR</span>}
                    </td>
                    <td className="pr-date-cell">{formatDate(score.date)}</td>
                    <td className="text-right pr-value-cell">
                      {score.value} <span className="pr-unit">{selected.unit}</span>
                    </td>
                    <td className="text-right">
                      {delta !== null ? (
                        <span className={`pr-delta ${deltaPositive ? 'delta-good' : 'delta-bad'}`}>
                          {delta} {selected.unit}
                        </span>
                      ) : (
                        <span className="pr-delta-first">Primo</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Overview: all PRs summary */}
      <div className="card pr-overview-card">
        <p className="pr-overview-title">📋 Riepilogo Generale</p>
        <div className="pr-overview-grid">
          {prSummary.map((ex) => (
            <button
              key={ex.key}
              className={`pr-overview-item ${selected.key === ex.key ? 'active' : ''}`}
              onClick={() => { setSelected(ex); setShowForm(false); setFormValue(''); window.scrollTo({ top: 0, behavior: 'smooth' }); }}
            >
              <span className="pr-ov-icon">{ex.icon}</span>
              <span className="pr-ov-label">{ex.label}</span>
              {ex.best ? (
                <span className="pr-ov-value">{ex.best.value} <span className="pr-ov-unit">{ex.unit}</span></span>
              ) : (
                <span className="pr-ov-empty">—</span>
              )}
              <span className="pr-ov-count">{ex.count} registrazioni</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
