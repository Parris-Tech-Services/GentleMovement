import assert from 'node:assert/strict';
import test from 'node:test';
import {introTrackForExercise,repTrackForPhase,PHYSIO_TRACKS} from './coach-tracks.js';
test('exactly five active exercise introductions',()=>{
 assert.deepEqual(Array.from({length:5},(_,i)=>introTrackForExercise(i)),['VO022','VO023','VO024','VO025','VO026']);
 assert.equal(introTrackForExercise(7),null);
});
test('recordings never omit left/right from side-specific movement counts',()=>{
 assert.equal(repTrackForPhase(0,{rep:1,side:'Left',seconds:0}),'VO027');
 assert.equal(repTrackForPhase(1,{rep:1,side:'Right',seconds:0}),'VO028');
 assert.equal(repTrackForPhase(1,{rep:1,side:'Right',seconds:30}),null);
 assert.equal(repTrackForPhase(0,{rep:3,side:'Left',seconds:0}),null);
 assert.equal(repTrackForPhase(2,{rep:3,seconds:0}),'VO029');
 assert.equal(repTrackForPhase(3,{rep:7,seconds:0}),'VO030');
 assert.equal(repTrackForPhase(2,{rep:10,seconds:30}),null);
 assert.equal(PHYSIO_TRACKS.length,20);
});
