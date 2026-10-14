'use client';

import { getAccessToken, setAccessToken } from '@/src/lib/firebase/client';

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
   */
  public static isTokenExpired(): boolean {
    if (!this.tokenExpiryTime) return false;
    // Consider token expired if within 60 seconds of expiration
    return Date.now() >= this.tokenExpiryTime - 60000;
  }

  /**
   * Explicitly sets token expiry timestamp.
   */
  public static setTokenExpiry(expiresInSeconds: number): void {
    this.tokenExpiryTime = Date.now() + expiresInSeconds * 1000;
    if (this.cachedToken) {
      setAccessToken(this.cachedToken, expiresInSeconds);
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
      this.clearSession();
      throw new Error('Google Drive session expired (401 Unauthorized). Please reconnect.');
    }

    return res;
  }
}
