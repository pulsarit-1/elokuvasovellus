require('dotenv').config();
const express = require('express');
const cors = require('cors');
const pool = require('./db');
const authRoutes = require('./routes/auth');
const authMiddleware = require('./middleware/authMiddleware');
const reviewRoutes = require('./routes/reviews');
const movieRoutes = require('./routes/movies');
const groupRoutes = require('./routes/groups');
const requestRoutes = require('./routes/requests');
const favoriteRoutes = require('./routes/favorites');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

app.use('/api', authRoutes);
app.use('/api/reviews', reviewRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/requests', requestRoutes);
app.use('/api/favorites', favoriteRoutes);
app.use('/api/users', userRoutes);

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


app.get('/api/profile', authMiddleware, (req, res) => {
  res.json({
    user: req.user
  });
});

app.get('/api/profile', authMiddleware, (req, res) => {
  console.log(req.user);

  res.json({
    status: 'ok',
    user: req.user
  });
});