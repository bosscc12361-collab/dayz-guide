/* DayZ Guide — vanilla JS, без сборки.
   Данные лежат в /data/*.json, список разделов — в data/meta.json. */
(function () {
  'use strict';

  // ---------- безопасное хранилище ----------
  const store = {
    get(key, fallback) {
      try {
        const v = localStorage.getItem(key);
        return v === null ? fallback : JSON.parse(v);
      } catch (e) { return fallback; }
    },
    set(key, value) {
      try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* приватный режим и т.п. */ }
    }
  };

  const FAV_KEY = 'dz_favs';
  const $view = document.getElementById('view');
  const $title = document.getElementById('pageTitle');
  const $back = document.getElementById('backBtn');
  const $toast = document.getElementById('toast');

  const state = {
    meta: null,
    sections: [],          // [{...meta section, items: []}]
    byId: {},              // id раздела -> раздел
    favs: new Set(store.get(FAV_KEY, [])),
    scroll: {},
    lastHash: null,
    navDepth: 0,
    stack: [location.hash || '#']
  };
  function replaceHash(h) {
    history.replaceState(null, '', h);
    state.lastHash = h;
    state.stack[state.stack.length - 1] = h;
  }

  // ---------- утилиты ----------
  const esc = (s) => String(s == null ? '' : s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');

  // Мини-разметка: **жирный**, строки с "- " = список, пустая строка = новый абзац.
  function md(text) {
    if (Array.isArray(text)) return list(text);
    const lines = esc(text).split('\n');
    let html = '', inList = false, para = [];
    const flush = () => { if (para.length) { html += '<p>' + para.join('<br>') + '</p>'; para = []; } };
    for (const raw of lines) {
      const line = raw.trim();
      if (/^[-•]\s+/.test(line)) {
        flush();
        if (!inList) { html += '<ul>'; inList = true; }
        html += '<li>' + line.replace(/^[-•]\s+/, '') + '</li>';
      } else {
        if (inList) { html += '</ul>'; inList = false; }
        if (line === '') flush(); else para.push(line);
      }
    }
    flush();
    if (inList) html += '</ul>';
    return html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  }
  function list(arr) {
    return '<ul>' + arr.map((x) => '<li>' + md(String(x)).replace(/^<p>|<\/p>$/g, '') + '</li>').join('') + '</ul>';
  }

  // нормализация для поиска: регистр, ё/е, кириллическая «х» в калибрах (9х19 = 9x19)
  const norm = (s) => String(s || '').toLowerCase()
    .replace(/ё/g, 'е').replace(/х/g, 'x').replace(/×/g, 'x')
    .replace(/[«»"'(),.;:!?]/g, ' ').replace(/\s+/g, ' ').trim();

  const ICONS = {
    star: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.3-4.1 5.9-.9z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    chev: '<svg class="chev" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 5l7 7-7 7" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    search: '<svg class="s-ico" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="7" fill="none" stroke="currentColor" stroke-width="2"/><path d="M16.5 16.5L21 21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>',
    book: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5zM4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/></svg>',
    ext: '<svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true" style="opacity:.6"><path d="M14 4h6v6M20 4l-9 9M18 14v5a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V7a1 1 0 0 1 1-1h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>',
    share: '<svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true"><path d="M12 15V3M7.5 7.5L12 3l4.5 4.5M5 12v7a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>'
  };

  const BOLT = '<svg class="bolt" viewBox="0 0 120 150" aria-hidden="true"><path d="M74 4L22 84h32L38 146l62-88H66L84 4z" fill="#eaf4ff" stroke="#5fb0ff" stroke-width="3" stroke-linejoin="round"/></svg>';

  const SOCIAL_ICONS = {
    telegram: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M21.5 4.3L2.9 11.5c-1.3.5-1.2 1.3-.2 1.6l4.7 1.5 1.8 5.6c.2.6.4.8.9.8.4 0 .6-.2.9-.4l2.3-2.2 4.7 3.5c.9.5 1.5.2 1.7-.8l3.1-14.6c.3-1.3-.5-1.8-1.3-1.2zM8.3 14.2l9.9-6.3c.5-.3.9-.1.5.2l-8.2 7.4-.3 3.3-1.9-4.6z" fill="#5fb0ff"/></svg>',
    youtube: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M22 8.2a3 3 0 0 0-2.1-2.1C18 5.6 12 5.6 12 5.6s-6 0-7.9.5A3 3 0 0 0 2 8.2 31 31 0 0 0 1.6 12 31 31 0 0 0 2 15.8a3 3 0 0 0 2.1 2.1c1.9.5 7.9.5 7.9.5s6 0 7.9-.5a3 3 0 0 0 2.1-2.1c.4-1.2.4-3.8.4-3.8s0-2.6-.4-3.8z" fill="#ffffff"/><path d="M10 15.2l5.2-3.2L10 8.8z" fill="#2f7bff"/></svg>',
    tiktok: '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M16.6 3c.3 2.3 1.7 3.8 4 4v3.1c-1.5.1-2.8-.4-4-1.2v5.9c0 3.7-3 6.2-6.4 5.6-2.6-.5-4.5-2.8-4.4-5.5.2-3.2 3.2-5.6 6.5-5v3.2c-1.6-.5-3.3.5-3.4 2.1-.1 1.5 1.1 2.6 2.5 2.5 1.3 0 2.2-1 2.2-2.4V3z" fill="#ffffff"/></svg>'
  };
  function socialsHTML(noHeader) {
    const list = (state.meta && state.meta.socials) || [];
    if (!list.length) return '';
    return (noHeader ? '' : '<div class="h-section">⚡ ' + esc(state.meta.author || 'Автор') + ' в соцсетях</div>') +
      '<div class="socials">' + list.map((x) =>
        '<a class="social ' + (x.id === 'telegram' ? 'tg' : '') + '" href="' + esc(x.url) + '" target="_blank" rel="noopener">' +
        (SOCIAL_ICONS[x.id] || '') + '<span>' + esc(x.title) + '</span><small>' + esc(x.handle || '') + '</small></a>').join('') +
      '</div>';
  }

  // Картинка карточки: "image": "img/rags.jpg" или { "src": "img/rags.jpg", "caption": "Скриншот: STROM" }
  function img(it) {
    if (!it.image) return null;
    const o = typeof it.image === 'string' ? { src: it.image } : it.image;
    return o && o.src ? o : null;
  }

  let toastTimer;
  window.dzToast = (m) => toast(m);
  function toast(msg) {
    $toast.textContent = msg;
    $toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => $toast.classList.remove('show'), 1800);
  }

  // ---------- загрузка данных ----------
  async function getJSON(url) {
    const r = await fetch(url, { cache: 'no-cache' });
    if (!r.ok) throw new Error(url + ': ' + r.status);
    return r.json();
  }

  async function load() {
    state.meta = await getJSON('data/meta.json');
    const results = await Promise.all(state.meta.sections.map(async (sec) => {
      try {
        const data = await getJSON('data/' + sec.file);
        const items = Array.isArray(data) ? data : (data.items || []);
        return { ...sec, items };
      } catch (e) {
        console.error('Не удалось загрузить', sec.file, e);
        return { ...sec, items: [], error: String(e.message || e) };
      }
    }));
    state.sections = results;
    state.byId = {};
    for (const s of results) {
      state.byId[s.id] = s;
      for (const it of s.items) it._search = buildSearchText(s, it);
    }
    // карта Чернаруси: населённые пункты тоже ищутся через поиск
    try {
      state.map = await getJSON('data/map.json');
      const sec = { id: 'map', title: 'Карта', icon: '🗺️', fields: [], items: [] };
      sec.items = state.map.towns.map((t) => ({ id: t.id, title: t.name, title_en: t.en, summary: t.big ? 'Город на карте Чернаруси' : 'Деревня на карте Чернаруси', tags: ['карта', 'город'] }))
        .concat(state.map.military.map((m) => ({ id: m.id, title: m.name, summary: 'Военный объект на карте', tags: ['карта', 'военка', 'военная база'] })))
        .concat(state.map.routes.map((r) => ({ id: r.id, title: r.title, summary: (r.verdict === 'good' ? '✅ Хороший маршрут: ' : '❌ Ошибка новичка: ') + r.summary, tags: ['маршрут', 'карта'] })));
      sec.items.forEach((it) => { it._search = norm([it.title, it.title_en, it.summary, it.tags.join(' ')].join(' ')); });
      state.mapSec = sec;
      state.byId.map = sec;
    } catch (e) { console.warn('Карта не загрузилась', e); }
    try { state.symptoms = await getJSON('data/symptoms.json'); } catch (e) { console.warn('symptoms', e); }
    try { state.patches = await getJSON('data/patches.json'); } catch (e) { console.warn('patches', e); }
  }

  function buildSearchText(sec, it) {
    const parts = [it.title, it.title_en, (it.tags || []).join(' '), it.summary, it.text];
    for (const f of sec.fields || []) {
      const v = it[f.key];
      if (v == null) continue;
      if (Array.isArray(v)) parts.push(v.map((x) => (typeof x === 'object' ? x.text : x)).join(' '));
      else parts.push(String(v));
    }
    if (it.result_en) parts.push(it.result_en);
    return norm(parts.join(' '));
  }

  // ---------- избранное ----------
  const favKey = (secId, id) => secId + '/' + id;
  const isFav = (secId, id) => state.favs.has(favKey(secId, id));
  function toggleFav(secId, id) {
    const k = favKey(secId, id);
    if (state.favs.has(k)) { state.favs.delete(k); toast('Убрано из избранного'); }
    else { state.favs.add(k); toast('Добавлено в избранное ⭐'); trackEvent('favorite-add', { card: k }); }
    store.set(FAV_KEY, [...state.favs]);
    document.querySelectorAll('[data-fav="' + CSS.escape(k) + '"]').forEach((b) => {
      const on = state.favs.has(k);
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', on);
      const lbl = b.querySelector('.lbl');
      if (lbl) lbl.textContent = on ? 'В избранном' : 'В избранное';
    });
  }

  // ---------- общие куски разметки ----------
  function badges(sec, it) {
    let b = '';
    if (it.beginner) b += '<span class="badge ok">Новичку</span>';
    if (sec.filter && it[sec.filter]) b += '<span class="badge cal">' + esc(it[sec.filter]) + '</span>';
    if (it.safe === 'yes') b += '<span class="badge ok">Безопасно</span>';
    if (it.safe === 'caution') b += '<span class="badge warn">Осторожно</span>';
    if (it.safe === 'no') b += '<span class="badge bad">Опасно</span>';
    if (it.needs_check && state.meta.show_needs_check) b += '<span class="badge warn">⚠ проверить</span>';
    return b;
  }

  function row(sec, it, showSection) {
    const k = favKey(sec.id, it.id);
    const on = state.favs.has(k);
    const b = badges(sec, it);
    return '<div class="row">' +
      '<a class="r-main' + (img(it) ? ' has-img' : '') + '" href="#' + esc(sec.id) + '/' + esc(it.id) + '">' +
        (img(it) ? '<img class="r-thumb" src="' + esc(img(it).src) + '" alt="" loading="lazy" decoding="async">' : '') +
        '<span class="r-body">' +
        (showSection ? '<div class="r-sec">' + esc(sec.icon) + ' ' + esc(sec.title) + '</div>' : '') +
        '<div class="r-title">' + esc(it.title) + (it.title_en ? ' <span class="r-en">(' + esc(it.title_en) + ')</span>' : '') + '</div>' +
        (it.summary ? '<div class="r-sum">' + esc(it.summary) + '</div>' : '') +
        (b ? '<div class="r-meta">' + b + '</div>' : '') +
        '</span>' +
      '</a>' +
      '<button class="star' + (on ? ' on' : '') + '" data-fav="' + esc(k) + '" aria-pressed="' + on + '" aria-label="Избранное">' + ICONS.star + '</button>' +
    '</div>';
  }

  function footer() {
    const m = state.meta;
    return '<div class="footer">Данные актуальны для <b>DayZ ' + esc(m.game_version) + '</b><br>' +
      esc(m.platform) + (m.checked_date ? '<br>Проверено: ' + esc(m.checked_date) : '') +
      (m.author ? '<br><span class="by">⚡ by ' + esc(m.author) + '</span>' : '') + '</div>';
  }

  function searchBox(value, autofocus) {
    return '<div class="searchbox">' + ICONS.search +
      '<input id="q" type="search" inputmode="search" enterkeyhint="search" autocomplete="off" autocorrect="off" spellcheck="false" ' +
      'placeholder="Поиск: холера, Mosin, бинт…" value="' + esc(value || '') + '"' + (autofocus ? ' autofocus' : '') + '>' +
      '<button class="s-clear" id="qClear" aria-label="Очистить"' + (value ? '' : ' hidden') + '>×</button></div>';
  }

  // ---------- экраны ----------
  function viewHome() {
    setChrome('DayZ Guide', 'home', false);
    const m = state.meta;
    const first = state.byId.first15;
    let html = '<div class="hero">' + BOLT +
      '<p class="brand">' + esc(m.author || 'STROM') + '</p>' +
      '<h2>DayZ Guide</h2><p>' + esc(m.app_subtitle) + '</p></div>';
    if (m.public_stats && m.public_stats.enabled) html += '<div class="live" id="live" hidden></div>';
    html += '<a href="#search" class="searchbox" style="display:block;text-decoration:none">' + ICONS.search +
      '<input type="text" readonly tabindex="-1" placeholder="Поиск по всем разделам…" style="pointer-events:none"></a>';
    html += '<div class="grid">';
    state.sections.forEach((s) => {
      const wide = s.id === 'first15';
      html += '<a class="tile' + (wide ? ' wide' : '') + '" href="#' + esc(s.id) + '">' +
        '<span class="t-ico">' + esc(s.icon) + '</span>' +
        '<span><span class="t-title">' + esc(s.title) + '</span><br><span class="t-short">' + esc(s.short || '') + '</span></span>' +
        (wide ? '' : '<span class="t-count">' + s.items.length + '</span>') +
      '</a>';
      if (wide && (state.symptoms || state.patches)) {
        if (state.symptoms) html += '<a class="tile tool-tile" href="#help"><span class="t-ico">🩺</span><span><span class="t-title">Что со мной?</span><br><span class="t-short">Выбери симптомы — подскажу, что это</span></span></a>';
        if (state.patches) { const v = state.patches.patches[0]; html += '<a class="tile tool-tile" href="#patch"><span class="t-ico">🆕</span><span><span class="t-title">Что нового в ' + esc(v.version) + '</span><br><span class="t-short">Главное из патча для новичка</span></span></a>'; }
      }
      if (wide && state.map) {
        html += '<a class="tile wide map-tile" href="#map"><span class="t-ico">🗺️</span>' +
          '<span><span class="t-title">Карта Чернаруси</span><br><span class="t-short">Колонки, больницы, полиция, маршруты новичка</span></span></a>';
      }
    });
    html += '</div>';

    const favRows = favItems();
    if (favRows.length) {
      html += '<div class="h-section">⭐ Избранное</div><div class="list">' +
        favRows.slice(0, 5).map(([s, it]) => row(s, it, true)).join('') + '</div>';
      if (favRows.length > 5) html += '<p style="text-align:center"><a href="#fav">Все избранные (' + favRows.length + ')</a></p>';
    }
    html += socialsHTML();
    html += footer();
    $view.innerHTML = html;
    void first;
    liveStats.show();
  }

  function viewSection(sec, params) {
    setChrome(sec.title, null, true);
    let items = sec.items;
    let html = '';
    if (sec.error) html += '<div class="needs-check">Не удалось загрузить файл data/' + esc(sec.file) + '. Проверь, что в нём правильный JSON.</div>';

    if (sec.filter) {
      const values = [...new Set(items.map((it) => it[sec.filter]).filter(Boolean))].sort();
      const cur = params.get('f') || '';
      html += '<div class="chips" role="tablist" aria-label="' + esc(sec.filter_label || 'Фильтр') + '">' +
        '<button class="chip' + (cur ? '' : ' on') + '" data-filter="">Все</button>' +
        values.map((v) => '<button class="chip' + (cur === v ? ' on' : '') + '" data-filter="' + esc(v) + '">' + esc(v) + '</button>').join('') +
        '</div>';
      if (cur) items = items.filter((it) => it[sec.filter] === cur);
    }

    if (!items.length) html += '<div class="empty">Здесь пока пусто.</div>';
    else html += '<div class="list">' + items.map((it) => row(sec, it, false)).join('') + '</div>';
    html += footer();
    $view.innerHTML = html;

    $view.querySelectorAll('[data-filter]').forEach((b) => b.addEventListener('click', () => {
      const f = b.dataset.filter;
      const newHash = '#' + sec.id + (f ? '?f=' + encodeURIComponent(f) : '');
      replaceHash(newHash);
      viewSection(sec, new URLSearchParams(f ? 'f=' + encodeURIComponent(f) : ''));
    }));
  }

  function fieldHTML(sec, it, f) {
    const v = it[f.key];
    if (v == null || v === '' || (Array.isArray(v) && !v.length)) return '';
    let val;
    if (f.type === 'checklist') val = checklistHTML(sec, it, v);
    else if (f.type === 'safety') {
      const map = { yes: ['ok', 'Да, безопасно'], no: ['bad', 'Нет, опасно'], caution: ['warn', 'С осторожностью'] };
      const m = map[v] || ['', String(v)];
      val = '<span class="badge ' + m[0] + '" style="font-size:14px;padding:4px 10px">' + esc(m[1]) + '</span>';
    } else val = md(v);
    return '<div class="field"><div class="f-label">' + esc(f.label) + '</div><div class="f-val">' + val + '</div></div>';
  }

  function checklistHTML(sec, it, steps) {
    const key = 'dz_check_' + sec.id + '_' + it.id;
    const done = new Set(store.get(key, []));
    const lis = steps.map((s, i) => {
      const step = typeof s === 'string' ? { text: s } : s;
      const dont = step.do === false;
      return '<li class="' + (dont ? 'dont' : '') + '"><label><input type="checkbox" data-step="' + i + '"' + (done.has(i) ? ' checked' : '') + '>' +
        '<span>' + (dont ? '<span class="no">НЕ </span>' : '') + md(step.text).replace(/^<p>|<\/p>$/g, '') + '</span></label></li>';
    }).join('');
    const pct = Math.round(done.size / steps.length * 100);
    return '<div class="progress"><i style="width:' + pct + '%"></i></div>' +
      '<div class="progress-label" data-progress>Выполнено: ' + done.size + ' из ' + steps.length + '</div>' +
      '<ul class="checklist" data-checklist="' + esc(key) + '" data-total="' + steps.length + '">' + lis + '</ul>' +
      '<button class="reset" data-reset="' + esc(key) + '">Сбросить галочки</button>';
  }

  function viewDetail(sec, it) {
    setChrome(sec.title, null, true);
    const k = favKey(sec.id, it.id);
    const on = state.favs.has(k);
    let html = '<article class="detail">' +
      '<div class="d-head"><div class="d-titles"><h2 class="d-title">' + esc(it.title) + '</h2>' +
      (it.title_en ? '<div class="d-en">' + esc(it.title_en) + '</div>' : '') + '</div>' +
      '<button class="star' + (on ? ' on' : '') + '" data-fav="' + esc(k) + '" aria-pressed="' + on + '" aria-label="Избранное">' + ICONS.star + '</button></div>';
    const b = badges(sec, it);
    if (b) html += '<div class="d-badges">' + b + '</div>';
    const pic = img(it);
    if (pic) {
      html += '<figure class="d-img"><img src="' + esc(pic.src) + '" alt="' + esc(it.title) + '" decoding="async">' +
        (pic.caption ? '<figcaption>' + esc(pic.caption) + '</figcaption>' : '') + '</figure>';
    }
    if (it.summary) html += '<p class="d-sum">' + esc(it.summary) + '</p>';
    if (it.needs_check && state.meta.show_needs_check) {
      html += '<div class="needs-check">⚠ Эту карточку ещё нужно сверить с актуальной версией игры' +
        (it.check_note ? ': ' + esc(it.check_note) : '.') + '</div>';
    }
    html += '<div class="fields">';
    for (const f of sec.fields || []) html += fieldHTML(sec, it, f);
    if (it.text) html += '<div class="field"><div class="f-label">Подробнее</div><div class="f-val">' + md(it.text) + '</div></div>';
    html += '</div>';
    html += '<div class="d-actions">' +
      '<button class="btn' + (on ? ' on' : '') + '" data-fav="' + esc(k) + '">' + '<span class="lbl">' + (on ? 'В избранном' : 'В избранное') + '</span></button>' +
      '<button class="btn" data-share>' + ICONS.share + 'Поделиться</button></div>';
    if (it.wiki && /^https:\/\//.test(it.wiki)) {
      html += '<a class="btn wiki" href="' + esc(it.wiki) + '" target="_blank" rel="noopener">' + ICONS.book +
        'Открыть в DayZ Wiki' + ICONS.ext + '</a>';
    }
    html += '</article>' + footer();
    $view.innerHTML = html;

    const share = $view.querySelector('[data-share]');
    share.addEventListener('click', async () => {
      const url = location.href.split('#')[0] + '#' + sec.id + '/' + it.id;
      const title = it.title + (it.title_en ? ' (' + it.title_en + ')' : '') + ' — DayZ Guide';
      try {
        if (navigator.share) { await navigator.share({ title, url }); return; }
      } catch (e) { if (e && e.name === 'AbortError') return; }
      try { await navigator.clipboard.writeText(url); toast('Ссылка скопирована'); }
      catch (e) { prompt('Скопируй ссылку:', url); }
    });

    const cl = $view.querySelector('[data-checklist]');
    if (cl) {
      const key = cl.dataset.checklist, total = +cl.dataset.total;
      const update = () => {
        const checked = [...cl.querySelectorAll('input:checked')].map((x) => +x.dataset.step);
        store.set(key, checked);
        $view.querySelector('.progress > i').style.width = Math.round(checked.length / total * 100) + '%';
        $view.querySelector('[data-progress]').textContent = 'Выполнено: ' + checked.length + ' из ' + total;
      };
      cl.addEventListener('change', update);
      $view.querySelector('[data-reset]').addEventListener('click', () => {
        cl.querySelectorAll('input').forEach((x) => { x.checked = false; });
        update();
      });
    }
  }

  function search(q) {
    const tokens = norm(q).split(' ').filter(Boolean);
    if (!tokens.length) return [];
    const out = [];
    for (const s of state.sections.concat(state.mapSec ? [state.mapSec] : [])) {
      for (const it of s.items) {
        if (!tokens.every((t) => it._search.includes(t))) continue;
        const t = norm(it.title) + ' ' + norm(it.title_en);
        let score = 0;
        for (const tok of tokens) {
          if (t.startsWith(tok)) score += 6;
          else if (t.includes(tok)) score += 4;
          else if (norm((it.tags || []).join(' ')).includes(tok)) score += 2;
          else score += 1;
        }
        out.push([score, s, it]);
      }
    }
    return out.sort((a, b) => b[0] - a[0]).map((x) => [x[1], x[2]]);
  }

  function viewSearch(params) {
    setChrome('Поиск', 'search', false);
    const q = params.get('q') || '';
    $view.innerHTML = searchBox(q, true) + '<div id="results"></div>';
    const $q = document.getElementById('q');
    const $clear = document.getElementById('qClear');
    const $res = document.getElementById('results');
    const run = () => {
      const v = $q.value;
      $clear.hidden = !v;
      const h = '#search' + (v ? '?q=' + encodeURIComponent(v) : '');
      replaceHash(h);
      if (!v.trim()) {
        $res.innerHTML = '<div class="empty">Ищи по-русски или по-английски:<br>«холера», «cholera», «бинт», «7.62», «KOS»</div>';
        return;
      }
      const found = search(v);
      $res.innerHTML = found.length
        ? '<div class="h-section" style="margin-top:0">Найдено: ' + found.length + '</div><div class="list">' + found.map(([s, it]) => row(s, it, true)).join('') + '</div>'
        : '<div class="empty">Ничего не нашлось по «' + esc(v) + '»</div>';
    };
    $q.addEventListener('input', run);
    $q.addEventListener('keydown', (e) => { if (e.key === 'Enter') $q.blur(); });
    $clear.addEventListener('click', () => { $q.value = ''; run(); $q.focus(); });
    run();
    if (!q) setTimeout(() => $q.focus(), 50);
  }

  function favItems() {
    const out = [];
    for (const k of state.favs) {
      const [sid, id] = k.split('/');
      const s = state.byId[sid];
      const it = s && s.items.find((x) => x.id === id);
      if (it) out.push([s, it]);
    }
    return out;
  }

  function viewFav() {
    setChrome('Избранное', 'fav', false);
    const items = favItems();
    $view.innerHTML = (items.length
      ? '<div class="list">' + items.map(([s, it]) => row(s, it, true)).join('') + '</div>'
      : '<div class="empty">Пока пусто.<br>Нажми ☆ на любой карточке, и она появится здесь.</div>') + footer();
  }

  function viewAbout() {
    setChrome('Инфо', 'about', false);
    const m = state.meta;
    const total = state.sections.reduce((a, s) => a + s.items.length, 0);
    const toCheck = state.sections.reduce((a, s) => a + s.items.filter((i) => i.needs_check).length, 0);
    $view.innerHTML = '<div class="prose">' +
      '<h3>О приложении</h3>' +
      '<p>Шпаргалка по DayZ для новичков: первые ~10 часов игры. Только ванильная игра, без модов.</p>' +
      '<p>Карточек: <b>' + total + '</b>' + (toCheck ? ' · на проверке: <b>' + toCheck + '</b>' : '') + '</p>' +
      '<h3>Значки</h3><div class="legend">' +
      '<div><span class="badge ok">Новичку</span> — пригодится в первые часы</div>' +
      '<div><span class="badge warn">⚠ проверить</span> — данные ещё сверяются с актуальной версией</div>' +
      '<div><span class="badge bad">Опасно</span> / <span class="badge warn">Осторожно</span> / <span class="badge ok">Безопасно</span></div></div>' +
      '<h3>Как установить на iPhone</h3>' +
      '<p>Открой сайт в Safari → кнопка «Поделиться» → «На экран Домой». После первого открытия работает без интернета.</p>' +
      '<h3>Ссылки на карточки</h3>' +
      '<p>У каждой карточки есть кнопка «Поделиться»: она даёт прямую ссылку на эту карточку.</p>' +
      '<h3>Автор</h3><p>' + esc(m.author || '') + (m.author_tagline ? ': ' + esc(m.author_tagline) : '') + '</p>' + socialsHTML(true) +
      '<h3>Названия предметов</h3><p>Русские названия даны по русской версии игры, в скобках английские. Если в твоей версии перевод отличается, ищи по английскому названию.</p>' +
      (m.sources ? '<h3>Источники</h3><p>' + esc(m.sources) + '</p>' : '') +
      '<h3>Статистика</h3><p>Сайт считает анонимную статистику посещений (Umami): без cookie и без личных данных. Нужна, чтобы понимать, какие разделы полезны.</p>' +
      '<h3>Дисклеймер</h3>' +
      '<p>Неофициальный фанатский справочник. DayZ — торговая марка Bohemia Interactive. Игра часто обновляется, поэтому сверяйтесь с патчноутами.</p>' +
      '</div>' + footer();
  }

  function viewMap(focusId) {
    setChrome('Карта Чернаруси', null, true);
    if (!state.map || !window.DZMap) { $view.innerHTML = '<div class="empty">Карта не загрузилась. Проверь интернет и обнови страницу.</div>'; return; }
    const M = state.map;
    const chips = window.DZMap.LAYERS.map((l) => '<button class="chip" data-layer-toggle="' + l.id + '">' + l.icon + ' ' + esc(l.title) + '</button>').join('');
    const card = (r) => '<div class="route-card ' + r.verdict + '"><div class="rc-title">' + (r.verdict === 'good' ? '✅ ' : '❌ ') + esc(r.title) + '</div>' +
      window.DZMap.routeHTML(r) + '<button class="btn" data-route="' + esc(r.id) + '">🧭 Показать на карте</button></div>';
    $view.innerHTML = '<div class="map-page">' +
      '<div class="chips map-layers">' + chips + '</div>' +
      '<div class="map-wrap"><div class="map-ctrl">' +
        '<button data-zoom="in" aria-label="Приблизить">+</button><button data-zoom="out" aria-label="Отдалить">−</button>' +
        '<button data-zoom="fit" aria-label="Вся карта">⤢</button><button data-zoom="legend" aria-label="Обозначения">?</button>' +
      '</div><div class="map-tip" hidden></div><div class="map-legend" hidden></div><div class="map-sheet" hidden></div></div>' +
      '<p class="map-hint">Двигай карту пальцем, приближай двумя пальцами или двойным тапом. Чем ближе — тем больше подписей. ' +
        'На компьютере достаточно навести мышку. «?» — обозначения.</p>' +
      '<div class="h-section">✅ Хорошие маршруты для новичка</div>' + M.routes.filter((r) => r.verdict === 'good').map(card).join('') +
      '<div class="h-section">❌ Частые ошибки новичков</div>' + M.routes.filter((r) => r.verdict !== 'good').map(card).join('') +
      '<p class="map-note">' + esc(M.note) + ' ' +
        esc(M.loot_note || '') + ' Данные проверены: ' + esc(M.checked) + '.</p>' +
      footer() + '</div>';
    const nav = (id) => {
      const h = '#map' + (id ? '/' + id : '');
      if (h !== (location.hash || '#')) { replaceHash(h); if (id) trackView('/map/' + id); }
    };
    window.DZMap.mount($view.querySelector('.map-page'), M, null, focusId, nav);
    $view.querySelectorAll('[data-route]').forEach((btn) => btn.addEventListener('click', () => window.DZMap.select(btn.dataset.route)));
  }

  // ---------- «Что со мной?» ----------
  function cardById(ref) {
    const [sid, id] = ref.split('/');
    const sec = state.byId[sid];
    const it = sec && sec.items.find((x) => x.id === id);
    return it ? [sec, it] : null;
  }
  function viewHelp(params) {
    setChrome('Что со мной?', null, true);
    const S = state.symptoms;
    if (!S) { $view.innerHTML = '<div class="empty">Не удалось загрузить данные.</div>'; return; }
    const sel = new Set((params.get('s') || '').split(',').filter(Boolean));
    $view.innerHTML = '<p class="help-intro">Отметь всё, что видишь или слышишь у персонажа. Ниже появится, что это может быть и что делать.</p>' +
      '<div class="sym-grid">' + S.symptoms.map((x) => '<button class="sym' + (sel.has(x.id) ? ' on' : '') + '" data-sym="' + esc(x.id) + '" aria-pressed="' + sel.has(x.id) + '">' +
        '<span class="sym-i">' + x.icon + '</span><span>' + esc(x.label) + '</span></button>').join('') + '</div>' +
      '<div id="helpRes"></div><p class="map-note">' + esc(S.note) + '</p>' + footer();
    const $res = document.getElementById('helpRes');
    const render = () => {
      replaceHash('#help' + (sel.size ? '?s=' + [...sel].join(',') : ''));
      if (!sel.size) { $res.innerHTML = '<div class="empty" style="padding:24px 8px">Выбери хотя бы один симптом 👆</div>'; return; }
      const scored = S.conditions.map((c) => {
        let score = 0, hits = 0;
        for (const k of sel) if (c.w[k]) { score += c.w[k]; hits++; }
        const total = Object.values(c.w).reduce((a, b) => a + b, 0);
        return { c, score, hits, fit: score / total };
      }).filter((x) => x.score > 0).sort((a, b) => b.score - a.score || b.fit - a.fit).slice(0, 4);
      if (!scored.length) { $res.innerHTML = '<div class="empty">Не нашёл подходящего. Загляни в разделы «Болезни» и «Ранения».</div>'; return; }
      const best = scored[0].score;
      $res.innerHTML = '<div class="h-section">Похоже на</div>' + scored.map((x, i) => {
        const found = cardById(x.c.card); if (!found) return '';
        const [sec, it] = found;
        const todo = it.treatment || it.how || it.summary || '';
        const pct = Math.round(Math.min(1, x.score / Math.max(best, 1)) * 100);
        return '<a class="help-card' + (i === 0 ? ' top' : '') + '" href="#' + esc(sec.id) + '/' + esc(it.id) + '">' +
          '<div class="hc-head"><span class="hc-title">' + esc(it.title) + (it.title_en ? ' <span class="r-en">(' + esc(it.title_en) + ')</span>' : '') + '</span>' +
          '<span class="hc-sec">' + esc(sec.icon) + '</span></div>' +
          '<div class="hc-bar"><i style="width:' + pct + '%"></i></div>' +
          (x.c.hint ? '<div class="hc-hint">❓ ' + esc(x.c.hint) + '</div>' : '') +
          (todo ? '<div class="hc-todo"><b>Что делать:</b> ' + md(todo).replace(/^<p>|<\/p>$/g, '') + '</div>' : '') +
          '<div class="hc-more">Подробнее →</div></a>';
      }).join('');
    };
    $view.querySelectorAll('[data-sym]').forEach((b) => b.addEventListener('click', () => {
      const id = b.dataset.sym;
      if (sel.has(id)) sel.delete(id); else sel.add(id);
      b.classList.toggle('on', sel.has(id)); b.setAttribute('aria-pressed', sel.has(id));
      render();
    }));
    render();
  }

  // ---------- «Что нового в патче» ----------
  function viewPatch(id) {
    setChrome('Что нового в патче', null, true);
    const P = state.patches;
    if (!P) { $view.innerHTML = '<div class="empty">Не удалось загрузить данные.</div>'; return; }
    let onlyStar = false;
    const render = () => {
      $view.innerHTML = '<div class="chips"><button class="chip' + (onlyStar ? '' : ' on') + '" data-f="all">Всё</button>' +
        '<button class="chip' + (onlyStar ? ' on' : '') + '" data-f="star">⭐ Важное новичку</button></div>' +
        P.patches.map((v) => {
          const groups = v.groups.map((g) => {
            const items = g.items.filter((x) => !onlyStar || x.star);
            if (!items.length) return '';
            return '<div class="pg-title">' + esc(g.title) + '</div><ul class="pg-list">' + items.map((x) =>
              '<li class="' + (x.star ? 'star-item' : '') + '">' + (x.star ? '⭐ ' : '') + esc(x.text) +
              (x.link ? ' <a href="' + esc(x.link) + '">→</a>' : '') + '</li>').join('') + '</ul>';
          }).join('');
          if (!groups) return '';
          return '<article class="patch" id="p-' + esc(v.id) + '"><div class="patch-head"><span class="patch-v">' + esc(v.version) + '</span>' +
            '<div><div class="patch-name">' + esc(v.name) + '</div><div class="patch-date">' + esc(v.date) + '</div></div></div>' +
            '<p class="patch-sum">' + esc(v.summary) + '</p>' + groups + '<div class="patch-builds">' + esc(v.builds) + '</div></article>';
        }).join('') +
        (P.upcoming ? '<div class="needs-check">🧪 ' + esc(P.upcoming) + '</div>' : '') +
        '<p class="map-note">' + esc(P.note) + '</p>' + footer();
      $view.querySelectorAll('[data-f]').forEach((b) => b.addEventListener('click', () => { onlyStar = b.dataset.f === 'star'; render(); }));
    };
    render();
    if (id) { const el = document.getElementById('p-' + id); if (el) el.scrollIntoView(); }
  }

  function viewNotFound() {
    setChrome('Не найдено', null, true);
    $view.innerHTML = '<div class="empty">Такой карточки нет. Возможно, её переименовали.<br><br><a href="#">На главную</a></div>';
  }

  // ---------- шапка и вкладки ----------
  function setChrome(title, tab, showBack) {
    $title.textContent = tab === 'home' ? '' : title;
    $back.hidden = !showBack;
    document.querySelectorAll('.tab').forEach((t) => t.classList.toggle('active', t.dataset.tab === tab));
    document.title = title === 'DayZ Guide' ? 'DayZ Guide' : title + ' · DayZ Guide';
  }

  $back.addEventListener('click', () => {
    if (state.navDepth > 0) { history.back(); return; }
    const parts = location.hash.replace(/^#/, '').split('?')[0].split('/');
    location.hash = parts.length > 1 ? '#' + parts[0] : '#';
  });

  // ---------- роутер ----------
  function route() {
    const prev = state.lastHash;
    if (prev != null) state.scroll[prev] = window.scrollY;
    const hash = location.hash || '#';
    const raw = hash.replace(/^#\/?/, '');
    const [path, qs] = raw.split('?');
    const params = new URLSearchParams(qs || '');
    const parts = path.split('/').filter(Boolean).map(decodeURIComponent);

    if (!parts.length) viewHome();
    else if (parts[0] === 'search') viewSearch(params);
    else if (parts[0] === 'fav') viewFav();
    else if (parts[0] === 'about') viewAbout();
    else if (parts[0] === 'map') viewMap(parts[1]);
    else if (parts[0] === 'help') viewHelp(params);
    else if (parts[0] === 'patch') viewPatch(parts[1]);
    else {
      const sec = state.byId[parts[0]];
      if (!sec) viewNotFound();
      else if (parts[1]) {
        const it = sec.items.find((x) => x.id === parts[1]);
        if (it) viewDetail(sec, it); else viewNotFound();
      } else viewSection(sec, params);
    }
    state.lastHash = location.hash || '#';
    const y = parts.length === 2 ? 0 : (state.scroll[state.lastHash] || 0);
    window.scrollTo(0, y);
    trackView('/' + parts.join('/'));
  }

  // ---------- публичный счётчик на главной: онлайн + всего посетителей ----------
  // Цифры берутся из публичной ссылки Umami (настройки в data/meta.json → public_stats).
  const liveStats = (() => {
    let token = null, total = null, totalAt = 0, online = null, timer = null;
    const plural = (n, a, b, c) => { const m10 = n % 10, m100 = n % 100;
      return m10 === 1 && m100 !== 11 ? a : (m10 >= 2 && m10 <= 4 && (m100 < 12 || m100 > 14) ? b : c); };
    const fmt = (n) => Number(n).toLocaleString('ru-RU');
    async function api(path) {
      const cfg = state.meta.public_stats;
      if (!token) {
        const s = await fetch(cfg.api + '/share/' + encodeURIComponent(cfg.share_id)).then((r) => r.json());
        token = { t: s.token, w: s.websiteId };
      }
      const r = await fetch(cfg.api + '/websites/' + token.w + path, { headers: { 'x-umami-share-token': token.t, 'x-umami-share-context': '1' } });
      if (r.status === 401) { token = null; throw new Error('401'); }
      if (!r.ok) throw new Error(String(r.status));
      return r.json();
    }
    function render() {
      const el = document.getElementById('live');
      if (!el || (online == null && total == null)) return;
      let h = '';
      if (online != null) h += '<span class="live-item"><i class="dot"></i>онлайн <b>' + fmt(online) + '</b></span>';
      if (total != null) h += '<span class="live-item">👥 <b>' + fmt(total) + '</b> ' + plural(total, 'посетитель', 'посетителя', 'посетителей') + '</span>';
      el.innerHTML = h;
      el.hidden = false;
    }
    async function refresh() {
      const cfg = state.meta.public_stats;
      if (!cfg || !cfg.enabled || !navigator.onLine) return;
      try {
        const a = await api('/active');
        online = Math.max(1, a.visitors || a.x || 0); // ты сам тоже на сайте
        if (Date.now() - totalAt > 5 * 60 * 1000) {
          const since = new Date(cfg.since || '2026-01-01').getTime();
          const st = await api('/stats?startAt=' + since + '&endAt=' + Date.now());
          total = (st.visitors && typeof st.visitors === 'object') ? st.visitors.value : st.visitors;
          totalAt = Date.now();
        }
      } catch (e) { /* нет сети или ссылка выключена — просто не показываем */ }
      render();
    }
    return {
      show() {
        render();
        refresh();
        clearInterval(timer);
        timer = setInterval(() => { if (document.getElementById('live')) refresh(); else clearInterval(timer); }, 30000);
      }
    };
  })();

  // ---------- статистика (Umami, без cookie) ----------
  // Каждая карточка считается отдельной страницей: /diseases/cholera, /weapons/mosin и т.д.
  let pendingView = null;
  function trackView(url) {
    pendingView = url;
    try {
      if (window.umami && typeof window.umami.track === 'function') {
        window.umami.track((p) => ({ ...p, url, title: document.title }));
        pendingView = null;
      }
    } catch (e) { /* статистика не должна ломать приложение */ }
  }
  function trackEvent(name, data) {
    try { if (window.umami && window.umami.track) window.umami.track(name, data); } catch (e) { /* ignore */ }
  }
  const umamiTag = document.getElementById('umami-script');
  if (umamiTag) umamiTag.addEventListener('load', () => { if (pendingView) trackView(pendingView); });
  document.addEventListener('click', (e) => {
    const a = e.target.closest('a.social, a.btn.wiki, [data-share]');
    if (!a) return;
    if (a.classList.contains('social')) trackEvent('social-click', { network: a.textContent.trim().split(/\s/)[0] });
    else if (a.classList.contains('wiki')) trackEvent('wiki-click', { card: location.hash.slice(1) });
    else trackEvent('share-click', { card: location.hash.slice(1) });
  });

  // глобальные клики: звёздочки
  document.addEventListener('click', (e) => {
    const fav = e.target.closest('[data-fav]');
    if (fav) {
      e.preventDefault();
      const [sid, id] = fav.dataset.fav.split('/');
      toggleFav(sid, id);
      if (location.hash === '#fav') viewFav();
    }
  });

  // стек переходов внутри приложения — чтобы «Назад» не выкидывал из приложения
  const stack = state.stack;
  window.addEventListener('hashchange', () => {
    const h = location.hash || '#';
    if (stack.length > 1 && stack[stack.length - 2] === h) stack.pop(); else stack.push(h);
    state.navDepth = stack.length - 1;
    route();
  });

  // ---------- старт ----------
  load().then(route).catch((e) => {
    console.error(e);
    $view.innerHTML = '<div class="empty">Не удалось загрузить данные.<br><small>' + esc(e.message) + '</small><br><br>' +
      (location.protocol === 'file:' ? 'Файл открыт напрямую (file://). Открой приложение через сайт (GitHub Pages) или локальный сервер.' : 'Проверь подключение и обнови страницу.') + '</div>';
  });

  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').catch((e) => console.warn('SW не зарегистрирован', e));
    });
  }
})();
