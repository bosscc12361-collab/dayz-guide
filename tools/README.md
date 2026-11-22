# Данные карты Чернаруси

`data/map.json` собирается скриптом `gen_map.py`.

Источники:
- **Колонки, больницы, медпункты, полиция, охотничьи вышки** — `mapgrouppos.xml`,
  **точки спавна** — `cfgplayerspawnpoints.xml`, **газовые зоны** — `cfgEffectArea.json`
  из официального репозитория Bohemia Interactive:
  https://github.com/BohemiaInteractive/DayZ-Central-Economy (папка `dayzOffline.chernarusplus`).
- **Названия и координаты населённых пунктов** — игровой конфиг мира Chernarus+
  (`chernarus_places.json`, выгружено из дампа конфига `worlds_chernarusplus_world`).
- **Береговая линия** нарисована вручную по координатам заливов и прибрежных посёлков (упрощённая схема).
- **Маршруты** и их оценки — в самом скрипте, статистика (колонки, медицина, полиция, газ рядом с путём) считается автоматически.

Дополнительно `gen_extra.py` (запускать после `gen_map.py`) добавляет:
- `data/map-buildings.json` — ~11 500 зданий с лутом (`mapgrouppos.xml`), размер оценён по точкам лута из `mapgroupproto.xml`;
- сетку тиров лута из `areaflags.map` (4096×4096: плоскость usage uint32, затем плоскость value uint8, Tier1..4 — биты 0..3);
- возможный лут на финише маршрутов по `db/types.xml` (предметы с подходящим usage и тиром).

Обновить после патча игры: скачать три файла из репозитория в одну папку со скриптом
(вместе с `chernarus_places.json` под именем `places.json`) и запустить `python3 gen_map.py`.

## Подложка из скриншотов карты (дороги, лес, рельеф)

Если в `data/map.json` есть поле `"background": {"src": "img/map/chernarus.jpg", "x0": 0, "z0": 0, "x1": 15360, "z1": 15360, "opacity": 1}`,
карта рисует эту картинку вместо схемы суши. Координаты — какую часть мира (в метрах) покрывает картинка.

## «Где найти» (оружие и раздел `loot`)
`python3 tools/gen_where.py путь/к/types.xml` — берёт официальный `db/types.xml` (Чернарусь) и пишет поля `where`, `ammo_where`, `spawn` в `data/weapons.json` и весь `data/loot.json`. Список предметов и соответствие карточек классам игры — в начале скрипта (`WEAPONS`, `LOOT`, `AMMO`).

## Карта: подложка и маршруты
Источник — официальный репозиторий DayZ-Central-Economy (см. `LICENSE-DATA.md`). Скачать в одну папку `CETool/ChernarusPlus/map.png`, `layers/water-sea.tga`, `layers/water-fresh.tga`, `dayzOffline.chernarusplus/mapgroupcluster*.xml`, затем:
- `python3 tools/gen_base.py ПАПКА tools/tga.py` — подложка, реки, рельсы, тропы (`map.png` → `chernarus.jpg`, `vec.json`);
- `python3 tools/gen_paths.py ПАПКА data/map.json tools/tga.py tools/route_via.json` — маршруты по дорогам (`paths.json`); ручные точки маршрута — в `route_via.json`;
- `python3 tools/gen_rails.py ПАПКА tools/tga.py` — сшивает рельсы в линии.
`gen_map.py` создаёт `map.json` без `path`, `background` и `danger`: после него маршруты и эти поля нужно добавить снова.
