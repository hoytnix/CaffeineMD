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

const TOKEN_STORAGE_KEY = 'kite_gdrive_access_token';
const TOKEN_META_KEY = 'kite_gdrive_token_meta';

// In-memory & storage-backed token cache
let isSigningIn = false;
let cachedAccessToken: string | null = null;
let currentUser: User | null = null;

export interface TokenMetadata {
  savedAt: number;
  expiresAt?: number;
}

export const setAccessToken = (token: string | null, expiresInSeconds?: number) => {
  cachedAccessToken = token;
  if (typeof window !== 'undefined') {
    try {
      if (token) {
        localStorage.setItem(TOKEN_STORAGE_KEY, token);
        sessionStorage.setItem(TOKEN_STORAGE_KEY, token);
        const meta: TokenMetadata = {
          savedAt: Date.now(),
          expiresAt: expiresInSeconds ? Date.now() + expiresInSeconds * 1000 : undefined,
        };
        localStorage.setItem(TOKEN_META_KEY, JSON.stringify(meta));
      } else {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        localStorage.removeItem(TOKEN_META_KEY);
        sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      }
    } catch {
      // ignore
    }
  }
};

export const getAccessToken = async (): Promise<string | null> => {
  if (cachedAccessToken) return cachedAccessToken;
  if (typeof window !== 'undefined') {
    try {
      const stored = localStorage.getItem(TOKEN_STORAGE_KEY) || sessionStorage.getItem(TOKEN_STORAGE_KEY);
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
