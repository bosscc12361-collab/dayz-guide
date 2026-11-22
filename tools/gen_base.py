"""Подложка карты и векторные слои из официального репозитория Bohemia DayZ-Central-Economy (ADPL-SA).
python3 tools/gen_base.py ПАПКА_С_ФАЙЛАМИ tools/tga.py  (нужны CETool/ChernarusPlus/map.png, layers/water-*.tga, mapgroupcluster*.xml)"""
import sys,json,re,glob,math
from PIL import Image,ImageFilter,ImageEnhance,ImageDraw,ImageChops
D=sys.argv[1];L=15360
exec(open(sys.argv[2]).read())
sea=load_tga(D+'/water-sea.tga');fr=load_tga(D+'/water-fresh.tga')
im=Image.open(D+'/map.png').convert('RGB')
im=im.point(lambda v:min(255,int(255*((v/255)**.55)*1.14)));im=ImageEnhance.Color(im).enhance(1.1);im=ImageEnhance.Contrast(im).enhance(1.08)
# чуть прохладнее, в тон сайту
r,g,b=im.split();im=Image.merge('RGB',(r.point(lambda v:int(v*.90)),g.point(lambda v:int(v*.97)),b.point(lambda v:min(255,int(v*1.12)))))
m=sea.resize(im.size,Image.LANCZOS).filter(ImageFilter.GaussianBlur(2)).point(lambda v:int(v*.0))if 0 else sea.point(lambda v:255 if v else 0).resize(im.size,Image.BILINEAR).filter(ImageFilter.GaussianBlur(1.5)).point(lambda v:int(v*.72))
im=Image.composite(Image.new('RGB',im.size,(14,52,104)),im,m)
im.save(D+'/chernarus.jpg',quality=82,optimize=True,progressive=True)
# реки: скелет вытянутых пятен
n=1024;f=fr.point(lambda v:255 if v else 0).resize((n,n),Image.BILINEAR).point(lambda v:255 if v>100 else 0);p=f.load()
s={(x,y) for y in range(n) for x in range(n) if p[x,y]}
comp=[];seen=set()
for q in s:
    if q in seen:continue
    st=[q];seen.add(q);c=[]
    while st:
        x,y=st.pop();c.append((x,y))
        for dx in(-2,-1,0,1,2):
            for dy in(-2,-1,0,1,2):
                t=(x+dx,y+dy)
                if t in s and t not in seen:seen.add(t);st.append(t)
    comp.append(c)
lines=[]
def thin(P):
    P=set(P);ch=True
    while ch:
        ch=False
        for step in(0,1):
            rem=[]
            for x,y in P:
                nb=[(x,y-1),(x+1,y-1),(x+1,y),(x+1,y+1),(x,y+1),(x-1,y+1),(x-1,y),(x-1,y-1)];v=[q in P for q in nb]
                B=sum(v);A=sum((not v[i]) and v[(i+1)%8] for i in range(8))
                if 2<=B<=6 and A==1:
                    a,b2,c2,d=v[0],v[2],v[4],v[6]
                    if (step==0 and not(a and b2 and c2) and not(b2 and c2 and d)) or (step==1 and not(a and b2 and d) and not(a and c2 and d)): rem.append((x,y))
            if rem: ch=True;P-=set(rem)
    return P
def far(P,s0):
    from collections import deque
    pr={s0:None};q=deque([s0]);l=s0
    while q:
        l=q.popleft();x,y=l
        for dx in(-1,0,1):
            for dy in(-1,0,1):
                t=(x+dx,y+dy)
                if t in P and t not in pr:pr[t]=l;q.append(t)
    o=[l]
    while pr[o[-1]] is not None:o.append(pr[o[-1]])
    return o
for c in comp:
    xs=[a for a,_ in c];ys=[b for _,b in c];ext=max(max(xs)-min(xs),max(ys)-min(ys))
    if ext<35: continue
    K=thin(c)
    while len(K)>12:
        a=far(K,next(iter(K)))[0];l=far(K,a)
        if len(l)>=14: lines.append([[round((x+.5)*L/n),round(L-(y+.5)*L/n)] for x,y in l[::3]+[l[-1]]])
        K-=set(l)
        if len(l)<14: break
rails=[];paths=[]
for q in sorted(glob.glob(D+'/mapgroupcluster*.xml')):
    for m in re.finditer(r'<group name="(Rail\d|Path\w+)" pos="([-\d.]+) [-\d.]+ ([-\d.]+)" a="([-\d.]+)"',open(q).read()):
        (rails if m[1][0]=='R' else paths).append([round(float(m[2])),round(float(m[3]))]+([round(float(m[4]))] if m[1][0]=='R' else []))
json.dump({'rivers':lines,'rails':rails,'paths':paths},open(D+'/vec.json','w'),separators=(',',':'))
print(len(lines),'рек',len(rails),len(paths))
# проверка домов
B=json.load(open(D+'/bld.json'));im=Image.open(D+'/chernarus.jpg');k=im.width/L;o=Image.new('RGB',(1500,750))
for i,(x0,z0,w) in enumerate(((6000,2100,1600),(9300,1500,1800))):
    c=im.crop((int(x0*k),int((L-z0-w)*k),int((x0+w)*k),int((L-z0)*k))).resize((748,748),Image.BICUBIC);d=ImageDraw.Draw(c);Z=748/w
    for b in B['b']:
        if x0<b[0]<x0+w and z0<b[1]<z0+w:
            t=B['types'][b[3]];a=math.radians(b[2]);pts=[]
            for sx,sy in((-1,-1),(1,-1),(1,1),(-1,1)):
                X=t[4]+sx*t[1]/2;Yy=-t[5]+sy*t[2]/2;pts.append(((b[0]-x0+X*math.cos(a)-Yy*math.sin(a))*Z,(z0+w-b[1]+X*math.sin(a)+Yy*math.cos(a))*Z))
            d.polygon(pts,fill=(226,232,245),outline=(40,50,70))
    o.paste(c,(i*750,0))
o.save(D+'/bld.png')
c=im.resize((1400,1400),Image.LANCZOS);d=ImageDraw.Draw(c)
for l in lines:d.line([(x/L*1400,(L-z)/L*1400) for x,z in l],fill=(70,170,255),width=2)
c.save(D+'/base.png')
