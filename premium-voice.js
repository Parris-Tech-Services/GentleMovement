// Read-only one-off MP3 pack: no API calls to ElevenLabs and no credentials on the website.
export const PREMIUM_SAMPLE='A little movement, at your own pace. We will take it gently.';
export const PREMIUM_MANIFEST_URL='./audio/elevenlabs/manifest.json';
export function premiumAssetFor(manifest,text){
 const filename=manifest?.clips?.[text];
 if(typeof filename!=='string'||!/^[a-f0-9]{64}\.mp3$/.test(filename))return null;
 return './audio/elevenlabs/'+filename;
}
export async function loadPremiumManifest(fetcher){
 try{const r=await fetcher(PREMIUM_MANIFEST_URL,{cache:'no-cache'});if(!r.ok)return null;
  const value=await r.json();return value?.provider==='elevenlabs'&&value.clips&&typeof value.clips==='object'?value:null;
 }catch{return null}
}
