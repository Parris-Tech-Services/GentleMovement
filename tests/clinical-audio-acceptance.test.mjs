import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {programmes,phases,remaining} from '../data.js';
import {autoPhaseDuration,autoPhasePrompt,autoUnspecifiedPrompt} from '../auto-mode.js';
import {approvedMovementTrackPath,premiumAssetFor} from '../premium-voice.js';
import {introTrackForExercise,repTrackForPhase} from '../coach-tracks.js';
const manifest=JSON.parse(readFileSync(new URL('../audio/elevenlabs/manifest.json',import.meta.url)));
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('every historical and current prescribed dose maps losslessly to the recorded cue catalog',()=>{
 let phasesCount=0;let holdCount=0;
 for(const programme of programmes)for(const [idx,exercise] of programme.exercises.entries()){
  const steps=phases(exercise);assert.equal(steps.length,exercise.reps?(exercise.sides?2:1)*exercise.reps:0,exercise.name);
  if(!steps.length){assert.ok(premiumAssetFor(manifest,autoUnspecifiedPrompt(exercise)),exercise.name);continue}
  const approvedIntro=programme.id==='robins-2026-10-22'?introTrackForExercise(idx):null;
  if(approvedIntro)assert.ok(approvedMovementTrackPath(approvedIntro));
  for(const phase of steps){
   phasesCount++;assert.ok(['','Left','Right'].includes(phase.side));assert.equal(phase.seconds,exercise.ambiguous?0:exercise.hold&&(exercise.each||phase.rep===exercise.reps)?exercise.hold:0);
   if(phase.seconds)holdCount++;
   const approved=programme.id==='robins-2026-10-22'?repTrackForPhase(idx,phase):null;
   const cue=autoPhasePrompt(phase);
   assert.ok(approved?approvedMovementTrackPath(approved):premiumAssetFor(manifest,cue),'unrecorded or altered clinical cue '+programme.id+'/'+exercise.name+'/'+cue);
   assert.equal(autoPhaseDuration(phase),1000*(phase.seconds||5));
  }
 }
 assert.ok(phasesCount>120);assert.ok(holdCount>0);
 console.log(JSON.stringify({phases:phasesCount,holds:holdCount}));
});
test('timed hold resumes from preserved remaining seconds rather than full clinical duration',()=>{
 for(const hold of [1,5,10,30,45,60])for(const elapsed of [0,1,Math.floor(hold/2),hold]){
  const expiry=500000+hold*1000;const pause=500000+elapsed*1000;
  const leftMs=Math.max(0,expiry-pause);const resumedUntil=800000+leftMs;
  assert.equal(resumedUntil-800000,leftMs);
  assert.equal(remaining({end:expiry,left:hold},pause),hold-elapsed);
  assert.equal(remaining({left:hold-elapsed}),hold-elapsed);
 }
 assert.match(app,/s\.autoLeft=Math\.max\(0,s\.autoUntil-Date\.now\(\)\)/);
 assert.match(app,/s\.autoUntil=Date\.now\(\)\+s\.autoLeft/);
 assert.match(app,/if\(document\.hidden\|\|now-s\.autoUntil>2500\)/);
});
test('modified repetition count must not be silently treated as a known recording',()=>{
 const current=programmes[0].exercises.find(e=>e.sides&&e.reps);
 assert.ok(current);
 const changed={...current,reps:current.reps+1};
 const original=phases(current),extended=phases(changed);
 assert.equal(extended.length,original.length+2);
 assert.equal(extended.at(-2).side,'Left');
 assert.equal(extended.at(-1).side,'Right');
 assert.equal(extended.at(-1).rep,changed.reps);
 // The transcript is clinical data, not a place to invent a new prescribed dose.
 assert.equal(changed.text,current.text);
 const newCue=autoPhasePrompt(extended.at(-1));
 assert.ok(newCue.includes(String(changed.reps)));
 // A changed dose is only deliverable if the exact required clip really exists.
 const resolved=premiumAssetFor(manifest,newCue);
 assert.equal(resolved===null||/^\\.\\/audio\\/elevenlabs\\/[a-f0-9]{64}\\.mp3$/.test(resolved),true);
});
test('recorded-only mode never invokes device TTS from its failure branch',()=>{
 const i=app.indexOf('const fallback=()=>{');const j=app.indexOf("if(!('speechSynthesis'in window))",i);
 assert.ok(i>0&&j>i);
 const branch=app.slice(i,j);assert.match(branch,/voiceProvider==='elevenlabs'/);
 assert.match(branch,/Recording unavailable/);
 assert.doesNotMatch(branch,/speechSynthesis\.speak/);
 assert.match(app,/if\(state\.settings\.voiceProvider!=='elevenlabs'\)\{fallback\(\);return\}/);
});
