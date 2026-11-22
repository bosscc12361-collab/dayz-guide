#!/usr/bin/env python3
"""«Где найти» по официальным данным DayZ Central Economy (Чернарусь).

Берёт db/types.xml из BohemiaInteractive/DayZ-Central-Economy (dayzOffline.chernarusplus)
и пишет:
  * data/weapons.json — поля where / spawn у каждого ствола;
  * data/loot.json    — раздел «Где найти» с ключевыми предметами.

Запуск:  python3 tools/gen_where.py путь/к/types.xml
"""
import json, sys, os
import xml.etree.ElementTree as ET

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

USAGE = {
    'Military': 'военные объекты (базы, блокпосты, палатки)',
    'Police': 'полицейские участки',
    'Medic': 'больницы и медпункты',
    'Town': 'дома в городах',
    'Village': 'дома в деревнях',
    'Farm': 'фермы и сараи',
    'Hunting': 'охотничьи вышки и домики',
    'Industrial': 'промзоны, гаражи, заводы',
    'Office': 'офисы и администрации',
    'School': 'школы',
    'Firefighter': 'пожарные части',
    'Prison': 'тюрьма на острове',
    'Coast': 'побережье',
    'Lunapark': 'парк аттракционов',
    'ContaminatedArea': 'только токсичные зоны (нужен противогаз и ОЗК)',
}
ORDER = list(USAGE)
TIER = {
    'Tier1': 'побережье',
    'Tier2': 'средняя полоса',
    'Tier3': 'север и запад',
    'Tier4': 'крайний северо-запад: Тисы, СЗ',
}


def load(path):
    out = {}
    for t in ET.parse(path).getroot():
        f = t.find('flags')
        out[t.get('name')] = {
            'nominal': int(t.findtext('nominal') or 0),
            'usage': [u.get('name') for u in t.findall('usage')],
            'tier': [v.get('name') for v in t.findall('value')],
            'deloot': f is not None and f.get('deloot') == '1',
        }
    return out


def rarity(n):
    if n <= 0: return 'не появляется'
    if n >= 40: return 'часто'
    if n >= 15: return 'обычно'
    if n >= 6: return 'редко'
    return 'очень редко'


def merge(T, classes):
    have = [T[c] for c in classes if c in T]
    if not have: return None
    n = sum(h['nominal'] for h in have)
    act = [h for h in have if h['nominal'] > 0] or have
    us, ti = [], []
    for h in act:
        us += [u for u in h['usage'] if u not in us]
        ti += [v for v in h['tier'] if v not in ti]
    us.sort(key=lambda u: ORDER.index(u) if u in ORDER else 99)
    ti.sort()
    if any(not h['tier'] for h in act): ti = []  # хоть один вариант без тира — значит по всей карте
    return {'nominal': n, 'usage': us, 'tier': ti, 'deloot': any(h['deloot'] for h in act), 'classes': classes}


def tiers_txt(ti):
    if not ti: return 'по всей карте'
    nums = [int(t[-1]) for t in ti if t[-1].isdigit()]
    if not nums or len(set(nums)) == 4: return 'по всей карте'
    rng = 'тир ' + (str(nums[0]) if len(nums) == 1 else '%d–%d' % (nums[0], nums[-1]))
    return rng + ' (' + ', '.join(TIER[t] for t in ti if t in TIER) + ')'


