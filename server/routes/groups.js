const express = require('express');
const jwt = require('jsonwebtoken');
const pool = require('../db');
const authMiddleware = require('../middleware/authMiddleware');

const router = express.Router();

// Kertoo kuka pyynnön lähetti. Jos ei ole kirjautunut, palauttaa null.
// Tarvitaan koska ryhmälistan saa nähdä myös ilman kirjautumista.
function getUserId(req) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    return null;
  }

  try {
    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    return decoded.userId;
  } catch {
    return null;
  }
}

// Sama kysely ryhmälistalle ja yhdelle ryhmälle.
// my_role kertoo käyttäjän tilanteen ryhmässä: owner, member, pending tai none
const GROUP_QUERY = `
  SELECT
    g.id,
    g.name,
    g.owner_id,
    g.created_at,
    CASE
      WHEN g.owner_id = $1 THEN 'owner'
      WHEN EXISTS (
        SELECT 1 FROM group_members gm
        WHERE gm.group_id = g.id AND gm.user_id = $1
      ) THEN 'member'
      WHEN EXISTS (
        SELECT 1 FROM join_requests jr
        WHERE jr.group_id = g.id AND jr.user_id = $1 AND jr.status = 'pending'
      ) THEN 'pending'
      ELSE 'none'
    END AS my_role
  FROM groups g
`;

