import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {spawnSync} from 'node:child_process';
const gate=resolve('scripts/completion-gate.mjs');
const fixture=(status,verified,evidence)=>({schemaVersion:1,project:'Gate self-test',objectives:[{id:'T-1',title:'Self test',status,acceptance:[{id:'check',description:'Must be evidenced',verified,evidence}]}]});
function check(data,strict=false){const dir=mkdtempSync(join(tmpdir(),'completion-gate-'));const file=join(dir,'fixture.json');writeFileSync(file,JSON.stringify(data));const r=spawnSync(process.execPath,[gate,'--file='+file,...(strict?['--strict']:[])],{cwd:dir,encoding:'utf8'});const report=readFileSync(join(dir,'completion','report.md'),'utf8');rmSync(dir,{recursive:true,force:true});return {status:r.status,report};}
test('open incomplete work is reported without pretending complete',()=>{const r=check(fixture('open',false,[]));assert.equal(r.status,0);assert.match(r.report,/Status: OPEN/);});
test('strict gate blocks incomplete objectives',()=>assert.notEqual(check(fixture('open',false,[]),true).status,0));
test('unsupported completion claim fails even without strict flag',()=>assert.notEqual(check(fixture('complete',false,[])).status,0));
test('evidence alone without complete status is not complete',()=>assert.match(check(fixture('open',true,['test run #1'])).report,/Status: OPEN/));
test('complete evidenced objective passes strict mode',()=>{const r=check(fixture('complete',true,['test run #1']),true);assert.equal(r.status,0);assert.match(r.report,/Status: COMPLETE/);});
