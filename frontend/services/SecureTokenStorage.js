import AsyncStorage from '@react-native-async-storage/async-storage';
import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

/**
 * Secure Token Storage Service
 * Uses SecureStore for sensitive data with AsyncStorage fallback
 */

const STORAGE_KEYS = {
  ACCESS_TOKEN: 'patabima_access_token',
  REFRESH_TOKEN: 'patabima_refresh_token',
  TOKEN_EXPIRY: 'patabima_token_expiry',
  USER_DATA: 'patabima_user_data',
  SESSION_START: 'patabima_session_start',
};

class SecureTokenStorage {
  constructor() {
    this.useSecureStore = Platform.OS !== 'web';
  }

  /**
   * Decode JWT and extract expiration (exp) in ms, or null if unavailable
   */
  parseJwtExpirationMs(accessToken) {
    try {
      if (!accessToken || typeof accessToken !== 'string' || accessToken.split('.').length < 2) return null;
      const base64Url = accessToken.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      const payload = JSON.parse(jsonPayload);
      if (payload && typeof payload.exp === 'number') {
        // exp is in seconds since epoch
        return payload.exp * 1000;
      }
      return null;
    } catch (_) {
      return null;
    }
  }

  /**
   * Store value securely
   */
  async setItem(key, value) {
    try {
      const stringValue = typeof value === 'string' ? value : JSON.stringify(value);
      
      if (this.useSecureStore) {
        await SecureStore.setItemAsync(key, stringValue);
      } else {
        await AsyncStorage.setItem(key, stringValue);
      }
      return true;
    } catch (error) {
      console.error(`Error storing ${key}:`, error);
      return false;
    }
  }

  /**
   * Get value securely
   */
  async getItem(key) {
    try {
      let value;
      if (this.useSecureStore) {
        value = await SecureStore.getItemAsync(key);
      } else {
        value = await AsyncStorage.getItem(key);
      }

      if (!value) return null;

      // Try to parse JSON, return string if it fails
      try {
        return JSON.parse(value);
      } catch {
        return value;
      }
    } catch (error) {
      console.error(`Error getting ${key}:`, error);
      return null;
    }
  }

  /**
   * Remove value
   */
  async removeItem(key) {
    try {
      if (this.useSecureStore) {
        await SecureStore.deleteItemAsync(key);
      } else {
        await AsyncStorage.removeItem(key);
      }
      return true;
    } catch (error) {
      console.error(`Error removing ${key}:`, error);
      return false;
    }
  }

  /**
   * Clear all session data
   */
  async clearAll() {
    const keys = Object.values(STORAGE_KEYS);
    const promises = keys.map(key => this.removeItem(key));
    await Promise.all(promises);
  }

  /**
   * Store authentication tokens
   */
  async storeTokens(accessToken, refreshToken, options = {}) {
    // Backward compatibility: if options is a number, treat as expiresIn seconds
    let expiresAtMs = null;
    let userData = null;

    if (typeof options === 'number') {
      expiresAtMs = Date.now() + options * 1000;
    } else if (options && typeof options === 'object') {
      userData = options.userData || options;
      // Support either expiresAt (ms or seconds) or expiresIn (seconds)
      if (options.expiresAt) {
        const v = options.expiresAt;
        if (typeof v === 'number') {
          // Heuristic: numbers < 1e12 are seconds
          expiresAtMs = v < 1e12 ? v * 1000 : v;
        } else if (typeof v === 'string') {
          const ts = Date.parse(v);
          if (!Number.isNaN(ts)) expiresAtMs = ts;
        }
      } else if (typeof options.expiresIn === 'number') {
        expiresAtMs = Date.now() + options.expiresIn * 1000;
      }
    }

    // If expiry still unknown, try to derive from JWT exp claim
    if (!expiresAtMs) {
      expiresAtMs = this.parseJwtExpirationMs(accessToken);
    }
    // Fallback default: 30 minutes from now
    if (!expiresAtMs) {
      expiresAtMs = Date.now() + 30 * 60 * 1000;
    }

    await Promise.all([
      this.setItem(STORAGE_KEYS.ACCESS_TOKEN, accessToken),
      this.setItem(STORAGE_KEYS.REFRESH_TOKEN, refreshToken),
      this.setItem(STORAGE_KEYS.TOKEN_EXPIRY, expiresAtMs),
      this.setItem(STORAGE_KEYS.SESSION_START, Date.now()),
    ]);

    if (userData) {
      await this.storeUserData(userData);
    }
  }

  /**
   * Get access token
   */
  async getAccessToken() {
    return await this.getItem(STORAGE_KEYS.ACCESS_TOKEN);
  }

  /**
   * Get refresh token
   */
  async getRefreshToken() {
    return await this.getItem(STORAGE_KEYS.REFRESH_TOKEN);
  }

  /**
   * Get token expiry time
   */
  async getTokenExpiry() {
    return await this.getItem(STORAGE_KEYS.TOKEN_EXPIRY);
  }

  /**
   * Check if token is already expired
   */
  async isTokenExpired() {
    const expiry = await this.getTokenExpiry();
    if (!expiry) return true;
    return Date.now() >= Number(expiry);
  }

  /**
   * Check if token is expired or about to expire (within 5 minutes)
   */
  async isTokenExpiringSoon(bufferMinutes = 5) {
    const expiry = await this.getTokenExpiry();
    if (!expiry) return true;

    const bufferMs = bufferMinutes * 60 * 1000;
    return Date.now() >= (expiry - bufferMs);
  }

  /**
   * Store user data
   */
  async storeUserData(userData) {
    await this.setItem(STORAGE_KEYS.USER_DATA, userData);
  }

  /**
   * Get user data
   */
  async getUserData() {
    return await this.getItem(STORAGE_KEYS.USER_DATA);
  }

  /**
   * Get session age in minutes
   */
  async getSessionAge() {
    const sessionStart = await this.getItem(STORAGE_KEYS.SESSION_START);
    if (!sessionStart) return 0;
    return Math.floor((Date.now() - sessionStart) / (1000 * 60));
  }
}

export default new SecureTokenStorage();
export { STORAGE_KEYS };
