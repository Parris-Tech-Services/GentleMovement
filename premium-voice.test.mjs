import assert from 'node:assert/strict';
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
