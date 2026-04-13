import React from 'react';
import { Link } from 'react-router-dom';
import './Members.css';

export default function MembersList() {
  const members = [
    { id: 'M-001', name: 'Mario Rossi', email: 'mario.r@test.com', plan: 'Pro', status: 'Attivo', joinDate: '12 Gen 2026' },
    { id: 'M-002', name: 'Elisa Bianchi', email: 'elisa.b@test.com', plan: 'Basic', status: 'In Scadenza', joinDate: '05 Mar 2026' },
    { id: 'M-003', name: 'Luca Verdi', email: 'luca.v@test.com', plan: 'Pro', status: 'Inattivo', joinDate: '20 Nov 2025' },
    { id: 'M-004', name: 'Giulia Neri', email: 'giulia.n@test.com', plan: 'Basic', status: 'Attivo', joinDate: '10 Feb 2026' },
    { id: 'M-005', name: 'Andrea Brambilla', email: 'andrea.b@test.com', plan: 'Pro', status: 'Attivo', joinDate: '01 Apr 2026' },
  ];

  return (
    <div className="members-container">
      <div className="members-header">
        <div>
          <h1 className="title">Lista Membri</h1>
          <p className="subtitle">Gestisci gli iscritti al Fit Pro Lab</p>
        </div>
        <div className="table-actions">
          <input type="text" placeholder="Cerca membro..." className="search-input" />
          <button className="primary-btn">Aggiungi Membro</button>
        </div>
      </div>

      <div className="table-wrapper">
        <table className="members-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Nome</th>
              <th>Email</th>
              <th>Piano</th>
              <th>Iscrizione</th>
              <th>Stato</th>
              <th>Azioni</th>
            </tr>
          </thead>
          <tbody>
            {members.map(member => (
              <tr key={member.id}>
                <td className="text-muted">{member.id}</td>
                <td className="font-bold">{member.name}</td>
                <td>{member.email}</td>
                <td><span className="badge plan-badge">{member.plan}</span></td>
                <td className="text-muted">{member.joinDate}</td>
                <td>
                  <span className={`status-indicator ${member.status === 'Attivo' ? 'active' : member.status === 'In Scadenza' ? 'expiring' : 'inactive'}`}>
                    {member.status}
                  </span>
                </td>
                <td>
                  <Link to={`/admin/members/${member.id}`} className="icon-btn" title="Vedi Dettagli">👁️</Link>
                  <button className="icon-btn">✏️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
