// Verify the real Vercel production site serves dynamic and approved MP3s to Chrome.
import assert from 'node:assert/strict';
import {chromium} from 'playwright';

const ROOT=process.env.GENTLE_MOVEMENT_URL||'https://gentle-movement.vercel.app';
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  const page=await context.newPage();
  let response, manifest;
  for(let attempt=0;attempt<12;attempt++){
    try{
      response=await page.goto(ROOT+'/#settings',{waitUntil:'domcontentloaded',timeout:20000});
      if(response?.ok()){
        manifest=await page.evaluate(async()=>{
          const r=await fetch('/audio/elevenlabs/manifest.json',{cache:'no-store'});
          return r.ok?await r.json():null;
        });
        if(Object.keys(manifest?.clips||{}).length>=30)break;
      }
    }catch(err){console.log('Production not ready yet:',String(err).slice(0,120))}
    await new Promise(resolve=>setTimeout(resolve,5000));
  }
  assert.ok(response?.ok(),'Production website must be accessible from Chromium');
  assert.ok(Object.keys(manifest?.clips||{}).length>=30,'Production manifest must list the 30 new dynamic MP3s');
  assert.equal(manifest.provider,'elevenlabs');
  await page.waitForFunction(()=>document.querySelector('#premium-status')?.textContent?.includes('recorded coaching cues'),null,{timeout:15000});
  const status=await page.locator('#premium-status').innerText();
  assert.match(status,/20\/20 approved physio MP3s available/);
  assert.match(status,/30 recorded coaching cues/);
  const hash=manifest.clips['1.'];
  assert.match(hash||'',/^[a-f0-9]{64}\.mp3$/);
  const audio=await page.evaluate(async path=>await new Promise((resolve,reject)=>{
    const player=new Audio(path);
    player.preload='metadata';
    player.onloadedmetadata=()=>resolve({duration:player.duration,readyState:player.readyState});
    player.onerror=()=>reject(new Error('The Vercel dynamic MP3 could not load or decode'));
    player.load();
  }),'/audio/elevenlabs/'+hash);
  assert.ok(Number.isFinite(audio.duration)&&audio.duration>0,'Dynamic recording must have a decodable duration');
  const staticRequest=page.waitForRequest(r=>r.url().endsWith('/audio/elevenlabs/VO021.mp3'),{timeout:12000});
  await page.getByRole('button',{name:'Hear a sample'}).click();
  const served=await (await staticRequest).response();
  assert.ok(served?.ok(),'Existing approved voice clip must still load');
  console.log('Production audio verified:',ROOT,'dynamic count:',Object.keys(manifest.clips).length,'recording seconds:',audio.duration);
  await context.close();
}finally{await browser.close();}