// Hakee ryhmän ennen varsinaista reittiä ja laittaa sen talteen req.group:iin.
// Jos ryhmää ei ole, vastataan 404 eikä reittiä ajeta ollenkaan.
async function loadGroup(req, res, next) {
  try {
    const result = await pool.query(
      GROUP_QUERY + ' WHERE g.id = $2',
      [getUserId(req), req.params.id]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Ryhmää ei löytynyt' });
    }

    req.group = result.rows[0];
    next();
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
}

// Päästää läpi vain ryhmän jäsenet (omistaja lasketaan jäseneksi)
function membersOnly(req, res, next) {
  if (req.group.my_role !== 'owner' && req.group.my_role !== 'member') {
    return res.status(403).json({ error: 'Vain ryhmän jäsenille' });
  }

  next();
}

// Päästää läpi vain ryhmän omistajan
function ownerOnly(req, res, next) {
  if (req.group.my_role !== 'owner') {
    return res.status(403).json({ error: 'Vain ryhmän omistajalle' });
  }

  next();
}

// ---------- Ryhmät ----------

// Hae kaikki ryhmät (näkyy kaikille)
router.get('/', async (req, res) => {
  try {
    const result = await pool.query(
      GROUP_QUERY + ' ORDER BY g.created_at DESC',
      [getUserId(req)]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Hae yksi ryhmä: nimi ja oma rooli. Tarkempi sisältö on omissa reiteissään.
router.get('/:id', loadGroup, (req, res) => {
  res.json(req.group);
});

// Luo uusi ryhmä
router.post('/', authMiddleware, async (req, res) => {
  const { name } = req.body;
  const owner_id = req.user.userId;

  if (!name || !name.trim()) {
    return res.status(400).json({ error: 'Ryhmän nimi vaaditaan' });
  }

  // Tehdään kaksi lisäystä: ryhmä ja omistaja sen jäseneksi.
  // BEGIN ja COMMIT pitävät huolen että molemmat onnistuvat tai ei kumpikaan.
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    const result = await client.query(
      `
      INSERT INTO groups (name, owner_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [name.trim(), owner_id]
    );

    const group = result.rows[0];

    await client.query(
      `
      INSERT INTO group_members (group_id, user_id)
      VALUES ($1, $2)
      `,
      [group.id, owner_id]
    );

    await client.query('COMMIT');

    res.status(201).json(group);
  } catch (err) {
    // Jos jokin meni pieleen, perutaan kaikki
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  } finally {
    // Yhteys pitää aina palauttaa takaisin
    client.release();
  }
});

// Poista ryhmä (vain omistaja)
router.delete('/:id', authMiddleware, loadGroup, ownerOnly, async (req, res) => {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    // Ensin ryhmään liittyvät rivit, lopuksi itse ryhmä
    await client.query('DELETE FROM join_requests WHERE group_id = $1', [req.group.id]);
    await client.query('DELETE FROM group_members WHERE group_id = $1', [req.group.id]);
    await client.query('DELETE FROM groups WHERE id = $1', [req.group.id]);

    await client.query('COMMIT');

    res.json({ status: 'ok' });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  } finally {
    client.release();
  }
});

// ---------- Liittymispyynnöt ----------

// Lähetä liittymispyyntö
router.post('/:id/request', authMiddleware, loadGroup, async (req, res) => {
  // Pyynnön voi lähettää vain jos ei ole jo mukana eikä pyyntö ole jo odottamassa
  if (req.group.my_role !== 'none') {
    return res.status(409).json({ error: 'Olet jo ryhmässä tai pyyntösi odottaa' });
  }

  try {
    const result = await pool.query(
      `
      INSERT INTO join_requests (group_id, user_id)
      VALUES ($1, $2)
      RETURNING *
      `,
      [req.group.id, req.user.userId]
    );

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Hae odottavat liittymispyynnöt (vain omistaja)
router.get('/:id/requests', authMiddleware, loadGroup, ownerOnly, async (req, res) => {
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
        AND jr.status = 'pending'
      ORDER BY jr.created_at
      `,
      [req.group.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// ---------- Jäsenet ----------

// Hae jäsenet (vain jäsenille)
router.get('/:id/members', authMiddleware, loadGroup, membersOnly, async (req, res) => {
  try {
    // Omistaja otetaan mukaan erikseen, koska vanhoissa ryhmissä
    // häntä ei ole lisätty group_members-tauluun
    const result = await pool.query(
      `
      SELECT
        u.id AS user_id,
        u.email
      FROM users u
      WHERE u.id = $2
        OR u.id IN (
          SELECT user_id FROM group_members WHERE group_id = $1
        )
      ORDER BY u.email
      `,
      [req.group.id, req.group.owner_id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Poistu ryhmästä itse
// Tämän pitää olla ennen /:id/members/:userId -reittiä, muuten "me" luettaisiin käyttäjän id:ksi
router.delete('/:id/members/me', authMiddleware, loadGroup, async (req, res) => {
  if (req.group.my_role === 'owner') {
    return res.status(400).json({
      error: 'Omistaja ei voi poistua ryhmästä. Poista ryhmä sen sijaan.'
    });
  }

  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.group.id, req.user.userId]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Poista jäsen ryhmästä (vain omistaja)
router.delete('/:id/members/:userId', authMiddleware, loadGroup, ownerOnly, async (req, res) => {
  if (String(req.params.userId) === String(req.group.owner_id)) {
    return res.status(400).json({ error: 'Omistajaa ei voi poistaa ryhmästä' });
  }

  try {
    await pool.query(
      'DELETE FROM group_members WHERE group_id = $1 AND user_id = $2',
      [req.group.id, req.params.userId]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// ---------- Ryhmän elokuvat ----------

// Hae ryhmän elokuvat (vain jäsenille)
router.get('/:id/movies', authMiddleware, loadGroup, membersOnly, async (req, res) => {
  try {
    const result = await pool.query(
      `
      SELECT movie_id, title, poster, year, created_at
      FROM group_movies
      WHERE group_id = $1
      ORDER BY created_at DESC
      `,
      [req.group.id]
    );

    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Lisää elokuva ryhmään (vain jäsenille)
router.post('/:id/movies', authMiddleware, loadGroup, membersOnly, async (req, res) => {
  const { movie_id, title, poster, year } = req.body;

  if (!movie_id || !title) {
    return res.status(400).json({ error: 'Elokuvan tiedot puuttuvat' });
  }

  try {
    // ON CONFLICT DO NOTHING: jos elokuva on jo ryhmässä, mitään ei lisätä
    const result = await pool.query(
      `
      INSERT INTO group_movies (group_id, movie_id, title, poster, year, added_by)
      VALUES ($1, $2, $3, $4, $5, $6)
      ON CONFLICT (group_id, movie_id) DO NOTHING
      RETURNING *
      `,
      [req.group.id, movie_id, title, poster || null, year || null, req.user.userId]
    );

    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Elokuva on jo ryhmässä' });
    }

    res.status(201).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

// Poista elokuva ryhmästä (vain jäsenille)
router.delete('/:id/movies/:movieId', authMiddleware, loadGroup, membersOnly, async (req, res) => {
  try {
    await pool.query(
      'DELETE FROM group_movies WHERE group_id = $1 AND movie_id = $2',
      [req.group.id, req.params.movieId]
    );

    res.json({ status: 'ok' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Palvelinvirhe' });
  }
});

module.exports = router;
