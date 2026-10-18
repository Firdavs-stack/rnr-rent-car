"""Import reviewed CC-licensed photographs; retain attribution and skip existing assets."""
import json,urllib.request,urllib.parse,subprocess,concurrent.futures,re,datetime
from pathlib import Path
from PIL import Image
import time
root=Path(__file__).resolve().parents[1]
candidates=json.loads((root/'scripts/media-candidates.json').read_text())
labels=json.loads((root/'scripts/media-models.json').read_text())
# Selection is explicit: no random image substitution or model cross-matching.
selection={'byd-chazor-champion':[1,2], 'chevrolet-onix':[0,1], 'chevrolet-tahoe':[2,4], 'chevrolet-tracker':[2,1], 'chevrolet-malibu-xl':[1,2], 'kia-k5':[1,2], 'toyota-camry':[1,2], 'toyota-land-cruiser':[1], 'toyota-rav4':[4,3], 'li-auto-l9':[2,3], 'mercedes-e-class':[0,1], 'byd-song-plus':[3,4], 'byd-song-pro-dm-i':[0,1], 'byd-han':[0,2]}
def fetch_tucson():
 u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',generator='search',gsrsearch='Hyundai Tucson NX4 front',gsrnamespace=6,gsrlimit=4,prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=1280,format='json'))
 try:
  data=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'RNR-Education/1.0'}),timeout=30))
  rows=[]
  for p in sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',99)):
   info=p['imageinfo'][0];m=info['extmetadata'];v=lambda k:re.sub('<[^>]+>','',m.get(k,{}).get('value',''))
   rows.append(dict(title=p['title'],url=info.get('thumburl',info['url']),originalUrl=info['url'],source=info['descriptionurl'],license=v('LicenseShortName'),licenseUrl=v('LicenseUrl'),author=v('Artist'),description=v('ImageDescription')))
  candidates['hyundai-tucson']=rows;print('Tucson candidates:',[(r['title'],r['license']) for r in rows],flush=True)
  (root/'scripts/media-candidates.json').write_text(json.dumps(candidates,ensure_ascii=False,indent=2))
 except Exception as e:print('Tucson discovery:',e,flush=True)
if not candidates.get('hyundai-tucson'):fetch_tucson()
if candidates.get('hyundai-tucson'):selection['hyundai-tucson']=[0]
manifest_path=root/'client/public/media/manifest.json'
existing=json.loads(manifest_path.read_text()) if manifest_path.exists() else []
tasks=[]
for slug,indices in selection.items():
 for pos,index in enumerate(indices):
  source=candidates[slug][index];purpose='main' if pos==0 else 'gallery';local=f'/media/cars/{slug}/{purpose}.webp'
  tasks.append(dict(source,**labels[slug],slug=slug,purpose=purpose,localUrl=local,modelYear=None,retrievedAt=datetime.date.today().isoformat(),modifications='Уменьшено и преобразовано в WebP',note='Модель подтверждается названием исходного файла. Год и комплектация конкретного прокатного экземпляра не заявляются.'))
def download(item):
 target=root/('client/public'+item['localUrl']);target.parent.mkdir(parents=True,exist_ok=True)
 if target.exists() and target.stat().st_size>100:return dict(item,status='imported')
 if not item['license'].startswith(('CC BY','CC0','Public domain')):return dict(item,status='error',error='Unknown reuse permission')
 temp=target.with_suffix('.download')
 try:
  url=item['url'].split('?')[0].replace('https://thumb.wikimedia.org/','https://upload.wikimedia.org/')
  with urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'RNR-Education/1.0'}),timeout=40) as response:temp.write_bytes(response.read())
  with Image.open(temp) as im:
   im=im.convert('RGB');im.thumbnail((1280,960));im.save(target,'WEBP',quality=82)
  temp.unlink();print('Imported',item['slug'],item['purpose'],flush=True);return dict(item,status='imported')
 except Exception as e:
  target.unlink(missing_ok=True);temp.unlink(missing_ok=True);print('Failed',item['slug'],str(e),flush=True);return dict(item,status='error',error=str(e))
with concurrent.futures.ThreadPoolExecutor(max_workers=1) as pool:results=list(pool.map(download,tasks))
manifest_path.write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('Imported:',sum(r['status']=='imported' for r in results),'/',len(results),flush=True)
