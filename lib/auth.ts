import { firebaseConfig, identityBaseUrl } from './firebase';
import { getAdminUserById } from './firestore';

const AUTH_STORAGE_KEY = 'bb_firebase_auth';

export interface AuthSession {
  idToken: string;
  refreshToken: string;
  localId: string;
  email: string;
}

export const getStoredSession = (): AuthSession | null => {
  const raw = localStorage.getItem(AUTH_STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as AuthSession;
  } catch {
    return null;
  }
};

export const setStoredSession = (session: AuthSession | null) => {
  if (!session) {
    localStorage.removeItem(AUTH_STORAGE_KEY);
    return;
  }

  localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(session));
};

export const signInAdmin = async (email: string, password: string) => {
  const response = await fetch(`${identityBaseUrl}/accounts:signInWithPassword?key=${firebaseConfig.apiKey}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email,
      password,
      returnSecureToken: true,
    }),
  });

  const payload = await response.json();

  if (!response.ok) {
    const message = payload?.error?.message || 'Falha no login.';
    throw new Error(message);
  }

  const session: AuthSession = {
    idToken: payload.idToken,
    refreshToken: payload.refreshToken,
    localId: payload.localId,
    email: payload.email,
  };

  const adminUser = await getAdminUserById(session.localId, session.idToken);
  if (!adminUser) {
    throw new Error('Usuário autenticado sem permissão de administrador.');
  }

  setStoredSession(session);
  return session;
};

export const signOutAdmin = () => {
  setStoredSession(null);
};
