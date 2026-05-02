import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { getUserData, getUserBookings, getUserScores, updateMember, getUserPayments, addPayment, uploadUserDocument, getUserDocuments, deleteUserDocument } from '../../services/firestoreService';
import { PLANS_DEF } from './Subscriptions';
import './MemberDetail.css';

export default function MemberDetail() {
  const { id } = useParams();
  const [member, setMember] = useState(null);
  const [bookings, setBookings] = useState([]);
  const [scores, setScores] = useState([]);
  const [payments, setPayments] = useState([]);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    planKey: '', amount: '', method: 'Contanti', date: new Date().toISOString().split('T')[0], notes: '', newExpirationDate: ''
  });
  const [savingPayment, setSavingPayment] = useState(false);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({});
  const [saving, setSaving] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(null);
  const [bookingFilter, setBookingFilter] = useState('');
  const [paymentFilter, setPaymentFilter] = useState('');
  const [userDocs, setUserDocs] = useState({});
  const [viewingDocBase64, setViewingDocBase64] = useState(null);

  useEffect(() => {
    async function loadMember() {
      try {
        const [memberData, memberBookings, memberScores, memberPayments, userDocsData] = await Promise.all([
          getUserData(id),
          getUserBookings(id),
          getUserScores(id),
          getUserPayments(id),
          getUserDocuments(id)
        ]);
        setMember(memberData);
        setEditForm({
          name: memberData?.name || '',
          plan: memberData?.plan || 'Basic',
          status: memberData?.status || 'Attivo',
          phone: memberData?.phone || '',
          expirationDate: memberData?.expirationDate || '',
        });
        setBookings(memberBookings); // fetch all
        setScores(memberScores.slice(0, 3)); // last 3 PR
        setPayments(memberPayments);
        setUserDocs(userDocsData || {});
      } catch (error) {
        console.error('Errore caricamento membro:', error);
      } finally {
        setLoading(false);
      }
    }
    loadMember();
  }, [id]);

  async function handleSave() {
    setSaving(true);
    try {
      await updateMember(id, editForm);
      setMember((prev) => ({ ...prev, ...editForm }));
      setEditing(false);
    } catch (error) {
      console.error('Errore salvataggio:', error);
    } finally {
      setSaving(false);
    }
  }

  async function handleDeactivate() {
    if (!window.confirm('Sei sicuro di voler disattivare questo membro?')) return;
    await updateMember(id, { status: 'Inattivo' });
    setMember((prev) => ({ ...prev, status: 'Inattivo' }));
  }

  async function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;
    
    setUploadingDoc(type);
    try {
      const base64 = await uploadUserDocument(id, file, type);
      setMember(prev => ({ ...prev, [type]: 'stored_in_db' }));
      setUserDocs(prev => ({ ...prev, [type]: base64 }));
    } catch (error) {
      console.error('Errore caricamento documento:', error);
      alert('Errore durante il caricamento del documento.');
    } finally {
      setUploadingDoc(null);
    }
  }

  function handleViewDoc(type) {
    if (member[type] && member[type].startsWith('http')) {
       window.open(member[type], '_blank');
       return;
    }
    const docBase64 = userDocs[type];
    if (docBase64) {
      setViewingDocBase64(docBase64);
    } else {
      alert("Documento non trovato.");
    }
  }

  async function handleDeleteDoc(type) {
    if (!window.confirm('Sei sicuro di voler eliminare questo documento? L\'azione è irreversibile.')) return;
    try {
      await deleteUserDocument(id, type);
      setMember(prev => {
        const copy = { ...prev };
        delete copy[type];
        return copy;
      });
      setUserDocs(prev => {
        const copy = { ...prev };
        delete copy[type];
        return copy;
      });
    } catch(err) {
      console.error(err);
      alert('Errore durante l\'eliminazione del documento');
    }
  }

  function handlePlanSelection(e) {
    const key = e.target.value;
    if (!key) {
      setPaymentForm(prev => ({ ...prev, planKey: key }));
      return;
    }
    const selectedPlan = PLANS_DEF.find(p => p.key === key);
    if (selectedPlan) {
      let suggestDate = new Date();
      if (member?.expirationDate && new Date(member.expirationDate) > new Date()) {
        suggestDate = new Date(member.expirationDate);
      }
      
      if (selectedPlan.period.includes('mese')) {
        suggestDate.setMonth(suggestDate.getMonth() + 1);
      } else if (selectedPlan.period.includes('3 mesi')) {
        suggestDate.setMonth(suggestDate.getMonth() + 3);
      } else if (selectedPlan.period.includes('anno')) {
        suggestDate.setFullYear(suggestDate.getFullYear() + 1);
      }
      
      setPaymentForm(prev => ({
        ...prev,
        planKey: key,
        amount: selectedPlan.priceMonthly,
        notes: `Rinnovo ${selectedPlan.label}`,
        newExpirationDate: suggestDate.toISOString().split('T')[0]
      }));
    }
  }

  async function handleSavePayment(e) {
    e.preventDefault();
    if (!paymentForm.amount || !paymentForm.date) return;
    setSavingPayment(true);
    try {
      await addPayment(id, {
        amount: parseFloat(paymentForm.amount),
        method: paymentForm.method,
        date: paymentForm.date,
        notes: paymentForm.notes,
      }, paymentForm.newExpirationDate);
      
      setMember(prev => {
        let newStatus = prev.status;
        if (paymentForm.newExpirationDate) {
          const expDate = new Date(paymentForm.newExpirationDate);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expDate.setHours(0, 0, 0, 0);
          if (expDate >= today) {
            newStatus = 'Attivo';
          }
        }
        return { ...prev, expirationDate: paymentForm.newExpirationDate || prev.expirationDate, status: newStatus };
      });
      const newPayments = await getUserPayments(id);
      setPayments(newPayments);
      setShowPaymentModal(false);
      setPaymentForm({
        planKey: '', amount: '', method: 'Contanti', date: new Date().toISOString().split('T')[0], notes: '', newExpirationDate: ''
      });
    } catch (error) {
      console.error('Errore registrazione pagamento:', error);
    } finally {
      setSavingPayment(false);
    }
  }

  function openPaymentModal() {
    let suggestDate = new Date();
    if (member?.expirationDate) {
      suggestDate = new Date(member.expirationDate);
    }
    suggestDate.setMonth(suggestDate.getMonth() + 1);
    
    setPaymentForm(prev => ({
      ...prev,
      planKey: '',
      newExpirationDate: suggestDate.toISOString().split('T')[0]
    }));
    setShowPaymentModal(true);
  }


  if (loading) {
    return (
      <div className="member-detail-container">
        <div className="loading-text">Caricamento profilo membro...</div>
      </div>
    );
  }

  if (!member) {
    return (
      <div className="member-detail-container">
        <Link to="/admin/members" className="back-link">← Torna alla Lista</Link>
        <p className="text-muted mt-4">Membro non trovato.</p>
      </div>
    );
  }

  const initials = member.name
    ? member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)
    : '??';

  const joinDate = member.joinDate
    ? new Date(member.joinDate).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' })
    : 'N/A';

  const filteredBookings = bookings.filter(b => 
    (b.classTitle || '').toLowerCase().includes(bookingFilter.toLowerCase()) ||
    (b.date || '').includes(bookingFilter)
  );

  const filteredPayments = payments.filter(p => 
    (p.notes || '').toLowerCase().includes(paymentFilter.toLowerCase()) ||
    (p.method || '').toLowerCase().includes(paymentFilter.toLowerCase()) ||
    (p.date || '').includes(paymentFilter)
  );

  return (
    <div className="member-detail-container">
      <div className="detail-header">
        <Link to="/admin/members" className="back-link">← Torna alla Lista</Link>
        <div className="header-actions">
          {editing ? (
            <>
              <button className="secondary-btn" onClick={() => setEditing(false)}>Annulla</button>
              <button className="primary-btn" onClick={handleSave} disabled={saving}>
                {saving ? 'Salvando...' : 'Salva Modifiche'}
              </button>
            </>
          ) : (
            <>
              <button className="secondary-btn" onClick={() => setEditing(true)}>Modifica Profilo</button>
              <button className="danger-btn" onClick={handleDeactivate}>Disattiva</button>
            </>
          )}
        </div>
      </div>

      <div className="profile-top-section card">
        <div className="profile-info">
          <div className="profile-avatar">
            <span className="avatar-placeholder">{initials}</span>
          </div>
          <div className="profile-text">
            {editing ? (
              <input
                className="edit-input"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                placeholder="Nome completo"
              />
            ) : (
              <h2>{member.name || 'Senza nome'}</h2>
            )}
            <p className="text-muted">Iscritto dal {joinDate}</p>
            <div className="contact-info">
              <span>📧 {member.email}</span>
              {editing ? (
                <input
                  className="edit-input small"
                  value={editForm.phone}
                  onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                  placeholder="Telefono (es. +39 333 1234567)"
                />
              ) : (
                member.phone && <span>📱 {member.phone}</span>
              )}
            </div>
          </div>
        </div>
        <div className="profile-status">
          {editing ? (
            <div className="edit-group">
              <label className="edit-label">Stato</label>
              <select
                className="edit-select"
                value={editForm.status}
                onChange={(e) => setEditForm({ ...editForm, status: e.target.value })}
              >
                <option value="Attivo">Attivo</option>
                <option value="In Scadenza">In Scadenza</option>
                <option value="Inattivo">Inattivo</option>
              </select>
            </div>
          ) : (
            <div className={`status-box ${member.status === 'Attivo' ? 'active' : member.status === 'In Scadenza' ? 'expiring' : 'inactive'}`}>
              <span className="status-label">Stato</span>
              <span className="status-val">{member.status || 'Attivo'}</span>
            </div>
          )}
        </div>
      </div>

      <div className="detail-grid">
        <div className="card subscription-card">
          <h3 className="card-title">Abbonamento</h3>
          <div className="sub-details">
            <div className="sub-row">
              <span className="text-muted">Piano Corrente</span>
              {editing ? (
                <select
                  className="edit-select"
                  value={editForm.plan}
                  onChange={(e) => setEditForm({ ...editForm, plan: e.target.value })}
                >
                  <option value="Basic">Basic (€60/mese)</option>
                  <option value="Pro">Pro (€90/mese)</option>
                  <option value="Trimestrale Pro">Trimestrale Pro (€250/3 mesi)</option>
                  <option value="Weightlifting Basic">Weightlifting Basic (€50/mese)</option>
                  <option value="Weightlifting Pro">Weightlifting Pro (€60/mese)</option>
                  <option value="Weightlifting Competitor">Weightlifting Competitor (€60/mese)</option>
                </select>
              ) : (
                <strong>{member.plan || 'Basic'}</strong>
              )}
            </div>
            <div className="sub-row">
              <span className="text-muted">Data Iscrizione</span>
              <strong>{joinDate}</strong>
            </div>
            {member.lastCheckIn && (
              <div className="sub-row">
                <span className="text-muted">Ultimo Check-in</span>
                <strong>{new Date(member.lastCheckIn).toLocaleDateString('it-IT')}</strong>
              </div>
            )}
            <div className="sub-row mt-2" style={{ borderTop: '1px solid rgba(255,255,255,0.05)', paddingTop: '12px' }}>
              <span className="text-muted">Scadenza Abbonamento</span>
              {editing ? (
                <input
                  type="date"
                  className="edit-input small"
                  value={editForm.expirationDate || ''}
                  onChange={(e) => {
                    const newDate = e.target.value;
                    let newStatus = editForm.status;
                    if (newDate) {
                      const expDate = new Date(newDate);
                      const today = new Date();
                      today.setHours(0,0,0,0);
                      expDate.setHours(0,0,0,0);
                      if (expDate >= today) {
                        newStatus = 'Attivo';
                      } else {
                        newStatus = 'Inattivo';
                      }
                    }
                    setEditForm({ ...editForm, expirationDate: newDate, status: newStatus });
                  }}
                />
              ) : (
                <strong className={member.expirationDate && new Date(member.expirationDate) < new Date() ? 'text-danger' : 'text-ok'}>
                  {member.expirationDate ? new Date(member.expirationDate).toLocaleDateString('it-IT') : 'Non impostata'}
                </strong>
              )}
            </div>
          </div>
          {!editing && (
            <div className="sub-actions">
              <button className="primary-btn full-width" onClick={openPaymentModal}>
                💶 Registra Pagamento
              </button>
              <button className="danger-btn full-width" onClick={handleDeactivate}>
                Disattiva Abbonamento
              </button>
            </div>
          )}
        </div>

        <div className="card document-card mt-4">
          <h3 className="card-title">Documenti & Consensi</h3>
          <div className="sub-details">
            <div className="sub-row">
              <span className="text-muted">Consenso Privacy</span>
              <strong>{member.privacyConsent !== false ? 'Accettato' : 'Mancante'}</strong>
            </div>
            <div className="sub-row" style={{ alignItems: 'center' }}>
              <span className="text-muted">Certificato Medico</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {member.medical_certificate ? (
                  <>
                    <button className="secondary-btn" style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', margin: 0, border: 'none', color: 'var(--color-orange)' }} onClick={() => handleViewDoc('medical_certificate')}>
                      Visualizza
                    </button>
                    <button className="danger-btn" style={{ padding: '2px 6px', fontSize: '11px', margin: 0, background: 'transparent', color: '#ff4646', border: '1px solid #ff4646' }} onClick={() => handleDeleteDoc('medical_certificate')}>
                      Elimina
                    </button>
                  </>
                ) : (
                  <span className="text-muted">Mancante</span>
                )}
                <input 
                  type="file" 
                  id="upload-medical" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileUpload(e, 'medical_certificate')}
                  accept="image/*,.pdf"
                />
                <label htmlFor="upload-medical" className="secondary-btn" style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                  {uploadingDoc === 'medical_certificate' ? '...' : 'Carica'}
                </label>
              </div>
            </div>
            <div className="sub-row" style={{ alignItems: 'center', borderBottom: 'none', paddingBottom: 0 }}>
              <span className="text-muted">Doc. Identità</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                {member.id_document ? (
                  <>
                    <button className="secondary-btn" style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', margin: 0, border: 'none', color: 'var(--color-orange)' }} onClick={() => handleViewDoc('id_document')}>
                      Visualizza
                    </button>
                    <button className="danger-btn" style={{ padding: '2px 6px', fontSize: '11px', margin: 0, background: 'transparent', color: '#ff4646', border: '1px solid #ff4646' }} onClick={() => handleDeleteDoc('id_document')}>
                      Elimina
                    </button>
                  </>
                ) : (
                  <span className="text-muted">Mancante</span>
                )}
                <input 
                  type="file" 
                  id="upload-id" 
                  style={{ display: 'none' }} 
                  onChange={(e) => handleFileUpload(e, 'id_document')}
                  accept="image/*,.pdf"
                />
                <label htmlFor="upload-id" className="secondary-btn" style={{ padding: '4px 8px', fontSize: '12px', cursor: 'pointer', margin: 0 }}>
                  {uploadingDoc === 'id_document' ? '...' : 'Carica'}
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="card history-card">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Storico Prenotazioni</h3>
            <input 
              type="text" 
              className="edit-input small" 
              placeholder="Cerca classe o data..." 
              style={{ width: '200px' }}
              value={bookingFilter}
              onChange={e => setBookingFilter(e.target.value)}
            />
          </div>
          {filteredBookings.length === 0 ? (
            <p className="text-muted">Nessuna prenotazione trovata.</p>
          ) : (
            <div className="scrollable-list">
              <ul className="activity-list">
                {filteredBookings.map((b) => (
                  <li key={b.id}>
                    <span className={`dot ${b.status === 'cancelled' ? 'gray' : 'orange'}`} />
                    <p className={b.status === 'cancelled' ? 'text-muted' : ''}>
                      {b.status === 'cancelled' ? 'Cancellato: ' : ''}{b.classTitle || 'Classe'}
                    </p>
                    <span className="time">{b.date}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        {scores.length > 0 && (
          <div className="card pr-card mt-4">
            <h3 className="card-title">PR Recenti</h3>
            <div className="stats-row mt-4">
              {scores.map((s) => (
                <div className="mini-stat" key={s.id}>
                  <span className="value">{s.value}{s.unit || ''}</span>
                  <span className="label">{s.exerciseName}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="card payments-card mt-4">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <h3 className="card-title" style={{ margin: 0 }}>Storico Pagamenti</h3>
            <input 
              type="text" 
              className="edit-input small" 
              placeholder="Cerca pagamento..." 
              style={{ width: '200px' }}
              value={paymentFilter}
              onChange={e => setPaymentFilter(e.target.value)}
            />
          </div>
          {filteredPayments.length === 0 ? (
            <p className="text-muted">Nessun pagamento trovato.</p>
          ) : (
            <div className="table-responsive scrollable-list">
              <table className="payments-table">
                <thead>
                  <tr>
                    <th>Data</th>
                    <th>Importo</th>
                    <th>Metodo</th>
                    <th>Note</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredPayments.map(p => (
                    <tr key={p.id}>
                      <td>{new Date(p.date).toLocaleDateString('it-IT')}</td>
                      <td className="text-ok">€{p.amount.toFixed(2)}</td>
                      <td>{p.method}</td>
                      <td className="text-muted" style={{ fontSize: '13px' }}>{p.notes || '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      {/* Payment Modal */}
      {showPaymentModal && (
        <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && setShowPaymentModal(false)}>
          <div className="modal-content payment-modal">
            <button className="close-btn" onClick={() => setShowPaymentModal(false)}>✕</button>
            <h2 className="modal-title">Registra Pagamento</h2>
            <form onSubmit={handleSavePayment}>
              <div className="form-group">
                <label>Seleziona Piano (Opzionale)</label>
                <select className="edit-select" style={{width: '100%', marginBottom: '12px'}} value={paymentForm.planKey} onChange={handlePlanSelection}>
                  <option value="">-- Nessun piano / Importo libero --</option>
                  {PLANS_DEF.map(p => (
                    <option key={p.key} value={p.key}>{p.label} ({p.price}{p.period})</option>
                  ))}
                </select>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Importo (€)</label>
                  <input type="number" step="0.01" required value={paymentForm.amount} onChange={e => setPaymentForm({...paymentForm, amount: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Metodo di Pagamento</label>
                  <select value={paymentForm.method} onChange={e => setPaymentForm({...paymentForm, method: e.target.value})}>
                    <option value="Contanti">Contanti</option>
                    <option value="Carta">Carta/Bancomat</option>
                    <option value="Bonifico">Bonifico</option>
                  </select>
                </div>
              </div>
              <div className="form-row" style={{ display: 'flex', gap: '16px' }}>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Data Pagamento</label>
                  <input type="date" required value={paymentForm.date} onChange={e => setPaymentForm({...paymentForm, date: e.target.value})} />
                </div>
                <div className="form-group" style={{ flex: 1 }}>
                  <label>Nuova Scadenza</label>
                  <input type="date" required value={paymentForm.newExpirationDate} onChange={e => setPaymentForm({...paymentForm, newExpirationDate: e.target.value})} />
                </div>
              </div>
              <div className="form-group">
                <label>Note (opzionale)</label>
                <input type="text" placeholder="Es. Pagamento parziale, promo..." value={paymentForm.notes} onChange={e => setPaymentForm({...paymentForm, notes: e.target.value})} />
              </div>
              <button type="submit" className="primary-btn full-width mt-4" style={{ padding: '14px', fontSize: '16px' }} disabled={savingPayment}>
                {savingPayment ? 'Salvataggio...' : 'Conferma Pagamento'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Document Modal */}
      {viewingDocBase64 && (
        <div className="modal-overlay" onClick={() => setViewingDocBase64(null)}>
          <div className="modal-content" style={{ maxWidth: '90%', maxHeight: '90vh', overflow: 'auto', textAlign: 'center', padding: '16px' }}>
            <button className="close-btn" onClick={() => setViewingDocBase64(null)}>✕</button>
            {viewingDocBase64.startsWith('data:application/pdf') ? (
              <iframe src={viewingDocBase64} style={{ width: '100%', height: '80vh', border: 'none' }} title="Documento PDF" />
            ) : (
              <img src={viewingDocBase64} alt="Documento" style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
