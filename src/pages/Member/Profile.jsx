import React, { useState, useEffect } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { updateMember, uploadUserDocument } from '../../services/firestoreService';
import './Profile.css';

export default function Profile() {
  const { currentUser, userData, refreshUserData } = useAuth();
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
  });
  const [savingInfo, setSavingInfo] = useState(false);
  const [uploadingMed, setUploadingMed] = useState(false);
  const [uploadingId, setUploadingId] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    if (userData) {
      setFormData({
        name: userData.name || '',
        phone: userData.phone || '',
      });
    }
  }, [userData]);

  function showToast(type, msg) {
    setToast({ type, msg });
    setTimeout(() => setToast(null), 3000);
  }

  async function handleSaveInfo(e) {
    e.preventDefault();
    setSavingInfo(true);
    try {
      await updateMember(currentUser.uid, {
        name: formData.name,
        phone: formData.phone,
      });
      await refreshUserData(currentUser.uid);
      showToast('success', 'Profilo aggiornato con successo.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Errore durante l\'aggiornamento.');
    } finally {
      setSavingInfo(false);
    }
  }

  async function handleFileUpload(e, type) {
    const file = e.target.files[0];
    if (!file) return;

    if (type === 'medical_certificate') setUploadingMed(true);
    else setUploadingId(true);

    try {
      await uploadUserDocument(currentUser.uid, file, type);
      await refreshUserData(currentUser.uid);
      showToast('success', 'Documento caricato con successo.');
    } catch (err) {
      console.error(err);
      showToast('error', 'Errore durante il caricamento del file.');
    } finally {
      if (type === 'medical_certificate') setUploadingMed(false);
      else setUploadingId(false);
    }
  }

  if (!userData) return <div className="p-8">Caricamento...</div>;

  return (
    <div className="profile-container">
      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.msg}
        </div>
      )}

      <div className="profile-header">
        <h1 className="title">Il Mio Profilo</h1>
        <p className="subtitle">Gestisci le tue informazioni e documenti.</p>
      </div>

      <div className="profile-grid">
        {/* Informazioni Base */}
        <div className="card profile-card">
          <h2 className="card-title-sm mb-4">Informazioni Base</h2>
          <form className="profile-form" onSubmit={handleSaveInfo}>
            <div className="form-field">
              <label>Nome Completo</label>
              <input 
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                required
              />
            </div>
            <div className="form-field">
              <label>Email (Non modificabile)</label>
              <input value={userData.email} disabled />
            </div>
            <div className="form-field">
              <label>Telefono</label>
              <input 
                value={formData.phone}
                onChange={(e) => setFormData({...formData, phone: e.target.value})}
                placeholder="+39 333 1234567"
              />
            </div>
            <button type="submit" className="primary-btn mt-4" disabled={savingInfo}>
              {savingInfo ? 'Salvataggio...' : '💾 Salva Modifiche'}
            </button>
          </form>
        </div>

        <div className="profile-side">
          {/* Privacy Consent */}
          <div className="card profile-card border-orange">
            <h2 className="card-title-sm mb-4">Consensi</h2>
            <div className="privacy-consent-box">
              {/* Force true visual state if they exist as a user, assuming implicitly agreed as per requirement */}
              <input type="checkbox" checked={userData.privacyConsent !== false} disabled className="privacy-checkbox"/>
              <label className="privacy-label">
                <strong>Consenso Privacy Accettato</strong> in fase di registrazione. <br/>
                <em>(Non modificabile)</em>
              </label>
            </div>
          </div>

          {/* Document Uploads */}
          <div className="card profile-card mt-6">
            <h2 className="card-title-sm mb-4">I Miei Documenti</h2>
            
            <div className="doc-upload-row">
              <div className="doc-info">
                <h4>Certificato Medico</h4>
                {userData.medical_certificate ? (
                  <a href={userData.medical_certificate} target="_blank" rel="noreferrer" className="text-orange">
                    Vedi Certificato Caricato
                  </a>
                ) : (
                  <span className="text-muted">Nessun file caricato</span>
                )}
              </div>
              <div className="doc-action">
                <label className="secondary doc-upload-btn" aria-disabled={uploadingMed}>
                  {uploadingMed ? 'Caricamento...' : 'Carica'}
                  <input 
                    type="file" 
                    hidden 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={(e) => handleFileUpload(e, 'medical_certificate')} 
                    disabled={uploadingMed} 
                  />
                </label>
              </div>
            </div>

            <hr className="doc-divider" />

            <div className="doc-upload-row">
              <div className="doc-info">
                <h4>Documento d'Identità</h4>
                {userData.id_document ? (
                  <a href={userData.id_document} target="_blank" rel="noreferrer" className="text-orange">
                    Vedi Documento Caricato
                  </a>
                ) : (
                  <span className="text-muted">Nessun file caricato</span>
                )}
              </div>
              <div className="doc-action">
                <label className="secondary doc-upload-btn" aria-disabled={uploadingId}>
                  {uploadingId ? 'Caricamento...' : 'Carica'}
                  <input 
                    type="file" 
                    hidden 
                    accept=".pdf,.jpg,.jpeg,.png" 
                    onChange={(e) => handleFileUpload(e, 'id_document')} 
                    disabled={uploadingId} 
                  />
                </label>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
