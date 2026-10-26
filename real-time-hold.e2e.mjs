// Representative real-wall-clock timing acceptance: real MP3 media and a 30-second hold.
// Do not use virtual clocks, fake ended events or an accelerated playback rate.
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { resolve, extname, sep } from 'node:path';
import { chromium } from 'playwright';

const root = resolve('.');
const mime = {'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.mp3':'audio/mpeg','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server = createServer(async (req,res) => {
  try {
    const pathname = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    const file = resolve(root,'.'+(pathname==='/'?'/index.html':pathname));
    if(!file.startsWith(root+sep)) throw new Error('Path outside root');
    const bytes = await readFile(file);
    res.writeHead(200,{'Content-Type':mime[extname(file)] || 'application/octet-stream'});
    res.end(bytes);
  } catch { res.writeHead(404);res.end(); }
});
await new Promise(done=>server.listen(0,'127.0.0.1',done));
let browser;
try {
  browser = await chromium.launch({headless:true});
  const context = await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.addInitScript(()=>{
    localStorage.setItem('gentle-motion-v1',JSON.stringify({
      active:'robins-2026-10-22',session:null,history:[],custom:[],
      settings:{voice:true,voiceProvider:'elevenlabs',speed:1,dark:false,font:1,reminders:false,times:[]}
    }));
    window.__nativeTTS=0;window.__recordedPlaying=[];
    if(window.speechSynthesis) window.speechSynthesis.speak=()=>{window.__nativeTTS++};
    const NativeAudio=window.Audio;
    window.Audio=function(src){
      const audio=new NativeAudio(src);
      audio.addEventListener('playing',()=>window.__recordedPlaying.push(audio.src));
      return audio;
    };
  });
  const page=await context.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  const rootUrl='http://127.0.0.1:'+server.address().port;
  await page.goto(rootUrl+'/?voicebank=off#today',{waitUntil:'domcontentloaded'});
  await page.getByRole('button',{name:/Start Auto Mode/}).click();
  // The initial frequent-exercise schedule is not an expiry date.
  assert.equal(await page.locator('dialog[open]').count(),0);
  await page.getByRole('button',{name:'Skip',exact:true}).click();
  await page.waitForFunction(()=>{
    const s=JSON.parse(localStorage.getItem('gentle-motion-v1')).session;
    return s?.index===1 && s.step===0 && s.autoStage==='moving' && s.autoUntil>Date.now();
  },null,{timeout:120000});
  const started=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('gentle-motion-v1')).session;
    return {left:s.autoUntil-Date.now(),index:s.index,step:s.step};
  });
  assert.ok(started.left>=27000 && started.left<=30000,JSON.stringify(started));
  await page.waitForTimeout(4000);
  await page.getByRole('button',{name:/Pause/,exact:false}).click();
  const paused=await page.evaluate(()=>{
    const s=JSON.parse(localStorage.getItem('gentle-motion-v1')).session;
    return {left:s.autoLeft,until:s.autoUntil,paused:s.paused,index:s.index,step:s.step};
  });
  assert.equal(paused.index,1);assert.equal(paused.step,0);
  assert.equal(paused.paused,true);assert.equal(paused.until,null);
  assert.ok(paused.left<=started.left-3000 && paused.left>=started.left-8000,JSON.stringify(paused));
  await page.waitForTimeout(3200);
  const held=await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session);
  assert.equal(held.step,0);assert.equal(held.autoLeft,paused.left);
  const resumeAt=Date.now();
  await page.getByRole('button',{name:'Resume',exact:true}).click();
  await page.waitForFunction(()=>{
    const s=JSON.parse(localStorage.getItem('gentle-motion-v1')).session;
    return s?.index===1 && s.step>=1 && s.holdSeconds===30;
  },null,{timeout:75000});
  const elapsed=Date.now()-resumeAt;
  assert.ok(elapsed>=paused.left-1500,JSON.stringify({elapsed,left:paused.left}));
  const outcome=await page.evaluate(()=>({
    session:JSON.parse(localStorage.getItem('gentle-motion-v1')).session,
    played:window.__recordedPlaying,tts:window.__nativeTTS
  }));
  assert.equal(outcome.tts,0,'No unlabelled device TTS in recorded-only mode');
  assert.ok(outcome.played.length>=3,'Must decode real MP3 playback at multiple phases');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({result:'PASS',realTime:true,exerciseIndex:1,holdSeconds:30,pausedRemainingMs:paused.left,resumeElapsedMs:elapsed,recordedClipStarts:outcome.played.length,nativeTTS:outcome.tts}));
  await context.close();
} finally {
  await browser?.close();
  await new Promise(done=>server.close(done));
}