def describe(m):
    """Короткая строка для карточки и подробная структура."""
    if m is None: return None, None
    if m['nominal'] == 0:
        return ('На Чернаруси в официальной экономике сейчас не появляется (встречается на других картах или на модовых серверах).',
                {'rarity': 'не появляется', 'nominal': 0})
    places = [USAGE.get(u, u) for u in m['usage']]
    parts = []
    txt = ', '.join(places) if places else 'почти в любых зданиях (на полках, столах)'
    parts.append(txt[0].upper() + txt[1:])
    if m['deloot']: parts.append('также на динамических событиях (крушения вертолётов, конвои)')
    zones = '' if m['usage'] == ['ContaminatedArea'] else ' Зоны: ' + tiers_txt(m['tier']) + '.'
    line = '; '.join(parts) + '.' + zones + ' Встречается ' + rarity(m['nominal']) + \
        ' (на карте до ' + str(m['nominal']) + ' шт.).'
    return line, {'rarity': rarity(m['nominal']), 'nominal': m['nominal'], 'usage': m['usage'], 'tier': m['tier'], 'deloot': m['deloot'], 'classes': m['classes']}


WEAPONS = {
    'cr75': ['CZ75'], 'mlock': ['Glock19', 'Glock_Tan'], 'p1': ['P1'], 'luger': ['Luger'],
    'kolt1911': ['Colt1911', 'Engraved1911'], 'fx45': ['FNX45'], 'deagle': ['Deagle', 'Deagle_Gold'],
    'revolver': ['Magnum', 'Magnum_Gold'], 'derringer': ['Derringer_Grey', 'Derringer_Black', 'Derringer_Pink'],
    'ij70': ['MakarovIJ70'], 'mk2': ['MKII'], 'flare': ['Flaregun'], 'cr61': ['CZ61'], 'bizon': ['PP19'],
    'usg45': ['UMP45'], 'sg5k': ['MP5K'], 'mp18': ['MP18'], 'bk12': ['Izh18'], 'bk43': ['Izh43Shotgun'],
    'bk133': ['Mp133Shotgun'], 'vaiga': ['Saiga'], 'mosin': ['Mosin9130', 'Mosin9130_Woodland'],
    'lee-enfield': ['LeeEnfield'], 'vs89': ['SV98'], 'sks': ['SKS', 'SKS_Woodland'],
    'cr527': ['CZ527', 'CZ527_Woodland'], 'bk18': ['Izh18Shotgun'], 'blaze': ['B95'], 'savanna': ['CZ550'],
    'tundra': ['Winchester70'], 'pioneer': ['Scout_Chernarus', 'Scout'], 'ssg82': ['SSG82'],
    'repeater': ['Repeater'], 'sporter': ['Ruger1022'], 'kam': ['AKM'], 'ka74': ['AK74'], 'kas74u': ['AKS74U'],
    'ka101': ['AK101'], 'm4a1': ['M4A1'], 'm16a2': ['M16A2'], 'aur': ['Aug', 'AugShort'], 'lemas': ['FAMAS'],
    'scr16': ['SCARL', 'SCARH'], 'lar': ['FAL'], 'dmr': ['M14'], 'vsd': ['SVD'], 'vss': ['VSS'],
    'sval': ['ASVAL'], 'vikhr': ['Vikhr'],
    'crossbow': ['Crossbow_Autumn', 'Crossbow_Black', 'Crossbow_Wood', 'Crossbow_Summer'],
}

