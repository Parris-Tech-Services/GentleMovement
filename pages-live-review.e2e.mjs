// Smoke-test actual GitHub Pages release in mobile Chromium; no audio or patient data sent.
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {chromium} from 'playwright';
const url='https://parris-tech-services.github.io/GentleMovement/';
const expected=createHash('sha256').update(await readFile('app.js')).digest('hex');
const browser=await chromium.launch({headless:true});
try{
 const context=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
 await context.addInitScript(()=>{
  localStorage.setItem('gentle-motion-v1',JSON.stringify({
   active:'robins-2026-10-22',session:null,history:[],custom:[],
   settings:{voice:false,voiceProvider:'elevenlabs',speed:1,dark:false,font:1,reminders:false,times:[]}
  }));
 });
 const page=await context.newPage(),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.goto(url+'#today',{waitUntil:'domcontentloaded',timeout:60000});
 const app=await page.request.get(url+'app.js',{timeout:30000});
 assert.equal(app.status(),200,'Public Pages must serve the application');
 assert.equal(createHash('sha256').update(await app.body()).digest('hex'),expected,'Public release must contain exact tested app.js');
 const button=page.getByRole('button',{name:/Start Auto Mode/i});
 await button.waitFor({timeout:30000});
 await button.click();
 const dialog=page.locator('dialog[open]');
 assert.match(await dialog.innerText(),/programme review due|old programme/i);
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session),null,'Expired plan requires active choice');
 await page.getByRole('button',{name:'Continue Auto Mode'}).click();
 await page.getByRole('heading',{name:'Active cervical rotation'}).waitFor();
 const s=await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session);
 assert.equal(s?.auto,true);
 assert.equal(s?.programme,'robins-2026-10-22');
 assert.match(await page.locator('.auto-bar').innerText(),/Auto Mode running/);
 assert.deepEqual(errors,[]);
 console.log('PASS: Live GitHub Pages verified exact release, explicit review continuation, running Auto Mode, no browser exceptions:',url);
 await context.close();
}finally{await browser.close()}
