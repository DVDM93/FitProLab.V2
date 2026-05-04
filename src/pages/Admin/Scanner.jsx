import React, { useState } from 'react';
import { Scanner as QRReader } from '@yudiel/react-qr-scanner';
import { getUpcomingBooking, confirmCheckIn, getUserData } from '../../services/firestoreService';
import './Scanner.css';

export default function Scanner() {
  const [scanResult, setScanResult] = useState(null);
  const [loading, setLoading] = useState(false);
  const [scannerActive, setScannerActive] = useState(true);

  async function handleScan(detectedCodes) {
    if (!detectedCodes || detectedCodes.length === 0 || loading) return;
    
    const text = detectedCodes[0].rawValue;
    if (!text.startsWith('FITPROLAB:CHECKIN:')) {
      showResult('error', 'QR Code non valido. Assicurati che sia il QR di FitProLab.');
      return;
    }

    const userId = text.split(':')[2];
    if (!userId || userId === 'UNKNOWN') {
      showResult('error', 'ID utente non trovato nel QR.');
      return;
    }

    setLoading(true);
    setScannerActive(false);

    try {
      const user = await getUserData(userId);
      if (!user) {
        showResult('error', 'Utente non trovato nel database.');
        return;
      }

      const today = new Date().toISOString().split('T')[0];
      const booking = await getUpcomingBooking(userId);

      if (!booking || booking.date !== today) {
        showResult('error', `Nessuna prenotazione per oggi per ${user.name || 'questo utente'}.`);
        return;
      }

      if (booking.status === 'checked_in') {
        showResult('error', `${user.name} ha già effettuato il check-in per la classe delle ${booking.time}.`);
        return;
      }

      // Procedi con il check-in
      await confirmCheckIn(booking.id, userId);
      showResult('success', `Check-in confermato per ${user.name} (Classe: ${booking.time})!`);
    } catch (err) {
      console.error('Errore durante la scansione:', err);
      showResult('error', 'Si è verificato un errore durante il check-in.');
    } finally {
      setLoading(false);
    }
  }

  function showResult(type, msg) {
    setScanResult({ type, msg });
    setTimeout(() => {
      setScanResult(null);
      setScannerActive(true);
    }, 4000);
  }

  return (
    <div className="scanner-container">
      <div className="scanner-header">
        <h1 className="title">Scanner Check-in 📱</h1>
        <p className="text-muted">Inquadra il QR Code del membro per confermare la sua presenza.</p>
      </div>

      <div className="scanner-box">
        {scannerActive ? (
          <div className="scanner-viewport">
            <QRReader
              onScan={handleScan}
              onError={(error) => console.log(error?.message)}
              scanDelay={500}
            />
            <div className="scanner-overlay"></div>
          </div>
        ) : (
          <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="text-muted">{loading ? 'Elaborazione in corso...' : 'In pausa...'}</p>
          </div>
        )}
      </div>

      {scanResult && (
        <div className={`scan-result-card ${scanResult.type}`}>
          <span className="result-icon">
            {scanResult.type === 'success' ? '✅' : '❌'}
          </span>
          <p className="result-msg">{scanResult.msg}</p>
          <button className="secondary-btn mt-4" onClick={() => { setScanResult(null); setScannerActive(true); }}>
            Scansiona un altro
          </button>
        </div>
      )}
    </div>
  );
}
