const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const { q, year, genre } = req.query;

    const params = {
      api_key: process.env.TMDB_API_KEY
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

    const endpoint =
      q
        ? 'https://api.themoviedb.org/3/search/movie'
        : 'https://api.themoviedb.org/3/discover/movie';

    const response = await axios.get(endpoint, {
      params
    });

    res.json(response.data.results);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

const TMDB_URL = 'https://api.themoviedb.org/3';
const POSTER_URL = 'https://image.tmdb.org/t/p/w500';

// Api hakee genret id:llä ja palauttaa ne nimenä. haetaan vain kerran

let genreNames = null;

async function getGenreNames() {
  if (genreNames) {
    return genreNames;
  }

  const response = await axios.get(`${TMDB_URL}/genre/movie/list`, {
    params: { api_key: process.env.TMDB_API_KEY, language: 'fi-FI' }
  });

  genreNames = {};
  for (const genre of response.data.genres) {
    genreNames[genre.id] = genre.name;
  }
  return genreNames;
}

// Formatointi näytettävään muotoon

function formatMovie(movie, genres) {
  return {
    id: movie.id,
    title: movie.title,
    year: movie.release_date ? movie.release_date.slice(0, 4) : '',
    genre: genres[movie.genre_ids[0]] || '',
    rating: movie.vote_average.toFixed(1),
    poster: movie.poster_path ? POSTER_URL + movie.poster_path : null
  };
}

// Hakee viisi viimeisintä elokuvaa 

async function getMovieList(path) {
  const genres = await getGenreNames();

  const response = await axios.get(`${TMDB_URL}${path}`, {
    params: { api_key: process.env.TMDB_API_KEY, language: 'fi-FI', region: 'FI' }
  });

  return response.data.results
    .slice(0, 5)
    .map((movie) => formatMovie(movie, genres));
}

router.get('/trending', async (req, res) => {
  try {
    res.json(await getMovieList('/trending/movie/week'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TMDB virhe' });
  }
});

router.get('/now-playing', async (req, res) => {
  try {
    res.json(await getMovieList('/movie/now_playing'));
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'TMDB virhe' });
  }
});

module.exports = router;
