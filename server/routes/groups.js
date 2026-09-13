const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Hae kaikki ryhmät
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM groups ORDER BY created_at DESC'
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Hae yksi ryhmä
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        error: 'Ryhmää ei löytynyt'
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

// Luo uusi ryhmä
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const owner_id = req.user.userId;

  try {
    const result = await pool.query(
      `
      INSERT INTO groups (name, owner_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name, owner_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Poista ryhmä (vain omistaja)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const groupResult = await pool.query(
      'SELECT * FROM groups WHERE id = $1',
      [req.params.id]
    );

    if (groupResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Ryhmää ei löytynyt'
      });
    }

    const group = groupResult.rows[0];

    if (group.owner_id !== req.user.userId) {
      return res.status(403).json({
        error: 'Ei käyttöoikeutta'
      });
    }

    await pool.query(
      'DELETE FROM groups WHERE id = $1',
      [req.params.id]
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

// Lähetä liittymispyyntö
router.post('/:id/request', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      `
      INSERT INTO join_requests
      (group_id, user_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [req.params.id, user_id]
    );

    res.status(201).json(result.rows[0]);

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Hae liittymispyynnöt
router.get('/:id/requests', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        jr.id,
        jr.status,
        jr.created_at,
        u.email
      FROM join_requests jr
      JOIN users u
        ON jr.user_id = u.id
      WHERE jr.group_id = $1
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

// Liity ryhmään
router.post('/:id/join', authMiddleware, async (req, res) => {
  const user_id = req.user.userId;

  try {
    const result = await pool.query(
      `
      INSERT INTO group_members (group_id, user_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [req.params.id, user_id]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Hae jäsenet
router.get('/:id/members', async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT
        gm.user_id,
        u.email
      FROM group_members gm
      JOIN users u
        ON gm.user_id = u.id
      WHERE gm.group_id = $1
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

// Poista jäsen ryhmästä
router.delete('/:groupId/members/:userId', authMiddleware, async (req, res) => {
  try {
    await pool.query(
      `
      DELETE FROM group_members
      WHERE group_id = $1
      AND user_id = $2
      `,
      [req.params.groupId, req.params.userId]
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