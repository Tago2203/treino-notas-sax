const CACHE_NAME = 'treino-notas-sax-v1';
const ASSETS = [
  './',
  './index.html',
  './style.css',
  './app.js',
  './theory.js',
  './levels.js',
  './audio-engine.js',
  './staff-renderer.js',
  './manifest.json',
  './icons/icon-192.png',
  './icons/icon-512.png',
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(ASSETS))
  );
  self.skipWaiting();
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return; // não mexe nos CDNs externos (WebAudioFont)
  event.respondWith(
    caches.match(event.request).then((cached) => cached || fetch(event.request))
  );
});
