import fs from 'node:fs';
const manifest=JSON.parse(fs.readFileSync('client/public/media/manifest.json'));
for(const entry of manifest.filter(e=>e.status==='imported')){
 const path='client/public'+entry.localUrl;if(!fs.existsSync(path)||fs.statSync(path).size<100)throw new Error('Missing '+path);
}
console.log(`${manifest.filter(e=>e.status==='imported').length} media files verified; ${manifest.filter(e=>e.status!=='imported').length} import errors recorded.`);
