import { useState, useEffect } from 'react';
import Home from './Home';
import Login from './Login';
import Search from './Search';
import Register from './Register';
import Account from './Account';
import Groups from './Groups';
import GroupPage from './GroupPage';

function App() {
  const [view, setView] = useState('home');
  const [user, setUser] = useState(null);
  const [selectedGroupId, setSelectedGroupId] = useState(null); // mikä ryhmä on auki

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

  if (view === 'home') {
    return (
      <Home
        user={user}
        onNavigateLogin={() => setView('login')}
        onNavigateSearch={() => setView('search')}
        onNavigateAccount={() => setView('account')}
        onLogout={handleLogout}
      />
    );
  }

  if (view === 'search') {
    return <Search onBackHome={() => setView('home')} />;
  }

  if (view === 'account') {
    return (
      <Account
        user={user}
        onBackHome={() => setView('home')}
        onNavigateGroups={() => setView('groups')}
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

  return view === 'login' ? (
    <Login
      onSwitchToRegister={() => setView('register')}
      onBackHome={() => setView('home')}
      onLoginSuccess={handleLoginSuccess}
    />
  ) : (
    <Register
      onSwitchToLogin={() => setView('login')}
      onBackHome={() => setView('home')}
    />
  );
}

export default App;