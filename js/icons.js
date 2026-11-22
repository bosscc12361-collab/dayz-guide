/* Свои иконки DayZ Guide: сетка 24×24, линия 2.
   В данных можно писать эмодзи: они сами заменяются на иконки из набора (см. EMOJI). Неизвестные эмодзи скрываются. */
(function () {
  'use strict';
  const I = {
    map: '<path d="M2 5l7-3 6 3 7-3v17l-7 3-6-3-7 3zM9 2v17M15 5v17"/>',
    star: '<path d="M12 2.5l2.9 6.3 6.8.8-5.1 4.7 1.4 6.7L12 17.6 6 21l1.4-6.7L2.3 9.6l6.8-.8z"/>',
    bookmark: '<path d="M5 3h14v18l-7-5-7 5z"/>',
    share: '<path d="M12 15V3M7 8l5-5 5 5M4 14v7h16v-7"/>',
    check: '<path d="M4 13l5 5L20 6"/>',
    cross: '<path d="M5 5l14 14M19 5L5 19"/>',
    med: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    gas: '<circle cx="12" cy="12" r="3"/><path d="M12 9V3M9.4 13.5L4.2 16.5M14.6 13.5l5.2 3M7 5a7 7 0 0 0-4 8M17 5a7 7 0 0 1 4 8M8 20a7.5 7.5 0 0 0 8 0"/>',
    wait: '<path d="M6 2h12M6 22h12M7 2c0 6 4 7 5 10-1 3-5 4-5 10M17 2c0 6-4 7-5 10 1 3 5 4 5 10"/>',
    warn: '<path d="M12 3l10 18H2zM12 10v5M12 17.5v1"/>',
    bolt: '<path d="M14 2L4 14h7l-2 8L20 9h-7z"/>',
    refresh: '<path d="M20 6v5h-5M4 18v-5h5M19 11a7.5 7.5 0 0 0-13-4M5 13a7.5 7.5 0 0 0 13 4"/>',
    police: '<path d="M12 2l9 3v7c0 5-4 8-9 10-5-2-9-5-9-10V5zM9.5 16V8H13a2.5 2.5 0 0 1 0 5H9.5"/>',
    city: '<path d="M3 21V9h7v12M10 21V3h7v18M17 21V11h4v10M2 21h20M13 7h1M13 11h1M13 15h1M6 13h1M6 17h1"/>',
    village: '<path d="M2 21V12l6-5 6 5v9M14 14l3-3 5 4v6M1 21h22M7 21v-5h3v5"/>',
    house: '<path d="M3 21V10l9-7 9 7v11zM10 21v-6h4v6"/>',
    compass: '<circle cx="12" cy="12" r="9.5"/><path d="M16 8l-2.5 5.5L8 16l2.5-5.5z"/>',
    pencil: '<path d="M3 21l1-5L16 4l4 4L8 20zM14 6l4 4"/>',
    pin: '<path d="M12 22c5-6 7-9 7-12a7 7 0 0 0-14 0c0 3 2 6 7 12z"/><circle cx="12" cy="10" r="2.5"/>',
    target: '<circle cx="12" cy="12" r="7"/><path d="M12 1v6M12 17v6M1 12h6M17 12h6"/>',
    drop: '<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13z"/>',
    quiz: '<circle cx="12" cy="12" r="9.5"/><path d="M9 9.5a3 3 0 1 1 4 2.8c-.8.3-1 .9-1 2.2M12 16.8v1.2"/>',
    bulb: '<path d="M9 18h6M10 21h4M8 15c-2-1.5-3-3.5-3-6a7 7 0 0 1 14 0c0 2.5-1 4.5-3 6z"/>',
    search: '<circle cx="10.5" cy="10.5" r="7"/><path d="M16 16l6 6"/>',
    tent: '<path d="M12 4L2 20h20zM12 4l-2-2M12 4l2-2M12 11l-4 9M12 11l4 9"/>',
    people: '<circle cx="9" cy="8" r="4"/><path d="M1.5 21c0-5 3-7.5 7.5-7.5s7.5 2.5 7.5 7.5M16 4.5a4 4 0 0 1 0 7M18.5 14c2.5 1 4 3.5 4 7"/>',
    person: '<circle cx="12" cy="7" r="4"/><path d="M4 21c0-5.5 3-8 8-8s8 2.5 8 8"/>',
    copy: '<path d="M8 8h13v13H8zM16 8V3H3v13h5"/>',
    plane: '<path d="M22 2L2 10l7 3 3 8zM9 13L22 2"/>',
    chat: '<path d="M3 4h18v13H10l-6 4v-4H3z"/>',
    book: '<path d="M4 3h13l3 3v15H4zM8 3v18M11 9h6M11 13h6"/>',
    pulse: '<path d="M1 13h5l3-9 5 17 3-8h6"/>',
    server: '<path d="M2 3h20v7H2zM2 14h20v7H2zM6 6.5h3M6 17.5h3"/>',
    castle: '<path d="M3 21V4h4v3h3V4h4v3h3V4h4v17zM10 21v-6h4v6"/>',
    bars: '<path d="M3 3h18v18H3zM8 3v18M12 3v18M16 3v18"/>',
    mountain: '<path d="M1 20L9 6l5 8 3-4 6 10zM6.5 11l2.5 2 2-1.5"/>',
    wave: '<path d="M1 9c3-3 5-3 8 0s5 3 8 0 4-2.5 6-1M1 16c3-3 5-3 8 0s5 3 8 0 4-2.5 6-1"/>',
    cap: '<path d="M3 16a9 9 0 0 1 17-3l3 3zM3 16h20M10 4.5V3"/>',
    cart: '<path d="M1 3h4l3 13h11l3-9H6"/><circle cx="9.5" cy="20" r="1.5"/><circle cx="17.5" cy="20" r="1.5"/>',
    pack: '<path d="M5 10a7 7 0 0 1 14 0v11H5zM9 3.5V2h6v1.5M8 14h8v7H8zM10.5 14v2.5h3V14"/>',
    trash: '<path d="M3 6h18M8 6V3h8v3M5 6l1 15h12l1-15M10 10v7M14 10v7"/>',
    sun: '<circle cx="12" cy="12" r="4.5"/><path d="M12 1v3M12 20v3M1 12h3M20 12h3M4.5 4.5l2 2M17.5 17.5l2 2M19.5 4.5l-2 2M6.5 17.5l-2 2"/>',
    moon: '<path d="M20 14A8.5 8.5 0 1 1 10 4a7 7 0 0 0 10 10z"/>',
    lock: '<path d="M4 11h16v10H4zM8 11V7a4 4 0 0 1 8 0v4"/>',
    off: '<circle cx="12" cy="12" r="9"/><path d="M6 6l12 12"/>',
    flask: '<path d="M9 2h6M10 2v7L4 20a1 1 0 0 0 1 2h14a1 1 0 0 0 1-2L14 9V2M7 15h10"/>',
    church: '<path d="M12 1v6M9.5 3.5h5M12 7L6 12v9h12v-9zM10 21v-5h4v5"/>',
    antler: '<path d="M12 22v-8M12 14C7 13 5 10 5 4M12 14c5-1 7-4 7-10M6 8H2M18 8h4M8.5 11.5L8 6M15.5 11.5L16 6"/>',
    light: '<path d="M9 8h6l2 14H7zM8 8V5l4-3 4 3v3zM1 5l4 1M1 10l4-2M23 5l-4 1M23 10l-4-2M8 14h8"/>',
    fuel: '<path d="M3 22V3h10v19zM2 22h12M6 6h4v4H6zM13 11h2c1.5 0 2 1 2 2v4a2 2 0 0 0 4 0V8l-3-3"/>',
    rail: '<path d="M6 3h12v13H6zM6 10h12M9 19l-3 3M15 19l3 3M9 13h1M14 13h1M8 19h8"/>',
    antenna: '<path d="M12 10L7 22M12 10l5 12M9 17h6M12 10V8M7.5 11a6 6 0 0 1 0-8M16.5 11a6 6 0 0 0 0-8M4.5 13.5a10 10 0 0 1 0-13M19.5 13.5a10 10 0 0 0 0-13"/>',
    factory: '<path d="M2 21V10l6 4v-4l6 4V3h5l1 18zM6 17h2M11 17h2M16 17h1"/>',
    crane: '<path d="M8 22V2M4 22h8M8 4h14M8 4L2 8h6M18 4v6M16 10h4v4h-4zM8 9l8-5"/>',
    axe: '<path d="M4 22L15 8M12 5l6 6M11 3c4-2 8 0 10 4-2 1-3 2-4 4l-6-6z"/>',
    barn: '<path d="M2 21V9l4-5h12l4 5v12zM8 21v-8h8v8M8 13l8 8M16 13l-8 8"/>',
    eye: '<path d="M1 12c3-5 7-7.5 11-7.5S20 7 23 12c-3 5-7 7.5-11 7.5S4 17 1 12z"/><circle cx="12" cy="12" r="3"/>',
    flag: '<path d="M5 22V3h15l-4 5 4 5H5"/>',
    car: '<path d="M2 17v-5l3-1 2-5h10l2 5 3 1v5zM6 11h12"/><circle cx="7" cy="17.5" r="2"/><circle cx="17" cy="17.5" r="2"/>',
    heli: '<path d="M3 4h16M11 4v4M5 12a6 4.5 0 0 1 6-4h2c4 0 6 3 6 7H8c-2 0-3-1-3-3zM5 11H1V8M9 15v4M15 15v4M6 19h12"/>',
    saw: '<path d="M2 14l13-9 2 3 4 1-1 5-4 1zM4 13l2 3M8 10l2 3M12 8l2 3"/>',
    pick: '<path d="M4 21L14 9M3 8c5-5 12-6 18 0-4-2-8-2-9 0"/>',
    ship: '<path d="M2 15h20l-3 6H5zM5 15V9h10v6M9 9V4h4v5M15 11h4v4"/>',
    wheel: '<circle cx="12" cy="10" r="8"/><path d="M12 2v16M4 10h16M6.5 4.5l11 11M17.5 4.5l-11 11M12 10L7 22M12 10l5 12"/>',
    hotel: '<path d="M4 22V2h16v20zM8 6h2M14 6h2M8 10h2M14 10h2M8 14h2M14 14h2M10 22v-4h4v4"/>',
    school: '<path d="M12 3L1 9l11 6 11-6zM5 12v6c4 3 10 3 14 0v-6M21 10v7"/>',
    box: '<path d="M3 7l9-4 9 4v10l-9 4-9-4zM3 7l9 4 9-4M12 11v10"/>',
    ruler: '<path d="M2 16L16 2l6 6L8 22zM6 12l2 2M9 9l3 3M12 6l2 2"/>',
    spawn: '<circle cx="12" cy="12" r="8" stroke-dasharray="4 3"/><circle cx="12" cy="12" r="2"/>',
    track: '<path d="M8 2L5 22M16 2l3 20M7 7h10M6.5 12h11M5.8 17h12.4"/>',
    shield: '<path d="M12 2l9 3v7c0 5-4 8-9 10-5-2-9-5-9-10V5z"/>',
    meat: '<path d="M14 3a6.5 6.5 0 0 1 7 7c0 4-4 7-8 7-2 0-3-1-4-2L5 19l-2-1 1-1-1-1 4-4c-1-1-1-3 1-5 2-2 4-4 6-4z"/><circle cx="15.5" cy="8.5" r="1.5"/>',
    can: '<path d="M5 5c0-3 14-3 14 0v14c0 3-14 3-14 0zM5 5c0 3 14 3 14 0M5 11h14M5 16h14"/>',
    thermo: '<path d="M9 14V4a3 3 0 0 1 6 0v10a5 5 0 1 1-6 0zM12 8v9"/>',
    blood: '<path d="M12 2c4 6 7 9 7 13a7 7 0 0 1-14 0c0-4 3-7 7-13zM9 15a3 3 0 0 0 3 3"/>',
    heart: '<path d="M12 21S2 15 2 8.5A5 5 0 0 1 12 6a5 5 0 0 1 10 2.5C22 15 12 21 12 21z"/>',
    microbe: '<circle cx="12" cy="12" r="5.5"/><path d="M12 6.5V2M12 22v-4.5M6.5 12H2M22 12h-4.5M8 8L5 5M19 19l-3-3M16 8l3-3M5 19l3-3"/>',
    clock: '<circle cx="12" cy="13" r="8.5"/><path d="M12 8v5l3 3M9 2h6"/>',
    keys: '<path d="M2 6h20v13H2zM5 10h2M9 10h2M13 10h2M17 10h2M6 15h12"/>',
    hud: '<path d="M12 12S7 9 7 5.5A2.7 2.7 0 0 1 12 4a2.7 2.7 0 0 1 5 1.5C17 9 12 12 12 12zM3 16h5v5H3zM10 16h5v5h-5zM17 16h4v5h-4z"/>',
    calendar: '<path d="M3 5h18v16H3zM3 10h18M8 2v5M16 2v5M7 14l2 2 4-4"/>',
    tools: '<path d="M3 21L14 10M13 6l4-4c4 0 6 2 6 5l-4 4zM3 3l6 6M3 6l3-3M15 15l6 6"/>',
    fire: '<path d="M2 21l20-4M2 17l20 4M12 1c1 4 6 6 6 10.5a6 6 0 0 1-12 0c0-2 1-3 2-4 1 2 2 2 3 2 0-3-1-5 1-8.5z"/>',
    zombie: '<circle cx="9" cy="4.5" r="3"/><path d="M9 7.5V15l-4 7M9 15l5 7M9 10l12-2M9 12.5l12 1"/>',
    gun: '<path d="M2 6h19v5h-9l-1 3H8l-1 6H3l1.5-9H2zM12 11v2.5H9"/>',
    hands: '<path d="M1 7l5-2 5 2 4-1 8 3v7l-3 1-7 4-8-5-4-1zM11 7L8 11c2 1.5 4 1 5-1l6 6"/>',
    play: '<path d="M6 3l15 9-15 9z"/>',
    swords: '<path d="M3 3l12 12M21 3L9 15M13 17l4-4 4 4M11 17l-4-4-4 4M18 18l3 3M6 18l-3 3M3 3v4M3 3h4M21 3v4M21 3h-4"/>',
    crown: '<path d="M3 19h18M3 16L2 6l6 4 4-7 4 7 6-4-1 10z"/>',
    official: '<path d="M2 9l10-6 10 6zM4 9v9M9 9v9M15 9v9M20 9v9M2 21h20"/>',
    calm: '<path d="M12 22c-6-2-9-6-9-12 5 0 8 3 9 6 1-3 4-6 9-6 0 6-3 10-9 12zM12 16V3M9 6l3-3 3 3"/>',
    wheat: '<path d="M12 22V8M12 8c-2-2-2-4 0-6 2 2 2 4 0 6zM12 14c-4 0-5-2-5-4 3 0 5 1 5 4zM12 14c4 0 5-2 5-4-3 0-5 1-5 4zM12 20c-4 0-5-2-5-4 3 0 5 1 5 4zM12 20c4 0 5-2 5-4-3 0-5 1-5 4z"/>',
    fresh: '<path d="M4 3h12l4 4v14H4zM8 8h6M8 12h8M8 16h5M16 3v4h4"/>',
    vomit: '<path d="M4 10a8 8 0 0 1 16 0v3H4zM8 9h1M15 9h1M8 13v7M12 13v9M16 13v6"/>',
    sneeze: '<path d="M14 2c1 5 4 7 4 11 0 2-2 3-4 3-1 2-3 3-5 3M6 12H2M7 15l-4 2M7 9L3 7"/>',
    mask: '<path d="M4 8l8-3 8 3v6l-8 6-8-6zM4 9H1M20 9h3M8 11h8M8 14h8"/>',
    laugh: '<circle cx="12" cy="12" r="9.5"/><path d="M7 13h10a5 5 0 0 1-10 0zM7 9l2-1 1 1M14 9l1-1 2 1"/>',
    hand: '<path d="M7 13V5a1.5 1.5 0 0 1 3 0v6V3a1.5 1.5 0 0 1 3 0v8V4.5a1.5 1.5 0 0 1 3 0V12 8a1.5 1.5 0 0 1 3 0v7c0 4-2 7-6 7-4 0-5-1-9-8a1.5 1.5 0 0 1 3-1z"/>',
    pain: '<circle cx="12" cy="12" r="9.5"/><path d="M6.5 9l3 1.5-3 1.5M17.5 9l-3 1.5 3 1.5M8 17c2-2 6-2 8 0"/>',
    leg: '<path d="M8 2h6l1 9-2 5v3l5 1v2H9v-6l-1-5zM8 11l7-1"/>',
    fog: '<path d="M2 6h14M5 10h17M2 14h16M6 18h14"/>',
    dizzy: '<circle cx="12" cy="12" r="9.5"/><path d="M7 8l3 3M10 8l-3 3M14 8l3 3M17 8l-3 3M9 16.5h6"/>',
    tired: '<path d="M2 8c4-4 8 2 12-1 2-1 2-4-1-4M2 13h16c4 0 4 5 1 5M2 18h9c3 0 3 4 1 4"/>',
    lungs: '<path d="M12 2v10M12 9c-2 0-3 2-3 4v7c-3 2-6 1-6-2 0-5 2-10 5-11 1 0 1 1 1 2M12 9c2 0 3 2 3 4v7c3 2 6 1 6-2 0-5-2-10-5-11-1 0-1 1-1 2"/>',
    cold: '<path d="M12 1v22M2.5 6.5l19 11M21.5 6.5l-19 11M9 3l3 3 3-3M9 21l3-3 3 3"/>',
    mute: '<path d="M3 9h4l6-5v16l-6-5H3zM17 9l5 6M22 9l-5 6"/>',
    square: '<path d="M4 6h16v12H4z"/>',
    tri: '<path d="M12 5l8 14H4z"/>',
    layers: '<path d="M12 2L1 9l11 7 11-7zM1 15l11 7 11-7"/>',
    home: '<path d="M3 3h8v8H3zM13 3h8v8h-8zM3 13h8v8H3zM13 13h8v8h-8z"/>',
    info: '<circle cx="12" cy="12" r="9.5"/><path d="M12 11v6M12 7v1"/>'
  };
  const EMOJI = {
    '🗺': 'map', '🎖': 'star', '★': 'star', '⭐': 'bookmark', '☆': 'bookmark', '📤': 'share', '✅': 'check', '❌': 'cross', '✕': 'cross', '✚': 'med', '➕': 'med', '☣': 'gas',
    '⏳': 'wait', '⚠': 'warn', '⚡': 'bolt', '🔄': 'refresh', '🚓': 'police', '🏙': 'city', '🏘': 'village', '🏡': 'village', '🏠': 'house', '🧭': 'compass', '✏': 'pencil',
    '📍': 'pin', '📌': 'pin', '🎯': 'target', '💧': 'drop', '🧠': 'quiz', '❓': 'quiz', '💡': 'bulb', '🔎': 'search', '🏕': 'tent', '👥': 'people', '📋': 'copy', '✈': 'plane',
    '💬': 'chat', '📘': 'book', '📖': 'book', '📚': 'book', '🩺': 'pulse', '🖥': 'server', '🏰': 'castle', '⛓': 'bars', '⛰': 'mountain', '🌊': 'wave', '🧢': 'cap', '🛒': 'cart',
    '🎒': 'pack', '🗑': 'trash', '☀': 'sun', '🌙': 'moon', '🔒': 'lock', '⚪': 'off', '👆': 'hand', '🧪': 'flask', '⛪': 'church', '🦌': 'antler', '🗼': 'light', '⛽': 'fuel',
    '🚉': 'rail', '🚂': 'rail', '📡': 'antenna', '🏭': 'factory', '🏗': 'crane', '🚒': 'axe', '🐄': 'barn', '👁': 'eye', '🏁': 'flag', '🚗': 'car', '🚙': 'car', '🚁': 'heli',
    '🪚': 'saw', '⛏': 'pick', '🚢': 'ship', '🎡': 'wheel', '🏨': 'hotel', '🏫': 'school', '📦': 'box', '▣': 'box', '📏': 'ruler', '🟢': 'spawn', '🛤': 'track', '🛡': 'shield',
    '🍖': 'meat', '🥫': 'can', '🌡': 'thermo', '🩸': 'blood', '❤': 'heart', '🦠': 'microbe', '⏱': 'clock', '⌨': 'keys', '🩻': 'hud', '📅': 'calendar', '🛠': 'tools', '🔥': 'fire',
    '🧟': 'zombie', '🔫': 'gun', '🤝': 'people', '🚀': 'play', '⚔': 'swords', '👑': 'crown', '🏛': 'official', '🕊': 'calm', '🌾': 'wheat', '🆕': 'fresh', '🤮': 'vomit', '🤧': 'sneeze',
    '😷': 'mask', '🥵': 'thermo', '😂': 'laugh', '🤲': 'hand', '😣': 'pain', '🦵': 'leg', '🌫': 'fog', '😵': 'dizzy', '😮': 'tired', '🫁': 'lungs', '🥶': 'cold', '🔇': 'mute',
    '▴': 'tri', '☰': 'layers'
  };
  const svg = (n, cls) => (I[n] ? '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true">' + I[n] + '</svg>' : '');
  // эмодзи: один символ с вариациями и склейками; флаги — пара региональных букв
  const RX = /(?:[\u{1F1E6}-\u{1F1FF}]{2})|(?:[\u{1F000}-\u{1FAFF}☀-➿⭐⌚-⏿■-◿](?:️|⃣)?(?:‍[\u{1F000}-\u{1FAFF}☀-➿]️?)*)/gu;
  const KEEP = new Set(['▲', '▼', '●', '■']);
  const SKIP = { SCRIPT: 1, STYLE: 1, OPTION: 1, TEXTAREA: 1, INPUT: 1, TITLE: 1 };
  function swap(t) {
    const s = t.nodeValue;
    RX.lastIndex = 0;
    if (!s || !RX.test(s)) return;
    let p = t.parentNode;
    if (!p || SKIP[p.nodeName] || (p.namespaceURI && p.namespaceURI.indexOf('svg') > 0)) return;
    RX.lastIndex = 0;
    const f = document.createDocumentFragment(); let last = 0, m;
    while ((m = RX.exec(s))) {
      if (KEEP.has(m[0])) continue;
      if (m.index > last) f.appendChild(document.createTextNode(s.slice(last, m.index)));
      last = m.index + m[0].length;
      const c0 = m[0].codePointAt(0);
      if (c0 >= 0x1F1E6 && c0 <= 0x1F1FF) {
        const cc = document.createElement('span'); cc.className = 'cc';
        cc.textContent = [...m[0]].map((c) => String.fromCharCode(c.codePointAt(0) - 0x1F1E6 + 65)).join('');
        f.appendChild(cc); continue;
      }
      const n = EMOJI[String.fromCodePoint(c0)];
      if (n) { const h = document.createElement('span'); h.innerHTML = svg(n); f.appendChild(h.firstChild); }
      else if (s[last] === ' ') last++;
    }
    if (!last) return;
    if (last < s.length) f.appendChild(document.createTextNode(s.slice(last)));
    p.replaceChild(f, t);
  }
  function walk(root) {
    if (root.nodeType === 3) { swap(root); return; }
    if (root.nodeType !== 1 || SKIP[root.nodeName]) return;
    const w = document.createTreeWalker(root, 4), list = [];
    while (w.nextNode()) list.push(w.currentNode);
    list.forEach(swap);
  }
  new MutationObserver((ms) => ms.forEach((m) => m.addedNodes.forEach(walk))).observe(document.documentElement, { childList: true, subtree: true });

  // силуэты: генерирует tools/gen_guns.py
  const G = {
    'mosin': '<path class="gb" d="M8 34L14 30Q44 28 66 35L90 28H264V38H156L98 45Q76 45 62 49L14 66Z"/><path class="ga" d="M90 24H308V28H90Z"/><path class="ga" d="M94 19H140L146 24H94Z"/><path class="gd" d="M160 19h24v5h-26z"/><path class="gd" d="M299 15h4v9h-4z"/><path class="gd" d="M118 26h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gd" d="M112 43h38l-5 12h-24z"/><path class="gl" d="M92 45q2 11 10 11t10 -11"/><path class="gk" d="M208 26h3v13h-3zM248 26h3v13h-3z"/>',
    'lee-enfield': '<path class="gb" d="M8 36L12 32Q46 30 66 36L90 29H296V35L284 37H150L98 45Q80 46 62 51L14 68Z"/><path class="ga" d="M296 29h14v4h-14z"/><path class="gb" d="M156 23H288V29H156Z"/><path class="ga" d="M92 20H152V29H92Z"/><path class="gd" d="M286 20h10v16h-10z"/><path class="gd" d="M110 41h34l3 20h-32z"/><path class="gd" d="M104 26h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M90 45q2 11 10 11t10 -11"/><path class="gk" d="M196 23h3v14h-3zM240 23h3v14h-3z"/><path class="gd" d="M90 14h8v7h-8z"/>',
    'vs89': '<path class="gb" d="M8 30H60L74 27H92V42H74L58 44V54H30V46H8Z"/><path class="ga" d="M88 24H172V38H88Z"/><path class="gb" d="M172 25H236V37H172Z"/><path class="ga" d="M236 27H292V32H236Z"/><path class="gd" d="M290 24h20v11h-20z"/><path class="gd" d="M84 38h18l-8 28h-17z"/><path class="gd" d="M130 38h28v16h-28z"/><path class="gd" d="M114 26h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M104 38q2 11 9 11t9 -11"/><path class="gd" d="M102 20H230V24H102Z"/><path class="gd" d="M116 10h60v8h-60zM106 7h12v14h-12zM174 5h20v18h-20z"/><path class="gk" d="M186 29h8v4h-8zM202 29h8v4h-8zM218 29h8v4h-8z"/>',
    'sks': '<path class="gb" d="M8 36L14 30Q44 30 64 34L86 28H226V37H150L98 44Q78 45 62 49L14 66Z"/><path class="ga" d="M86 19H150V28H86Z"/><path class="ga" d="M150 25H306V29H150Z"/><path class="gb" d="M160 18H210V25H160Z"/><path class="ga" d="M210 18h12v8h-12z"/><path class="gd" d="M298 13h4v12h-4zM286 22h8v8h-8z"/><path class="gd" d="M112 42h42l-10 14h-24z"/><path class="gd" d="M150 13h16l2 5h-18z"/><path class="gl" d="M92 44q2 11 10 11t10 -11"/><path class="gd" d="M222 33H296V36H222Z"/>',
    'cr527': '<path class="gb" d="M8 32L14 28Q44 26 66 35L90 28H226V38H156L98 45Q76 45 62 49L14 64Z"/><path class="ga" d="M90 25H300V29H90Z"/><path class="ga" d="M92 20H144V26H92Z"/><path class="gd" d="M112 42h28l-3 16h-22z"/><path class="gd" d="M106 26h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M92 45q2 11 10 11t10 -11"/><path class="gd" d="M122 10h50v7h-50zM112 7h12v13h-12zM170 5h16v16h-16zM130 17h5v5h-5zM158 17h5v8h-5z"/>',
    'ssg82': '<path class="gb" d="M8 32L14 28Q44 26 66 35L90 28H210V38H156L98 45Q76 45 62 49L14 64Z"/><path class="ga" d="M90 23H296V29H90Z"/><path class="ga" d="M92 18H150V28H92Z"/><path class="gd" d="M118 42h26l-2 12h-22z"/><path class="gd" d="M106 24h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M92 45q2 11 10 11t10 -11"/><path class="gd" d="M118 8h56v7h-56zM108 5h12v13h-12zM172 2h18v18h-18zM126 15h5v5h-5zM158 15h5v8h-5z"/><path class="gb" d="M40 24H78V31L44 32Z"/>',
    'savanna': '<path class="gb" d="M8 30L14 26Q44 24 66 35L90 28H222V38H156L98 45Q76 45 62 49L14 62Z"/><path class="ga" d="M90 24H302V29H90Z"/><path class="ga" d="M92 19H148V28H92Z"/><path class="gd" d="M120 42h28l-2 9h-24z"/><path class="gd" d="M106 25h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M92 45q2 11 10 11t10 -11"/><path class="gb" d="M44 22H76L80 31L46 32Z"/><path class="gd" d="M296 19h4v5h-4z"/>',
    'tundra': '<path class="gb" d="M8 34L14 30Q44 28 66 35L90 28H218V38H156L98 45Q76 45 62 49L14 66Z"/><path class="ga" d="M90 25H300V29H90Z"/><path class="ga" d="M92 20H150V28H92Z"/><path class="gd" d="M102 25h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M94 45q2 11 11 11t11 -11"/><path class="gk" d="M184 31h22v3h-22z"/><path class="gd" d="M292 19h5v6h-5zM176 21h10v4h-10z"/>',
    'pioneer': '<path class="gb" d="M8 34L14 28Q44 30 66 33L90 28H200V38H150L98 46Q78 47 62 49L14 62Z"/><path class="ga" d="M90 25H280V29H90Z"/><path class="ga" d="M92 18H158V28H92Z"/><path class="gd" d="M118 42h24l3 14h-24z"/><path class="gd" d="M106 24h6l3 15q5 3 2 8q-5 3 -8-2q-2-4 1-6z"/><path class="gl" d="M92 45q2 11 10 11t10 -11"/><path class="gd" d="M96 15H160V18H96Z"/><path class="gk" d="M170 31h24v3h-24z"/>',
    'bk18': '<path class="gb" d="M8 36L14 30Q50 30 72 33L96 30V44Q80 45 64 50L14 66Z"/><path class="ga" d="M94 22H142V44H100L94 40Z"/><path class="ga" d="M142 24H306V31H142Z"/><path class="gb" d="M146 31H216L208 40H146Z"/><path class="gl" d="M98 44q2 11 11 11t11 -11"/><path class="gd" d="M96 14l10 2v7h-8z"/><path class="gd" d="M298 19h4v5h-4zM176 20h10v4h-10z"/>',
    'blaze': '<path class="gb" d="M8 38L14 32Q50 30 72 33L94 30V43Q80 45 64 50L14 66Z"/><path class="ga" d="M92 22H144L150 40L104 44L92 38Z"/><path class="ga" d="M144 20H300V26H144Z"/><path class="gd" d="M144 27H300V33H144Z"/><path class="gb" d="M150 33H226L216 42H152Z"/><path class="gl" d="M98 43q2 11 13 11t13 -11"/><path class="gd" d="M296 15h4v5h-4z"/><path class="gk" d="M106 30h24v5h-24z"/>',
    'repeater': '<path class="gb" d="M8 38L16 32Q48 30 72 32L88 27V40Q76 42 62 48L16 66Z"/><path class="ga" d="M86 20H146V40H90Z"/><path class="ga" d="M146 22H304V27H146Z"/><path class="gb" d="M148 28H214V37H148Z"/><path class="ga" d="M214 29H290V34H214Z"/><path class="gl" d="M88 40q-18 2-14 14q4 10 18 2M92 42q6 14 22 12q8-2 8-12"/><path class="gd" d="M84 13l8 2v6h-8z"/><path class="gd" d="M296 16h4v6h-4zM170 18h10v4h-10z"/><path class="gk" d="M210 27h3v11h-3z"/>',
    'sporter': '<path class="gb" d="M8 38L14 32Q46 30 66 34L88 28H196V37H146L96 45Q78 46 62 50L14 66Z"/><path class="ga" d="M88 20H154V29H88Z"/><path class="ga" d="M154 24H286V28H154Z"/><path class="gd" d="M116 42h16l6 26l-14 2z"/><path class="gl" d="M92 45q2 11 11 11t11 -11"/><path class="gd" d="M278 18h4v6h-4z"/><path class="gk" d="M128 22h16v3h-16z"/>',
    'dmr': '<path class="gb" d="M8 32L14 28H56L86 27V43Q74 46 58 45L14 62Z"/><path class="ga" d="M80 20H154V36H84Z"/><path class="gb" d="M86 34H220V41H110L100 58H86Z"/><path class="gb" d="M154 24H222V36H154Z"/><path class="ga" d="M222 27H296V31H222Z"/><path class="gd" d="M292 24h18v10h-18z"/><path class="gd" d="M118 41h28l2 20h-27z"/><path class="gl" d="M100 41q2 11 9 11t9 -11"/><path class="gd" d="M106 8h58v8h-58zM96 5h12v14h-12zM162 3h20v18h-20zM118 16h6v5h-6zM148 16h6v5h-6z"/><path class="gd" d="M274 15h4v12h-6z"/>',
    'vsd': '<path class="gb" d="M8 28L66 24L84 34L78 50L70 48L64 40L34 44L30 50L12 54Z"/><path class="gk" d="M32 32L58 30L64 36L32 40Z"/><path class="ga" d="M80 18H156L162 24V40H86Z"/><path class="gb" d="M86 40H102L92 62L80 58Z"/><path class="gb" d="M162 21H226V37H162Z"/><path class="ga" d="M226 26H312V30H226Z"/><path class="gd" d="M120 40h28l2 18h-26z"/><path class="gd" d="M284 13h4v13h-8z"/><path class="gd" d="M110 4h50v8h-50zM98 1h14v14h-14zM158 2h14v12h-14zM124 12h16v7h-16z"/><path class="gl" d="M104 40q2 11 8 11t8 -11"/><path class="gk" d="M174 25h10v3h-10zM192 25h10v3h-10zM210 25h10v3h-10zM174 31h10v3h-10zM192 31h10v3h-10zM210 31h10v3h-10z"/><path class="gd" d="M300 24h12v8h-12z"/>',
    'kam': '<path class="gb" d="M8 28L70 24L84 26V38L70 40L22 54L10 56Z"/><path class="ga" d="M80 21Q84 16 98 16H150L162 20V40H84Z"/><path class="gb" d="M90 40H107L98 66L82 63Z"/><path class="gd" d="M126 40H152Q156 56 174 70L154 80Q132 64 126 40Z"/><path class="gb" d="M162 23H214V38H166L162 36Z"/><path class="gb" d="M162 15H214V22H162Z"/><path class="ga" d="M214 16h10l8 10h-18z"/><path class="ga" d="M214 26H304V31H214Z"/><path class="gd" d="M148 12h16l-2 5h-14z"/><path class="gl" d="M106 40q2 11 9 11t9 -11"/><path class="gk" d="M96 24h44v2h-44z"/><path class="gd" d="M276 12h5v14h-10z"/><path class="gd" d="M292 24h14v9h-10z"/>',
    'ka74': '<path class="gb" d="M8 28L70 24L84 26V38L70 40L22 54L10 56Z"/><path class="ga" d="M80 21Q84 16 98 16H150L162 20V40H84Z"/><path class="gb" d="M90 40H107L98 66L82 63Z"/><path class="gd" d="M128 40H152Q154 56 164 72L142 78Q130 60 128 40Z"/><path class="gb" d="M162 23H214V38H166L162 36Z"/><path class="gb" d="M162 15H214V22H162Z"/><path class="ga" d="M214 16h10l8 10h-18z"/><path class="ga" d="M214 26H308V31H214Z"/><path class="gd" d="M148 12h16l-2 5h-14z"/><path class="gl" d="M106 40q2 11 9 11t9 -11"/><path class="gk" d="M96 24h44v2h-44z"/><path class="gd" d="M276 12h5v14h-10z"/><path class="gd" d="M284 24h24v9h-24z"/>',
    'ka101': '<path class="gd" d="M8 28L70 24L84 26V38L70 40L22 54L10 56Z"/><path class="gk" d="M26 38L60 32V36L28 46Z"/><path class="ga" d="M80 21Q84 16 98 16H150L162 20V40H84Z"/><path class="gd" d="M90 40H107L98 66L82 63Z"/><path class="gd" d="M128 40H152Q153 56 158 72L136 76Q130 60 128 40Z"/><path class="gd" d="M162 23H214V38H166L162 36Z"/><path class="gd" d="M162 15H214V22H162Z"/><path class="ga" d="M214 16h10l8 10h-18z"/><path class="ga" d="M214 26H308V31H214Z"/><path class="gd" d="M148 12h16l-2 5h-14z"/><path class="gl" d="M106 40q2 11 9 11t9 -11"/><path class="gk" d="M96 24h44v2h-44z"/><path class="gd" d="M276 12h5v14h-10z"/><path class="gd" d="M284 24h24v9h-24z"/>',
    'kas74u': '<path class="gl" d="M84 26L16 24L10 52M84 36L12 50"/><path class="ga" d="M80 21Q84 16 98 16H150L162 20V40H84Z"/><path class="gb" d="M90 40H107L98 66L82 63Z"/><path class="gd" d="M128 40H152Q154 56 164 72L142 78Q130 60 128 40Z"/><path class="gb" d="M162 23H190V38H166L162 36Z"/><path class="gb" d="M162 15H190V22H162Z"/><path class="ga" d="M190 16h10l8 10h-18z"/><path class="ga" d="M190 26H252V31H190Z"/><path class="gd" d="M148 12h16l-2 5h-14z"/><path class="gl" d="M106 40q2 11 9 11t9 -11"/><path class="gk" d="M96 24h44v2h-44z"/><path class="gd" d="M222 16h6v10h-8z"/><path class="gd" d="M230 23l22-2v15l-22-2z"/>',
    'm16a2': '<path class="gd" d="M8 24L66 22V35L50 38L10 54Z"/><path class="ga" d="M64 20H150V40H64Z"/><path class="ga" d="M84 20L88 8H140L146 20H136L132 14H98L95 20Z"/><path class="gd" d="M74 40H91L81 65L66 62Z"/><path class="gd" d="M112 40H136L142 68L121 70Z"/><path class="gb" d="M150 21H222V36H150Z"/><path class="ga" d="M222 26H308V30H222Z"/><path class="ga" d="M226 26L232 9H237L241 26Z"/><path class="gd" d="M298 24h14v8h-14z"/><path class="gl" d="M90 40q2 11 9 11t9 -11"/><path class="gk" d="M160 23h2v11h-2zM172 23h2v11h-2zM184 23h2v11h-2zM196 23h2v11h-2zM208 23h2v11h-2zM100 26h28v4h-28z"/>',
    'm4a1': '<path class="gd" d="M22 22H62V34H50L46 52H30L22 40Z"/><path class="ga" d="M58 25H84V32H58Z"/><path class="ga" d="M80 20H160V40H80Z"/><path class="ga" d="M96 20L100 8H150L156 20H146L142 14H110L107 20Z"/><path class="gd" d="M88 40H105L95 65L80 62Z"/><path class="gd" d="M124 40H148L154 68L133 70Z"/><path class="gb" d="M160 21H212V36H160Z"/><path class="ga" d="M212 26H284V30H212Z"/><path class="ga" d="M216 26L222 9H227L231 26Z"/><path class="gd" d="M274 24h14v8h-14z"/><path class="gl" d="M104 40q2 11 9 11t9 -11"/><path class="gk" d="M170 23h2v11h-2zM182 23h2v11h-2zM194 23h2v11h-2zM206 23h2v11h-2zM112 26h28v4h-28z"/>',
    'scr16': '<path class="gd" d="M16 22H62V36H52L46 54H28L16 42Z"/><path class="ga" d="M58 18H168V40H58Z"/><path class="gd" d="M84 40H101L92 66L77 63Z"/><path class="gd" d="M122 40H146L152 68L131 70Z"/><path class="gb" d="M168 20H222V36H168Z"/><path class="ga" d="M222 25H290V30H222Z"/><path class="gd" d="M280 23h18v9h-18z"/><path class="gd" d="M70 14H222V18H70Z"/><path class="gl" d="M100 40q2 11 9 11t9 -11"/><path class="gk" d="M178 25h30v2h-30zM178 30h30v2h-30z"/><path class="gd" d="M230 14h5v11h-8z"/>',
    'lar': '<path class="gd" d="M8 24L70 22V34L54 38L10 54Z"/><path class="ga" d="M66 18H154V40H70Z"/><path class="gd" d="M78 40H95L86 66L70 63Z"/><path class="gd" d="M116 40H144L146 68H122Z"/><path class="gb" d="M154 20H230V35H154Z"/><path class="ga" d="M230 25H308V30H230Z"/><path class="gd" d="M296 23h16v9h-16z"/><path class="ga" d="M104 18L110 11H134L140 18Z"/><path class="gl" d="M94 40q2 11 9 11t9 -11"/><path class="gk" d="M166 24h8v3h-8zM182 24h8v3h-8zM198 24h8v3h-8zM214 24h8v3h-8z"/><path class="gd" d="M268 14h5v11h-8z"/>',
    'aur': '<path class="gb" d="M10 22L30 18H118L128 26H196V34H178L170 40H108L98 46H30L12 52Z"/><path class="gd" d="M58 46H84L88 74H64Z"/><path class="gb" d="M136 34L148 34L142 62H130L126 46Z"/><path class="gl" d="M128 46Q112 60 134 62"/><path class="ga" d="M128 22H206V30H128Z"/><path class="ga" d="M206 24H292V29H206Z"/><path class="gd" d="M110 8H180V14H110ZM102 5h12v12h-12zM176 4h12v14h-12zM122 14h8v6h-8zM162 14h8v8h-8z"/><path class="gd" d="M182 34h11l-3 20h-9z"/><path class="gd" d="M282 22h16v9h-16z"/>',
    'lemas': '<path class="gb" d="M10 24L40 20H120V48H60L46 44L12 50Z"/><path class="gd" d="M50 48H76L74 72H54Z"/><path class="ga" d="M118 24H226V40H118Z"/><path class="gb" d="M130 40H147L140 66L124 62Z"/><path class="ga" d="M84 22L92 8H206L218 24H206L198 14H100L96 22Z"/><path class="ga" d="M226 28H300V33H226Z"/><path class="gd" d="M262 24h26v12h-26z"/><path class="gl" d="M146 40q2 11 11 11t11 -11"/><path class="gk" d="M164 29h40v3h-40z"/>',
    'vss': '<path class="gb" d="M8 28L66 24L84 34L78 50L70 48L64 40L34 44L30 50L12 54Z"/><path class="gk" d="M32 32L58 30L64 36L32 40Z"/><path class="ga" d="M80 20H156L160 24V40H86Z"/><path class="gb" d="M86 40H102L92 62L80 58Z"/><path class="gb" d="M158 26H196V39H158Z"/><path class="ga" d="M196 22H306V36H196Z"/><path class="gd" d="M122 40h24l2 18h-22z"/><path class="gd" d="M110 5h50v8h-50zM98 2h14v14h-14zM158 3h14v12h-14zM124 13h16v8h-16z"/><path class="gl" d="M104 40q2 11 8 11t8 -11"/><path class="gk" d="M214 28h4v3h-4zM230 28h4v3h-4zM246 28h4v3h-4zM262 28h4v3h-4zM278 28h4v3h-4z"/>',
    'sval': '<path class="gl" d="M84 24L18 22L12 50M84 36L14 48"/><path class="ga" d="M80 20H156L160 24V40H86Z"/><path class="gd" d="M88 40H105L96 66L80 62Z"/><path class="gb" d="M158 26H196V39H158Z"/><path class="ga" d="M196 22H306V36H196Z"/><path class="gd" d="M124 40h24l8 28l-22 4z"/><path class="gl" d="M104 40q2 11 8 11t8 -11"/><path class="gk" d="M214 28h4v3h-4zM230 28h4v3h-4zM246 28h4v3h-4zM262 28h4v3h-4zM278 28h4v3h-4z"/><path class="gd" d="M144 15h14l-2 5h-12z"/>',
    'vikhr': '<path class="gl" d="M104 22L34 20L30 46M104 34L32 44"/><path class="ga" d="M100 18H200V38H104Z"/><path class="gd" d="M112 38H129L120 64L104 60Z"/><path class="gd" d="M146 38h24l7 30l-22 3z"/><path class="gb" d="M200 22H222V37H196Z"/><path class="ga" d="M222 25H252V31H222Z"/><path class="gd" d="M246 22h16v12h-16z"/><path class="gl" d="M128 38q2 11 8 11t8 -11"/><path class="gd" d="M210 12h5v10h-8z"/><path class="gk" d="M118 24h60v2h-60z"/>',
    'cr61': '<path class="gl" d="M96 22L60 10H160L188 16"/><path class="ga" d="M92 18H196V38H92Z"/><path class="gb" d="M96 38H116L110 70H90Z"/><path class="gd" d="M142 38H160Q164 56 174 68L156 74Q144 58 142 38Z"/><path class="ga" d="M196 24H230V30H196Z"/><path class="gd" d="M186 12h5v6h-5zM104 12h6v6h-6z"/><path class="gl" d="M116 38q2 11 12 11t12 -11"/><path class="gk" d="M112 24h50v3h-50z"/>',
    'bizon': '<path class="gl" d="M96 24L24 22L18 48M96 36L20 46"/><path class="ga" d="M92 20Q96 16 106 16H166V36H96Z"/><path class="gb" d="M102 36H119L110 62L94 59Z"/><path class="gd" d="M142 38H252V52H142Z"/><path class="gb" d="M166 18H214V34H166Z"/><path class="ga" d="M214 24H268V29H214Z"/><path class="gd" d="M258 21h16v11h-16z"/><path class="gl" d="M118 36q2 11 9 11t9 -11"/><path class="gk" d="M156 42h2v7h-2zM172 42h2v7h-2zM188 42h2v7h-2zM204 42h2v7h-2zM220 42h2v7h-2zM236 42h2v7h-2z"/><path class="gd" d="M234 12h5v12h-8z"/>',
    'usg45': '<path class="gd" d="M40 24H96V34L60 38L54 52H40Z"/><path class="gk" d="M52 30H84V32L56 36Z"/><path class="ga" d="M92 18H212V40H96Z"/><path class="gd" d="M102 40H121L114 68L96 65Z"/><path class="gd" d="M152 40H174V78H156Z"/><path class="ga" d="M212 24H240V31H212Z"/><path class="gb" d="M178 40H210V36H178Z"/><path class="gl" d="M120 40q4 14 30 12"/><path class="gd" d="M98 13h10v6h-10zM198 13h6v6h-6z"/><path class="gk" d="M124 25h60v3h-60z"/>',
    'sg5k': '<path class="ga" d="M92 20H196V38H92Z"/><path class="gd" d="M100 38H119L110 66L93 63Z"/><path class="gd" d="M142 38H162Q164 54 172 70L152 76Q144 58 142 38Z"/><path class="gb" d="M164 22H214V40H176Z"/><path class="gd" d="M190 40h13l-2 22h-12z"/><path class="ga" d="M196 16H222V22H196Z"/><path class="ga" d="M214 25H236V31H214Z"/><path class="gd" d="M98 13h12v7h-12zM218 10h6v14h-6z"/><path class="gd" d="M76 22H92V36H76Z"/><path class="gl" d="M118 38q2 11 11 11t11 -11"/><path class="gk" d="M112 25h46v2h-46z"/>',
    'mp18': '<path class="gb" d="M20 38L26 30Q56 30 80 34L106 28H170V38H140L106 46Q84 46 66 50L26 66Z"/><path class="ga" d="M98 20H180V30H98Z"/><path class="ga" d="M180 18H270V34H180Z"/><path class="gd" d="M148 38h14v12h-14z"/><path class="gk" d="M190 22h6v3h-6zM204 22h6v3h-6zM218 22h6v3h-6zM232 22h6v3h-6zM246 22h6v3h-6zM190 28h6v3h-6zM204 28h6v3h-6zM218 28h6v3h-6zM232 28h6v3h-6zM246 28h6v3h-6z"/><path class="ga" d="M270 23h10v6h-10z"/><path class="gl" d="M104 45q2 11 11 11t11 -11"/><path class="gd" d="M155 48a14 14 0 1 1 0 28a14 14 0 1 1 0-28z"/><path class="gd" d="M256 12h5v6h-5z"/>',
    'bk12': '<path class="gb" d="M8 38L14 32Q50 30 72 33L96 30V44Q80 45 64 50L14 66Z"/><path class="ga" d="M94 22H140V44H100L94 40Z"/><path class="ga" d="M140 23H308V32H140Z"/><path class="gb" d="M144 32H220L210 42H146Z"/><path class="gl" d="M98 44q2 11 11 11t11 -11"/><path class="gd" d="M96 14l10 2v7h-8z"/><path class="gd" d="M302 20h4v3h-4z"/>',
    'bk43': '<path class="gb" d="M8 38L14 32Q50 30 72 33L94 30V44Q80 45 64 50L14 66Z"/><path class="ga" d="M92 22H138L142 38L104 44L92 40Z"/><path class="ga" d="M138 20H304V27H138Z"/><path class="gd" d="M138 27H304V33H138Z"/><path class="gb" d="M144 33H218L206 42H146Z"/><path class="gl" d="M98 44q2 11 13 11t13-11M112 44q2 8 8 8"/><path class="gd" d="M300 17h4v3h-4z"/>',
    'bk133': '<path class="gb" d="M8 36L14 30Q50 28 74 32L92 28V42Q78 44 62 48L14 64Z"/><path class="ga" d="M90 20H168V40H94Z"/><path class="ga" d="M168 21H306V28H168Z"/><path class="ga" d="M168 30H278V36H168Z"/><path class="gb" d="M196 28H254V41H196Z"/><path class="gl" d="M98 40q2 11 11 11t11 -11"/><path class="gk" d="M206 31h2v7h-2zM216 31h2v7h-2zM226 31h2v7h-2zM236 31h2v7h-2zM246 31h2v7h-2zM124 25h26v5h-26z"/><path class="gd" d="M298 17h4v4h-4z"/>',
    'vaiga': '<path class="gb" d="M8 30L70 25L84 27V39L70 41L22 55L10 57Z"/><path class="ga" d="M80 20Q84 16 98 16H160V40H84Z"/><path class="gb" d="M92 40H108L98 65L82 62Z"/><path class="gd" d="M122 40H154L158 66H128Z"/><path class="gb" d="M160 20H224V38H160Z"/><path class="ga" d="M224 24H308V31H224Z"/><path class="gd" d="M296 17h5v7h-5zM148 12h14v5h-14z"/><path class="gl" d="M106 40q2 11 8 11t8 -11"/><path class="gk" d="M96 24h50v2h-50z"/>',
    'crossbow': '<path class="gb" d="M20 40L26 30H70L92 30H252V40H150L132 46L112 46L100 64L86 62L90 46L70 46L30 58Z"/><path class="ga" d="M236 6Q262 22 262 35Q262 48 236 64L230 60Q248 46 248 35Q248 24 230 10Z"/><path class="gl" d="M232 8L136 33L232 62"/><path class="ga" d="M120 25H300V29H120Z"/><path class="gd" d="M298 22l14 5l-14 5z"/><path class="gd" d="M116 8h56v8h-56zM108 5h12v14h-12zM166 4h16v16h-16zM130 16h6v10h-6zM154 16h6v10h-6z"/><path class="gl" d="M112 46q2 11 9 11t9 -11"/><path class="gl" d="M252 24h14v22h-14"/>',
    'cr75': '<path class="ga" d="M90 16L100 10H224L232 16V28H90Z"/><path class="ga" d="M84 28H228V36H168L160 42H92Z"/><path class="gd" d="M96 38H136L124 80H80Z"/><path class="gb" d="M98 44H126L117 74H92Z"/><path class="gl" d="M138 40q2 14 15 14t15 -14"/><path class="gd" d="M82 14l10 4v10h-6z"/><path class="gk" d="M104 15h2v9h-2zM110 15h2v9h-2zM116 15h2v9h-2zM122 15h2v9h-2zM156 13h24v4h-24z"/>',
    'mlock': '<path class="ga" d="M92 10H230V28H92Z"/><path class="gd" d="M92 28H228V37H160L152 42H98L94 34Z"/><path class="gd" d="M98 38H136L124 80H82Z"/><path class="gl" d="M138 40q2 14 15 14t15 -14"/><path class="gk" d="M102 13h2v12h-2zM108 13h2v12h-2zM114 13h2v12h-2zM120 13h2v12h-2zM150 12h24v6h-24z"/><path class="gk" d="M96 56h24v2H95zM94 62h24v2H93zM92 68h24v2H91z"/>',
    'p1': '<path class="ga" d="M88 14L98 10H160V28H88Z"/><path class="ga" d="M160 17H244V25H160Z"/><path class="ga" d="M84 28H196V35H158L150 42H92Z"/><path class="gd" d="M94 38H134L122 80H78Z"/><path class="gb" d="M97 44H124L115 76H90Z"/><path class="gl" d="M136 39q2 14 15 14t15 -14"/><path class="gd" d="M80 12l10 4v10h-6z"/><path class="gd" d="M236 11h5v6h-5z"/><path class="gk" d="M98 14h2v9h-2zM104 14h2v9h-2zM110 14h2v9h-2z"/>',
    'luger': '<path class="ga" d="M100 20H172V30H100Z"/><path class="ga" d="M172 20L256 21V27L172 30Z"/><path class="ga" d="M96 28H176V36H156L146 42H100Z"/><path class="gb" d="M92 36H130L110 80H74Z"/><path class="gl" d="M134 39q2 14 14 14t14 -14"/><path class="gd" d="M94 14H140V20H94Z"/><path class="gd" d="M102 6a9 9 0 1 1 0 18a9 9 0 1 1 0-18z"/><path class="gk" d="M99 12h6v6h-6z"/><path class="gd" d="M248 15h5v6h-5z"/>',
    'kolt1911': '<path class="ga" d="M90 12H226V28H90Z"/><path class="ga" d="M86 28H220V35H156L150 42H94Z"/><path class="gd" d="M98 38H134L126 80H86Z"/><path class="gb" d="M100 44H126L120 74H95Z"/><path class="gl" d="M134 40q2 14 16 14t16 -14"/><path class="gd" d="M78 12l12-2v6l-4 8z"/><path class="gd" d="M84 28l-8 6h14z"/><path class="gk" d="M96 15h2v10h-2zM102 15h2v10h-2zM108 15h2v10h-2zM150 14h26v5h-26z"/><path class="gk" d="M111 56h4v4h-4z"/>',
    'fx45': '<path class="ga" d="M88 9H240V28H88Z"/><path class="gd" d="M86 28H236V38H166L158 43H94Z"/><path class="gd" d="M96 40H138L126 80H80Z"/><path class="gd" d="M240 15h14v7h-14z"/><path class="gl" d="M140 41q2 14 16 14t16 -14"/><path class="gd" d="M80 11l9 3v10h-7z"/><path class="gk" d="M98 12h2v13h-2zM104 12h2v13h-2zM110 12h2v13h-2zM202 12h2v13h-2zM208 12h2v13h-2zM152 11h26v6h-26z"/><path class="gk" d="M96 54h26v3H95zM93 64h26v3H92z"/>',
    'deagle': '<path class="ga" d="M86 8H182L196 4H258V24H182V30H86Z"/><path class="ga" d="M82 28H206V38H162L154 43H92Z"/><path class="gd" d="M94 40H136L126 82H80Z"/><path class="gb" d="M98 46H126L120 76H91Z"/><path class="gl" d="M138 40q2 15 17 15t17 -15"/><path class="gd" d="M76 10l11 2v12h-6z"/><path class="gk" d="M94 12h2v12h-2zM100 12h2v12h-2zM106 12h2v12h-2zM112 12h2v12h-2zM196 20H254V22H196Z"/>',
    'ij70': '<path class="ga" d="M104 14L110 10H212L220 16V28H104Z"/><path class="ga" d="M100 28H214V35H164L158 42H108Z"/><path class="gd" d="M110 38H146L137 78H97Z"/><path class="gb" d="M112 44H138L131 74H106Z"/><path class="gl" d="M144 40q2 13 14 13t14 -13"/><path class="gd" d="M96 14l9 3v9h-6z"/><path class="gk" d="M112 14h2v10h-2zM118 14h2v10h-2zM124 14h2v10h-2zM158 13h22v5h-22z"/>',
    'mk2': '<path class="ga" d="M86 12H148V30H86Z"/><path class="ga" d="M148 15L258 18V27L148 28Z"/><path class="ga" d="M88 28H168V36H152L142 42H98Z"/><path class="gb" d="M92 36H128L110 80H76Z"/><path class="gl" d="M132 39q2 14 15 14t15 -14"/><path class="gd" d="M248 12h6v6h-6zM84 8h6v5h-6z"/><path class="gk" d="M92 15h2v10h-2zM98 15h2v10h-2zM104 15h2v10h-2zM130 14h14v5h-14z"/>',
    'derringer': '<path class="ga" d="M126 18H226V28H126Z"/><path class="gd" d="M126 29H226V39H126Z"/><path class="ga" d="M104 22L128 18V42L112 46L100 40Z"/><path class="gb" d="M102 40L118 46L112 74Q90 78 82 68Z"/><path class="gd" d="M98 16l10 3v8l-8 2z"/><path class="gl" d="M122 42q8 10 16 0"/><path class="gd" d="M218 14h5v4h-5z"/>',
    'flare': '<path class="ga" d="M120 14H232V40H120Z"/><path class="gd" d="M100 18H124V44H100Z"/><path class="gb" d="M98 40H124L118 78H86Z"/><path class="gd" d="M92 14l10 4v10h-8z"/><path class="gl" d="M124 42q2 13 13 13t13 -13"/><path class="gk" d="M136 18h3v18h-3zM220 18h3v18h-3z"/>',
    'revolver': '<path class="ga" d="M148 13H252V23H148Z"/><path class="ga" d="M148 25H232V30H148Z"/><path class="ga" d="M98 14H150V38L132 42H104L96 30Z"/><path class="gd" d="M112 12H144V36H112Z"/><path class="gb" d="M94 30L112 40L104 78H78L84 50Z"/><path class="gl" d="M118 40q2 13 13 13t13 -13"/><path class="gd" d="M88 8l12 4v12l-8-2z"/><path class="gd" d="M242 7h6v6h-6z"/><path class="gk" d="M116 18h24v2h-24zM116 27h24v2h-24z"/>'
  };
  const PISTOL = /^(cr75|mlock|p1|luger|kolt1911|fx45|deagle|ij70|mk2|derringer|flare|revolver)$/, SMG = /^(cr61|sg5k)$/;
  const gun = (k) => '<svg class="gun" viewBox="' + (PISTOL.test(k) ? '40 0 248 84' : SMG.test(k) ? '30 2 240 78' : '4 0 312 80') + '" aria-hidden="true">' + (G[k] || G.mosin) + '</svg>';
  window.DZIcons = { svg, gun, raw: (n) => I[n] || '', byEmoji: (e) => I[EMOJI[String.fromCodePoint(String(e).codePointAt(0))]] || '', has: (n) => !!I[n] };
})();
