import assert from 'node:assert/strict';
import test from 'node:test';
import {autoPhaseDuration,autoPhasePrompt,autoUnspecifiedPrompt,AUTO_REP_SECONDS,AUTO_UNSPECIFIED_SECONDS} from './auto-mode.js';
test('preserves prescribed hold durations and untimed rep pacing',()=>{
 assert.equal(autoPhaseDuration({rep:5,seconds:30}),30000);
 assert.equal(autoPhaseDuration({rep:1,seconds:0}),AUTO_REP_SECONDS*1000);
});
test('uses natural, varied and concise trainer-style cues with unambiguous count and side',()=>{
 const bilateral=[];
 for(let n=1;n<=10;n++)for(const side of ['Left','Right']){
  const cue=autoPhasePrompt({side,rep:n,seconds:0},{totalReps:10,exerciseIndex:0,sessionSeed:0});
  assert.match(cue,new RegExp('\\b'+n+'\\b'));
  assert.match(cue,new RegExp(side,'i'));
  assert.doesNotMatch(cue,/move gently at your own pace|great form|perfect movement/i);
  assert.ok(cue.length<80);
  bilateral.push(cue);
 }
 assert.equal(new Set(bilateral).size,20,'all twenty bilateral count cues should vary');
 assert.ok(bilateral.some(c=>/\brep\b/i.test(c)));
 assert.ok(bilateral.some(c=>/\bnumber\b/i.test(c)));
 assert.ok(bilateral.some(c=>/\bcount\b/i.test(c)));
 const unilateral=Array.from({length:10},(_,i)=>autoPhasePrompt({side:'',rep:i+1,seconds:0},{totalReps:10}));
 assert.equal(new Set(unilateral).size,10);
 assert.ok(unilateral.some(c=>/\bRep\b/.test(c)));
 assert.ok(unilateral.some(c=>/\bNumber\b/.test(c)));
 assert.ok(unilateral.some(c=>/\bCount\b/.test(c)));
 assert.match(bilateral.at(-1),/Last one/i);
});
test('spoken cues vary between sessions and exercises without changing counts',()=>{
 const phase={side:'Left',rep:7,seconds:0};
 const opts={totalReps:10,exerciseIndex:0,sessionSeed:0};
 assert.notEqual(autoPhasePrompt(phase,opts),autoPhasePrompt(phase,{...opts,exerciseIndex:1}));
 assert.notEqual(autoPhasePrompt(phase,opts),autoPhasePrompt(phase,{...opts,sessionSeed:86400000}));
});
test('30-second prescribed holds are always spoken, but wording varies',()=>{
 const cues=Array.from({length:5},(_,i)=>autoPhasePrompt({side:'Right',rep:i+1,seconds:30},{totalReps:5}));
 assert.ok(cues.every(c=>/30.second hold|hold.*30 seconds/i.test(c)));
 assert.ok(new Set(cues.map(c=>c.match(/(Hold.*30 seconds|30-second hold)/i)?.[0])).size>=2);
});
test('unspecified exercise dose is clearly optional app pacing',()=>{
 const s=autoUnspecifiedPrompt({name:'Mirror posture',text:'Use a mirror.'});
 assert.match(s,/No timed duration was prescribed/);
 assert.match(s,/optional fifteen-second practice/);
 assert.equal(AUTO_UNSPECIFIED_SECONDS,15);
});
