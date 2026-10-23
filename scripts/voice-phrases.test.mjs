import assert from 'node:assert/strict';
import test from 'node:test';
import {voicePhrasePlan} from './scripts/voice-phrases.mjs';
import {programmeArchive} from './programmes.js';
import {phases} from './data.js';
import {autoPhasePrompt} from './auto-mode.js';
import {PREMIUM_SAMPLE} from './premium-voice.js';
test('one-time track planner covers every stored Auto Mode phrase and retains no secrets',()=>{
 const list=voicePhrasePlan(),sets=new Set(list);
 assert.ok(list.length>100,'there must be real variety in clips');
 assert.equal(list.length,sets.size);
 assert.ok(sets.has(PREMIUM_SAMPLE));
 for(const p of programmeArchive)for(const [index,e] of p.exercises.entries()){
  if(phases(e).length)for(let offset=0;offset<10;offset++)for(const phase of phases(e))
   assert.ok(sets.has(autoPhasePrompt(phase,{totalReps:e.reps,exerciseIndex:index,sessionSeed:offset*86400000})));
  assert.ok(!list.some(v=>/ELEVENLABS_API_KEY|joshua parris/i.test(v)));
 }
});
