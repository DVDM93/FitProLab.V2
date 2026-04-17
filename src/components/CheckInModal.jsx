import React from 'react';
import QRCode from 'react-qr-code';
import { useAuth } from '../contexts/AuthContext';
import './CheckInModal.css';

export default function CheckInModal({ isOpen, onClose }) {
  const { currentUser, userData } = useAuth();

  if (!isOpen) return null;

  // Use real user UID for QR — staff scans this to register check-in
  const qrValue = currentUser?.uid
    ? `FITPROLAB:CHECKIN:${currentUser.uid}`
    : 'FITPROLAB:CHECKIN:UNKNOWN';

  const shortId = currentUser?.uid?.slice(0, 8).toUpperCase() || '—';
  const memberName = userData?.name || currentUser?.email || 'Membro';

  return (
    <div className="modal-overlay" onClick={(e) => e.target === e.currentTarget && onClose()}>
      <div className="checkin-modal">
        <button className="close-btn" onClick={onClose}>✕</button>

        <div className="checkin-header">
          <h2 className="modal-title">Check-in 📱</h2>
          <p className="checkin-name">{memberName}</p>
        </div>

        <p className="modal-subtitle">
          Mostra questo codice al lettore all'ingresso o in segreteria.
        </p>

        <div className="qr-container">
          <div className="qr-wrapper">
            <QRCode
              value={qrValue}
              size={210}
              bgColor="#ffffff"
              fgColor="#0b0b0b"
              level="M"
            />
          </div>
          <p className="qr-text-id">ID: {shortId}</p>
          {userData?.plan && (
            <span className="qr-plan-badge">{userData.plan}</span>
          )}
        </div>

        <button className="primary-btn full-width" onClick={onClose}>
          ✓ Fatto
        </button>
      </div>
    </div>
  );
}
