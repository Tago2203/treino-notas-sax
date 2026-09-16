const CACHE_NAME = 'treino-notas-sax-v3';
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
  './vendor/WebAudioFontPlayer.js',
  './vendor/0650_Aspirin_sf2_file.js',
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

// Network-first pros arquivos do próprio site (incluindo o player de áudio,
// que agora é servido localmente em vez de um CDN): sempre busca a versão
// mais nova quando há internet, e só usa o cache como reserva pra funcionar
// offline. Assim uma atualização aparece na hora, sem precisar trocar o
// nome do cache a cada deploy.
self.addEventListener('fetch', (event) => {
  const url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;

  event.respondWith(
    fetch(event.request)
      .then((response) => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then((cache) => cache.put(event.request, clone));
        return response;
      })
      .catch(() => caches.match(event.request))
  );
});
