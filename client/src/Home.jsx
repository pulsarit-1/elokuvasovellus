import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import './Home.css';
import MovieDetails from './MovieDetails';

// Yksi elokuvakortti. Klikkaus (tai Enter/Space) avaa elokuvan tiedot.
function MovieCard({ movie, onClick }) {
  return (
    <div
      className="movie-card"
      onClick={() => onClick?.(movie.id)}
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(event) => {
        if (onClick && (event.key === 'Enter' || event.key === ' ')) {
          onClick(movie.id);
        }
      }}
    >
      <div className="movie-poster gradient-1">
        {movie.poster ? (
          <img
            className="movie-poster-img"
            src={movie.poster}
            alt={movie.title}
          />
        ) : (
          <div className="movie-poster-placeholder">Ei kuvaa</div>
        )}

        <span className="movie-rating">★ {movie.rating}</span>
      </div>

      <div className="movie-title">{movie.title}</div>

      <div className="movie-meta">
        {movie.year}
        {movie.genre && ` · ${movie.genre}`}
      </div>
    </div>
  );
}

// Elokuvalista. row=true: esikatselu
// row=false: Näytä kaikki" -näkymä
function MovieGrid({ movies, loading, error, onMovieClick, row = false }) {
  const className = row ? 'movie-row' : 'movie-grid';

  // Latauksen aikana näytetään harmaita korttipohjia ettei ole tyhjä näkymä
  if (loading) {
    return (
      <div className={className}>
        {Array.from({ length: row ? 6 : 10 }).map((_, index) => (
          <div key={index} className="movie-card skeleton">
            <div className="movie-poster" />
            <div className="skeleton-line" />
          </div>
        ))}
      </div>
    );
  }

  if (error) {
    return <p className="movie-message">{error}</p>;
  }

  if (!movies.length) {
    return <p className="movie-message">Elokuvia ei löytynyt.</p>;
  }

  return (
    <div className={className}>
      {movies.map((movie) => (
        <MovieCard key={movie.id} movie={movie} onClick={onMovieClick} />
      ))}
    </div>
  );
}

function Home({
  user,
  onNavigateLogin,
  onNavigateRegister,
  onNavigateSearch,
  onNavigateFavorites,
  onNavigateAccount,
  onLogout
}) {
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);
  const [loading, setLoading] = useState(true);

  // Omat virheet kummallekin listalle, jotta yhden epäonnistumine ei tyhjennä toista
  const [trendingError, setTrendingError] = useState('');
  const [nowPlayingError, setNowPlayingError] = useState('');

  // null = Näytä kaikki
  const [expanded, setExpanded] = useState(null);

  // Avatun elokuvan TMDB ID
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // Haetaan molemmat listat heti kun etusivu avataan
  useEffect(() => {
    const loadMovies = async () => {
      // allSettled: kumpikin pyyntö käsitellään erikseen, virhe ei keskeytä toista
      const [trendingResult, nowPlayingResult] = await Promise.allSettled([
        axios.get(`${import.meta.env.VITE_API_URL}/api/movies/trending`),
        axios.get(`${import.meta.env.VITE_API_URL}/api/movies/now-playing`)
      ]);

      if (trendingResult.status === 'fulfilled') {
        setTrending(trendingResult.value.data);
      } else {
        console.error(trendingResult.reason);
        setTrendingError('Trendaavien elokuvien lataus epäonnistui');
      }

      if (nowPlayingResult.status === 'fulfilled') {
        setNowPlaying(nowPlayingResult.value.data);
      } else {
        console.error(nowPlayingResult.reason);
        setNowPlayingError('Teattereissa olevien elokuvien lataus epäonnistui');
      }

      setLoading(false);
    };

    loadMovies();
  }, []);

