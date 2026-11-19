"""Дополняет data/map.json: здания (отдельный файл), сетка тиров лута, тир у городов,
возможный лут на финише маршрутов. Источник — официальные файлы DayZ Central Economy."""
import re, json, math, struct, os, collections
HERE = os.path.dirname(os.path.abspath(__file__))
DATA = os.path.expanduser('~/dayz-guide/data/')
M = json.load(open(DATA + 'map.json'))
SIZE = 15360

# ---------- тиры (areaflags.map: 4096x4096, плоскость usage uint32, затем плоскость value uint8) ----------
raw = open(os.path.join(HERE, 'areaflags.map'), 'rb').read()
W = struct.unpack_from('<I', raw, 0)[0]
N = W * W
VAL = memoryview(raw)[24 + N * 4: 24 + N * 5]
def tier_at(x, z):
    cx = min(W - 1, max(0, int(x / SIZE * W))); cz = min(W - 1, max(0, int(z / SIZE * W)))
    v = VAL[cz * W + cx]
    for t in (4, 3, 2, 1):
        if v & (1 << (t - 1)):
            return t
    return 0

G = 96  # сетка для подложки: 96x96 клеток по 160 м
grid = []
for gz in range(G):
    row = []
    for gx in range(G):
        c = collections.Counter()
        for sz in range(4):
            for sx in range(4):
                t = tier_at((gx + (sx + .5) / 4) * SIZE / G, (gz + (sz + .5) / 4) * SIZE / G)
                if t: c[t] += 1
        row.append(c.most_common(1)[0][0] if c else 0)
    grid.append(''.join(map(str, row)))
M['tiers'] = {"n": G, "rows": grid}  # rows[0] — юг (z=0)

for t in M['towns']:
    t['tier'] = tier_at(t['x'], t['z'])
for m in M['military']:
    m['tier'] = tier_at(m['x'], m['z'])

# ---------- прототипы зданий: использование и размер по точкам лута ----------
proto = open(os.path.join(HERE, 'mapgroupproto.xml')).read()
PROTO = {}
for g in re.finditer(r'<group name="([^"]+)"[^>]*>(.*?)</group>', proto, re.S):
    body = g.group(2)
    usage = re.findall(r'<usage name="(\w+)"', body)
    pts = [(float(a), float(c)) for a, b, c in re.findall(r'<point pos="([-\d.]+) ([-\d.]+) ([-\d.]+)"', body)]
    if pts:
        xs = [p[0] for p in pts]; zs = [p[1] for p in pts]
        w = max(4.0, max(xs) - min(xs) + 4); h = max(4.0, max(zs) - min(zs) + 4)
        ox = (max(xs) + min(xs)) / 2; oz = (max(zs) + min(zs)) / 2
    else:
        w = h = 6.0; ox = oz = 0.0
    PROTO[g.group(1)] = {"usage": usage, "w": round(min(w, 120), 1), "h": round(min(h, 120), 1), "ox": round(ox, 1), "oz": round(oz, 1)}

CAT_ORDER = ['Military', 'Police', 'Medic', 'Firefighter', 'Prison', 'Hunting', 'Industrial', 'Farm', 'Office', 'School', 'Town', 'Village', 'Coast', 'Other']
def cat_of(usage):
    for c in CAT_ORDER:
        if c in usage: return c
    return 'Other'

pos = open(os.path.join(HERE, 'mapgrouppos.xml')).read()
types, tindex, blds = [], {}, []
for m in re.finditer(r'<group name="([^"]+)" pos="([\d.]+) [\d.]+ ([\d.]+)"[^>]*\ba="([-\d.]+)"', pos):
    name = m.group(1); x = float(m.group(2)); z = float(m.group(3)); a = float(m.group(4))
    p = PROTO.get(name)
    if not p: continue
    if name not in tindex:
        tindex[name] = len(types)
        types.append([name, p['w'], p['h'], CAT_ORDER.index(cat_of(p['usage'])), p['ox'], p['oz']])
    blds.append([round(x), round(z), round(a) % 360, tindex[name]])
