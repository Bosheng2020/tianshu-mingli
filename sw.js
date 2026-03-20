/**
 * 天枢命理 — Service Worker
 * 缓存静态资源，支持离线访问
 */
var CACHE_NAME = 'tianshu-v3.8';
var STATIC_ASSETS = [
  '/',
  '/index.html',
  '/css/style.css',
  '/js/lunar.js',
  '/js/bazi.js',
  '/js/ziwei.js',
  '/js/meihua.js',
  '/js/fengshui.js',
  '/js/lingqian.js',
  '/js/daily.js',
  '/js/hehun.js',
  '/js/partner.js',
  '/js/app.js',
  '/js/features.js'
];

// Install: cache static assets
self.addEventListener('install', function(e) {
  e.waitUntil(
    caches.open(CACHE_NAME).then(function(cache) {
      return cache.addAll(STATIC_ASSETS);
    })
  );
  self.skipWaiting();
});

// Activate: clean old caches
self.addEventListener('activate', function(e) {
  e.waitUntil(
    caches.keys().then(function(keys) {
      return Promise.all(
        keys.filter(function(k) { return k !== CACHE_NAME; })
            .map(function(k) { return caches.delete(k); })
      );
    })
  );
  self.clients.claim();
});

// Fetch: network-first for API, cache-first for static
self.addEventListener('fetch', function(e) {
  var url = new URL(e.request.url);

  // API calls: always network
  if (url.pathname.startsWith('/api/')) {
    return e.respondWith(fetch(e.request));
  }

  // CDN resources: cache-first
  if (url.hostname !== location.hostname) {
    e.respondWith(
      caches.match(e.request).then(function(cached) {
        return cached || fetch(e.request).then(function(resp) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
          return resp;
        });
      })
    );
    return;
  }

  // Local static: stale-while-revalidate
  e.respondWith(
    caches.match(e.request).then(function(cached) {
      var fetchPromise = fetch(e.request).then(function(resp) {
        if (resp.ok) {
          var clone = resp.clone();
          caches.open(CACHE_NAME).then(function(c) { c.put(e.request, clone); });
        }
        return resp;
      }).catch(function() { return cached; });

      return cached || fetchPromise;
    })
  );
});
