import sys,json,math,random
from PIL import Image,ImageFilter,ImageDraw,ImageEnhance,ImageChops
D=sys.argv[1];L=15360;exec(open(sys.argv[2]).read());random.seed(7)
G=8192;K=G/L
base=Image.open(D+'/chernarus_hq.png') if 0 else Image.open(D+'/chernarus.jpg').convert('RGB')
src=Image.open(D+'/map.png').convert('L');sea=load_tga(D+'/water-sea.tga')
# лес: темнее порога, без моря, мелочь убрана
f=src.filter(ImageFilter.GaussianBlur(1.3)).point(lambda v:255 if v<43 else 0)
f=ImageChops.subtract(f,sea.point(lambda v:255 if v else 0).resize(f.size)).filter(ImageFilter.MedianFilter(5))
f.save(D+'/forest.png')
# дороги и асфальт: светлее окрестностей и малонасыщенные
rgb=Image.open(D+'/map.png').convert('RGB')
dog=ImageChops.subtract(src.filter(ImageFilter.GaussianBlur(.6)),src.filter(ImageFilter.GaussianBlur(4.5)))
satm=rgb.convert('HSV').split()[1].filter(ImageFilter.GaussianBlur(1)).point(lambda v:max(0,min(255,int((118-v)*4.2))))
resp=ImageChops.multiply(dog.point(lambda v:min(255,v*16)),satm)
resp=ImageChops.subtract(resp,sea.point(lambda v:255 if v else 0).resize(resp.size))
R=json.load(open(D+'/roads.json'))
def sm(p):
    for _ in range(3):
        q=[p[0]]
        for a,b in zip(p,p[1:]): q+=[(a[0]*.75+b[0]*.25,a[1]*.75+b[1]*.25),(a[0]*.25+b[0]*.75,a[1]*.25+b[1]*.75)]
        p=q+[p[-1]]
    return p
RS=[[(x*K,(L-z)*K) for x,z in sm(r)] for r in R]
RB=[(min(p[0] for p in r),min(p[1] for p in r),max(p[0] for p in r),max(p[1] for p in r)) for r in RS]
def tile(x0,y0,w):  # в пикселях G
    s=base.width/G;pad=8
    box=((x0-pad)*s,(y0-pad)*s,(x0+w+pad)*s,(y0+w+pad)*s)
    t=base.transform((w+2*pad,w+2*pad),Image.EXTENT,box,Image.BICUBIC)
    blur=t.filter(ImageFilter.GaussianBlur(2))
    fm=f.transform(t.size,Image.EXTENT,box,Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.5))
    # маска дорог: плавное увеличение + порог = чёткий край
    rm=resp.transform(t.size,Image.EXTENT,box,Image.BICUBIC).filter(ImageFilter.GaussianBlur(1.1)).point(lambda v:max(0,min(255,int((v-64)*4.2))))
    rd=ImageDraw.Draw(rm)
    for r,b in zip(RS,RB):
        if b[2]<x0-20 or b[0]>x0+w+20 or b[3]<y0-20 or b[1]>y0+w+20: continue
        rd.line([(x-x0+pad,y-y0+pad) for x,y in r],fill=255,width=4,joint='curve')
    rm=rm.filter(ImageFilter.GaussianBlur(.6))
    # резкость подложки
    t=t.filter(ImageFilter.UnsharpMask(4,45,2))
    # зерно на полях
    n=Image.effect_noise(t.size,11).filter(ImageFilter.GaussianBlur(.6))
    g_=Image.merge('RGB',[ImageChops.add(c,n,1,-128) for c in t.split()])
    sm_=sea.resize((2048,2048)).point(lambda v:255 if v else 0).transform(t.size,Image.EXTENT,box,Image.BICUBIC)
    t=Image.composite(t,g_,sm_)
    edge=rm.filter(ImageFilter.MaxFilter(3)).filter(ImageFilter.GaussianBlur(.8)).point(lambda v:int(v*.55))
    t=Image.composite(Image.new('RGB',t.size,(58,56,46)),t,edge)
    roadc=ImageEnhance.Color(ImageEnhance.Brightness(blur).enhance(1.32)).enhance(.45)
    t=Image.composite(Image.blend(roadc,Image.new('RGB',t.size,(188,180,160)),.45),t,rm.point(lambda v:int(v*.92)))
    rp=rm.load()
    d=ImageDraw.Draw(t);fp=fm.load();bp=blur.load();W=t.width;step=5
    sh=Image.new('L',t.size,0);sd=ImageDraw.Draw(sh);trees=[]
    for y in range(0,W,step):
        for x in range(0,W,step):
            X=x+random.random()*step*1.2-step*.1;Y=y+random.random()*step*1.2-step*.1
            if 0<=X<W and 0<=Y<W and fp[int(X),int(Y)]>128 and rp[int(X),int(Y)]<60: trees.append((X,Y,1.7+random.random()*2.1,random.random()))
    for X,Y,r,q in trees: sd.ellipse((X-r+1.6,Y-r+1.8,X+r+1.6,Y+r+1.8),fill=120)
    t=Image.composite(Image.new('RGB',t.size,(22,28,18)),t,sh.filter(ImageFilter.GaussianBlur(.7)));d=ImageDraw.Draw(t)
    for X,Y,r,q in trees:
        c=bp[int(X),int(Y)];m=.72+q*.55
        col=(int(c[0]*m*.86),int(c[1]*m*1.0),int(c[2]*m*.92))
        d.ellipse((X-r,Y-r,X+r,Y+r),fill=col)
        if r>2.3:
            h=tuple(min(255,int(v*1.22)+6) for v in col);d.ellipse((X-r*.62,Y-r*.66,X+r*.18,Y+r*.14),fill=h)
    return t.crop((pad,pad,pad+w,pad+w))
if __name__=='__main__':
    o=Image.new('RGB',(1640,1640))
    for i,(cx,cz) in enumerate(((7600,5150),(6450,3000),(4500,10300),(10300,2300))):
        x0=int(cx*K-205);y0=int((L-cz)*K-205);t=tile(x0,y0,410).resize((820,820),Image.BICUBIC);o.paste(t,((i%2)*820,(i//2)*820))
    o.save(D+'/detail.png')

    import os
    if len(sys.argv)>3:
        out=sys.argv[3];os.makedirs(out,exist_ok=True);T=512;n=tot=0;skip=[]
        for ty in range(G//T):
            for tx in range(G//T):
                a=sea.crop((tx*256,ty*256,tx*256+256,ty*256+256))
                if a.getextrema()[0]>0: skip.append([tx,ty]);continue
                q=out+f'/{tx}_{ty}.webp';tile(tx*T,ty*T,T).save(q,quality=68,method=5);n+=1;tot+=os.path.getsize(q)
        print(n,'плиток',round(tot/1e6,1),'МБ, море',len(skip));json.dump(skip,open(D+'/skip.json','w'))
