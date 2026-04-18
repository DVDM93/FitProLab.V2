import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  getActiveMemberCount,
  getTodayCheckInCount,
  getAtRiskMembers,
  getClassesForDate,
  getRecentActivity,
} from '../services/firestoreService';
import './Dashboard.css';

function StatCard({ label, value, icon, trend, trendType, isLoading, linkTo }) {
  const content = (
    <div className={`stat-card ${trendType === 'alert' ? 'alert' : ''}`}>
      <div className="stat-header-row">
        <h3 className="stat-label">{label}</h3>
        {icon && <span className="stat-icon">{icon}</span>}
      </div>
      <p className="stat-value">{isLoading ? <span className="skeleton-val" /> : value}</p>
      {trend && (
        <span className={`stat-trend ${trendType === 'positive' ? 'positive' : trendType === 'negative' ? 'negative' : trendType === 'alert' ? 'negative' : ''}`}>
          {trend}
        </span>
      )}
    </div>
  );

  return linkTo ? <Link to={linkTo} style={{ textDecoration: 'none' }}>{content}</Link> : content;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeMembers: null,
    todayCheckins: null,
    atRiskCount: null,
  });
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [atRiskMembers, setAtRiskMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [activeMembers, todayCheckins, riskMembers, classes, activity] = await Promise.all([
          getActiveMemberCount(),
          getTodayCheckInCount(),
          getAtRiskMembers(),
          getClassesForDate(today),
          getRecentActivity(5),
        ]);

        setStats({
          activeMembers,
          todayCheckins,
          atRiskCount: riskMembers.length,
        });
        setTodayClasses(classes);
        setRecentActivity(activity);
        setAtRiskMembers(riskMembers.slice(0, 3));
      } catch (error) {
        console.error('Errore caricamento dashboard:', error);
      } finally {
        setLoading(false);
      }
    }

    loadDashboard();
  }, [today]);

  const todayLabel = new Date().toLocaleDateString('it-IT', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
  });

  return (
    <div className="dashboard-container">
      <div className="dashboard-header">
        <div>
          <h1 className="title">Panoramica</h1>
          <p className="subtitle">Bentornato — {todayLabel.charAt(0).toUpperCase() + todayLabel.slice(1)}</p>
        </div>
        <Link to="/admin/members">
          <button className="primary-btn">+ Gestisci Membri</button>
        </Link>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <StatCard
          label="Membri Attivi"
          icon="👥"
          value={stats.activeMembers ?? '—'}
          trend={stats.activeMembers !== null ? `${stats.activeMembers} iscritti attivi` : null}
          trendType="positive"
          isLoading={loading}
          linkTo="/admin/members"
        />
        <StatCard
          label="Check-in Oggi"
          icon="✅"
          value={stats.todayCheckins ?? '—'}
          trend={stats.todayCheckins === 0 ? 'Nessun check-in oggi' : `presenze registrate`}
          trendType={stats.todayCheckins > 0 ? 'positive' : null}
          isLoading={loading}
        />
        <StatCard
          label="Rischio Abbandono"
          icon="⚠️"
          value={stats.atRiskCount ?? '—'}
          trend={stats.atRiskCount !== null ? 'inattivi > 14 giorni' : null}
          trendType={stats.atRiskCount > 0 ? 'alert' : 'positive'}
          isLoading={loading}
          linkTo="/admin/members"
        />
        <StatCard
          label="Classi Oggi"
          icon="📅"
          value={todayClasses.length || (loading ? null : 0)}
          trend={todayClasses.length > 0 ? `${todayClasses.length} sessioni programmate` : 'Nessuna classe'}
          trendType="positive"
          isLoading={loading}
          linkTo="/admin/calendar"
        />
      </div>

      {/* Quick actions */}
      <div className="quick-actions-row">
        <Link to="/admin/calendar" className="quick-action-btn">
          <span>📅</span> Aggiungi Classe
        </Link>
        <Link to="/admin/members" className="quick-action-btn">
          <span>👥</span> Lista Membri
        </Link>
        <Link to="/admin/communications" className="quick-action-btn">
          <span>📣</span> Invia Messaggio
        </Link>
        <Link to="/admin/subscriptions" className="quick-action-btn">
          <span>💳</span> Abbonamenti
        </Link>
      </div>

      <div className="content-grid two-cols">
        {/* Classi di oggi */}
        <div className="card">
          <h3 className="card-title">Classi di Oggi</h3>
          {loading ? (
            <div className="class-list">
              {[1, 2].map((i) => (
                <div key={i} className="class-item">
                  <div className="skeleton-block" style={{ width: 60, height: 24, borderRadius: 4 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="skeleton-block" style={{ width: '50%', height: 16, borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ width: '30%', height: 12, borderRadius: 4 }} />
                  </div>
                </div>
              ))}
            </div>
          ) : todayClasses.length === 0 ? (
            <div className="empty-state">
              <p className="text-muted">Nessuna classe programmata per oggi.</p>
              <Link to="/admin/calendar">
                <button className="secondary-btn mt-4">Vai al Calendario</button>
              </Link>
            </div>
          ) : (
            <div className="class-list">
              {todayClasses.map((cls) => {
                const isFull = (cls.booked || 0) >= cls.capacity;
                const isAlmostFull = (cls.booked || 0) >= cls.capacity - 3 && !isFull;
                return (
                  <div className="class-item" key={cls.id}>
                    <div className="class-time">{cls.time}</div>
                    <div className="class-details">
                      <h4>{cls.title}</h4>
                      <p>Coach {cls.coach || '—'}</p>
                    </div>
                    <div className={`class-capacity ${isFull ? 'full' : isAlmostFull ? 'almost-full' : ''}`}>
                      {cls.booked || 0}/{cls.capacity}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Attività recenti */}
        <div className="card">
          <h3 className="card-title">Attività Recenti</h3>
          {loading ? (
            <ul className="activity-list">
              {[1, 2, 3].map((i) => (
                <li key={i}>
                  <div className="skeleton-block" style={{ width: 8, height: 8, borderRadius: '50%', marginTop: 6 }} />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <div className="skeleton-block" style={{ width: '70%', height: 14, borderRadius: 4 }} />
                    <div className="skeleton-block" style={{ width: '30%', height: 11, borderRadius: 4 }} />
                  </div>
                </li>
              ))}
            </ul>
          ) : recentActivity.length === 0 ? (
            <p className="text-muted">Nessuna attività recente.</p>
          ) : (
            <ul className="activity-list">
              {recentActivity.map((item) => {
                const timeAgo = item.createdAt?.toDate
                  ? getTimeAgo(item.createdAt.toDate())
                  : 'Recente';
                return (
                  <li key={item.id}>
                    <span className={`dot ${item.status === 'cancelled' ? 'gray' : 'orange'}`} />
                    <p>
                      <strong>{item.userName || 'Membro'}</strong>{' '}
                      {item.status === 'cancelled'
                        ? `ha cancellato ${item.classTitle || 'una classe'}`
                        : `ha prenotato ${item.classTitle || 'una classe'}`}
                    </p>
                    <span className="time">{timeAgo}</span>
                  </li>
                );
              })}
            </ul>
          )}

          {/* At-risk members mini-section */}
          {!loading && atRiskMembers.length > 0 && (
            <div className="at-risk-section">
              <h4 className="at-risk-title">⚠️ Richiedono attenzione</h4>
              {atRiskMembers.map((m) => (
                <Link key={m.id} to={`/admin/members/${m.id}`} className="at-risk-item">
                  <span className="at-risk-avatar">{(m.name || '?').charAt(0).toUpperCase()}</span>
                  <span className="at-risk-name">{m.name || m.email}</span>
                  <span className="at-risk-badge">inattivo</span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function getTimeAgo(date) {
  const now = new Date();
  const diffMs = now - date;
  const diffMin = Math.floor(diffMs / 60000);
  if (diffMin < 1) return 'Adesso';
  if (diffMin < 60) return `${diffMin} min fa`;
  const diffH = Math.floor(diffMin / 60);
  if (diffH < 24) return `${diffH}h fa`;
  return `${Math.floor(diffH / 24)} gg fa`;
}
