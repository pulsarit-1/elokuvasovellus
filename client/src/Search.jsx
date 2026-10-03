import { useEffect, useState } from 'react'; // Daniilin rivi: useEffect lisätty genrejen hakua varten
import axios from 'axios';
import './App.css';
import './Home.css';
import './Search.css';

function Search({ onBackHome }) {
  const [query, setQuery] = useState(''); // luo muistin hakusanalle
  const [genre, setGenre] = useState(null); // Daniilin rivi: muistaa valitun genren
  const [movies, setMovies] = useState([]); //löydetyt elokuvat tallennetaan
  const [loading, setLoading] = useState(false); //luo muistin lataukselle
  const [error, setError] = useState(''); //luo muistin virheelle
  const [searched, setSearched] = useState(false); //luo muistin onko mitään haettu

  // Daniilin rivi: genrelistan ja sen mahdollisen hakuvirheen muisti
  const [genres, setGenres] = useState([]);
  const [genresError, setGenresError] = useState('');

  // Daniilin rivi: haetaan genret backendistä (GET /api/movies/genres) kerran kun sivu avataan
  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/movies/genres`)
      .then((response) => setGenres(response.data))
      .catch(() => setGenresError('Genrejä ei saatu haettua.'));
  }, []);

  // Daniilin rivi: trendaavien elokuvien haku omaksi funktioksi, jotta sitä voi
  // kutsua sekä sivun avautuessa että kun genre-valinta poistetaan
  const loadTrending = () => {
    setLoading(true);
    setError('');

    axios
      .get(`${import.meta.env.VITE_API_URL}/api/movies/trending`)
      .then((response) => setMovies(response.data))
      .catch(() => setError('Elokuvien lataus epäonnistui'))
      .finally(() => setLoading(false));
  };

  // Daniilin rivi: näytetään trendaavat elokuvat heti kun Haku-sivu avataan,
  // ettei ruutu ole tyhjä ennen kuin käyttäjä on hakenut mitään
  useEffect(() => {
    loadTrending();
  }, []);

  // Daniilin rivi (bugikorjaus): TMDB:n hakuAPI (/search/movie) ei tue
  // genre-suodatusta ollenkaan silloin kun hakusana on mukana - backend
  // lähettäisi genren silti mukaan, mutta TMDB jättäisi sen huomiotta.
  // Siksi hakusana ja genre pidetään nyt toisensa poissulkevina: tekstihaku
  // nollaa valitun genren ja genren valinta nollaa hakusanan, jolloin
  // backend käyttää aina oikeaa, toimivaa hakutapaa.
  const runSearch = async (searchQuery, selectedGenre) => {
    if (!searchQuery.trim() && !selectedGenre) return; // estää tyhjän hakusanan lähettämisen

    setLoading(true);
    setError('');

    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/movies/search`, {
        params: { q: searchQuery || undefined, genre: selectedGenre || undefined },
      }); // tee GET-pyyntö palvelimelle hakusanalla
      setMovies(response.data);
      setSearched(true);
    } catch {
      setError('Haku epäonnistui');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault(); // estää sivun uudelleenlatauksen lomakkeen lähetyksen yhteydessä
    setGenre(null); // Daniilin rivi: tekstihaku nollaa aiemman genre-valinnan
    runSearch(query, null);
  };

  // Daniilin rivi: genre-pillin klikkaus - valitsee tai poistaa genren,
  // nollaa aina hakusanan, ja hakee heti uudelleen (tai palaa trendaaviin,
  // jos valinta poistettiin eikä hakusanaakaan ole)
  const handleGenreClick = (id) => {
    const next = genre === id ? null : id; // toinen klikkaus samaan pilliin poistaa valinnan
    setGenre(next);
    setQuery(''); // nollaa hakukentän, koska haku ja genre eivät toimi yhdessä

    if (next) {
      runSearch('', next);
    } else {
      setSearched(false);
      loadTrending();
    }
  };

  return (
    <div className="section">
      <button type="button" className="back-link" onClick={onBackHome}>
        ← Etusivulle
      </button>

      <h2 className="search-title">Hae elokuvia</h2>

      <form className="search-form" onSubmit={handleSearch}>
        <input
          type="text"
          placeholder="Elokuvan nimi..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <button type="submit" className="btn btn-primary" disabled={loading}>
          {loading ? 'Haetaan...' : 'Hae'}
        </button>
      </form>

      {genresError && <p className="search-error">{genresError}</p>}

      {/* Daniilin rivi: genre-suodatinpillit, hakevat ja suodattavat oikeasti */}
      <div className="genre-chip-row">
        {genres.map((g) => (
          <button
            key={g.id}
            type="button"
            className={`genre-chip${genre === g.id ? ' active' : ''}`}
            onClick={() => handleGenreClick(g.id)}
          >
            {g.name}
          </button>
        ))}
      </div>

      {error && <p className="search-error">{error}</p>}

      {searched && movies.length === 0 && !error && <p>Ei tuloksia.</p>}

      <div className="movie-grid">
        {movies.map((movie) => (
          <div key={movie.id} className="movie-card">
            <div className="movie-poster gradient-2">
              {/* Daniilin rivi: movie.poster_path -> movie.poster, backend palauttaa nyt valmiin kuva-URL:n */}
              {movie.poster && (
                <img src={movie.poster} alt={movie.title} />
              )}
              <span className="movie-rating">★ {movie.rating}</span> {/* Daniilin rivi: movie.vote_average.toFixed(1) -> movie.rating */}
            </div>
            <div className="movie-title">{movie.title}</div>
            <div className="movie-meta">
              {movie.year} {/* Daniilin rivi: movie.release_date -> movie.year */}
              {movie.genre && ` · ${movie.genre}`} {/* Daniilin rivi: näyttää elokuvan genren kortissa */}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Search;
