import { useState } from 'react';
import axios from 'axios';
import './Auth.css';
import MovieDetails from './MovieDetails'; // Daniilin rivi: oman arvostelun elokuva avataan ponnahdusikkunaan

function Account({ user, onBackHome, onNavigateGroups, onNavigateFavorites, onAccountDeleted }) {
  const [confirming, setConfirming] = useState(false);
  const [error, setError] = useState('');
  const [deleting, setDeleting] = useState(false);

  // Daniilin rivi: omien arvostelujen tila (Arvostelut-painike avaa ja sulkee listan)
  const [showReviews, setShowReviews] = useState(false);
  const [myReviews, setMyReviews] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);
  const [reviewsError, setReviewsError] = useState('');
  const [openMovieId, setOpenMovieId] = useState(null); // mikä elokuva on auki ponnahdusikkunassa

  // Daniilin rivi: Arvostelut-painike. Avattaessa haetaan käyttäjän arvostelut backendistä
  // (GET /api/reviews/me) ja jokaiselle elokuvalle nimi (GET /api/movies/:id),
  // koska tietokannassa on vain elokuvan numero. Uusi haku joka avauskerralla pitää listan ajan tasalla
  const handleToggleReviews = async () => {
    if (showReviews) {
      setShowReviews(false);
      return;
    }

    setShowReviews(true);
    setReviewsLoading(true);
    setReviewsError('');

    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/reviews/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      // Elokuvan nimen haku epäonnistuessaan ei kaada listaa, vaan näytetään elokuvan numero
      const withTitles = await Promise.all(
        response.data.map(async (review) => {
          try {
            const movie = await axios.get(
              `${import.meta.env.VITE_API_URL}/api/movies/${review.movie_id}`
            );
            return { ...review, title: movie.data.title, year: movie.data.year };
          } catch {
            return { ...review, title: `Elokuva #${review.movie_id}`, year: '' };
          }
        })
      );

      setMyReviews(withTitles);
    } catch {
      setReviewsError('Arvostelujen lataaminen epäonnistui');
    } finally {
      setReviewsLoading(false);
    }
  };

  const handleDelete = async () => { //KÄYTTÄJÄTILIN POISTO BACKENDIN KAUTTA
    setDeleting(true);
    setError('');

    try {
      const token = localStorage.getItem('token'); //HAETAAN TOKEN TUNNISTAUTUMISTA VARTEN
      //TILIN POISTOPYYNTÖ BACKENDIIN
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/users/me`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      onAccountDeleted(); //ILMOITA ONNISTUNUT POISTO
    } catch (err) {
      setError(err.response?.data?.error || 'Tilin poisto epäonnistui');
      setDeleting(false);
    }
  };

  return (
    <div className="auth-page">
      <button type="button" className="auth-back" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <div className="auth-card">
        <div className="auth-sprockets" aria-hidden="true" />

        <div className="auth-card-body">
          <span className="auth-stub">LEFFAPIIRI</span>
          <h2 className="auth-heading">Oma tili</h2>
          <p className="auth-subtext">{user?.email}</p>
            {/* Daniilin rivi: Arvostelut on nyt painike kuten Suosikit ja Ryhmät, mutta lista avautuu tässä samassa laatikossa */}
            <button
              type="button"
              className="account-section account-section--button"
              onClick={handleToggleReviews}
              aria-expanded={showReviews}
            >
              <span className="account-section-title">Arvostelut</span>
            </button>

            {showReviews && (
              <div className="my-reviews">
                {reviewsLoading && <p className="my-reviews-message">Ladataan arvosteluja...</p>}
                {reviewsError && <p className="auth-error">{reviewsError}</p>}

                {!reviewsLoading && !reviewsError && myReviews.length === 0 && (
                  <p className="my-reviews-message">Et ole vielä arvostellut yhtään elokuvaa.</p>
                )}

                {!reviewsLoading &&
                  myReviews.map((review) => (
                    <button
                      key={review.id}
                      type="button"
                      className="my-review"
                      onClick={() => setOpenMovieId(review.movie_id)}
                    >
                      <span className="my-review-title">
                        {review.title}
                        {review.year && ` (${review.year})`}
                      </span>
                      <span className="my-review-stars" aria-label={`${review.rating} / 5 tähteä`}>
                        {'★'.repeat(review.rating)}
                        {'☆'.repeat(5 - review.rating)}
                      </span>
                      <span className="my-review-text">{review.review_text}</span>
                      <span className="my-review-date">
                        {new Date(review.created_at).toLocaleDateString('fi-FI')}
                      </span>
                    </button>
                  ))}
              </div>
            )}
            <button
              type="button"
              className="account-section account-section--button"
              onClick={onNavigateFavorites}
            >
              <span className="account-section-title">Suosikit</span>
            </button>
            <button
              type="button"
              className="account-section account-section--button"
              onClick={onNavigateGroups}
            >
              <span className="account-section-title">Ryhmät</span>
            </button>
          {/* Daniilin rivi: ylimääräinen </div> poistettu tästä, joka sulki kortin liian aikaisin ja siirsi Poista tili -painikkeen kortin ulkopuolelle */}
          {!confirming ? (
            <button
              type="button"
              className="auth-button auth-button--danger"
              onClick={() => setConfirming(true)} //ENSIMMÄINEN VAHVISTUS
            >
              Poista tili
            </button>
          ) : (
            <>
              <p className="auth-error">
                Tämä poistaa tilisi ja kaikki arvostelusi sekä suosikkilistasi
                pysyvästi. Toimintoa ei voi perua.
              </p>
              <div className="auth-confirm-row">
                <button
                  type="button"
                  className="auth-link"
                  onClick={() => setConfirming(false)}
                  disabled={deleting}
                >
                  Peruuta
                </button>
                <button
                  type="button"
                  className="auth-button auth-button--danger"
                  onClick={handleDelete} //LOPULLINEN TILIN POISTO
                  disabled={deleting}
                >
                  {deleting ? 'Poistetaan...' : 'Vahvista poisto'}
                </button>
              </div>
            </>
          )}

          {error && <p className="auth-error">{error}</p>}
        </div>

        <div className="auth-sprockets" aria-hidden="true" />
      </div>

      {/* Daniilin rivi: klikattu arvostelu avaa elokuvan tiedot samassa ponnahdusikkunassa kuin muualla */}
      {openMovieId && (
        <MovieDetails
          movieId={openMovieId}
          user={user}
          onClose={() => setOpenMovieId(null)}
        />
      )}
    </div>
  );
}

export default Account;