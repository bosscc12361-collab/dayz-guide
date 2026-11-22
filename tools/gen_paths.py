"""Маршруты по дорогам: ищет путь по светлым серым пикселям подложки между точками маршрута.
python3 tools/gen_paths.py ПАПКА_С_ФАЙЛАМИ data/map.json tools/tga.py"""
import sys,json,heapq,math
from PIL import Image,ImageFilter,ImageDraw
D=sys.argv[1]; M=json.load(open(sys.argv[2])); L=15360; N=2048; k=N/L
exec(open(sys.argv[3]).read())  # load() для tga
sea=load_tga(D+'/water-sea.tga').resize((N,N)).load()
im=Image.open(D+'/map.png').convert('RGB'); 
g=im.convert('L'); med=g.filter(ImageFilter.BoxBlur(6)); gp,mp=g.load(),med.load()
hs=im.convert('HSV').load()
def road(x,y):
    h,s,v=hs[x,y]; # серое (низкая насыщенность) и светлее окрестности
    a=max(0,min(1,(105-s)/60)); b=max(0,min(1,(gp[x,y]-mp[x,y]+2)/14))
    return a*.55+b*.45
R=[[0]*N for _ in range(N)]
def cost(x,y):
    c=R[y][x]
    if not c:
        c=40 if sea[x,y] else 1+14*(1-road(x,y))**2
        R[y][x]=c
    return c
def path(a,b,pad=160):
    ax,ay=a;bx,by=b
    x0,x1=max(0,min(ax,bx)-pad),min(N-1,max(ax,bx)+pad);y0,y1=max(0,min(ay,by)-pad),min(N-1,max(ay,by)+pad)
    dist={(ax,ay):0};pr={};q=[(0,ax,ay)]
    while q:
        d,x,y=heapq.heappop(q)
        if (x,y)==(bx,by):break
        if d>dist[(x,y)]:continue
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            u,v=x+dx,y+dy
            if x0<=u<=x1 and y0<=v<=y1:
                nd=d+cost(u,v)*(1.414 if dx and dy else 1)
                if nd<dist.get((u,v),1e18): dist[(u,v)]=nd;pr[(u,v)]=(x,y);heapq.heappush(q,(nd,u,v))
    p=[(bx,by)]
    while p[-1]!=(ax,ay): p.append(pr[p[-1]])
    return p[::-1]
def rdp(p,e):
    if len(p)<3:return p
    (x1,y1),(x2,y2)=p[0],p[-1];l=math.hypot(x2-x1,y2-y1) or 1e-9
    m,i=max((abs((x2-x1)*(y1-y)-(x1-x)*(y2-y1))/l if (x1,y1)!=(x2,y2) else math.hypot(x-x1,y-y1),i) for i,(x,y) in enumerate(p[1:-1],1))
    return rdp(p[:i+1],e)[:-1]+rdp(p[i:],e) if m>e else [p[0],p[-1]]
PL={t['id']:t for t in M['towns']+M['military']}
PL['t-chernogorsk']=dict(PL['t-chernogorsk'],x=6560,z=2560)
VIA=json.load(open(sys.argv[4])) if len(sys.argv)>4 else {}
out={}
for r in M['routes']:
    wp=VIA.get(r['id']) or [[PL[i]['x'],PL[i]['z']] for i in r['wp']]
    px=[(round(x*k),round((L-z)*k)) for x,z in wp]
    full=[px[0]]
    for a,b in zip(px,px[1:]): full+=path(a,b)[1:]
    sp=rdp(full,1.1); out[r['id']]=[[round((x+.5)/k),round(L-(y+.5)/k)] for x,y in sp]
    seaN=sum(1 for x,y in full if sea[x,y]); km=sum(math.hypot(a[0]-b[0],a[1]-b[1]) for a,b in zip(out[r['id']],out[r['id']][1:]))/1000
    print(r['id'],len(sp),'точек',round(km,1),'км, в море пикселей:',seaN)
json.dump(out,open(D+'/paths.json','w'))
