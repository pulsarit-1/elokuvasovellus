require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'Palvelin toimii!' });
});

app.get('/api/db-test', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()');
    res.json({ status: 'ok', aika: result.rows[0].now });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', message: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Palvelin käynnissä portissa ${PORT}`);
});

app.get('/api/test-jwt', (req, res) => {
  const jwt = require('jsonwebtoken');

  const token = jwt.sign(
    {
      userId: 2,
      email: 'testi@testi.fi'
    },
    process.env.JWT_SECRET,
    {
      expiresIn: '24h'
    }
  );

  res.json({ token });
});