'use client';

import Cookies from 'js-cookie';
import { User } from '@/types/auth';

const TOKEN_KEY = 'auth_token';

export function setAuthToken(token: string) {
  Cookies.set(TOKEN_KEY, token, {
    expires: 7,
    sameSite: 'strict',
  });
}

export function getAuthToken(): string | undefined {
  return Cookies.get(TOKEN_KEY);
}

export function removeAuthToken() {
  Cookies.remove(TOKEN_KEY);
}

export async function login(email: string, password: string): Promise<{ success: boolean; user?: User; message?: string }> {
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });

    const data = await res.json();

    if (data.success && data.token) {
      setAuthToken(data.token);
    }

    return data;
  } catch (error) {
    return { success: false, message: 'Erro ao conectar com o servidor' };
  }
}

export async function logout() {
  removeAuthToken();
  window.location.href = '/login';
}

export async function getCurrentUser(): Promise<User | null> {
  const token = getAuthToken();
  if (!token) return null;

  try {
    const res = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${token}` },
    });

    const data = await res.json();
    return data.user || null;
  } catch {
    return null;
  }
}
