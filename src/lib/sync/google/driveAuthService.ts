'use client';

import { storageRegistry, STORAGE_KEYS } from '@/src/lib/config/storageRegistry';
import { getAccessToken, setAccessToken, TokenMetadata } from '@/src/lib/firebase/client';

export interface DriveAuthHeaders {
  Authorization: string;
  Accept: string;
  [key: string]: string;
}

export const GOOGLE_DRIVE_SCOPES = [
  'https://www.googleapis.com/auth/drive.file',
  'https://www.googleapis.com/auth/drive.metadata.readonly',
] as const;

/**
 * DriveAuthService
 * Encapsulates OAuth2 token acquisition, credential storage,
 * and authenticated request headers for Google Drive REST API calls.
 */
export class DriveAuthService {
  private static cachedToken: string | null = null;
  private static tokenExpiryTime: number | null = null;

  /**
   * Retrieves a valid Google OAuth2 access token.
   * Throws an explicit error if the user is not authenticated.
   */
  public static async getValidToken(): Promise<string> {
    const token = await getAccessToken();
    if (!token) {
      throw new Error(
        'Google Drive access token is not available. Please sign in with Google first.'
      );
    }
    this.cachedToken = token;
    return token;
  }

  /**
   * Checks if an active token is present without throwing an exception.
   */
  public static async hasActiveToken(): Promise<boolean> {
    try {
      const token = await getAccessToken();
      return Boolean(token);
    } catch {
      return false;
    }
  }

  /**
   * Checks if the currently cached token is within expiry tolerance.
   * Checks against stored token metadata retrieved via storageRegistry.
   */
  public static isTokenExpired(): boolean {
    if (typeof window === 'undefined') return false;
    try {
      const meta = storageRegistry.getJson<TokenMetadata | null>(STORAGE_KEYS.GDRIVE_TOKEN_META, null);
      if (!meta || !meta.expiresAt) return false;
      return Date.now() >= meta.expiresAt - 60000;
    } catch {
      return false;
    }
  }

  /**
   * Retrieves stored token metadata.
   */
  public static getStoredMetadata(): TokenMetadata | null {
    if (typeof window === 'undefined') return null;
    try {
      return storageRegistry.getJson<TokenMetadata | null>(STORAGE_KEYS.GDRIVE_TOKEN_META, null);
    } catch {
      return null;
    }
  }

  /**
   * Explicitly sets token expiry timestamp.
   */
  public static setTokenExpiry(expiresInSeconds: number): void {
    this.tokenExpiryTime = Date.now() + expiresInSeconds * 1000;
    const token = this.cachedToken || (typeof window !== 'undefined' ? storageRegistry.getItem(STORAGE_KEYS.GDRIVE_ACCESS_TOKEN) : null);
    if (token) {
      setAccessToken(token, expiresInSeconds);
    }
  }

  /**
   * Placeholder for silent token refresh via OAuth2 / Firebase.
   */
  public static async refreshToken(): Promise<string | null> {
    try {
      return await getAccessToken();
    } catch {
      return null;
    }
  }

  /**
   * Invalidates and clears stored access token session.
   */
  public static clearSession(): void {
    this.cachedToken = null;
    this.tokenExpiryTime = null;
    setAccessToken(null);
  }

  /**
   * Generates standard Bearer authorization headers for Google Drive v3 REST requests.
   */
  public static getAuthHeaders(
    token: string,
    additionalHeaders: Record<string, string> = {}
  ): DriveAuthHeaders {
    return {
      Authorization: `Bearer ${token}`,
      Accept: 'application/json',
      ...additionalHeaders,
    };
  }

  /**
   * Intercepts fetch requests to automatically attach Bearer credentials and handle 401 unauth.
   */
  public static async authorizedFetch(
    url: string,
    options: RequestInit = {}
  ): Promise<Response> {
    const token = await this.getValidToken();
    const headers = new Headers(options.headers || {});
    headers.set('Authorization', `Bearer ${token}`);
    if (!headers.has('Accept')) {
      headers.set('Accept', 'application/json');
    }

    const res = await fetch(url, {
      ...options,
      headers,
    });

    if (res.status === 401) {
      // Attempt token re-validation or throw non-destructive auth error without wiping local Dexie workspace
      console.warn('Google Drive access token expired (401). Prompting re-authorization.');
      throw new Error('Google Drive session expired (401 Unauthorized). Please reconnect.');
    }

    return res;
  }
}