# Ключевые предметы новичка: (id, название в игре, English, теги, классы, совет)
LOOT = [
    # медицина
    ('bandage', 'Бинт', 'Bandage', ['медицина'], ['BandageDressing'], 'Останавливает кровотечение и не заносит инфекцию. Держи 2–3 штуки.', 'injuries/bleeding'),
    ('disinfectant', 'Дезинфицирующий спрей', 'Disinfectant Spray', ['медицина', 'дезинфекция'], ['DisinfectantSpray'], 'Дезинфицирует тряпки, ножи и раны.', 'injuries/disinfect'),
    ('alcohol-tincture', 'Спиртовая настойка', 'Alcohol Tincture', ['медицина', 'дезинфекция'], ['DisinfectantAlcohol'], 'То же, что спрей: дезинфекция ран и тряпок.', 'injuries/disinfect'),
    ('iodine', 'Йодная настойка', 'Iodine Tincture', ['медицина', 'дезинфекция', 'вода'], ['IodineTincture'], 'Дезинфекция ран и очистка воды.', 'injuries/disinfect'),
    ('tetracycline', 'Тетрациклин', 'Tetracycline Pills', ['медицина', 'таблетки', 'антибиотик'], ['TetracyclineAntibiotics'], 'Лечит грипп, пневмонию, холеру и инфекцию раны.', 'diseases/pneumonia'),
    ('charcoal', 'Активированный уголь', 'Charcoal Tablets', ['медицина', 'таблетки'], ['CharcoalTablets'], 'Лечит отравление и сальмонеллёз.', 'diseases/food-poisoning'),
    ('vitamins', 'Мультивитамины', 'Multivitamin Pills', ['медицина', 'таблетки', 'иммунитет'], ['VitaminBottle'], 'Поднимают иммунитет, помогают от простуды.', 'diseases/common-cold'),
    ('painkillers', 'Обезболивающее', 'Painkillers', ['медицина', 'таблетки', 'перелом'], ['PainkillerTablets'], 'Снимают боль, например при переломе.', 'injuries/fracture'),
    ('chlorine', 'Таблетки хлора', 'Chlorine Tablets', ['вода', 'очистка'], ['PurificationTablets'], 'Очищают воду во фляге или бутылке.', 'food/purify-water'),
    ('saline', 'Физраствор', 'Saline Bag', ['медицина', 'кровь'], ['SalineBag', 'SalineBagIV'], 'Быстро восстанавливает кровь (+500).', 'injuries/blood'),
    ('blood-kit', 'Набор для переливания', 'Blood Bag Kit', ['медицина', 'кровь'], ['BloodBagEmpty', 'BloodBagIV', 'BloodTestKit'], 'Нужен для переливания крови. Сначала узнай группу.', 'injuries/transfusion'),
    ('epinephrine', 'Адреналин', 'Epinephrine', ['медицина', 'шок'], ['Epinephrine'], 'Восстанавливает выносливость и поднимает из шока.', 'injuries/shock'),
    ('morphine', 'Морфин', 'Morphine', ['медицина', 'перелом'], ['Morphine'], 'Сильное обезболивающее, лечит боль при переломе.', 'injuries/fracture'),
    ('sewing-kit', 'Швейный набор', 'Sewing Kit', ['медицина', 'ремонт'], ['SewingKit'], 'Зашивает раны и чинит одежду.', None),
    ('pox', 'Антидот PO-X', 'PO-X Antidote', ['медицина', 'газ'], ['AntiChemInjector'], 'Лечит отравление газом.', 'diseases/gas-poisoning'),
    ('first-aid', 'Аптечка', 'First Aid Kit', ['медицина', 'контейнер'], ['FirstAidKit'], 'Маленький контейнер для лекарств.', None),
    # еда и вода
    ('canteen', 'Фляга', 'Canteen', ['вода', 'ёмкость'], ['Canteen'], 'Главная ёмкость для воды. Найденную флягу сначала вылей.', 'food/found-bottles'),
    ('water-bottle', 'Бутылка воды', 'Water Bottle', ['вода', 'ёмкость'], ['WaterBottle'], 'Лёгкая ёмкость на 1 литр.', 'food/found-bottles'),
    ('can-opener', 'Консервный нож', 'Can Opener', ['еда', 'инструмент'], ['CanOpener'], 'Открывает банку без потерь. Ножом можно, но часть еды теряется.', 'food/canned-food'),
    ('beans', 'Печёная фасоль', 'Baked Beans', ['еда', 'консервы'], ['BakedBeansCan'], 'Сытная и частая консерва.', 'food/canned-food'),
    ('tactical-bacon', 'Тактический бекон', 'Tactical Bacon', ['еда', 'консервы'], ['TacticalBaconCan'], 'Одна из самых сытных консерв.', 'food/canned-food'),
    ('pot', 'Кастрюля', 'Cooking Pot', ['еда', 'готовка', 'вода'], ['Pot'], 'Готовка и кипячение воды.', 'fire/cooking'),
    # инструменты и выживание
    ('kitchen-knife', 'Кухонный нож', 'Kitchen Knife', ['инструмент', 'нож'], ['KitchenKnife'], 'Разделка туш, крафт тряпок, открытие банок.', None),
    ('hunting-knife', 'Охотничий нож', 'Hunting Knife', ['инструмент', 'нож'], ['HuntingKnife'], 'Прочный нож для разделки и боя.', None),
    ('hatchet', 'Топорик', 'Hatchet', ['инструмент', 'дрова', 'оружие'], ['Hatchet'], 'Дрова, ветки, хорошее холодное оружие.', 'fire/light-fire'),
    ('matches', 'Спички', 'Matchbox', ['огонь'], ['Matchbox'], 'Розжиг костра. Боятся воды.', 'fire/light-fire'),
    ('lighter', 'Зажигалка', 'Lighter', ['огонь'], ['PetrolLighter'], 'Розжиг костра, работает много раз.', 'fire/light-fire'),
    ('compass', 'Компас', 'Compass', ['навигация'], ['Compass'], 'Север — и уже не заблудишься.', None),
    ('map', 'Карта Чернаруси', 'Chernarus Map', ['навигация'], ['ChernarusMap'], 'Бумажная карта в игре.', None),
    ('binoculars', 'Бинокль', 'Binoculars', ['навигация', 'разведка'], ['Binoculars'], 'Сначала посмотри, потом иди.', None),
    ('flashlight', 'Фонарик', 'Flashlight', ['свет'], ['Flashlight'], 'Свет ночью. Нужна батарейка 9V.', None),
    ('headtorch', 'Налобный фонарь', 'Headtorch', ['свет'], ['Headtorch_Black', 'Headtorch_Grey'], 'Руки остаются свободными.', None),
    ('battery', 'Батарейка 9V', '9V Battery', ['свет', 'рация'], ['Battery9V'], 'Для фонарей, рации, прицелов.', None),
    ('duct-tape', 'Изолента', 'Duct Tape', ['ремонт', 'крафт'], ['DuctTape'], 'Чинит снаряжение, нужна в крафте.', None),
    ('rope', 'Верёвка', 'Rope', ['крафт'], ['Rope'], 'Для крафта рюкзака, лука и сооружений.', 'crafting/rope'),
    ('shovel', 'Лопата', 'Shovel', ['инструмент', 'база'], ['Shovel', 'FieldShovel'], 'Тайники, огород, база.', None),
    ('gas-mask', 'Противогаз', 'Gas Mask', ['газ', 'защита'], ['GasMask', 'GP5GasMask', 'AirborneMask'], 'Без фильтра и ОЗК в газе всё равно опасно.', 'diseases/gas-poisoning'),
    # одежда
    ('taloon', 'Рюкзак Taloon', 'Taloon Backpack', ['рюкзак', 'одежда'], ['TaloonBag_Blue', 'TaloonBag_Green', 'TaloonBag_Orange', 'TaloonBag_Violet'], 'Частый средний рюкзак.', None),
    ('hunting-bag', 'Охотничий рюкзак', 'Hunting Backpack', ['рюкзак', 'одежда'], ['HuntingBag'], 'Большой рюкзак охотника.', None),
    ('raincoat', 'Дождевик', 'Raincoat', ['одежда', 'дождь'], ['Raincoat_Orange', 'Raincoat_Green', 'Raincoat_Yellow', 'Raincoat_Pink', 'Raincoat_Red', 'Raincoat_Blue', 'Raincoat_Black'], 'Не даёт промокнуть.', 'fire/wet-clothes'),
    ('gloves', 'Перчатки', 'Work Gloves', ['одежда', 'руки'], ['WorkingGloves_Yellow', 'WorkingGloves_Black', 'WorkingGloves_Beige', 'WorkingGloves_Brown'], 'Руки не пачкаются кровью — меньше болезней.', 'food/bloody-hands'),
]

