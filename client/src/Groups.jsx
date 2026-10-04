import { useEffect, useState } from 'react';
import axios from 'axios';
import { API_URL, authHeaders } from './api';
import './App.css';
import './Home.css';
import './Groups.css';

// Hakee ryhmälistan palvelimelta
async function fetchGroups() {
  const response = await axios.get(`${API_URL}/api/groups`, {
    headers: authHeaders(),
  });
  return response.data;
}

function Groups({ user, onBack, onOpenGroup }) {
  const [groups, setGroups] = useState([]); // kaikki ryhmät palvelimelta
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false); // näkyykö Luo ryhmä -lomake
  const [newName, setNewName] = useState(''); // uuden ryhmän nimi

  // Haetaan lista kerran, kun sivu avataan
  useEffect(() => {
    const loadFirstTime = async () => {
      try {
        setGroups(await fetchGroups());
      } catch {
        setError('Ryhmien lataus epäonnistui');
      } finally {
        setLoading(false);
      }
    };

    loadFirstTime();
  }, []);

  // Luo ryhmä -lomakkeen lähetys
  const handleCreate = async (e) => {
    e.preventDefault(); // ettei sivu lataudu uudelleen
    if (!newName.trim()) return; // tyhjää nimeä ei lähetetä

    setError('');

    try {
      await axios.post(
        `${API_URL}/api/groups`,
        { name: newName },
        { headers: authHeaders() }
      );
      setNewName('');
      setShowForm(false);
      setGroups(await fetchGroups()); // haetaan lista uudelleen, niin uusi ryhmä näkyy
    } catch (err) {
      setError(err.response?.data?.error || 'Ryhmän luonti epäonnistui');
    }
  };

  // Pyydä liittymistä -painike
  const handleJoinRequest = async (groupId) => {
    setError('');

    try {
      await axios.post(
        `${API_URL}/api/groups/${groupId}/request`,
        {},
        { headers: authHeaders() }
      );
      setGroups(await fetchGroups()); // painikkeen teksti vaihtuu, kun lista päivittyy
    } catch (err) {
      setError(err.response?.data?.error || 'Pyynnön lähetys epäonnistui');
    }
  };

  // Jaetaan ryhmät kahteen listaan oman roolin mukaan
  const myGroups = groups.filter(
    (group) => group.my_role === 'owner' || group.my_role === 'member'
  );
  const otherGroups = groups.filter(
    (group) => group.my_role === 'pending' || group.my_role === 'none'
  );

  return (
    <div className="section">
      <button type="button" className="back-link" onClick={onBack}>
        ← Takaisin
      </button>

      <div className="groups-header">
        <h2 className="groups-title">Ryhmät</h2>

        {/* Luo ryhmä näkyy vain kirjautuneelle */}
        {user && !showForm && (
          <button
            type="button"
            className="btn btn-primary"
            onClick={() => setShowForm(true)}
          >
            Luo ryhmä
          </button>
        )}
      </div>

      {showForm && (
        <form className="groups-form" onSubmit={handleCreate}>
          <input
            type="text"
            placeholder="Ryhmän nimi..."
            value={newName}
            maxLength={50}
            onChange={(e) => setNewName(e.target.value)}
          />
          <button type="submit" className="btn btn-primary">
            Luo
          </button>
          <button
            type="button"
            className="btn btn-outline"
            onClick={() => setShowForm(false)}
          >
            Peruuta
          </button>
        </form>
      )}

      {error && <p className="groups-error">{error}</p>}
      {loading && <p>Ladataan ryhmiä...</p>}

      {/* Omat ryhmät: ne joissa olen omistaja tai jäsen */}
      {user && !loading && (
        <>
          <h3 className="groups-subtitle">Omat ryhmät</h3>

          {myGroups.length === 0 && <p>Et kuulu vielä yhteenkään ryhmään.</p>}

          <ul className="groups-list">
            {myGroups.map((group) => (
              <li key={group.id} className="group-row">
                <span className="group-name">{group.name}</span>

                <span className="group-buttons">
                  <span className="group-role">
                    {group.my_role === 'owner' ? 'Omistaja' : 'Jäsen'}
                  </span>
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => onOpenGroup(group.id)}
                  >
                    Avaa
                  </button>
                </span>
              </li>
            ))}
          </ul>
        </>
      )}

      {/* Muut ryhmät: näihin voi pyytää liittymistä */}
      {!loading && (
        <>
          <h3 className="groups-subtitle">
            {user ? 'Muut ryhmät' : 'Kaikki ryhmät'}
          </h3>

          {otherGroups.length === 0 && <p>Ei muita ryhmiä.</p>}

          <ul className="groups-list">
            {otherGroups.map((group) => (
              <li key={group.id} className="group-row">
                <span className="group-name">{group.name}</span>

                {user && group.my_role === 'none' && (
                  <button
                    type="button"
                    className="btn btn-outline"
                    onClick={() => handleJoinRequest(group.id)}
                  >
                    Pyydä liittymistä
                  </button>
                )}

                {user && group.my_role === 'pending' && (
                  <span className="group-role">Pyyntö odottaa</span>
                )}
              </li>
            ))}
          </ul>
        </>
      )}
    </div>
  );
}

export default Groups;
