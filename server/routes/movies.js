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

module.exports = router;
