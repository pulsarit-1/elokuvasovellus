const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Lisää suosikki
router.post('/', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;
  const { movie_id } = req.body;

  try {
    const result = await pool.query(
      `
      INSERT INTO favorites (user_id, movie_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [user_id, movie_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Hae omat suosikit
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.user.userId]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Poista suosikki
router.delete('/:movieId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM favorites
      WHERE user_id = $1
      AND movie_id = $2
      `,
      [req.user.userId, req.params.movieId]
    );

    res.json({
      status: 'ok'
    });
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

module.exports = router;