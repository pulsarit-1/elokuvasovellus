import { useEffect, useState } from 'react';
import axios from 'axios';
import './MovieDetails.css';
import './Favorites.css';

// Kirjautumista vaativiin pyyntöihin liitetään token
function authHeaders() {
  return {
    headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
  };
}

// Näytetään vain kirjautuneelle: valitaan oma lista, lisätään tai poistetaan elokuva
function AddToList({ movieId, onChanged }) {
  const [lists, setLists] = useState([]);
  const [selectedListId, setSelectedListId] = useState('');
  const [onList, setOnList] = useState(false); // onko elokuva valitulla listalla
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState('');

  // Haetaan käyttäjän listat pudotusvalikkoa varten
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/favorites/lists/me`, authHeaders())
      .then((response) => {
        setLists(response.data);
        // Valitaan ensimmäinen lista valmiiksi
        if (response.data.length > 0) {
          setSelectedListId(response.data[0].id);
        }
      })
      .catch(() => setMessage('Listojen lataaminen epäonnistui'));
  }, []);

  // Tarkistetaan aina kun lista vaihtuu, onko elokuva jo valitulla listalla
  useEffect(() => {
    if (!selectedListId) return;

    let cancelled = false; // estää vanhan vastauksen ylikirjoittamasta uutta

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/favorites/lists/${selectedListId}`)
      .then((response) => {
        if (!cancelled) {
          setOnList(
            response.data.movies.some(
              (item) => Number(item.movie_id) === Number(movieId)
            )
          );
        }
      })
      .catch(() => {});

    return () => {
      cancelled = true;
    };
  }, [selectedListId, movieId]);

  const handleAdd = async () => {
    setBusy(true);
    try {
      await axios.post(
        `${import.meta.env.VITE_API_URL}/api/favorites/lists/${selectedListId}/movies`,
        { movie_id: movieId },
        authHeaders()
      );
      setOnList(true);
      setMessage('Lisätty listalle!');
      onChanged?.(selectedListId); // kertoo ylemmälle sivulle, että lista muuttui
    } catch {
      setMessage('Lisääminen epäonnistui');
    } finally {
      setBusy(false);
    }
  };

  const handleRemove = async () => {
    setBusy(true);
    try {
      await axios.delete(
        `${import.meta.env.VITE_API_URL}/api/favorites/lists/${selectedListId}/movies/${movieId}`,
        authHeaders()
      );
      setOnList(false);
      setMessage('Poistettu listalta');
      onChanged?.(selectedListId);
    } catch {
      setMessage('Poistaminen epäonnistui');
    } finally {
      setBusy(false);
    }
  };

  if (lists.length === 0) {
    return (
      <p className="add-to-list-message">
        {message || 'Luo ensin suosikkilista Suosikit-sivulla, niin voit lisätä elokuvia.'}
      </p>
    );
  }

  return (
    <div className="add-to-list">
      <select
        value={selectedListId}
        onChange={(event) => {
          setSelectedListId(event.target.value);
          setMessage(''); // vanha viesti ei koske uutta listaa
        }}
      >
        {lists.map((list) => (
          <option key={list.id} value={list.id}>
            {list.name}
          </option>
        ))}
      </select>

      <div className="add-to-list-actions">
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleAdd}
          disabled={busy || onList}
        >
          Lisää listalle
        </button>

        <button
          type="button"
          className="btn btn-outline"
          onClick={handleRemove}
          disabled={busy || !onList}
        >
          Poista listalta
        </button>
      </div>

      {message && <p className="add-to-list-message">{message}</p>}
    </div>
  );
}
// Ponnahdusikkuna, joka avautuu tietojen näyttämistä varten.
// movieId: minkä elokuvan tiedot haetaan
// onClose: käyttäjä haluaa sulkea modaalin
// onFavoritesChanged: callback, joka kutsutaan kun suosikit muuttuvat
// 3tilaa: data saatavilla, latautuu, virhe
function MovieDetails({ movieId, user, onClose, onFavoritesChanged }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
// Haetaan elokuvan tiedot, kun movieId vaihtuu
  useEffect(() => {
    const loadMovie = async () => {
      try {
        const response = await axios.get(
          `${import.meta.env.VITE_API_URL}/api/movies/${movieId}`
        );

        setMovie(response.data);
      } catch {
        setError('Elokuvan tietojen lataaminen epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    loadMovie();
  }, [movieId]);
// Koko tausta klikattava, ulkopuolen klikkaus sulkee
// tausta ei sulkeudu, jos modaalia klikataan sisäpuolelta
  return (
    <div className="movie-modal-overlay" onClick={onClose}>
      <div
        className="movie-modal"
        onClick={(event) => event.stopPropagation()}
      >
        <button
          type="button"
          className="movie-modal-close"
          onClick={onClose}
          aria-label="Sulje"
        >
          ×
        </button>
{/* tilat: latautuu, virhe, data saatavilla */}
        {loading && (
          <p className="movie-message">Ladataan elokuvaa...</p>
        )}

        {error && (
          <p className="movie-message">{error}</p>
        )}

        {movie && (
          <>
            <div className="movie-modal-content">
              <div className="movie-modal-poster">
                {movie.poster && (
                  <img
                    src={movie.poster}
                    alt={movie.title}
                  />
                )}
              </div>

              <div className="movie-modal-info">
                <h2>{movie.title}</h2>

                <p className="movie-modal-meta">
                  {movie.year}
                  {movie.genres?.length > 0 &&
                    ` · ${movie.genres.join(' · ')}`}
                </p>

                <div className="movie-modal-rating">
                  ★ {movie.rating}
                </div>

                {movie.runtime && (
                  <p>{movie.runtime} min</p>
                )}

                {/* Lisää listalle -osio näkyy vain kirjautuneelle */}
                {user && <AddToList movieId={movie.id} onChanged={onFavoritesChanged} />}

                <h3>Juoni</h3>

                <p className="movie-modal-overview">
                  {movie.overview || 'Kuvausta ei ole saatavilla.'}
                </p>
              </div>
            </div>

            <div className="movie-modal-reviews">
              <h3>Arvostelut</h3>

              {movie.reviews?.length === 0 ? (
                <p className="movie-message">
                  Tästä elokuvasta ei ole vielä arvosteluja.
                </p>
              ) : (
// Näytetään vain 3 ensimmäistä arvostelua
                movie.reviews.slice(0, 3).map((review) => (
                  <article
                    className="review"
                    key={review.id}
                  >
                    <div className="review-header">
                      <strong>{review.author}</strong>

                      {review.rating && (
                        <span>★ {review.rating}/10</span>
                      )}
                    </div>

                    <p>{review.content}</p>
                  </article>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

export default MovieDetails;