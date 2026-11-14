// GM-044.03: log every outbound request and prove no unplanned ElevenLabs or
// other paid speech/API call is made by the website in any voice mode.
//
// Local (default): serves the WHOLE repository with no allowlist, so a stray
// request cannot be hidden by a 404-only server.
//   node network-egress.e2e.mjs
// Production:
//   GM_BASE_URL=https://parris-tech-services.github.io/GentleMovement/ node network-egress.e2e.mjs
// Optional evidence file: GM_EGRESS_REPORT=audit/network-egress.json
import assert from 'node:assert/strict';
import {createServer} from 'node:http';
import {readFile, writeFile} from 'node:fs/promises';
import {join, normalize} from 'node:path';
import {chromium} from 'playwright';

const PAID_OR_SPEECH_API = /elevenlabs\.io|api\.openai\.com|texttospeech\.googleapis\.com|tts\.speech\.microsoft\.com|cognitiveservices\.azure\.com|polly\.[a-z0-9-]+\.amazonaws\.com|api\.play\.ht|api\.murf\.ai|api\.resemble\.ai/i;
const mime = {'.html':'text/html','.js':'text/javascript','.mjs':'text/javascript','.css':'text/css','.svg':'image/svg+xml','.png':'image/png','.json':'application/json','.mp3':'audio/mpeg','.webmanifest':'application/manifest+json'};

let server = null, base = process.env.GM_BASE_URL;
if (!base) {
  const root = process.cwd();
  server = createServer(async (req, res) => {
    const rel = normalize(decodeURIComponent((req.url || '/').split('?')[0]).replace(/^\/+/, '') || 'index.html');
    if (rel.startsWith('..')) { res.writeHead(403); res.end(); return; }
    try {
      const bytes = await readFile(join(root, rel));
      res.writeHead(200, {'Content-Type': mime['.' + rel.split('.').at(-1)] || 'application/octet-stream'});
      res.end(bytes);
    } catch { res.writeHead(404); res.end('Not found'); }
  });
  await new Promise(r => server.listen(0, '127.0.0.1', r));
  base = `http://127.0.0.1:${server.address().port}/`;
}
if (!base.endsWith('/')) base += '/';
const origin = new URL(base).origin;

const requests = [];
const browser = await chromium.launch({headless: true});
const report = {base, origin, scenarios: {}};

async function scenario(name, provider, {failRecordings = false} = {}) {
  const context = await browser.newContext({viewport: {width: 390, height: 844}, serviceWorkers: 'block'});
  const seen = [];
  context.on('request', r => { seen.push(r.url()); requests.push(r.url()); });
  await context.addInitScript(() => {
    window.__ttsSpeak = 0;
    if (window.speechSynthesis) {
      const original = window.speechSynthesis.speak.bind(window.speechSynthesis);
      window.speechSynthesis.speak = u => { window.__ttsSpeak++; try { original(u); } catch {} };
    }
    localStorage.setItem('gentle-motion-v1', JSON.stringify({active: 'robins-2026-10-22', session: null, history: [], custom: [], settings: {voice: true, speed: 1, dark: false, font: 1, reminders: false, times: []}}));
  });
  if (failRecordings) await context.route(/\.mp3(\?|$)/, route => route.abort('internetdisconnected'));
  const page = await context.newPage();
  await page.clock.install({time: new Date('2026-11-14T01:00:00Z')});
  await page.goto(base + '#today');
  await page.locator('nav a[href="#settings"]').click();
  await page.locator('#voiceProvider').selectOption(provider);
  await page.getByRole('button', {name: 'Hear a sample'}).click();
  await page.clock.runFor(3000);
  await page.locator('nav a[href="#today"]').click();
  await page.getByRole('button', {name: /Start Auto Mode/i}).click();
  for (let i = 0; i < 12; i++) await page.clock.runFor(10000);   // two minutes of session
  const pause = page.locator('[data-action="pause"]');
  if (await pause.count()) { await pause.first().click(); await page.clock.runFor(5000); }
  const resume = page.getByRole('button', {name: 'Resume'});
  if (await resume.count()) { await resume.first().click(); await page.clock.runFor(20000); }
  const tts = await page.evaluate(() => window.__ttsSpeak);
  const paused = await page.evaluate(() => JSON.parse(localStorage.getItem('gentle-motion-v1'))?.session?.paused ?? null);
  await context.close();

  const external = seen.filter(u => !/^(data|blob):/.test(u) && new URL(u).origin !== origin);
  const paid = seen.filter(u => PAID_OR_SPEECH_API.test(u));
  const hosts = [...new Set(seen.filter(u => /^https?:/.test(u)).map(u => new URL(u).host))];
  report.scenarios[name] = {provider, failRecordings, requests: seen.length, hosts, external, paid, deviceSpeechCalls: tts, sessionPaused: paused};
  console.log(`${name}: ${seen.length} requests, hosts=${hosts.join(',')}, external=${external.length}, paid=${paid.length}, deviceTTS=${tts}`);

  assert.deepEqual(paid, [], `${name}: paid speech API requested`);
  assert.deepEqual(external, [], `${name}: request left ${origin}`);
  assert.ok(seen.length > 0, `${name}: no requests observed — instrumentation broken`);
  if (provider === 'elevenlabs') {
    // Saved-MP3 mode must never fall back to device speech, even when every recording fails.
    assert.equal(tts, 0, `${name}: device speech used in saved-MP3 mode`);
    if (!failRecordings) assert.ok(seen.some(u => /\/audio\/elevenlabs\/[^/]+\.mp3$/.test(u)), `${name}: no saved MP3 requested`);
    else assert.equal(paused, true, `${name}: failed recordings must pause Auto Mode, not continue silently`);
  }
}

try {
  await scenario('saved-mp3-pack', 'elevenlabs');
  await scenario('saved-mp3-pack-all-recordings-fail', 'elevenlabs', {failRecordings: true});
  await scenario('phone-voice', 'browser');
  report.totalRequests = requests.length;
  report.allHosts = [...new Set(requests.filter(u => /^https?:/.test(u)).map(u => new URL(u).host))];
  if (process.env.GM_EGRESS_REPORT) await writeFile(process.env.GM_EGRESS_REPORT, JSON.stringify(report, null, 2) + '\n');
  console.log(`GM-044.03 network egress: PASS — ${requests.length} requests, all to ${report.allHosts.join(', ')}; zero paid speech API calls.`);
} finally {
  await browser.close();
  server?.close();
}
