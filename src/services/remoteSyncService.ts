/**
 * Remote Synchronization & Re-Authentication Service
 * Handles server-side remote sync operations with 401 auth expiration
 * and network error handling, supporting interactive re-authentication.
 */

import { AppTaxReturn } from '../types/tax';
import { notifyTaxDataSynced } from './serviceWorkerService';
import { saveTaxReturnToFirestore } from './firebaseService';

const SYNC_TOKEN_STORAGE_KEY = 'canada_tax_easy_sync_auth_token_v1';
const SIMULATED_ERROR_KEY = 'canada_tax_easy_sync_simulate_error_v1';

export type SyncErrorType = '401' | 'network' | 'server' | 'unknown';

export interface RemoteSyncError {
  type: SyncErrorType;
  message: string;
  statusCode?: number;
  timestamp: number;
}

export interface RemoteSyncResult {
  success: boolean;
  timestamp?: number;
  syncedReturn?: AppTaxReturn;
  error?: RemoteSyncError;
}

/**
 * Retrieves the currently stored remote sync token, initializing with a default active token.
 */
export function getStoredSyncToken(): string {
  try {
    const token = localStorage.getItem(SYNC_TOKEN_STORAGE_KEY);
    if (!token) {
      const defaultToken = `cra-token-session-${Date.now().toString(36)}`;
      localStorage.setItem(SYNC_TOKEN_STORAGE_KEY, defaultToken);
      return defaultToken;
    }
    return token;
  } catch {
    return 'cra-token-session-default';
  }
}

/**
 * Stores an updated authorization token.
 */
export function setStoredSyncToken(token: string): void {
  try {
    localStorage.setItem(SYNC_TOKEN_STORAGE_KEY, token);
  } catch (err) {
    console.warn('Failed to store sync token:', err);
  }
}

/**
 * Clears the stored token to induce a 401 Unauthorized state.
 */
export function clearStoredSyncToken(): void {
  try {
    localStorage.setItem(SYNC_TOKEN_STORAGE_KEY, 'expired');
  } catch (err) {
    console.warn('Failed to clear sync token:', err);
  }
}

/**
 * Sets a simulated error mode ('401' | 'network' | null) for testing.
 */
export function setSimulatedSyncError(errorType: '401' | 'network' | null): void {
  try {
    if (errorType) {
      localStorage.setItem(SIMULATED_ERROR_KEY, errorType);
    } else {
      localStorage.removeItem(SIMULATED_ERROR_KEY);
    }
  } catch (err) {
    console.warn('Failed to set simulated error:', err);
  }
}

/**
 * Gets the current simulated error setting.
 */
export function getSimulatedSyncError(): '401' | 'network' | null {
  try {
    const val = localStorage.getItem(SIMULATED_ERROR_KEY);
    if (val === '401' || val === 'network') return val;
    return null;
  } catch {
    return null;
  }
}

/**
 * Synchronizes the tax return to the remote server.
 * Returns a typed result with error diagnostics (401 or network error).
 */
export async function syncTaxReturnToRemote(
  taxReturn: AppTaxReturn,
  options?: { forceSimulate?: '401' | 'network' | null }
): Promise<RemoteSyncResult> {
  // Check if browser is offline
  if (typeof navigator !== 'undefined' && !navigator.onLine) {
    return {
      success: false,
      error: {
        type: 'network',
        message: 'No internet connection. Device is currently offline.',
        statusCode: 0,
        timestamp: Date.now(),
      },
    };
  }

  const simulated = options?.forceSimulate !== undefined ? options.forceSimulate : getSimulatedSyncError();

  // If testing simulated network failure
  if (simulated === 'network') {
    return {
      success: false,
      error: {
        type: 'network',
        message: 'Network connection failed: Remote CRA tax sync server unreachable.',
        statusCode: 503,
        timestamp: Date.now(),
      },
    };
  }

  const token = simulated === '401' ? 'expired' : getStoredSyncToken();

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 8000);

    const response = await fetch('/api/sync/tax-return', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(simulated ? { 'x-simulate-error': simulated } : {}),
      },
      body: JSON.stringify({
        taxReturn,
        simulateError: simulated,
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (response.status === 401) {
      const data = await response.json().catch(() => ({}));
      return {
        success: false,
        error: {
          type: '401',
          message: data.error || 'Session expired (HTTP 401). CRA re-authentication required to sync.',
          statusCode: 401,
          timestamp: Date.now(),
        },
      };
    }

    if (!response.ok) {
      const data = await response.json().catch(() => ({}));
      const is503OrNetwork = response.status === 503 || response.status === 504 || response.status === 502;
      return {
        success: false,
        error: {
          type: is503OrNetwork ? 'network' : 'server',
          message: data.error || `Server responded with status ${response.status}.`,
          statusCode: response.status,
          timestamp: Date.now(),
        },
      };
    }

    const data = await response.json();
    const ts = data.timestamp || Date.now();

    // Persist remote baseline snapshots
    try {
      localStorage.setItem('canada_tax_easy_remote_synced_v1', JSON.stringify(taxReturn));
      localStorage.setItem('canada_tax_easy_remote_synced_time_v1', String(ts));
      // Cloud Firestore synchronization
      saveTaxReturnToFirestore(taxReturn).catch((err) =>
        console.warn('Background Firestore sync notice:', err)
      );
    } catch (e) {
      console.warn('Failed to cache remote return locally:', e);
    }

    // Notify Service Worker
    notifyTaxDataSynced({
      timestamp: ts,
      taxYear: taxReturn.taxYear,
      t4Count: taxReturn.t4Slips?.length || 0,
      key: 'canada_tax_easy_return_v1',
      taxReturn,
    });

    return {
      success: true,
      timestamp: ts,
      syncedReturn: taxReturn,
    };
  } catch (err: any) {
    const isAbort = err.name === 'AbortError';
    return {
      success: false,
      error: {
        type: 'network',
        message: isAbort
          ? 'Network request timed out after 8 seconds.'
          : err?.message || 'Network connection failed while syncing with remote service.',
        statusCode: 0,
        timestamp: Date.now(),
      },
    };
  }
}

/**
 * Re-authenticates the user with the remote service, saving a refreshed authorization token
 * and optionally retrying the remote sync immediately.
 */
export async function reauthenticateSyncSession(
  accessCode: string,
  userIdentifier?: string
): Promise<{ success: boolean; token?: string; error?: string }> {
  try {
    const response = await fetch('/api/sync/auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        accessCode: accessCode.trim(),
        userIdentifier: userIdentifier?.trim() || 'Alex Morgan (Taxpayer)',
      }),
    });

    const data = await response.json();

    if (!response.ok || !data.success) {
      return {
        success: false,
        error: data.error || 'Authentication failed. Please verify your 4-character NETFILE code.',
      };
    }

    // Save newly issued token
    setStoredSyncToken(data.token);
    // Clear any simulated error state
    setSimulatedSyncError(null);

    return {
      success: true,
      token: data.token,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err?.message || 'Re-authentication service unreachable. Check your network connection.',
    };
  }
}
