import urllib.request,urllib.parse,json,concurrent.futures,re
from pathlib import Path
queries=[('byd-chazor-champion','BYD Chazor'),('chevrolet-onix','Chevrolet Onix sedan 2023'),('chevrolet-tahoe','Chevrolet Tahoe 2021'),('chevrolet-tracker','Chevrolet Tracker 2022'),('chevrolet-malibu-xl','Chevrolet Malibu XL'),('hyundai-tucson','Hyundai Tucson 2022'),('kia-k5','Kia K5 2021'),('toyota-camry','Toyota Camry 2021'),('toyota-land-cruiser','Toyota Land Cruiser 300'),('toyota-rav4','Toyota RAV4 2021'),('li-auto-l9','Li L9'),('mercedes-e-class','Mercedes Benz W214'),('byd-song-plus','BYD Song Plus DM-i'),('byd-song-pro-dm-i','BYD Song Pro DM-i'),('byd-han','BYD Han EV')]
def discover(pair):
 slug,q=pair
 u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(dict(action='query',generator='search',gsrsearch=q,gsrnamespace=6,gsrlimit=5,prop='imageinfo',iiprop='url|extmetadata',iiurlwidth=1280,format='json'))
 try:
  data=json.load(urllib.request.urlopen(urllib.request.Request(u,headers={'User-Agent':'RNR-Rent-Car-Educational/1.0'}),timeout=35))
  pages=sorted(data.get('query',{}).get('pages',{}).values(),key=lambda p:p.get('index',99))
  results=[]
  for p in pages:
   info=p.get('imageinfo',[{}])[0];m=info.get('extmetadata',{});value=lambda k:re.sub('<[^>]+>','',m.get(k,{}).get('value',''))
   results.append(dict(title=p['title'],url=info.get('thumburl',info.get('url')),originalUrl=info.get('url'),source=info.get('descriptionurl'),license=value('LicenseShortName'),licenseUrl=value('LicenseUrl'),author=value('Artist'),description=value('ImageDescription')))
  print(slug,[(r['title'],r['license']) for r in results],flush=True)
  return slug,results
 except Exception as e: print(slug,str(e),flush=True);return slug,[]
with concurrent.futures.ThreadPoolExecutor(max_workers=5) as pool: result=dict(pool.map(discover,queries))
Path('scripts/media-candidates.json').write_text(json.dumps(result,ensure_ascii=False,indent=2))
