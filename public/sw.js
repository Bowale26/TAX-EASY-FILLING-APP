// Canada Tax Easy - Service Worker for Offline Caching & Local Storage Sync Notifications
const CACHE_NAME = 'tax-easy-v1';
const STATIC_ASSETS = [
  '/',
  '/index.html',
  '/manifest.json'
];

// Install: precache essential shell assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[SW] Cache addAll warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// Activate: cleanup older caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      return Promise.all(
        cacheNames.map((name) => {
          if (name !== CACHE_NAME) {
            return caches.delete(name);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// In-memory remote sync state held by Service Worker
let lastRemoteSyncedData = null;
let lastRemoteSyncTimestamp = null;

// Message listener: communication from client app
self.addEventListener('message', async (event) => {
  if (!event.data) return;

  const { type, payload } = event.data;

  // Query remote sync status
  if (type === 'GET_REMOTE_SYNC_STATUS') {
    if (event.source && event.source.postMessage) {
      event.source.postMessage({
        type: 'REMOTE_SYNC_STATUS_RESPONSE',
        timestamp: lastRemoteSyncTimestamp,
        syncedData: lastRemoteSyncedData,
      });
    }
    return;
  }

  // Handle local storage sync notification from App
  if (type === 'SYNC_TAX_DATA' || type === 'TAX_RETURN_SAVED') {
    const timestamp = payload?.timestamp || Date.now();
    const formattedTime = new Date(timestamp).toLocaleTimeString();
    const taxYear = payload?.taxYear || 2025;
    const t4Count = payload?.t4Count ?? 0;

    lastRemoteSyncTimestamp = timestamp;
    if (payload?.taxReturn) {
      lastRemoteSyncedData = payload.taxReturn;
    }

    const title = 'Tax Return Saved locally';
    const body = `Your ${taxYear} T1 tax return progress (${t4Count} slip${t4Count === 1 ? '' : 's'}) was safely synced to your device storage at ${formattedTime}.`;

    // Try showing native notification if permission is granted
    if (self.Notification && self.Notification.permission === 'granted') {
      try {
        await self.registration.showNotification(title, {
          body,
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'tax-easy-local-sync',
          renotify: false,
          silent: true,
          data: { url: '/', timestamp },
        });
      } catch (err) {
        console.warn('[SW] showNotification error:', err);
      }
    }

    // Acknowledge back to all matching clients
    const clients = await self.clients.matchAll({ type: 'window', includeUncontrolled: true });
    clients.forEach((client) => {
      client.postMessage({
        type: 'SYNC_CONFIRMED',
        timestamp,
        savedKey: payload?.key || 'canada_tax_easy_return_2025',
        syncedData: lastRemoteSyncedData,
      });
    });
  }

  // Direct notification trigger test from UI
  if (type === 'TRIGGER_TEST_NOTIFICATION') {
    if (self.Notification && self.Notification.permission === 'granted') {
      try {
        await self.registration.showNotification('TaxEasy Sync Active', {
          body: 'Local storage synchronization is active. Your tax progress is automatically protected.',
          icon: '/icon-192.png',
          badge: '/icon-192.png',
          tag: 'tax-easy-test',
        });
      } catch (err) {
        console.warn('[SW] Test notification error:', err);
      }
    }
  }
});

// Notification click handler: focus or open the app window
self.addEventListener('notificationclick', (event) => {
  event.notification.close();

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      for (const client of clientList) {
        if (client.url && 'focus' in client) {
          return client.focus();
        }
      }
      if (self.clients.openWindow) {
        return self.clients.openWindow('/');
      }
    })
  );
});

// Fetch fallback strategy: Network first with Cache fallback
self.addEventListener('fetch', (event) => {
  // Skip non-GET or chrome-extension or API requests
  if (event.request.method !== 'GET' || event.request.url.includes('/api/')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then((networkResponse) => {
        if (networkResponse && networkResponse.status === 200 && networkResponse.type === 'basic') {
          const responseToCache = networkResponse.clone();
          caches.open(CACHE_NAME).then((cache) => {
            cache.put(event.request, responseToCache);
          });
        }
        return networkResponse;
      })
      .catch(() => {
        return caches.match(event.request);
      })
  );
});
