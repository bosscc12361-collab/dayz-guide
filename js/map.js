/* Интерактивная схема Чернаруси.
   Нижний слой — canvas (море, суша, зоны лута, здания, газ), верхний — SVG (метки, подписи, маршруты).
   Координаты: метры игры, x — восток, z — север, карта 15360×15360. */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LAYERS = [
    { id: 'water', title: 'Колонки', icon: '💧', on: true },
    { id: 'medical', title: 'Медицина', icon: '✚', on: true },
    { id: 'police', title: 'Полиция', icon: '🚓', on: true },
    { id: 'military', title: 'Военка', icon: '🎖️', on: true },
    { id: 'danger', title: 'Опасные зоны', icon: '⚠️', on: true },
    { id: 'gas', title: 'Газ', icon: '☣️', on: true },
    { id: 'marks', title: 'Ориентиры', icon: '⛪', on: true },
    { id: 'names', title: 'Названия мест', icon: '⛰️', on: true },
    { id: 'cabins', title: 'Домики, лагеря', icon: '🏕️', on: true },
    { id: 'shops', title: 'Магазины', icon: '🛒', on: true },
    { id: 'hunting', title: 'Вышки, охота', icon: '🦌', on: true },
    { id: 'spawn', title: 'Спавн', icon: '🟢', on: true },
    { id: 'routes', title: 'Маршруты', icon: '🧭', on: true },
    { id: 'cars', title: 'Машины (где бывают)', icon: '🚗', on: false },
    { id: 'events', title: 'Вертолёты, конвои', icon: '🚁', on: false },
    { id: 'tiers', title: 'Зоны лута', icon: '🎯', on: false },
    { id: 'rails', title: 'Рельсы, тропы', icon: '🛤️', on: true },
    { id: 'buildings', title: 'Дома', icon: '🏠', on: true }
  ];
  // виды меток: слой, значок, с какого приближения видно (0 — всегда), подсказка
  const POI = {
    mil: { l: 'military', i: '★', lv: 1, d: 'Военный лут. Сюда ходят за оружием, и здесь часто стреляют: сначала осмотрись издалека.' },
    plane: { l: 'military', i: '✈️', lv: 1, d: 'Место с военным лутом.' },
    milbox: { l: 'military', i: '▣', lv: 2, d: 'Контейнеры с военным лутом.' },
    guard: { l: 'police', i: 'P', lv: 2, d: 'По официальной таблице здесь бывает полицейский лут.' },
    camp: { l: 'cabins', i: '🏕️', lv: 1, d: 'Домики лагеря. По официальной таблице здесь охотничий лут.' },
    cabin: { l: 'cabins', i: '🏠', lv: 2, d: 'Дом вдали от посёлков. Спокойное место, чтобы переждать и залутаться.' },
    castle: { l: 'marks', i: '🏰', lv: 0, d: 'Развалины замка: видно издалека, охотничий лут.' },
    church: { l: 'marks', i: '⛪', lv: 1, d: 'Видно издалека — удобный ориентир.' },
    light: { l: 'marks', i: '🗼', lv: 1, d: 'Маяк на берегу — хороший ориентир.' },
    fuel: { l: 'marks', i: '⛽', lv: 1, d: 'Здесь можно заправить канистру и машину.' },
    rail: { l: 'marks', i: '🚉', lv: 1, d: 'Станция на железной дороге.' },
    tower: { l: 'marks', i: '📡', lv: 1, d: 'Вышка связи: видно издалека.' },
    factory: { l: 'marks', i: '🏭', lv: 1, d: 'Промышленный лут.' },
    saw: { l: 'marks', i: '🪚', lv: 2, d: 'Лесопилка: промышленный лут.' },
    quarry: { l: 'marks', i: '⛏️', lv: 1, d: 'Промышленный лут.' },
    port: { l: 'marks', i: '🏗️', lv: 1, d: 'Краны видно издалека.' },
    build: { l: 'marks', i: '🏗️', lv: 2, d: 'Стройка: промышленный лут.' },
    prison: { l: 'marks', i: '⛓️', lv: 0, d: 'Тюрьма на острове: тюремный лут.' },
    ship: { l: 'marks', i: '🚢', lv: 0, d: 'Корабль в газовой зоне: без ОЗК и противогаза — смерть.' },
    fun: { l: 'marks', i: '🎡', lv: 1, d: 'Колесо обозрения — заметный ориентир.' },
    hotel: { l: 'marks', i: '🏨', lv: 2, d: 'Высокое здание, хороший обзор.' },
    fire: { l: 'marks', i: '🚒', lv: 2, d: 'По официальной таблице здесь пожарный лут.' },
    school: { l: 'marks', i: '🏫', lv: 2, d: 'По официальной таблице здесь школьный лут.' },
    farm: { l: 'marks', i: '🐄', lv: 2, d: 'По официальной таблице здесь фермерский лут.' },
    power: { l: 'marks', i: '⚡', lv: 2, d: 'Подстанция: промышленный лут.' },
    view: { l: 'marks', i: '👁️', lv: 2, d: 'Место с хорошим обзором.' },
    shop: { l: 'shops', i: '🛒', lv: 2, d: 'По официальной таблице здесь городской, офисный и школьный лут.' },
    feed: { l: 'hunting', i: '▴', lv: 2, d: 'Охотничий лут.' }
  };
  const BCOL = { Military: '#d4ab2c', Police: '#4a7bff', Medic: '#ff5f5f', Firefighter: '#ff8a3d', Prison: '#a46bd1', Hunting: '#b58f5c',
    Industrial: '#66788f', Farm: '#8c7350', Office: '#8aa6cf', School: '#79b8c9', Town: '#b5c3da', Village: '#97a7bf', Coast: '#5fa8a0', Other: '#8494ad' };
  const TCOL = ['rgba(0,0,0,0)', 'rgba(61,220,132,.20)', 'rgba(240,200,60,.22)', 'rgba(255,140,50,.26)', 'rgba(240,70,70,.30)'];
  const TSOLID = ['', '#3ddc84', '#f0c83c', '#ff8c32', '#f04646'];
  const TIER_TXT = { 1: 'Tier 1 — побережье, простой лут', 2: 'Tier 2 — получше, вглубь материка', 3: 'Tier 3 — хороший лут, север и запад', 4: 'Tier 4 — лучший лут, крайний северо-запад' };
  const MIL_SHORT = { 'm-vybor': 'NWAF', 'm-krasno': 'Аэродром Красностав', 'm-balota': 'Аэродром Балота', 'm-vmc': 'ВМЦ', 'm-tisy': 'Тисы',
    'm-kamensk': 'Военка Каменск', 'm-zeleno': 'Военка Зеленогорск', 'm-pavlovo': 'Павлово ☣' };

  const INFO = {
    water: { t: 'Колонка с водой', i: '💧', d: 'Чистая вода: пей и набирай без обработки. Сначала помой окровавленные руки.', link: ['#food/well-water', 'Про воду'] },
    hospital: { t: 'Больница', i: '✚', d: 'Много медицины: бинты, таблетки, капельницы, эпинефрин. Игроки тоже сюда ходят — осторожно.', link: ['#injuries', 'Раздел «Ранения»'] },
    clinic: { t: 'Медпункт', i: '✚', d: 'Небольшой медпункт или медпалатка: бинты, таблетки, иногда антибиотики.', link: ['#diseases', 'Раздел «Болезни»'] },
    police: { t: 'Полицейский участок', i: '🚓', d: 'Пистолеты (Mlock-91, CR-61), дробовики, патроны 9x19 и 12 калибр, полицейская одежда.', link: ['#weapons/mlock', 'Карточка: Mlock-91'] },
    hunting: { t: 'Охотничья вышка', i: '🦌', d: 'Охотничьи винтовки (CR-527, Blaze, Longhorn), патроны, бинокль, камуфляж.', link: ['#weapons/cr527', 'Карточка: CR-527'] },
    spawn: { t: 'Зона спавна', i: '🟢', d: 'Здесь появляются свежие игроки. Вокруг много кепок, и всё уже обыскано — уходи вглубь.', link: ['#first15/fresh-spawn', 'Чек-лист спавна'] }
  };

  let pendingFocus = null, PO = null, tiles = new Map(), tileQ = 0; // метки и подробные плитки
  let V = null, me = null, dest = null, mine = [], mode = null, onState = null; // векторные слои, «я здесь», цель, свой маршрут
  let lootF = null; // фильтр «где найти»: { usage:[], tiers:Set }
  let D = null, B = null, svg, canvas, ctx, wrap, sheet, tip, vb, layersOn = {}, onNavigate = null, raf = 0, dpr = 1, bg = null;
  const Y = (z) => D.size - z;

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  function place(id) {
    return D.towns.find((t) => t.id === id) || D.military.find((m) => m.id === id) || D.zones.find((z) => z.id === id) || null;
  }

  const routePts = (r) => (r.path && r.path.length > 1 ? r.path : r.wp.map(place).filter(Boolean).map((p) => [p.x, p.z]));

  // ---------- SVG: метки, подписи, маршруты ----------
  function buildSVG() {
    svg = el('svg', { class: 'map-svg', role: 'img', 'aria-label': 'Схема карты Чернаруси' });

    const gRoutes = el('g', { 'data-layer': 'routes' }, svg);
    D.routes.forEach((r) => {
      const pts = routePts(r).map((p) => p[0] + ',' + Y(p[1])).join(' ');
      el('polyline', { points: pts, class: 'route-hit', 'data-id': r.id }, gRoutes);
      el('polyline', { points: pts, class: 'route ' + r.verdict, 'data-id': r.id }, gRoutes);
    });
    el('g', { class: 'route-deco' }, svg);

    const g = (layer) => el('g', { 'data-layer': layer }, svg);
    const gSpawn = g('spawn');
    D.points.spawn.forEach((p, i) => mk(gSpawn, p[0], p[1], 'spawn-' + i, 'spawn', '<circle r="12" class="spawn"/><text class="cap cap-2" y="25">Спавн</text>'));
    const gGas = g('gas');
    D.zones.forEach((z) => mk(gGas, z.x, z.z, z.id, 'gas', '<circle r="12" class="gas-ico"/><text class="ico" y="5">☣</text><text class="cap cap-0 bad" y="27">Газ!</text>'));
    const gHunt = g('hunting');
    D.points.hunting.forEach((p, i) => mk(gHunt, p[0], p[1], 'hunting-' + i, 'hunting', '<circle r="9" class="hit"/><path d="M0 -5.5 L5 4 L-5 4 Z" class="hunt"/>'));
    const gWater = g('water');
    D.points.water.forEach((p, i) => mk(gWater, p[0], p[1], 'water-' + i, 'water', '<circle r="10" class="hit"/><circle r="5.5" class="water"/><text class="cap cap-3" y="18">Колонка</text>'));
    const gMed = g('medical');
    D.points.clinic.forEach((p, i) => mk(gMed, p[0], p[1], 'clinic-' + i, 'clinic', '<circle r="11" class="hit"/><rect x="-6" y="-6" width="12" height="12" rx="3" class="med"/><path d="M0 -3.6V3.6M-3.6 0H3.6" class="cross"/><text class="cap cap-2" y="19">Медпункт</text>'));
    D.points.hospital.forEach((p, i) => mk(gMed, p[0], p[1], 'hospital-' + i, 'hospital', '<circle r="13" class="hit"/><rect x="-8.5" y="-8.5" width="17" height="17" rx="4" class="med"/><path d="M0 -5V5M-5 0H5" class="cross big"/><text class="cap cap-1" y="23">Больница</text>'));
    const gPol = g('police');
    D.points.police.forEach((p, i) => mk(gPol, p[0], p[1], 'police-' + i, 'police', '<circle r="11" class="hit"/><circle r="7.5" class="police"/><text class="pl" y="3.6">P</text><text class="cap cap-2" y="20">Полиция</text>'));
    const gMil = g('military');
    D.military.forEach((m) => mk(gMil, m.x, m.z, m.id, 'military', '<circle r="14" class="hit"/><path d="M0 -10 L2.9 -3.1 L10 -3.1 L4.2 1.3 L6.4 8.6 L0 4.2 L-6.4 8.6 L-4.2 1.3 L-10 -3.1 L-2.9 -3.1 Z" class="mil"/><text class="cap cap-0 mil-cap" y="24">' + esc(MIL_SHORT[m.id] || m.name) + '</text>'));

    el('g', { class: 'poi-root' }, svg);
    const gTowns = el('g', { class: 'towns' }, svg);
    D.towns.forEach((t) => {
      const node = mk(gTowns, t.x, t.z, t.id, 'town', '<circle r="10" class="hit"/><circle r="' + (t.big ? 3.5 : 2.4) + '" class="tdot' + (t.big ? '' : ' small') + '"/>' +
        '<text class="tl' + (t.big ? ' big' : '') + '" y="' + (t.big ? -8 : -6) + '">' + esc(t.name) + '</text>');
      node.classList.add(t.big ? 'town-big' : 'town-small');
    });
    el('g', { class: 'user-layer' }, svg);
    applyLayers();
    drawUser();
  }

  // метки и названия местности (грузятся отдельным файлом)
  function buildPoi() {
    if (!PO || !svg) return;
    const root = svg.querySelector('.poi-root'); if (!root || root.childNodes.length) return;
    const groups = {};
    const g = (l) => groups[l] || (groups[l] = el('g', { 'data-layer': l }, root));
    PO.names.forEach((n) => {
      const t = mk(g('names'), n[2], n[3], '', 'name n-' + n[0], '<text class="nm" y="4">' + (n[0] === 'hill' ? '▲ ' : '') + esc(n[1]) + '</text>');
      t.style.pointerEvents = 'none';
    });
    PO.poi.forEach((p, i) => {
      const c = POI[p.k]; if (!c) return;
      const small = c.i.length === 1 || c.i === '▣' || c.i === '▴';
      const body = p.k === 'mil' ? '<circle r="13" class="hit"/><path d="M0 -8 L2.3 -2.5 L8 -2.5 L3.4 1 L5.1 6.9 L0 3.4 L-5.1 6.9 L-3.4 1 L-8 -2.5 L-2.3 -2.5 Z" class="mil"/>'
        : p.k === 'guard' ? '<circle r="10" class="hit"/><circle r="6" class="police"/><text class="pl" y="3.2" style="font-size:8px">P</text>'
        : p.k === 'feed' ? '<circle r="9" class="hit"/><path d="M0 -4 L3.8 3 L-3.8 3 Z" class="hunt"/>'
        : p.k === 'milbox' ? '<circle r="10" class="hit"/><rect x="-5" y="-4" width="10" height="8" rx="1.5" class="mil"/>'
        : '<circle r="9" class="poi-bg"/><text class="ico poi-i" y="3.7">' + c.i + '</text>';
      const m = mk(g(c.l), p.x, p.z, 'p-' + i, 'poi pv' + c.lv + (p.k === 'mil' ? ' mil2' : ''), body + '<text class="cap cap-p" y="' + (small ? 17 : 19) + '">' + esc(p.t || '') + '</text>');
      m._k = p.k;
    });
    applyLayers();
    if (lootF) setLoot({ usage: lootF.usage, tiers: [...lootF.tiers] });
  }

  function mk(parent, x, z, id, kind, inner, extraStyle) {
    const attrs = { class: 'mk mk-' + kind, style: '--x:' + x + ';--y:' + Y(z) + (extraStyle || '') };
    if (id) attrs['data-id'] = id;
    const g = el('g', attrs, parent);
    g.innerHTML = inner;
    g._x = x; g._z = z;
    return g;
  }

  // ---------- canvas: море, суша, зоны лута, здания, газ ----------
  function draw() {
    raf = 0;
    if (!canvas || !vb) return;
    const W = canvas.width, H = canvas.height;
    const k = W / vb.w; // пикселей canvas на метр
    const sx = (x) => (x - vb.x) * k, sy = (z) => (Y(z) - vb.y) * k;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    const sea = ctx.createRadialGradient(W * .8, H * .9, 10, W * .8, H * .9, Math.max(W, H));
    sea.addColorStop(0, '#0d2a5c'); sea.addColorStop(1, '#06122b');
    ctx.fillStyle = sea; ctx.fillRect(0, 0, W, H);

    if (bg && bg.complete && bg.naturalWidth) {
      const b = D.background;
      ctx.globalAlpha = b.opacity || 1;
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bg, sx(b.x0), sy(b.z1), (b.x1 - b.x0) * k, (b.z1 - b.z0) * k);
      ctx.globalAlpha = 1;
      // подробные плитки при приближении
      if (b.tiles && W / vb.w > 0.2 * Math.min(dpr, 1.5)) {
        const n = b.grid, c = D.size / n, skip = b._skip || (b._skip = new Set((b.skip || []).map((q) => q.join('_'))));
        const x0 = Math.max(0, Math.floor(vb.x / c)), x1 = Math.min(n - 1, Math.floor((vb.x + vb.w) / c));
        const y0 = Math.max(0, Math.floor(vb.y / c)), y1 = Math.min(n - 1, Math.floor((vb.y + vb.h) / c));
        for (let ty = y0; ty <= y1; ty++) for (let tx = x0; tx <= x1; tx++) {
          const key = tx + '_' + ty; if (skip.has(key)) continue;
          const im = tile(key);
          if (im.ok) { const px = Math.floor((tx * c - vb.x) * k), py = Math.floor((ty * c - vb.y) * k); ctx.drawImage(im, px, py, Math.ceil(((tx + 1) * c - vb.x) * k) - px, Math.ceil(((ty + 1) * c - vb.y) * k) - py); }
        }
      }
    } else {
      const poly = (pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.closePath(); };
      ctx.fillStyle = '#132339'; ctx.strokeStyle = '#3b6fb8'; ctx.lineWidth = 1.5 * dpr;
      poly(D.coast); ctx.fill(); ctx.stroke();
      D.islands.forEach((isl) => { poly(isl); ctx.fill(); ctx.stroke(); });
    }

    // реки, тропы, рельсы
    const inV = (x, z) => x > vb.x - 50 && x < vb.x + vb.w + 50 && Y(z) > vb.y - 50 && Y(z) < vb.y + vb.h + 50;
    if (V) {
      ctx.lineCap = 'round'; ctx.lineJoin = 'round';
      ctx.strokeStyle = 'rgba(96,178,255,.85)'; ctx.lineWidth = Math.max(1.2 * dpr, 14 * k);
      V.rivers.forEach((l) => { ctx.beginPath(); l.forEach((q, i) => (i ? ctx.lineTo(sx(q[0]), sy(q[1])) : ctx.moveTo(sx(q[0]), sy(q[1])))); ctx.stroke(); });
      if (layersOn.rails) {
        if (k > 0.05 * dpr) {
          ctx.fillStyle = 'rgba(255,214,150,.8)'; const t = Math.max(1.3 * dpr, 3 * k);
          V.paths.forEach((q) => { if (inV(q[0], q[1])) ctx.fillRect(sx(q[0]) - t / 2, sy(q[1]) - t / 2, t, t); });
        }
        const seg = () => { ctx.beginPath(); V.rails.forEach((q) => { if (inV(q[0], q[1]) || inV(q[2], q[3])) { ctx.moveTo(sx(q[0]), sy(q[1])); ctx.lineTo(sx(q[2]), sy(q[3])); } }); ctx.stroke(); };
        ctx.strokeStyle = '#141a28'; ctx.lineWidth = Math.max(2 * dpr, 7 * k); seg();
        if (k > 0.06 * dpr) { ctx.setLineDash([5 * dpr, 4 * dpr]); ctx.lineCap = 'butt'; ctx.strokeStyle = '#e9eefb'; ctx.lineWidth = Math.max(dpr, 3.5 * k); seg(); ctx.setLineDash([]); }
      }
    }

    // сетка 1 км
    ctx.strokeStyle = 'rgba(95,176,255,.07)'; ctx.lineWidth = 1;
    ctx.beginPath();
    for (let m = 1000; m < D.size; m += 1000) { ctx.moveTo(sx(m), sy(0)); ctx.lineTo(sx(m), sy(D.size)); ctx.moveTo(sx(0), sy(m)); ctx.lineTo(sx(D.size), sy(m)); }
    ctx.stroke();

    // зоны лута
    if (layersOn.tiers && D.tiers) {
      const n = D.tiers.n, cell = D.size / n;
      for (let gz = 0; gz < n; gz++) {
        const row = D.tiers.rows[gz];
        for (let gx = 0; gx < n; gx++) {
          const t = +row[gx];
          if (!t) continue;
          if (lootF && lootF.tiers.size && !lootF.tiers.has(t)) continue;
          ctx.fillStyle = TCOL[t];
          ctx.fillRect(sx(gx * cell), sy((gz + 1) * cell), cell * k + 1, cell * k + 1);
        }
      }
    }

    // газовые зоны в реальном размере
    if (layersOn.gas) {
      D.zones.forEach((z) => {
        ctx.beginPath(); ctx.arc(sx(z.x), sy(z.z), z.r * k, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(226,96,74,.28)'; ctx.fill();
        ctx.setLineDash([6 * dpr, 4 * dpr]); ctx.strokeStyle = '#e2604a'; ctx.lineWidth = 1.5 * dpr; ctx.stroke(); ctx.setLineDash([]);
      });
    }

    // круги опасности вокруг военки (примерно)
    if (layersOn.danger) {
      dangers().filter((m) => m.kind === 'mil').forEach((m) => {
        ctx.beginPath(); ctx.arc(sx(m.x), sy(m.z), m.r * k, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255,170,40,.16)'; ctx.fill();
        ctx.setLineDash([7 * dpr, 5 * dpr]); ctx.strokeStyle = 'rgba(255,186,70,.95)'; ctx.lineWidth = 1.6 * dpr; ctx.stroke(); ctx.setLineDash([]);
      });
    }

    // где могут появиться машины, вертолёты, конвои
    if (PO) {
      const dot = (list, col, r) => { ctx.fillStyle = col; ctx.strokeStyle = 'rgba(6,18,43,.9)'; ctx.lineWidth = 1.2 * dpr; list.forEach((q) => { if (!inV(q[0], q[1])) return; ctx.beginPath(); ctx.arc(sx(q[0]), sy(q[1]), r, 0, 6.3); ctx.fill(); ctx.stroke(); }); };
      const r = Math.max(2.6, Math.min(6, 2.6 + (k / dpr) * 9)) * dpr;
      if (layersOn.cars) { dot(PO.events.car.filter((q) => PO.cars[q[2]] !== 'Лодка'), '#7dffea', r); dot(PO.events.car.filter((q) => PO.cars[q[2]] === 'Лодка'), '#5fa8ff', r); }
      if (layersOn.events) { dot(PO.events.heli, '#ff5fd2', r); dot(PO.events.convoy, '#ffcf3f', r); dot(PO.events.pol, '#6f8bff', r); dot(PO.events.train, '#ff9d5c', r); }
    }

    // здания (по точкам лута из официальных данных)
    if (layersOn.buildings && B && k > 0.1 * dpr) {
      const minPx = 2.2 * dpr;
      const x0 = vb.x - 80, x1 = vb.x + vb.w + 80, y0 = vb.y - 80, y1 = vb.y + vb.h + 80;
      const zoomed = true;
      for (let i = 0; i < B.b.length; i++) {
        const b = B.b[i];
        const yy = D.size - b[1];
        if (b[0] < x0 || b[0] > x1 || yy < y0 || yy > y1) continue;
        const ty = B.types[b[3]];
        ctx.fillStyle = BCOL[B.cats[ty[3]]] || BCOL.Other;
        const px = (b[0] - vb.x) * k, py = (yy - vb.y) * k;
        if (!zoomed) { const s = Math.max(1.6 * dpr, ty[1] * k); ctx.globalAlpha = .75; ctx.fillRect(px - s / 2, py - s / 2, s, s); continue; }
        ctx.save();
        ctx.translate(px, py);
        ctx.rotate(b[2] * Math.PI / 180);
        const w = Math.max(minPx, ty[1] * k), h = Math.max(minPx, ty[2] * k);
        ctx.globalAlpha = .5; ctx.fillStyle = '#0a0f1a'; ctx.fillRect(ty[4] * k - w / 2 + 1.2 * dpr, -ty[5] * k - h / 2 + 1.2 * dpr, w, h);
        ctx.fillStyle = BCOL[B.cats[ty[3]]] || BCOL.Other; ctx.globalAlpha = .95;
        ctx.fillRect(ty[4] * k - w / 2, -ty[5] * k - h / 2, w, h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  // ---------- расстановка: прячем значки и подписи, которые налезают друг на друга ----------
  let declT = 0;
  function requestDecl() { if (!declT) declT = setTimeout(() => { declT = 0; declutter(); }, 110); }
  function meta(g) {
    if (g._m) return g._m;
    const has = (c) => g.classList.contains(c), L = g.closest('[data-layer]');
    const t = g.querySelector('text.tl,text.cap,text.nm');
    const m = { layer: L ? L.getAttribute('data-layer') : '', el: t, txt: t ? t.textContent : '', oy: t ? +(t.getAttribute('y') || 0) : 0, fs: 9, pri: 9, lvI: 0, lvC: 3, r: 9, hide: false };
    if (has('town-big')) Object.assign(m, { pri: 0, lvC: 0, fs: 13.5, r: 3 });
    else if (has('town-small')) Object.assign(m, { pri: 3, lvC: 1, fs: 11, r: 2 });
    else if (has('mk-military')) Object.assign(m, { pri: 1, lvC: 0, fs: 10, r: 9 });
    else if (has('mk-gas')) Object.assign(m, { pri: 1, lvC: 0, fs: 9, r: 11 });
    else if (has('mk-hospital')) Object.assign(m, { pri: 2, lvC: 1, r: 8 });
    else if (has('mk-police')) Object.assign(m, { pri: 4, lvC: 2, r: 7, hide: true });
    else if (has('mil2')) Object.assign(m, { pri: 3.5, lvI: 1, lvC: 2, r: 8, hide: true });
    else if (has('mk-clinic')) Object.assign(m, { pri: 4.5, lvI: 1, lvC: 2, r: 6, hide: true });
    else if (has('mk-water')) Object.assign(m, { pri: 5, lvI: 1, lvC: 3, r: 5.5 });
    else if (has('mk-spawn')) Object.assign(m, { pri: 6, lvC: 2, r: 0 });
    else if (has('mk-name')) Object.assign(m, { pri: 6.5, lvI: has('n-loc') ? 2 : 1, lvC: has('n-loc') ? 2 : 1, fs: 10, r: 0 });
    else if (has('mk-hunting')) Object.assign(m, { pri: 8.5, lvI: 2, r: 5, hide: true });
    else if (has('mk-poi')) { const lv = has('pv0') ? 0 : has('pv1') ? 1 : 2; Object.assign(m, { pri: 5 + lv + (g._k === 'camp' ? -0.6 : g._k === 'feed' || g._k === 'view' || g._k === 'power' ? 1 : 0), lvI: lv, lvC: lv === 0 ? 2 : 3, r: g._k === 'feed' ? 4 : 9, hide: true }); }
    else m.pri = -1;
    return (g._m = m);
  }
  function declutter() {
    if (!svg || !vb || !wrap.isConnected) return;
    const r = wrap.getBoundingClientRect(), k = r.width / vb.w, Z = D.size / vb.w, lv = Z >= 9 ? 3 : Z >= 4 ? 2 : Z >= 2.2 ? 1 : 0;
    const s = parseFloat(svg.style.getPropertyValue('--s')) || 1, list = [];
    svg.querySelectorAll('.mk').forEach((g) => {
      if (g._x == null) return;
      const m = meta(g); if (m.pri < 0) return;
      const x = (g._x - vb.x) * k, y = (Y(g._z) - vb.y) * k;
      if (x < -60 || y < -40 || x > r.width + 60 || y > r.height + 40) return;
      if ((m.layer && !layersOn[m.layer]) || lv < m.lvI || g.classList.contains('dim')) return;
      list.push({ g, m, x, y });
    });
    list.sort((a, b) => a.m.pri - b.m.pri);
    const icons = [], labels = [];
    list.forEach((o) => {
      const R = o.m.r * s; let hide = false;
      if (o.m.hide && !lootF && !o.g.classList.contains('sel')) hide = icons.some((q) => Math.hypot(q.x - o.x, q.y - o.y) < (q.R + R) * 0.8);
      o.g.classList.toggle('noi', hide);
      if (!hide && R) icons.push({ x: o.x, y: o.y, R });
      o.hid = hide;
    });
    list.forEach((o) => {
      if (!o.m.el) return;
      let no = true;
      if (!o.hid && lv >= o.m.lvC && o.m.txt) {
        const w = o.m.txt.length * o.m.fs * 0.6 * s / 2, h = o.m.fs * 0.62 * s, cy = o.y + (o.m.oy - o.m.fs * 0.35) * s;
        no = labels.some((q) => Math.abs(q.x - o.x) < q.w + w && Math.abs(q.y - cy) < q.h + h);
        if (!no && o.m.pri >= 3.5) no = icons.some((q) => (q.x !== o.x || q.y !== o.y) && Math.abs(q.x - o.x) < q.R * 0.8 + w && Math.abs(q.y - cy) < q.R * 0.8 + h);
        if (!no) labels.push({ x: o.x, y: cy, w, h });
      }
      o.g.classList.toggle('nol', no && lv >= o.m.lvC);
    });
  }
  function tile(key) {
    let im = tiles.get(key);
    if (im) { tiles.delete(key); tiles.set(key, im); return im; }
    im = new Image(); im.decoding = 'async';
    im.onload = () => { im.ok = true; requestDraw(); };
    im.onerror = () => { setTimeout(() => { if (!im.ok) tiles.delete(key); }, 8000); };
    im.src = D.background.tiles + key + '.webp';
    tiles.set(key, im);
    if (tiles.size > 48) tiles.delete(tiles.keys().next().value); // не держим в памяти лишнее
    return im;
  }
  function requestDraw() { if (!raf) raf = requestAnimationFrame(draw); }

  // ---------- вид, масштаб ----------
  function setVB(nx, ny, nw) {
    const r = wrap.getBoundingClientRect();
    const aspect = (r.height || 1) / (r.width || 1);
    nw = Math.max(700, Math.min(nw, D.size * 1.15));
    const nh = nw * aspect;
    const pad = nw * 0.4;
    const clamp = (v, a, b) => Math.max(Math.min(a, b), Math.min(v, Math.max(a, b)));
    nx = clamp(nx, -pad, D.size - nw + pad);
    ny = clamp(ny, -pad - Math.max(0, nh - D.size), D.size - nh + pad + Math.max(0, nh - D.size));
    vb = { x: nx, y: ny, w: nw, h: nh };
    svg.setAttribute('viewBox', nx + ' ' + ny + ' ' + nw + ' ' + nh);
    const u = nw / (r.width || 1);            // метров на CSS-пиксель
    const Z = D.size / nw;                      // 1 = вся карта по ширине
    const s = Math.max(0.95, Math.min(1.7, 0.95 + 0.26 * Math.log2(Math.max(Z, 1)))); // значки растут при приближении
    svg.style.setProperty('--u', u);
    svg.style.setProperty('--s', s);
    svg.classList.toggle('lv1', Z >= 2.2);
    svg.classList.toggle('lv2', Z >= 4);
    svg.classList.toggle('lv3', Z >= 9);
    requestDraw(); requestDecl();
    if (tip && tip.dataset.pinned) positionTip();
  }
  function resizeCanvas() {
    const r = wrap.getBoundingClientRect();
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(r.width * dpr); canvas.height = Math.round(r.height * dpr);
  }
  function zoomAt(cx, cy, factor) {
    const r = wrap.getBoundingClientRect();
    const gx = vb.x + (cx - r.left) / r.width * vb.w, gy = vb.y + (cy - r.top) / r.height * vb.h;
    const nw = vb.w / factor;
    setVB(gx - (cx - r.left) / r.width * nw, gy - (cy - r.top) / r.height * nw * (vb.h / vb.w), nw);
  }
  function centerOn(x, z, w, yFrac) {
    const r = wrap.getBoundingClientRect();
    const nw = w || vb.w, nh = nw * (r.height / r.width);
    setVB(x - nw / 2, Y(z) - nh * (yFrac || 0.5), nw);
  }
  function fitAll() {
    const r = wrap.getBoundingClientRect();
    const a = (r.height / r.width) || 1;
    const w = Math.min(D.size, D.size / a);
    setVB(Math.max(0, D.size - w - 1300), a >= 1 ? 0 : D.size - w * a, w);
  }

  // ---------- жесты ----------
  function gestures() {
    const ptrs = new Map();
    let start = null, moved = false, downTarget = null, lastTap = 0;
    const target = (e) => e && e.closest && e.closest('[data-id]');
    svg.addEventListener('pointerdown', (e) => {
      svg.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      downTarget = e.target; moved = false; start = snapshot();
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) {
        // наведение мышкой — подсказка без клика
        if (e.pointerType === 'mouse' && !tip.dataset.pinned) {
          const t = target(e.target);
          if (t) showHover(t.getAttribute('data-id'), e.clientX, e.clientY); else hideTip();
        }
        return;
      }
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = wrap.getBoundingClientRect();
      if (ptrs.size === 1 && start && start.n === 1) {
        const p = [...ptrs.values()][0];
        const dx = p.x - start.cx, dy = p.y - start.cy;
        if (Math.abs(dx) + Math.abs(dy) > 6) { moved = true; if (!tip.dataset.pinned) hideTip(); }
        if (moved) setVB(start.vb.x - dx / r.width * start.vb.w, start.vb.y - dy / r.height * start.vb.h, start.vb.w);
      } else if (ptrs.size >= 2) {
        if (!start || start.n !== 2) start = snapshot();
        moved = true;
        const [a, b] = [...ptrs.values()];
        const d = Math.hypot(a.x - b.x, a.y - b.y) || 1;
        const cx = (a.x + b.x) / 2, cy = (a.y + b.y) / 2;
        const nw = start.vb.w * start.d / d;
        const gx = start.vb.x + (start.cx - r.left) / r.width * start.vb.w;
        const gy = start.vb.y + (start.cy - r.top) / r.height * start.vb.h;
        setVB(gx - (cx - r.left) / r.width * nw, gy - (cy - r.top) / r.height * nw * (start.vb.h / start.vb.w), nw);
      }
    });
    const up = (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.delete(e.pointerId);
      if (ptrs.size === 0) {
        if (!moved) {
          const now = Date.now();
          const t = target(downTarget);
          if (mode) { const g = toGame(e.clientX, e.clientY); if (mode === 'me') setMe({ x: g[0], z: g[1], name: 'метка на карте' }); else { mine.push(g); saveMine(); drawUser(); } }
          else if (t) select(t.getAttribute('data-id'), true);
          else if (tapEvent(e.clientX, e.clientY)) { /* показали подсказку */ }
          else if (now - lastTap < 320) zoomAt(e.clientX, e.clientY, 2);
          else hideTip(true);
          lastTap = now;
        }
        start = null;
      } else start = snapshot();
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse' && !tip.dataset.pinned) hideTip(); });
    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.25 : 0.8); }, { passive: false });
    function snapshot() {
      const v = [...ptrs.values()];
      if (v.length >= 2) return { n: 2, vb: { ...vb }, d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) || 1, cx: (v[0].x + v[1].x) / 2, cy: (v[0].y + v[1].y) / 2 };
      if (v.length === 1) return { n: 1, vb: { ...vb }, cx: v[0].x, cy: v[0].y };
      return null;
    }
  }

  function tierAt(x, z) {
    if (!D.tiers) return 0;
    const n = D.tiers.n, cell = D.size / n;
    const gx = Math.min(n - 1, Math.max(0, Math.floor(x / cell))), gz = Math.min(n - 1, Math.max(0, Math.floor(z / cell)));
    return +D.tiers.rows[gz][gx] || 0;
  }
  // какие слои включить для usage из types.xml
  const USAGE_LAYER = { Medic: 'medical', Police: 'police', Military: 'military', Hunting: 'hunting', ContaminatedArea: 'gas' };
  const TOWNISH = ['Town', 'Village', 'Farm', 'Industrial', 'Office', 'School', 'Firefighter', 'Coast', 'Lunapark'];
  function setLoot(f) {
    lootF = f ? { usage: f.usage || [], tiers: new Set(f.tiers || []) } : null;
    if (lootF) {
      LAYERS.forEach((l) => { layersOn[l.id] = ['danger', 'gas', 'rails', 'buildings', 'names'].includes(l.id); });
      lootF.usage.forEach((u) => { if (USAGE_LAYER[u]) layersOn[USAGE_LAYER[u]] = true; });
      layersOn.tiers = lootF.tiers.size > 0;
    } else LAYERS.forEach((l) => { layersOn[l.id] = l.on; });
    if (!svg) return;
    const towns = lootF && (lootF.usage.some((u) => TOWNISH.includes(u)) || !lootF.usage.length);
    const big = lootF && (lootF.usage.includes('Town') || !lootF.usage.length), small = lootF && lootF.usage.some((u) => u !== 'Town' && TOWNISH.includes(u));
    svg.classList.toggle('loot-mode', !!lootF);
    svg.querySelectorAll('.mk').forEach((m) => {
      if (!lootF || m._x == null) { m.classList.remove('dim', 'hl'); return; }
      const okTier = !lootF.tiers.size || lootF.tiers.has(tierAt(m._x, m._z));
      const isTown = m.classList.contains('mk-town');
      const want = isTown ? (towns && ((big && m.classList.contains('town-big')) || (small && m.classList.contains('town-small')) || (!big && !small))) : true;
      m.classList.toggle('dim', !(okTier && want));
      m.classList.toggle('hl', !!(isTown && okTier && want));
    });
    document.querySelectorAll('[data-layer-toggle]').forEach((b) => b.classList.toggle('on', !!layersOn[b.getAttribute('data-layer-toggle')]));
    applyLayers();
  }

  function applyLayers() {
    svg.querySelectorAll('[data-layer]').forEach((g) => { g.style.display = layersOn[g.getAttribute('data-layer')] ? '' : 'none'; });
    requestDraw(); requestDecl();
  }

  // ---------- «я здесь», цель и свой маршрут ----------
  const LS = { get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } }, set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); } catch (e) { /* нет места */ } } };
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const DIRS = ['С', 'СВ', 'В', 'ЮВ', 'Ю', 'ЮЗ', 'З', 'СЗ'];
  function bearing(a, b) { const d = (Math.atan2(b.x - a.x, b.z - a.z) * 180 / Math.PI + 360) % 360; return { deg: Math.round(d) % 360, dir: DIRS[Math.round(d / 45) % 8] }; }
  function toGame(cx, cy) { const r = wrap.getBoundingClientRect(); return [Math.round(vb.x + (cx - r.left) / r.width * vb.w), Math.round(D.size - (vb.y + (cy - r.top) / r.height * vb.h))]; }
  function arrowsAlong(p) {
    let total = 0; for (let i = 1; i < p.length; i++) total += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
    const n = Math.max(1, Math.min(8, Math.round(total / 1100))), out = []; let next = total / (n + 1), acc = 0;
    for (let i = 1; i < p.length; i++) {
      const L = Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]);
      while (L && acc + L >= next && out.length < n) {
        const t = (next - acc) / L;
        out.push([p[i - 1][0] + (p[i][0] - p[i - 1][0]) * t, p[i - 1][1] + (p[i][1] - p[i - 1][1]) * t, Math.atan2(-(p[i][1] - p[i - 1][1]), p[i][0] - p[i - 1][0]) * 180 / Math.PI]);
        next += total / (n + 1);
      }
      acc += L;
    }
    return out;
  }
  const dangers = () => D.military.map((m) => ({ x: m.x, z: m.z, r: m.danger || 400, name: m.name, kind: 'mil' })).concat(PO ? PO.poi.filter((p) => p.k === 'mil').map((p) => ({ x: p.x, z: p.z, r: p.danger, name: p.t + ' (' + p.s + ')', kind: 'mil' })) : []).concat(D.zones.map((z) => ({ x: z.x, z: z.z, r: z.r, name: z.name, kind: 'gas' })));
  function segDist(p, a, b) { const dx = b.x - a.x, dz = b.z - a.z, L = dx * dx + dz * dz; const t = L ? Math.max(0, Math.min(1, ((p.x - a.x) * dx + (p.z - a.z) * dz) / L)) : 0; return Math.hypot(p.x - a.x - t * dx, p.z - a.z - t * dz); }
  // какие опасные зоны пересекает ломаная
  function dangersOn(line) {
    const pts = line.map((q) => ({ x: q[0], z: q[1] }));
    return dangers().filter((d) => pts.length === 1 ? dist(d, pts[0]) <= d.r + 100 : pts.some((q, i) => i && segDist(d, pts[i - 1], q) <= d.r + 100));
  }
  function lineKm(p) { let t = 0; for (let i = 1; i < p.length; i++) t += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return t / 1000; }
  function saveMine() { LS.set('dz_my_route', mine); }
  function drawUser() {
    if (!svg) return;
    const g = svg.querySelector('.user-layer'); if (!g) return; g.innerHTML = '';
    if (me && dest) el('polyline', { points: me.x + ',' + Y(me.z) + ' ' + dest.x + ',' + Y(dest.z), class: 'u-line dash' }, g);
    if (mine.length > 1) {
      const pts = mine.map((q) => q[0] + ',' + Y(q[1])).join(' ');
      el('polyline', { points: pts, class: 'u-line case' }, g); el('polyline', { points: pts, class: 'u-line own' }, g);
      arrowsAlong(mine).forEach((q) => mk(g, q[0], q[1], '', 'arrow own', '<path d="M-6 -6 L6 0 L-6 6 Z" class="arrow-p"/>', ';--r:' + q[2] + 'deg'));
    }
    mine.forEach((q, i) => mk(g, q[0], q[1], '', 'wp', '<circle r="7" class="wp-c own"/><text class="wp-t" y="3.3">' + (i + 1) + '</text>'));
    if (dest) mk(g, dest.x, dest.z, '', 'flag', '<circle r="11" class="flag-c good"/><text class="ico" y="5">🏁</text>');
    if (me) mk(g, me.x, me.z, '', 'flag', '<circle r="16" class="me-halo"/><circle r="8" class="me-dot"/><text class="flag-t" y="-20">Я ЗДЕСЬ</text>');
    if (onState) onState({ me, dest, mine: mine.slice(), mode });
  }
  function setMe(p) { me = p; if (p) { LS.set('dz_me', p); if (mode === 'me') mode = null; } else LS.set('dz_me', null); drawUser(); }
  function setDest(p) { dest = p; drawUser(); if (me && dest) fitPts([[me.x, me.z], [dest.x, dest.z]]); }
  function setMode(m) { mode = m; hideTip(true); svg.classList.toggle('picking', !!m); drawUser(); }
  function fitPts(p) {
    const xs = p.map((q) => q[0]), zs = p.map((q) => q[1]), r = wrap.getBoundingClientRect(), a = r.height / r.width;
    const w = Math.max((Math.max(...xs) - Math.min(...xs)) * 1.5, (Math.max(...zs) - Math.min(...zs)) * 1.5 / a, 2200);
    setVB((Math.max(...xs) + Math.min(...xs)) / 2 - w / 2, Y((Math.max(...zs) + Math.min(...zs)) / 2) - w * a / 2, w);
  }
  // что рядом с точкой
  function around(p) {
    const near = (list, f) => list.map(f).map((q) => ({ ...q, d: dist(p, q), b: bearing(p, q) })).sort((a, b) => a.d - b.d)[0];
    const pt = (q) => ({ x: q[0], z: q[1], name: q[2] });
    return {
      town: near(D.towns, (t) => ({ x: t.x, z: t.z, name: t.name })), water: near(D.points.water, pt),
      medical: near(D.points.hospital.concat(D.points.clinic), pt), police: near(D.points.police, pt),
      danger: dangers().map((d) => ({ ...d, d: dist(p, d) - d.r, b: bearing(p, d) })).sort((a, b) => a.d - b.d)[0], tier: tierAt(p.x, p.z)
    };
  }

  // ---------- описание объекта ----------
  const nearCount = (x, z, list, r) => list.filter((p) => Math.hypot(p[0] - x, p[1] - z) <= r).length;
  function info(id) {
    const kind = id.split('-')[0];
    if (kind === 'p') {
      const p = PO && PO.poi[+id.slice(2)]; if (!p) return null; const c = POI[p.k];
      return { x: p.x, z: p.z, icon: c.i === '★' ? '🎖️' : c.i === '▣' ? '📦' : c.i === 'P' ? '🚓' : c.i === '▴' ? '🦌' : c.i, title: p.t || '', sub: 'рядом: ' + p.s + (p.n ? ' · ' + p.n : ''),
        body: (c.l === 'military' ? '<div class="tip-tier t' + tierAt(p.x, p.z) + '">🎯 Tier ' + tierAt(p.x, p.z) + '</div>' : '') + '<p>' + esc(c.d) + '</p>' };
    }
    if (kind === 't') {
      const t = D.towns.find((x) => x.id === id); if (!t) return null;
      const w = nearCount(t.x, t.z, D.points.water, 700), m = nearCount(t.x, t.z, D.points.hospital.concat(D.points.clinic), 900),
        p = nearCount(t.x, t.z, D.points.police, 900), s = nearCount(t.x, t.z, D.points.spawn, 1500);
      return { x: t.x, z: t.z, icon: '📍', title: t.name, sub: (t.big ? 'Город' : 'Деревня') + ' · ' + t.en + (t.tier ? ' · Tier ' + t.tier : ''),
        body: (t.tier ? '<div class="tip-tier t' + t.tier + '">🎯 ' + esc(TIER_TXT[t.tier]) + '</div>' : '') +
          '<div class="tip-stats"><span>💧 колонок: ' + w + '</span><span>✚ медицина: ' + m + '</span><span>🚓 полиция: ' + p + '</span></div>' +
          (s ? '<div class="tip-warn">Рядом спавн — много свежих игроков</div>' : '') };
    }
    if (kind === 'm') {
      const m = D.military.find((x) => x.id === id); if (!m) return null;
      return { x: m.x, z: m.z, icon: '🎖️', title: m.name, sub: m.tier ? 'Зона лута: Tier ' + m.tier : '',
        body: '<p>' + esc(m.info) + '</p>', link: ['#weapons/kam', 'Раздел «Оружие»'] };
    }
    if (kind === 'z') {
      const z = D.zones.find((x) => x.id === id); if (!z) return null;
      return { x: z.x, z: z.z, icon: '☣️', title: z.name, sub: 'радиус ≈ ' + z.r + ' м',
        body: '<p>Токсичный газ. Без противогаза с фильтром и костюма ОЗК — смерть за пару минут.</p>', link: ['#diseases/gas-poisoning', 'Химическое отравление'] };
    }
    const idx = +id.split('-')[1], list = D.points[kind], p = list && list[idx], inf = INFO[kind];
    if (!p || !inf) return null;
    return { x: p[0], z: p[1], icon: inf.i, title: inf.t, sub: 'рядом: ' + p[2], body: '<p>' + esc(inf.d) + '</p>', link: inf.link };
  }

  const EV = { heli: ['🚁', 'Крушение вертолёта', 'Здесь может появиться крушение вертолёта с военным лутом. На карте одновременно их около трёх, места случайные.'], convoy: ['🚙', 'Военный конвой', 'Здесь может появиться разбитая военная колонна.'], pol: ['🚓', 'Полицейское событие', 'Здесь могут появиться разбитые полицейские машины.'], train: ['🚂', 'Поезд', 'Здесь может появиться поезд с лутом.'] };
  function tapEvent(cx, cy) {
    if (!PO || !(layersOn.cars || layersOn.events)) return false;
    const [gx, gz] = toGame(cx, cy), r = wrap.getBoundingClientRect(), lim = 18 * vb.w / r.width; let best = null;
    const look = (list, f) => list.forEach((q) => { const d = Math.hypot(q[0] - gx, q[1] - gz); if (d < lim && (!best || d < best.d)) best = { d, q, f }; });
    if (layersOn.cars) look(PO.events.car, (q) => ['🚗', PO.cars[q[2]], 'Здесь может стоять этот транспорт. Точек много, а машин на сервере мало: это не гарантия.']);
    if (layersOn.events) Object.keys(EV).forEach((k) => look(PO.events[k], () => EV[k]));
    if (!best) return false;
    const t = best.f(best.q);
    hideTip(true);
    renderTip({ icon: t[0], title: t[1], sub: 'возможное место', body: '<p>' + esc(t[2]) + '</p>' }, true);
    tip.dataset.x = best.q[0]; tip.dataset.z = best.q[1]; positionTip();
    return true;
  }

  // подсказка при наведении (ПК) и закреплённая подсказка по тапу
  function showHover(id, cx, cy) {
    if (id.startsWith('r-')) { const r = D.routes.find((x) => x.id === id); if (!r) return; renderTip({ icon: r.verdict === 'good' ? '✅' : '❌', title: r.title, sub: 'нажми, чтобы показать маршрут' }, false); }
    else { const d = info(id); if (!d) return; renderTip({ icon: d.icon, title: d.title, sub: d.sub }, false); }
    const r = wrap.getBoundingClientRect();
    placeTip(cx - r.left, cy - r.top);
  }
  function renderTip(d, pinned) {
    tip.innerHTML = (pinned ? '<button class="tip-close" aria-label="Закрыть">×</button>' : '') +
      '<div class="tip-head"><span class="tip-ico">' + d.icon + '</span><div><div class="tip-title">' + esc(d.title) + '</div>' +
      (d.sub ? '<div class="tip-sub">' + esc(d.sub) + '</div>' : '') + '</div></div>' + (pinned ? (d.body || '') : '') +
      (pinned ? '<div class="tip-actions">' + (d.link ? '<a class="tip-btn" href="' + d.link[0] + '">' + esc(d.link[1]) + ' →</a>' : '') +
        (d.share ? '<button class="tip-btn ghost" data-share="' + esc(d.share) + '">Поделиться</button>' : '') + '</div>' : '');
    tip.hidden = false;
    tip.classList.toggle('pinned', pinned);
    if (pinned) {
      tip.dataset.pinned = '1';
      tip.querySelector('.tip-close').addEventListener('click', () => hideTip(true));
      const sh = tip.querySelector('[data-share]');
      if (sh) sh.addEventListener('click', () => share(sh.getAttribute('data-share')));
    } else delete tip.dataset.pinned;
  }
  function placeTip(px, py) {
    const r = wrap.getBoundingClientRect();
    const tw = tip.offsetWidth, th = tip.offsetHeight;
    let left = px - tw / 2, top = py - th - 20;
    if (top < 8) top = py + 24;
    left = Math.max(8, Math.min(left, r.width - tw - 8));
    top = Math.max(8, Math.min(top, r.height - th - 8));
    tip.style.left = left + 'px'; tip.style.top = top + 'px';
  }
  function positionTip() {
    const x = +tip.dataset.x, z = +tip.dataset.z;
    const r = wrap.getBoundingClientRect();
    placeTip((x - vb.x) / vb.w * r.width, (Y(z) - vb.y) / vb.h * r.height);
  }
  function hideTip(unpin) {
    if (!tip) return;
    if (tip.dataset.pinned && !unpin) return;
    tip.hidden = true; delete tip.dataset.pinned;
    if (unpin) {
      svg.querySelectorAll('.mk.sel').forEach((n) => n.classList.remove('sel'));
      if (onNavigate && !svg.classList.contains('has-sel-route')) onNavigate(null);
    }
  }

  function select(id, fromTap) {
    if (id.startsWith('r-')) return selectRoute(id);
    const d = info(id); if (!d) return;
    svg.querySelectorAll('.mk.sel').forEach((n) => n.classList.remove('sel'));
    const node = svg.querySelector('.mk[data-id="' + CSS.escape(id) + '"]'); if (node) node.classList.add('sel');
    d.share = id;
    if (!fromTap) centerOn(d.x, d.z, Math.min(vb.w, 3500), 0.62);
    renderTip(d, true);
    tip.dataset.x = d.x; tip.dataset.z = d.z;
    positionTip();
    if (onNavigate) onNavigate(id);
  }

  // ---------- маршруты ----------
  function routeStats(r) {
    const s = r.stats;
    return '<div class="ms-stats"><span>📏 <b>' + s.km + '</b> км</span><span>💧 колонок: <b>' + s.water + '</b></span><span>✚ медицина: <b>' + s.medical + '</b></span><span>🚓 полиция: <b>' + s.police + '</b></span>' +
      (s.gas ? '<span class="bad">☣️ газовая зона!</span>' : '') + (s.military.length ? '<span class="warn">🎖️ ' + esc(s.military.join(', ')) + '</span>' : '') + '</div>';
  }
  function lootHTML(r) {
    const L = r.loot; if (!L) return '';
    const row = (lbl, arr) => (arr && arr.length ? '<div class="loot-row"><span class="loot-k">' + lbl + '</span> ' + arr.map(esc).join(', ') + '</div>' : '');
    return '<div class="loot"><div class="loot-title">🎒 Возможный лут на финише: ' + esc(L.place) + '</div>' +
      '<div class="tier-path"><span class="tip-tier t' + L.start_tier + '">Старт: Tier ' + L.start_tier + '</span> → <span class="tip-tier t' + L.tier + '">Финиш: Tier ' + L.tier + '</span></div>' +
      L.groups.map((g) => '<div class="loot-group"><div class="loot-g">' + esc(g.label) + ' <small>· зданий: ' + g.count + '</small></div>' +
        row('Оружие:', g.weapons) + row('Патроны:', g.ammo) + row('Медицина:', g.medical) + row('Полезное:', g.tools) + '</div>').join('') +
      '<div class="loot-note">По официальной таблице лута DayZ для этих зданий и тира. Это то, что может появиться на официальных серверах, а не гарантия.</div></div>';
  }
  function routeHTML(r) {
    return '<p>' + esc(r.summary) + '</p>' + routeStats(r) + '<ul class="ms-why">' + r.why.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul>' + lootHTML(r);
  }

  function selectRoute(id) {
    const r = D.routes.find((x) => x.id === id); if (!r) return;
    hideTip(true);
    svg.classList.add('has-sel-route');
    svg.querySelectorAll('.route').forEach((n) => n.classList.toggle('sel', n.getAttribute('data-id') === id));
    const pts = r.wp.map(place).filter(Boolean);
    // оформление: старт, финиш, номера точек, стрелки направления
    const deco = svg.querySelector('.route-deco'); deco.innerHTML = '';
    const col = r.verdict === 'good' ? 'good' : 'bad';
    const line = routePts(r);
    arrowsAlong(line).forEach((q) => mk(deco, q[0], q[1], '', 'arrow ' + col, '<path d="M-6 -6 L6 0 L-6 6 Z" class="arrow-p"/>', ';--r:' + q[2] + 'deg'));
    if (pts.length) pts[0] = { x: line[0][0], z: line[0][1] };
    pts.forEach((p, i) => {
      if (i === 0) mk(deco, p.x, p.z, '', 'flag', '<circle r="11" class="flag-c start"/><path d="M-3 -5 L5 0 L-3 5 Z" fill="#fff"/><text class="flag-t" y="-17">СТАРТ</text>');
      else if (i === pts.length - 1) mk(deco, p.x, p.z, '', 'flag', '<circle r="12" class="flag-c ' + col + '"/><text class="ico" y="5">🏁</text><text class="flag-t" y="-18">ФИНИШ</text>');
      else mk(deco, p.x, p.z, '', 'wp', '<circle r="8" class="wp-c ' + col + '"/><text class="wp-t" y="3.5">' + i + '</text>');
    });
    // весь маршрут — в видимой части (снизу свёрнутая панель)
    const xs = line.map((p) => p[0]), zs = line.map((p) => p[1]);
    const minx = Math.min(...xs), maxx = Math.max(...xs), minz = Math.min(...zs), maxz = Math.max(...zs);
    const rr = wrap.getBoundingClientRect(), aspect = rr.height / rr.width;
    const usable = 0.74;
    const w = Math.max((maxx - minx) * 1.4, (maxz - minz) * 1.35 / (aspect * usable), 2500);
    const h = w * aspect;
    setVB((minx + maxx) / 2 - w / 2, Y((minz + maxz) / 2) - h * (0.06 + usable / 2), w);
    openSheet(r);
    if (onNavigate) onNavigate(id);
  }

  function openSheet(r) {
    const good = r.verdict === 'good';
    sheet.innerHTML = '<div class="sheet-bar" role="button" tabindex="0"><span class="sheet-ico">' + (good ? '✅' : '❌') + '</span>' +
      '<span class="sheet-title">' + esc(r.title) + '<small>' + (good ? 'Хороший маршрут' : 'Ошибка новичка') + ' · ' + r.stats.km + ' км · нажми, чтобы раскрыть</small></span>' +
      '<span class="sheet-chev">▲</span><button class="sheet-x" aria-label="Закрыть">×</button></div>' +
      '<div class="sheet-body">' + routeHTML(r) + '<div class="tip-actions"><button class="tip-btn ghost" data-share="' + esc(r.id) + '">Поделиться маршрутом</button></div></div>';
    sheet.hidden = false; sheet.classList.remove('open');
    sheet.querySelector('.sheet-bar').addEventListener('click', (e) => { if (e.target.closest('.sheet-x')) return; sheet.classList.toggle('open'); });
    sheet.querySelector('.sheet-x').addEventListener('click', closeRoute);
    sheet.querySelector('[data-share]').addEventListener('click', () => share(r.id));
  }
  function closeRoute() {
    if (!sheet) return;
    sheet.hidden = true;
    svg.classList.remove('has-sel-route');
    svg.querySelectorAll('.route.sel').forEach((n) => n.classList.remove('sel'));
    svg.querySelector('.route-deco').innerHTML = '';
    if (onNavigate) onNavigate(null);
  }

  async function share(id) {
    const url = location.href.split('#')[0] + '#map/' + id;
    if (window.dzShare) window.dzShare({ id: 'map/' + id, title: 'Карта DayZ — DayZ Guide', text: 'Карта DayZ — DayZ Guide', url });
  }

  function legendHTML() {
    const b = (c, t) => '<span class="lg-b" style="background:' + c + '"></span>' + t, e = (i, t) => '<div><span class="lg-i">' + i + '</span>' + t + '</div>';
    return '<button class="tip-close" aria-label="Закрыть">×</button><div class="lg-title">Значки</div><div class="lg-grid">' +
      '<div><span class="lg-i lg-water"></span>Колонка</div><div><span class="lg-i lg-med">✚</span>Медицина</div>' +
      '<div><span class="lg-i lg-pol">P</span>Полиция</div><div><span class="lg-i lg-mil">★</span>Военка</div>' +
      '<div><span class="lg-i lg-hunt">▲</span>Вышка, охота</div><div><span class="lg-i lg-spawn"></span>Спавн</div>' +
      e('☣', 'Газ') + e('🏕️', 'Лагерь') + e('🏠', 'Одинокий дом') + e('🏰', 'Замок') + e('⛪', 'Церковь') + e('🗼', 'Маяк') + e('⛽', 'Заправка') + e('🚉', 'Вокзал') +
      e('📡', 'Вышка связи') + e('🏭', 'Завод') + e('🐄', 'Ферма') + e('🛒', 'Магазин') + e('🚒', 'Пожарная') + e('👁️', 'Обзор') + '</div>' +
      '<div class="lg-title">Линии и круги</div><div class="lg-grid"><div>' + b('#141a28', 'Железная дорога') + '</div><div>' + b('#ffd696', 'Тропа') + '</div><div>' + b('#60b2ff', 'Река') + '</div><div>' + b('rgba(255,170,40,.6)', 'Опасно: военка') + '</div></div>' +
      '<div class="lg-title">Где могут появиться</div><div class="lg-grid"><div>' + b('#7dffea', 'Машина') + '</div><div>' + b('#5fa8ff', 'Лодка') + '</div><div>' + b('#ff5fd2', 'Вертолёт') + '</div><div>' + b('#ffcf3f', 'Конвой') + '</div><div>' + b('#6f8bff', 'Полиция') + '</div><div>' + b('#ff9d5c', 'Поезд') + '</div></div>' +
      '<div class="lg-title">Зоны лута</div><div class="lg-grid">' + [1, 2, 3, 4].map((t) => '<div>' + b(TSOLID[t], 'Tier ' + t) + '</div>').join('') + '</div>' +
      '<p class="lg-note">Радиусы опасных кругов мы задали сами. Деревья и края дорог при приближении дорисованы по картинке. Реки показаны не все.</p>';
  }

  // ---------- публичный API ----------
  window.DZMap = {
    LAYERS, routeHTML, lootHTML,
    bearing, dangersOn, lineKm, around, dist,
    setMe, setDest, setMode,
    getState: () => ({ me, dest, mine: mine.slice(), mode }),
    undo() { mine.pop(); saveMine(); drawUser(); },
    clearMine() { mine = []; saveMine(); drawUser(); },
    setMine(p) { mine = p; saveMine(); drawUser(); if (p.length > 1) fitPts(p); },
    fitMine() { if (mine.length > 1) fitPts(mine); },
    flyTo(x, z, w) { hideTip(true); centerOn(x, z, w || 2600, 0.5); const g = svg.querySelector('.user-layer'); const o = g.querySelector('.mk-ping'); if (o) o.remove(); const pg = mk(g, x, z, '', 'ping', '<circle r="14" class="ping"/>'); setTimeout(() => pg.remove(), 6000); },
    setPoi(p) { PO = p; buildPoi(); requestDraw(); drawUser(); if (pendingFocus) { const f = pendingFocus; pendingFocus = null; select(f, false); } },
    tileList: () => { const b = D && D.background; if (!b || !b.tiles) return []; const sk = new Set((b.skip || []).map((q) => q.join('_'))), o = []; for (let y = 0; y < b.grid; y++) for (let x = 0; x < b.grid; x++) if (!sk.has(x + '_' + y)) o.push(b.tiles + x + '_' + y + '.webp'); return o; },
    setVectors(v) { V = v; B = v.houses; requestDraw(); },
    mount(container, data, focusId, navCb, loot, stateCb) {
      D = data; onNavigate = navCb || null; onState = stateCb || null; mode = null; dest = null;
      me = LS.get('dz_me', null); mine = LS.get('dz_my_route', []); if (!Array.isArray(mine)) mine = [];
      if (!Object.keys(layersOn).length) LAYERS.forEach((l) => { layersOn[l.id] = l.on; });
      wrap = container.querySelector('.map-wrap');
      sheet = container.querySelector('.map-sheet');
      tip = container.querySelector('.map-tip');
      canvas = document.createElement('canvas'); canvas.className = 'map-canvas';
      ctx = canvas.getContext('2d');
      wrap.insertBefore(canvas, wrap.firstChild);
      buildSVG();
      wrap.insertBefore(svg, canvas.nextSibling);
      bg = null;
      if (D.background && D.background.src) { bg = new Image(); bg.onload = requestDraw; bg.src = D.background.src; }
      buildPoi();
      gestures();
      container.querySelectorAll('[data-layer-toggle]').forEach((b) => {
        const id = b.getAttribute('data-layer-toggle');
        b.classList.toggle('on', !!layersOn[id]);
        b.addEventListener('click', () => { layersOn[id] = !layersOn[id]; b.classList.toggle('on', layersOn[id]); applyLayers(); });
      });
      const mid = (f) => { const r = wrap.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, f); };
      container.querySelector('[data-zoom="in"]').addEventListener('click', () => mid(1.6));
      container.querySelector('[data-zoom="out"]').addEventListener('click', () => mid(1 / 1.6));
      container.querySelector('[data-zoom="fit"]').addEventListener('click', () => { hideTip(true); closeRoute(); fitAll(); });
      const lg = container.querySelector('.map-legend');
      container.querySelector('[data-zoom="legend"]').addEventListener('click', () => {
        lg.innerHTML = legendHTML(); lg.hidden = !lg.hidden;
        const c = lg.querySelector('.tip-close'); if (c) c.addEventListener('click', () => { lg.hidden = true; });
      });
      setLoot(loot || null);
      setTimeout(() => {
        resizeCanvas(); fitAll();
        if (focusId) { if (focusId.startsWith('p-') && !PO) pendingFocus = focusId; else select(focusId, false); }
      }, 0);
      window.addEventListener('resize', onResize);
    },
    setLoot(f) { setLoot(f); requestDraw(); },
    select(id) {
      if (!svg) return;
      const top = wrap.getBoundingClientRect().top + window.scrollY - (document.getElementById('topbar').offsetHeight || 0) - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => select(id, false), 350);
    }
  };
  function onResize() { if (svg && vb && wrap.isConnected) { resizeCanvas(); setVB(vb.x, vb.y, vb.w); } }
})();
