import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../config/firebase';
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [confirmEmail, setConfirmEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup, logout } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        const userCredential = await login(email, password);
        
        const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
        const role = userDoc.exists() ? userDoc.data().role : 'member';
        
        if (!userCredential.user.emailVerified && role !== 'admin') {
          await logout();
          setError("Devi verificare l'email prima di poter accedere. Controlla la tua casella di posta.");
          setLoading(false);
          return;
        }
        
        navigate('/');
      } else {
        if (email !== confirmEmail) {
          setError('Le email inserite non coincidono.');
          setLoading(false);
          return;
        }
        if (!privacyAccepted) {
          setError('Devi accettare la Privacy Policy per registrarti.');
          setLoading(false);
          return;
        }
        await signup(email, password, name);
        alert("Registrazione completata! Ti abbiamo inviato un'email con il link di verifica.\\n\\nControlla la tua casella di posta (anche nella cartella Spam).");
        
        setIsLogin(true);
        setPassword('');
        setConfirmEmail('');
      }
    } catch (err) {
      console.error(err);
      setError('Operazione fallita. Controlla le credenziali.');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-logo-container">
          <img src="/src/assets/logo.png" alt="Fit Pro Lab Logo" className="logo-image" />
          <h1 className="login-logo">FIT PRO<span className="text-orange"></span> LAB</h1>
        </div>
        <h2 className="login-title">{isLogin ? 'Accedi al tuo account' : 'Crea un nuovo account'}</h2>

        {error && <div className="login-error">{error}</div>}

        <form onSubmit={handleSubmit} className="login-form">
          {!isLogin && (
            <div className="form-group">
              <label>Nome Completo</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Mario Rossi"
              />
            </div>
          )}

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="mario@email.com"
            />
          </div>

          {!isLogin && (
            <div className="form-group">
              <label>Conferma Email</label>
              <input
                type="email"
                value={confirmEmail}
                onChange={(e) => setConfirmEmail(e.target.value)}
                required
                placeholder="Conferma la tua email"
              />
            </div>
          )}

          <div className="form-group">
            <label>Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              placeholder="Minimo 6 caratteri"
            />
          </div>

          {!isLogin && (
            <div className="form-group" style={{ flexDirection: 'row', alignItems: 'flex-start', gap: '10px', marginTop: '12px' }}>
              <input
                type="checkbox"
                id="privacy"
                checked={privacyAccepted}
                onChange={(e) => setPrivacyAccepted(e.target.checked)}
                required
                style={{ width: 'auto', marginTop: '2px', cursor: 'pointer' }}
              />
              <label htmlFor="privacy" style={{ fontSize: '13px', color: '#ccc', textTransform: 'none', margin: 0, letterSpacing: 'normal', lineHeight: '1.4', cursor: 'pointer' }}>
                Dichiaro di aver letto e accettato la <a href="#" style={{ color: 'var(--color-orange)', textDecoration: 'underline' }}>Privacy Policy</a> e i Termini di Servizio.
              </label>
            </div>
          )}

          <button disabled={loading} type="submit" className="login-btn">
            {loading ? 'Attendere...' : (isLogin ? 'Accedi' : 'Registrati')}
          </button>
        </form>

        <div className="login-toggle">
          {isLogin ? 'Non hai un account? ' : 'Hai già un account? '}
          <button type="button" onClick={() => setIsLogin(!isLogin)} className="toggle-btn">
            {isLogin ? 'Registrati' : 'Accedi'}
          </button>
        </div>
      </div>
    </div>
  );
}
