const CACHE='gentle-movement-v14-complete-recordings';const FILES=['./voicebank/src/index.js','./voicebank/src/browser.js','./voicebank/adapters/gentle-movement.js','./audio/voicebank-manifest.json','./','./index.html','./app.js','./auto-mode.js','./premium-voice.js','./coach-tracks.js','./data.js','./programmes.js','./exercise-feedback.js','./clinician-report.js','./clinician-report-view.js','./movement-guides.js','./archive-schema.js','./style.css','./manifest.webmanifest','./icon.svg','./icon-192.png','./icon-512.png'];self.addEventListener('install',e=>e.waitUntil(caches.open(CACHE).then(async c=>{
 await c.addAll(FILES);
 const response=await fetch('./audio/elevenlabs/manifest.json',{cache:'reload'});
 if(!response.ok)throw new Error('Voice manifest unavailable');
 const manifest=await response.json();
 const audio=[...new Set(Object.values(manifest.clips).filter(n=>/^[a-f0-9]{64}\.mp3$/.test(n)).map(n=>'./audio/elevenlabs/'+n))];
 for(let i=21;i<=40;i++)audio.push('./audio/elevenlabs/VO'+String(i).padStart(3,'0')+'.mp3');
 await c.addAll(['./audio/elevenlabs/manifest.json',...audio]);
}).then(()=>self.skipWaiting())));self.addEventListener('activate',e=>e.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim())));self.addEventListener('fetch',e=>{if(e.request.method!=='GET'||new URL(e.request.url).origin!==self.location.origin)return;e.respondWith(fetch(e.request).then(r=>{if(r.ok&&!r.redirected){const clone=r.clone();caches.open(CACHE).then(c=>c.put(e.request,clone))}return r}).catch(()=>caches.match(e.request).then(r=>r||(e.request.mode==='navigate'?caches.match('./index.html'):Response.error()))))});self.addEventListener('notificationclick',e=>{e.notification.close();e.waitUntil(clients.openWindow(self.registration.scope+'#today'))});

