import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { collection, getDocs, query, where } from 'firebase/firestore';
import { db } from '../../config/firebase';
import './Members.css';

export default function MembersList() {
  const [members, setMembers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchMembers() {
      try {
        // Only fetch users that are 'member'
        const q = query(collection(db, 'users'), where('role', '==', 'member'));
        const querySnapshot = await getDocs(q);
        const membersData = [];
        querySnapshot.forEach((doc) => {
          membersData.push({ id: doc.id, ...doc.data() });
        });
        setMembers(membersData);
      } catch (error) {
        console.error("Errore nel recuperare i membri:", error);
      } finally {
        setLoading(false);
      }
    }

    fetchMembers();
  }, []);

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
            {loading ? (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Caricamento...</td></tr>
            ) : members.length === 0 ? (
              <tr><td colSpan="7" style={{textAlign: 'center', padding: '20px'}}>Nessun membro trovato. Registra il primo membro!</td></tr>
            ) : (
              members.map(member => (
                <tr key={member.id}>
                  <td className="text-muted" title={member.id}>{member.id.substring(0, 6)}...</td>
                  <td className="font-bold">{member.name || 'Utente senza nome'}</td>
                  <td>{member.email}</td>
                  <td><span className="badge plan-badge">{member.plan || 'N/A'}</span></td>
                  <td className="text-muted">{member.joinDate ? new Date(member.joinDate).toLocaleDateString() : 'N/A'}</td>
                  <td>
                    <span className={`status-indicator ${member.status === 'Attivo' ? 'active' : member.status === 'In Scadenza' ? 'expiring' : 'inactive'}`}>
                      {member.status || 'Attivo'}
                    </span>
                  </td>
                  <td>
                    <Link to={`/admin/members/${member.id}`} className="icon-btn" title="Vedi Dettagli">👁️</Link>
                    <button className="icon-btn">✏️</button>
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
