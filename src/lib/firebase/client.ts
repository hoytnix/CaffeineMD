'use client';

import { initializeApp, getApps, getApp } from 'firebase/app';
import {
  getAuth,
  signInWithPopup,
  GoogleAuthProvider,
  onAuthStateChanged,
  User,
  signOut,
} from 'firebase/auth';
import firebaseConfig from '../../../firebase-applet-config.json';

// Initialize Firebase App singleton
export const firebaseApp =
  getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);

export const auth = getAuth(firebaseApp);

// Configure Google Provider with Drive scopes, offline access, and consent prompt
const provider = new GoogleAuthProvider();
provider.addScope('openid');
provider.addScope('email');
provider.addScope('profile');
provider.addScope('https://www.googleapis.com/auth/drive.file');
provider.setCustomParameters({
  access_type: 'offline',
  prompt: 'consent',
});

import { storageRegistry, STORAGE_KEYS } from '@/src/lib/config/storageRegistry';

// In-memory & storage-backed token cache
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;

export interface TokenMetadata {
  savedAt: number;
  expiresAt?: number;
}

export const setAccessToken = (token: string | null, expiresInSeconds: number = 3600) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        storageRegistry.setItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN, token);
        sessionStorage.setItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN, token);
        const meta: TokenMetadata = {
          savedAt: Date.now(),
          expiresAt: Date.now() + expiresInSeconds * 1000,
        };
        storageRegistry.setJson(STORAGE_KEYS.GDRIVE_TOKEN_META, meta);
      } else {
        storageRegistry.removeItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN);
        storageRegistry.removeItem(STORAGE_KEYS.GDRIVE_TOKEN_META);
        sessionStorage.removeItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN);
      }
    } catch {
      // storage unavailable
    }
  }
};

export const getTokenMetadata = (): TokenMetadata | null => {
  if (typeof window === 'undefined') return null;
  try {
    return storageRegistry.getJson<TokenMetadata | null>(STORAGE_KEYS.GDRIVE_TOKEN_META, null);
  } catch {
    return null;
  }
};

export const isStoredTokenExpired = (bufferMs: number = 60000): boolean => {
  const meta = getTokenMetadata();
  if (!meta || !meta.expiresAt) return false;
  return Date.now() >= meta.expiresAt - bufferMs;
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    try {
      const stored =
        storageRegistry.getItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN) ||
        sessionStorage.getItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN);
      if (stored) {
        cachedAccessToken = stored;
        return stored;
      }
    } catch {
      // storage unavailable
    }
  }
  return null;
};

export const initAuth = (
  onAuthSuccess?: (user: User, token: string) => void,
  onAuthFailure?: () => void
) => {
  return onAuthStateChanged(auth, async (user: User | null) => {
    currentUser = user;
    if (user) {
      const token = await getAccessToken();
      if (token) {
        if (onAuthSuccess) onAuthSuccess(user, token);
      } else if (!isSigningIn) {
        // User is logged into Firebase, but Drive token is not yet in session
        if (onAuthSuccess) onAuthSuccess(user, '');
      }
    } else {
      setAccessToken(null);
      if (onAuthFailure) onAuthFailure();
    }
  });
};

export const googleSignIn = async (): Promise<{ user: User; accessToken: string } | null> => {
  try {
    isSigningIn = true;
    const result = await signInWithPopup(auth, provider);
    const credential = GoogleAuthProvider.credentialFromResult(result);

    if (!credential?.accessToken) {
      throw new Error('Could not obtain Google Drive access token from authentication result');
    }

    setAccessToken(credential.accessToken);
    currentUser = result.user;
    return { user: result.user, accessToken: credential.accessToken };
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw error;
  } finally {
    isSigningIn = false;
  }
};

export const getCurrentUser = (): User | null => {
  return currentUser || auth.currentUser;
};

export const logoutGoogle = async () => {
  await signOut(auth);
  setAccessToken(null);
  currentUser = null;
};
