import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';

type UserTier = 'FREE' | 'BASIC' | 'PREMIUM';

interface AuthSession {
  token: string;
  email: string;
  tier: UserTier;
  expiresAt: number;
}

interface AuthContextValue {
  isAuthenticated: boolean;
  token: string | null;
  email: string | null;
  tier: UserTier | null;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string) => Promise<void>;
  signOut: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const AUTH_STORAGE_KEY = 'authSession';
const SESSION_DURATION_MS = 12 * 60 * 60 * 1000;

function loadSession(): AuthSession | null {
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return null;
    const session: AuthSession = JSON.parse(raw);
    if (Date.now() > session.expiresAt) {
      localStorage.removeItem(AUTH_STORAGE_KEY);
      return null;
    }
    return session;
  } catch {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return null;
  }
}

function saveSession(session: AuthSession) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<AuthSession | null>(() => loadSession());

  const isAuthenticated = session !== null;
  const token = session?.token ?? null;
  const email = session?.email ?? null;
  const tier = session?.tier ?? null;

  const signIn = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Login failed' }));
      throw new Error(err.error || 'Login failed');
    }
    const data = await response.json();
    const newSession: AuthSession = {
      token: data.token,
      email: data.email,
      tier: data.tier,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const response = await fetch('/api/auth/register', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Registration failed' }));
      throw new Error(err.error || 'Registration failed');
    }
    const data = await response.json();
    const newSession: AuthSession = {
      token: data.token,
      email: data.email,
      tier: data.tier,
      expiresAt: Date.now() + SESSION_DURATION_MS,
    };
    saveSession(newSession);
    setSession(newSession);
  }, []);

  const signOut = useCallback(() => {
    setSession(null);
    localStorage.removeItem(AUTH_STORAGE_KEY);
  }, []);

  const value: AuthContextValue = {
    isAuthenticated,
    token,
    email,
    tier,
    signIn,
    signUp,
    signOut,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
