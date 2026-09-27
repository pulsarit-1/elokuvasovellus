const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Luo uusi suosikkilista
router.post('/lists', authMiddleware, async (req, res) => {
  const { name } = req.body;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Listan nimi vaaditaan' });
  }

  try {
    const result = await pool.query(
      'INSERT INTO favorite_lists (user_id, name) VALUES ($1, $2) RETURNING *',
      [req.user.userId, name.trim()]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Hae omat listat (ilman elokuvia, vain listan tiedot)
router.get('/lists/me', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM favorite_lists WHERE user_id = $1 ORDER BY created_at DESC',
      [req.user.userId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Hae yksittäinen lista JA sen elokuvat — julkinen, ei vaadi kirjautumista (jakamista varten)
router.get('/lists/:id', async (req, res) => {
  try {
    const listResult = await pool.query(
      'SELECT * FROM favorite_lists WHERE id = $1',
      [req.params.id]
    );

    if (listResult.rows.length === 0) {
      return res.status(404).json({ error: 'Listaa ei löytynyt' });
    }

    const itemsResult = await pool.query(
      'SELECT movie_id, added_at FROM favorite_list_items WHERE list_id = $1 ORDER BY added_at DESC',
      [req.params.id]
    );

    res.json({ ...listResult.rows[0], movies: itemsResult.rows });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Lisää elokuva listalle (vain listan omistaja)
router.post('/lists/:id/movies', authMiddleware, async (req, res) => {
  const { movie_id } = req.body;

  try {
    const listCheck = await pool.query(
      'SELECT * FROM favorite_lists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (listCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Ei oikeutta tähän listaan' });
    }

    const result = await pool.query(
      'INSERT INTO favorite_list_items (list_id, movie_id) VALUES ($1, $2) ON CONFLICT DO NOTHING RETURNING *',
      [req.params.id, movie_id]
    );

    res.status(201).json(result.rows[0] || { message: 'Elokuva on jo listalla' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Poista elokuva listalta (vain listan omistaja)
router.delete('/lists/:id/movies/:movieId', authMiddleware, async (req, res) => {
  try {
    const listCheck = await pool.query(
      'SELECT * FROM favorite_lists WHERE id = $1 AND user_id = $2',
      [req.params.id, req.user.userId]
    );

    if (listCheck.rows.length === 0) {
      return res.status(403).json({ error: 'Ei oikeutta tähän listaan' });
    }

    await pool.query(
      'DELETE FROM favorite_list_items WHERE list_id = $1 AND movie_id = $2',
      [req.params.id, req.params.movieId]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Poista koko lista (vain omistaja)
router.delete('/lists/:id', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'DELETE FROM favorite_lists WHERE id = $1 AND user_id = $2 RETURNING *',
      [req.params.id, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(403).json({ error: 'Ei oikeutta tähän listaan' });
    }

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

module.exports = router;