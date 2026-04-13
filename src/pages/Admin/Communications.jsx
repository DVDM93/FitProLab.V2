import React, { useState } from 'react';
import './Communications.css';

export default function Communications() {
  const [channel, setChannel] = useState('email');
  const [target, setTarget] = useState('all');

  return (
    <div className="communications-container">
      <div className="comms-header">
        <div>
          <h1 className="title">Centro Comunicazioni</h1>
          <p className="subtitle">Invia messaggi, notifiche push ed email ai membri.</p>
        </div>
      </div>

      <div className="comms-grid">
        <div className="card editor-card">
          <h3 className="card-title">Nuovo Messaggio</h3>
          
          <div className="form-group">
            <label>Canale di invio</label>
            <div className="channel-selector">
              <button 
                className={`channel-btn ${channel === 'email' ? 'active' : ''}`}
                onClick={() => setChannel('email')}
              >✉️ E-Mail</button>
              <button 
                className={`channel-btn ${channel === 'push' ? 'active' : ''}`}
                onClick={() => setChannel('push')}
              >🔔 Notifica Push</button>
              <button 
                className={`channel-btn ${channel === 'sms' ? 'active' : ''}`}
                onClick={() => setChannel('sms')}
              >📱 SMS</button>
            </div>
          </div>

          <div className="form-group">
            <label>Destinatari</label>
            <select className="dark-select" value={target} onChange={(e) => setTarget(e.target.value)}>
              <option value="all">Tutti i Membri Attivi (248)</option>
              <option value="expiring">Membri in Scadenza (18)</option>
              <option value="churn">A Rischio Abbandono (12)</option>
              <option value="custom">Selezione Manuale...</option>
            </select>
          </div>

          {channel === 'email' && (
            <div className="form-group">
              <label>Oggetto</label>
              <input type="text" className="dark-input" placeholder="Oggetto della mail..." />
            </div>
          )}

          <div className="form-group">
            <label>Messaggio</label>
            <textarea className="dark-textarea" rows="6" placeholder="Scrivi qui il tuo messaggio..."></textarea>
          </div>

          <button className="primary-btn max-w mt-4">Invia {channel === 'email' ? 'E-Mail' : channel === 'push' ? 'Notifica' : 'SMS'} Ora</button>
        </div>

        <div className="card history-card">
          <h3 className="card-title">Campagne Recenti</h3>
          <ul className="campaign-list">
            <li>
              <div className="campaign-info">
                <h4>Promozione Rinnovo Estivo</h4>
                <p>E-mail inviata a <strong>In Scadenza</strong></p>
              </div>
              <div className="campaign-stats text-muted">
                Ieri • 18 inviate
              </div>
            </li>
            <li>
              <div className="campaign-info">
                <h4>Avviso Chiusura Palestra 25/04</h4>
                <p>Notifica Push a <strong>Tutti</strong></p>
              </div>
              <div className="campaign-stats text-muted">
                10 Apr • 248 inviate
              </div>
            </li>
            <li>
              <div className="campaign-info">
                <h4>Ci manchi! Torna ad allenarti</h4>
                <p>SMS inviato a <strong>Rischio Abbandono</strong></p>
              </div>
              <div className="campaign-stats text-muted">
                02 Apr • 12 inviati
              </div>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
