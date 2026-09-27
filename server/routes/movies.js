const express = require('express');
const axios = require('axios');

const router = express.Router();

const TMDB_URL = 'https://api.themoviedb.org/3';
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';

// Genret tallennetaan muistiin
let genreNames = null;

async function getGenreNames() {
  if (genreNames) {
    return genreNames;
  }

  const response = await axios.get(`${TMDB_URL}/genre/movie/list`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      language: 'fi-FI'
    }
  });

  genreNames = {};

  for (const genre of response.data.genres) {
    genreNames[genre.id] = genre.name;
  }

  return genreNames;
}

// Muotoilu frontendille
function formatMovie(movie, genres) {
  return {
    id: movie.id,
    title: movie.title || movie.name || '',
    year: movie.release_date
      ? movie.release_date.slice(0, 4)
      : '',
    genre: movie.genre_ids?.length
      ? movie.genre_ids
          .map((id) => genres[id])
          .filter(Boolean)
          .slice(0, 2)
          .join(' · ')
      : '',
    rating: movie.vote_average
      ? movie.vote_average.toFixed(1)
      : '–',
    poster: movie.poster_path
      ? POSTER_URL + movie.poster_path
      : null
  };
}

// Funktio TMDB-listojen hakuun
async function getMovieList(path, params = {}) {
  const genres = await getGenreNames();

  const response = await axios.get(`${TMDB_URL}${path}`, {
    params: {
      api_key: process.env.TMDB_API_KEY,
      language: 'fi-FI',
      ...params
    }
  });

  return response.data.results.map((movie) =>
    formatMovie(movie, genres)
  );
}

// Haku suomeksi
router.get('/search', async (req, res) => {
  try {
    const { q, year, genre } = req.query;

    const params = {
      api_key: process.env.TMDB_API_KEY,
      language: 'fi-FI'
    };

    if (q) {
      params.query = q;
    }

    if (year) {
      params.year = year;
    }

    if (genre) {
      params.with_genres = genre;
    }

    const endpoint = q
      ? '/search/movie'
      : '/discover/movie';

    const response = await axios.get(
      `${TMDB_URL}${endpoint}`,
      { params }
    );

    const genres = await getGenreNames();

    const movies = response.data.results.map((movie) =>
      formatMovie(movie, genres)
    );

    res.json(movies);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

// Viikon trendaavat
router.get('/trending', async (req, res) => {
  try {
    const movies = await getMovieList(
      '/trending/movie/week'
    );

    res.json(movies);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

// Suomi - nyt teatterissa
router.get('/now-playing', async (req, res) => {
  try {
    const movies = await getMovieList(
      '/movie/now_playing',
      {
        region: 'FI'
      }
    );

    res.json(movies);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

// Yhden elokuvan tarkemmat tiedot ja arvostelut
// :id = valitun elokuvan TMDB-ID
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Haetaan TMDB:stä elokuvan tiedot ja arvostelut
    const response = await axios.get(
      `${TMDB_URL}/movie/${id}`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          language: 'fi-FI',
          append_to_response: 'reviews'
        }
      }
    );

    const movie = response.data;

    // Muutetaan TMDB:n vastaus frontendille sopivaan muotoon
    res.json({
      id: movie.id,

      title: movie.title || '',

      year: movie.release_date
        ? movie.release_date.slice(0, 4)
        : '',

      overview: movie.overview || '',

      rating: movie.vote_average
        ? movie.vote_average.toFixed(1)
        : '–',

      runtime: movie.runtime || null,

      poster: movie.poster_path
        ? POSTER_URL + movie.poster_path
        : null,

      // Elokuvan genret
      genres: movie.genres
        ? movie.genres.map((genre) => genre.name)
        : [],

      // Elokuvan arvostelut
      reviews: movie.reviews?.results
        ? movie.reviews.results.map((review) => ({
            id: review.id,
            author: review.author,
            content: review.content,
            rating: review.author_details?.rating || null
          }))
        : []
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Elokuvan tietojen haku epäonnistui'
    });
  }
});

module.exports = router;