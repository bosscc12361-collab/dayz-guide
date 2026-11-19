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
    { id: 'military', title: 'Военные', icon: '🎖️', on: true },
    { id: 'gas', title: 'Газ', icon: '☣️', on: true },
    { id: 'spawn', title: 'Спавн', icon: '🟢', on: true },
    { id: 'routes', title: 'Маршруты', icon: '🧭', on: true },
    { id: 'tiers', title: 'Зоны лута', icon: '🎯', on: false },
    { id: 'hunting', title: 'Вышки', icon: '🦌', on: false }
  ];
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
    spawn: { t: 'Зона спавна', i: '🟢', d: 'Здесь появляются свежие игроки. Вокруг много фрешей, и всё уже обыскано — уходи вглубь.', link: ['#first15/fresh-spawn', 'Чек-лист спавна'] }
  };

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

  // ---------- SVG: метки, подписи, маршруты ----------
  function buildSVG() {
    svg = el('svg', { class: 'map-svg', role: 'img', 'aria-label': 'Схема карты Чернаруси' });

    const gRoutes = el('g', { 'data-layer': 'routes' }, svg);
    D.routes.forEach((r) => {
      const pts = r.wp.map(place).filter(Boolean).map((p) => p.x + ',' + Y(p.z)).join(' ');
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

    const gTowns = el('g', { class: 'towns' }, svg);
    D.towns.forEach((t) => {
      const node = mk(gTowns, t.x, t.z, t.id, 'town', '<circle r="10" class="hit"/><circle r="' + (t.big ? 3.5 : 2.4) + '" class="tdot' + (t.big ? '' : ' small') + '"/>' +
        '<text class="tl' + (t.big ? ' big' : '') + '" y="' + (t.big ? -8 : -6) + '">' + esc(t.name) + '</text>');
      node.classList.add(t.big ? 'town-big' : 'town-small');
    });
    applyLayers();
  }

  function mk(parent, x, z, id, kind, inner, extraStyle) {
    const attrs = { class: 'mk mk-' + kind, style: '--x:' + x + ';--y:' + Y(z) + (extraStyle || '') };
    if (id) attrs['data-id'] = id;
    const g = el('g', attrs, parent);
    g.innerHTML = inner;
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
      ctx.drawImage(bg, sx(b.x0), sy(b.z1), (b.x1 - b.x0) * k, (b.z1 - b.z0) * k);
      ctx.globalAlpha = 1;
    } else {
      const poly = (pts) => { ctx.beginPath(); pts.forEach((p, i) => (i ? ctx.lineTo(sx(p[0]), sy(p[1])) : ctx.moveTo(sx(p[0]), sy(p[1])))); ctx.closePath(); };
      ctx.fillStyle = '#132339'; ctx.strokeStyle = '#3b6fb8'; ctx.lineWidth = 1.5 * dpr;
      poly(D.coast); ctx.fill(); ctx.stroke();
      D.islands.forEach((isl) => { poly(isl); ctx.fill(); ctx.stroke(); });
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

    // здания (по точкам лута из официальных данных)
    if (layersOn.buildings && B) {
      const minPx = 2.2 * dpr;
      const x0 = vb.x - 80, x1 = vb.x + vb.w + 80, y0 = vb.y - 80, y1 = vb.y + vb.h + 80;
      const zoomed = k > 0.12 * dpr;
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
        ctx.globalAlpha = .9;
        ctx.fillRect(ty[4] * k - w / 2, -ty[5] * k - h / 2, w, h);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    }
  }
  function requestDraw() { if (!raf) raf = requestAnimationFrame(draw); }

  // ---------- вид, масштаб ----------
  function setVB(nx, ny, nw) {
    const r = wrap.getBoundingClientRect();
    const aspect = (r.height || 1) / (r.width || 1);
    nw = Math.max(500, Math.min(nw, D.size * 1.15));
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
    requestDraw();
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
    const w = 11000, h = w * (r.height / r.width);
    setVB(4600, Y(1200) - h, w);
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
          if (t) select(t.getAttribute('data-id'), true);
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

  function applyLayers() {
    svg.querySelectorAll('[data-layer]').forEach((g) => { g.style.display = layersOn[g.getAttribute('data-layer')] ? '' : 'none'; });
    requestDraw();
  }

  // ---------- описание объекта ----------
  const nearCount = (x, z, list, r) => list.filter((p) => Math.hypot(p[0] - x, p[1] - z) <= r).length;
  function info(id) {
    const kind = id.split('-')[0];
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
        '<button class="tip-btn ghost" data-share="' + esc(d.share) + '">Поделиться</button></div>' : '');
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
    for (let i = 0; i < pts.length - 1; i++) {
      const a = pts[i], b = pts[i + 1];
      const ang = Math.atan2(Y(b.z) - Y(a.z), b.x - a.x) * 180 / Math.PI;
      mk(deco, a.x + (b.x - a.x) * 0.5, a.z + (b.z - a.z) * 0.5, '', 'arrow ' + col, '<path d="M-6 -6 L6 0 L-6 6 Z" class="arrow-p"/>', ';--r:' + ang + 'deg');
    }
    pts.forEach((p, i) => {
      if (i === 0) mk(deco, p.x, p.z, '', 'flag', '<circle r="11" class="flag-c start"/><path d="M-3 -5 L5 0 L-3 5 Z" fill="#fff"/><text class="flag-t" y="-17">СТАРТ</text>');
      else if (i === pts.length - 1) mk(deco, p.x, p.z, '', 'flag', '<circle r="12" class="flag-c ' + col + '"/><text class="ico" y="5">🏁</text><text class="flag-t" y="-18">ФИНИШ</text>');
      else mk(deco, p.x, p.z, '', 'wp', '<circle r="8" class="wp-c ' + col + '"/><text class="wp-t" y="3.5">' + i + '</text>');
    });
    // весь маршрут — в видимой части (снизу свёрнутая панель)
    const xs = pts.map((p) => p.x), zs = pts.map((p) => p.z);
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
    try { if (navigator.share) { await navigator.share({ title: 'Карта DayZ — DayZ Guide', url }); return; } } catch (e) { if (e && e.name === 'AbortError') return; }
    try { await navigator.clipboard.writeText(url); window.dzToast && window.dzToast('Ссылка скопирована'); } catch (e) { prompt('Скопируй ссылку:', url); }
  }

  function legendHTML() {
    const b = (c, t) => '<span class="lg-b" style="background:' + c + '"></span>' + t;
    return '<button class="tip-close" aria-label="Закрыть">×</button><div class="lg-title">Значки</div><div class="lg-grid">' +
      '<div><span class="lg-i lg-water"></span>Колонка с водой</div><div><span class="lg-i lg-med">✚</span>Больница / медпункт</div>' +
      '<div><span class="lg-i lg-pol">P</span>Полиция</div><div><span class="lg-i lg-mil">★</span>Военка / аэродром</div>' +
      '<div><span class="lg-i">☣</span>Газовая зона</div><div><span class="lg-i lg-spawn"></span>Зона спавна</div>' +
      '<div><span class="lg-i lg-hunt">▲</span>Охотничья вышка</div><div><span class="lg-i">🏁</span>Финиш маршрута</div></div>' +
      '<div class="lg-title">Зоны лута (слой 🎯)</div><div class="lg-grid">' +
      [1, 2, 3, 4].map((t) => '<div>' + b(TSOLID[t], 'Tier ' + t) + '</div>').join('') + '</div>' +
      '<p class="lg-note">Чем дальше от побережья на северо-запад, тем выше тир и лучше лут. Дорог на схеме пока нет.</p>';
  }

  // ---------- публичный API ----------
  window.DZMap = {
    LAYERS, routeHTML, lootHTML,
    mount(container, data, buildings, focusId, navCb) {
      D = data; B = buildings; onNavigate = navCb || null;
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
      setTimeout(() => {
        resizeCanvas(); fitAll();
        if (focusId) select(focusId, false);
      }, 0);
      window.addEventListener('resize', onResize);
    },
    setBuildings(b) { B = b; requestDraw(); },
    select(id) {
      if (!svg) return;
      const top = wrap.getBoundingClientRect().top + window.scrollY - (document.getElementById('topbar').offsetHeight || 0) - 8;
      window.scrollTo({ top, behavior: 'smooth' });
      setTimeout(() => select(id, false), 350);
    }
  };
  function onResize() { if (svg && vb && wrap.isConnected) { resizeCanvas(); setVB(vb.x, vb.y, vb.w); } }
})();
