const CACHE_VERSION = 'v6';
const CACHE_NAME = `spravochnik-${CACHE_VERSION}`;
const FONT_CACHE = 'fonts-v1';

const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/manifest.json',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) =>
      Promise.all(
        PRECACHE_URLS.map((url) =>
          fetch(url, { cache: 'reload' })
            .then((res) => { if (res.ok) cache.put(url, res); })
            .catch(() => {})
        )
      )
    )
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(
        keys
          .filter((k) => k !== CACHE_NAME && k !== FONT_CACHE)
          .map((k) => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

self.addEventListener('message', (event) => {
  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting();
    return;
  }
  if (event.data && event.data.type === 'PRECACHE_ASSETS') {
    caches.open(CACHE_NAME).then((cache) => {
      event.data.assets.forEach((assetPath) => {
        cache.match(assetPath).then((cached) => {
          if (!cached) {
            fetch(assetPath, { cache: 'reload' })
              .then((res) => { if (res.ok) cache.put(assetPath, res); })
              .catch(() => {});
          }
        });
      });
    });
  }
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);

  if (event.request.method !== 'GET') return;

  // Шрифты — кеш навсегда
  if (url.origin.includes('fonts.googleapis.com') || url.origin.includes('fonts.gstatic.com')) {
    event.respondWith(
      caches.open(FONT_CACHE).then((cache) =>
        cache.match(event.request).then((cached) => {
          if (cached) return cached;
          return fetch(event.request).then((res) => {
            cache.put(event.request, res.clone());
            return res;
          });
        })
      )
    );
    return;
  }

  // HTML и JS/CSS — сначала сеть с таймаутом, при зависании/ошибке — кеш
  if (
    event.request.destination === 'document' ||
    event.request.destination === 'script' ||
    event.request.destination === 'style'
  ) {
    const FETCH_TIMEOUT_MS = 5000;
    const fromCache = () =>
      caches.match(event.request).then((cached) => cached || caches.match('/index.html'));

    const fromNetwork = new Promise((resolve, reject) => {
      const timer = setTimeout(() => reject(new Error('timeout')), FETCH_TIMEOUT_MS);
      fetch(event.request).then((res) => {
        clearTimeout(timer);
        if (res.ok) {
          const clone = res.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        }
        resolve(res);
      }).catch((err) => {
        clearTimeout(timer);
        reject(err);
      });
    });

    event.respondWith(
      fromNetwork.catch(() => fromCache())
    );
    return;
  }

  // Остальное (иконки, картинки) — кеш с обновлением в фоне
  event.respondWith(
    caches.open(CACHE_NAME).then((cache) =>
      cache.match(event.request).then((cached) => {
        const networkFetch = fetch(event.request).then((res) => {
          if (res.ok) cache.put(event.request, res.clone());
          return res;
        });
        return cached || networkFetch;
      })
    )
  );
});