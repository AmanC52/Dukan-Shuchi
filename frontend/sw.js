// Service Worker for Dukan Sahayak PWA
const CACHE_NAME = 'dukan-sahayak-v4';
const ASSETS = [
  '/',
  'index.html',
  'css/style.css',
  'js/seed_data.js',
  'js/api.js',
  'js/state.js',
  'js/print_helper.js',
  'js/planner.js',
  'js/inventory.js',
  'js/history.js',
  'js/reports.js',
  'js/main.js',
  'manifest.json',
  'assets/favicon.png',
  'assets/app_icon_192.png',
  'assets/app_icon.png'
];

self.addEventListener('install', (e) => {
  e.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS)).catch((err) => console.log('SW cache error:', err))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys().then((keys) => {
      return Promise.all(
        keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))
      );
    })
  );
  self.clients.claim();
});

self.addEventListener('fetch', (e) => {
  if (e.request.url.includes('/api/')) {
    e.respondWith(
      fetch(e.request).catch(() => caches.match(e.request))
    );
  } else {
    e.respondWith(
      caches.match(e.request).then((res) => res || fetch(e.request))
    );
  }
});