json.dump({"cats": CAT_ORDER, "types": types, "b": blds}, open(DATA + 'map-buildings.json', 'w'), separators=(',', ':'))

# ---------- лут ----------
tx = open(os.path.join(HERE, 'types.xml')).read()
ITEMS = []
for m in re.finditer(r'<type name="([^"]+)">(.*?)</type>', tx, re.S):
    b = m.group(2)
    nm = re.search(r'<nominal>(\d+)', b)
    nom = int(nm.group(1)) if nm else 0
    if nom <= 0: continue
    ITEMS.append({"cls": m.group(1), "nom": nom, "usage": set(re.findall(r'<usage name="(\w+)"', b)),
                  "tiers": set(int(v[-1]) for v in re.findall(r'<value name="Tier(\d)"', b))})

# понятные названия (русское / английское в игре). Предметы без названия в списке не показываются.
NAMES = {
 # оружие
 'CZ75': 'CR-75', 'Glock19': 'Mlock-91', 'Colt1911': 'Kolt 1911', 'FNX45': 'FX-45', 'MakarovIJ70': 'IJ-70', 'P1': 'P1',
 'Deagle': 'Deagle', 'Magnum': 'Револьвер (Revolver)', 'Derringer': 'Дерринджер (Derringer)', 'MKII': 'MK II', 'Longhorn': 'Longhorn',
 'Ruger1022': 'Sporter 22', 'Izh18': 'BK-18', 'Izh18Shotgun': 'BK-12', 'Izh43Shotgun': 'BK-43', 'Mp133Shotgun': 'BK-133',
 'Mosin9130': 'Мосина 91/30', 'SKS': 'SK 59/66 (СКС)', 'CZ527': 'CR-527', 'CZ527_Woodland': 'CR-527', 'CZ550': 'CR-550 Savanna',
 'Winchester70': 'M70 Tundra', 'B95': 'Блейз (Blaze)', 'Scout': 'Pioneer', 'Scout_Chernarus': 'Pioneer', 'SSG82': 'SSG 82',
 'CZ61': 'CR-61 Скорпион', 'PM73Rak': 'RAK-37', 'MP5K': 'SG5-K', 'UMP45': 'USG-45', 'PP19': 'Бизон (Bizon)',
 'AKM': 'КА-М (AKM)', 'AK74': 'КА-74', 'AKS74U': 'КАС-74У', 'AK101': 'КА-101', 'M4A1': 'M4-A1', 'M16A2': 'M16-A2',
 'FAL': 'LAR', 'SVD': 'VSD (СВД)', 'VSS': 'VSS (Винторез)', 'ASVAL': 'SVAL', 'Saiga': 'Вайга (Vaiga)', 'R12': 'R12',
 'Aug': 'AUR A1', 'AugShort': 'AUR AX', 'FAMAS': 'LE-MAS', 'Repeater': 'Repeater Carbine', 'Crossbow_Wood': 'Арбалет (Crossbow)',
 'Crossbow_Black': 'Арбалет (Crossbow)', 'Crossbow_Summer': 'Арбалет (Crossbow)', 'Crossbow_Autumn': 'Арбалет (Crossbow)',
 'Flaregun': 'Сигнальный пистолет', 'M79': 'M79',
 # медицина
 'BandageDressing': 'Бинт (Bandage)', 'Epinephrine': 'Эпинефрин', 'Morphine': 'Морфин', 'TetracyclineAntibiotics': 'Тетрациклин',
 'CharcoalTablets': 'Активированный уголь', 'PainkillerTablets': 'Обезболивающее (Codeine)', 'VitaminBottle': 'Мультивитамины',
 'DisinfectantSpray': 'Дезинфицирующий спрей', 'DisinfectantAlcohol': 'Спиртовая настойка', 'IodineTincture': 'Йод',
 'PurificationTablets': 'Таблетки для воды', 'SalineBag': 'Физраствор (Saline Bag)', 'StartKitIV': 'Набор для капельницы',
 'BloodBagEmpty': 'Набор для сбора крови', 'BloodTestKit': 'Тест крови', 'FirstAidKit': 'Аптечка', 'Thermometer': 'Термометр',
 'SewingKit': 'Швейный набор',
 # снаряжение
 'Hatchet': 'Топорик (Hatchet)', 'HuntingKnife': 'Охотничий нож', 'KitchenKnife': 'Кухонный нож', 'SteakKnife': 'Нож для стейка',
 'CombatKnife': 'Боевой нож', 'CanOpener': 'Открывалка', 'Matchbox': 'Спички', 'PetrolLighter': 'Зажигалка', 'Compass': 'Компас',
 'OrienteeringCompass': 'Компас', 'ChernarusMap': 'Карта Чернаруси', 'Binoculars': 'Бинокль', 'Headtorch_Black': 'Налобный фонарь',
 'Headtorch_Grey': 'Налобный фонарь', 'Flashlight': 'Фонарик', 'Battery9V': 'Батарейка 9V', 'Canteen': 'Фляга', 'WaterBottle': 'Бутылка',
 'Rope': 'Верёвка', 'DuctTape': 'Изолента', 'FieldShovel': 'Сапёрная лопатка', 'Shovel': 'Лопата', 'Pliers': 'Плоскогубцы',
 'CookingPot': 'Котелок', 'FryingPan': 'Сковорода', 'Heatpack': 'Грелка', 'Rangefinder': 'Дальномер', 'GPSReceiver': 'GPS',
 'PersonalRadio': 'Рация', 'Crowbar': 'Монтировка', 'WoodAxe': 'Топор', 'FirefighterAxe': 'Пожарный топор',
}
def ammo_name(c):
    for pat, n in [('9x19', '9x19'), ('380', '.380 ACP'), ('45ACP', '.45 ACP'), ('357', '.357'), ('_22', '.22 LR'), ('12ga', '12 калибр'),
                   ('00buck', '12 калибр'), ('762x39', '7.62x39'), ('762x54', '7.62x54R'), ('308Win', '.308 Win'), ('545x39', '5.45x39'),
                   ('556x45', '5.56x45'), ('9x39', '9x39')]:
        if pat in c: return n
    return None