CHECK_MAG = {'bk133', 'scr16', 'tundra', 'repeater'}

AMMO = {
    '9x19': ['Ammo_9x19', 'AmmoBox_9x19_25rnd'], '.45 ACP': ['Ammo_45ACP', 'AmmoBox_45ACP_25rnd'],
    '.380 ACP': ['Ammo_380', 'AmmoBox_380_35rnd'], '.357': ['Ammo_357', 'AmmoBox_357_20Rnd'],
    '.22 LR': ['Ammo_22', 'AmmoBox_22_50Rnd'], '12 калибр': ['Ammo_12gaPellets', 'Ammo_12gaSlug', 'AmmoBox_00buck_10rnd', 'AmmoBox_12gaSlug_10Rnd'],
    '7.62x39': ['Ammo_762x39', 'AmmoBox_762x39_20Rnd'], '7.62x54R': ['Ammo_762x54', 'AmmoBox_762x54_20Rnd'],
    '.308 Win': ['Ammo_308Win', 'AmmoBox_308Win_20Rnd'], '5.56x45': ['Ammo_556x45', 'AmmoBox_556x45_20Rnd'],
    '5.45x39': ['Ammo_545x39', 'AmmoBox_545x39_20Rnd'], '9x39': ['Ammo_9x39', 'AmmoBox_9x39_20Rnd'],
    'Болты': ['Ammo_HuntingBolt'],
}


