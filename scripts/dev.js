import {spawn} from 'node:child_process';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const children=[];let stopping=false;
function stop(code=0){if(stopping)return;stopping=true;for(const child of children){try{if(process.platform!=='win32')process.kill(-child.pid,'SIGTERM');else child.kill();}catch{}}process.exitCode=code;}
for(const folder of ['server','client']){
 const child=spawn(process.platform==='win32'?'npm.cmd':'npm',['run','dev'],{cwd:path.join(root,folder),stdio:'inherit',detached:process.platform!=='win32'});
 children.push(child);child.on('error',error=>{console.error('Не удалось запустить '+folder+': '+error.message);stop(1);});child.on('exit',code=>{if(!stopping)stop(code||1);});
}
for(const signal of ['SIGINT','SIGTERM'])process.on(signal,()=>stop(0));
