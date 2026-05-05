import React, { useState, useEffect } from 'react';
import { adminCreateMember } from '../services/adminAuthService';
import { getSubscriptionPlans } from '../services/firestoreService';
import './AddMemberModal.css';

export default function AddMemberModal({ isOpen, onClose, onMemberAdded }) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState('');
  const [plan, setPlan] = useState('Basic');
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadPlans() {
      const p = await getSubscriptionPlans();
      setPlans(p);
    }
    if (isOpen) loadPlans();
  }, [isOpen]);

  if (!isOpen) return null;

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const selectedPlan = plans.find(p => p.key === plan);
      let expDate = new Date();
      let amount = 0;
      if (selectedPlan) {
        amount = selectedPlan.priceMonthly || 0;
        if (selectedPlan.period.includes('mese')) {
          expDate.setMonth(expDate.getMonth() + 1);
        } else if (selectedPlan.period.includes('3 mesi')) {
          expDate.setMonth(expDate.getMonth() + 3);
        } else if (selectedPlan.period.includes('anno')) {
          expDate.setFullYear(expDate.getFullYear() + 1);
        } else if (selectedPlan.key === 'Pacchetto 12') {
          expDate.setMonth(expDate.getMonth() + 6);
        } else if (selectedPlan.key === 'Giornaliero') {
          expDate.setDate(expDate.getDate() + 1);
        }
      }

      await adminCreateMember({ 
        name, email, password, phone, plan,
        expirationDate: expDate.toISOString().split('T')[0],
        amount: amount
      });
      onMemberAdded(); // Callback to refresh the list
      onClose(); // Close the modal
      
      // Reset form
      setName('');
      setEmail('');
      setPassword('');
      setPhone('');
      setPlan('Basic');
    } catch (err) {
      console.error(err);
      setError(err.message || 'Errore durante la creazione del membro.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="add-member-modal">
        <button className="close-btn" onClick={onClose} disabled={loading}>✕</button>
        <h2 className="modal-title">Aggiungi Nuovo Membro</h2>
        <p className="modal-subtitle">Crea un account per un nuovo iscritto.</p>

        {error && <div className="modal-error">{error}</div>}

        <form onSubmit={handleSubmit} className="add-member-form">
          <div className="form-group">
            <label>Nome Completo</label>
            <input 
              type="text" 
              className="dark-input" 
              value={name} 
              onChange={(e) => setName(e.target.value)} 
              required 
              placeholder="es. Mario Rossi"
            />
          </div>
          
          <div className="form-group">
            <label>Email</label>
            <input 
              type="email" 
              className="dark-input" 
              value={email} 
              onChange={(e) => setEmail(e.target.value)} 
              required 
              placeholder="es. mario@email.com"
            />
          </div>

          <div className="form-group">
            <label>Password (Temporanea)</label>
            <input 
              type="text" 
              className="dark-input" 
              value={password} 
              onChange={(e) => setPassword(e.target.value)} 
              required 
              placeholder="es. FitPro2026!"
              minLength="6"
            />
            <span style={{fontSize: '0.8rem', color: 'var(--text-muted)'}}>Minimo 6 caratteri. Comunicala al cliente!</span>
          </div>

          <div className="form-group">
            <label>Telefono (Opzionale, utile per WhatsApp)</label>
            <input 
              type="tel" 
              className="dark-input" 
              value={phone} 
              onChange={(e) => setPhone(e.target.value)} 
              placeholder="es. +39 333 1234567"
            />
          </div>

          <div className="form-group">
            <label>Piano Abbonamento</label>
            <select 
              className="dark-select" 
              value={plan} 
              onChange={(e) => setPlan(e.target.value)}
            >
              {plans.map(p => (
                <option key={p.key} value={p.key}>{p.label}</option>
              ))}
            </select>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="primary-btn max-w" disabled={loading}>
              {loading ? 'Creazione in corso...' : 'Crea Membro'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
