import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import './Login.css';

export default function Login() {
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, signup } = useAuth();
  const navigate = useNavigate();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isLogin) {
        await login(email, password);
        // Navigation is handled by App.jsx useEffect or we can force here:
        // Wait, AuthContext will update, Protected routes will handle redirection
        // but it's simpler to navigate here
        // Actually, let's let the onAuthStateChanged trigger an App re-render.
      } else {
        await signup(email, password, name);
      }
      navigate('/');
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
          <h1 className="login-logo">FIT <span className="text-orange">PRO</span> LAB</h1>
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