// 3 ensimmäistä trendaavaa, joilla on juliste
const heroMovies = trending.filter((movie) => movie.poster).slice(0, 3);

  // Etusivulla näytetään 12 elokuvaa
  const previewTrending = trending.slice(0, 12);
  const previewNowPlaying = nowPlaying.slice(0, 12);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const openExpanded = (section) => {
    setExpanded(section);
    scrollToTop();
  };

  const closeExpanded = () => {
    setExpanded(null);
    scrollToTop();
  };

  return (
    <div>
      <header className="site-header">
        <div className="logo">
          <svg
            className="logo-icon"
            width="22"
            height="22"
            viewBox="0 0 24 24"
            fill="currentColor"
          >
            <path d="M12 2l1.8 4.4L18 8l-4.4 1.8L12 14l-1.6-4.2L6 8l4.2-1.6L12 2z" />
          </svg>
          Leffapiiri
        </div>

        {/* Valikko painikkeina, näppäimistöllä pääsy */}
        <ul className="nav-links">
          <li>
            <button type="button" className="active" onClick={closeExpanded}>
              Etusivu
            </button>
          </li>

          <li>
            <button type="button" onClick={onNavigateSearch}>
              Haku
            </button>
          </li>

          {/* Suosikit näytetään vain kirjautuneelle käyttäjälle */}
          {user && (
            <li>
              <button type="button" onClick={onNavigateFavorites}>
                Suosikit
              </button>
            </li>
          )}
        </ul>

        {user ? (
          <div className="user-menu">
            <span className="user-email">{user.email}</span>

            <button
              type="button"
              className="btn btn-outline"
              onClick={onNavigateAccount}
            >
              Oma tili
            </button>

              <button type="button" className="btn btn-ghost" onClick={onLogout}>
              Kirjaudu ulos
            </button>
          </div>
        ) : (
          <button
            type="button"
            className="btn btn-outline"
            onClick={onNavigateLogin}
          >
            Kirjaudu sisään
          </button>
        )}
      </header>

      {/* ---------- Etusivu ---------- */}
      {expanded === null && (
        <>
          <section className="hero">
  {/* Sumennettu taustakuva */}
  {heroMovies[0] && (
    <div
      className="hero-backdrop"
      style={{ backgroundImage: `url(${heroMovies[0].poster})` }}
      aria-hidden="true"
    />
  )}

  <div className="hero-text">
    <span className="badge">Trendaa nyt</span>

    <h1>Löydä seuraava suosikkielokuvasi</h1>

    <p>
      Selaa arvosteluja, kokoa suosikkilistasi ja löydä juuri
      sinulle sopivat elokuvat leffaharrastajien yhteisöstä.
    </p>

    <div className="hero-actions">
      <button
        type="button"
        className="btn btn-primary"
        onClick={onNavigateSearch}
      >
        Selaa elokuvia
      </button>

      {/* Näytetään vain kirjautumattomalle */}
      {!user && (
        <button
          type="button"
          className="btn btn-outline"
          onClick={onNavigateRegister}
        >
          Luo tili
        </button>
      )}
    </div>
  </div>

  {/* 3 trendaavan elokuvan julistenippu */}
  {heroMovies.length > 0 && (
    <div className="hero-posters">
      {heroMovies.map((movie, index) => (
        <button
          key={movie.id}
          type="button"
          className={`hero-poster hero-poster-${index}`}
          onClick={() => setSelectedMovieId(movie.id)}
        >
          <img src={movie.poster} alt={movie.title} />
          <span className="movie-rating">★ {movie.rating}</span>
        </button>
      ))}
    </div>
  )}
</section>

          <section className="section">
            <div className="section-header">
              <h2>Trendaavat elokuvat</h2>

              <button
                type="button"
                className="see-all"
                onClick={() => openExpanded('trending')}
              >
                Näytä kaikki →
              </button>
            </div>

            <MovieGrid
              movies={previewTrending}
              loading={loading}
              error={trendingError}
              onMovieClick={setSelectedMovieId}
              row
            />
          </section>

          <section className="section">
            <div className="section-header">
              <h2>Nyt elokuvateattereissa Suomessa</h2>

              <button
                type="button"
                className="see-all"
                onClick={() => openExpanded('nowPlaying')}
              >
                Näytä kaikki →
              </button>
            </div>

            <MovieGrid
              movies={previewNowPlaying}
              loading={loading}
              error={nowPlayingError}
              onMovieClick={setSelectedMovieId}
              row
            />
          </section>
        </>
      )}

      {/* ---------- "Näytä kaikki" -näkymä ---------- */}
      {expanded !== null && (
        <section className="section all-movies-page">
          <div className="section-header">
            <div>
              <h2>
                {expanded === 'trending'
                  ? 'Trendaavat elokuvat'
                  : 'Nyt elokuvateattereissa Suomessa'}
              </h2>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={closeExpanded}
            >
              ← Takaisin
            </button>
          </div>

          <MovieGrid
            movies={expanded === 'trending' ? trending : nowPlaying}
            loading={loading}
            error={expanded === 'trending' ? trendingError : nowPlayingError}
            onMovieClick={setSelectedMovieId}
          />
        </section>
      )}

      <footer className="site-footer">
        © 2026 Leffapiiri — rakennettu leffaharrastajille
      </footer>

      {/* Elokuvan tiedot avataan ponnahdusikkunassa */}
      {selectedMovieId && (
        <MovieDetails
          movieId={selectedMovieId}
          user={user}
          onClose={() => setSelectedMovieId(null)}
        />
      )}
    </div>
  );
}

export default Home;