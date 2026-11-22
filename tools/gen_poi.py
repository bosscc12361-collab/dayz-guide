import sys,re,json,math,collections
import xml.etree.ElementTree as ET
D=sys.argv[1];M=json.load(open(sys.argv[2]));NM=json.load(open(D+'/names.json'))
us={g.get('name'):[u.get('name') for u in g.findall('usage')] for g in ET.parse(D+'/mapgroupproto.xml').getroot().iter('group')}
O=collections.defaultdict(list)
for m in re.finditer(r'<group name="(?:Land_)?([^"]+)" pos="([-\d.]+) [-\d.]+ ([-\d.]+)"',open(D+'/mapgrouppos.xml').read()): O[m[1]].append((float(m[2]),float(m[3])))
FULL={re.sub('^Land_','',k):v for k,v in us.items()}
def get(rx): return [(x,z,n) for n,l in O.items() if re.fullmatch(rx,n) for x,z in l]
def near(x,z): return min(M['towns'],key=lambda t:math.dist((x,z),(t['x'],t['z'])))['name']
def clu(pts,eps):
    pts=list(pts);out=[]
    while pts:
        c=[pts.pop()];i=0
        while i<len(c):
            r=[q for q in pts if math.dist(c[i][:2],q[:2])<=eps]
            for q in r: pts.remove(q)
            c+=r;i+=1
        out.append(c)
    return out
def mid(c): return round(sum(p[0] for p in c)/len(c)),round(sum(p[1] for p in c)/len(c))
P=[]
def add(k,x,z,t=None,s=None,**kw):
    e={'k':k,'x':round(x),'z':round(z)}
    if t:e['t']=t
    e['s']=s if s is not None else near(x,z)
    e.update(kw);P.append(e)
# --- военка
mil=[p for n,l in O.items() if 'Military' in FULL.get(n,[]) and not re.match(r'Container|Wreck_off|Ship|Mil_FireStation',n) for p in [(x,z,n) for x,z in l]]
ms=[]
for c in clu(mil,170):
    x,z=mid(c);nm=[m for m in M['military'] if min(math.dist(p[:2],(m['x'],m['z'])) for p in c)<(m.get('danger',400))]
    cnt=collections.Counter(re.sub(r'_?\d.*$','',p[2]) for p in c);tent=sum(v for k,v in cnt.items() if 'Tent' in k);bar=sum(v for k,v in cnt.items() if 'Barracks' in k);nest=sum(v for k,v in cnt.items() if 'Nest' in k or 'Guard' in k)
    ms.append((len(c),x,z,[m['name'] for m in nm],dict(cnt)))
    if nm: continue
    if any('C130' in p[2] for p in c) and len(c)==1: add('plane',x,z,'Разбитый самолёт C-130');continue
    if any(p[2].startswith('Tisy') for p in c): t='Военный объект'
    elif bar>=2 or (bar and len(c)>3): t='Военная база'
    elif tent>=3: t='Палаточный лагерь'
    elif bar: t='Казарма'
    elif tent: t='Военные палатки'
    elif nest: t='Блокпост'
    else: t='Военный объект'
    rad=max(math.dist((x,z),p[:2]) for p in c)
    parts=[]
    if bar:parts.append(f'казармы: {bar}')
    if tent:parts.append(f'палатки: {tent}')
    if nest:parts.append(f'вышки и укрытия: {nest}')
    add('mil',x,z,t,danger=int(max(180,min(400,rad+150))),n=', '.join(parts))
for r in sorted(ms,reverse=True): print(r)
for c in clu(get(r'Container_1Moh?'),150): add('milbox',*mid(c),'Военные контейнеры',n=f'контейнеров: {len(c)}')
MP=[(m['x'],m['z'],m.get('danger',400)) for m in M['military']]+[(p['x'],p['z'],p['danger']) for p in P if p['k']=='mil']
for x,z,n in get('Mil_Guardhouse1'):
    if all(math.dist((x,z),q[:2])>q[2] for q in MP) and all(math.dist((x,z),p[:2])>60 for p in M['points']['police']): add('guard',x,z,'Караулка')
# --- домики, лагеря
CAMP={c:(n,x,z) for c,n,x,z in NM['Camp']};used=set()
for c in clu(get(r'Camp_House_\w+'),130):
    x,z=mid(c);b=min(CAMP.items(),key=lambda t:math.dist((x,z),t[1][1:]))
    if math.dist((x,z),b[1][1:])<400: used.add(b[0]);add('camp',x,z,'Лагерь «'+b[1][0]+'»',n=f'домиков: {len(c)}')
    elif len(c)>=4: add('camp',x,z,'Лагерь',n=f'домиков: {len(c)}')
    else: add('cabin',x,z,'Лесной домик' if len(c)==1 else 'Лесные домики',n=f'домиков: {len(c)}' if len(c)>1 else '')
