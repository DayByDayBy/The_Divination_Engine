const API_BASE_URL = '/api';

import { Card, Reading } from '../types/index';

const AUTH_TOKEN_KEY = 'divination_auth_token';

const getAuthToken = (): string | null => {
  try {
    return localStorage.getItem(AUTH_TOKEN_KEY);
  } catch {
    return null;
  }
};

export const setAuthToken = (token: string | null) => {
  try {
    if (token) {
      localStorage.setItem(AUTH_TOKEN_KEY, token);
    } else {
      localStorage.removeItem(AUTH_TOKEN_KEY);
    }
  } catch {
    return;
  }
};

type ApiFetchOptions = Omit<RequestInit, 'headers'> & {
  headers?: Record<string, string>;
};

const apiFetch = (path: string, options: ApiFetchOptions = {}) => {
  const token = getAuthToken();
  const headers: Record<string, string> = { ...(options.headers || {}) };

  // Check for existing Authorization header case-insensitively
  const hasAuthHeader = Object.keys(headers).some(
    key => key.toLowerCase() === 'authorization'
  );

  if (token && !hasAuthHeader) {
    headers.Authorization = `Bearer ${token}`;
  }

  return fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
  });
};

export const readingAPI = {
  getRandomCards: async (count: number): Promise<Card[]> => {
    const response = await apiFetch(`/reading/${count}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch ${count} cards`);
    }
    return response.json();
  },

  getAllReadings: async (): Promise<Reading[]> => {
    const response = await apiFetch(`/readings`);
    if (!response.ok) {
      throw new Error('Failed to fetch readings');
    }
    return response.json();
  },

  getReadingById: async (id: number): Promise<Reading> => {
    const response = await apiFetch(`/reading//s/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch reading ${id}`);
    }
    return response.json();
  },

  createReading: async (reading: Omit<Reading, 'id'>): Promise<Reading> => {
    const response = await apiFetch(`/readings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(reading),
    });
    if (!response.ok) {
      throw new Error('Failed to create reading');
    }
    return response.json();
  },

  deleteReading: async (id: number): Promise<void> => {
    const response = await apiFetch(`/readings/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error(`Failed to delete reading ${id}`);
    }
    return;
  },
};

export const cardAPI = {
  getAllCards: async (): Promise<Card[]> => {
    const response = await apiFetch(`/cards`);
    if (!response.ok) {
      throw new Error('Failed to fetch cards');
    }
    return response.json();
  },

  getCardById: async (id: number): Promise<Card> => {
    const response = await apiFetch(`/cards/${id}`);
    if (!response.ok) {
      throw new Error(`Failed to fetch card ${id}`);
    }
    return response.json();
  },
};
