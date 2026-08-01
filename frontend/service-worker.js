// service-worker.js
// PWA Service Worker with Cache-First strategy for static assets & Background Sync

const CACHE_NAME = 'cejec-erp-cache-v3';

const STATIC_ASSETS = [
  './',
  './Se%20connecter%20-%20Admin.html',
  './Home%20-%20Admin_Panel.html',
  './Dashbord-Admin.html',
  './auth.js',
  './db.js',
  './apiManager.js',
  './manifest.json',
  './assets/favicon.png',
  './assets/favicon.svg',
  './assets/favicon.ico'
];

// Import Dexie
importScripts('https://cdn.jsdelivr.net/npm/dexie@4.0.1/dist/dexie.min.js');

const db = new Dexie("PwaDatabase");
db.version(1).stores({
  leads: "++id, name, email, status",
  outbox: "++id, url, method, payload, timestamp"
});

async function processOutboxQueue() {
  const pending = await db.outbox.toArray();
  if (!pending.length) return;
  console.info(`[Service Worker] Syncing ${pending.length} queued request(s)…`);
  for (const req of pending) {
    try {
      const headers = { "Content-Type": "application/json" };
      if (req.token) {
        headers["Authorization"] = `Bearer ${req.token}`;
      }
      const resp = await fetch(req.url, {
        method: req.method,
        headers,
        body: req.payload ? JSON.stringify(req.payload) : undefined
      });
      if (!resp.ok && resp.status !== 404) throw new Error(`Server ${resp.status}`);
      await db.outbox.delete(req.id);
      if (req.method !== "DELETE" && resp.ok) {
        const data = await resp.json().catch(() => null);
        if (data) await db.leads.put(data);
      }
    } catch (e) {
      console.warn("Sync failed – will retry later", e);
      break;
    }
  }
}

// INSTALL: Pre-cache static assets
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => {
      console.log('[Service Worker] Pre-caching static assets');
      return cache.addAll(STATIC_ASSETS).catch((err) => {
        console.warn('[Service Worker] Pre-cache warning:', err);
      });
    })
  );
  self.skipWaiting();
});

// ACTIVATE: Clean up old caches
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.map((key) => {
          if (key !== CACHE_NAME) {
            console.log('[Service Worker] Removing old cache:', key);
            return caches.delete(key);
          }
        })
      );
    }).then(() => self.clients.claim())
  );
});

// BACKGROUND SYNC: Sync queued outbox requests when online
self.addEventListener('sync', (event) => {
  if (event.tag === 'sync-django-backend') {
    console.log('[Service Worker] Processing background sync queue...');
    event.waitUntil(processOutboxQueue());
  }
});

// FETCH: Cache-First strategy for static assets, network-first for API
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  // Skip caching for API calls (let authFetch / db outbox handle offline API)
  if (url.pathname.includes('/api/')) {
    return;
  }

  // Handle static assets & navigation requests with Cache-First & Network Fallback
  event.respondWith(
    caches.match(event.request).then((cachedResponse) => {
      if (cachedResponse) {
        // Fetch background update to keep cache fresh (StaleWhileRevalidate)
        fetch(event.request).then((networkResponse) => {
          if (networkResponse && networkResponse.status === 200) {
            caches.open(CACHE_NAME).then((cache) => cache.put(event.request, networkResponse));
          }
        }).catch(() => {/* ignore network error when offline */});

        return cachedResponse;
      }

      // Network fallback
      return fetch(event.request).then((networkResponse) => {
        if (!networkResponse || networkResponse.status !== 200 || networkResponse.type !== 'basic') {
          return networkResponse;
        }

        const responseToCache = networkResponse.clone();
        caches.open(CACHE_NAME).then((cache) => {
          cache.put(event.request, responseToCache);
        });

        return networkResponse;
      }).catch(() => {
        // If navigation fails completely offline, serve cached main page
        if (event.request.mode === 'navigate') {
          return caches.match('./Se%20connecter%20-%20Admin.html') || caches.match('./Home%20-%20Admin_Panel.html');
        }
      });
    })
  );
});
