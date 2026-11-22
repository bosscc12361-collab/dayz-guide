/* Навигатор: ищет путь по сетке проходимости (data/map-grid.json) и предлагает варианты.
   Координаты — метры игры (x — восток, z — север). */
(function () {
  'use strict';
  let N = 0, cell = 24, cls = null, SIZE = 15360;
  function load(d) {
    N = d.n; cell = SIZE / N; cls = new Uint8Array(N * N);
    const s = atob(d.g);
    for (let i = 0; i < cls.length; i++) cls[i] = (s.charCodeAt(i >> 2) >> ((i & 3) * 2)) & 3;
  }
  const toCell = (p) => [Math.max(0, Math.min(N - 1, Math.floor(p.x / cell))), Math.max(0, Math.min(N - 1, Math.floor((SIZE - p.z) / cell)))];
  // ближайшая клетка суши
  function land(p) {
    const [cx, cy] = toCell(p);
    for (let r = 0; r < 40; r++) for (let dy = -r; dy <= r; dy++) for (let dx = -r; dx <= r; dx++) {
      if (Math.max(Math.abs(dx), Math.abs(dy)) !== r) continue;
      const x = cx + dx, y = cy + dy;
      if (x >= 0 && y >= 0 && x < N && y < N && cls[y * N + x] !== 3) return y * N + x;
    }
    return cy * N + cx;
  }
  // цена клеток: base — [поле, дорога, лес, море], zones — [{x,z,r,k}] дорожат местность вокруг
  function costs(base, zones) {
    const c = new Float32Array(N * N);
    for (let i = 0; i < c.length; i++) c[i] = base[cls[i]];
    (zones || []).forEach((q) => {
      const R = q.r / cell, cx = q.x / cell, cy = (SIZE - q.z) / cell;
      for (let y = Math.max(0, Math.floor(cy - R)); y <= Math.min(N - 1, Math.ceil(cy + R)); y++)
        for (let x = Math.max(0, Math.floor(cx - R)); x <= Math.min(N - 1, Math.ceil(cx + R)); x++)
          if ((x + 0.5 - cx) ** 2 + (y + 0.5 - cy) ** 2 <= R * R) c[y * N + x] *= q.k;
    });
    return c;
  }
  // A* с двоичной кучей
  function astar(a, b, c, minC) {
    const M = N * N, g = new Float32Array(M).fill(Infinity), from = new Int32Array(M).fill(-1), done = new Uint8Array(M);
    const bx = b % N, by = (b / N) | 0, heap = [], f = new Float32Array(M);
    const h = (i) => { const dx = Math.abs((i % N) - bx), dy = Math.abs(((i / N) | 0) - by); return (Math.max(dx, dy) + 0.4142 * Math.min(dx, dy)) * minC; };
    const push = (i) => { let k = heap.push(i) - 1; while (k > 0) { const p = (k - 1) >> 1; if (f[heap[p]] <= f[i]) break; heap[k] = heap[p]; k = p; } heap[k] = i; };
    const pop = () => {
      const top = heap[0], last = heap.pop();
      if (heap.length) { let k = 0; for (;;) { let l = 2 * k + 1; if (l >= heap.length) break; if (l + 1 < heap.length && f[heap[l + 1]] < f[heap[l]]) l++; if (f[heap[l]] >= f[last]) break; heap[k] = heap[l]; k = l; } heap[k] = last; }
      return top;
    };
    g[a] = 0; f[a] = h(a); push(a);
    while (heap.length) {
      const i = pop(); if (i === b) break; if (done[i]) continue; done[i] = 1;
      const x = i % N, y = (i / N) | 0;
      for (let dy = -1; dy <= 1; dy++) for (let dx = -1; dx <= 1; dx++) {
        if (!dx && !dy) continue;
        const u = x + dx, v = y + dy; if (u < 0 || v < 0 || u >= N || v >= N) continue;
        const j = v * N + u; if (done[j] || c[j] === Infinity) continue;
        const ng = g[i] + (c[i] + c[j]) / 2 * (dx && dy ? 1.4142 : 1);
        if (ng < g[j]) { g[j] = ng; from[j] = i; f[j] = ng + h(j); push(j); }
      }
    }
    if (from[b] < 0 && a !== b) return null;
    const out = [b]; let i = b; while (i !== a) { i = from[i]; out.push(i); }
    return out.reverse();
  }
  function rdp(p, e) {
    if (p.length < 3) return p;
    const a = p[0], b = p[p.length - 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]); let m = 0, k = 0;
    for (let i = 1; i < p.length - 1; i++) { const d = L ? Math.abs((b[0] - a[0]) * (a[1] - p[i][1]) - (a[0] - p[i][0]) * (b[1] - a[1])) / L : Math.hypot(p[i][0] - a[0], p[i][1] - a[1]); if (d > m) { m = d; k = i; } }
    return m > e ? rdp(p.slice(0, k + 1), e).slice(0, -1).concat(rdp(p.slice(k), e)) : [a, b];
  }
  function smooth(p) {
    const a = p.map((_, i) => { const s = p.slice(Math.max(0, i - 1), i + 2); return [s.reduce((t, q) => t + q[0], 0) / s.length, s.reduce((t, q) => t + q[1], 0) / s.length]; });
    a[0] = p[0]; a[a.length - 1] = p[p.length - 1];
    return rdp(a, 9).map((q) => [Math.round(q[0]), Math.round(q[1])]);
  }
  // путь через точки; null — нет дороги по суше
  function path(pts, c, minC) {
    let cells = [];
    for (let i = 1; i < pts.length; i++) {
      const p = astar(land(pts[i - 1]), land(pts[i]), c, minC);
      if (!p) return null;
      cells = cells.concat(cells.length ? p.slice(1) : p);
    }
    return smooth(cells.map((i) => [((i % N) + 0.5) * cell, SIZE - (((i / N) | 0) + 0.5) * cell]));
  }
  const len = (p) => { let t = 0; for (let i = 1; i < p.length; i++) t += Math.hypot(p[i][0] - p[i - 1][0], p[i][1] - p[i - 1][1]); return t; };
  function near(p, x, z) {
    let b = Infinity, at = 0, acc = 0;
    for (let i = 1; i < p.length; i++) {
      const ax = p[i - 1][0], az = p[i - 1][1], dx = p[i][0] - ax, dz = p[i][1] - az, L = dx * dx + dz * dz;
      const t = L ? Math.max(0, Math.min(1, ((x - ax) * dx + (z - az) * dz) / L)) : 0, d = Math.hypot(x - ax - t * dx, z - az - t * dz);
      if (d < b) { b = d; at = acc + Math.sqrt(L) * t; }
      acc += Math.sqrt(L);
    }
    return { d: b, at };
  }
  // доля одинакового пути
  function same(a, b) { const s = a.filter((q) => near(b, q[0], q[1]).d < 90).length; return s / a.length; }

  /* env: { towns, water, medical, police, shops, spawn, dangers:[{x,z,r,name,kind}], tierAt } */
  function plan(from, to, env) {
    const dir = Math.hypot(from.x - to.x, from.z - to.z);
    const inside = (q, p) => Math.hypot(q.x - p.x, q.z - p.z) <= q.r + 160;
    const zones = env.dangers.map((q) => ({ x: q.x, z: q.z, r: q.r + 120, k: inside(q, from) || inside(q, to) ? 2 : q.kind === 'gas' ? 40 : 9 }));
    const crowd = env.spawn.map((q) => ({ x: q[0], z: q[1], r: 650, k: 1.5 })).concat(env.towns.filter((t) => t.big).map((t) => ({ x: t.x, z: t.z, r: 420, k: 1.7 })));
    const SEA = Infinity;
    const out = [];
    const add = (id, icon, title, note, p, stops) => { if (p && p.length > 1) out.push({ id, icon, title, note, path: p, stops: stops || [] }); };
    let swim = false;
    const gas = zones.filter((q, i) => env.dangers[i].kind === 'gas');
    let cFast = costs([1.0, 0.95, 1.06, SEA], gas);
    let fast = path([from, to], cFast, 0.95);
    if (!fast) { swim = true; cFast = costs([1.0, 0.95, 1.06, 6], gas); fast = path([from, to], cFast, 0.95); }
    const sea = swim ? 6 : SEA;
    const cSafe = costs([1.3, 1.1, 1.0, sea], zones.concat(crowd));
    add('safe', '🛡️', 'Безопасный', 'Обходит военку, газ, большие города и спавн, чаще идёт лесом.', path([from, to], cSafe, 1.0));
    add('fast', '⚡', 'Быстрый', 'Почти по прямой и по дорогам. Газ обходит, военку — нет.', fast);
    // с остановками для лута
    if (dir > 1500) {
      const cand = env.towns.filter((t) => Math.hypot(t.x - from.x, t.z - from.z) > 600 && Math.hypot(t.x - to.x, t.z - to.z) > 600 &&
        !env.dangers.some((q) => Math.hypot(q.x - t.x, q.z - t.z) < q.r + 100) && !(t.big && env.spawn.some((q) => Math.hypot(q[0] - t.x, q[1] - t.z) < 1500)));
      const cnt = (list, t, r) => list.filter((q) => Math.hypot(q[0] - t.x, q[1] - t.z) < r).length;
      const rated = cand.map((t) => {
        const det = Math.hypot(t.x - from.x, t.z - from.z) + Math.hypot(t.x - to.x, t.z - to.z) - dir;
        const sc = Math.min(2, cnt(env.police, t, 450)) * 2 + Math.min(2, cnt(env.medical, t, 450)) * 2 + Math.min(1, cnt(env.water, t, 400)) + Math.min(2, cnt(env.shops, t, 350)) * 0.7;
        return { t, det, sc: sc - det / 350, pr: ((t.x - from.x) * (to.x - from.x) + (t.z - from.z) * (to.z - from.z)) / (dir * dir) };
      }).filter((q) => q.sc > 0.6 && q.det < Math.max(700, dir * 0.3) && q.pr > 0.05 && q.pr < 0.95).sort((a, b) => b.sc - a.sc);
      const pick = [];
      rated.forEach((q) => { if (pick.length < 3 && pick.every((w) => Math.hypot(w.t.x - q.t.x, w.t.z - q.t.z) > 800)) pick.push(q); });
      pick.sort((a, b) => a.pr - b.pr);
      if (pick.length) {
        const c = costs([1.1, 1.0, 1.1, sea], zones);
        add('loot', '🎒', 'С лутом', 'Через деревни с водой, медициной, полицией и магазинами.', path([from].concat(pick.map((q) => q.t), [to]), c, 1.0), pick.map((q) => ({ x: q.t.x, z: q.t.z, name: q.t.name })));
      }
    }
    const L0 = fast ? len(fast) : 0;
    const uniq = [];
    out.forEach((r) => {
      const twin = uniq.find((u) => Math.abs(len(u.path) - len(r.path)) < len(r.path) * 0.06 && same(r.path, u.path) > 0.85 && same(u.path, r.path) > 0.85);
      if (!twin) { uniq.push(r); return; }
      if (r.id === 'fast') { twin.title += ' и быстрый'; twin.note = 'Здесь самый безопасный путь — он же и быстрый.'; }
      if (r.id === 'loot') twin.stops = r.stops;
    });
    uniq.forEach((r) => {
      const p = r.path, cnt = (list, R) => list.filter((q) => near(p, q[0], q[1]).d <= R).length;
      r.km = len(p) / 1000; r.min = Math.max(1, Math.round(len(p) / 4 / 60)); r.more = Math.round((len(p) - L0) / 1000 * 10) / 10; r.swim = swim;
      r.water = cnt(env.water, 250); r.medical = cnt(env.medical, 300); r.police = cnt(env.police, 300); r.shops = cnt(env.shops, 250);
      r.dangers = env.dangers.map((q) => ({ q, n: near(p, q.x, q.z) })).filter((o) => o.n.d <= o.q.r).sort((a, b) => a.n.at - b.n.at).map((o) => o.q);
      r.spawns = cnt(env.spawn, 400);
      r.via = env.towns.map((t) => ({ t, n: near(p, t.x, t.z) })).filter((o) => o.n.d <= 320 && o.n.at > 350 && o.n.at < len(p) - 350).sort((a, b) => a.n.at - b.n.at).map((o) => ({ x: o.t.x, z: o.t.z, name: o.t.name, big: o.t.big, at: o.n.at }));
      r.t0 = env.tierAt(from.x, from.z); r.t1 = env.tierAt(to.x, to.z);
    });
    return uniq;
  }
  window.DZNav = { load, plan, ready: () => !!cls, len };
})();