def group_of(it):
    c = it['cls']
    if c.startswith('Ammo_') or c.startswith('AmmoBox_'):
        return 'ammo'
    n = NAMES.get(c)
    if not n: return None
    meds = {'BandageDressing', 'Epinephrine', 'Morphine', 'TetracyclineAntibiotics', 'CharcoalTablets', 'PainkillerTablets', 'VitaminBottle',
            'DisinfectantSpray', 'DisinfectantAlcohol', 'IodineTincture', 'PurificationTablets', 'SalineBag', 'StartKitIV', 'BloodBagEmpty',
            'BloodTestKit', 'FirstAidKit', 'Thermometer', 'SewingKit'}
    if c in meds: return 'medical'
    if c in ('Hatchet', 'HuntingKnife', 'KitchenKnife', 'SteakKnife', 'CombatKnife', 'CanOpener', 'Matchbox', 'PetrolLighter', 'Compass',
             'OrienteeringCompass', 'ChernarusMap', 'Binoculars', 'Headtorch_Black', 'Headtorch_Grey', 'Flashlight', 'Battery9V', 'Canteen',
             'WaterBottle', 'Rope', 'DuctTape', 'FieldShovel', 'Shovel', 'Pliers', 'CookingPot', 'FryingPan', 'Heatpack', 'Rangefinder',
             'GPSReceiver', 'PersonalRadio', 'Crowbar', 'WoodAxe', 'FirefighterAxe'):
        return 'tools'
    return 'weapons'

ALLB = [(b[0], b[1], types[b[3]][0]) for b in blds]
USAGE_RU = {'Military': 'военные', 'Police': 'полиция', 'Medic': 'медицина', 'Firefighter': 'пожарная часть', 'Prison': 'тюрьма',
            'Hunting': 'охота', 'Industrial': 'промзона', 'Farm': 'фермы', 'Office': 'офисы', 'School': 'школа', 'Town': 'городские дома',
            'Village': 'деревенские дома', 'Coast': 'побережье'}

