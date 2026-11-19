"""Собирает ~/dayz-guide/data/map.json из официальных данных Bohemia (DayZ Central Economy)
и игрового конфига мира Chernarus+ (названия и координаты населённых пунктов)."""
import re, json, math, statistics, os
HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.expanduser('~/dayz-guide/data/map.json')
t = open(os.path.join(HERE, 'mapgrouppos.xml')).read()
allplaces = json.load(open(os.path.join(HERE, 'places.json')))

def pos(name):
    return [(round(float(m.group(1))), round(float(m.group(2)))) for m in
            re.finditer(r'<group name="' + re.escape(name) + r'" pos="([\d.]+) [\d.]+ ([\d.]+)"', t)]

towns = []
for p in allplaces:
    if p['type'] not in ('Capital', 'City', 'Village'):
        continue
    en = p['cls'].replace('Settlement_', '')
    en = re.sub(r'(?<=[a-z])(?=[A-Z])', ' ', en)
    big = p['cls'].replace('Settlement_', '') in (
        'Chernogorsk', 'Elektrozavodsk', 'Berezino', 'Zelenogorsk', 'Severograd', 'Novodmitrovsk',
        'Svetloyarsk', 'Krasnostav', 'Vybor', 'Gorka', 'StarySobor', 'NovayaPetrovka', 'Solnechny', 'Polyana')
    towns.append({"id": "t-" + p['cls'].replace('Settlement_', '').lower(), "name": p['name'], "en": en,
                  "x": round(p['x']), "z": round(p['z']), "big": big})
TID = {t_['id']: t_ for t_ in towns}

def near(x, z):
    p = min(towns, key=lambda q: (q['x'] - x) ** 2 + (q['z'] - z) ** 2)
    return p['name']

def pts(names, prefix):
    out = []
    for n in names:
        for i, (x, z) in enumerate(pos(n)):
            out.append([x, z, near(x, z)])
    out.sort()
    return out

points = {
    "water": pts(['Land_Misc_Well_Pump_Blue', 'Land_Misc_Well_Pump_Yellow'], 'w'),
    "hospital": pts(['Land_City_Hospital'], 'h'),
    "clinic": pts(['Land_Village_HealthCare', 'Land_Medical_Tent_Big'], 'c'),
    "police": pts(['Land_City_PoliceStation', 'Land_Village_PoliceStation'], 'p'),
    "hunting": pts(['Land_Misc_DeerStand1', 'Land_Misc_DeerStand2'], 'd'),
}

# точки спавна свежих персонажей (медиана каждой группы)
s = open(os.path.join(HERE, 'cfgplayerspawnpoints.xml')).read().split('<fresh>')[1].split('</fresh>')[0]
spawns = []
for g in re.finditer(r'<group name="(\w+)">(.*?)</group>', s, re.S):
    p = [(float(a), float(b)) for a, b in re.findall(r'x="([\d.]+)" z="([\d.]+)"', g.group(2))]
    mx, mz = statistics.median(q[0] for q in p), statistics.median(q[1] for q in p)
    spawns.append([round(mx), round(mz), near(mx, mz)])
points["spawn"] = spawns

# военные объекты (из конфига мира)
MIL_INFO = {
    'Local_AF_Vybor': ("Северо-западный аэродром (NWAF)", "Самая богатая и самая опасная военная точка. Много игроков, военные заражённые. Новичку без снаряжения сюда рано."),
    'Local_AF_Krasno': ("Северо-восточный аэродром (Красностав)", "Военный лут и вертолёты. Народу меньше, чем на NWAF, но всё равно опасно."),
    'Local_AF_Balota': ("Аэродром Балота", "Небольшой аэродром у побережья. Военный лут недалеко от спавна, поэтому здесь часто стреляют."),
    'Local_MB_VMC': ("Военная база ВМЦ (VMC)", "Палатки и казармы в лесу к югу от NWAF. Средний военный лут."),
    'Local_MB_Tisy': ("Военная база Тисы (Tisy)", "Крупнейшая военная база на крайнем северо-западе. Лучший лут и самый высокий риск."),
    'Local_MB_Kamensk': ("Военная база Каменск", "Военная база на севере. Далеко от спавна."),
    'Local_MB_Zeleno': ("Военная база Зеленогорск", "Военная база у Зеленогорска. Средний лут."),
    'Local_MB_Pavlovo': ("Военная база Павлово", "Внутри постоянной газовой зоны! Без противогаза и ОЗК не заходить."),
}
military = []
for p in allplaces:
    if p['cls'] in MIL_INFO:
        title, info = MIL_INFO[p['cls']]
        military.append({"id": "m-" + p['cls'].split('_')[-1].lower(), "name": title, "x": round(p['x']), "z": round(p['z']), "info": info})