for c,(n,x,z) in CAMP.items():
    if c not in used: add('camp',x,z,'Лагерь «'+n+'»')
# одинокие дома вдали от посёлков
H=clu(get(r'House_\d\w+'),150);big=[q for c in H if len(c)>=8 for q in c]
nc=0
for c in H:
    x,z=mid(c)
    if len(c)<=3 and min(math.dist((x,z),q[:2]) for q in big)>330 and min(math.dist((x,z),(t['x'],t['z'])) for t in M['towns'])>380:
        add('cabin',x,z,'Одинокий дом' if len(c)==1 else 'Хутор',n=f'домов: {len(c)}' if len(c)>1 else '');nc+=1
print('домики',nc)
# --- ориентиры
for c,n,x,z in NM['Ruin']: add('castle',x,z,'Замок «'+n+'»' if 'замок' not in n else n)
def simple(k,rx,t,eps=60):
    for c in clu(get(rx),eps): add(k,*mid(c),t)
simple('feed','Misc_FeedShack','Кормушка для зверей',30);simple('feed',r'Misc_TrailRoof_\w+','Навес на тропе',30)
simple('church',r'Church\w*','Церковь');simple('church',r'Chapel','Часовня')
simple('light','Lighthouse','Маяк');simple('fuel','FuelStation_Build','Заправка',120);simple('rail',r'Rail_Station_\w+','Вокзал',120)
simple('tower',r'Tower_TC\d\w*','Вышка связи');simple('fire','City_FireStation','Пожарная часть');simple('fire','Mil_FireStation','Военная пожарная часть');simple('school','City_School','Школа',120)
simple('saw',r'Sawmill_\w+','Лесопилка',350);simple('quarry',r'Quarry_Main|Mine_Building','Карьер / шахта',350);simple('prison',r'Prison_\w+','Тюрьма',200)
simple('fun',r'Lunapark_\w+','Парк аттракционов',250);simple('hotel',r'Hotel\w*','Гостиница',100);simple('ship',r'Ship_Big_\w+','Корабль (газ!)',400)
simple('factory',r'CementWorks\w+|Factory\w+|Smokestack\w+|CoalPlant\w+','Завод',300);simple('port',r'Pier_Crane_\w','Порт',400);simple('build',r'Construction_\w+','Стройка',250)
simple('power','Power_Station','Подстанция',150)
for c in clu(get(r'Farm_Cowshed\w|Barn_\w+'),170):
    if len(c)>=2: add('farm',*mid(c),'Ферма',n=f'построек: {len(c)}')
simple('shop',r'City_Store\w*','Супермаркет');simple('shop','Village_store','Сельский магазин')
for c,n,x,z in NM['ViewPoint']: add('view',x,z,'Смотровая точка')
# --- названия местности
names=[['hill',n,x,z] for c,n,x,z in NM['Hill']]+[['lake' if re.search('озер|Пруд|Плотина|Глаза|Вербник|Озерко',n) else 'sea',n,x,z] for c,n,x,z in NM['Marine']]
names+=[['sea' if n in('Рифы','Отмель') else 'loc',n,x,z] for c,n,x,z in NM['Local'] if not re.match(r'Local_(MB|AF)_',c)]
# --- события: машины, вертолёты, конвои
ev=collections.defaultdict(list)
LAB={'VehicleCivilianSedan':'Седан «Ольга»','VehicleHatchback02':'Хэтчбек «Гюнтер»','VehicleOffroadHatchback':'Нива «Ада»','VehicleSedan02':'Седан «Сарка»','VehicleTruck01':'Грузовик М3С','VehicleOffroad02':'Хамви','VehicleMotorbike':'Мотоцикл','VehicleTransitBus':'Автобус','VehicleBoat':'Лодка'}
for e in ET.parse(D+'/cfgeventspawns.xml').getroot().iter('event'):
    n=e.get('name');k='car' if n in LAB else {'StaticHeliCrash':'heli','StaticMilitaryConvoy':'convoy','StaticPoliceSituation':'pol','StaticTrain':'train'}.get(n)
    if not k: continue
    for q in e.findall('pos'): ev[k].append([round(float(q.get('x'))),round(float(q.get('z')))]+([list(LAB).index(n)] if k=='car' else []))
print({k:len(v) for k,v in ev.items()},len(names)); c=collections.Counter(p['k'] for p in P);print(c,sum(c.values()))
print([(LAB[list(LAB)[i]],n) for i,n in sorted(collections.Counter(q[2] for q in ev['car']).items())])
json.dump({'poi':P,'names':names,'events':ev,'cars':list(LAB.values()),'license':'ADPL-SA, © Bohemia Interactive, DayZ-Central-Economy; названия — из конфигурации игры'},open('data/map-poi.json','w'),ensure_ascii=False,separators=(',',':'))
