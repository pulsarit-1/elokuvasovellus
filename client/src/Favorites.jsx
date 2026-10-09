import { useEffect, useState } from 'react';
import axios from 'axios';
import './App.css';
import './Home.css';
import './Favorites.css';
import MovieDetails from './MovieDetails'; // JENNI: elokuvan tiedot

const API_URL = import.meta.env.VITE_API_URL;

// Kirjautumista vaativiin pyyntöihin liitetään token
function authHeaders() {
  return {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  };
}

function Favorites({ user, onBackHome }) {
  // Käyttäjän kaikki suosikkilistat
  const [lists, setLists] = useState([]);

  // Uuden listan nimi lomakkeessa
  const [newListName, setNewListName] = useState('');

  // Avattu lista ja sen elokuvat
  const [selectedList, setSelectedList] = useState(null);
  const [movies, setMovies] = useState([]);

  const [loading, setLoading] = useState(true);
  const [moviesLoading, setMoviesLoading] = useState(false);
  const [error, setError] = useState('');
  // jenni: avatun elokuvan TMDB ID
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  // Haetaan omat listat, kun sivu avataan
  useEffect(() => {
    const loadLists = async () => {
      try {
        const response = await axios.get(`${API_URL}/api/favorites/lists/me`, authHeaders());
        setLists(response.data);
      } catch (err) {
        console.error(err);
        setError('Listojen lataaminen epäonnistui. Kokeile kirjautua uudelleen.');
      } finally {
        setLoading(false);
      }
    };

    loadLists();
  }, []);

  // Luodaan uusi lista
  const handleCreateList = async (event) => {
    event.preventDefault(); // estää sivun uudelleenlatauksen
    if (!newListName.trim()) return;

    try {
      const response = await axios.post(
        `${API_URL}/api/favorites/lists`,
        { name: newListName },
        authHeaders()
      );
      // Uusi lista näytetään listan alussa
      setLists([response.data, ...lists]);
      setNewListName('');
      setError('');
    } catch (err) {
      console.error(err);
      setError('Listan luominen epäonnistui');
    }
  };

  // Avataan lista ja haetaan sen elokuvien tiedot
  const openList = async (list) => {
    setSelectedList(list);
    setMovies([]);
    setMoviesLoading(true);

    try {
      // Tietokannassa on vain elokuvien TMDB-id:t
      const response = await axios.get(`${API_URL}/api/favorites/lists/${list.id}`);

      // Haetaan jokaisen elokuvan nimi, juliste ym. TMDB:stä (kaikki yhtä aikaa)
      const movieResponses = await Promise.all(
        response.data.movies.map((item) =>
          axios.get(`${API_URL}/api/movies/${item.movie_id}`)
        )
      );

      setMovies(movieResponses.map((res) => res.data));
    } catch (err) {
      console.error(err);
      setError('Listan elokuvien lataaminen epäonnistui');
    } finally {
      setMoviesLoading(false);
    }
  };

  // Poistetaan elokuva avatulta listalta
  const removeMovie = async (movieId) => {
    try {
      await axios.delete(
        `${API_URL}/api/favorites/lists/${selectedList.id}/movies/${movieId}`,
        authHeaders()
      );
      setMovies(movies.filter((movie) => movie.id !== movieId));
    } catch (err) {
      console.error(err);
      setError('Elokuvan poistaminen epäonnistui');
    }
  };

  // Poistetaan koko lista
  const deleteList = async (list) => {
    if (!window.confirm(`Poistetaanko lista "${list.name}"?`)) return;

    try {
      await axios.delete(`${API_URL}/api/favorites/lists/${list.id}`, authHeaders());
      setLists(lists.filter((l) => l.id !== list.id));
      setSelectedList(null);
    } catch (err) {
      console.error(err);
      setError('Listan poistaminen epäonnistui');
    }
  };
  // Jenni: modaali näytetään yksittäinen lista sekä kaikki listat näkymässä
  const movieModal = selectedMovieId && (
    <MovieDetails
      movieId={selectedMovieId}
      user={user}
      onClose={() => setSelectedMovieId(null)}
      onFavoritesChanged={(listId) => {
      // Päivitetään avattu lista, jos muutoksia
      if (selectedList && Number(listId) === selectedList.id) {
        openList(selectedList);
      }
    }}
  />
);

  // Näkymä 2: yksi lista avattuna
  if (selectedList) {
    return (
      <div className="section">
        <button type="button" className="back-link" onClick={() => setSelectedList(null)}>
          ← Kaikki listat
        </button>

        <div className="section-header">
          <h2>{selectedList.name}</h2>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => deleteList(selectedList)}
          >
            Poista lista
          </button>
        </div>

        {error && <p className="favorites-error">{error}</p>}

        {moviesLoading && <p className="movie-message">Ladataan elokuvia...</p>}

        {!moviesLoading && movies.length === 0 && (
          <p className="movie-message">
            Listalla ei ole vielä elokuvia. Avaa elokuva etusivulta ja valitse "Lisää listalle".
          </p>
        )}

        <div className="movie-grid">
          {movies.map((movie) => (
// Jenni: kortti on nyt klikattava
            <div
              key={movie.id}
              className="movie-card"
              onClick={() => setSelectedMovieId(movie.id)}
              role="button"
              tabIndex={0}
              onKeyDown={(event) => {
                // Jenni: kortin oma nappula avaa sivun, ei poista listalta nappi
                if (event.target !== event.currentTarget) return;
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
              <button
                type="button"
                className="favorites-remove"
                onClick={(event) => {
                  event.stopPropagation(); // Jenni: nappi ei avaa sivua
                  removeMovie(movie.id);
                }}
              >
                Poista listalta
              </button>
            </div>
          ))}
        </div>
        {movieModal}
      </div>
    );
  }

  // Näkymä 1: kaikki listat
  return (
    <div className="section">
      <button type="button" className="back-link" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <h2 className="favorites-title">Omat suosikkilistat</h2>

      <form className="favorites-form" onSubmit={handleCreateList}>
        <input
          type="text"
          placeholder="Uuden listan nimi, esim. Parhaat kauhuleffat"
          value={newListName}
          onChange={(event) => setNewListName(event.target.value)}
          maxLength={255}
        />
        <button type="submit" className="btn btn-primary">
          Luo lista
        </button>
      </form>

      {error && <p className="favorites-error">{error}</p>}

      {loading && <p className="movie-message">Ladataan listoja...</p>}

      {!loading && lists.length === 0 && !error && (
        <p className="movie-message">Sinulla ei ole vielä listoja. Luo ensimmäinen yllä!</p>
      )}

      <div className="favorites-lists">
        {lists.map((list) => (
          <button
            key={list.id}
            type="button"
            className="favorites-list-card"
            onClick={() => openList(list)}
          >
            <span className="favorites-list-name">{list.name}</span>
            <span className="favorites-list-date">
              Luotu {new Date(list.created_at).toLocaleDateString('fi-FI')}
            </span>
          </button>
        ))}
      </div>
      {movieModal}
    </div>
  );
}

export default Favorites;
