// z-asteroids service worker — offline-first cache for app shell assets.
// Deployed under /z-asteroids/ on GitHub Pages; works at / in dev.
const CACHE = 'z-asteroids-v2';

// Detect base path from the service worker's own location
const BASE = self.registration.scope.endsWith('/')
  ? self.registration.scope.slice(0, -1)
  : self.registration.scope;

const SHELL = [
  BASE + '/',
  BASE + '/manifest.json',
  BASE + '/icons/icon-192.png',
  BASE + '/icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  const e = /** @type {ExtendableEvent} */ (event);
  e.waitUntil(
    caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  const e = /** @type {ExtendableEvent} */ (event);
  e.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))
    ).then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (event) => {
  const e = /** @type {FetchEvent} */ (event);
  const url = new URL(e.request.url);

  // Network-first for HTML navigation
  if (e.request.mode === 'navigate') {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(BASE + '/'))
    );
    return;
  }

  // Cache-first for hashed JS/CSS assets and other same-origin resources
  e.respondWith(
    caches.match(e.request).then((cached) => {
      if (cached) return cached;
      return fetch(e.request).then((response) => {
        if (url.origin === self.location.origin && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE).then((cache) => cache.put(e.request, clone));
        }
        return response;
      });
    })
  );
});
