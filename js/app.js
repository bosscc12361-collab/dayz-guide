/* DayZ Guide — vanilla JS, без сборки.
   Данные лежат в /data/*.json, список разделов — в data/meta.json. */
(function () {
  'use strict';
  const APP_V = (((document.currentScript && document.currentScript.src) || '').match(/[?&]v=(\d+)/) || [])[1] || '—';

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
    void noHeader;
    return '<div class="socials">' + list.map((x) =>
        '<a class="social ' + (x.id === 'telegram' ? 'tg' : '') + '" href="' + esc(x.url) + '" target="_blank" rel="noopener" ' +
        'aria-label="' + esc(x.title + (x.handle ? ' ' + x.handle : '')) + '" title="' + esc(x.title + (x.handle ? ' ' + x.handle : '')) + '">' +
        (SOCIAL_ICONS[x.id] || esc(x.title)) + '</a>').join('') +
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

  // ---------- «Поделиться»: своё окно, работает везде ----------
  function copyText(t) {
    const ta = document.createElement('textarea');
    ta.value = t; ta.setAttribute('readonly', ''); ta.style.cssText = 'position:fixed;top:0;left:0;opacity:0';
    document.body.appendChild(ta); ta.select(); ta.setSelectionRange(0, t.length);
    let ok = false;
    try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
    ta.remove();
    if (ok) return Promise.resolve(true);
    return navigator.clipboard && navigator.clipboard.writeText ? navigator.clipboard.writeText(t).then(() => true, () => false) : Promise.resolve(false);
  }
  function shareSheet(o) {
    const full = (o.text ? o.text + ' ' : '') + o.url;
    const enc = encodeURIComponent;
    const wrap = document.createElement('div');
    wrap.className = 'fb-modal';
    wrap.innerHTML = '<div class="fb-back" data-close></div><div class="fb-sheet sh-sheet">' +
      '<div class="fb-head"><b>📤 Поделиться</b><button type="button" class="fb-x" data-close aria-label="Закрыть">×</button></div>' +
      (o.text ? '<p class="sh-text">' + esc(o.text) + '</p>' : '') +
      '<input class="sh-url" readonly value="' + esc(o.url) + '">' +
      '<div class="sh-grid">' +
        '<button class="btn" data-copy>📋 Скопировать</button>' +
        '<a class="btn" target="_blank" rel="noopener" href="https://t.me/share/url?url=' + enc(o.url) + (o.text ? '&text=' + enc(o.text) : '') + '">✈️ Telegram</a>' +
        '<a class="btn" target="_blank" rel="noopener" href="https://wa.me/?text=' + enc(full) + '">💬 WhatsApp</a>' +
        (navigator.share ? '<button class="btn" data-native>⋯ Другие</button>' : '<a class="btn" target="_blank" rel="noopener" href="https://www.facebook.com/sharer/sharer.php?u=' + enc(o.url) + '">📘 Facebook</a>') +
      '</div></div>';
    document.body.appendChild(wrap);
    const close = () => wrap.remove();
    wrap.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', close));
    wrap.querySelectorAll('a.btn').forEach((a) => a.addEventListener('click', () => { trackEvent('share-click', { card: o.id || '', via: a.textContent.trim() }); setTimeout(close, 300); }));
    const inp = wrap.querySelector('.sh-url');
    inp.addEventListener('focus', () => inp.select());
    wrap.querySelector('[data-copy]').addEventListener('click', async () => {
      const ok = await copyText(full);
      if (ok) { toast('Скопировано — вставь в чат'); trackEvent('share-click', { card: o.id || '', via: 'copy' }); close(); }
      else { inp.focus(); inp.select(); toast('Выдели ссылку и скопируй'); }
    });
    const nat = wrap.querySelector('[data-native]');
    if (nat) nat.addEventListener('click', async () => {
      try { await navigator.share({ title: o.title, text: o.text, url: o.url }); close(); } catch (e) { /* отмена */ }
    });
  }
  window.dzShare = shareSheet;
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
    try { state.quiz = await getJSON('data/quiz.json'); } catch (e) { console.warn('quiz', e); }
    try { state.servers = await getJSON('data/servers.json'); } catch (e) { console.warn('servers', e); }
  }

  function buildSearchText(sec, it) {
    const parts = [it.title, it.title_en, (it.tags || []).join(' '), it.summary, it.text];
    for (const f of sec.fields || []) {
      const v = it[f.key];
      if (v == null) continue;
      if (Array.isArray(v)) parts.push(v.map((x) => (Array.isArray(x) ? x.join(' ') : typeof x === 'object' ? x.text : x)).join(' '));
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
    html += homeGroups();

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

  // плитки главной, сгруппированные по meta.home
  function homeTile(id) {
    const tile = (href, ico, title, short, cls, count) => '<a class="tile' + (cls ? ' ' + cls : '') + '" href="' + href + '">' +
      '<span class="t-ico">' + ico + '</span>' +
      '<span><span class="t-title">' + esc(title) + '</span><br><span class="t-short">' + esc(short) + '</span></span>' +
      (count != null ? '<span class="t-count">' + count + '</span>' : '') + '</a>';
    if (id === 'map') return state.map ? tile('#map', '🗺️', 'Карта Чернаруси', 'Где я, куда идти, опасные места, лут и свой маршрут', 'wide map-tile') : '';
    if (id === 'help') return state.symptoms ? tile('#help', '🩺', 'Что со мной?', 'Выбери симптомы — подскажу, что это', 'tool-tile') : '';
    if (id === 'patch') { if (!state.patches) return ''; const v = state.patches.patches[0]; return tile('#patch', '🆕', 'Что нового в ' + v.version, 'Главное из патча для новичка', 'tool-tile'); }
    if (id === 'quiz') return state.quiz ? tile('#quiz', '🧠', 'Проверь себя', 'Какой у тебя уровень в DayZ?', 'tool-tile') : '';
    if (id === 'servers') return state.servers ? tile('#servers', '🖥️', 'Серверы для новичка', 'Как выбрать сервер и где играть — с живым онлайном', 'tool-tile') : '';
    const s = state.byId[id];
    if (!s || !s.items) return '';
    return tile('#' + s.id, esc(s.icon), s.title, s.short || '', s.id === 'first15' ? 'wide' : '', s.id === 'first15' ? null : s.items.length);
  }
  function homeGroups() {
    const groups = (state.meta.home || []).map((g) => ({ ...g, items: g.items.slice() }));
    const used = new Set(groups.flatMap((g) => g.items));
    const rest = state.sections.filter((s) => !s.hidden_home).map((s) => s.id).filter((id) => !used.has(id));
    if (rest.length) groups.push({ title: 'Ещё', icon: '➕', items: rest });
    if (!groups.length) groups.push({ items: state.sections.map((s) => s.id) });
    return groups.map((g) => {
      const arr = g.items.map(homeTile).filter(Boolean);
      const narrow = arr.filter((t) => !/class="tile wide/.test(t));
      if (narrow.length % 2 === 1) { const last = narrow[narrow.length - 1]; arr[arr.lastIndexOf(last)] = last.replace('class="tile', 'class="tile span2'); }
      const tiles = arr.join('');
      if (!tiles) return '';
      return (g.title ? '<h2 class="g-head"><span class="g-ico">' + g.icon + '</span>' + esc(g.title) + '</h2>' : '') +
        '<div class="grid">' + tiles + '</div>';
    }).join('');
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
    else if (f.type === 'keys') val = '<div class="keys">' + v.map((k) => '<div class="key-row"><span class="kbd">' + esc(k[0]) + '</span><span class="key-act">' + md(k[1]).replace(/^<p>|<\/p>$/g, '') + '</span></div>').join('') + '</div>';
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

  function seeTitle(h) {
    const [path] = h.slice(1).split('?');
    const [sid, iid] = path.split('/');
    if (sid === 'help') return 'Что со мной?';
    if (sid === 'map' && !iid) return 'Карта Чернаруси';
    const s = state.byId[sid];
    if (!s) return 'Подробнее';
    if (!iid) return s.title + (h.includes('?f=') ? ': ' + decodeURIComponent(h.split('?f=')[1]) : '');
    const it = s.items.find((x) => x.id === iid);
    return it ? it.title : s.title;
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
    if (it.see && /^#[\w\-\/?=.%а-яё ]+$/i.test(it.see)) {
      const t = seeTitle(it.see);
      html += '<a class="btn see" href="' + esc(it.see) + '">→ ' + esc(t) + '</a>';
    }
    html += '<div class="d-actions">' +
      '<button class="btn' + (on ? ' on' : '') + '" data-fav="' + esc(k) + '">' + '<span class="lbl">' + (on ? 'В избранном' : 'В избранное') + '</span></button>' +
      '<button class="btn" data-share>' + ICONS.share + 'Поделиться</button></div>';
    if (it.spawn && it.spawn.nominal > 0 && state.map) html += '<a class="btn map-btn" href="#map?loot=' + esc(sec.id) + '/' + esc(it.id) + '">🗺️ Где искать на карте</a>';
    if (fbOn()) html += '<button class="fb-link" data-fb>⚠️ Нашёл ошибку в карточке</button>';
    if (it.wiki && /^https:\/\//.test(it.wiki)) {
      html += '<a class="btn wiki" href="' + esc(it.wiki) + '" target="_blank" rel="noopener">' + ICONS.book +
        'Открыть в DayZ Wiki' + ICONS.ext + '</a>';
    }
    html += '</article>' + footer();
    $view.innerHTML = html;

    const fbBtn = $view.querySelector('[data-fb]');
    if (fbBtn) fbBtn.addEventListener('click', () => feedback({ type: 'error', where: sec.icon + ' ' + sec.title + ' → ' + it.title, hash: '#' + sec.id + '/' + it.id }));

    const share = $view.querySelector('[data-share]');
    share.addEventListener('click', () => {
      const url = location.href.split('#')[0] + '#' + sec.id + '/' + it.id;
      const title = it.title + (it.title_en ? ' (' + it.title_en + ')' : '') + ' — DayZ Guide';
      shareSheet({ id: sec.id + '/' + it.id, title, text: title, url });
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
      (fbOn() ? '<h3>Нашёл ошибку или есть идея?</h3><p>Напиши — сообщение придёт автору. Ошибку в конкретной карточке удобнее отправить кнопкой «⚠️ Нашёл ошибку» внизу карточки.</p><button class="btn fb-about" data-fb-idea>💡 Написать автору</button>' : '') +
      '<h3>Версия приложения</h3><p>Версия <b>' + esc(APP_V) + '</b>. Новая версия подтягивается сама, когда открываешь приложение с интернетом. Если что-то выглядит устаревшим, нажми кнопку — приложение скачается заново. Избранное и галочки сохранятся.</p>' +
      ('serviceWorker' in navigator ? '<button class="btn upd-btn" data-upd>🔄 Проверить обновления</button>' : '') +
      '<h3>Автор</h3><p>' + esc(m.author || '') + (m.author_tagline ? ': ' + esc(m.author_tagline) : '') + '</p>' + socialsHTML(true) +
      '<h3>Названия предметов</h3><p>Русские названия даны по русской версии игры, в скобках английские. Если в твоей версии перевод отличается, ищи по английскому названию.</p>' +
      (m.sources ? '<h3>Источники</h3><p>' + esc(m.sources) + '</p>' : '') +
      '<h3>Статистика</h3><p>Сайт считает анонимную статистику посещений (Umami): без cookie и без личных данных. Нужна, чтобы понимать, какие разделы полезны.</p>' +
      '<h3>Дисклеймер</h3>' +
      '<p>Неофициальный фанатский справочник. DayZ — торговая марка Bohemia Interactive. Игра часто обновляется, поэтому сверяйтесь с патчноутами.</p>' +
      '</div>' + footer();
    const ub = $view.querySelector('[data-upd]');
    if (ub) ub.addEventListener('click', () => { ub.disabled = true; ub.textContent = 'Обновляю…'; window.dzCheckUpdate && window.dzCheckUpdate(); });
    const fi = $view.querySelector('[data-fb-idea]');
    if (fi) fi.addEventListener('click', () => feedback({ type: 'idea', where: 'Общее сообщение (раздел «Инфо»)', hash: '' }));
  }

  // ---------- обратная связь ----------
  const FB_KEY = 'dz_fb_sent';
  function fbOn() { const f = state.meta && state.meta.feedback; return !!(f && /^https:\/\//.test(f.endpoint || '')); }
  function feedback(ctx) {
    const idea = ctx.type === 'idea';
    const wrap = document.createElement('div');
    wrap.className = 'fb-modal';
    wrap.innerHTML = '<div class="fb-back" data-close></div>' +
      '<form class="fb-sheet" novalidate>' +
        '<div class="fb-head"><b>' + (idea ? '💡 Написать автору' : '⚠️ Ошибка в карточке') + '</b><button type="button" class="fb-x" data-close aria-label="Закрыть">×</button></div>' +
        (idea ? '' : '<div class="fb-where">' + esc(ctx.where) + '</div>') +
        '<label class="fb-l">' + (idea ? 'Сообщение' : 'Что не так?') + '</label>' +
        '<textarea name="text" rows="4" maxlength="1000" required placeholder="' + (idea ? 'Идея, вопрос, что добавить…' : 'Например: в магазине 5 патронов, а не 10') + '"></textarea>' +
        (idea ? '' : '<label class="fb-l">Как правильно <span>(необязательно)</span></label><textarea name="fix" rows="2" maxlength="1000"></textarea>') +
        '<input name="website" tabindex="-1" autocomplete="off" class="fb-hp" aria-hidden="true">' +
        '<p class="fb-note">Сообщение анонимное. Личные данные не нужны.</p>' +
        '<div class="fb-err" hidden></div>' +
        '<button class="btn fb-send" type="submit">Отправить</button>' +
      '</form>';
    document.body.appendChild(wrap);
    const form = wrap.querySelector('form'), ta = form.text, err = wrap.querySelector('.fb-err'), send = wrap.querySelector('.fb-send');
    const close = () => { wrap.remove(); document.removeEventListener('keydown', onKey); };
    const onKey = (e) => { if (e.key === 'Escape') close(); };
    document.addEventListener('keydown', onKey);
    wrap.querySelectorAll('[data-close]').forEach((x) => x.addEventListener('click', close));
    setTimeout(() => ta.focus(), 50);
    const fail = (m) => { err.textContent = m; err.hidden = false; send.disabled = false; send.textContent = 'Отправить'; };
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const text = ta.value.trim();
      if (text.length < 3) return fail('Напиши хотя бы пару слов.');
      const now = Date.now();
      const sent = (store.get(FB_KEY, []) || []).filter((t) => now - t < 3600e3);
      if (sent.length >= 5) return fail('Слишком много сообщений за час. Попробуй позже.');
      send.disabled = true; send.textContent = 'Отправляю…'; err.hidden = true;
      try {
        const r = await fetch(state.meta.feedback.endpoint, {
          method: 'POST', headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: ctx.type, where: ctx.where, hash: ctx.hash, text, fix: form.fix ? form.fix.value.trim() : '', website: form.website.value, v: state.meta.checked_date || '' }),
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) return fail(j.error === 'limit' ? 'Слишком много сообщений за час. Попробуй позже.' : 'Не получилось отправить. Проверь интернет и попробуй ещё раз.');
        sent.push(now); store.set(FB_KEY, sent);
        trackEvent('feedback-sent', { type: ctx.type });
        close(); toast('Спасибо! Сообщение отправлено ⚡');
      } catch (e2) { fail('Нет интернета? Сообщение не отправилось.'); }
    });
  }

  // ---------- карта Чернаруси ----------
  // предметы с официальными данными спавна
  function lootItems() {
    const out = [];
    ['loot', 'weapons'].forEach((sid) => { const s = state.byId[sid]; if (s) s.items.forEach((it) => { if (it.spawn) out.push([s, it]); }); });
    return out;
  }
  function mapTierAt(x, z) {
    const T = state.map.tiers; if (!T) return 0;
    const n = T.n, cell = state.map.size / n;
    const gx = Math.min(n - 1, Math.max(0, Math.floor(x / cell))), gz = Math.min(n - 1, Math.max(0, Math.floor(z / cell)));
    return +T.rows[gz][gx] || 0;
  }
  function nearestTown(x, z) {
    let best = null, bd = 1e12;
    state.map.towns.forEach((t) => { const d = (t.x - x) ** 2 + (t.z - z) ** 2; if (d < bd) { bd = d; best = t; } });
    return best ? best.name : '';
  }
  // список мест на карте для предмета: [{label, x, z, tier}]
  function lootPlaces(sp) {
    const M = state.map, tiers = new Set((sp.tier || []).map((t) => +String(t).replace(/\D/g, '')).filter(Boolean));
    const okT = (t) => !tiers.size || tiers.has(t);
    const out = [], notes = [];
    const add = (label, x, z) => { const t = mapTierAt(x, z); if (okT(t)) out.push({ label, x, z, tier: t }); };
    const u = sp.usage || [];
    if (u.includes('Medic')) { M.points.hospital.forEach((p) => add('✚ Больница — ' + nearestTown(p[0], p[1]), p[0], p[1])); M.points.clinic.forEach((p) => add('✚ Медпункт — ' + nearestTown(p[0], p[1]), p[0], p[1])); }
    if (u.includes('Police')) M.points.police.forEach((p) => add('🚓 Полиция — ' + nearestTown(p[0], p[1]), p[0], p[1]));
    if (u.includes('Military')) { M.military.forEach((m) => add('🎖️ ' + m.name, m.x, m.z)); notes.push('Мелкие военные точки (палатки, блокпосты, вышки) есть по всей карте — их на карте отдельно не отметили.'); }
    if (u.includes('Hunting')) notes.push('Охотничьи вышки стоят почти в каждом лесу — включён слой «Вышки».');
    if (u.includes('Town')) M.towns.filter((t) => t.big).forEach((t) => add('🏙️ ' + t.name, t.x, t.z));
    const villageish = u.filter((x) => ['Village', 'Farm', 'Industrial', 'Office', 'School', 'Firefighter', 'Coast'].includes(x));
    if (villageish.length) M.towns.filter((t) => !t.big).forEach((t) => add('🏘️ ' + t.name, t.x, t.z));
    if (u.includes('ContaminatedArea')) M.zones.forEach((z) => out.push({ label: '☣️ ' + z.name + ' (нужна защита!)', x: z.x, z: z.z, tier: mapTierAt(z.x, z.z) }));
    if (!u.length) { notes.push('Лежит почти в любых зданиях — смотри в ближайшем посёлке.'); M.towns.forEach((t) => add((t.big ? '🏙️ ' : '🏘️ ') + t.name, t.x, t.z)); }
    const seen = new Set();
    const uniq = out.filter((p) => { const k = p.label; if (seen.has(k)) return false; seen.add(k); return true; });
    uniq.sort((a, b) => a.tier - b.tier || a.label.localeCompare(b.label, 'ru'));
    return { places: uniq, notes };
  }
  const TIER_SHORT = { 1: 'Тир 1 · побережье', 2: 'Тир 2 · средняя полоса', 3: 'Тир 3 · север и запад', 4: 'Тир 4 · северо-запад' };
  function placeBtn(p) {
    return '<button class="pl-btn" data-go="' + p.x + ',' + p.z + '" data-label="' + esc(p.label) + '">' + esc(p.label) +
      (p.tier ? '<span class="pl-t t' + p.tier + '">T' + p.tier + '</span>' : '') + '</button>';
  }
  function lootResult(ref) {
    const c = ref && cardById(ref);
    if (!c) return '';
    const [sec, it] = c, sp = it.spawn;
    let html = '<div class="loot-banner"><div class="lb-top"><b>' + esc(sec.icon) + ' ' + esc(it.title) + '</b><a class="lb-link" href="#' + esc(sec.id) + '/' + esc(it.id) + '">карточка →</a></div>' +
      '<div class="lb-txt">' + esc(it.where) + '</div></div>';
    if (!sp || !sp.nominal) return html;
    const { places, notes } = lootPlaces(sp);
    notes.forEach((n) => { html += '<p class="lb-note">' + esc(n) + '</p>'; });
    if (places.length) {
      html += '<p class="lb-note">Нажми на место — карта покажет его. Сначала ближние к побережью.</p>';
      let cur = -1;
      places.forEach((p) => { if (p.tier !== cur) { cur = p.tier; html += '<div class="pl-tier">' + esc(TIER_SHORT[p.tier] || 'Другое') + '</div>'; } html += placeBtn(p); });
    }
    return html;
  }

  function lootFilter(ref) {
    const c = ref && cardById(ref);
    if (!c || !c[1].spawn || !c[1].spawn.nominal) return null;
    const sp = c[1].spawn;
    return { usage: sp.usage || [], tiers: (sp.tier || []).map((t) => +String(t).replace(/\D/g, '')).filter(Boolean) };
  }
  const km = (m) => (m < 950 ? Math.max(0, Math.round(m / 10) * 10) + ' м' : (m / 1000).toFixed(1).replace('.', ',') + ' км');

  function viewMap(focusId, params) {
    setChrome('Карта Чернаруси', null, true);
    const DM = window.DZMap;
    if (!state.map || !DM) { $view.innerHTML = '<div class="empty">Не удалось загрузить карту. Проверь интернет и обнови страницу.</div>'; return; }
    const M = state.map;
    const lootRef = params ? params.get('loot') : null;
    const shared = params ? params.get('my') : null;
    const findTown = (v) => { const q = norm(v || '').trim(); if (!q) return null; return M.towns.find((t) => norm(t.name) === q || norm(t.en || '') === q) || M.towns.find((t) => norm(t.name).startsWith(q) || norm(t.en || '').startsWith(q)) || null; };
    const chips = DM.LAYERS.map((l) => '<button class="chip" data-layer-toggle="' + l.id + '">' + l.icon + ' ' + esc(l.title) + '</button>').join('');
    const opts = (() => {
      const groups = {};
      lootItems().forEach(([sec, it]) => { const g = sec.id === 'weapons' ? 'Оружие' : 'Предметы и патроны'; (groups[g] = groups[g] || []).push([sec, it]); });
      return Object.keys(groups).map((g) => '<optgroup label="' + g + '">' + groups[g].sort((a, b) => a[1].title.localeCompare(b[1].title, 'ru'))
        .map(([sec, it]) => { const v = sec.id + '/' + it.id; return '<option value="' + esc(v) + '"' + (v === lootRef ? ' selected' : '') + '>' + esc(it.title) + '</option>'; }).join('') + '</optgroup>').join('');
    })();
    const towns = M.towns.slice().sort((a, b) => a.name.localeCompare(b.name, 'ru'));
    const card = (r) => '<div class="route-card ' + r.verdict + '"><div class="rc-title">' + (r.verdict === 'good' ? '✅ ' : '❌ ') + esc(r.title) + '</div>' +
      DM.routeHTML(r) + '<button class="btn" data-route="' + esc(r.id) + '">🧭 Показать на карте</button></div>';
    $view.innerHTML = '<div class="map-page">' +
      '<div class="chips map-layers">' + chips + '</div>' +
      '<div class="map-wrap"><div class="map-ctrl">' +
        '<button data-zoom="in" aria-label="Приблизить">+</button><button data-zoom="out" aria-label="Отдалить">−</button>' +
        '<button data-zoom="fit" aria-label="Вся карта">⤢</button><button data-zoom="legend" aria-label="Обозначения">?</button>' +
        '<button data-mode="me" aria-label="Отметить, где я">📍</button><button data-mode="draw" aria-label="Нарисовать маршрут">✏️</button>' +
      '</div><div class="map-mode" hidden></div><div class="map-tip" hidden></div><div class="map-legend" hidden></div><div class="map-sheet" hidden></div></div>' +
      '<p class="map-credit">Карта: © Bohemia Interactive, <a href="https://github.com/BohemiaInteractive/DayZ-Central-Economy" target="_blank" rel="noopener">DayZ Central Economy</a>, лицензия <a href="https://www.bohemia.net/community/licenses/arma-and-dayz-public-license-share-alike-adpl-sa" target="_blank" rel="noopener">ADPL-SA</a>. Доработка: STROM.</p>' +
      '<datalist id="townList">' + towns.map((t) => '<option value="' + esc(t.name) + '">' + esc(t.en || '') + '</option>').join('') + '</datalist>' +
      '<h2 class="g-head"><span class="g-ico">📍</span>Где я и куда иду</h2>' +
      '<div class="nav-box"><label>Я у города (с таблички)<input id="meIn" list="townList" autocomplete="off" placeholder="Например: Горка"></label>' +
        '<label>Иду в<input id="destIn" list="townList" autocomplete="off" placeholder="Например: Новый Собор"></label></div>' +
      '<p class="nav-tip">Или нажми 📍 на карте и поставь точку сам.</p><div id="navInfo"></div>' +
      '<h2 class="g-head"><span class="g-ico">✏️</span>Свой маршрут</h2><div id="mineInfo"></div>' +
      '<h2 class="g-head"><span class="g-ico">🔎</span>Где найти предмет</h2>' +
      '<div class="loot-pick"><select id="lootSel" aria-label="Предмет"><option value="">— выбери предмет —</option>' + opts + '</select></div><div id="lootInfo">' + lootResult(lootRef) + '</div>' +
      '<h2 class="g-head"><span class="g-ico">✅</span>Хорошие маршруты для кепки</h2>' + M.routes.filter((r) => r.verdict === 'good').map(card).join('') +
      '<h2 class="g-head"><span class="g-ico">❌</span>Частые ошибки новичков</h2>' + M.routes.filter((r) => r.verdict !== 'good').map(card).join('') +
      '<p class="map-note">' + esc(M.note) + ' ' + esc(M.loot_note || '') + ' Проверено: ' + esc(M.checked) + '.</p>' + footer() + '</div>';

    const page = $view.querySelector('.map-page'), wrap = page.querySelector('.map-wrap');
    const toMap = () => { document.body.classList.remove('bar-hide'); window.scrollTo({ top: Math.max(0, wrap.getBoundingClientRect().top + window.scrollY - (document.getElementById('topbar').offsetHeight || 0) - 8), behavior: 'smooth' }); };
    const modeBar = page.querySelector('.map-mode'), navInfo = document.getElementById('navInfo'), mineInfo = document.getElementById('mineInfo');
    const meIn = document.getElementById('meIn'), destIn = document.getElementById('destIn');
    const line = (ico, label, q) => (q ? '<button class="pl-btn" data-go="' + q.x + ',' + q.z + '"><span>' + ico + ' ' + label + (q.name ? ': ' + esc(q.name) : '') + '</span><span class="nav-d">' + km(Math.max(0, q.d)) + ' · ' + q.b.dir + '</span></button>' : '');
    const bindGo = (root) => root.querySelectorAll('[data-go]').forEach((b) => b.addEventListener('click', () => { const [x, z] = b.dataset.go.split(',').map(Number); toMap(); DM.flyTo(x, z); }));
    const dangerHTML = (list) => list.map((d) => '<div class="nav-warn">' + (d.kind === 'gas' ? '☣️ Идёшь через газ: ' : '⚠️ Рядом военка: ') + esc(d.name) + '. Обойди круг стороной.</div>').join('');
    const onState = (s) => {
      page.querySelectorAll('[data-mode]').forEach((b) => b.classList.toggle('on', s.mode === b.dataset.mode));
      modeBar.hidden = !s.mode;
      modeBar.innerHTML = s.mode === 'me' ? '<span>Нажми на карту там, где ты сейчас</span><button data-m="off">Отмена</button>'
        : s.mode === 'draw' ? '<span>Нажимай точки маршрута · ' + (s.mine.length > 1 ? km(DM.lineKm(s.mine) * 1000) : s.mine.length + ' точ.') + '</span><button data-m="undo">↩︎</button><button data-m="off">Готово</button>' : '';
      modeBar.querySelectorAll('[data-m]').forEach((b) => b.addEventListener('click', () => (b.dataset.m === 'undo' ? DM.undo() : DM.setMode(null))));
      if (s.me) {
        const a = DM.around(s.me), inD = a.danger && a.danger.d <= 0;
        let h = '<div class="nav-card"><div class="nav-top"><b>📍 ' + esc(s.me.name) + '</b><button class="lb-x" data-x="me" aria-label="Убрать метку">✕</button></div>' +
          (a.tier ? '<div class="tip-tier t' + a.tier + '">Зона лута: Tier ' + a.tier + '</div>' : '') +
          (inD ? '<div class="nav-warn">' + (a.danger.kind === 'gas' ? '☣️ Ты в газовой зоне: ' : '⚠️ Ты в опасной зоне: ') + esc(a.danger.name) + '. Уходи.</div>' : '');
        if (s.dest) {
          const b = DM.bearing(s.me, s.dest);
          h += '<div class="nav-dest">🏁 ' + esc(s.dest.name) + ': <b>' + km(DM.dist(s.me, s.dest)) + '</b> по прямой, держи на <b>' + b.dir + ' (' + b.deg + '°)</b></div>' +
            dangerHTML(DM.dangersOn([[s.me.x, s.me.z], [s.dest.x, s.dest.z]])) + '<button class="btn nav-clear" data-x="dest">Убрать цель</button>';
        }
        h += '<div class="pl-tier">Ближайшее от тебя</div>' + (a.town && a.town.d > 150 ? line('🏘️', 'Посёлок', a.town) : '') + line('💧', 'Колонка', a.water) + line('✚', 'Медицина', a.medical) + line('🚓', 'Полиция', a.police) +
          (a.danger && !inD ? line(a.danger.kind === 'gas' ? '☣️' : '⚠️', 'Опасно', a.danger) : '') + '</div>';
        navInfo.innerHTML = h; bindGo(navInfo);
        navInfo.querySelectorAll('[data-x]').forEach((b) => b.addEventListener('click', () => { if (b.dataset.x === 'me') { meIn.value = ''; destIn.value = ''; DM.setDest(null); DM.setMe(null); } else { destIn.value = ''; DM.setDest(null); } }));
      } else navInfo.innerHTML = s.dest ? '<p class="lb-note">Теперь укажи, где ты — покажу направление и опасные места по пути.</p>' : '';
      if (s.mine.length) {
        mineInfo.innerHTML = '<div class="nav-card"><div class="nav-dest">Точек: <b>' + s.mine.length + '</b>' + (s.mine.length > 1 ? ' · длина <b>' + km(DM.lineKm(s.mine) * 1000) + '</b>' : '') + '</div>' + dangerHTML(DM.dangersOn(s.mine)) +
          '<div class="mine-act"><button class="btn" data-a="show">🗺️ Показать</button><button class="btn" data-a="draw">✏️ Дорисовать</button><button class="btn" data-a="share"' + (s.mine.length > 1 ? '' : ' disabled') + '>📤 Другу</button><button class="btn" data-a="clear">🗑️ Стереть</button></div></div>';
        mineInfo.querySelectorAll('[data-a]').forEach((b) => b.addEventListener('click', () => {
          const a = b.dataset.a;
          if (a === 'clear') { if (confirm('Стереть свой маршрут?')) DM.clearMine(); }
          else if (a === 'draw') { toMap(); DM.setMode('draw'); }
          else if (a === 'show') { toMap(); DM.fitMine(); }
          else { const m = DM.getState().mine; shareSheet({ id: 'my-route', title: 'Маршрут в DayZ', text: 'Мой маршрут в DayZ, ' + km(DM.lineKm(m) * 1000), url: location.href.split('#')[0] + '#map?my=' + m.slice(0, 60).map((q) => Math.round(q[0] / 10) + '.' + Math.round(q[1] / 10)).join('_') }); }
        }));
      } else {
        mineInfo.innerHTML = '<p class="lb-note">Нарисуй путь прямо на карте: он сохранится на телефоне, и его можно отправить другу.</p><button class="btn mine-start">✏️ Нарисовать маршрут</button>';
        mineInfo.querySelector('button').addEventListener('click', () => { toMap(); DM.setMode('draw'); });
      }
    };
    const nav = (id) => { const h = '#map' + (id ? '/' + id : ''); if (h !== (location.hash || '#') && !(!id && /\?/.test(location.hash))) { replaceHash(h); if (id) trackView('/map/' + id); } };
    DM.mount(page, M, focusId, nav, lootFilter(lootRef), onState);
    onState(DM.getState());
    page.querySelectorAll('[data-mode]').forEach((b) => b.addEventListener('click', () => DM.setMode(DM.getState().mode === b.dataset.mode ? null : b.dataset.mode)));
    const pick = (inp, fn) => inp.addEventListener('change', () => { if (!inp.value.trim()) return fn(null); const t = findTown(inp.value); if (!t) return toast('Не нашёл такой город'); inp.value = t.name; inp.blur(); fn(t); });
    pick(meIn, (t) => { DM.setMe(t && { x: t.x, z: t.z, name: t.name }); if (t) { toMap(); const s = DM.getState(); if (s.dest) DM.setDest(s.dest); else DM.flyTo(t.x, t.z, 3600); trackEvent('map-me', { town: t.name }); } });
    pick(destIn, (t) => { DM.setDest(t && { x: t.x, z: t.z, name: t.name }); if (t) { toMap(); if (!DM.getState().me) DM.flyTo(t.x, t.z, 3600); } });
    const sel = document.getElementById('lootSel'), info = document.getElementById('lootInfo');
    bindGo(info);
    sel.addEventListener('change', () => {
      info.innerHTML = lootResult(sel.value); bindGo(info); DM.setLoot(lootFilter(sel.value));
      replaceHash('#map' + (sel.value ? '?loot=' + sel.value : ''));
      if (sel.value) { toMap(); trackEvent('map-loot', { item: sel.value }); }
    });
    page.querySelectorAll('[data-route]').forEach((b) => b.addEventListener('click', () => DM.select(b.dataset.route)));
    if (shared) {
      const pts = shared.split('_').map((q) => q.split('.').map((n) => +n * 10)).filter((q) => q.length === 2 && q.every((n) => n >= 0 && n <= M.size)).slice(0, 60);
      const had = DM.getState().mine.length;
      if (pts.length > 1) setTimeout(() => { if (!had || confirm('Открыть маршрут из ссылки? Твой нарисованный маршрут заменится.')) DM.setMine(pts); replaceHash('#map'); }, 60);
    }
    if (state.mapVec) DM.setVectors(state.mapVec);
    else getJSON('data/map-vec.json').then((v) => { state.mapVec = v; DM.setVectors(v); }).catch((e) => console.warn('map-vec', e));
  }

  // ---------- серверы ----------
  function viewServers() {
    setChrome('Серверы', null, true);
    const S = state.servers;
    if (!S) { $view.innerHTML = '<div class="empty">Не удалось загрузить список серверов.</div>'; return; }
    const guide = state.byId.srv;
    let n = 0;
    const card = (sv) => {
      const i = n++;
      return '<div class="srv" data-i="' + i + '">' +
        '<div class="srv-top"><span class="srv-flag">' + sv.flag + '</span><span class="srv-name">' + esc(sv.name) + '</span></div>' +
        '<div class="srv-live" data-live>⏳ Узнаю онлайн…</div>' +
        '<div class="srv-tags">' + sv.tags.map((t) => '<span>' + esc(t) + '</span>').join('') + '</div>' +
        '<p class="srv-why">' + esc(sv.why) + '</p>' +
        '<div class="srv-act"><button class="btn" data-copy="' + esc(sv.search) + '">🔎 Скопировать «' + esc(sv.search) + '»</button>' +
        '<button class="btn srv-ip" data-copy="' + esc(sv.ip + ':' + sv.port) + '">IP ' + esc(sv.ip + ':' + sv.port) + '</button></div></div>';
    };
    const all = [];
    let html = '<p class="help-intro">Подборка серверов для старта: Чернарусь, без модов, подключаются прямо из игры. Онлайн и время суток — живые. Ниже — как выбрать сервер самому.</p>' +
      '<button class="btn srv-refresh" data-refresh>🔄 Обновить онлайн</button>';
    S.groups.forEach((g) => {
      html += '<h2 class="g-head"><span class="g-ico">' + g.icon + '</span>' + esc(g.title) + '</h2><p class="srv-gtext">' + esc(g.text) + '</p>' +
        g.servers.map((sv) => { all.push(sv); return card(sv); }).join('');
    });
    if (guide) html += '<h2 class="g-head"><span class="g-ico">📖</span>Как выбрать сервер</h2><div class="list">' + guide.items.map((it) => row(guide, it, false)).join('') + '</div>';
    html += '<p class="map-note">' + esc(S.note) + ' Подборка проверена: ' + esc(S.checked) + '.</p>' + footer();
    $view.innerHTML = html;
    $view.querySelectorAll('[data-copy]').forEach((b) => b.addEventListener('click', async () => {
      const ok = await copyText(b.dataset.copy);
      toast(ok ? 'Скопировано: ' + b.dataset.copy : 'Не получилось скопировать');
    }));
    const load = () => all.forEach((sv, i) => {
      const box = $view.querySelector('.srv[data-i="' + i + '"] [data-live]');
      if (!box) return;
      box.className = 'srv-live'; box.textContent = '⏳ Узнаю онлайн…';
      const ctl = new AbortController(); const tm = setTimeout(() => ctl.abort(), 9000);
      fetch(S.api + sv.ip + '/' + sv.q, { signal: ctl.signal }).then((r) => r.json()).then((j) => {
        clearTimeout(tm);
        const d = j && j.result;
        if (!d || j.status !== 0) throw new Error('no data');
        const h = parseInt(String(d.time || '').split(':')[0], 10);
        const day = h >= 6 && h < 20;
        const fill = d.maxPlayers ? d.players / d.maxPlayers : 0;
        const lvl = d.players === 0 ? 'empty' : fill < 0.6 ? 'ok' : fill < 0.9 ? 'busy' : 'full';
        box.className = 'srv-live ' + lvl;
        box.innerHTML = '<b>👥 ' + d.players + ' / ' + d.maxPlayers + '</b>' +
          '<span>' + (isNaN(h) ? '' : (day ? '☀️ день' : '🌙 ночь') + ' · ' + esc(d.time) + ' в игре') + '</span>' +
          '<span>' + (d.firstPersonOnly ? '1PP' : '3PP') + (d.password ? ' · 🔒 пароль' : '') + (d.mods && d.mods.length ? ' · моды: ' + d.mods.length : '') + '</span>';
      }).catch(() => { clearTimeout(tm); box.className = 'srv-live off'; box.textContent = '⚪ Не удалось узнать онлайн — сервер выключен или нет интернета.'; });
    });
    $view.querySelector('[data-refresh]').addEventListener('click', load);
    load();
  }

  // ---------- тест «Какой ты игрок» ----------
  const QUIZ_BEST = 'dz_quiz_best';
  function quizLevel(score) {
    const L = state.quiz.levels.slice().sort((a, b) => a.min - b.min);
    let lv = L[0];
    for (const l of L) if (score >= l.min) lv = l;
    return lv;
  }
  function shuffle(a) { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }
  function viewQuiz(params) {
    setChrome('Проверь себя', null, true);
    const Q = state.quiz;
    if (!Q) { $view.innerHTML = '<div class="empty">Не удалось загрузить тест.</div>'; return; }
    const shared = params && params.get('r');
    const best = store.get(QUIZ_BEST, null);
    const intro = () => {
      let html = '<div class="quiz"><div class="qz-hero"><div class="qz-big">🧠</div><h2>' + esc(Q.title) + '</h2><p>' + esc(Q.intro) + '</p>';
      if (shared && /^\d{1,2}$/.test(shared)) { const lv = quizLevel(+shared); html += '<div class="qz-shared">Твой друг набрал <b>' + esc(shared) + ' из ' + Q.count + '</b> — ' + lv.icon + ' ' + esc(lv.title) + '. Сможешь лучше?</div>'; }
      html += '<div class="qz-levels">' + Q.levels.map((l) => '<span>' + l.icon + ' ' + esc(l.title) + '</span>').join('') + '</div>' +
        '<button class="btn qz-go" data-start>Начать тест</button>' +
        (best != null ? '<p class="qz-best">Твой лучший результат: <b>' + best + ' из ' + Q.count + '</b> — ' + quizLevel(best).icon + ' ' + esc(quizLevel(best).title) + '</p>' : '') +
        '</div></div>' + footer();
      $view.innerHTML = html;
      $view.querySelector('[data-start]').addEventListener('click', start);
    };
    let qs, i, score, wrong;
    const start = () => {
      qs = shuffle(Q.questions).slice(0, Q.count).map((q) => ({ ...q, opts: shuffle(q.a.map((t, k) => ({ t, ok: k === 0 }))) }));
      i = 0; score = 0; wrong = [];
      trackEvent('quiz-start', {});
      ask();
    };
    const ask = () => {
      const q = qs[i];
      $view.innerHTML = '<div class="quiz"><div class="qz-top"><span>Вопрос ' + (i + 1) + ' из ' + qs.length + '</span><span>✅ ' + score + '</span></div>' +
        '<div class="progress"><i style="width:' + Math.round(i / qs.length * 100) + '%"></i></div>' +
        '<h2 class="qz-q">' + esc(q.q) + '</h2>' +
        '<div class="qz-opts">' + q.opts.map((o, k) => '<button class="qz-opt" data-k="' + k + '">' + esc(o.t) + '</button>').join('') + '</div>' +
        '<div class="qz-why" hidden></div></div>';
      window.scrollTo(0, 0);
      $view.querySelectorAll('.qz-opt').forEach((b) => b.addEventListener('click', () => answer(+b.dataset.k)));
    };
    const answer = (k) => {
      const q = qs[i], ok = q.opts[k].ok;
      if (ok) score++; else wrong.push(q);
      $view.querySelectorAll('.qz-opt').forEach((b, n) => {
        b.disabled = true;
        if (q.opts[n].ok) b.classList.add('ok'); else if (n === k) b.classList.add('bad');
      });
      $view.querySelector('.qz-top span:last-child').textContent = '✅ ' + score;
      const why = $view.querySelector('.qz-why');
      why.innerHTML = '<b>' + (ok ? '✅ Верно!' : '❌ Не совсем.') + '</b> ' + esc(q.why) +
        '<button class="btn qz-next">' + (i + 1 < qs.length ? 'Дальше' : 'Узнать результат') + '</button>';
      why.hidden = false;
      why.querySelector('.qz-next').addEventListener('click', () => { i++; if (i < qs.length) ask(); else result(); });
      why.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    };
    const result = () => {
      const lv = quizLevel(score);
      const prev = store.get(QUIZ_BEST, null);
      if (prev == null || score > prev) store.set(QUIZ_BEST, score);
      trackEvent('quiz-done', { score, level: lv.title });
      const seen = new Set();
      const tips = wrong.filter((q) => { if (seen.has(q.card)) return false; seen.add(q.card); return !!cardById(q.card); }).map((q) => {
        const [sec, it] = cardById(q.card);
        return '<a class="qz-tip" href="#' + esc(q.card) + '">' + esc(sec.icon) + ' ' + esc(it.title) + '</a>';
      }).join('');
      $view.innerHTML = '<div class="quiz"><div class="qz-result"><div class="qz-big">' + lv.icon + '</div>' +
        '<div class="qz-score">' + score + ' из ' + qs.length + '</div><h2>' + esc(lv.title) + '</h2><p>' + esc(lv.text) + '</p>' +
        '<button class="btn qz-go" data-share>📤 Поделиться результатом</button>' +
        '<button class="btn qz-again" data-again>🔄 Пройти ещё раз</button></div>' +
        (tips ? '<div class="h-section">Почитай, где ошибся</div><div class="qz-tips">' + tips + '</div>' : '') +
        '</div>' + footer();
      window.scrollTo(0, 0);
      $view.querySelector('[data-again]').addEventListener('click', start);
      $view.querySelector('[data-share]').addEventListener('click', () => {
        const url = location.href.split('#')[0] + '#quiz?r=' + score;
        const text = 'Мой уровень в DayZ: ' + lv.icon + ' ' + lv.title + ' (' + score + ' из ' + qs.length + '). А ты сможешь лучше?';
        shareSheet({ id: 'quiz', title: Q.title, text, url });
      });
    };
    intro();
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
    document.body.classList.toggle('is-home', tab === 'home');
    document.body.classList.remove('bar-hide');
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
    else if (parts[0] === 'map') viewMap(parts[1], params);
    else if (parts[0] === 'help') viewHelp(params);
    else if (parts[0] === 'patch') viewPatch(parts[1]);
    else if (parts[0] === 'quiz') viewQuiz(params);
    else if (parts[0] === 'servers') viewServers();
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

  // ---------- верхняя полоса прячется при прокрутке вниз ----------
  (() => {
    let lastY = window.scrollY, ticking = false;
    window.addEventListener('scroll', () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        const y = window.scrollY, dy = y - lastY;
        if (y < 40 || dy < -6) document.body.classList.remove('bar-hide');
        else if (dy > 6) document.body.classList.add('bar-hide');
        if (Math.abs(dy) > 6) lastY = y;
        ticking = false;
      });
    }, { passive: true });
  })();

  // ---------- обновления приложения ----------
  if ('serviceWorker' in navigator && location.protocol !== 'file:') {
    const hadController = !!navigator.serviceWorker.controller;
    let reg = null, lastCheck = 0, shown = false;
    const check = () => { if (reg && Date.now() - lastCheck > 60e3) { lastCheck = Date.now(); reg.update().catch(() => {}); } };
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('sw.js').then((r) => { reg = r; lastCheck = Date.now(); }).catch((e) => console.warn('SW не зарегистрирован', e));
    });
    // приложение с экрана «Домой» часто просто разворачивается из фона — проверяем обновление при каждом открытии
    document.addEventListener('visibilitychange', () => { if (document.visibilityState === 'visible') check(); });
    navigator.serviceWorker.addEventListener('controllerchange', () => {
      if (!hadController || shown) return;
      shown = true;
      const bar = document.createElement('div');
      bar.className = 'upd-bar';
      bar.innerHTML = '<span>⚡ Вышла новая версия гайда</span><button>Обновить</button>';
      bar.querySelector('button').addEventListener('click', () => location.reload());
      document.body.appendChild(bar);
    });
    window.dzCheckUpdate = async () => {
      try {
        const r = reg || await navigator.serviceWorker.getRegistration();
        if (r) await r.update();
      } catch (e) { /* нет сети */ }
      // если обновление не пришло само — чистим кэш и перезагружаем: при интернете всё скачается заново
      if (navigator.onLine === false) { toast('Нет интернета — обновиться не получится'); return; }
      try { for (const k of await caches.keys()) if (k.startsWith('dayz-guide-')) await caches.delete(k); } catch (e) { /* ignore */ }
      try { const r2 = reg || await navigator.serviceWorker.getRegistration(); if (r2) await r2.unregister(); } catch (e) { /* ignore */ }
      location.reload();
    };
  }
})();
