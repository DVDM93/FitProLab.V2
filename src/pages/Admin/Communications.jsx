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
import { getAllMembers, getAtRiskMembers } from '../../services/firestoreService';
import './Communications.css';

const CHANNEL_OPTIONS = [
  { key: 'email', label: '✉️ E-Mail' },
  { key: 'whatsapp', label: '💬 WhatsApp' },
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
  const [whatsappLinks, setWhatsappLinks] = useState([]);

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
      
      let recipients = [];
      if (target === 'all') {
        recipients = await getAllMembers();
      } else if (target === 'expiring') {
        const all = await getAllMembers();
        const now = new Date();
        const nextWeek = new Date();
        nextWeek.setDate(now.getDate() + 7);
        recipients = all.filter(m => {
          if (!m.expirationDate) return false;
          const ed = new Date(m.expirationDate);
          return ed >= now && ed <= nextWeek;
        });
      } else if (target === 'churn') {
        recipients = await getAtRiskMembers();
      }

      if (channel === 'email') {
        const emails = recipients.map(r => r.email).filter(Boolean).join(',');
        if (emails) {
          window.location.href = `mailto:?bcc=${emails}&subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(message)}`;
        } else {
          showFeedback('error', 'Nessuna email trovata per questo gruppo.');
          setSending(false);
          return;
        }
      } else if (channel === 'whatsapp') {
        const links = recipients.filter(r => r.phone).map(r => {
          let phoneStr = r.phone.replace(/[^0-9]/g, '');
          if (phoneStr && !phoneStr.startsWith('39') && phoneStr.length <= 10) {
            phoneStr = '39' + phoneStr;
          }
          return {
            id: r.id,
            name: r.name || r.email,
            url: `https://wa.me/${phoneStr}?text=${encodeURIComponent(message)}`
          };
        });
        
        if (links.length > 0) {
          setWhatsappLinks(links);
          showFeedback('success', `Generati ${links.length} link WhatsApp.`);
        } else {
          showFeedback('error', 'Nessun numero di telefono trovato.');
          setSending(false);
          return;
        }
      }

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

      // Reset form if email (whatsapp needs the links visible)
      if (channel === 'email') {
        setSubject('');
        setMessage('');
      }
      const channelLabel = channel === 'email' ? 'E-Mail' : 'WhatsApp';
      showFeedback('success', `${channelLabel} inviata a "${targetLabel}" ✓`);
    } catch (err) {
      console.error('Errore invio campagna:', err);
      showFeedback('error', 'Errore nell\'invio. Riprova.');
    } finally {
      setSending(false);
    }
  }

  const channelLabel = channel === 'email' ? 'E-Mail' : 'WhatsApp';

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
              {sending ? 'Elaborazione in corso...' : `Invia / Genera Link ${channelLabel}`}
            </button>
          </form>

          {whatsappLinks.length > 0 && channel === 'whatsapp' && (
            <div style={{ marginTop: '24px', padding: '16px', backgroundColor: 'var(--bg-lighter)', borderRadius: '8px' }}>
              <h4 style={{ marginBottom: '12px' }}>Link WhatsApp Generati</h4>
              <p className="text-muted" style={{ marginBottom: '16px', fontSize: '0.9rem' }}>
                Clicca su ciascun nome per aprire WhatsApp e inviare il messaggio.
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {whatsappLinks.map(link => (
                  <a
                    key={link.id}
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="secondary-btn"
                    style={{ textAlign: 'left', display: 'flex', justifyContent: 'space-between' }}
                    onClick={(e) => {
                      e.currentTarget.style.opacity = '0.5';
                    }}
                  >
                    <span>{link.name}</span>
                    <span>Invia ↗</span>
                  </a>
                ))}
              </div>
            </div>
          )}
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
                      {c.channel === 'email' ? '✉️' : '💬'}
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