PRIORITY = ['Military', 'Police', 'Medic', 'Hunting', 'Firefighter', 'Prison', 'Town', 'Village', 'Farm', 'Industrial', 'Office', 'School', 'Coast']
GROUP_RU = {'Military': '🎖️ В военных зданиях', 'Police': '🚓 В полиции', 'Medic': '✚ В больнице и медпунктах', 'Hunting': '🦌 На охотничьих вышках',
            'Firefighter': '🚒 В пожарной части', 'Prison': '🔒 В тюрьме', 'Town': '🏙️ В городских домах', 'Village': '🏡 В деревенских домах',
            'Farm': '🌾 На фермах', 'Industrial': '🏭 В промзоне', 'Office': '🏢 В офисах', 'School': '🏫 В школе', 'Coast': '🌊 На побережье'}

def items_for(usage, tier):
    res = {'weapons': [], 'ammo': [], 'medical': [], 'tools': []}
    seen = set()
    for it in sorted(ITEMS, key=lambda i: -i['nom']):
        if usage not in it['usage']: continue
        if it['tiers'] and tier not in it['tiers']: continue
        g = group_of(it)
        if not g: continue
        n = ammo_name(it['cls']) if g == 'ammo' else NAMES[it['cls']]
        if not n or (g, n) in seen: continue
        seen.add((g, n)); res[g].append(n)
    return res

def loot_at(x, z, r=450):
    near = [(bx, bz, n) for bx, bz, n in ALLB if (bx - x) ** 2 + (bz - z) ** 2 <= r * r]
    ucount = collections.Counter(); tiers = collections.Counter()
    for bx, bz, n in near:
        for u in set(PROTO[n]['usage']): ucount[u] += 1
        t = tier_at(bx, bz)
        if t: tiers[t] += 1
    tier = tiers.most_common(1)[0][0] if tiers else tier_at(x, z)
    groups = []
    for u in PRIORITY:
        if not ucount[u]: continue
        it = items_for(u, tier)
        if not (it['weapons'] or it['medical'] or it['tools']): continue
        groups.append({"label": GROUP_RU[u], "count": ucount[u], "weapons": it['weapons'][:5], "ammo": it['ammo'][:5],
                       "medical": it['medical'][:4], "tools": it['tools'][:4]})
        if len(groups) == 3: break
    return {"tier": tier, "buildings": len(near), "groups": groups}

def place(id_):
    for k in ('towns', 'military'):
        for p in M[k]:
            if p['id'] == id_: return p
for r in M['routes']:
    end = place(r['wp'][-1])
    r['loot'] = {"place": end['name'], **loot_at(end['x'], end['z'])}
    st = place(r['wp'][0])
    r['loot']['start_tier'] = tier_at(st['x'], st['z'])
M['loot_note'] = ("Возможный лут посчитан по официальной таблице лута (types.xml) для зданий в радиусе ~450 м от финиша и тира этой зоны. "
                  "Это то, что МОЖЕТ появиться на официальных серверах, а не гарантия: лут могли забрать, а на community-серверах настройки бывают другими.")
json.dump(M, open(DATA + 'map.json', 'w'), ensure_ascii=False, separators=(',', ':'))
print('buildings', len(blds), 'types', len(types), 'map.json', os.path.getsize(DATA + 'map.json') // 1024, 'KB', 'bld', os.path.getsize(DATA + 'map-buildings.json') // 1024, 'KB')
for r in M['routes']:
    L = r['loot']; print(r['verdict'], L['place'], 'T' + str(L['start_tier']) + '→T' + str(L['tier']), L['buildings'])
    for g in L['groups']: print('   ', g['label'], g['count'], '|', ', '.join(g['weapons']), '|', ', '.join(g['ammo']), '|', ', '.join(g['medical'][:3]))
print({t['name']: t['tier'] for t in M['towns'] if t['big']})
