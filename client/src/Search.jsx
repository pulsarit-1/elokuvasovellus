import { useState } from 'react';
import axios from 'axios';
import './App.css';
import './Home.css';
import './Search.css';

const IMAGE_URL = 'https://image.tmdb.org/t/p/w342';

function Search({ onBackHome }) {
  const [query, setQuery] = useState('');
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/movies/search`, {
        params: { q: query },
      });
      setMovies(response.data);
      setSearched(true);
    } catch {
      setError('Haku epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="section">
      <button type="button" className="back-link" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <h2 className="search-title">Hae elokuvia</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Elokuvan nimi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Haetaan...' : 'Hae'}
        </button>
      </form>

      {error && <p className="search-error">{error}</p>}

      {searched && movies.length === 0 && !error && <p>Ei tuloksia.</p>}

      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster gradient-2">
              {movie.poster_path && (
                <img src={`${IMAGE_URL}${movie.poster_path}`} alt={movie.title} />
              )}
              <span className="movie-rating">★ {movie.vote_average.toFixed(1)}</span>
            </div>
            <div className="movie-title">{movie.title}</div>
            <div className="movie-meta">{movie.release_date?.slice(0, 4)}</div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;