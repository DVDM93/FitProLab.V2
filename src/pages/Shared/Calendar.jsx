import React, { useState } from 'react';
import './Calendar.css';

export default function Calendar({ role }) {
  // role can be 'admin' or 'member'
  const [selectedWod, setSelectedWod] = useState(null);

  const schedule = [
    { id: 1, time: '07:00', type: 'CrossFit WOD', coach: 'Matt', capacity: 20, booked: 20 },
    { id: 2, time: '09:00', type: 'Weightlifting', coach: 'Sarah', capacity: 20, booked: 12 },
    { id: 3, time: '13:00', type: 'CrossFit WOD', coach: 'Matt', capacity: 20, booked: 18 },
    { id: 4, time: '17:00', type: 'Open Gym', coach: 'N/A', capacity: 30, booked: 5 },
    { id: 5, time: '18:00', type: 'CrossFit WOD', coach: 'Sarah', capacity: 20, booked: 20 },
    { id: 6, time: '19:00', type: 'Endurance', coach: 'Matt', capacity: 15, booked: 10 },
  ];

  const handleWodClick = (wod) => {
    setSelectedWod(wod);
  };

  const closeModal = () => setSelectedWod(null);

  return (
    <div className="calendar-container">
      <div className="calendar-header">
        <div>
          <h1 className="title">Calendario Corsi</h1>
          <p className="subtitle">{role === 'admin' ? 'Gestisci i WOD e visualizza le classi' : 'Scegli e prenota il tuo prossimo allenamento'}</p>
        </div>
        <div className="date-picker">
          <button className="secondary-btn">&lt;</button>
          <span className="current-date">Oggi, 13 Aprile 2026</span>
          <button className="secondary-btn">&gt;</button>
        </div>
      </div>

      <div className="schedule-grid">
        {schedule.map((wod) => {
          const isFull = wod.booked >= wod.capacity;
          const isAlmostFull = wod.booked >= wod.capacity - 3 && !isFull;

          return (
            <div 
              key={wod.id} 
              className={`schedule-card ${isFull ? 'full' : ''}`}
              onClick={() => handleWodClick(wod)}
            >
              <div className="time-col">
                <span className="time-text">{wod.time}</span>
              </div>
              <div className="details-col">
                <h3>{wod.type}</h3>
                <p>Coach: {wod.coach}</p>
              </div>
              <div className="capacity-col">
                <span className={`capacity-badge ${isFull ? 'badge-full' : isAlmostFull ? 'badge-warn' : 'badge-ok'}`}>
                  {wod.booked} / {wod.capacity}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {selectedWod && (
        <div className="modal-overlay">
          <div className="modal-content">
            <button className="close-btn" onClick={closeModal}>✕</button>
            <h2 className="modal-title">{selectedWod.type}</h2>
            <p className="modal-subtitle">{selectedWod.time} - Coach {selectedWod.coach}</p>
            
            <div className="modal-body">
              <div className="capacity-status">
                <strong>Posti occupati:</strong> {selectedWod.booked} / {selectedWod.capacity}
              </div>
              
              {role === 'member' ? (
                <div className="booking-actions">
                  <p className="rule-text">Puoi cancellare grauitamente fino a 2 ore prima dell'inizio del corso.</p>
                  <button 
                    className="primary-btn max-w" 
                    disabled={selectedWod.booked >= selectedWod.capacity}
                  >
                    {selectedWod.booked >= selectedWod.capacity ? 'Lista d\'Attesa' : 'Prenota Ora'}
                  </button>
                </div>
              ) : (
                <div className="admin-actions">
                  <button className="secondary-btn">Vedi Iscritti</button>
                  <button className="danger-btn">Cancella Classe</button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
