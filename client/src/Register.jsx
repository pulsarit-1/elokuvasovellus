import { useState } from 'react';
import axios from 'axios';
import './Auth.css';

function Register({ onSwitchToLogin, onBackHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (!passwordRegex.test(password)) {
      setError('Salasanan pitää olla vähintään 8 merkkiä ja sisältää iso kirjain ja numero');
      return;
    }

    if (password !== passwordConfirm) {
      setError('Salasanat eivät täsmää');
      return;
    }

    try {
      await axios.post(`${import.meta.env.VITE_API_URL}/api/register`, {
        email,
        password,
      });

      setSuccess(true);
    } catch (err) {
      setError(err.response?.data?.error || 'Rekisteröityminen epäonnistui');
    }
  };

  if (success) {
    return (
      <div className="auth-page">
        <div className="auth-card auth-card--success">
          <div className="auth-sprockets" aria-hidden="true" />
          <div className="auth-card-body">
            <span className="auth-stub">LEFFAPIIRI</span>
            <div className="auth-success-badge">✓</div>
            <h2 className="auth-heading">Tili luotu</h2>
            <p className="auth-subtext">Voit nyt kirjautua sisään omalla tunnuksellasi.</p>
            <button type="button" className="auth-button" onClick={onSwitchToLogin}>
              Kirjaudu sisään
            </button>
          </div>
          <div className="auth-sprockets" aria-hidden="true" />
        </div>
      </div>
    );
  }

  return (
    <div className="auth-page">
      <button type="button" className="auth-back" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <div className="auth-card">
        <div className="auth-sprockets" aria-hidden="true" />

        <form className="auth-card-body" onSubmit={handleSubmit}>
          <span className="auth-stub">LEFFAPIIRI</span>
          <h2 className="auth-heading">Luo tili</h2>
          <p className="auth-subtext">Liity elokuvaharrastajien yhteisöön.</p>

          <label className="auth-field">
            <span className="auth-label">Sähköposti</span>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span className="auth-label">Salasana</span>
            <div className="auth-field-wrapper">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? 'Piilota salasana' : 'Näytä salasana'}
              >
                {showPassword ? '🙉' : '🙈'}
              </button>
            </div>
          </label>

          <label className="auth-field">
            <span className="auth-label">Salasana uudelleen</span>
            <div className="auth-field-wrapper">
              <input
                type={showPasswordConfirm ? 'text' : 'password'}
                value={passwordConfirm}
                onChange={(e) => setPasswordConfirm(e.target.value)}
                required
              />
              <button
                type="button"
                className="auth-toggle-visibility"
                onClick={() => setShowPasswordConfirm((v) => !v)}
                aria-label={showPasswordConfirm ? 'Piilota salasana' : 'Näytä salasana'}
              >
                {showPasswordConfirm ? '🙉' : '🙈'}
              </button>
            </div>
          </label>

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button">Rekisteröidy</button>

          <p className="auth-switch">
            Onko sinulla jo tili?{' '}
            <button type="button" className="auth-link" onClick={onSwitchToLogin}>
              Kirjaudu sisään
            </button>
          </p>
        </form>

        <div className="auth-sprockets" aria-hidden="true" />
      </div>
    </div>
  );
}

export default Register;