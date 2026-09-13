import { useState } from 'react';
import axios from 'axios';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
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
    <form onSubmit={handleSubmit}>
      <h2>Kirjaudu sisään</h2>

      <input
        type="email"
        placeholder="Sähköposti"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />
      <input
        type="password"
        placeholder="Salasana"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      />

      {error && <p style={{ color: 'red' }}>{error}</p>}

      <button type="submit">Kirjaudu</button>
    </form>
  );
}

export default Login;