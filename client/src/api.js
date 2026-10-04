// Palvelimen osoite ja kirjautumistoken yhdessä paikassa,
// ettei samaa tarvitse kirjoittaa joka sivulle erikseen

export const API_URL = import.meta.env.VITE_API_URL;

// Token mukaan pyyntöön, jos käyttäjä on kirjautunut
export function authHeaders() {
  const token = localStorage.getItem('token');
  return token ? { Authorization: `Bearer ${token}` } : {};
}
