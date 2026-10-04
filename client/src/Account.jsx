import { useState } from 'react';
import axios from 'axios';
import './Auth.css';

function Account({ user, onBackHome, onNavigateGroups, onNavigateFavorites, onAccountDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  const handleDelete = async () => { //KÄYTTÄJÄTILIN POISTO BACKENDIN KAUTTA
    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('token'); //HAETAAN TOKEN TUNNISTAUTUMISTA VARTEN
      //TILIN POISTOPYYNTÖ BACKENDIIN
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onAccountDeleted(); //ILMOITA ONNISTUNUT POISTO
    } catch (err) {
      setError(err.response?.data?.error || 'Tilin poisto epäonnistui');
      setDeleting(false);
    }
  };

  return (
    <div className="auth-page">
      <button type="button" className="auth-back" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <div className="auth-card">
        <div className="auth-sprockets" aria-hidden="true" />

        <div className="auth-card-body">
          <span className="auth-stub">LEFFAPIIRI</span>
          <h2 className="auth-heading">Oma tili</h2>
          <p className="auth-subtext">{user?.email}</p>
            <div className="account-section">
            <h3>Arvostelut</h3>
            </div>
            <button
              type="button"
              className="account-section account-section--button"
              onClick={onNavigateFavorites}
            >
              <span className="account-section-title">Suosikit</span>
            </button>
            <button
              type="button"
              className="account-section account-section--button"
              onClick={onNavigateGroups}
            >
              <span className="account-section-title">Ryhmät</span>
            </button>
            </div>
          {!confirming ? (
            <button
              type="button"
              className="auth-button auth-button--danger"
              onClick={() => setConfirming(true)} //ENSIMMÄINEN VAHVISTUS
            >
              Poista tili
            </button>
          ) : (
            <>
              <p className="auth-error">
                Tämä poistaa tilisi ja kaikki arvostelusi sekä suosikkilistasi
                pysyvästi. Toimintoa ei voi perua.
              </p>
              <div className="auth-confirm-row">
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                >
                  Peruuta
                </button>
                <button
                  type="button"
                  className="auth-button auth-button--danger"
                  onClick={handleDelete} //LOPULLINEN TILIN POISTO
                  disabled={deleting}
                >
                  {deleting ? 'Poistetaan...' : 'Vahvista poisto'}
                </button>
              </div>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
        </div>

        <div className="auth-sprockets" aria-hidden="true" />
      </div>
  );
}

export default Account;