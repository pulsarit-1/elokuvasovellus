const express = require('express');
const bcrypt = require('bcrypt');
const pool = require('../db');

const router = express.Router();

router.post('/register', async (req, res) => {
  const { email, password } = req.body;

  // Validointi työohjeen vaatimusten mukaan
  if (!email || !password) {
    return res.status(400).json({ error: 'Sähköposti ja salasana vaaditaan' });
  }

  const passwordRegex = /^(?=.*[A-Z])(?=.*\d).{8,}$/;
  if (!passwordRegex.test(password)) {
    return res.status(400).json({
      error: 'Salasanan pitää olla vähintään 8 merkkiä ja sisältää iso kirjain ja numero'
    });
  }

  try {
    const passwordHash = await bcrypt.hash(password, 10);

    const result = await pool.query(
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    res.status(201).json({ status: 'ok', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') {
      // Postgresin virhekoodi uniikin rajoitteen rikkomiselle
      return res.status(409).json({ error: 'Sähköposti on jo käytössä' });
    }
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

module.exports = router;