// Luo tietokannan taulut schema.sql:n perusteella.
// Käyttö: npm run db:init  (server-kansiosta; vaatii DATABASE_URL:n .env:ssä)
require('dotenv').config();
const fs = require('fs');
const path = require('path');
const pool = require('../db');

async function main() {
  const schemaPath = path.join(__dirname, '..', 'schema.sql');
  const sql = fs.readFileSync(schemaPath, 'utf8');

  console.log('Ajetaan schema.sql...');
  await pool.query(sql);
  console.log('Taulut luotu (tai olivat jo olemassa).');

  await pool.end();
}

main().catch((err) => {
  console.error('Tietokannan alustus epäonnistui:', err.message);
  process.exit(1);
});
