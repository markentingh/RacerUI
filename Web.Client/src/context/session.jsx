import React, { createContext, useContext, useEffect, useState } from 'react';
import { auth } from '@/api/user/auth';

const SessionContext = createContext(null);

export function SessionProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('RacerUI:user');
    return saved ? JSON.parse(saved) : null;
  });
  const [isReady, setIsReady] = useState(false);

  useEffect(() => { setIsReady(true); }, []);

  // Posts the login form to the backend (form-urlencoded, same as the
  // original login page). Success = the server redirected us to /dashboard.
  const login = async (username, password) => {
    const res = await auth.login(username, password);
    const finalUrl = res.request?.responseURL || '';
    const ok = finalUrl.includes('/dashboard');
    if (ok) {
      const u = { username };
      setUser(u);
      localStorage.setItem('RacerUI:user', JSON.stringify(u));
    }
    return ok;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('RacerUI:user');
  };

  return (
    <SessionContext.Provider value={{ user, login, logout, isAuthenticated: !!user, isReady }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) throw new Error('useSession must be used within a SessionProvider');
  return context;
}