def main(types_path):
    T = load(types_path)
    # оружие
    wpath = os.path.join(ROOT, 'data', 'weapons.json')
    W = json.load(open(wpath, encoding='utf-8'))
    for w in W:
        line, spawn = describe(merge(T, WEAPONS.get(w['id'], [])))
        if not line:
            print('нет данных:', w['id']); continue
        w['where'] = line
        w['spawn'] = spawn
        am = merge(T, AMMO.get(w['caliber'], []))
        if am and am['nominal']:
            w['ammo_where'] = 'Патроны ' + w['caliber'] + ': ' + ', '.join(USAGE.get(u, u) for u in am['usage']) + '.'
        else:
            w.pop('ammo_where', None)
        if w['id'] in CHECK_MAG:
            w['needs_check'] = True
            w['check_note'] = 'ёмкость встроенного магазина уточнить'
        else:
            w.pop('needs_check', None); w.pop('check_note', None)
    json.dump(W, open(wpath, 'w', encoding='utf-8'), ensure_ascii=False, indent=2)

    # справочник «Где найти»
    items = []
    for (iid, ru, en, tags, classes, tip, card) in LOOT:
        line, spawn = describe(merge(T, classes))
        if not line:
            print('нет данных:', iid); continue
        it = {'id': iid, 'title': ru, 'title_en': en, 'tags': ['где найти'] + tags,
              'summary': tip, 'where': line, 'spawn': spawn}
        if card: it['see'] = '#' + card
        items.append(it)
    for cal, classes in AMMO.items():
        line, spawn = describe(merge(T, classes))
        if not line: continue
        items.append({'id': 'ammo-' + ''.join(ch for ch in cal.lower() if ch.isalnum()),
                      'title': 'Болты для арбалета' if cal == 'Болты' else 'Патроны ' + cal,
                      'title_en': 'Ammo ' + cal, 'tags': ['где найти', 'патроны', cal],
                      'summary': 'Россыпью и в коробках. Оружие под этот калибр — в разделе «Оружие и патроны».',
                      'where': line, 'spawn': spawn, 'see': '#weapons?f=' + cal})
    json.dump(items, open(os.path.join(ROOT, 'data', 'loot.json'), 'w', encoding='utf-8'), ensure_ascii=False, indent=2)
    print('оружие:', len(W), 'предметов:', len(items))


if __name__ == '__main__':
    main(sys.argv[1] if len(sys.argv) > 1 else 'types.xml')
