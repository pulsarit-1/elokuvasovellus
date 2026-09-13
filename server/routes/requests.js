const express = require('express');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Hyväksy liittymispyyntö
router.patch('/:id/approve', authMiddleware, async (req, res) => {
  try {
    const requestResult = await pool.query(
      `
      SELECT *
      FROM join_requests
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Pyyntöä ei löytynyt'
      });
    }

    const request = requestResult.rows[0];

    const groupResult = await pool.query(
      `
      SELECT owner_id
      FROM groups
      WHERE id = $1
      `,
      [request.group_id]
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
      `
      INSERT INTO group_members
      (group_id, user_id)
      VALUES ($1, $2)
      `,
      [request.group_id, request.user_id]
    );

    await pool.query(
      `
      UPDATE join_requests
      SET status = 'approved'
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({
      status: 'approved'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

// Hylkää liittymispyyntö
router.patch('/:id/reject', authMiddleware, async (req, res) => {
  try {
    const requestResult = await pool.query(
      `
      SELECT *
      FROM join_requests
      WHERE id = $1
      `,
      [req.params.id]
    );

    if (requestResult.rows.length === 0) {
      return res.status(404).json({
        error: 'Pyyntöä ei löytynyt'
      });
    }

    const request = requestResult.rows[0];

    const groupResult = await pool.query(
      `
      SELECT owner_id
      FROM groups
      WHERE id = $1
      `,
      [request.group_id]
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
      `
      UPDATE join_requests
      SET status = 'rejected'
      WHERE id = $1
      `,
      [req.params.id]
    );

    res.json({
      status: 'rejected'
    });

  } catch (err) {
    console.error(err);

    res.status(500).json({
      error: 'Palvelinvirhe'
    });
  }
});

module.exports = router;