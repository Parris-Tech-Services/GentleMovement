import assert from 'node:assert/strict';
import test from 'node:test';
import {premiumAssetFor,loadPremiumManifest,PREMIUM_SAMPLE} from './premium-voice.js';
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
