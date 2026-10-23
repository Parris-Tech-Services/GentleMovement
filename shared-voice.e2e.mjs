import assert from 'node:assert/strict';
import {chromium} from 'playwright';
const root=process.env.GENTLE_MOVEMENT_URL||'https://gentle-movement.vercel.app';
const browser=await chromium.launch();
try {
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const page=await context.newPage();
 await page.addInitScript(()=>{
  window.__realStarts=0;const start=AudioBufferSourceNode.prototype.start;
  AudioBufferSourceNode.prototype.start=function(...args){window.__realStarts++;return start.apply(this,args)};
 });
 const manifestResponse=page.waitForResponse(r=>r.url().endsWith('/audio/voicebank-manifest.json')&&r.ok());
 await page.goto(root+'/#settings');
 await page.locator('#voiceProvider').selectOption('elevenlabs');
 await manifestResponse;
 const response=await page.request.get(root+'/audio/voicebank-manifest.json');const pack=await response.json();
 assert.equal(pack.voice.id,'2oKmj8Mq72d27JWiLtSX');assert.equal(pack.clips.length,30);
 const audioRequest=page.waitForResponse(r=>r.url().endsWith(pack.clips.find(c=>c.text==='1.').file.replace('elevenlabs/','/elevenlabs/'))&&r.ok());
 await page.getByRole('button',{name:'Hear a coaching count'}).click();
 await audioRequest;
 await page.waitForFunction(()=>document.querySelector('#notice').textContent==='Coaching count finished.',{timeout:15000});
 assert.ok(await page.evaluate(()=>window.__realStarts)>0,'Shared Web Audio source must really start');
 await context.close();
 // Shared manifest unavailable: the original exact prompt pack still plays.
 const fallback=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 const p=await fallback.newPage();await p.route('**/audio/voicebank-manifest.json',r=>r.abort());
 await p.goto(root+'/#settings');await p.locator('#voiceProvider').selectOption('elevenlabs');
 await p.getByRole('button',{name:'Hear a coaching count'}).click();
 await p.waitForFunction(()=>document.querySelector('#notice').textContent==='Coaching count finished.',{timeout:15000});
 await fallback.close();console.log('Shared Naomy playback and original-pack fallback verified in mobile Chromium');
} finally {await browser.close()}
