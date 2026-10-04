import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import './Home.css';
import MovieDetails from './MovieDetails';

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
          <div className="movie-poster-placeholder">
            Ei kuvaa
          </div>
        )}

        <span className="movie-rating">
          ★ {movie.rating}
        </span>
      </div>

      <div className="movie-title">
        {movie.title}
      </div>

      <div className="movie-meta">
        {movie.year}
        {movie.genre && ` · ${movie.genre}`}
      </div>
    </div>
  );
}

function MovieGrid({
  movies,
  loading,
  error,
  onMovieClick
}) {
  if (loading) {
    return (
      <p className="movie-message">
        Ladataan elokuvia...
      </p>
    );
  }

  if (error) {
    return (
      <p className="movie-message">
        {error}
      </p>
    );
  }

  if (!movies.length) {
    return (
      <p className="movie-message">
        Elokuvia ei löytynyt.
      </p>
    );
  }

  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard
          key={movie.id}
          movie={movie}
          onClick={onMovieClick}
        />
      ))}
    </div>
  );
}

function Home({
  user,
  onNavigateLogin,
  onNavigateSearch,
  onNavigateFavorites,
  onNavigateAccount,
  onLogout
}) {
  // Tallennetaan trendaavat ja nyt teattereissa olevat elokuvat erikseen
  const [trending, setTrending] = useState([]);
  const [nowPlaying, setNowPlaying] = useState([]);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // true = näytetään kaikki trendaavat
  const [showAllTrending, setShowAllTrending] = useState(false);

  // true = näytetään kaikki nyt teattereissa
  const [showAllNowPlaying, setShowAllNowPlaying] = useState(false);

  // Tähän tallennetaan avatun elokuvan TMDB ID
  // Kun ID on olemassa, elokuvan tietomodal näytetään.
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  // Haetaan molemmat listat heti, kun etusivu avataan
  useEffect(() => {
    const loadMovies = async () => {
      try {
        setLoading(true);
        setError('');

        // Molemmat API-kutsut tehdään samaan aikaan
        const [
          trendingResponse,
          nowPlayingResponse
        ] = await Promise.all([
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/movies/trending`
          ),
          axios.get(
            `${import.meta.env.VITE_API_URL}/api/movies/now-playing`
          )
        ]);

        setTrending(trendingResponse.data);
        setNowPlaying(nowPlayingResponse.data);
      } catch (err) {
        console.error(err);
        setError('Elokuvien lataus epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    loadMovies();
  }, []);

  // Etusivulla näytetään 5 elokuvaa.
  // "Näytä kaikki" näyttää koko API:sta saadun listan.
  const visibleTrending = showAllTrending
    ? trending
    : trending.slice(0, 5);

  const visibleNowPlaying = showAllNowPlaying
    ? nowPlaying
    : nowPlaying.slice(0, 5);

  // Suljetaan kaikki erilliset näkymät
  const closeAllViews = () => {
    setShowAllTrending(false);
    setShowAllNowPlaying(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Avataan kaikki trendaavat elokuvat
  const openTrending = () => {
    setShowAllTrending(true);
    setShowAllNowPlaying(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Avataan kaikki Suomessa teattereissa olevat elokuvat
  const openNowPlaying = () => {
    setShowAllNowPlaying(true);
    setShowAllTrending(false);

    window.scrollTo({
      top: 0,
      behavior: 'smooth'
    });
  };

  // Avataan valitun elokuvan tiedot
  const openMovieDetails = (movieId) => {
    setSelectedMovieId(movieId);
  };

  // Suljetaan elokuvan tiedot
  const closeMovieDetails = () => {
    setSelectedMovieId(null);
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

        <ul className="nav-links">
          <li>
            <span
              className="active"
              onClick={closeAllViews}
            >
              Etusivu
            </span>
          </li>

          <li>
            <span onClick={onNavigateSearch}>
              Haku
            </span>
          </li>

          {/* Suosikit näytetään vain kirjautuneelle käyttäjälle */}
          {user && (
            <li>
              <span onClick={onNavigateFavorites}>
                Suosikit
              </span>
            </li>
          )}
        </ul>

        {user ? (
          <div className="user-menu">
            <span className="user-email">
              {user.email}
            </span>

            <button
              type="button"
              className="btn btn-outline"
              onClick={onNavigateAccount}
            >
              Oma tili
            </button>

            <button
              type="button"
              className="btn btn-outline"
              onClick={onLogout}
            >
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

      {!showAllTrending && !showAllNowPlaying && (
        <section className="hero">
          <span className="badge">
            Viikon nostot
          </span>

          <h1>
            Löydä seuraava suosikkielokuvasi
          </h1>

          <p>
            Selaa arvosteluja, kokoa suosikkilistasi
            ja löydä juuri sinulle sopivat elokuvat
            leffaharrastajien yhteisöstä.
          </p>

          <div className="hero-actions">
            <button
              type="button"
              className="btn btn-primary"
              onClick={onNavigateSearch}
            >
              Selaa elokuvia
            </button>

            <button
              type="button"
              className="btn btn-outline"
            >
              ▶ Katso esittely
            </button>
          </div>
        </section>
      )}

      {showAllTrending && (
        <section className="section all-movies-page">
          <div className="section-header">
            <div>
              <h2>Trendaavat elokuvat</h2>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={closeAllViews}
            >
              ← Takaisin
            </button>
          </div>

          <MovieGrid
            movies={trending}
            loading={loading}
            error={error}
            onMovieClick={openMovieDetails}
          />
        </section>
      )}

      {showAllNowPlaying && (
        <section className="section all-movies-page">
          <div className="section-header">
            <div>
              <h2>Nyt elokuvateattereissa Suomessa</h2>
            </div>

            <button
              type="button"
              className="btn btn-outline"
              onClick={closeAllViews}
            >
              ← Takaisin
            </button>
          </div>

          <MovieGrid
            movies={nowPlaying}
            loading={loading}
            error={error}
            onMovieClick={openMovieDetails}
          />
        </section>
      )}

      {!showAllTrending && !showAllNowPlaying && (
        <>
          <section className="section">
            <div className="section-header">
              <h2>Trendaavat elokuvat</h2>

              <button
                type="button"
                className="see-all"
                onClick={openTrending}
              >
                Näytä kaikki →
              </button>
            </div>

            <MovieGrid
              movies={visibleTrending}
              loading={loading}
              error={error}
              onMovieClick={openMovieDetails}
            />
          </section>

          <section className="section">
            <div className="section-header">
              <h2>Nyt elokuvateattereissa Suomessa</h2>

              <button
                type="button"
                className="see-all"
                onClick={openNowPlaying}
              >
                Näytä kaikki →
              </button>
            </div>

            <MovieGrid
              movies={visibleNowPlaying}
              loading={loading}
              error={error}
              onMovieClick={openMovieDetails}
            />
          </section>
        </>
      )}

      <footer className="site-footer">
        © 2026 Leffapiiri — rakennettu leffaharrastajille
      </footer>

      {/* Elokuvan tiedot avataan ponnahdusikkunassa */}
      {selectedMovieId && (
        <MovieDetails
          movieId={selectedMovieId}
          user={user}
          onClose={closeMovieDetails}
        />
      )}

    </div>
  );
}

export default Home;