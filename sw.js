/* Service worker: офлайн-режим и обновления.
   Меняешь код (html/css/js)? Увеличь VERSION на 1 И номер ?v= в index.html (они должны совпадать),
   чтобы телефоны подхватили обновление.
   Страница (index.html) берётся из сети, если она есть (до 3 секунд), иначе из кэша — так онлайн всегда свежая версия.
   Данные из /data: сначала сохранённая копия, свежая скачивается в фоне. */
const VERSION = 'v24';
const V = VERSION.slice(1);
const CACHE = 'dayz-guide-' + VERSION;
const SHELL = [
  './', 'index.html', 'css/style.css?v=' + V, 'js/app.js?v=' + V, 'js/map.js?v=' + V, 'manifest.json',
  'data/map.json', 'data/symptoms.json', 'data/patches.json', 'data/quiz.json', 'data/servers.json', 'data/srv.json',
  'icons/icon-192.png', 'icons/icon-512.png', 'icons/apple-touch-icon.png', 'fonts/russo-cyr.woff2', 'fonts/russo-lat.woff2',
  'data/meta.json', 'data/first15.json', 'data/food.json', 'data/diseases.json',
  'data/injuries.json', 'data/crafting.json', 'data/fire.json', 'data/infected.json',
  'data/weapons.json', 'data/slang.json',
  'data/controls.json', 'data/hud.json', 'data/loadout.json', 'data/week.json', 'data/loot.json', 'data/players.json'
];

self.addEventListener('install', (e) => {
  // мимо HTTP-кэша браузера; один недоступный файл не ломает всё обновление
  e.waitUntil(caches.open(CACHE)
    .then((c) => Promise.all(SHELL.map((u) => fetch(new Request(u, { cache: 'reload' }))
      .then((r) => (r.ok ? c.put(u, r) : null)).catch(() => null))))
    .then(() => self.skipWaiting()));
});

self.addEventListener('activate', (e) => {
  e.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('dayz-guide-') && k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener('message', (e) => { if (e.data === 'skipWaiting') self.skipWaiting(); });

self.addEventListener('fetch', (e) => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;

  // страница: сначала сеть (с таймаутом), потом кэш
  if (req.mode === 'navigate') {
    e.respondWith(caches.open(CACHE).then(async (cache) => {
      const net = fetch(req, { cache: 'no-cache' }).then((res) => { if (res && res.ok) cache.put('index.html', res.clone()); return res; }).catch(() => null);
      const timeout = new Promise((r) => setTimeout(() => r(null), 3000));
      const res = await Promise.race([net, timeout]);
      if (res) return res;
      const cached = await cache.match('index.html') || await cache.match('./');
      if (cached) { e.waitUntil(net); return cached; }
      return (await net) || Response.error();
    }));
    return;
  }

  // остальное: кэш + обновление в фоне (js/css с ?v= — по точному адресу, данные — без учёта параметров)
  const versioned = /[?&]v=/.test(req.url);
  e.respondWith(
    caches.open(CACHE).then(async (cache) => {
      const cached = await cache.match(req, { ignoreSearch: !versioned });
      const network = fetch(req).then((res) => {
        if (res && res.ok) cache.put(req, res.clone());
        return res;
      }).catch(() => null);
      if (cached) { e.waitUntil(network); return cached; }
      return (await network) || Response.error();
    })
  );
});
