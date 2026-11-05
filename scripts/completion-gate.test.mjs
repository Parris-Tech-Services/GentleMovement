import test from 'node:test';
import assert from 'node:assert/strict';
import {mkdtempSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import {join,resolve} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const gate=resolve('scripts/completion-gate.mjs'),commit='a'.repeat(40);
const fixture=(status='complete',verified=true,evidence=[])=>({schemaVersion:1,project:'Historical gate regressions',objectives:[{id:'GM-AUDIO-001',title:'Original audio acceptance',status,acceptance:[{id:'automated',kind:'node-test',description:'Real test execution required',verified,evidence}]}]});
function check(data,prepare=()=>{},strict=true){
 const dir=mkdtempSync(join(tmpdir(),'completion-gate-'));
 try{writeFileSync(join(dir,'original.json'),JSON.stringify(data));prepare(dir,data);writeFileSync(join(dir,'fixture.json'),JSON.stringify(data));const r=spawnSync(process.execPath,[gate,'--file=fixture.json','--baseline=original.json',...(strict?['--strict']:[])],{cwd:dir,env:{...process.env,GITHUB_SHA:commit},encoding:'utf8'});return {status:r.status,report:readFileSync(join(dir,'completion/report.md'),'utf8'),json:JSON.parse(readFileSync(join(dir,'completion/report.json'),'utf8'))};}finally{rmSync(dir,{recursive:true,force:true});}
}
function receipt(dir,data,mutate=()=>{}){
 writeFileSync(join(dir,'actual.test.mjs'),"import test from 'node:test'; import assert from 'node:assert/strict'; test('measured result',()=>assert.equal(2+2,4));\n");
 const record={schemaVersion:1,check:'automated',kind:'node-test',result:'pass',commit,command:['node','--test','actual.test.mjs'],observedAt:'2026-11-06T09:00:00Z'};mutate(record,dir);
 const bytes=JSON.stringify(record);writeFileSync(join(dir,'result.json'),bytes);data.objectives[0].acceptance[0].evidence=[{path:'result.json',sha256:createHash('sha256').update(bytes).digest('hex'),check:record.check,commit:record.commit}];
}
test('historical gate accepted invented test run #1; repaired gate rejects it',()=>assert.notEqual(check(fixture('complete',true,['test run #1'])).status,0));
test('invented or unavailable run URL cannot count as evidence',()=>assert.notEqual(check(fixture('complete',true,['https://github.com/Parris-Tech-Services/GentleMovement/actions/runs/999999999999999'])).status,0));
test('false completion with one unresolved original criterion rejected',()=>{const d=fixture();d.objectives[0].acceptance.push({id:'production',description:'Live production must match',verified:false,evidence:[]});assert.notEqual(check(d,receipt).status,0);});
test('passing unit test cannot stand in for deployment evidence',()=>{const d=fixture();d.objectives[0].acceptance[0].kind='deployment';assert.notEqual(check(d,receipt).status,0);});
test('captured pass flag cannot conceal an actual failing test',()=>assert.notEqual(check(fixture(),(dir,d)=>receipt(dir,d,(_,root)=>writeFileSync(join(root,'actual.test.mjs'),"import test from 'node:test'; test('failure',()=>{throw Error('still broken')});"))).status,0));
test('hash mismatch rejected',()=>assert.notEqual(check(fixture(),(dir,d)=>{receipt(dir,d);writeFileSync(join(dir,'result.json'),'{}');}).status,0));
test('stale tested SHA rejected',()=>assert.notEqual(check(fixture(),(dir,d)=>receipt(dir,d,r=>r.commit='b'.repeat(40))).status,0));
test('legacy complete claim fails in report mode as well',()=>assert.notEqual(check(fixture('complete',true,['completion/audio-verification.json']),()=>{},false).status,0));
test('interrupted open work remains open in generated report',()=>{const r=check(fixture('open',false,[]),()=>{},false);assert.equal(r.status,0);assert.equal(r.json.objectives[0].status,'open');assert.equal(r.json.objectives[0].criteria[0].verified,false);});
test('actual fresh executed criterion with matching receipt accepted',()=>{const r=check(fixture(),receipt);assert.equal(r.status,0,r.report);assert.equal(r.json.complete,true);});

test('dropping one preserved original requirement is rejected',()=>{const d=fixture();d.objectives[0].acceptance.push({id:'playtest',description:'Original hosted playtest',verified:false,evidence:[]});const r=check(d,(dir,current)=>{current.objectives[0].acceptance.pop();receipt(dir,current);});assert.notEqual(r.status,0);assert.equal(r.json.complete,false);});