# газовые зоны (cfgEffectArea.json): объединяем куски одной зоны
ea = json.load(open(os.path.join(HERE, 'cfgEffectArea.json')))
groups = {}
for a in ea['Areas']:
    key = a['AreaName'].split('-')[0]
    groups.setdefault(key, []).append((a['Data']['Pos'][0], a['Data']['Pos'][2], a['Data']['Radius']))
zones = []
for key, parts in groups.items():
    cx = sum(p[0] for p in parts) / len(parts); cz = sum(p[1] for p in parts) / len(parts)
    r = max(math.dist((cx, cz), (p[0], p[1])) + p[2] for p in parts)
    name = {'Pavlovo': 'Газовая зона: военная база Павлово', 'Ship': 'Газовая зона: корабль у Рифов'}.get(key, 'Газовая зона ' + key)
    zones.append({"id": "z-" + key.lower(), "name": name, "x": round(cx), "z": round(cz), "r": round(r)})

# береговая линия (упрощённая схема по координатам заливов, мысов и прибрежных посёлков)
coast = [[0, 1950], [700, 2000], [1250, 2250], [1900, 2080], [2600, 2150], [3300, 2250], [3800, 2300], [4500, 2280],
         [5100, 2150], [5500, 1900], [5800, 1780], [6200, 1950], [6700, 2050], [7200, 2150], [7600, 2350], [8000, 2300],
         [8300, 2250], [8800, 2150], [9300, 1950], [9900, 1800], [10400, 1820], [10900, 2050], [11200, 2330],
         [11550, 2900], [11900, 3200], [12350, 3350], [12900, 3450], [13350, 3750], [13600, 4000], [13250, 4500],
         [13250, 5200], [13550, 5800], [13750, 6250], [13550, 6900], [13300, 7500], [13150, 8100], [13050, 8550],
         [12950, 9100], [12850, 9700], [12900, 10300], [13200, 10800], [13700, 11000], [14100, 11250], [13900, 11700],
         [13700, 12200], [13800, 12700], [14050, 12950], [14450, 13150], [14300, 13500], [14800, 13650], [15360, 13600],
         [15360, 15360], [0, 15360]]
islands = [[[13550, 3000], [13800, 2950], [13950, 3150], [13800, 3300], [13550, 3250]]]

# ---------------- маршруты ----------------
def route_stats(wp):
    pts_ = [(TID[w]['x'], TID[w]['z']) for w in wp]
    dist = sum(math.dist(pts_[i], pts_[i + 1]) for i in range(len(pts_) - 1))
    def seg_d(px, pz):
        best = 1e9
        for (ax, az), (bx, bz) in zip(pts_, pts_[1:]):
            dx, dz = bx - ax, bz - az
            L = dx * dx + dz * dz
            u = max(0, min(1, ((px - ax) * dx + (pz - az) * dz) / L)) if L else 0
            best = min(best, math.dist((px, pz), (ax + u * dx, az + u * dz)))
        return best
    cnt = lambda k, r=400: sum(1 for p in points[k] if seg_d(p[0], p[1]) <= r)
    gas = any(seg_d(z['x'], z['z']) <= z['r'] + 150 for z in zones)
    mil = [m['name'] for m in military if seg_d(m['x'], m['z']) <= 600]
    return {"km": round(dist / 1000, 1), "water": cnt('water'), "medical": cnt('hospital') + cnt('clinic'),
            "police": cnt('police'), "hunting": cnt('hunting', 300), "gas": gas, "military": mil}

