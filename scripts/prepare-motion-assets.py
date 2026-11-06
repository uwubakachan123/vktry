from pathlib import Path
import json
import math
from PIL import Image, ImageOps, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'public' / 'motion' / 'vktry'
OUT.mkdir(parents=True, exist_ok=True)
SOURCE = ROOT / 'design-assets' / 'motion-masters' / 'backdrop.png'
SIZE = (1440, 900)
bg = ImageOps.fit(Image.open(SOURCE).convert('RGB'), SIZE, method=Image.Resampling.LANCZOS)
bg.save(OUT / 'backdrop.webp', quality=98, method=6)
bg.save(OUT / 'backdrop.png', optimize=True)
foreground = bg.convert('RGBA')
a = Image.new('L', SIZE)
a.putdata([round(255 * max(0, min(1, (y - 820) / 65)) ** 2) for y in range(SIZE[1]) for _ in range(SIZE[0])])
foreground.putalpha(a)
foreground.save(OUT / 'chrome-foreground.webp', quality=98, method=6)
foreground.save(OUT / 'chrome-foreground.png', optimize=True)

products = [
 {'id':'grape','source':'grape.png','x':1030,'y':70,'width':200,'height':430,'rotation':4,'depth':0.35,'float':8,'duration':3.7,'phase':0.8,'shadow':{'x':1000,'y':641,'width':150,'height':30,'opacity':0.12},'reflection':{'x':1000,'y':660,'width':150,'height':44,'opacity':0.06}},
 {'id':'raspberry','source':'raspberry.png','x':710,'y':235,'width':265,'height':510,'rotation':-12,'depth':0.65,'float':12,'duration':3.2,'phase':1.4,'shadow':{'x':761,'y':713,'width':195,'height':36,'opacity':0.2},'reflection':{'x':763,'y':734,'width':195,'height':64,'opacity':0.09}},
 {'id':'original','source':'original-can.png','x':1030,'y':140,'width':385,'height':650,'rotation':16,'depth':1,'float':16,'duration':3.5,'phase':0,'shadow':{'x':892,'y':801,'width':290,'height':46,'opacity':0.25},'reflection':{'x':899,'y':818,'width':275,'height':88,'opacity':0.12}},
]
for p in products:
 im = Image.open(ROOT / 'design-assets' / 'source-images' / p['source']).convert('RGBA')
 im.save(OUT / f"can-{p['id']}.png", optimize=True)
 im.save(OUT / f"can-{p['id']}.webp", lossless=True, quality=100, method=6)
 mask = Image.new('RGBA', im.size, 'white'); mask.putalpha(im.getchannel('A'))
 mask.save(OUT / f"mask-{p['id']}.png", optimize=True)
 reflection = ImageOps.flip(im).resize((im.width, 260), Image.Resampling.LANCZOS)
 alpha = reflection.getchannel('A')
 fade = Image.new('L', reflection.size)
 fade.putdata([round(255 * max(0, 1-y/210) ** 1.7) for y in range(reflection.height) for _ in range(reflection.width)])
 from PIL import ImageChops
 reflection.putalpha(ImageChops.multiply(alpha,fade))
 reflection = reflection.filter(ImageFilter.GaussianBlur(1.4))
 reflection.save(OUT / f"reflection-{p['id']}.webp", quality=90, method=6)
 p.update({'src':f"can-{p['id']}.webp",'png':f"can-{p['id']}.png",'mask':f"mask-{p['id']}.png",'reflectionSrc':f"reflection-{p['id']}.webp",'nativeWidth':im.width,'nativeHeight':im.height,'encoding':'lossless-webp'})
 del p['source']
shadow=Image.new('RGBA',(600,120)); layer=Image.new('RGBA',shadow.size)
ImageDraw.Draw(layer).ellipse((65,43,535,77),fill=(1,8,20,200))
shadow=layer.filter(ImageFilter.GaussianBlur(17))
shadow.save(OUT / 'contact-shadow.png',optimize=True)
SCALE=2
fallback=bg.resize((SIZE[0]*SCALE,SIZE[1]*SCALE),Image.Resampling.LANCZOS).convert('RGBA')
for p in products:
 s=p['shadow']; sh=shadow.resize((s['width']*SCALE,s['height']*SCALE),Image.Resampling.LANCZOS)
 sh.putalpha(sh.getchannel('A').point(lambda a:round(a*s['opacity'])))
 fallback.alpha_composite(sh,(s['x']*SCALE,s['y']*SCALE))
for p in products:
 im=Image.open(OUT/p['png']).convert('RGBA')
 w,h=p['width']*SCALE,p['height']*SCALE
 im.thumbnail((w,h),Image.Resampling.LANCZOS)
 box=Image.new('RGBA',(w,h))
 box.alpha_composite(im,((w-im.width)//2,(h-im.height)//2))
 angle=math.radians(p['rotation']); c=math.cos(angle); s=math.sin(angle)
 corners=[(x*c-y*s,x*s+y*c) for x,y in [(0,0),(w,0),(0,h),(w,h)]]
 rotated=box.rotate(-p['rotation'],resample=Image.Resampling.BICUBIC,expand=True)
 fallback.alpha_composite(rotated,(round(p['x']*SCALE+min(x for x,y in corners)),round(p['y']*SCALE+min(y for x,y in corners))))
fallback=Image.alpha_composite(fallback,foreground.resize(fallback.size,Image.Resampling.LANCZOS))
fallback.convert('RGB').save(OUT/'campaign-fallback.webp',quality=98,method=6)
fallback.save(OUT/'campaign-fallback.png',optimize=True)
manifest={'version':2,'flavorOrder':['original','raspberry','grape'],'defaultFlavor':'original','imageInstructions':'VKTRY-Image-Replacement-Prompts.txt','quality':{'sourceCanPixels':[720,1456],'canExport':'lossless WebP + native PNG','fallbackPixels':[2880,1800],'note':'Can masters are native 720x1456, not 4K. Background in the 2x fallback is resampled; this adds no native backdrop detail.'},'artboard':{'width':1440,'height':900},'baseUrl':'motion/vktry/','backdrop':'backdrop.webp','foreground':'chrome-foreground.webp','shadow':'contact-shadow.png','fallback':'motion/vktry/campaign-fallback.webp','products':products,'motion':{'reducedMotion':'Static pose; no float, tilt, parallax or shimmer.','pointer':'Fine pointer only. Depth-scaled parallax, max 14px x / 8px y.','visibility':'Pause while outside viewport or while tab is hidden.','assetType':'Layered 2D product photography, not a 3D model or turntable.'}}
text=json.dumps(manifest,indent=2)+'\n'
(OUT / 'manifest.json').write_text(text)
(ROOT / 'src' / 'data' / 'hero-scene.json').write_text(text)
print(f'Prepared {len(list(OUT.iterdir()))} motion-ready assets in {OUT}')
