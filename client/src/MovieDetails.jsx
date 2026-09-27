import { useEffect, useState } from 'react';
import axios from 'axios';
import './MovieDetails.css';

function MovieDetails({ movieId, onClose }) {
  const [movie, setMovie] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

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