import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import './Home.css';

function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div className="movie-poster gradient-1">
        {movie.poster && (
          <img className="movie-poster-img" src={movie.poster} alt={movie.title} />
        )}
        <span className="movie-rating">★ {movie.rating}</span>
      </div>
      <div className="movie-title">{movie.title}</div>
      <div className="movie-meta">{movie.year} · {movie.genre}</div>
    </div>
  );
}

function MovieGrid({ movies, loading, error }) {
  if (loading) {
    return <p className="movie-message">Ladataan elokuvia...</p>;
  }

  if (error) {
    return <p className="movie-message">{error}</p>;
  }

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} />
      ))}
    </div>
  );
}

function Home({ user, onNavigateLogin, onNavigateSearch, onNavigateFavorites, onNavigateAccount, onLogout }) {
  const [trending, setTrending] = useState([]);
  const [newest, setNewest] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const loadMovies = async () => {
      try {
        const [trendingResponse, newestResponse] = await Promise.all([
          axios.get(`${import.meta.env.VITE_API_URL}/api/movies/trending`),
          axios.get(`${import.meta.env.VITE_API_URL}/api/movies/now-playing`),
        ]);
        setTrending(trendingResponse.data);
        setNewest(newestResponse.data);
      } catch {
        setError('Elokuvien lataus epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  return (
    <div>
      <header className="site-header">
        <div className="logo">
          <svg className="logo-icon" width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2l1.8 4.4L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.2-1.6L12 2z" />
          </svg>
          Leffapiiri
        </div>

        <ul className="nav-links">
          <li><span className="active">Etusivu</span></li>
          <li><span onClick={onNavigateSearch}>Haku</span></li>
          <li><span onClick={onNavigateFavorites}>Suosikit</span></li>
        </ul>

        {user ? (
          <div className="user-menu">
            <span className="user-email">{user.email}</span>
            <button type="button" className="btn btn-outline" onClick={onNavigateAccount}>
              Oma tili
            </button>
            <button type="button" className="btn btn-outline" onClick={onLogout}>
              Kirjaudu ulos
            </button>
          </div>
        ) : (
          <button type="button" className="btn btn-outline" onClick={onNavigateLogin}>
            Kirjaudu sisään
          </button>
        )}
      </header>

      <section className="hero">
        <span className="badge">Viikon nostot</span>
        <h1>Löydä seuraava suosikkielokuvasi</h1>
        <p>
          Selaa arvosteluja, kokoa suosikkilistasi ja löydä juuri sinulle
          sopivat elokuvat leffaharrastajien yhteisöstä.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary" onClick={onNavigateSearch}>Selaa elokuvia</button>
          <button type="button" className="btn btn-outline">▶ Katso esittely</button>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Trendaavat elokuvat</h2>
          <span className="see-all">Näytä kaikki →</span>
        </div>
        <MovieGrid movies={trending} loading={loading} error={error} />
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Uusimmat lisäykset</h2>
          <span className="see-all">Näytä kaikki →</span>
        </div>
        <MovieGrid movies={newest} loading={loading} error={error} />
      </section>

      <footer className="site-footer">© 2026 Leffapiiri — rakennettu leffaharrastajille</footer>
    </div>
  );
}

export default Home;