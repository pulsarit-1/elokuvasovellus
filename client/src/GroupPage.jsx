import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, authHeaders } from './api';
import './App.css';
import './Home.css';
import './Groups.css';

// Hakee kaiken, mitä ryhmän sivulla näytetään
async function fetchGroupPage(groupId) {
  const headers = authHeaders();
  const groupUrl = `${API_URL}/api/groups/${groupId}`;

  const group = (await axios.get(groupUrl, { headers })).data;
  const isMember = group.my_role === 'owner' || group.my_role === 'member';

  // Palvelin ei anna sisältöä muille kuin jäsenille, joten ei edes kysytä
  if (!isMember) {
    return { group, members: [], movies: [], requests: [] };
  }

  const members = (await axios.get(`${groupUrl}/members`, { headers })).data;
  const movies = (await axios.get(`${groupUrl}/movies`, { headers })).data;

  // Liittymispyynnöt näkee vain omistaja
  let requests = [];
  if (group.my_role === 'owner') {
    requests = (await axios.get(`${groupUrl}/requests`, { headers })).data;
  }

  return { group, members, movies, requests };
}

function GroupPage({ groupId, onBack }) {
  const [page, setPage] = useState(null); // ryhmä, jäsenet, elokuvat ja pyynnöt
  const [error, setError] = useState('');
  const [query, setQuery] = useState(''); // elokuvahaun hakusana
  const [results, setResults] = useState([]); // elokuvahaun tulokset
  const [confirmDelete, setConfirmDelete] = useState(false); // kysytäänkö ryhmän poiston varmistus

  const groupUrl = `${API_URL}/api/groups/${groupId}`;

  // Haetaan sivun tiedot, kun sivu avataan
  useEffect(() => {
    const loadFirstTime = async () => {
      try {
        setPage(await fetchGroupPage(groupId));
      } catch {
        setError('Ryhmän lataus epäonnistui');
      }
    };

    loadFirstTime();
  }, [groupId]);

  // Kaikki painikkeet toimivat samalla kaavalla:
  // tehdään muutos palvelimelle ja haetaan sivun tiedot uudelleen.
  // goBack = true, kun sivulle ei voi enää jäädä (poistuminen ja ryhmän poisto)
  const runAction = async (action, errorText, goBack = false) => {
    setError('');

    try {
      await action();

      if (goBack) {
        onBack();
      } else {
        setPage(await fetchGroupPage(groupId));
      }
    } catch (err) {
      setError(err.response?.data?.error || errorText);
    }
  };

  // Liittymispyynnöt
  const handleApprove = (requestId) =>
    runAction(
      () => axios.patch(`${API_URL}/api/requests/${requestId}/approve`, {}, { headers: authHeaders() }),
      'Hyväksyntä epäonnistui'
    );

  const handleReject = (requestId) =>
    runAction(
      () => axios.patch(`${API_URL}/api/requests/${requestId}/reject`, {}, { headers: authHeaders() }),
      'Hylkäys epäonnistui'
    );

  // Jäsenet
  const handleRemoveMember = (userId) =>
    runAction(
      () => axios.delete(`${groupUrl}/members/${userId}`, { headers: authHeaders() }),
      'Jäsenen poisto epäonnistui'
    );

  const handleLeave = () =>
    runAction(
      () => axios.delete(`${groupUrl}/members/me`, { headers: authHeaders() }),
      'Poistuminen epäonnistui',
      true
    );

  const handleDeleteGroup = () =>
    runAction(
      () => axios.delete(groupUrl, { headers: authHeaders() }),
      'Ryhmän poisto epäonnistui',
      true
    );

  // Elokuvat
  const handleAddMovie = (movie) =>
    runAction(
      () =>
        axios.post(
          `${groupUrl}/movies`,
          { movie_id: movie.id, title: movie.title, poster: movie.poster, year: movie.year },
          { headers: authHeaders() }
        ),
      'Elokuvan lisäys epäonnistui'
    );

  const handleRemoveMovie = (movieId) =>
    runAction(
      () => axios.delete(`${groupUrl}/movies/${movieId}`, { headers: authHeaders() }),
      'Elokuvan poisto epäonnistui'
    );

  // Elokuvahaku, sama palvelimen haku kuin Haku-sivulla
  const handleSearch = async (e) => {
    e.preventDefault(); // ettei sivu lataudu uudelleen
    if (!query.trim()) return;

    setError('');

    try {
      const response = await axios.get(`${API_URL}/api/movies/search`, {
        params: { q: query },
      });
      setResults(response.data);
    } catch {
      setError('Haku epäonnistui');
    }
  };

  // Kun tietoja ei ole vielä saatu, näytetään vain latausteksti tai virhe
  if (!page) {
    return (
      <div className="section">
        <button type="button" className="back-link" onClick={onBack}>
          ← Ryhmät
        </button>
        {error ? <p className="groups-error">{error}</p> : <p>Ladataan ryhmää...</p>}
      </div>
    );
  }

  const { group, members, movies, requests } = page;
  const isOwner = group.my_role === 'owner';
  const isMember = isOwner || group.my_role === 'member';

  // Näistä nähdään hakutuloksissa, mikä elokuva on jo ryhmässä
  const addedIds = movies.map((movie) => movie.movie_id);

  return (
    <div className="section">
      <button type="button" className="back-link" onClick={onBack}>
        ← Ryhmät
      </button>

      <div className="groups-header">
        <h2 className="groups-title">{group.name}</h2>
        {isMember && (
          <span className="group-role">{isOwner ? 'Omistaja' : 'Jäsen'}</span>
        )}
      </div>

      {error && <p className="groups-error">{error}</p>}

      {!isMember && <p>Vain ryhmän jäsenet näkevät ryhmän sisällön.</p>}

      {isMember && (
        <>
          {/* Ryhmän elokuvat */}
          <h3 className="groups-subtitle">Ryhmän elokuvat</h3>

          {movies.length === 0 && (
            <p>Ryhmässä ei ole vielä elokuvia. Lisää ensimmäinen alta.</p>
          )}

          <div className="movie-grid">
            {movies.map((movie) => (
              <div key={movie.movie_id} className="group-movie">
                <div className="movie-poster">
                  {movie.poster ? (
                    <img
                      className="movie-poster-img"
                      src={movie.poster}
                      alt={movie.title}
                    />
                  ) : (
                    <div className="movie-poster-placeholder">Ei julistetta</div>
                  )}
                </div>
                <div className="movie-title">{movie.title}</div>
                <div className="movie-meta">{movie.year}</div>
                <button
                  type="button"
                  className="group-small-button"
                  onClick={() => handleRemoveMovie(movie.movie_id)}
                >
                  Poista
                </button>
              </div>
            ))}
          </div>

          {/* Elokuvan lisäys haun kautta */}
          <h3 className="groups-subtitle">Lisää elokuva</h3>

          <form className="groups-form" onSubmit={handleSearch}>
            <input
              type="text"
              placeholder="Hae elokuvaa nimellä..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
            <button type="submit" className="btn btn-primary">
              Hae
            </button>
          </form>

          <ul className="groups-list">
            {results.map((movie) => (
              <li key={movie.id} className="group-row">
                <span className="group-name">
                  {movie.title} {movie.year && `(${movie.year})`}
                </span>

                {addedIds.includes(movie.id) ? (
                  <span className="group-role">Lisätty</span>
                ) : (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleAddMovie(movie)}
                  >
                    Lisää
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Jäsenet. Poista-painike näkyy vain omistajalle. */}
          <h3 className="groups-subtitle">Jäsenet</h3>

          <ul className="groups-list">
            {members.map((member) => (
              <li key={member.user_id} className="group-row">
                <span className="group-name">{member.email}</span>

                {member.user_id === group.owner_id && (
                  <span className="group-role">Omistaja</span>
                )}

                {isOwner && member.user_id !== group.owner_id && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleRemoveMember(member.user_id)}
                  >
                    Poista
                  </button>
                )}
              </li>
            ))}
          </ul>

          {/* Liittymispyynnöt, vain omistajalle */}
          {isOwner && (
            <>
              <h3 className="groups-subtitle">Liittymispyynnöt</h3>

              {requests.length === 0 && <p>Ei odottavia pyyntöjä.</p>}

              <ul className="groups-list">
                {requests.map((request) => (
                  <li key={request.id} className="group-row">
                    <span className="group-name">{request.email}</span>

                    <span className="group-buttons">
                      <button
                        type="button"
                        className="btn btn-primary"
                        onClick={() => handleApprove(request.id)}
                      >
                        Hyväksy
                      </button>
                      <button
                        type="button"
                        className="btn btn-outline"
                        onClick={() => handleReject(request.id)}
                      >
                        Hylkää
                      </button>
                    </span>
                  </li>
                ))}
              </ul>
            </>
          )}

          {/* Sivun alareuna: jäsen voi poistua, omistaja voi poistaa ryhmän */}
          <div className="group-footer">
            {!isOwner && (
              <button type="button" className="btn btn-outline" onClick={handleLeave}>
                Poistu ryhmästä
              </button>
            )}

            {isOwner && !confirmDelete && (
              <button
                type="button"
                className="btn group-danger"
                onClick={() => setConfirmDelete(true)}
              >
                Poista ryhmä
              </button>
            )}

            {isOwner && confirmDelete && (
              <>
                <span>Poistetaanko ryhmä pysyvästi?</span>
                <button
                  type="button"
                  className="btn group-danger"
                  onClick={handleDeleteGroup}
                >
                  Vahvista poisto
                </button>
                <button
                  type="button"
                  className="btn btn-outline"
                  onClick={() => setConfirmDelete(false)}
                >
                  Peruuta
                </button>
              </>
            )}
          </div>
        </>
      )}
    </div>
  );
}

export default GroupPage;
