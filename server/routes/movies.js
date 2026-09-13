const express = require('express');
const axios = require('axios');

const router = express.Router();

router.get('/search', async (req, res) => {
  try {
    const query = req.query.q;

    const response = await axios.get(
      'https://api.themoviedb.org/3/search/movie',
      {
        params: {
          api_key: process.env.TMDB_API_KEY,
          query
        }
      }
    );

    res.json(response.data.results);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

router.get('/now-playing', async (req, res) => {
  try {
    const response = await axios.get(
      'https://api.themoviedb.org/3/movie/now_playing',
      {
        params: {
          api_key: process.env.TMDB_API_KEY
        }
      }
    );

    res.json(response.data.results);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

router.get('/:id', async (req, res) => {
  try {
    const response = await axios.get(
      `https://api.themoviedb.org/3/movie/${req.params.id}`,
      {
        params: {
          api_key: process.env.TMDB_API_KEY
        }
      }
    );

    res.json(response.data);
  } catch (err) {
    console.error(err);
    res.status(500).json({
      error: 'TMDB virhe'
    });
  }
});

module.exports = router;
