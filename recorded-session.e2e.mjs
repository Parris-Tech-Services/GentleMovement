// Real MP3 decoding/playback through every prescribed step. Only media rate and
// exercise-clock waits are accelerated; no fake Audio or speech completions.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname} from 'node:path';
import {chromium} from 'playwright';
const root=resolve('.');
const mime={'.html':'text/html','.js':'text/javascript','.css':'text/css','.mp3':'audio/mpeg','.json':'application/json','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server=createServer(async(req,res)=>{try{const pathname=decodeURIComponent(new URL(req.url,'http://local').pathname);const path=resolve(root,'.'+(pathname==='/'?'/index.html':pathname));if(!path.startsWith(root+'/'))throw Error('outside root');const bytes=await readFile(path);res.writeHead(200,{'Content-Type':mime[extname(path)]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end()}});
await new Promise(r=>server.listen(0,'127.0.0.1',r));
const base=process.env.GENTLE_MOVEMENT_URL||'http://127.0.0.1:'+server.address().port;
const browser=await chromium.launch({headless:true,...(process.env.HTTPS_PROXY?{proxy:{server:process.env.HTTPS_PROXY,bypass:'127.0.0.1,localhost'}}:{})});
const sleep=()=>new Promise(r=>setTimeout(r,100));
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'allow'});
 await context.addInitScript(()=>{
  if(!localStorage.getItem('gentle-motion-v1'))localStorage.setItem('gentle-motion-v1',JSON.stringify({active:'robins-2026-10-22',session:null,history:[],custom:[],settings:{voice:true,voiceProvider:'elevenlabs',speed:1,dark:false,font:1,reminders:false,times:[]}}));
  window.__audio=[];window.__played=[];window.__tts=0;
  speechSynthesis.speak=()=>{window.__tts++};
  const NativeAudio=window.Audio;
  window.Audio=function(src){const a=new NativeAudio(src);window.__audio.push(a);a.addEventListener('playing',()=>window.__played.push(a.src));return a};
  const rate=Object.getOwnPropertyDescriptor(HTMLMediaElement.prototype,'playbackRate');
  Object.defineProperty(HTMLMediaElement.prototype,'playbackRate',{get:rate.get,set(){rate.set.call(this,8)}});
 });
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')console.log('Browser:',m.text())});
 await page.clock.install({time:new Date('2026-10-24T01:00:00Z')});
 const appResponse=page.waitForResponse(r=>new URL(r.url()).pathname==='/app.js'&&r.ok());
 await page.goto(base+'/?voicebank=off#today');
 const servedApp=await (await appResponse).body();
 assert.equal(createHash('sha256').update(servedApp).digest('hex'),createHash('sha256').update(await readFile('app.js')).digest('hex'),'The browser must load the tested app version before the session begins');
 // Wait for the actual complete offline installation before testing a session.
 console.log('Loaded',base);
 await page.evaluate(()=>Promise.race([navigator.serviceWorker.ready,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Offline installation timeout')),30000))]));console.log('Offline pack ready');
 await page.waitForFunction(()=>!!navigator.serviceWorker.controller);
 async function runSession(label){
  await page.getByRole('button',{name:/Start Auto Mode/}).click();
  await page.getByRole('button',{name:'↻ Hear instructions',exact:true}).click();
  let paused=false,iterations=0;const end=Date.now()+180000;
  while(Date.now()<end){
   const info=await page.evaluate(()=>({saved:JSON.parse(localStorage.getItem('gentle-motion-v1')),now:Date.now(),active:window.__audio.some(a=>!a.paused&&!a.ended),tts:window.__tts}));
   assert.equal(info.tts,0,'Recorded mode must never invoke native TTS');
   const s=info.saved.session;if(!s)break;

   assert.equal(s.paused,false,'Unexpected pause: '+await page.locator('#notice').innerText());
   if(!paused&&s.autoUntil&&s.autoStage==='moving'){
    await page.getByRole('button',{name:'⏸ Pause',exact:true}).click();
    const before=await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session.step);
    await page.clock.runFor(15000);
    assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session.step),before);
    await page.getByRole('button',{name:'Resume',exact:true}).click();paused=true;continue;
   }
   if(s.autoUntil&&!info.active){
    let remaining=s.autoUntil-info.now;
    // Exercise hold reminders must also decode/play before the hold finishes.
    if(remaining>10500&&!s.tenSecondReminder)remaining-=10000;
    await page.clock.runFor(Math.max(500,remaining+500));iterations++;
   }else await sleep();
  }
  const result=await page.evaluate(()=>({state:JSON.parse(localStorage.getItem('gentle-motion-v1')),tts:window.__tts,played:window.__played}));
  assert.equal(result.state.session,null,'The whole routine must finish');
  const record=result.state.history.at(-1);
  assert.equal(record.status,'complete');assert.equal(record.results.length,5);
  assert.deepEqual(record.results.map(r=>r.steps),[20,10,10,10,0]);
  assert.deepEqual(record.results.map(r=>r.holdSeconds),[0,300,30,0,0]);
  assert.equal(result.tts,0);assert.ok(result.played.length>=55,'Must really start complete recorded cues');
  assert.deepEqual(errors,[]);
  console.log(JSON.stringify({label,history:result.state.history.length,recordedPlaybackStarts:result.played.length,nativeTTS:result.tts,exerciseSteps:record.results.map(r=>r.steps),holdSeconds:record.results.map(r=>r.holdSeconds),clockAdvances:iterations}));
  return result;
 }
 await runSession('online');
 await page.locator('nav a[href="#today"]').click();
 await context.setOffline(true);await page.reload();
 await page.getByRole('button',{name:/Start Auto Mode/}).waitFor();
 await runSession('offline after reload');
 await context.setOffline(false);
 // A missing clip pauses rather than skipping the instruction or using phone TTS.
 const failureContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await failureContext.addInitScript(()=>{window.__tts=0;speechSynthesis.speak=()=>window.__tts++});
 const failurePage=await failureContext.newPage();
 await failurePage.route('**/audio/elevenlabs/VO021.mp3',r=>r.abort());
 await failurePage.clock.install({time:new Date('2026-10-24T01:00:00Z')});
 await failurePage.goto(base+'/?voicebank=off#today');
 await failurePage.getByRole('button',{name:/Start Auto Mode/}).click();
 await failurePage.getByRole('button',{name:'Resume',exact:true}).waitFor();
 assert.equal(await failurePage.evaluate(()=>window.__tts),0);
 assert.match(await failurePage.locator('#notice').innerText(),/Recording unavailable/);
 await failureContext.close();
 console.log('Missing audio safely pauses; online/offline complete sessions passed');
 await context.close();
}finally{await browser.close();await new Promise(r=>server.close(r))}
