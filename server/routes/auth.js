const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../db');

const router = express.Router();

//REKISTERÖITYMISRAJAPINTA UUDEN KÄYTTÄJÄN LUOMISEEN
router.post('/register', async (req, res) => {
  const { email, password } = req.body;

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
    const passwordHash = await bcrypt.hash(password, 10); //SALAUS ENNEN TIETOKANTAAN TALLENNUSTA

    const result = await pool.query( //KÄYTTÄJÄN TALLENNUS
      'INSERT INTO users (email, password_hash) VALUES ($1, $2) RETURNING id, email, created_at',
      [email, passwordHash]
    );

    res.status(201).json({ status: 'ok', user: result.rows[0] });
  } catch (err) {
    if (err.code === '23505') { //ONKO SÄHKÖPOSTI KÄYTÖSSÄ?
      return res.status(409).json({ error: 'Sähköposti on jo käytössä' });
    }
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

router.post('/login', async (req, res) => { //KÄYTTÄJÄNTUNNISTUS RAJAPINTA
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: 'Sähköposti ja salasana vaaditaan' });
  }

  try {
    const result = await pool.query(
      'SELECT id, email, password_hash FROM users WHERE email = $1',
      [email]
    );

    if (result.rows.length === 0) {
      return res.status(401).json({ error: 'Väärä sähköposti tai salasana' });
    }

    const user = result.rows[0];
    const passwordMatches = await bcrypt.compare(password, user.password_hash);

    if (!passwordMatches) {
      return res.status(401).json({ error: 'Väärä sähköposti tai salasana' });
    }

    const token = jwt.sign(
      { userId: user.id, email: user.email }, //TOKENIIN KÄYTTÄJÄN TUNNISTETIEDOT
      process.env.JWT_SECRET,
      { expiresIn: '24h' } /VOIMASSAOLO
    );

    res.json({ status: 'ok', token }); //JWT-TOKEN FRONTENDILLE
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

module.exports = router;