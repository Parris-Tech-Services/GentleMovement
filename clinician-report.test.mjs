import test from 'node:test';
import assert from 'node:assert/strict';
import {rating,makeClinicianReport} from './clinician-report.js';
import {clinicianReportMarkup} from './clinician-report-view.js';
const NOW=Date.parse('2026-10-22T12:00:00Z');
const h=(days,status,before,after,results=[],programme='programme-a',notes='')=>({
  ended:NOW-days*86400000,started:NOW-days*86400000-600000,programme,status,before,after,results,notes
});
test('0/10 counts as a genuine rating; missing and invalid values do not',()=>{
  for(const x of [undefined,null,'',-1,11,2.3,'oops'])assert.equal(rating(x),null);
  assert.equal(rating(0),0);
  assert.equal(rating('10'),10);
});
test('summary uses only paired discomfort ratings, not zeros for omissions',()=>{
  const report=makeClinicianReport([
    h(1,'complete',0,4,[{name:'Rotation',pain:7,difficulty:'difficult',note:'Uncomfortable'}]),
    h(2,'stopped',6,null,[{name:'Flexion',status:'skipped',pain:null,note:''}], 'programme-a','Pain stopped the session'),
    h(4,'partial',2,6,[]),
    h(55,'complete',0,0,[]),
    h(-1,'complete',0,0,[])
  ],{days:7,now:NOW});
  assert.equal(report.sessionCount,3);assert.equal(report.completed,1);assert.equal(report.stopped,1);assert.equal(report.partial,1);
  assert.equal(report.pairedCount,2);assert.equal(report.averageBefore,1);assert.equal(report.averageAfter,5);
  assert.equal(report.ratedExercises,1);
  assert.equal(report.flags.length,3);assert.ok(report.flags.some(f=>f.exercise==='Session stopped'));
  assert.ok(report.flags.some(f=>f.reason.includes('Skipped')));
});
test('programme and time filters do not leak records from other programmes',()=>{
  const history=[h(1,'complete',1,2,[],'programme-a'),h(1,'complete',7,8,[],'programme-b'),h(40,'complete',3,4,[],'programme-a')];
  const p=makeClinicianReport(history,{days:30,programme:'programme-a',now:NOW});
  assert.equal(p.sessionCount,1);assert.equal(p.averageAfter,2);
  assert.equal(makeClinicianReport(history,{days:'all',now:NOW}).sessionCount,3);
  assert.throws(()=>makeClinicianReport(history,{days:0}),RangeError);
});
test('report safely escapes user note and programme names',()=>{
  const history=[h(1,'complete',4,7,[{name:'<script>alert(1)</script>',pain:8,difficulty:'difficult',note:'<img src=x onerror=alert(1)>'}])];
  const report=makeClinicianReport(history,{now:NOW});
  const markup=clinicianReportMarkup(report,[{id:'programme-a',name:'<bad>'}],{days:30,programme:'all'});
  assert.ok(markup.includes('&lt;script&gt;'));assert.ok(markup.includes('&lt;img'));
  assert.ok(!markup.includes('<script>'));assert.ok(!markup.includes('<img src=x'));
  assert.ok(markup.includes('Print or save as PDF'));
});
test('older session data without exercise feedback still generates a useful report',()=>{
  const report=makeClinicianReport([{ended:NOW,programme:'historic',status:'complete',before:null,after:null,results:[{name:'Chin tuck',status:'complete'}]}],{days:7,now:NOW});
  assert.equal(report.sessionCount,1);assert.equal(report.averageBefore,null);
  assert.equal(report.flags.length,0);assert.equal(report.observations.length,0);
});
