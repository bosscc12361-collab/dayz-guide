"""Сетка проходимости 640×640 (24 м) для навигатора: 0 поле, 1 дорога, 2 лес, 3 море.
python3 tools/gen_grid.py ПАПКА tools/tga.py  (нужны map.png, water-sea.tga, forest.png, roads.json)"""
import sys,json,base64
from PIL import Image,ImageFilter,ImageChops,ImageDraw
D=sys.argv[1];exec(open(sys.argv[2]).read());N=640;L=15360
src=Image.open(D+'/map.png').convert('L');rgb=Image.open(D+'/map.png').convert('RGB')
sea=load_tga(D+'/water-sea.tga').point(lambda v:255 if v else 0).resize((N,N),Image.BOX)
forest=Image.open(D+'/forest.png').resize((N,N),Image.BOX)
dog=ImageChops.subtract(src.filter(ImageFilter.GaussianBlur(.6)),src.filter(ImageFilter.GaussianBlur(4.5)))
satm=rgb.convert('HSV').split()[1].filter(ImageFilter.GaussianBlur(1)).point(lambda v:max(0,min(255,int((118-v)*4.2))))
resp=ImageChops.multiply(dog.point(lambda v:min(255,v*16)),satm).point(lambda v:255 if v>90 else 0)
rd=resp.filter(ImageFilter.MaxFilter(3)).resize((N,N),Image.BOX).point(lambda v:255 if v>105 else 0)
d=ImageDraw.Draw(rd)
for r in json.load(open(D+'/roads.json')): d.line([(x/L*N,(L-z)/L*N) for x,z in r],fill=255,width=1)
sp,fp,rp=sea.load(),forest.load(),rd.load();cls=bytearray(N*N);c=[0]*4
for y in range(N):
    for x in range(N):
        k=3 if sp[x,y]>140 else 1 if rp[x,y] else 2 if fp[x,y]>128 else 0
        cls[y*N+x]=k;c[k]+=1
b=bytearray(N*N//4)
for i,k in enumerate(cls): b[i>>2]|=k<<((i&3)*2)
json.dump({'n':N,'g':base64.b64encode(bytes(b)).decode(),'license':'ADPL-SA, © Bohemia Interactive, DayZ-Central-Economy'},open('data/map-grid.json','w'),separators=(',',':'))
print(c)
