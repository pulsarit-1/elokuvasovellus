const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Hae oman käyttäjän tiedot
router.get('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT id, email, created_at
      FROM users
      WHERE id = $1
      `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Käyttäjää ei löytynyt'
      });
    }

    res.json(result.rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Poista oma käyttäjätili
router.delete('/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `
      DELETE FROM users
      WHERE id = $1
      RETURNING id, email
      `,
      [req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Käyttäjää ei löytynyt'
      });
    }

    res.json({
      status: 'ok',
      message: 'Käyttäjä poistettu',
      deletedUser: result.rows[0]
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Julkinen suosikkilista
router.get('/:id/favorites', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT *
      FROM favorites
      WHERE user_id = $1
      ORDER BY created_at DESC
      `,
      [req.params.id]
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
