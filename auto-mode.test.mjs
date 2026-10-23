import assert from 'node:assert/strict';
import test from 'node:test';
import {autoPhaseDuration,autoPhasePrompt,autoUnspecifiedPrompt,AUTO_REP_SECONDS,AUTO_UNSPECIFIED_SECONDS} from './auto-mode.js';
test('preserves every prescribed hold duration including 30 seconds',()=>{
 assert.equal(autoPhaseDuration({rep:5,seconds:30}),30000);
 assert.equal(autoPhaseDuration({rep:1,seconds:0}),AUTO_REP_SECONDS*1000);
});
test('includes side, repetition, hold cues',()=>{
 assert.match(autoPhasePrompt({side:'Left',rep:3,seconds:30}),/Left side.*Repetition 3.*30 seconds/);
 assert.match(autoPhasePrompt({side:'Right',rep:1,seconds:0}),/Right side.*Repetition 1/);
});
test('undefined dose is labeled as optional app pacing',()=>{
 const s=autoUnspecifiedPrompt({name:'Mirror posture',text:'Use a mirror.'});
 assert.match(s,/No timed duration was prescribed/);
 assert.match(s,/optional fifteen-second practice/);
 assert.equal(AUTO_UNSPECIFIED_SECONDS,15);
});
