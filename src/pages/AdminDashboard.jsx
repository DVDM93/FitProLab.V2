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

function StatCard({ label, value, trend, trendType, isLoading }) {
  return (
    <div className={`stat-card ${trendType === 'alert' ? 'alert' : ''}`}>
      <h3 className="stat-label">{label}</h3>
      <p className="stat-value">{isLoading ? <span className="skeleton-val" /> : value}</p>
      {trend && <span className={`stat-trend ${trendType === 'positive' ? 'positive' : trendType === 'negative' ? 'negative' : ''}`}>{trend}</span>}
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState({
    activeMembers: null,
    todayCheckins: null,
    atRiskCount: null,
  });
  const [todayClasses, setTodayClasses] = useState([]);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split('T')[0];

  useEffect(() => {
    async function loadDashboard() {
      try {
        const [activeMembers, todayCheckins, atRiskMembers, classes, activity] = await Promise.all([
          getActiveMemberCount(),
          getTodayCheckInCount(),
          getAtRiskMembers(),
          getClassesForDate(today),
          getRecentActivity(5),
        ]);

        setStats({
          activeMembers,
          todayCheckins,
          atRiskCount: atRiskMembers.length,
        });
        setTodayClasses(classes);
        setRecentActivity(activity);
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

      <div className="stats-grid">
        <StatCard
          label="Membri Attivi Totali"
          value={stats.activeMembers ?? '—'}
          trend={stats.activeMembers !== null ? `${stats.activeMembers} iscritti attivi` : null}
          trendType="positive"
          isLoading={loading}
        />
        <StatCard
          label="Check-in di Oggi"
          value={stats.todayCheckins ?? '—'}
          isLoading={loading}
        />
        <StatCard
          label="Rischio Abbandono"
          value={stats.atRiskCount ?? '—'}
          trend={stats.atRiskCount !== null ? 'inattivi > 14 giorni' : null}
          trendType={stats.atRiskCount > 0 ? 'alert' : 'positive'}
          isLoading={loading}
        />
        <StatCard
          label="Classi Oggi"
          value={todayClasses.length || '—'}
          trend={todayClasses.length > 0 ? `${todayClasses.length} sessioni programmate` : 'Nessuna classe programmata'}
          trendType="positive"
          isLoading={loading}
        />
      </div>

      <div className="content-grid two-cols">
        <div className="card">
          <h3 className="card-title">Classi di Oggi</h3>
          {loading ? (
            <div className="loading-text">Caricamento...</div>
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
                      <p>Coach {cls.coach}</p>
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

        <div className="card">
          <h3 className="card-title">Attività Recenti</h3>
          {loading ? (
            <div className="loading-text">Caricamento...</div>
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
                    <span className="dot orange" />
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
  if (diffH < 24) return `${diffH} ora${diffH > 1 ? '' : ''} fa`;
  return `${Math.floor(diffH / 24)} gg fa`;
}
