/**
 * Audit log service for tracking previous successful shares, exports, and verification URL copies.
 * Persists to localStorage to ensure transparency for filers, accountants, and auditors.
 */

export interface ShareLogEntry {
  id: string;
  timestamp: string; // ISO string
  formattedTime: string; // Human readable localized string
  destination: string; // e.g. "Clipboard (Verification URL)"
  destinationFr: string;
  documentState: 'Draft' | 'Official';
  taxYear: number;
  taxpayerName?: string;
  documentHash?: string;
}

const STORAGE_KEY = 'tax_easy_share_audit_log_v1';

export function getStoredShareLogs(): ShareLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch (err) {
    console.error('Failed to load share audit log:', err);
    return [];
  }
}

export function recordShareLog(entry: {
  destination: string;
  destinationFr: string;
  documentState: 'Draft' | 'Official';
  taxYear: number;
  taxpayerName?: string;
  documentHash?: string;
}): ShareLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const now = new Date();
    const formattedTime = `${now.toLocaleDateString('en-CA')} ${now.toLocaleTimeString('en-CA', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })}`;

    const newEntry: ShareLogEntry = {
      id: `share_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      timestamp: now.toISOString(),
      formattedTime,
      ...entry,
    };

    const existing = getStoredShareLogs();
    // Keep latest 30 share logs
    const updated = [newEntry, ...existing].slice(0, 30);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    return updated;
  } catch (err) {
    console.error('Failed to record share log entry:', err);
    return getStoredShareLogs();
  }
}

export function clearStoredShareLogs(): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch (err) {
    console.error('Failed to clear share audit log:', err);
  }
}
