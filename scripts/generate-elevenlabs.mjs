// Explicit, one-time, resumable generator. No runtime API: commit the MP3s & manifest afterwards.
// PLAN: npm run voices:plan
// GENERATE: ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in local environment,
//           GENERATE_VOICES=YES npm run voices:generate
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir,access} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
import {voicePhrasePlan} from './voice-phrases.mjs';
const out=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'../audio/elevenlabs');
const manifestPath=path.join(out,'manifest.json');
const phrases=voicePhrasePlan();
const sum=phrases.reduce((n,s)=>n+s.length,0);
if(!process.argv.includes('--generate')){
 console.log(JSON.stringify({phrases:phrases.length,totalCharacters:sum,notes:'Preview only; no API calls or charges. Use GENERATE_VOICES=YES npm run voices:generate after storing your key privately.'},null,2));
 process.exit(0);
}
if(process.env.GENERATE_VOICES!=='YES')throw Error('Set GENERATE_VOICES=YES to explicitly approve paid generation.');
const key=process.env.ELEVENLABS_API_KEY,voice=process.env.ELEVENLABS_VOICE_ID;
if(!key||!voice)throw Error('Set ELEVENLABS_API_KEY and ELEVENLABS_VOICE_ID in your private shell or GitHub Actions secret.');
if(!/^[A-Za-z0-9_-]{10,80}$/.test(voice))throw Error('Voice ID is invalid.');
await mkdir(out,{recursive:true});
let old={};
try{old=JSON.parse(await readFile(manifestPath,'utf8'))}catch{}
if(old.voiceId&&old.voiceId!==voice)throw Error('This voice pack was made with a different voice ID. Use the original voice ID to avoid mixing voices.');
const clips={...old.clips};let made=0,skipped=0;
const limit=Number(process.env.ELEVENLABS_LIMIT||phrases.length);
if(!Number.isInteger(limit)||limit<1)throw Error('ELEVENLABS_LIMIT must be a positive integer.');
for(const text of phrases){
 const file=createHash('sha256').update(text).digest('hex')+'.mp3';
 try{await access(path.join(out,file));clips[text]=file;skipped++;continue}catch{}
 if(made>=limit)break;
 const response=await fetch('https://api.elevenlabs.io/v1/text-to-speech/'+encodeURIComponent(voice)+'?output_format=mp3_44100_128',{
  method:'POST',
  headers:{'xi-api-key':key,'Content-Type':'application/json'},
  body:JSON.stringify({text,model_id:process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',voice_settings:{stability:.57,similarity_boost:.78}})
 });
 if(!response.ok)throw Error('ElevenLabs generation stopped at phrase '+(made+1)+' (HTTP '+response.status+'). Existing MP3s are retained.');
 const bytes=Buffer.from(await response.arrayBuffer());
 if(bytes.length<128||bytes.length>2e6)throw Error('Unexpected audio size');
 await writeFile(path.join(out,file),bytes,{flag:'wx'});
 clips[text]=file;made++;
 // Checkpoint manifest after every paid generation, so reruns never pay twice for saved clips.
 await writeFile(manifestPath,JSON.stringify({provider:'elevenlabs',version:1,voiceId:voice,model:process.env.ELEVENLABS_MODEL_ID||'eleven_multilingual_v2',clips},null,2)+'\n');
 console.log('Generated '+made+' / '+phrases.length+'; previously saved '+skipped);
 await new Promise(resolve=>setTimeout(resolve,250));
}
console.log(JSON.stringify({generated:made,reused:skipped,planned:phrases.length,manifest:manifestPath,chargedThisRunCharacters:phrases.filter(t=>clips[t]).length===phrases.length?'See ElevenLabs account billing':'See account billing; partial batch',note:'Commit audio/elevenlabs once you have listened to and approved samples.'},null,2));
