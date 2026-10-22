import test from 'node:test';
import assert from 'node:assert/strict';
import {phases,remaining,expired,command,programmes} from './data.js';
test('no patient prescription ships publicly',()=>assert.equal(programmes[0].id,'unconfigured'));
test('bilateral counts remain separate and holds sum correctly',()=>{const p=phases({reps:3,sides:true,hold:12,each:true});assert.equal(p.length,6);assert.equal(p.filter(x=>x.side==='Left').length,3);assert.equal(p.reduce((s,x)=>s+x.seconds,0),72)});
test('last hold differs from each-repetition hold',()=>{assert.deepEqual(phases({reps:3,hold:12}).map(p=>p.seconds),[0,0,12]);assert.deepEqual(phases({reps:3,hold:12,each:true}).map(p=>p.seconds),[12,12,12])});
test('unknown and ambiguous dosage never gets invented',()=>{assert.deepEqual(phases({}),[]);assert.ok(phases({reps:3,hold:12,ambiguous:true}).every(p=>p.seconds===0))});
test('paused hold is independent of wall clock',()=>{assert.equal(remaining({left:8},999999),8);assert.equal(remaining({end:10000},11000),0)});
test('Sydney programme expiry uses local calendar',()=>{const p={expiresOn:'2030-01-01'};assert.equal(expired(p,Date.parse('2030-01-01T12:59:59Z')),false);assert.equal(expired(p,Date.parse('2030-01-01T13:00:00Z')),true)});
test('voice commands reject partial or negated matches',()=>{assert.equal(command('not done'),null);assert.equal(command('That hurts'),'hurt');assert.equal(command('confirm done'),'confirm')});

import {validateArchive} from './archive-schema.js';
test('archive import validates exercise counts',()=>{const r=validateArchive({version:1,programmes:[{name:'Example',date:'2026-01-01',exercises:[{name:'Step',text:'Move slowly',reps:3}]}]});assert.equal(r.programmes.length,1);assert.equal(r.programmes[0].exercises[0].reps,3)});
