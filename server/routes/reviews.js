const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Lisää arvostelu
router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;

  const {
    movie_id,
    rating,
    review_text
  } = req.body;

  if (!movie_id || !rating || !review_text) {
    return res.status(400).json({
      error: 'Kaikki kentät ovat pakollisia'
    });
  }

  if (rating < 1 || rating > 5) {
    return res.status(400).json({
      error: 'Arvosanan pitää olla välillä 1-5'
    });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO reviews
      (user_id, movie_id, rating, review_text)
      VALUES ($1, $2, $3, $4)
      RETURNING *
      `,
      [
        user_id,
        movie_id,
        rating,
        review_text
      ]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Hae elokuvan arvostelut
router.get('/:movieId', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        r.id,
        r.movie_id,
        r.rating,
        r.review_text,
        r.created_at,
        u.email
      FROM reviews r
      JOIN users u
        ON r.user_id = u.id
      WHERE r.movie_id = $1
      ORDER BY r.created_at DESC
      `,
      [req.params.movieId]
    );

    res.json(result.rows);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

module.exports = router;