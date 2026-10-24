import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {programmes,phases} from '../data.js';
import {autoPhasePrompt,autoUnspecifiedPrompt} from '../auto-mode.js';
import {premiumAssetFor,approvedMovementTrackPath} from '../premium-voice.js';
import {introTrackForExercise,repTrackForPhase} from '../coach-tracks.js';

const manifest=JSON.parse(readFileSync(new URL('../audio/elevenlabs/manifest.json',import.meta.url),'utf8'));
const app=readFileSync(new URL('../app.js',import.meta.url),'utf8');
test('all manifest entries have constrained local MP3 destinations',()=>{
  assert.equal(manifest.provider,'elevenlabs');
  assert.ok(Object.keys(manifest.clips).length>=128);
  for(const caption of Object.keys(manifest.clips)){
    assert.ok(caption.trim(),'empty recorded caption');
    assert.match(premiumAssetFor(manifest,caption),/^\.\/audio\/elevenlabs\/[a-f0-9]{64}\.mp3$/);
  }
  assert.equal(premiumAssetFor(manifest,'unmapped deliberately missing cue'),null);
  assert.equal(approvedMovementTrackPath('../../secret'),null);
});
test('reported Auto Mode cue coverage reflects real exercises and exact captions',()=>{
  const missing=[];
  let phasesChecked=0,exact=0,approved=0;
  for(const programme of programmes) for(const [index,exercise] of programme.exercises.entries()){
    const steps=phases(exercise);
    const intro=introTrackForExercise(index);
    if(intro && programme.id==='robins-2026-10-22')assert.ok(approvedMovementTrackPath(intro));
    const cues=steps.length?steps.map(p=>({phrase:autoPhasePrompt(p),track:programme.id==='robins-2026-10-22'?repTrackForPhase(index,p):null})):
      [{phrase:autoUnspecifiedPrompt(exercise),track:null}];
    for(const {phrase,track} of cues){
      phasesChecked++;
      if(track){assert.ok(approvedMovementTrackPath(track));approved++}
      else if(premiumAssetFor(manifest,phrase))exact++;
      else missing.push({programme:programme.id,exercise:exercise.name,cue:phrase});
    }
  }
  assert.ok(phasesChecked>0);
  console.log(JSON.stringify({totalCues:phasesChecked,approvedTrackMappings:approved,exactManifestCues:exact,unmapped:missing.length,examples:missing.slice(0,15)}));
  assert.deepEqual(missing,[], 'Every current Auto Mode cue must resolve to an exact recording or an approved clip; missing: '+JSON.stringify(missing.slice(0,20)));
});
test('recorded-only failure explicitly reports unavailable audio rather than device TTS',()=>{
  const branch=app.slice(app.indexOf('const fallback=()=>{'),app.indexOf('if(!(\'speechSynthesis\'in window))'));
  assert.match(branch,/voiceProvider==='elevenlabs'/);
  assert.match(branch,/Recording unavailable/);
  assert.match(branch,/state\.session\.paused=true/);
  assert.doesNotMatch(branch,/speechSynthesis\.speak/);
  assert.match(app,/if\(state\.settings\.voiceProvider!=='elevenlabs'\)\{fallback\(\);return\}/);
});
