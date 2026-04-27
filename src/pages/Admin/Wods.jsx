import React, { useState, useEffect, useRef } from 'react';
import { getAllWODs, addWOD, deleteWOD, getClassesForWOD } from '../../services/firestoreService';
import './Wods.css';

export default function Wods() {
  const [wods, setWods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedWod, setSelectedWod] = useState(null);
  const [wodClasses, setWodClasses] = useState([]);
  const [loadingClasses, setLoadingClasses] = useState(false);
  
  // Form state
  const [newWod, setNewWod] = useState({ title: '', scheme: '', description: '', scoreType: '' });
  const [actionLoading, setActionLoading] = useState(false);
  
  const fileInputRef = useRef(null);

  useEffect(() => {
    loadWods();
  }, []);

  async function loadWods() {
    setLoading(true);
    try {
      const data = await getAllWODs();
      setWods(data);
    } catch (err) {
      console.error('Errore caricamento WOD:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleAddManual(e) {
    e.preventDefault();
    setActionLoading(true);
    try {
      // Convert description textarea to array of exercises
      const exercises = newWod.description.split('\n').map(s => s.trim()).filter(Boolean);
      await addWOD({
        title: newWod.title,
        scheme: newWod.scheme,
        exercises: exercises,
        scoreType: newWod.scoreType
      });
      setShowAddModal(false);
      setNewWod({ title: '', scheme: '', description: '', scoreType: '' });
      await loadWods();
    } catch (err) {
      console.error(err);
      alert('Errore nel salvataggio.');
    } finally {
      setActionLoading(false);
    }
  }

  function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setActionLoading(true);
        const data = JSON.parse(event.target.result);
        if (!Array.isArray(data)) {
          alert('Formato file non valido. Atteso un array JSON.');
          return;
        }

        for (const w of data) {
          await addWOD({
            title: w.title || 'WOD',
            scheme: w.scheme || w.type || '',
            exercises: w.exercises || (w.description ? w.description.split('\n') : []),
            scoreType: w.scoreType || ''
          });
        }
        
        alert(`${data.length} WOD importati con successo.`);
        if (fileInputRef.current) fileInputRef.current.value = '';
        await loadWods();
      } catch (err) {
        console.error(err);
        alert('Errore nel parsing del JSON o salvataggio. Assicurati che sia un file JSON valido.');
      } finally {
        setActionLoading(false);
      }
    };
    reader.readAsText(file);
  }

  async function handleWodClick(wod) {
    setSelectedWod(wod);
    setLoadingClasses(true);
    try {
      const classes = await getClassesForWOD(wod.id);
      setWodClasses(classes);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingClasses(false);
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Sei sicuro di voler eliminare questo WOD dalla libreria?')) return;
    try {
      await deleteWOD(id);
      setSelectedWod(null);
      await loadWods();
    } catch (err) {
      console.error(err);
    }
  }

  return (
    <div className="wods-container">
      <div className="wods-header">
        <div>
          <h1 className="title">Libreria WOD</h1>
          <p className="subtitle">Crea, importa e gestisci gli allenamenti</p>
        </div>
        <div className="header-actions">
          <input
            type="file"
            accept=".json"
            ref={fileInputRef}
            style={{ display: 'none' }}
            onChange={handleFileUpload}
          />
          <button className="secondary-btn" onClick={() => fileInputRef.current?.click()} disabled={actionLoading}>
            📂 Importa JSON
          </button>
          <button className="primary-btn" onClick={() => setShowAddModal(true)}>
            + Crea WOD
          </button>
        </div>
      </div>

      <div className="wods-grid">
        {loading ? (
          <p className="text-muted">Caricamento libreria...</p>
        ) : wods.length === 0 ? (
          <div className="no-data">
            <span style={{ fontSize: '30px' }}>🏋️</span>
            <p>Nessun WOD presente nella libreria.</p>
          </div>
        ) : (
          wods.map(w => (
            <div className="wod-library-card card" key={w.id} onClick={() => handleWodClick(w)}>
              <h3>{w.title}</h3>
              <span className="wod-scheme">{w.scheme || 'Misto'}</span>
              <p className="wod-preview">
                {w.exercises?.length ? w.exercises.join(', ') : 'Nessun esercizio specificato.'}
              </p>
            </div>
          ))
        )}
      </div>

      {showAddModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowAddModal(false)}>
          <div className="modal-content wod-modal">
            <button className="close-btn" onClick={() => setShowAddModal(false)}>✕</button>
            <h2 className="modal-title">Nuovo WOD</h2>
            <form onSubmit={handleAddManual} className="modal-form">
              <div className="form-field">
                <label>Nome del WOD</label>
                <input required value={newWod.title} onChange={e => setNewWod({...newWod, title: e.target.value})} placeholder="Es. FRAN, MURPH..." />
              </div>
              <div className="form-field">
                <label>Tipo / Schema</label>
                <input required value={newWod.scheme} onChange={e => setNewWod({...newWod, scheme: e.target.value})} placeholder="Es. For Time, AMRAP 20..." />
              </div>
              <div className="form-field">
                <label>Esercizi (uno per riga)</label>
                <textarea rows="5" required value={newWod.description} onChange={e => setNewWod({...newWod, description: e.target.value})} placeholder="21 Thrusters&#10;21 Pull-ups" />
              </div>
              <div className="form-field">
                <label>Tipo di Score (Opzionale)</label>
                <input value={newWod.scoreType} onChange={e => setNewWod({...newWod, scoreType: e.target.value})} placeholder="Es. Tempo, Ripetizioni, Peso" />
              </div>
              <button type="submit" className="primary-btn" disabled={actionLoading}>
                {actionLoading ? 'Salvataggio...' : 'Salva WOD'}
              </button>
            </form>
          </div>
        </div>
      )}

      {selectedWod && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setSelectedWod(null)}>
          <div className="modal-content wod-detail-modal">
            <button className="close-btn" onClick={() => setSelectedWod(null)}>✕</button>
            <div className="wod-detail-header">
              <h2 className="modal-title">{selectedWod.title}</h2>
              <span className="wod-scheme-large">{selectedWod.scheme}</span>
            </div>
            
            <div className="wod-exercises-box mt-4">
              <h4>Esercizi:</h4>
              <ul>
                {selectedWod.exercises?.map((ex, i) => (
                  <li key={i}>{ex}</li>
                ))}
              </ul>
            </div>

            <div className="wod-history-section mt-4">
              <h4>Storico Classi</h4>
              {loadingClasses ? (
                <p className="text-muted">Caricamento storico...</p>
              ) : wodClasses.length === 0 ? (
                <p className="text-muted" style={{fontSize: '13px'}}>Questo WOD non è ancora stato assegnato a nessuna classe.</p>
              ) : (
                <ul className="wod-classes-list">
                  {wodClasses.map(cls => (
                    <li key={cls.id}>
                      <span className="date">{new Date(cls.date).toLocaleDateString('it-IT')}</span>
                      <span className="time">{cls.time}</span>
                      <span className="info">{cls.title} - {cls.coach}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="modal-actions" style={{ marginTop: '24px' }}>
              <button className="danger-btn" onClick={() => handleDelete(selectedWod.id)}>
                Elimina dalla Libreria
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
