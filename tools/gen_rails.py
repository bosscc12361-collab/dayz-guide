import sys,json,math
from collections import defaultdict
from PIL import Image
exec(open(sys.argv[2]).read())
D=sys.argv[1]
v=json.load(open('data/map-vec.json'));R=[(a[0],a[1]) for a in v['rails']]
g=defaultdict(list)
for i,(x,z) in enumerate(R): g[(x//60,z//60)].append(i)
E=set()
for i,(x,z) in enumerate(R):
    c=[]
    for dx in(-1,0,1):
        for dz in(-1,0,1):
            for j in g[(x//60+dx,z//60+dz)]:
                d=math.dist(R[i],R[j])
                if 12<=d<=48: c.append((d,j))
    c.sort(); f=None
    for d,j in c:
        a=math.atan2(R[j][1]-z,R[j][0]-x)
        if f is None: f=a;E.add((min(i,j),max(i,j)))
        elif math.cos(a-f)<-0.75: E.add((min(i,j),max(i,j)));break
v['rails']=[[*R[i],*R[j]] for i,j in sorted(E)]
json.dump(v,open('data/map-vec.json','w'),separators=(',',':'),ensure_ascii=False);print(len(E),'отрезков')
M=json.load(open('data/map.json'));sea=load_tga(D+'/water-sea.tga')
for t in M['towns']:
    if sea.getpixel((min(4095,int(t['x']/15360*4096)),min(4095,int((15360-t['z'])/15360*4096)))): print('в море:',t['name'],t['x'],t['z'])
    if t['id']=='t-chernogorsk': t['x'],t['z']=6560,2560
json.dump(M,open('data/map.json','w'),ensure_ascii=False,separators=(',',':'))
