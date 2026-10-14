import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import './Home.css';
import './Favorites.css';
import MovieDetails from './MovieDetails';

const API_URL = import.meta.env.VITE_API_URL;

// Daniilin rivi: jaetun suosikkilistan oma sivu. Sivu näytetään vain kirjautuneelle
// käyttäjälle (App.jsx ohjaa kirjautumattoman ensin kirjautumaan). Lista haetaan
// valmiilla reitillä GET /api/favorites/lists/:id
function SharedList({ listId, user, onBackHome }) {
  const [list, setList] = useState(null);
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [selectedMovieId, setSelectedMovieId] = useState(null);

  useEffect(() => {
    const loadList = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/favorites/lists/${listId}`);
        setList(response.data);

        // Tietokannassa on vain TMDB-id:t, joten nimet ja julisteet haetaan erikseen
        const movieResponses = await Promise.all(
          response.data.movies.map((item) =>
            axios.get(`${API_URL}/api/movies/${item.movie_id}`)
          )
        );
        setMovies(movieResponses.map((res) => res.data));
      } catch (err) {
        console.error(err);
        if (err.response && err.response.status === 404) {
          setError('Listaa ei löytynyt. Linkki voi olla vanhentunut tai lista on poistettu.');
        } else {
          setError('Listan lataaminen epäonnistui');
        }
      } finally {
        setLoading(false);
      }
    };

    loadList();
  }, [listId]);

  return (
    <div className="section">
      <button type="button" className="back-link" onClick={onBackHome}>
        ← Etusivulle
      </button>

      {loading && <p className="movie-message">Ladataan listaa...</p>}

      {error && <p className="favorites-error">{error}</p>}

      {list && (
        <>
          <h2 className="favorites-title">{list.name}</h2>
          <p className="shared-list-info">
            Jaettu suosikkilista · {movies.length} elokuvaa
          </p>

          {movies.length === 0 && !loading && (
            <p className="movie-message">Listalla ei ole vielä elokuvia.</p>
          )}

          <div className="movie-grid">
            {movies.map((movie) => (
              <div
                key={movie.id}
                className="movie-card"
                onClick={() => setSelectedMovieId(movie.id)}
                role="button"
                tabIndex={0}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    setSelectedMovieId(movie.id);
                  }
                }}
              >
                <div className="movie-poster gradient-1">
                  {movie.poster && (
                    <img className="movie-poster-img" src={movie.poster} alt={movie.title} />
                  )}
                  <span className="movie-rating">★ {movie.rating}</span>
                </div>
                <div className="movie-title">{movie.title}</div>
                <div className="movie-meta">{movie.year}</div>
              </div>
            ))}
          </div>
        </>
      )}

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

export default SharedList;
