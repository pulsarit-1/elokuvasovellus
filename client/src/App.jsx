import { useState, useEffect } from 'react';
import Home from './Home';
import Login from './Login';
import Search from './Search';
import Register from './Register';
import Account from './Account';
import Groups from './Groups';
import GroupPage from './GroupPage';
import Favorites from './Favorites';
import SharedList from './SharedList'; // Daniilin rivi: jaetun suosikkilistan sivu

function App() {
  const [view, setView] = useState('home');
  // Daniilin rivi: kirjautuminen luetaan heti localStoragesta, jotta jaetun linkin avaaja
  // ei näe hetkeksi kirjautumissivua vaikka olisi jo kirjautunut
  const [user, setUser] = useState(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    return token && email ? { email } : null;
  });
  const [selectedGroupId, setSelectedGroupId] = useState(null); // mikä ryhmä on auki

  // Daniilin rivi: jos osoitteessa on ?list=ID, avataan jaettu suosikkilista.
  // Lista näytetään vain kirjautuneelle käyttäjälle, muuten pyydetään ensin kirjautumaan
  const sharedListId = new URLSearchParams(window.location.search).get('list');
  const [sharedList, setSharedList] = useState(sharedListId);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const email = localStorage.getItem('userEmail');
    if (token && email) {
      setUser({ email });
    }
  }, []);

  const handleLoginSuccess = (email) => {
    setUser({ email });
    setView('home');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUser(null);
    setView('home');
  };

  const handleAccountDeleted = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    setUser(null);
    setView('home');
  };

  // Daniilin rivi: jaettu lista näytetään ensimmäisenä. Takaisin-napilla linkin parametri
  // poistetaan osoitteesta ja palataan etusivulle
  if (sharedList) {
    const leaveSharedList = () => {
      window.history.replaceState({}, '', window.location.pathname);
      setSharedList(null);
      setView('home');
    };

    // Kirjautumaton käyttäjä ohjataan kirjautumaan. Kirjautumisen jälkeen lista aukeaa
    if (!user) {
      return view === 'register' ? (
        <Register
          onSwitchToLogin={() => setView('login')}
          onBackHome={leaveSharedList}
        />
      ) : (
        <Login
          notice="Kirjaudu sisään nähdäksesi jaetun suosikkilistan."
          onSwitchToRegister={() => setView('register')}
          onBackHome={leaveSharedList}
          onLoginSuccess={handleLoginSuccess}
        />
      );
    }

    return (
      <SharedList listId={sharedList} user={user} onBackHome={leaveSharedList} />
    );
  }

  if (view === 'home') {
    return (
      <Home
        user={user}
        onNavigateLogin={() => setView('login')}
        onNavigateSearch={() => setView('search')}
        onNavigateFavorites={() => setView('favorites')}
        onNavigateAccount={() => setView('account')}
        onLogout={handleLogout}
      />
    );
  }

if (view === 'search') {
  return <Search user={user} onBackHome={() => setView('home')} />;
}

  // Suosikit-sivu vain kirjautuneelle. Muuten päädytään alla kirjautumissivulle.
  if (view === 'favorites' && user) {
    return <Favorites user={user} onBackHome={() => setView('home')} />;
  }

  if (view === 'account') {
    return (
      <Account
        user={user}
        onBackHome={() => setView('home')}
        onNavigateGroups={() => setView('groups')}
        onNavigateFavorites={() => setView('favorites')}
        onAccountDeleted={handleAccountDeleted}
      />
    );
  }

  // Ryhmäsivu, tänne tullaan Oma tili -sivulta
  if (view === 'groups') {
    return (
      <Groups
        user={user}
        onBack={() => setView('account')}
        onOpenGroup={(groupId) => {
          setSelectedGroupId(groupId);
          setView('group');
        }}
      />
    );
  }

  // Yhden ryhmän oma sivu, tänne tullaan ryhmälistan Avaa-painikkeesta
  if (view === 'group') {
    return (
      <GroupPage groupId={selectedGroupId} onBack={() => setView('groups')} />
    );
  }

  return view === 'register' ? (
    <Register
      onSwitchToLogin={() => setView('login')}
      onBackHome={() => setView('home')}
    />
  ) : (
    <Login
      onSwitchToRegister={() => setView('register')}
      onBackHome={() => setView('home')}
      onLoginSuccess={handleLoginSuccess}
    />
  );
}

export default App;