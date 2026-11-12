// One Step — offline support.
// Online: always fetch the newest files (so updates show up right away) and keep a copy.
// Offline: use the saved copy. Bump VERSION when the list of files changes.
const VERSION = 'one-step-v1';
const FILES = [
  './', 'index.html', 'styles.css', 'app.js', 'workout.js', 'howto.js', 'manifest.webmanifest',
  'icons/icon-180.png', 'icons/icon-512.png',
  'fonts/Outfit-400.woff2', 'fonts/Outfit-700.woff2', 'fonts/Outfit-800.woff2', 'fonts/Outfit-900.woff2',
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(VERSION).then((c) => c.addAll(FILES)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys()
    .then((keys) => Promise.all(keys.filter((k) => k !== VERSION).map((k) => caches.delete(k))))
    .then(() => self.clients.claim()));
});
self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  e.respondWith(
    fetch(req, { cache: 'no-cache' })
      .then((res) => { if (res.ok) { const copy = res.clone(); caches.open(VERSION).then((c) => c.put(req, copy)); } return res; })
      .catch(() => caches.match(req, { ignoreSearch: true }).then((r) => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined)))
  );
});
