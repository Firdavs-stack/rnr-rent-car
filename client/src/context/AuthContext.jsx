import { createContext, useState, useEffect, useCallback } from 'react';
import { api } from '../api';

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [error,setError]=useState('');
  const [loading, setLoading] = useState(true);

  const fetchUser = useCallback(async () => {
    setError('');
    try {
      const data = await api.auth.me();
      setUser(data);
    } catch (error) {
      if(error.status===401)setUser(null);else setError(error.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUser(); }, [fetchUser]);
  useEffect(()=>{const end=()=>setUser(null);window.addEventListener('rnr-session-ended',end);return()=>window.removeEventListener('rnr-session-ended',end);},[]);

  const login = async (email, password) => {
    const data = await api.auth.login({ email, password });
    setUser(data.user);
    return data;
  };

  const register = async (formData) => {
    const data = await api.auth.register(formData);
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    await api.auth.logout();
    setUser(null);
  };

  const isAdmin = user && ['ADMIN', 'MANAGER', 'FLEET_MANAGER', 'CONTENT_MANAGER'].includes(user.role);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, register, logout, isAdmin, refreshUser: fetchUser }}>
      {children}
    </AuthContext.Provider>
  );
}