/* Service worker: офлайн-режим.
   Меняешь код (html/css/js)? Увеличь VERSION на 1, чтобы телефоны подхватили обновление.
   Данные из /data обновляются сами: сначала показывается сохранённая копия, а свежая скачивается в фоне. */
const VERSION = 'v4';
const CACHE = 'dayz-guide-' + VERSION;
const SHELL = [
  './', 'index.html', 'css/style.css', 'js/app.js', 'manifest.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'fonts/russo-cyr.woff2', 'fonts/russo-lat.woff2',
  'data/meta.json', 'data/first15.json', 'data/food.json', 'data/diseases.json',
  'data/injuries.json', 'data/crafting.json', 'data/fire.json', 'data/infected.json',
  'data/weapons.json', 'data/slang.json'
];

self.addEventListener('install', (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dayz-guide-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // кэш + обновление в фоне
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: true });
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      const res = await network;
      return res || (req.mode === 'navigate' ? cache.match('index.html') : Response.error());
    })
  );
});
