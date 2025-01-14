const CACHE_NAME = 'erp-world-v1';
const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

// Skip waiting on install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then(cache => {
        // Try to cache each resource, but don't fail if some fail
        return Promise.allSettled(
          URLS_TO_CACHE.map(url => 
            fetch(url)
              .then(response => {
                if (response.ok) {
                  return cache.put(url, response);
                }
                return Promise.resolve();
              })
              .catch(() => Promise.resolve()) // Ignore fetch errors
          )
        );
      })
  );
});

// Clean up old caches on activate
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(cacheNames => {
      return Promise.all(
        cacheNames.map(cacheName => {
          if (cacheName !== CACHE_NAME) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Fetch handler with network-first strategy
self.addEventListener('fetch', event => {
  // Skip non-GET requests
  if (event.request.method !== 'GET') {
    return;
  }

  // Skip browser-sync and websocket requests
  if (event.request.url.includes('browser-sync') || 
      event.request.url.includes('ws') ||
      event.request.url.includes('hot-update')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(CACHE_NAME).then(cache => {
            cache.put(event.request, responseClone);
          });
        }
        return response;
      })
      .catch(() => {
        // Try to get from cache if network fails
        return caches.match(event.request)
          .then(response => {
            if (response) {
              return response;
            }
            // Return a basic offline page if nothing in cache
            if (event.request.mode === 'navigate') {
              return new Response('Offline - Please check your connection', {
                headers: { 'Content-Type': 'text/plain' }
              });
            }
            return new Response();
          });
      })
  );
}); 