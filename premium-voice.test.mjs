import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,stat} from 'node:fs/promises';
import test from 'node:test';
import {premiumAssetFor,loadPremiumManifest,PREMIUM_SAMPLE,approvedMovementTrackPath,auditMovementTracks} from './premium-voice.js';
test('safe clip lookup and missing fallback',()=>{
 const good='f'.repeat(64)+'.mp3';
 assert.equal(premiumAssetFor({clips:{[PREMIUM_SAMPLE]:good}},PREMIUM_SAMPLE),'./audio/elevenlabs/'+good);
 assert.equal(premiumAssetFor({clips:{[PREMIUM_SAMPLE]:'../../secret'}},PREMIUM_SAMPLE),null);
 assert.equal(premiumAssetFor({clips:{}},PREMIUM_SAMPLE),null);
});
test('manifest load is fault tolerant without any ElevenLabs API',async()=>{
 assert.equal(await loadPremiumManifest(async()=>({ok:false})),null);
 assert.equal(await loadPremiumManifest(async()=>{throw Error('offline')}),null);
 assert.deepEqual(await loadPremiumManifest(async()=>({ok:true,json:async()=>({provider:'elevenlabs',clips:{}})})),{provider:'elevenlabs',clips:{}});
});

test('approved VO021–VO040 paths, without traversal, and missing-audio detection',async()=>{
 assert.equal(approvedMovementTrackPath('VO021'),'./audio/elevenlabs/VO021.mp3');
 assert.equal(approvedMovementTrackPath('VO040'),'./audio/elevenlabs/VO040.mp3');
 for(const id of ['VO020','VO041','VO021.mp3','../VO021','VO099'])assert.equal(approvedMovementTrackPath(id),null);
 const audit=await auditMovementTracks(async path=>({ok:path.endsWith('/VO021.mp3')||path.endsWith('/VO022.mp3')}));
 assert.deepEqual(audit.present,['VO021','VO022']);assert.equal(audit.missing.length,18);assert.equal(audit.total,20);
});

test('every uploaded dynamic clip is indexed by its exact SHA-256 phrase',async()=>{
 const manifest=JSON.parse(await readFile('./audio/elevenlabs/manifest.json','utf8'));
 assert.equal(manifest.provider,'elevenlabs');
 assert.equal(manifest.version,1);
 const entries=Object.entries(manifest.clips);
 assert.ok(entries.length>=30,'Expected the 30 uploaded dynamic MP3s to be indexed');
 for(const [phrase,filename] of entries){
  assert.equal(filename,createHash('sha256').update(phrase,'utf8').digest('hex')+'.mp3','Wrong MP3 assigned to '+phrase);
  assert.equal(premiumAssetFor(manifest,phrase),'./audio/elevenlabs/'+filename);
  const filenamePath='./audio/elevenlabs/'+filename;
  const info=await stat(filenamePath);
  assert.ok(info.size>=1024,'Missing or empty recording '+filename);
  const file=await readFile(filenamePath);
  assert.ok(file.subarray(0,3).toString('ascii')==='ID3'||(file[0]===0xff&&(file[1]&0xe0)===0xe0),'Invalid MP3 '+filename);
 }
 const {readdir}=await import('node:fs/promises');
 const files=(await readdir('./audio/elevenlabs')).filter(x=>/^[a-f0-9]{64}\\.mp3$/.test(x));
 assert.deepEqual(files.sort(),entries.map(([,file])=>file).sort(),'Every uploaded dynamic clip must have a matching manifest entry');
});
