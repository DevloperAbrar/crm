import React, { createContext, useState, useCallback } from 'react';
import { authApi } from '../lib/api/endpoints.js';

export const AuthContext = createContext(null);

function persistSession({ user, accessToken, refreshToken }) {
  localStorage.setItem('user', JSON.stringify(user));
  localStorage.setItem('accessToken', accessToken);
  localStorage.setItem('refreshToken', refreshToken);
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const stored = localStorage.getItem('user');
    return stored ? JSON.parse(stored) : null;
  });

  // Admin (founder): email + password
  const login = useCallback(async (email, password) => {
    const { data } = await authApi.login(email, password);
    persistSession(data.data);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  // Team Lead / BDE: Google ID token credential
  const loginWithGoogle = useCallback(async (credential) => {
    const { data } = await authApi.googleLogin(credential);
    persistSession(data.data);
    setUser(data.data.user);
    return data.data.user;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      localStorage.clear();
      setUser(null);
    }
  }, []);

  return (
    <AuthContext.Provider
      value={{ user, login, loginWithGoogle, logout, isAuthenticated: !!user }}
    >
      {children}
    </AuthContext.Provider>
  );
}