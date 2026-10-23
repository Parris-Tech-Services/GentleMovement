// Read-only one-off MP3 pack: no API calls to ElevenLabs and no credentials on the website.
export const PREMIUM_SAMPLE='A little movement, at your own pace. We will take it gently.';
export const PREMIUM_MANIFEST_URL='./audio/elevenlabs/manifest.json';
export function premiumAssetFor(manifest,text){
 const filename=manifest?.clips?.[text];
 if(typeof filename!=='string'||!/^[a-f0-9]{64}\.mp3$/.test(filename))return null;
 return './audio/elevenlabs/'+filename;
}
// Colab-approved physical-therapy tracks. Fixed IDs only.
export function approvedMovementTrackPath(id){
 if(typeof id!=='string'||!/^VO0(?:2[1-9]|3[0-9]|40)$/.test(id))return null;
 return './audio/elevenlabs/'+id+'.mp3';
}
export async function auditMovementTracks(fetcher){
 const present=[],missing=[];
 await Promise.all(Array.from({length:20},(_,i)=>'VO'+String(i+21).padStart(3,'0')).map(async id=>{
  try{const r=await fetcher(approvedMovementTrackPath(id),{method:'HEAD',cache:'no-store'});(r.ok?present:missing).push(id)}
  catch{missing.push(id)}
 }));
 return {total:20,present:present.sort(),missing:missing.sort()};
}
export async function loadPremiumManifest(fetcher){
 try{const r=await fetcher(PREMIUM_MANIFEST_URL,{cache:'no-cache'});if(!r.ok)return null;
  const value=await r.json();return value?.provider==='elevenlabs'&&value.clips&&typeof value.clips==='object'?value:null;
 }catch{return null}
}
