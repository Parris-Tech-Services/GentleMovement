import assert from 'node:assert/strict';
import test from 'node:test';
import {autoPhaseDuration,autoPhasePrompt,autoUnspecifiedPrompt,AUTO_REP_SECONDS,AUTO_UNSPECIFIED_SECONDS} from './auto-mode.js';
test('preserves prescribed hold durations and untimed rep pacing',()=>{
 assert.equal(autoPhaseDuration({rep:5,seconds:30}),30000);
 assert.equal(autoPhaseDuration({rep:1,seconds:0}),AUTO_REP_SECONDS*1000);
});
test('finite recorded cues retain every side, repetition and exact hold duration',()=>{
 for(let n=1;n<=10;n++)for(const side of ['','Left','Right']){
  const phase={rep:n,side,seconds:0};
  assert.equal(autoPhasePrompt(phase),(side?side+', ':'')+n+'.');
  assert.equal(autoPhasePrompt({...phase,seconds:30}),(side?side+', ':'')+n+'. Hold for 30 seconds.');
  assert.equal(autoPhasePrompt(phase,{exerciseIndex:3,sessionSeed:86400000}),autoPhasePrompt(phase),'Dates must not invent unrecorded variants');
 }
});
test('unspecified exercise dose is clearly optional app pacing',()=>{
 const s=autoUnspecifiedPrompt({name:'Mirror posture',text:'Use a mirror.'});
 assert.match(s,/No timed duration was prescribed/);
 assert.match(s,/optional fifteen-second practice/);
 assert.equal(AUTO_UNSPECIFIED_SECONDS,15);
});
