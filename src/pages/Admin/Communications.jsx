import React, { useState, useEffect } from 'react';
import {
  collection,
  addDoc,
  getDocs,
  query,
  orderBy,
  limit,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Communications.css';

const CHANNEL_OPTIONS = [
  { key: 'email', label: '✉️ E-Mail' },
  { key: 'push', label: '🔔 Push' },
  { key: 'sms', label: '📱 SMS' },
];

const TARGET_OPTIONS = [
  { value: 'all', label: 'Tutti i Membri Attivi' },
  { value: 'expiring', label: 'Membri in Scadenza' },
  { value: 'churn', label: 'A Rischio Abbandono' },
];

function timeAgo(ts) {
  if (!ts?.toDate) return 'Recente';
  const diff = Math.floor((Date.now() - ts.toDate()) / 60000);
  if (diff < 1) return 'Adesso';
  if (diff < 60) return `${diff} min fa`;
  const h = Math.floor(diff / 60);
  if (h < 24) return `${h} ora fa`;
  return `${Math.floor(h / 24)} gg fa`;
}

const BORDER_COLORS = ['var(--color-magenta)', 'var(--color-orange)', '#00cc66', '#a855f7', '#38bdf8'];

export default function Communications() {
  const [channel, setChannel] = useState('email');
  const [target, setTarget] = useState('all');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const [campaigns, setCampaigns] = useState([]);
  const [loadingCampaigns, setLoadingCampaigns] = useState(true);
  const [feedback, setFeedback] = useState(null);

  // Load recent campaigns
  useEffect(() => {
    async function loadCampaigns() {
      try {
        const q = query(
          collection(db, 'campaigns'),
          orderBy('sentAt', 'desc'),
          limit(10)
        );
        const snap = await getDocs(q);
        setCampaigns(snap.docs.map((d) => ({ id: d.id, ...d.data() })));
      } catch (err) {
        console.error('Errore caricamento campagne:', err);
      } finally {
        setLoadingCampaigns(false);
      }
    }
    loadCampaigns();
  }, []);

  function showFeedback(type, msg) {
    setFeedback({ type, msg });
    setTimeout(() => setFeedback(null), 3500);
  }

  async function handleSend(e) {
    e.preventDefault();
    if (!message.trim()) return;
    setSending(true);
    try {
      const targetLabel = TARGET_OPTIONS.find((t) => t.value === target)?.label || target;
      const newCampaign = {
        channel,
        target,
        targetLabel,
        subject: channel === 'email' ? subject : null,
        message,
        sentAt: serverTimestamp(),
      };
      const docRef = await addDoc(collection(db, 'campaigns'), newCampaign);

      // Optimistic update for UI
      setCampaigns((prev) => [
        { id: docRef.id, ...newCampaign, sentAt: { toDate: () => new Date() } },
        ...prev,
      ]);

      // Reset form
      setSubject('');
      setMessage('');
      const channelLabel = channel === 'email' ? 'E-Mail' : channel === 'push' ? 'Notifica Push' : 'SMS';
      showFeedback('success', `${channelLabel} inviata a "${targetLabel}" ✓`);
    } catch (err) {
      console.error('Errore invio campagna:', err);
      showFeedback('error', 'Errore nell\'invio. Riprova.');
    } finally {
      setSending(false);
    }
  }

  const channelLabel = channel === 'email' ? 'E-Mail' : channel === 'push' ? 'Notifica' : 'SMS';

  return (
    <div className="communications-container">
      {/* Toast */}
      {feedback && (
        <div className={`comms-toast comms-toast-${feedback.type}`}>{feedback.msg}</div>
      )}

      <div className="comms-header">
        <div>
          <h1 className="title">Centro Comunicazioni</h1>
          <p className="subtitle">Invia messaggi, notifiche push ed email ai membri.</p>
        </div>
      </div>

      <div className="comms-grid">
        {/* Editor */}
        <div className="card editor-card">
          <h3 className="card-title">Nuovo Messaggio</h3>

          <form onSubmit={handleSend}>
            <div className="form-group">
              <label>Canale di invio</label>
              <div className="channel-selector">
                {CHANNEL_OPTIONS.map((c) => (
                  <button
                    type="button"
                    key={c.key}
                    className={`channel-btn ${channel === c.key ? 'active' : ''}`}
                    onClick={() => setChannel(c.key)}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="form-group">
              <label>Destinatari</label>
              <select
                className="dark-select"
                value={target}
                onChange={(e) => setTarget(e.target.value)}
              >
                {TARGET_OPTIONS.map((t) => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>

            {channel === 'email' && (
              <div className="form-group">
                <label>Oggetto</label>
                <input
                  type="text"
                  className="dark-input"
                  placeholder="Oggetto della mail..."
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                  required={channel === 'email'}
                />
              </div>
            )}

            <div className="form-group">
              <label>Messaggio</label>
              <textarea
                className="dark-textarea"
                rows="6"
                placeholder="Scrivi qui il tuo messaggio..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                required
              />
              <span className="char-count">{message.length} caratteri</span>
            </div>

            <button
              type="submit"
              className="primary-btn max-w"
              disabled={sending || !message.trim()}
            >
              {sending ? 'Invio in corso...' : `Invia ${channelLabel} Ora`}
            </button>
          </form>
        </div>

        {/* History */}
        <div className="card history-card">
          <h3 className="card-title">Campagne Recenti</h3>
          {loadingCampaigns ? (
            <div className="campaigns-loading">
              {[1, 2, 3].map((i) => (
                <div key={i} className="campaign-skeleton">
                  <div className="skeleton-line tall" />
                  <div className="skeleton-line short" />
                </div>
              ))}
            </div>
          ) : campaigns.length === 0 ? (
            <p className="text-muted" style={{ padding: '16px 0' }}>
              Nessuna campagna inviata ancora.
            </p>
          ) : (
            <ul className="campaign-list">
              {campaigns.map((c, idx) => (
                <li key={c.id} style={{ borderLeftColor: BORDER_COLORS[idx % BORDER_COLORS.length] }}>
                  <div className="campaign-info">
                    <div className="campaign-channel-tag">
                      {c.channel === 'email' ? '✉️' : c.channel === 'push' ? '🔔' : '📱'}
                      <span>{c.channel.toUpperCase()}</span>
                    </div>
                    <h4>{c.subject || c.message?.slice(0, 50) + (c.message?.length > 50 ? '…' : '')}</h4>
                    <p>
                      A <strong>{c.targetLabel || c.target}</strong>
                    </p>
                  </div>
                  <div className="campaign-stats text-muted">
                    {timeAgo(c.sentAt)}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
