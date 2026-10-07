/**
 * Service Worker & Storage Synchronization Service
 * Handles service worker lifecycle, notification permissions, and sync event dispatching.
 */

let swRegistration: ServiceWorkerRegistration | null = null;
let isRegistering = false;

export interface SyncPayload {
  timestamp: number;
  taxYear: number;
  t4Count: number;
  key: string;
  taxReturn?: any;
}

/**
 * Initializes and registers the service worker.
 */
export async function initServiceWorker(): Promise<ServiceWorkerRegistration | null> {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) {
    return null;
  }

  if (swRegistration) {
    return swRegistration;
  }

  if (isRegistering) {
    return null;
  }

  try {
    isRegistering = true;
    const registration = await navigator.serviceWorker.register('/sw.js', {
      scope: '/',
    });

    swRegistration = registration;

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing;
      if (newWorker) {
        newWorker.addEventListener('statechange', () => {
          if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
            console.log('[SW] New version available.');
          }
        });
      }
    });

    return registration;
  } catch (error) {
    console.warn('[SW] Service worker registration failed (might be in sandbox or unsupported environment):', error);
    return null;
  } finally {
    isRegistering = false;
  }
}

/**
 * Checks if browser notifications are supported in current context.
 */
export function isNotificationSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

/**
 * Gets the current notification permission state.
 */
export function getNotificationPermission(): NotificationPermission {
  if (!isNotificationSupported()) {
    return 'denied';
  }
  return Notification.permission;
}

/**
 * Prompts user for browser notification permission.
 */
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!isNotificationSupported()) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.warn('[SW] Failed to request notification permission:', err);
    return 'denied';
  }
}

/**
 * Dispatches a tax return sync message to the active service worker.
 * Also invokes fallback Notification API if SW showNotification fails or SW not active.
 */
export async function notifyTaxDataSynced(payload: SyncPayload): Promise<void> {
  try {
    // 1. If service worker is ready, message it
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_TAX_DATA',
        payload,
      });
    } else if (swRegistration && swRegistration.active) {
      swRegistration.active.postMessage({
        type: 'SYNC_TAX_DATA',
        payload,
      });
    }

    // 2. Direct Notification fallback if permission is granted and SW didn't show
    if (
      isNotificationSupported() &&
      Notification.permission === 'granted' &&
      (!navigator.serviceWorker || !navigator.serviceWorker.controller)
    ) {
      const time = new Date(payload.timestamp).toLocaleTimeString();
      new Notification('Tax Return Saved', {
        body: `Your ${payload.taxYear} T1 return is saved to local storage (${time}).`,
        icon: '/icon-192.png',
        tag: 'tax-easy-direct-sync',
        silent: true,
      });
    }
  } catch (err) {
    console.warn('[SW] Error notifying sync to service worker:', err);
  }
}

/**
 * Triggers a test notification to verify service worker notification behavior.
 */
export async function triggerTestNotification(): Promise<boolean> {
  if (!isNotificationSupported()) return false;

  let perm = Notification.permission;
  if (perm !== 'granted') {
    perm = await requestNotificationPermission();
  }

  if (perm !== 'granted') return false;

  if ('serviceWorker' in navigator && swRegistration) {
    try {
      await swRegistration.showNotification('Canada TaxEasy • Storage Synced', {
        body: 'Local storage synchronization is active and operating normally.',
        icon: '/icon-192.png',
        badge: '/icon-192.png',
        tag: 'tax-easy-test',
      });
      return true;
    } catch (e) {
      console.warn('[SW] showNotification error:', e);
    }
  }

  // Fallback to Window Notification
  try {
    new Notification('Canada TaxEasy • Storage Synced', {
      body: 'Local storage synchronization is active and operating normally.',
      icon: '/icon-192.png',
    });
    return true;
  } catch (e) {
    console.warn('[SW] Fallback notification failed:', e);
    return false;
  }
}