routes = [
 {"id": "r-cherno-sobor", "verdict": "good", "title": "Черногорск → Надеждино → Могилевка → Гуглово → Новый Собор",
  "wp": ["t-chernogorsk", "t-nadezhdino", "t-mogilevka", "t-guglovo", "t-novysobor"],
  "summary": "Классика для кепки из Черногорска: сразу уйти из большого города в деревни центра карты.",
  "why": ["Деревни по пути лутают реже, чем побережье", "Колонки почти в каждой деревне", "По пути есть полицейские участки и медпункт", "Дальше удобно идти на север, к Горке или Выбору"]},
 {"id": "r-elektro-polyana", "verdict": "good", "title": "Электрозаводск → Пуста → Старое → Долина → Поляна",
  "wp": ["t-elektrozavodsk", "t-pusta", "t-staroye", "t-dolina", "t-polyana"],
  "summary": "Из Электро на север через тихие деревни к городу Поляна.",
  "why": ["Уходишь из Электро, где много кепок и стрельбы", "Старое и Долина — спокойные деревни с колонками", "Поляна — небольшой город с хорошим гражданским лутом"]},
 {"id": "r-kamyshovo-staroye", "verdict": "good", "title": "Камышово → Тулга → Мста → Старое",
  "wp": ["t-kamyshovo", "t-tulga", "t-msta", "t-staroye"],
  "summary": "Короткий путь вглубь от восточного побережья.",
  "why": ["Короткий: меньше риска умереть от жажды в начале", "Тулга и Мста — маленькие тихие деревни", "Из Старого дальше на север или в центр"]},
 {"id": "r-berezino-gorka", "verdict": "good", "title": "Березино → Дубровка → Горка → Новый Собор",
  "wp": ["t-berezino", "t-dubrovka", "t-gorka", "t-novysobor"],
  "summary": "С северо-востока на запад, через Горку в центр карты.",
  "why": ["В Березино есть больница и полиция", "Горка — хороший промежуточный город", "Путь ведёт к центральным деревням с колонками"]},
 {"id": "r-solnechny-dolina", "verdict": "good", "title": "Солнечный → Долина → Шаховка → Гуглово",
  "wp": ["t-solnechny", "t-dolina", "t-shakhovka", "t-guglovo"],
  "summary": "С восточного побережья в центр через деревни.",
  "why": ["Солнечный — точка спавна, но рядом нет крупного PvP-города", "Деревни по пути редко бывают пустыми", "Выводит к центру карты"]},
 {"id": "r-nwaf-rush", "verdict": "bad", "title": "Кепка сразу бежит на NWAF (Черногорск → Выбор аэродром)",
  "wp": ["t-chernogorsk", "t-nadezhdino", "t-kabanino", "m-vybor"],
  "summary": "Самая частая ошибка: бежать за военным лутом без ножа, воды и еды.",
  "why": ["Около 9 км бега: спринт сжигает воду и еду, а оружия и бинтов ещё нет", "На NWAF больше всего игроков с оружием", "Военные заражённые крепче обычных", "Даже если дойдёшь, без рюкзака лут некуда положить"]},
 {"id": "r-coast-run", "verdict": "bad", "title": "Бег вдоль побережья: Черногорск → Электро → Камышово",
  "wp": ["t-chernogorsk", "t-prigorodki", "t-elektrozavodsk", "t-kamyshovo"],
  "summary": "Кажется логичным, но побережье уже вылутано другими кепками.",
  "why": ["Вдоль всего побережья спавнятся новые игроки, и всё уже обыскано", "Черногорск и Электро — главные PvP-точки для новичков", "Вглубь материка лута больше, а людей меньше"]},
 {"id": "r-pavlovo-gas", "verdict": "bad", "title": "Через Павлово на запад (Черногорск → Балота → Павлово → Зеленогорск)",
  "wp": ["t-chernogorsk", "t-balota", "t-komarovo", "t-pavlovo", "t-zelenogorsk"],
  "summary": "Путь проходит через постоянную газовую зону и аэродром Балота.",
  "why": ["Военная база Павлово находится в газовой зоне: без противогаза и ОЗК — смерть", "Аэродром Балота рядом со спавном, здесь часто стреляют", "На западном побережье больше нет свежего спавна, и туда незачем бежать"]},
 {"id": "r-camp-cherno", "verdict": "bad", "title": "Остаться лутать Черногорск целиком",
  "wp": ["t-chernogorsk", "t-vysotovo", "t-novoselki", "t-dubovo"],
  "summary": "Большой город вокруг спавна: много зданий, но и много игроков.",
  "why": ["Сюда постоянно приходят новые кепки и охотники на них", "Высокие дома удобны снайперам", "Лучше быстро взять необходимое (больница, магазины) и уйти вглубь"]},
]
for m in military:
    TID[m['id']] = m
for r in routes:
    r["stats"] = route_stats(r["wp"])

data = {
  "size": 15360,
  "note": "Схема по данным игры: координаты городов из конфига мира Chernarus+, колонки, больницы, полиция, вышки, спавн и газовые зоны — из официального репозитория Bohemia Interactive (DayZ Central Economy). Береговая линия упрощена.",
  "checked": "19.11.2026",
  "coast": coast, "islands": islands,
  "towns": towns, "military": military, "zones": zones, "points": points, "routes": routes,
}
json.dump(data, open(OUT, 'w'), ensure_ascii=False, separators=(',', ':'))
print('towns', len(towns), {k: len(v) for k, v in points.items()}, 'mil', len(military), 'zones', zones)
for r in routes:
    print(r['verdict'], r['title'], r['stats'])
print(os.path.getsize(OUT) // 1024, 'KB')
