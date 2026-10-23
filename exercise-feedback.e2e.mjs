// End-to-end smoke: exercise feedback from the mobile UI through local persistence and CSV.
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {join} from 'node:path';
import {chromium} from 'playwright';

const mime={'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const allowed=new Set(['index.html','app.js','auto-mode.js','data.js','programmes.js','archive-schema.js','exercise-feedback.js','clinician-report.js','clinician-report-view.js','movement-guides.js','style.css','sw.js','icon.svg','icon-192.png','icon-512.png','manifest.webmanifest']);
const server=createServer(async(req,res)=>{
  let file=(req.url||'/').split('?')[0].replace(/^\//,'')||'index.html';
  if(!allowed.has(file)){res.writeHead(404);res.end('Not found');return}
  try{const bytes=await readFile(join(process.cwd(),file));const ext='.'+file.split('.').at(-1);res.writeHead(200,{'Content-Type':mime[ext]||'application/octet-stream'});res.end(bytes)}catch{res.writeHead(404);res.end('Missing file')}
});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const browser=await chromium.launch({headless:true});
try {
  const context=await browser.newContext({viewport:{width:390,height:844},acceptDownloads:true,serviceWorkers:'block'});
  await context.addInitScript(()=>{
    localStorage.setItem('gentle-motion-v1',JSON.stringify({active:'robins-2026-03-17',session:null,history:[],custom:[],settings:{voice:false,speed:1,dark:false,font:1,reminders:false,times:[]}}))
  });
  const page=await context.newPage();
  await page.goto('http://127.0.0.1:'+server.address().port+'/#today');
  await page.getByRole('button',{name:/Start manually/i}).click();
  await page.getByRole('button',{name:/begin/i}).click();

  await page.getByRole('button',{name:/Skip this one/i}).click();
  await page.locator('#feedback-pain').selectOption('3');
  await page.locator('#feedback-difficulty').selectOption('manageable');
  await page.locator('#feedback-note').fill('More stiff turning to the left');
  await page.getByRole('button',{name:/Save & continue/i}).click();

  await page.getByRole('button',{name:/Exercise done/i}).click();
  await page.getByRole('button',{name:/I completed it/i}).click();
  await page.locator('#feedback-pain').selectOption('7');
  await page.locator('#feedback-difficulty').selectOption('difficult');
  await page.locator('#feedback-note').fill('Headache started');
  await page.getByRole('button',{name:/Stop & save session/i}).click();
  await page.getByRole('button',{name:/Save session/i}).click();
  const record=await page.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).history.at(-1));
  assert.equal(record.status,'stopped');
  assert.equal(record.results.length,2);
  assert.deepEqual(record.results.map(x=>[x.status,x.pain,x.difficulty]),[['skipped',3,'manageable'],['complete',7,'difficult']]);
  assert.equal(record.results[1].note,'Headache started');
  await page.locator('main details.card summary').first().click();
  assert.ok((await page.locator('main').innerText()).includes('Headache started'));

  const waitDownload=page.waitForEvent('download');
  await page.getByRole('button',{name:/Export progress CSV/i}).click();
  const csv=await readFile(await (await waitDownload).path(),'utf8');
  assert.match(csv,/exercise_discomfort,|exercise_discomfort"/);
  assert.match(csv,/Headache started/);
  await page.getByRole('button',{name:'Clinician report'}).click();
  await page.getByRole('heading',{name:'Movement & symptom report'}).waitFor();
  assert.ok((await page.locator('main').innerText()).includes('Headache started'));
  assert.ok((await page.locator('main').innerText()).includes('Session stopped'));
  await page.locator('#report-period').selectOption('7');
  await page.locator('#report-programme').selectOption('robins-2026-10-22');
  assert.ok((await page.locator('main').innerText()).includes('No sessions match these filters'));
  await page.locator('#report-programme').selectOption('robins-2026-03-17');
  assert.ok((await page.locator('main').innerText()).includes('Headache started'));
  await page.emulateMedia({media:'print'});
  assert.equal(await page.locator('.report-controls').evaluate(x=>getComputedStyle(x).display),'none');
  const pdf=await page.pdf({format:'A4'});
  assert.equal(pdf.subarray(0,4).toString(),'%PDF');
  assert.ok(pdf.length>1500);
  await page.emulateMedia({media:'screen'});
  await context.close();

  const empty=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await empty.addInitScript(()=>{
    localStorage.setItem('gentle-motion-v1',JSON.stringify({active:'robins-2026-03-17',session:null,history:[],custom:[],settings:{voice:false,speed:1,dark:false,font:1,reminders:false,times:[]}}))
  });
  const q=await empty.newPage();
  await q.goto('http://127.0.0.1:'+server.address().port+'/#today');
  await q.getByRole('button',{name:/Start manually/i}).click();
  await q.getByRole('button',{name:/begin/i}).click();
  await q.getByRole('button',{name:/Skip this one/i}).click();
  await q.getByRole('button',{name:/Continue without rating/i}).click();
  const pending=await q.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session.results[0]);
  assert.equal(pending.pain,null);
  assert.equal(pending.difficulty,'');
  await empty.close();
  // Visual demonstration navigation and persistence on a mobile-sized screen.
  const visualContext=await browser.newContext({viewport:{width:390,height:844},serviceWorkers:'block'});
  await visualContext.addInitScript(()=>{
    if(!localStorage.getItem('gentle-motion-v1')) localStorage.setItem('gentle-motion-v1',JSON.stringify({active:'robins-2026-10-22',session:null,history:[],custom:[],settings:{voice:false,speed:1,dark:false,font:1,reminders:false,times:[]}}))
  });
  const v=await visualContext.newPage();
  await v.goto('http://127.0.0.1:'+server.address().port+'/#today');
  await v.getByRole('button',{name:/Start manually/i}).click();
  await v.getByRole('button',{name:/begin/i}).click();
  assert.ok((await v.locator('main').innerText()).includes('John’s recorded instructions'));
  assert.ok((await v.locator('main').innerText()).includes('10 on each side'));
  const beforeStep=await v.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session.step);
  await v.locator('[data-action="guide:pose:move"]').click();
  await v.locator('[data-action="guide:side:Right"]').click();
  assert.equal(await v.locator('[data-action="guide:pose:move"]').getAttribute('aria-pressed'),'true');
  assert.equal(await v.locator('[data-action="guide:side:Right"]').getAttribute('aria-pressed'),'true');
  assert.match(await v.locator('.motion-guide svg').getAttribute('aria-label'),/right side/i);
  assert.equal(await v.evaluate(()=>JSON.parse(localStorage.getItem('gentle-motion-v1')).session.step),beforeStep);
  await v.reload();
  assert.equal(await v.locator('[data-action="guide:side:Right"]').getAttribute('aria-pressed',{timeout:5000}),'true');
  await v.getByRole('button',{name:/Skip this one/i}).click();
  await v.getByRole('button',{name:/Continue without rating/i}).click();
  assert.ok((await v.locator('main').innerText()).includes('Passive rotation holds'));
  assert.equal(await v.locator('[data-action="guide:pose:start"]').getAttribute('aria-pressed'),'true');
  assert.equal(await v.locator('[data-action="guide:side:Left"]').getAttribute('aria-pressed'),'true');
  await visualContext.close();
  console.log('Visual guide mobile interactions: PASS');
  console.log('Exercise feedback mobile browser smoke: PASS');
}finally {
  await browser.close();
  await new Promise(resolve=>server.close(resolve));
}
