const CACHE_NAME = 'erp-world-v2';
const STATIC_CACHE_NAME = 'erp-world-static-v2';
const URLS_TO_CACHE = [
  '/',
  '/index.html'
];

// Skip waiting on install
self.addEventListener('install', event => {
  self.skipWaiting();
  event.waitUntil(
    caches.open(STATIC_CACHE_NAME)
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
          if (![CACHE_NAME, STATIC_CACHE_NAME].includes(cacheName)) {
            return caches.delete(cacheName);
          }
        })
      );
    })
  );
});

// Helper to check if request is for an image
const isImageRequest = (request) => {
  return request.destination === 'image' || 
         request.url.match(/\.(jpg|jpeg|png|gif|svg|webp)$/i);
};

// Fetch handler with different strategies based on request type
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

  // Special handling for images - stale while revalidate
  if (isImageRequest(event.request)) {
    event.respondWith(
      caches.match(event.request).then(cachedResponse => {
        const fetchPromise = fetch(event.request).then(networkResponse => {
          if (networkResponse.ok) {
            const responseClone = networkResponse.clone();
            caches.open(CACHE_NAME).then(cache => {
              cache.put(event.request, responseClone);
            });
          }
          return networkResponse;
        }).catch(() => {
          // Return cached response if network fails
          if (cachedResponse) {
            return cachedResponse;
          }
          return new Response();
        });

        // Return cached response immediately if available, otherwise wait for network
        return cachedResponse || fetchPromise;
      })
    );
    return;
  }

  // Network-first strategy for other requests
  event.respondWith(
    fetch(event.request)
      .then(response => {
        // Cache successful responses
        if (response.ok) {
          const responseClone = response.clone();
          caches.open(STATIC_CACHE_NAME).then(cache => {
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