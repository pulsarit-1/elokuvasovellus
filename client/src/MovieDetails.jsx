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

// Daniilin rivi: TMDB:n arvostelut voivat olla todella pitkiä, joten näytetään vain alku (max 400 merkkiä).
// Leikkaus tehdään viimeisen välilyönnin kohdalta, ettei sana katkea kesken
const MAX_TMDB_REVIEW_LENGTH = 400;

function shorten(text) {
  if (!text || text.length <= MAX_TMDB_REVIEW_LENGTH) return text;

  const cut = text.slice(0, MAX_TMDB_REVIEW_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');

  return `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`;
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
// Daniilin rivi: tähtinäyttö (vain luku). Arvo 0-5 pyöristetään lähimpään täyteen tähteen
function Stars({ value }) {
  const filled = Math.round(value);

  return (
    <span className="stars" role="img" aria-label={`${value} / 5 tähteä`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <span key={n} className={n <= filled ? 'star star--on' : 'star'}>
          ★
        </span>
      ))}
    </span>
  );
}

// Daniilin rivi: tähtien valinta arvostelulomakkeessa (1-5), klikkaus valitsee arvosanan
function StarPicker({ value, onChange, disabled }) {
  const [hover, setHover] = useState(0); // hiiri tähden päällä = esikatselu

  return (
    <div
      className="star-picker"
      role="radiogroup"
      aria-label="Arvosana tähtinä"
      onMouseLeave={() => setHover(0)}
    >
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={value === n}
          aria-label={`${n} tähteä`}
          className={n <= (hover || value) ? 'star-button star-button--on' : 'star-button'}
          onClick={() => onChange(n)}
          onMouseEnter={() => setHover(n)}
          disabled={disabled}
        >
          ★
        </button>
      ))}
    </div>
  );
}

// Daniilin rivi: Leffapiirin omat arvostelut elokuvalle. Näyttää tähtikeskiarvon,
// lomakkeen (vain kirjautuneelle) ja 5 uusinta arvostelua
function ReviewSection({ movieId, user }) {
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Lomakkeen tila: valitut tähdet ja kommentti
  const [rating, setRating] = useState(0);
  const [text, setText] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState('');

  // Haetaan elokuvan arvostelut (GET /api/reviews/:movieId), kun elokuva vaihtuu
  useEffect(() => {
    let cancelled = false; // estää vanhan vastauksen ylikirjoittamasta uutta

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/reviews/${movieId}`)
      .then((response) => {
        if (!cancelled) setReviews(response.data);
      })
      .catch(() => {
        if (!cancelled) setError('Arvostelujen lataaminen epäonnistui');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [movieId]);

  // Keskiarvo kaikista arvosteluista (backend palauttaa uusimmat ensin)
  const average = reviews.length
    ? reviews.reduce((sum, review) => sum + Number(review.rating), 0) / reviews.length
    : 0;

  // Yksi arvostelu per käyttäjä: jos oma sähköposti on jo arvosteluissa, lomaketta ei näytetä
  const alreadyReviewed = user && reviews.some((review) => review.email === user.email);

  const handleSubmit = async (event) => {
    event.preventDefault(); // estää sivun uudelleenlatauksen

    if (rating < 1) {
      setMessage('Valitse ensin arvosana tähdillä');
      return;
    }
    if (!text.trim()) {
      setMessage('Kirjoita myös kommentti');
      return;
    }

    setSubmitting(true);
    setMessage('');

    try {
      const response = await axios.post(
        `${import.meta.env.VITE_API_URL}/api/reviews`,
        { movie_id: movieId, rating, review_text: text.trim() },
        authHeaders()
      );

      // Uusi arvostelu listan alkuun heti, ilman uutta hakua (email tarvitaan nimen näyttöön)
      setReviews([{ ...response.data, email: user.email }, ...reviews]);
      setRating(0);
      setText('');
    } catch (err) {
      setMessage(
        err.response?.status === 401
          ? 'Kirjautuminen vanhentunut, kirjaudu uudelleen'
          : err.response?.data?.error || 'Arvostelun lähettäminen epäonnistui'
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="review-section">
      <h3>Leffapiirin arvostelut</h3>

      {/* Tähtikeskiarvo ja arvostelujen määrä */}
      {!loading && !error && (
        <div className="review-summary">
          {reviews.length > 0 ? (
            <>
              <Stars value={average} />
              <span>
                {average.toFixed(1)} / 5 · {reviews.length}{' '}
                {reviews.length === 1 ? 'arvostelu' : 'arvostelua'}
              </span>
            </>
          ) : (
            <span>Ei vielä arvosteluja. Ole ensimmäinen!</span>
          )}
        </div>
      )}

      {/* Lomake näkyy vain kirjautuneelle, joka ei ole vielä arvostellut tätä elokuvaa */}
      {user && !alreadyReviewed && !loading && (
        <form className="review-form" onSubmit={handleSubmit}>
          <StarPicker value={rating} onChange={setRating} disabled={submitting} />

          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Kirjoita kommentti..."
            rows={3}
            maxLength={1000}
            disabled={submitting}
          />

          <div className="review-form-actions">
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              {submitting ? 'Lähetetään...' : 'Lähetä arvostelu'}
            </button>
            {message && <span className="review-message">{message}</span>}
          </div>
        </form>
      )}

      {user && alreadyReviewed && (
        <p className="review-message">Olet jo arvostellut tämän elokuvan.</p>
      )}

      {!user && (
        <p className="review-message">Kirjaudu sisään, jos haluat arvostella elokuvan.</p>
      )}

      {loading && <p className="movie-message">Ladataan arvosteluja...</p>}
      {error && <p className="movie-message">{error}</p>}

      {/* Näytetään vain 5 uusinta arvostelua */}
      {reviews.slice(0, 5).map((review) => (
        <article className="review" key={review.id}>
          <div className="review-header">
            {/* Nimeksi sähköpostin alkuosa, koko osoitetta ei näytetä muille */}
            <strong>{review.email.split('@')[0]}</strong>
            <Stars value={review.rating} />
          </div>

          <p>{review.review_text}</p>
          <span className="review-date">
            {new Date(review.created_at).toLocaleDateString('fi-FI')}
          </span>
        </article>
      ))}

      {reviews.length > 5 && (
        <p className="review-message">
          Näytetään 5 uusinta arvostelua (yhteensä {reviews.length}).
        </p>
      )}
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
              {/* Daniilin rivi: sovelluksen omat arvostelut tähtinä + lomake */}
              <ReviewSection movieId={movie.id} user={user} />

              {/* Daniilin rivi: otsikko tarkennettu, koska alla ovat TMDB:n arvostelut */}
              <h3>Arvostelut TMDB:stä</h3>

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

                    <p>{shorten(review.content)}</p>
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