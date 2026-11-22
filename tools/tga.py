def load_tga(p):
    b=open(p,'rb').read(); w=b[12]|b[13]<<8; h=b[14]|b[15]<<8; i=18+b[0]; o=bytearray(); N=w*h
    while len(o)<N and i<len(b):
        c=b[i]; i+=1
        if c&128: o+=bytes([b[i]])*((c&127)+1); i+=1
        else: o+=b[i:i+c+1]; i+=c+1
    return Image.frombytes('L',(w,h),bytes(o[:N].ljust(N,b'\0')))
