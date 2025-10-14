self.addEventListener('install', event => {
  event.waitUntil(
    caches.open('beer-rate-cache-v1').then(cache => {
      return cache.addAll([
        '/',
        '/css/site.css',
        '/js/site.js',
        '/manifest.json'
        // Add other assets as needed
      ]);
    })
  );
  self.skipWaiting();
});

self.addEventListener('fetch', event => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});