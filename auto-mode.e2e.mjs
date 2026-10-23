// Mobile Chromium smoke: no tapping for reps, holds, next exercise or session save.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';
const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const allowed=new Set(['index.html','app.js','auto-mode.js','coach-tracks.js','premium-voice.js','data.js','programmes.js','archive-schema.js','exercise-feedback.js','clinician-report.js','clinician-report-view.js','movement-guides.js','style.css','sw.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest']);
const server=createServer(async(req,res)=>{
  const file=(req.url||'/').split('?')[0].replace(/^\//,'')||'index.html';
  if(!allowed.has(file)&&!/^audio\/elevenlabs\/VO0(?:2[1-9]|3[0-9]|40)\.mp3$/.test(file)){res.writeHead(404);res.end('Not found');return;}
  try{const bytes=await readFile(join(process.cwd(),file));const ext='.'+file.split('.').at(-1);res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});res.end(bytes);}
  catch{res.writeHead(404);res.end('Missing file');}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try{
  const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await context.addInitScript(()=>{
    localStorage.setItem('gentle-motion-v1',JSON.stringify({active:'robins-2026-10-22',session:null,history:[],custom:[],settings:{voice:false,speed:1,dark:false,font:1,reminders:false,times:[]}}));
  });
  const page=await context.newPage();
  await page.clock.install({time:new Date('2026-10-23T01:00:00Z')});
  await page.goto('http://127.0.0.1:'+server.address().port+'/#today');
  await page.locator('nav a[href="#settings"]').click();
  await page.locator('#voiceProvider').selectOption('elevenlabs');
  assert.equal(await page.locator('#voiceProvider').inputValue(),'elevenlabs');
  // A tap on the sample should request the actual uploaded MP3, not synthetic TTS.
  const audioRequest=page.waitForRequest(r=>r.url().endsWith('/audio/elevenlabs/VO021.mp3'),{timeout:10000});
  await page.getByRole('button',{name:'Hear a sample'}).click();
  const request=await audioRequest;
  const audioResponse=await request.response();
  assert.ok(audioResponse?.ok(),'The uploaded MP3 must be served successfully');
  assert.match(audioResponse.headers()['content-type']||'',/audio\/mpeg|application\/octet-stream/);
  await page.locator('nav a[href="#today"]').click();
  await page.getByRole('button',{name:/Start Auto Mode/i}).click();
  await page.getByRole('heading',{name:'Active cervical rotation'}).waitFor();
  assert.match(await page.locator('.auto-bar').innerText(),/Auto Mode running/);
  await page.clock.runFor(6000);
  let s=await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session);
  assert.ok(s.step>=1,'Untimed repetitions should advance automatically');
  await page.locator('[data-action="pause"]').click();
  const pausedStep=(await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session)).step;
  await page.clock.runFor(30000);
  assert.equal((await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session)).step,pausedStep,'Paused mode must not advance');
  await page.getByRole('button',{name:'Resume'}).click();
  await page.clock.runFor(570000);
  const saved=await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')));
  assert.equal(saved.session,null,'Auto Mode must save and close the session without asking for extra taps');
  assert.equal(saved.history.length,1);
  const record=saved.history[0];
  assert.equal(record.status,'complete');
  assert.equal(record.results.length,5,'All five October exercises must be included');
  assert.deepEqual(record.results.map(x=>x.steps),[20,10,10,10,0]);
  assert.deepEqual(record.results.map(x=>x.holdSeconds),[0,300,30,0,0]);
  assert.ok(record.results.every(x=>x.manual===true),'Auto-paced progress must remain explicitly unverified');
  assert.match(record.notes,/not detected or independently verified/);
  console.log('Auto Mode mobile no-tap progression, pause/resume and save: PASS');
  await context.close();
}finally{
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
