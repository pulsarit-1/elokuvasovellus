import './App.css';
import './Home.css';

const trending = [
  { title: 'Kadonnut Horisontti', year: 2025, genre: 'Sci-Fi', rating: 8.4, gradient: 'gradient-1' },
  { title: 'Yön Varjot', year: 2024, genre: 'Trilleri', rating: 7.9, gradient: 'gradient-2' },
  { title: 'Punainen Kuu', year: 2023, genre: 'Rikos', rating: 9.1, gradient: 'gradient-3' },
  { title: 'Hiljainen Kaupunki', year: 2025, genre: 'Draama', rating: 7.2, gradient: 'gradient-4' },
  { title: 'Auringon Jälkeen', year: 2022, genre: 'Fantasia', rating: 8.0, gradient: 'gradient-5' },
];

const newest = [
  { title: 'Musta Aalto', year: 2026, genre: 'Jännitys', rating: 6.8, gradient: 'gradient-2' },
  { title: 'Kultainen Hetki', year: 2026, genre: 'Draama', rating: 8.6, gradient: 'gradient-5' },
  { title: 'Talven Tarina', year: 2025, genre: 'Komedia', rating: 7.4, gradient: 'gradient-1' },
  { title: 'Kaukainen Ranta', year: 2024, genre: 'Seikkailu', rating: 8.9, gradient: 'gradient-4' },
  { title: 'Varjojen Maa', year: 2023, genre: 'Mysteeri', rating: 7.7, gradient: 'gradient-3' },
];

function MovieCard({ movie }) {
  return (
    <div className="movie-card">
      <div className={`movie-poster ${movie.gradient}`}>
        <span className="movie-rating">★ {movie.rating}</span>
      </div>
      <div className="movie-title">{movie.title}</div>
      <div className="movie-meta">{movie.year} · {movie.genre}</div>
    </div>
  );
}

function MovieGrid({ movies }) {
  return (
    <div className="movie-grid">
      {movies.map((movie) => (
        <MovieCard key={movie.title} movie={movie} />
      ))}
    </div>
  );
}

function Home({ onNavigateLogin }) {
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
          <li><span>Haku</span></li>
          <li><span>Suosikit</span></li>
        </ul>

        <button type="button" className="btn btn-outline" onClick={onNavigateLogin}>
          Kirjaudu sisään
        </button>
      </header>

      <section className="hero">
        <span className="badge">Viikon nostot</span>
        <h1>Löydä seuraava suosikkielokuvasi</h1>
        <p>
          Selaa arvosteluja, kokoa suosikkilistasi ja löydä juuri sinulle
          sopivat elokuvat leffaharrastajien yhteisöstä.
        </p>
        <div className="hero-actions">
          <button type="button" className="btn btn-primary">Selaa elokuvia</button>
          <button type="button" className="btn btn-outline">▶ Katso esittely</button>
        </div>
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Trendaavat elokuvat</h2>
          <span className="see-all">Näytä kaikki →</span>
        </div>
        <MovieGrid movies={trending} />
      </section>

      <section className="section">
        <div className="section-header">
          <h2>Uusimmat lisäykset</h2>
          <span className="see-all">Näytä kaikki →</span>
        </div>
        <MovieGrid movies={newest} />
      </section>

      <footer className="site-footer">© 2026 Leffapiiri — rakennettu leffaharrastajille</footer>
    </div>
  );
}

export default Home;
