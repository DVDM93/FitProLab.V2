import React from 'react';
import QRCode from 'react-qr-code';
import './CheckInModal.css';

export default function CheckInModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  const mockMemberId = "FITPRO-00123-MEMBER";

  return (
    <div className="modal-overlay">
      <div className="checkin-modal">
        <button className="close-btn" onClick={onClose}>✕</button>
        <h2 className="modal-title text-center">Il Tuo Check-in</h2>
        <p className="modal-subtitle text-center">Mostra questo codice al lettore all'ingresso o in segreteria.</p>
        
        <div className="qr-container">
          <div className="qr-wrapper">
            <QRCode 
              value={mockMemberId} 
              size={200}
              bgColor="#ffffff"
              fgColor="#000000"
            />
          </div>
          <p className="qr-text-id">ID: {mockMemberId}</p>
        </div>

        <button className="primary-btn full-width" onClick={onClose}>Fatto</button>
      </div>
    </div>
  );
}
