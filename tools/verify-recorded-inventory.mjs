// Offline manifest and real-recording integrity audit; optional live production check.
// No ElevenLabs API requests or speech synthesis. Node 20+.
// Usage: node tools/verify-recorded-inventory.mjs [--live]
// The stored manifest is the source of truth; do not turn a documented count into a guess.
import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';

const live=process.argv.includes('--live');
const root=process.env.GENTLE_MOVEMENT_URL||'https://gentle-movement.vercel.app';
const manifest=JSON.parse(await readFile('audio/elevenlabs/manifest.json','utf8'));
const bank=JSON.parse(await readFile('audio/voicebank-manifest.json','utf8'));
assert.equal(manifest.provider,'elevenlabs');
const clips=Object.entries(manifest.clips);
const names=new Set(clips.map(([,filename])=>filename));
assert.equal(names.size,clips.length,'duplicate dynamic filenames');
const recorded=[];
const mp3Header=bytes=>(bytes[0]===73&&bytes[1]===68&&bytes[2]===51)||(bytes[0]===255&&(bytes[1]&224)===224);
for(const [phrase,filename] of clips){
  assert.match(filename,/^[a-f0-9]{64}\.mp3$/);
  const expected=createHash('sha256').update(phrase).digest('hex')+'.mp3';
  assert.equal(filename,expected,'wrong text mapping: '+phrase);
  const bytes=await readFile('audio/elevenlabs/'+filename);
  assert(bytes.length>1000&&mp3Header(bytes),'not an MP3: '+filename);
  recorded.push({id:filename.slice(0,-4),text:phrase,path:'audio/elevenlabs/'+filename,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
for(let n=21;n<=40;n++){
  const id='VO'+String(n).padStart(3,'0');
  const path='audio/elevenlabs/'+id+'.mp3';
  const bytes=await readFile(path);
  assert(bytes.length>1000&&mp3Header(bytes),'missing approved track '+id);
  recorded.push({id,text:null,path,bytes:bytes.length,sha256:createHash('sha256').update(bytes).digest('hex')});
}
const found=(await readdir('audio/elevenlabs')).filter(f=>f.endsWith('.mp3'));
assert.deepEqual(found.sort(),recorded.map(x=>x.path.split('/').at(-1)).sort(),'Unindexed or missing MP3s');
const approved=new Map(bank.clips.map(c=>[c.text,c]));
for(const clip of bank.clips){
  const local=recorded.find(r=>r.text===clip.text);
  assert(local,'shared bank clip missing: '+clip.id);
  assert.equal(clip.sha256,local.sha256,'shared VoiceBank hash mismatch: '+clip.id);
}
const rows=recorded.map(c=>({...c,verifiedLocal:true,liveStatus:live?'not-checked':'not-requested'}));
if(live){
  const response=await fetch(root+'/audio/elevenlabs/manifest.json',{signal:AbortSignal.timeout(20000)});
  assert(response.ok,'live manifest unavailable: '+response.status);
  const published=await response.json();
  assert.deepEqual(published.clips,manifest.clips,'production audio manifest does not match checked-out version');
  let current=0,firstError=null;
  async function worker(){
    while(current<rows.length&&!firstError){
      const i=current++,r=rows[i];
      try{
        const response=await fetch(root+'/'+r.path,{signal:AbortSignal.timeout(25000),cache:'no-store'});
        assert(response.ok,'HTTP '+response.status);
        assert(/audio\/mpeg|application\/octet-stream/.test(response.headers.get('content-type')||''),'wrong audio MIME');
        const data=Buffer.from(await response.arrayBuffer());
        assert(mp3Header(data)&&data.length===r.bytes,'invalid or incomplete live MP3 '+r.id);
        assert.equal(createHash('sha256').update(data).digest('hex'),r.sha256,'live audio hash mismatch '+r.id);
        r.liveStatus='verified';
      }catch(error){r.liveStatus='failed';firstError=new Error(r.path+': '+String(error));}
    }
  }
  await Promise.all(Array.from({length:6},()=>worker()));
  if(firstError)throw firstError;
}
const report={status:'PASS',sourceSha:process.env.GITHUB_SHA||'local',time:new Date().toISOString(),production:root,localClips:recorded.length,dynamicClips:clips.length,approvedTracks:20,sharedVoiceBankClips:bank.clips.length,liveVerified:rows.filter(x=>x.liveStatus==='verified').length,rows};
console.log(JSON.stringify(report));
