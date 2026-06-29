/* OpenClaw Blog — Service Worker (manual, no library)
 * Precache: all static HTML, JS, CSS, fonts, icons.
 * Runtime:
 *   - _next/static/* and fonts.gstatic.com: CacheFirst, 1y
 *   - images (png|jpg|jpeg|svg|webp|avif|gif|ico): CacheFirst, 30d
 *   - HTML pages (navigate): NetworkFirst, 3s timeout, fallback /ja/offline
 *   - everything else: NetworkOnly
 * Self-update: skipWaiting + clientsClaim on activate.
 */

const VERSION = 'v1.0.0';
const STATIC_CACHE = `static-${VERSION}`;
const RUNTIME_CACHE = `runtime-${VERSION}`;
const OFFLINE_URL = '/ja/offline';
const PRECACHE_LIMIT = 200;

// Bumped every deploy so a new SW replaces the old one.
const PRECACHE_URLS = [
  '/',
  '/ja',
  '/zh',
  '/en',
  '/ja/blog',
  '/zh/blog',
  '/en/blog',
  '/ja/offline',
  '/zh/offline',
  '/en/offline',
  '/ja/about',
  '/zh/about',
  '/en/about',
  '/manifest.json',
  '/favicon.svg',
  '/favicon-16.png',
  '/favicon-32.png',
  '/apple-touch-icon.png',
  '/icon-192.png',
  '/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    (async () => {
      const cache = await caches.open(STATIC_CACHE);
      // Precache each URL individually so one failure doesn't kill the whole install.
      await Promise.all(
        PRECACHE_URLS.map(async (url) => {
          try {
            const res = await fetch(url, { cache: 'no-cache' });
            if (res.ok || res.type === 'opaqueredirect') {
              await cache.put(url, res);
            }
          } catch (_) {
            // offline at install time — skip; runtime cache will catch it later
          }
        })
      );
      await self.skipWaiting();
    })()
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    (async () => {
      const keys = await caches.keys();
      await Promise.all(
        keys
          .filter((k) => k !== STATIC_CACHE && k !== RUNTIME_CACHE)
          .map((k) => caches.delete(k))
      );
      await self.clients.claim();
    })()
  );
});

const isStaticAsset = (url) =>
  url.pathname.startsWith('/_next/static/') ||
  url.hostname === 'fonts.gstatic.com' ||
  url.hostname === 'fonts.googleapis.com';

const isImage = (url) =>
  /\.(png|jpe?g|gif|svg|webp|avif|ico)$/i.test(url.pathname);

const isNavigation = (request) => {
  if (request.mode === 'navigate') return true;
  if (request.method !== 'GET') return false;
  const accept = request.headers.get('accept') || '';
  return accept.includes('text/html');
};

async function cacheFirst(request, cacheName, maxAgeMs, maxEntries) {
  const cache = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const dateHeader = cached.headers.get('date');
    const fetchedAt = dateHeader ? Date.parse(dateHeader) : 0;
    if (!maxAgeMs || Date.now() - fetchedAt < maxAgeMs) {
      return cached;
    }
  }
  try {
    const response = await fetch(request);
    if (response && response.ok && response.type === 'basic') {
      cache.put(request, response.clone());
      if (maxEntries) {
        trimCache(cacheName, maxEntries);
      }
    }
    return response;
  } catch (err) {
    if (cached) return cached;
    throw err;
  }
}

async function networkFirst(request) {
  const cache = await caches.open(RUNTIME_CACHE);
  try {
    const response = await Promise.race([
      fetch(request),
      new Promise((_, reject) =>
        setTimeout(() => reject(new Error('timeout')), 3000)
      ),
    ]);
    if (response && response.ok) {
      cache.put(request, response.clone());
    }
    return response;
  } catch (err) {
    const cached = await cache.match(request);
    if (cached) return cached;
    const offlinePage = await caches.match(OFFLINE_URL);
    if (offlinePage) return offlinePage;
    return new Response('Offline', {
      status: 503,
      statusText: 'Service Unavailable',
      headers: { 'Content-Type': 'text/plain' },
    });
  }
}

async function trimCache(cacheName, maxEntries) {
  const cache = await caches.open(cacheName);
  const keys = await cache.keys();
  if (keys.length <= maxEntries) return;
  const overflow = keys.length - maxEntries;
  for (let i = 0; i < overflow; i++) {
    await cache.delete(keys[i]);
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;

  const url = new URL(request.url);
  if (url.origin !== self.location.origin && !isStaticAsset(url)) {
    return;
  }

  if (isStaticAsset(url)) {
    event.respondWith(cacheFirst(request, STATIC_CACHE, 365 * 24 * 60 * 60 * 1000));
    return;
  }

  if (isImage(url)) {
    event.respondWith(cacheFirst(request, RUNTIME_CACHE, 30 * 24 * 60 * 60 * 1000, 100));
    return;
  }

  if (isNavigation(request)) {
    event.respondWith(networkFirst(request));
    return;
  }

  // Default: network only
});

self.addEventListener('message', (event) => {
  if (event.data === 'SKIP_WAITING') {
    self.skipWaiting();
  }
});