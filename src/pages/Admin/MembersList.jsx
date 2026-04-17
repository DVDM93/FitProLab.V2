import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { getAllMembers } from '../../services/firestoreService';
import './Members.css';

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [filterPlan, setFilterPlan] = useState('all');

  useEffect(() => {
    async function fetchMembers() {
      try {
        const data = await getAllMembers();
        setMembers(data);
      } catch (error) {
        console.error('Errore nel recuperare i membri:', error);
      } finally {
        setLoading(false);
      }
    }
    fetchMembers();
  }, []);

  const filtered = useMemo(() => {
    return members.filter((m) => {
      const matchesSearch =
        !search ||
        (m.name || '').toLowerCase().includes(search.toLowerCase()) ||
        (m.email || '').toLowerCase().includes(search.toLowerCase());

      const matchesStatus =
        filterStatus === 'all' || (m.status || 'Attivo') === filterStatus;

      const matchesPlan =
        filterPlan === 'all' || (m.plan || 'Basic') === filterPlan;

      return matchesSearch && matchesStatus && matchesPlan;
    });
  }, [members, search, filterStatus, filterPlan]);

  const plans = [...new Set(members.map((m) => m.plan || 'Basic'))];

  return (
    <div className="members-container">
      <div className="members-header">
        <div>
          <h1 className="title">Lista Membri</h1>
          <p className="subtitle">
            {loading ? 'Caricamento...' : `${filtered.length} di ${members.length} iscritti`}
          </p>
        </div>
      </div>

      <div className="table-toolbar">
        <div className="search-wrapper">
          <span className="search-icon-sm">🔍</span>
          <input
            type="text"
            placeholder="Cerca per nome o email..."
            className="search-input"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          {search && (
            <button className="clear-search" onClick={() => setSearch('')}>✕</button>
          )}
        </div>

        <div className="filter-group">
          <select
            className="filter-select"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="all">Tutti gli stati</option>
            <option value="Attivo">Attivo</option>
            <option value="In Scadenza">In Scadenza</option>
            <option value="Inattivo">Inattivo</option>
          </select>

          <select
            className="filter-select"
            value={filterPlan}
            onChange={(e) => setFilterPlan(e.target.value)}
          >
            <option value="all">Tutti i piani</option>
            {plans.map((p) => (
              <option key={p} value={p}>{p}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="members-table">
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Piano</th>
              <th>Iscrizione</th>
              <th>Ultimo Check-in</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              Array.from({ length: 5 }).map((_, i) => (
                <tr key={i}>
                  {Array.from({ length: 7 }).map((_, j) => (
                    <td key={j}><span className="table-skeleton" /></td>
                  ))}
                </tr>
              ))
            ) : filtered.length === 0 ? (
              <tr>
                <td colSpan="7" className="empty-table-msg">
                  {members.length === 0
                    ? 'Nessun membro trovato. Aggiungine uno dalla console Firebase.'
                    : 'Nessun risultato per la ricerca.'}
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr key={member.id}>
                  <td className="font-bold">{member.name || '—'}</td>
                  <td className="text-muted">{member.email}</td>
                  <td>
                    <span className={`plan-badge plan-${(member.plan || 'Basic').toLowerCase().replace(/\s/g, '-')}`}>
                      {member.plan || 'Basic'}
                    </span>
                  </td>
                  <td className="text-muted">
                    {member.joinDate
                      ? new Date(member.joinDate).toLocaleDateString('it-IT')
                      : '—'}
                  </td>
                  <td className="text-muted">
                    {member.lastCheckIn
                      ? new Date(member.lastCheckIn).toLocaleDateString('it-IT')
                      : <span className="no-checkin">Mai</span>}
                  </td>
                  <td>
                    <span
                      className={`status-indicator ${
                        member.status === 'Attivo'
                          ? 'active'
                          : member.status === 'In Scadenza'
                          ? 'expiring'
                          : 'inactive'
                      }`}
                    >
                      {member.status || 'Attivo'}
                    </span>
                  </td>
                  <td>
                    <Link
                      to={`/admin/members/${member.id}`}
                      className="icon-btn"
                      title="Vedi Dettagli"
                    >
                      👁️
                    </Link>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
