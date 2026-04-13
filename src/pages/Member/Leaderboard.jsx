import React, { useState } from 'react';
import './Leaderboard.css';

export default function Leaderboard() {
  const [exercise, setExercise] = useState('fran');

  const leaderboards = {
    fran: [
      { rank: 1, name: 'Andrea Brambilla', stat: '03:12' },
      { rank: 2, name: 'Mario Rossi', stat: '03:45' },
      { rank: 3, name: 'Giulia Neri', stat: '04:10' },
      { rank: 4, name: 'Luca Verdi', stat: '05:22' },
      { rank: 5, name: 'Tu', stat: '05:40' },
    ],
    backsquat: [
      { rank: 1, name: 'Luca Verdi', stat: '160 kg' },
      { rank: 2, name: 'Andrea Brambilla', stat: '145 kg' },
      { rank: 3, name: 'Mario Rossi', stat: '120 kg' },
      { rank: 4, name: 'Tu', stat: '120 kg' },
    ]
  };

  const currentBoard = leaderboards[exercise] || [];

  return (
    <div className="leaderboard-container">
      <div className="leaderboard-header">
        <div>
          <h1 className="title">Classifica del Box 🏆</h1>
          <p className="subtitle">Confronta i tuoi PR con gli altri membri e scala la vetta.</p>
        </div>
      </div>

      <div className="leaderboard-filters">
        <button 
          className={`filter-btn ${exercise === 'fran' ? 'active' : ''}`}
          onClick={() => setExercise('fran')}
        >WOD "FRAN"</button>
        <button 
          className={`filter-btn ${exercise === 'backsquat' ? 'active' : ''}`}
          onClick={() => setExercise('backsquat')}
        >1RM Back Squat</button>
      </div>

      <div className="board-card card">
        <table className="board-table">
          <thead>
            <tr>
              <th width="80">Pos</th>
              <th>Atleta</th>
              <th className="text-right">Risultato</th>
            </tr>
          </thead>
          <tbody>
            {currentBoard.map((row) => (
              <tr key={row.rank} className={row.name === 'Tu' ? 'highlight-row' : ''}>
                <td>
                  <span className={`rank-badge rank-${row.rank}`}>{row.rank}</span>
                </td>
                <td className="athlete-name">
                  {row.name}
                  {row.rank === 1 && <span className="crown">👑</span>}
                </td>
                <td className="text-right stat-value">{row.stat}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
