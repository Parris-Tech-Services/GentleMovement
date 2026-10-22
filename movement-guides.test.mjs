import test from 'node:test';
import assert from 'node:assert/strict';
import {programmeArchive} from './programmes.js';
import {getMovementGuide,guideDose,movementGuideMarkup} from './movement-guides.js';

const current=programmeArchive[0];
test('all five current exercises have a curated schematic guide; archived/unrecognised ones do not',()=>{
 assert.equal(current.exercises.length,5);
 for(const exercise of current.exercises){
  const guide=getMovementGuide(current.id,exercise);
  assert.ok(guide,exercise.name);
  assert.ok(movementGuideMarkup(guide,exercise).includes(exercise.text),exercise.name);
 }
 assert.equal(getMovementGuide('robins-2026-03-17',current.exercises[0]),null);
 assert.equal(getMovementGuide(current.id,{name:'Unknown manually added'}),null);
});
test('dosages are copied from prescribed data rather than invented',()=>{
 const [active,passive,flex,extend,posture]=current.exercises;
 assert.equal(guideDose(active),'10 on each side');
 assert.equal(guideDose(passive),'5 on each side · Hold each for 30 seconds');
 assert.equal(guideDose(flex),'10 repetitions · Hold the final repetition for 30 seconds');
 assert.equal(guideDose(extend),'10 repetitions');
 assert.equal(guideDose(posture),'No repetition count specified');
 assert.match(guideDose({reps:10,hold:30,ambiguous:true}),/timing unclear/);
});
test('direction and position switches show pressed state and different illustrated head positions',()=>{
 const e=current.exercises[0],g=getMovementGuide(current.id,e);
 const start=movementGuideMarkup(g,e,{pose:'start',side:'Left'});
 const left=movementGuideMarkup(g,e,{pose:'move',side:'Left'});
 const right=movementGuideMarkup(g,e,{pose:'move',side:'Right'});
 assert.ok(start.includes('rotate(0 240 142)'));
 assert.ok(left.includes('rotate(-34 240 142)'));
 assert.ok(right.includes('rotate(34 240 142)'));
 assert.ok(left.includes('data-action="guide:pose:move" aria-pressed="true"'));
 assert.ok(right.includes('data-action="guide:side:Right" aria-pressed="true"'));
 assert.match(left,/not a measured range or clinical demonstration/);
});
test('passive rotation explicitly avoids claiming to demonstrate hand placement',()=>{
 const e=current.exercises[1],g=getMovementGuide(current.id,e);
 const markup=movementGuideMarkup(g,e);
 assert.match(markup,/do not describe the hand placement/);
 assert.match(markup,/method John demonstrated/);
});
test('rendered clinician directions are escaped, including quotes and injected markup',()=>{
 const e={name:'"><img src=x onerror=alert(1)>',text:'Try <script>hello</script> & quote "test"',reps:3};
 const g={kind:'turn',heading:'<headline>',axis:'Top',detail:'Do not copy <details>'};
 const markup=movementGuideMarkup(g,e);
 assert.match(markup,/&lt;script&gt;/);
 assert.match(markup,/&quot;/);
 assert.ok(!markup.includes('<script>'));
 assert.ok(!markup.includes('<img src=x'));
});
