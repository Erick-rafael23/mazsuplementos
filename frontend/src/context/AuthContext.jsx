import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../services/api';

const AuthContext = createContext(null);
export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState(null);
  useEffect(() => {
    let alive = true;
    api
      .get('/health')
      .then(({ data }) => {
        if (alive) setMode(data.data.mode);
      })
      .catch(() => {});
    if (sessionStorage.getItem('maz-token')) {
      api
        .get('/auth/me')
        .then(({ data }) => {
          if (alive) setUser(data.data);
        })
        .catch(() => {
          sessionStorage.removeItem('maz-token');
        })
        .finally(() => {
          if (alive) setLoading(false);
        });
    } else setLoading(false);
    const expired = () => setUser(null);
    window.addEventListener('maz-session-expired', expired);
    return () => {
      alive = false;
      window.removeEventListener('maz-session-expired', expired);
    };
  }, []);
  async function login(correo, password) {
    const { data } = await api.post('/auth/login', { correo, password });
    sessionStorage.setItem('maz-token', data.data.token);
    setUser(data.data.usuario);
    const health = await api.get('/health').catch(() => null);
    if (health) setMode(health.data.data.mode);
  }
  function logout() {
    sessionStorage.removeItem('maz-token');
    setUser(null);
  }
  async function refreshUser() {
    const { data } = await api.get('/auth/me');
    setUser(data.data);
  }
  return (
    <AuthContext.Provider value={{ user, loading, mode, login, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}
export const useAuth = () => useContext(AuthContext);
