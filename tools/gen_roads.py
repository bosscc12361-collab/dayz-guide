import sys,json,heapq,math
from PIL import Image,ImageFilter,ImageDraw
D=sys.argv[1];M=json.load(open(sys.argv[2]));L=15360;N=2048;k=N/L
exec(open(sys.argv[3]).read())
seaI=load_tga(D+'/water-sea.tga').resize((N,N));sea=seaI.load()
im=Image.open(D+'/map.png').convert('RGB');g=im.convert('L');med=g.filter(ImageFilter.BoxBlur(6));gp,mp=g.load(),med.load();hs=im.convert('HSV').load()
def road(x,y):
    h,s,v=hs[x,y];a=max(0,min(1,(105-s)/60));b=max(0,min(1,(gp[x,y]-mp[x,y]+2)/14));return a*.55+b*.45
R=[[None]*N for _ in range(N)]
def rd(x,y):
    c=R[y][x]
    if c is None: c=R[y][x]=-1 if sea[x,y] else road(x,y)
    return c
used={}
def path(a,b,pad=120):
    ax,ay=a;bx,by=b;x0,x1=max(0,min(ax,bx)-pad),min(N-1,max(ax,bx)+pad);y0,y1=max(0,min(ay,by)-pad),min(N-1,max(ay,by)+pad)
    dist={(ax,ay):0};pr={};q=[(0,ax,ay)]
    while q:
        d,x,y=heapq.heappop(q)
        if (x,y)==(bx,by):break
        if d>dist[(x,y)]:continue
        for dx,dy in((1,0),(-1,0),(0,1),(0,-1),(1,1),(1,-1),(-1,1),(-1,-1)):
            u,v=x+dx,y+dy
            if x0<=u<=x1 and y0<=v<=y1:
                r=rd(u,v);c=40 if r<0 else 1+14*(1-r)**2
                if (u,v) in used: c*=.6   # прилипаем к уже найденной дороге
                nd=d+c*(1.414 if dx and dy else 1)
                if nd<dist.get((u,v),1e18):dist[(u,v)]=nd;pr[(u,v)]=(x,y);heapq.heappush(q,(nd,u,v))
    p=[(bx,by)]
    while p[-1]!=(ax,ay):p.append(pr[p[-1]])
    return p[::-1]
P=[(t['x'],t['z']) for t in M['towns']+M['military']]
# узлы: города, военка + сетка опорных точек на «дорожных» пикселях
pairs=set()
for i,a in enumerate(P):
    for j in sorted(range(len(P)),key=lambda j:math.dist(a,P[j]))[1:7]: pairs.add((min(i,j),max(i,j)))
pairs=sorted(pairs,key=lambda t:math.dist(P[t[0]],P[t[1]]))
good=set();segs=[]
px=lambda p:(round(p[0]*k),round((L-p[1])*k))
def keep(p,W=16,T=.44):
    s=[max(0,rd(*q)) for q in p];out=[];n=len(p)
    ok=[sum(s[max(0,i-W):i+W+1])/len(s[max(0,i-W):i+W+1])>=T for i in range(n)]
    i=0
    while i<n:
        if ok[i]:
            j=i
            while j<n and ok[j]: j+=1
            if j-i>=10: out.append(p[i:j])
            i=j
        else:i+=1
    return out
for a,b in pairs:
    for q in keep(path(px(P[a]),px(P[b]))):
        run=[]
        for c in q:
            near=any((c[0]+dx,c[1]+dy) in used for dx in(-1,0,1) for dy in(-1,0,1))
            if near:
                if len(run)>=5: segs.append(run+[c])
                run=[c] if 0 else []
            else: run.append(c)
        if len(run)>=5: segs.append(run)
        for c in q: used[c]=1
def rdp(p,e):
    if len(p)<3:return p
    (x1,y1),(x2,y2)=p[0],p[-1];l=math.hypot(x2-x1,y2-y1)
    m,i=max(((abs((x2-x1)*(y1-y)-(x1-x)*(y2-y1))/l if l else math.hypot(x-x1,y-y1)),i) for i,(x,y) in enumerate(p[1:-1],1))
    return rdp(p[:i+1],e)[:-1]+rdp(p[i:],e) if m>e else [p[0],p[-1]]
def sm(p):
    for _ in range(2):
        q=[p[0]]
        for a,b in zip(p,p[1:]): q+=[(a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25),(a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75)]
        p=q+[p[-1]]
    return p
out=[]
for s in segs:
    # усреднение по 5 точек убирает пиксельные ступеньки
    a=[(sum(q[0] for q in s[max(0,i-2):i+3])/len(s[max(0,i-2):i+3]),sum(q[1] for q in s[max(0,i-2):i+3])/len(s[max(0,i-2):i+3])) for i in range(len(s))];a[0],a[-1]=s[0],s[-1]
    out.append([[round((x+.5)/k),round(L-(y+.5)/k)] for x,y in rdp(a,.45)])
km=sum(math.dist(a,b) for s in out for a,b in zip(s,s[1:]))/1000
print(len(pairs),'пар',len(out),'линий',round(km),'км, точек',sum(map(len,out)))
json.dump(out,open(D+'/roads.json','w'),separators=(',',':'))
b=Image.open(D+'/chernarus.jpg');c=b.resize((2000,2000));d=ImageDraw.Draw(c)
for s in out:d.line([(x/L*2000,(L-z)/L*2000) for x,z in s],fill=(255,220,60),width=2)
c.save(D+'/roads.png');c.crop((700,700,1500,1500)).save(D+'/roads_c.png')
