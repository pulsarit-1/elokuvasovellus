import { useState } from 'react';
import Home from './Home';
import Login from './Login';
import Search from './Search';
import Register from './Register';

function App() {
  const [view, setView] = useState('home'); // 'home' | 'login' | 'register'

  if (view === 'home') {
    return <Home onNavigateLogin={() => setView('login')} onNavigateSearch={() => setView('search')} />;
  }

  if (view === 'search') {
    return <Search onBackHome={() => setView('home')} />;
  }

  return view === 'login' ? (
    <Login
      onSwitchToRegister={() => setView('register')}
      onBackHome={() => setView('home')}
    />
  ) : (
    <Register
      onSwitchToLogin={() => setView('login')}
      onBackHome={() => setView('home')}
    />
  );
}

export default App;
