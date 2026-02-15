import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { AuthProvider, useAuth } from '../../context/AuthContext';

const AUTH_STORAGE_KEY = 'authSession';

function setStoredSession(session: {
  token: string;
  email: string;
  tier: string;
  expiresAt: number;
}) {
  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
}

function validSession(overrides = {}) {
  return {
    token: 'test-jwt-token',
    email: 'test@example.com',
    tier: 'FREE',
    expiresAt: Date.now() + 12 * 60 * 60 * 1000,
    ...overrides,
  };
}

function expiredSession(overrides = {}) {
  return {
    token: 'expired-jwt-token',
    email: 'test@example.com',
    tier: 'FREE',
    expiresAt: Date.now() - 1000,
    ...overrides,
  };
}

function AuthConsumer() {
  const auth = useAuth();
  const [error, setError] = React.useState<string>('');
  return (
    <div>
      <span data-testid="authenticated">{String(auth.isAuthenticated)}</span>
      <span data-testid="email">{auth.email || ''}</span>
      <span data-testid="tier">{auth.tier || ''}</span>
      <span data-testid="token">{auth.token || ''}</span>
      <span data-testid="error">{error}</span>
      <button data-testid="sign-in" onClick={() => auth.signIn('test@example.com', 'password123').catch(e => setError(e.message))}>
        Sign In
      </button>
      <button data-testid="sign-up" onClick={() => auth.signUp('new@example.com', 'password123').catch(e => setError(e.message))}>
        Sign Up
      </button>
      <button data-testid="sign-out" onClick={() => auth.signOut()}>
        Sign Out
      </button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <AuthConsumer />
    </AuthProvider>
  );
}

const mockFetch = vi.fn();

describe('AuthContext', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal('fetch', mockFetch);
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  // --- Initial state ---

  it('is unauthenticated when no localStorage entry exists', () => {
    renderWithProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('email').textContent).toBe('');
    expect(screen.getByTestId('token').textContent).toBe('');
  });

  // --- Hydration ---

  it('hydrates authenticated state from valid localStorage entry', () => {
    setStoredSession(validSession());
    renderWithProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('test@example.com');
    expect(screen.getByTestId('tier').textContent).toBe('FREE');
    expect(screen.getByTestId('token').textContent).toBe('test-jwt-token');
  });

  // --- Expiry ---

  it('clears expired session and treats as unauthenticated', () => {
    setStoredSession(expiredSession());
    renderWithProvider();

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('token').textContent).toBe('');
    // localStorage should be cleared
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  // --- signIn ---

  it('signIn calls /api/auth/login and stores token + metadata', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'login-jwt-token',
        type: 'Bearer',
        email: 'test@example.com',
        tier: 'FREE',
      }),
    });

    renderWithProvider();

    await act(async () => {
      await user.click(screen.getByTestId('sign-in'));
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/login', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
    }));

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('test@example.com');
    expect(screen.getByTestId('token').textContent).toBe('login-jwt-token');

    // Check localStorage was updated
    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)!);
    expect(stored.token).toBe('login-jwt-token');
    expect(stored.email).toBe('test@example.com');
    expect(stored.tier).toBe('FREE');
    expect(stored.expiresAt).toBeGreaterThan(Date.now());
  });

  // --- signUp ---

  it('signUp calls /api/auth/register and stores token + metadata', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: true,
      json: async () => ({
        token: 'register-jwt-token',
        type: 'Bearer',
        email: 'new@example.com',
        tier: 'FREE',
      }),
    });

    renderWithProvider();

    await act(async () => {
      await user.click(screen.getByTestId('sign-up'));
    });

    expect(mockFetch).toHaveBeenCalledWith('/api/auth/register', expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ email: 'new@example.com', password: 'password123' }),
    }));

    expect(screen.getByTestId('authenticated').textContent).toBe('true');
    expect(screen.getByTestId('email').textContent).toBe('new@example.com');
    expect(screen.getByTestId('token').textContent).toBe('register-jwt-token');

    const stored = JSON.parse(localStorage.getItem(AUTH_STORAGE_KEY)!);
    expect(stored.token).toBe('register-jwt-token');
    expect(stored.email).toBe('new@example.com');
  });

  // --- signOut ---

  it('signOut clears React state and localStorage', async () => {
    const user = userEvent.setup();
    setStoredSession(validSession());
    renderWithProvider();

    // Verify we start authenticated
    expect(screen.getByTestId('authenticated').textContent).toBe('true');

    await act(async () => {
      await user.click(screen.getByTestId('sign-out'));
    });

    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('token').textContent).toBe('');
    expect(screen.getByTestId('email').textContent).toBe('');
    expect(localStorage.getItem(AUTH_STORAGE_KEY)).toBeNull();
  });

  // --- Error handling ---

  it('signIn throws on failed API response', async () => {
    const user = userEvent.setup();
    mockFetch.mockResolvedValueOnce({
      ok: false,
      status: 401,
      json: async () => ({ error: 'Invalid credentials' }),
    });

    renderWithProvider();

    // signIn should throw, state should remain unauthenticated
    await act(async () => {
      await user.click(screen.getByTestId('sign-in'));
    });

    // Should remain unauthenticated on failure
    expect(screen.getByTestId('authenticated').textContent).toBe('false');
    expect(screen.getByTestId('error').textContent).toBe('Invalid credentials');
  });
});
