import { useState } from 'react';
import axios from 'axios';
import './Auth.css';

function Login({ onSwitchToRegister, onBackHome }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/login`, {
        email,
        password,
      });

      localStorage.setItem('token', response.data.token);
      alert('Kirjautuminen onnistui!');
    } catch (err) {
      setError(err.response?.data?.error || 'Kirjautuminen epäonnistui');
    }
  };

  return (
    <div className="auth-page">
      <button type="button" className="auth-back" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <div className="auth-card">
        <div className="auth-sprockets" aria-hidden="true" />

        <form className="auth-card-body" onSubmit={handleSubmit}>
          <span className="auth-stub">LEFFAPIIRI</span>
          <h2 className="auth-heading">Kirjaudu sisään</h2>
          <p className="auth-subtext">Tervetuloa takaisin.</p>

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

          {error && <p className="auth-error">{error}</p>}

          <button type="submit" className="auth-button">Kirjaudu</button>

          <p className="auth-switch">
            Ei vielä tiliä?{' '}
            <button type="button" className="auth-link" onClick={onSwitchToRegister}>
              Rekisteröidy
            </button>
          </p>
        </form>

        <div className="auth-sprockets" aria-hidden="true" />
      </div>
    </div>
  );
}

export default Login;