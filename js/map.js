/* Интерактивная схема Чернаруси: зум пальцами, слои, метки, маршруты.
   Данные — data/map.json (координаты в метрах игры: x — восток, z — север, карта 15360×15360). */
(function () {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg';
  const esc = (s) => String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  const LAYERS = [
    { id: 'spawn', title: 'Спавн', icon: '🟢', on: true },
    { id: 'water', title: 'Колонки', icon: '💧', on: true },
    { id: 'medical', title: 'Медицина', icon: '✚', on: true },
    { id: 'police', title: 'Полиция', icon: '🚓', on: true },
    { id: 'military', title: 'Военные', icon: '🎖️', on: true },
    { id: 'gas', title: 'Газ', icon: '☣️', on: true },
    { id: 'routes', title: 'Маршруты', icon: '🧭', on: true },
    { id: 'hunting', title: 'Вышки', icon: '🦌', on: false }
  ];

  const INFO = {
    water: { t: 'Колонка с водой', i: '💧', d: 'Безопасная вода: можно пить и набирать без обработки. Только сначала помой окровавленные руки.', link: ['#food/well-water', 'Карточка: колонка'] },
    hospital: { t: 'Больница', i: '✚', d: 'Много медицинского лута: бинты, таблетки, капельницы. Игроки тоже об этом знают, поэтому заходи осторожно.', link: ['#injuries', 'Раздел «Ранения»'] },
    clinic: { t: 'Медпункт', i: '✚', d: 'Небольшой медпункт или медицинская палатка: бинты, таблетки, иногда антибиотики.', link: ['#diseases', 'Раздел «Болезни»'] },
    police: { t: 'Полицейский участок', i: '🚓', d: 'Пистолеты, патроны, дубинки, полицейская одежда. Хороший первый ствол для новичка.', link: ['#weapons/cr75', 'Карточка: CR-75'] },
    hunting: { t: 'Охотничья вышка', i: '🦌', d: 'Вышки стоят на опушках. Здесь бывают охотничьи винтовки, патроны и камуфляж.', link: ['#weapons/mosin', 'Карточка: Мосина'] },
    spawn: { t: 'Зона спавна', i: '🟢', d: 'Здесь появляются свежие игроки. Значит, вокруг много фрешей и всё уже обыскано. Лучше уходить вглубь материка.', link: ['#first15/fresh-spawn', 'Чек-лист свежего спавна'] }
  };

  let D = null, svg, wrap, sheet, vb, layersOn = {}, selectedRoute = null, onNavigate = null;

  function el(name, attrs, parent) {
    const e = document.createElementNS(NS, name);
    for (const k in attrs) e.setAttribute(k, attrs[k]);
    if (parent) parent.appendChild(e);
    return e;
  }
  const Y = (z) => D.size - z;

  // ---------- построение SVG ----------
  function build() {
    svg = el('svg', { class: 'map-svg', role: 'img', 'aria-label': 'Схема карты Чернаруси' });
    const defs = el('defs', {}, svg);
    defs.innerHTML =
      '<radialGradient id="seaG" cx="80%" cy="90%" r="90%"><stop offset="0" stop-color="#0d2a5c"/><stop offset="1" stop-color="#06122b"/></radialGradient>' +
      '<linearGradient id="landG" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#16263f"/><stop offset="1" stop-color="#112036"/></linearGradient>';
    el('rect', { x: -4000, y: -4000, width: D.size + 8000, height: D.size + 8000, fill: 'url(#seaG)' }, svg);
    const land = el('polygon', { points: D.coast.map((p) => p[0] + ',' + Y(p[1])).join(' '), fill: 'url(#landG)', class: 'land' }, svg);
    void land;
    D.islands.forEach((isl) => el('polygon', { points: isl.map((p) => p[0] + ',' + Y(p[1])).join(' '), fill: 'url(#landG)', class: 'land' }, svg));
    // сетка 1 км
    const grid = el('g', { class: 'grid' }, svg);
    for (let k = 1000; k < D.size; k += 1000) {
      el('line', { x1: k, y1: 0, x2: k, y2: D.size }, grid);
      el('line', { x1: 0, y1: k, x2: D.size, y2: k }, grid);
    }
    el('rect', { x: 0, y: 0, width: D.size, height: D.size, fill: 'none', class: 'border' }, svg);

    // газовые зоны (в реальном масштабе)
    const gGas = el('g', { 'data-layer': 'gas' }, svg);
    D.zones.forEach((z) => {
      el('circle', { cx: z.x, cy: Y(z.z), r: z.r, class: 'gas-area', 'data-id': z.id }, gGas);
      mk(gGas, z.x, z.z, z.id, 'gas', '<circle r="11" class="hit"/><text class="ico" y="5">☣</text>');
    });

    // маршруты
    const gRoutes = el('g', { 'data-layer': 'routes' }, svg);
    D.routes.forEach((r) => {
      const pts = r.wp.map((w) => place(w)).filter(Boolean).map((p) => p.x + ',' + Y(p.z)).join(' ');
      el('polyline', { points: pts, class: 'route ' + r.verdict, 'data-id': r.id }, gRoutes);
    });

    // точки
    const gSpawn = el('g', { 'data-layer': 'spawn' }, svg);
    D.points.spawn.forEach((p, i) => mk(gSpawn, p[0], p[1], 'spawn-' + i, 'spawn', '<circle r="13" class="spawn"/>'));
    const gHunt = el('g', { 'data-layer': 'hunting' }, svg);
    D.points.hunting.forEach((p, i) => mk(gHunt, p[0], p[1], 'hunting-' + i, 'hunting', '<circle r="9" class="hit"/><path d="M0 -5 L4.5 3.5 L-4.5 3.5 Z" class="hunt"/>'));
    const gWater = el('g', { 'data-layer': 'water' }, svg);
    D.points.water.forEach((p, i) => mk(gWater, p[0], p[1], 'water-' + i, 'water', '<circle r="11" class="hit"/><circle r="5" class="water"/>'));
    const gMed = el('g', { 'data-layer': 'medical' }, svg);
    D.points.clinic.forEach((p, i) => mk(gMed, p[0], p[1], 'clinic-' + i, 'clinic', '<circle r="11" class="hit"/><rect x="-5.5" y="-5.5" width="11" height="11" rx="2.5" class="med"/><path d="M0 -3.5V3.5M-3.5 0H3.5" class="cross"/>'));
    D.points.hospital.forEach((p, i) => mk(gMed, p[0], p[1], 'hospital-' + i, 'hospital', '<circle r="13" class="hit"/><rect x="-8" y="-8" width="16" height="16" rx="3.5" class="med big"/><path d="M0 -5V5M-5 0H5" class="cross big"/>'));
    const gPol = el('g', { 'data-layer': 'police' }, svg);
    D.points.police.forEach((p, i) => mk(gPol, p[0], p[1], 'police-' + i, 'police', '<circle r="11" class="hit"/><circle r="7" class="police"/><text class="pl" y="3.5">P</text>'));
    const gMil = el('g', { 'data-layer': 'military' }, svg);
    D.military.forEach((m) => mk(gMil, m.x, m.z, m.id, 'military', '<circle r="13" class="hit"/><path d="M0 -9 L2.6 -2.8 L9 -2.8 L3.8 1.2 L5.8 7.8 L0 3.8 L-5.8 7.8 L-3.8 1.2 L-9 -2.8 L-2.6 -2.8 Z" class="mil"/>'));

    // города
    const gTowns = el('g', { class: 'towns' }, svg);
    D.towns.forEach((t) => {
      const g = mk(gTowns, t.x, t.z, t.id, 'town', (t.big ? '<circle r="3.5" class="tdot"/>' : '<circle r="2.2" class="tdot small"/>') +
        '<text class="tl' + (t.big ? ' big' : '') + '" y="' + (t.big ? -7 : -5) + '">' + esc(t.name) + '</text>');
      g.classList.add(t.big ? 'town-big' : 'town-small');
    });
    applyLayers();
    return svg;
  }

  function mk(parent, x, z, id, kind, inner) {
    const g = el('g', { class: 'mk mk-' + kind, 'data-id': id, style: '--x:' + x + ';--y:' + Y(z) }, parent);
    g.innerHTML = inner;
    return g;
  }

  function place(id) {
    return D.towns.find((t) => t.id === id) || D.military.find((m) => m.id === id) || D.zones.find((z) => z.id === id) || null;
  }

  // ---------- вид (viewBox), зум и перетаскивание ----------
  function setVB(nx, ny, nw) {
    const r = svg.getBoundingClientRect();
    const aspect = (r.height || 1) / (r.width || 1);
    nw = Math.max(700, Math.min(nw, D.size * 1.15));
    const nh = nw * aspect;
    const pad = nw * 0.4;
    const clamp = (v, a, b) => Math.max(Math.min(a, b), Math.min(v, Math.max(a, b)));
    nx = clamp(nx, -pad, D.size - nw + pad);
    ny = clamp(ny, -pad - Math.max(0, nh - D.size), D.size - nh + pad + Math.max(0, nh - D.size));
    vb = { x: nx, y: ny, w: nw, h: nh };
    svg.setAttribute('viewBox', nx + ' ' + ny + ' ' + nw + ' ' + nh);
    const u = nw / (r.width || 1);
    svg.style.setProperty('--u', u);
    svg.classList.toggle('z1', u < 14);
    svg.classList.toggle('z2', u < 6);
  }
  function zoomAt(cx, cy, factor) {
    const r = svg.getBoundingClientRect();
    const gx = vb.x + (cx - r.left) / r.width * vb.w;
    const gy = vb.y + (cy - r.top) / r.height * vb.h;
    const nw = vb.w / factor;
    setVB(gx - (cx - r.left) / r.width * nw, gy - (cy - r.top) / r.height * nw * (vb.h / vb.w), nw);
  }
  function centerOn(x, z, w) {
    const r = svg.getBoundingClientRect();
    const nw = w || vb.w; const nh = nw * (r.height / r.width);
    setVB(x - nw / 2, Y(z) - nh / 2, nw);
  }
  function fitAll() {
    // по умолчанию — юг и восток (там спавн и маршруты новичков)
    const r = svg.getBoundingClientRect();
    const w = 11000; const h = w * (r.height / r.width);
    setVB(4600, Y(1200) - h, w);
  }

  function gestures() {
    const ptrs = new Map();
    let start = null, moved = false, downTarget = null, lastTap = 0;
    svg.addEventListener('pointerdown', (e) => {
      svg.setPointerCapture(e.pointerId);
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      downTarget = e.target;
      moved = false;
      start = snapshot();
    });
    svg.addEventListener('pointermove', (e) => {
      if (!ptrs.has(e.pointerId)) return;
      ptrs.set(e.pointerId, { x: e.clientX, y: e.clientY });
      const r = svg.getBoundingClientRect();
      if (ptrs.size === 1 && start && start.n === 1) {
        const p = [...ptrs.values()][0];
        const dx = p.x - start.cx, dy = p.y - start.cy;
        if (Math.abs(dx) + Math.abs(dy) > 6) moved = true;
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
          const t = downTarget && downTarget.closest && downTarget.closest('[data-id]');
          if (t) select(t.getAttribute('data-id'), true);
          else if (now - lastTap < 320) zoomAt(e.clientX, e.clientY, 2);
          else closeSheet();
          lastTap = now;
        }
        start = null;
      } else start = snapshot();
    };
    svg.addEventListener('pointerup', up);
    svg.addEventListener('pointercancel', up);
    svg.addEventListener('wheel', (e) => { e.preventDefault(); zoomAt(e.clientX, e.clientY, e.deltaY < 0 ? 1.25 : 0.8); }, { passive: false });

    function snapshot() {
      const v = [...ptrs.values()];
      if (v.length >= 2) return { n: 2, vb: { ...vb }, d: Math.hypot(v[0].x - v[1].x, v[0].y - v[1].y) || 1, cx: (v[0].x + v[1].x) / 2, cy: (v[0].y + v[1].y) / 2 };
      if (v.length === 1) return { n: 1, vb: { ...vb }, cx: v[0].x, cy: v[0].y };
      return null;
    }
  }

  // ---------- слои ----------
  function applyLayers() {
    svg.querySelectorAll('[data-layer]').forEach((g) => { g.style.display = layersOn[g.getAttribute('data-layer')] ? '' : 'none'; });
    svg.classList.toggle('show-routes', !!layersOn.routes);
  }

  // ---------- выбор объекта и нижняя панель ----------
  function nearCount(x, z, list, r) { return list.filter((p) => Math.hypot(p[0] - x, p[1] - z) <= r).length; }

  function select(id, fromTap) {
    svg.querySelectorAll('.sel').forEach((n) => n.classList.remove('sel'));
    const node = svg.querySelector('.mk[data-id="' + CSS.escape(id) + '"], .route[data-id="' + CSS.escape(id) + '"]');
    if (node) node.classList.add('sel');
    let html = '', focus = null;
    const kind = id.split('-')[0];
    if (kind === 'r') {
      const r = D.routes.find((x) => x.id === id);
      if (!r) return;
      selectRoute(id);
      html = routeHTML(r, true);
    } else if (kind === 't') {
      const t = D.towns.find((x) => x.id === id);
      if (!t) return;
      focus = t;
      const w = nearCount(t.x, t.z, D.points.water, 700), m = nearCount(t.x, t.z, D.points.hospital.concat(D.points.clinic), 900),
        p = nearCount(t.x, t.z, D.points.police, 900), s = nearCount(t.x, t.z, D.points.spawn, 1500);
      html = head('📍', t.name, t.en) + '<div class="ms-stats">' +
        '<span>💧 колонок рядом: <b>' + w + '</b></span><span>✚ медицина: <b>' + m + '</b></span><span>🚓 полиция: <b>' + p + '</b></span></div>' +
        (s ? '<p class="ms-warn">Рядом зона спавна: здесь много свежих игроков.</p>' : '');
    } else if (kind === 'm') {
      const m = D.military.find((x) => x.id === id);
      if (!m) return;
      focus = m;
      html = head('🎖️', m.name) + '<p>' + esc(m.info) + '</p>' + link('#weapons/kam', 'Раздел «Оружие»');
    } else if (kind === 'z') {
      const z = D.zones.find((x) => x.id === id);
      if (!z) return;
      focus = z;
      html = head('☣️', z.name) + '<p>Постоянная зона токсичного газа (радиус около ' + z.r + ' м). Без противогаза с фильтром и полного костюма ОЗК — смерть за пару минут.</p>' + link('#diseases/gas-poisoning', 'Карточка: химическое отравление');
    } else {
      const idx = +id.split('-')[1];
      const list = D.points[kind];
      const p = list && list[idx];
      if (!p || !INFO[kind]) return;
      focus = { x: p[0], z: p[1] };
      const inf = INFO[kind];
      html = head(inf.i, inf.t, 'рядом: ' + p[2]) + '<p>' + esc(inf.d) + '</p>' + link(inf.link[0], inf.link[1]);
    }
    html += '<div class="ms-actions"><button class="btn" data-mshare="' + esc(id) + '">Поделиться</button></div>';
    openSheet(html);
    if (focus && !fromTap) centerOn(focus.x, focus.z, Math.min(vb.w, 4000));
    if (onNavigate) onNavigate(id);
  }

  function head(icon, title, sub) {
    return '<div class="ms-head"><span class="ms-ico">' + icon + '</span><div><div class="ms-title">' + esc(title) + '</div>' +
      (sub ? '<div class="ms-sub">' + esc(sub) + '</div>' : '') + '</div></div>';
  }
  function link(href, text) { return '<a class="btn ms-link" href="' + href + '">' + esc(text) + ' →</a>'; }

  function routeHTML(r, inSheet) {
    const s = r.stats;
    const good = r.verdict === 'good';
    return (inSheet ? head(good ? '✅' : '❌', r.title, good ? 'Хороший маршрут' : 'Ошибка новичка') : '') +
      (inSheet ? '' : '<p>' + esc(r.summary) + '</p>') +
      '<div class="ms-stats">' +
      '<span>📏 <b>' + s.km + '</b> км</span>' +
      '<span>💧 колонок: <b>' + s.water + '</b></span>' +
      '<span>✚ медицина: <b>' + s.medical + '</b></span>' +
      '<span>🚓 полиция: <b>' + s.police + '</b></span>' +
      (s.gas ? '<span class="bad">☣️ газовая зона!</span>' : '') +
      (s.military.length ? '<span class="warn">🎖️ ' + esc(s.military.join(', ')) + '</span>' : '') +
      '</div>' + (inSheet ? '' : '<ul class="ms-why">' + r.why.map((w) => '<li>' + esc(w) + '</li>').join('') + '</ul>');
  }

  function selectRoute(id) {
    selectedRoute = id;
    svg.classList.add('has-sel-route');
    svg.querySelectorAll('.route').forEach((n) => n.classList.toggle('sel', n.getAttribute('data-id') === id));
    const r = D.routes.find((x) => x.id === id);
    const pts = r.wp.map(place).filter(Boolean);
    const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
    const minx = Math.min(...xs), maxx = Math.max(...xs), minz = Math.min(...zs), maxz = Math.max(...zs);
    const rr = svg.getBoundingClientRect(); const aspect = rr.height / rr.width;
    // маршрут должен поместиться в верхнюю половину карты: нижнюю закрывает панель
    const w = Math.max((maxx - minx) * 1.3, (maxz - minz) * 1.25 / (aspect * 0.5), 3000);
    const h = w * aspect;
    setVB((minx + maxx) / 2 - w / 2, Y((minz + maxz) / 2) - h * 0.27, w);
  }

  function openSheet(html) {
    sheet.innerHTML = '<button class="ms-close" aria-label="Закрыть">×</button>' + html;
    sheet.hidden = false;
    sheet.querySelector('.ms-close').addEventListener('click', closeSheet);
    const sh = sheet.querySelector('[data-mshare]');
    if (sh) sh.addEventListener('click', () => share(sh.getAttribute('data-mshare')));
  }
  function closeSheet() {
    if (!sheet) return;
    sheet.hidden = true;
    svg.querySelectorAll('.sel').forEach((n) => n.classList.remove('sel'));
    svg.classList.remove('has-sel-route');
    selectedRoute = null;
    if (onNavigate) onNavigate(null);
  }
  async function share(id) {
    const url = location.href.split('#')[0] + '#map/' + id;
    try { if (navigator.share) { await navigator.share({ title: 'Карта DayZ — DayZ Guide', url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); window.dzToast && window.dzToast('Ссылка скопирована'); } catch (e) { prompt('Скопируй ссылку:', url); }
  }

  // ---------- публичный API ----------
  window.DZMap = {
    LAYERS,
    routeHTML: (r) => routeHTML(r, false),
    mount(container, data, focusId, navCb) {
      D = data; onNavigate = navCb || null;
      if (!Object.keys(layersOn).length) LAYERS.forEach((l) => { layersOn[l.id] = l.on; });
      wrap = container.querySelector('.map-wrap');
      sheet = container.querySelector('.map-sheet');
      wrap.insertBefore(build(), wrap.firstChild);
      gestures();
      // кнопки
      container.querySelectorAll('[data-layer-toggle]').forEach((b) => {
        const id = b.getAttribute('data-layer-toggle');
        b.classList.toggle('on', !!layersOn[id]);
        b.addEventListener('click', () => { layersOn[id] = !layersOn[id]; b.classList.toggle('on', layersOn[id]); applyLayers(); });
      });
      container.querySelector('[data-zoom="in"]').addEventListener('click', () => { const r = svg.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1.6); });
      container.querySelector('[data-zoom="out"]').addEventListener('click', () => { const r = svg.getBoundingClientRect(); zoomAt(r.left + r.width / 2, r.top + r.height / 2, 1 / 1.6); });
      container.querySelector('[data-zoom="fit"]').addEventListener('click', () => { closeSheet(); fitAll(); });
      requestAnimationFrame(() => {
        fitAll();
        if (focusId) select(focusId, false);
      });
      window.addEventListener('resize', onResize);
    },
    select(id) {
      if (!svg) return;
      const top = wrap.getBoundingClientRect().top + window.scrollY - (document.getElementById('topbar').offsetHeight || 0) - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => select(id, false), 350);
    },
    unmount() { window.removeEventListener('resize', onResize); svg = null; }
  };
  function onResize() { if (svg && vb) setVB(vb.x, vb.y, vb.w); }
})();
