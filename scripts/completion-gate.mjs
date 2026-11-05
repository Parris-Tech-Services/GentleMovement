#!/usr/bin/env node
// Existing ledger: flags and prose are claims, never verification.
import {readFileSync,writeFileSync,mkdirSync,realpathSync} from 'node:fs';
import {resolve,sep} from 'node:path';
import {createHash} from 'node:crypto';
import {spawnSync} from 'node:child_process';
const file=process.argv.find(x=>x.startsWith('--file='))?.slice(7)||'completion/objectives.json';
const strict=process.argv.includes('--strict');
const root=realpathSync(process.cwd());
const testedCommit=process.env.GITHUB_SHA||spawnSync('git',['rev-parse','HEAD'],{encoding:'utf8'}).stdout?.trim();
const data=JSON.parse(readFileSync(resolve(file),'utf8'));
if(data.schemaVersion!==1||!Array.isArray(data.objectives)||!data.objectives.length)throw Error('Invalid or empty objective ledger');
const failures=[],results=[],ids=new Set();
const baseline=process.argv.find(x=>x.startsWith('--baseline='))?.slice(11);
if(baseline){
 const original=JSON.parse(readFileSync(resolve(baseline),'utf8'));
 for(const objective of original.objectives){
  const current=data.objectives.find(o=>o.id===objective.id);
  if(!current||current.title!==objective.title)failures.push('Original objective removed or changed: '+objective.id);
  for(const criterion of objective.acceptance){
   const retained=current?.acceptance.find(a=>a.id===criterion.id);
   if(!retained||retained.description!==criterion.description)failures.push('Original requirement removed or changed: '+objective.id+'/'+criterion.id);
  }
 }
}else if(strict)failures.push('Strict completion requires --baseline from the preserved original ledger');
const lines=['# Project Completion Report','',`Project: ${data.project||'Unnamed'}`,''];
async function evidence(ref,criterion){
 if(!ref||typeof ref!=='object'||Array.isArray(ref))return 'legacy prose/reference is not independently verified';
 if(!/^[a-f0-9]{64}$/.test(ref.sha256||''))return 'missing evidence SHA-256';
 try{
  if(!ref.path||ref.url)return 'a local captured evidence path is required; remote URLs alone are not proof';
  const p=realpathSync(resolve(root,ref.path));
  if(!p.startsWith(root+sep))return 'evidence escapes checkout';
  const bytes=readFileSync(p);
  if(createHash('sha256').update(bytes).digest('hex')!==ref.sha256)return 'evidence digest mismatch';
  // Captured JSON must say what was checked; a file hash proves integrity, not truth.
  const record=JSON.parse(bytes);
  if(!['node-test','deployment'].includes(criterion.kind)||record.kind!==criterion.kind||record.check!==criterion.id)return 'criterion and evidence kind/check mismatch';
  if(record.schemaVersion!==1||!record.check||record.result!=='pass'||!/^[a-f0-9]{40}$/.test(record.commit||''))return 'missing check, pass result or tested commit';
  if(!record.command||!record.observedAt||!Number.isFinite(Date.parse(record.observedAt)))return 'missing execution provenance';
  if(ref.check!==record.check||ref.commit!==record.commit)return 'evidence check or tested commit mismatch';
  if(record.commit!==testedCommit)return 'evidence is not for the current tested commit';
  if(record.kind==='node-test'){
   const cmd=record.command;
   if(!Array.isArray(cmd)||cmd.length!==3||cmd[0]!=='node'||cmd[1]!=='--test'||!cmd[2].endsWith('.test.mjs'))return 'unsupported verification command';
   const test=realpathSync(resolve(root,cmd[2]));
   if(!test.startsWith(root+sep))return 'test escapes checkout';
   const env={...process.env};
   delete env.NODE_TEST_CONTEXT;
   for(const key of Object.keys(env))if(/TOKEN|SECRET|PASSWORD|API_KEY/.test(key))delete env[key];
   const run=spawnSync(process.execPath,['--test','--test-reporter=tap',test],{cwd:root,env,encoding:'utf8',timeout:60000,maxBuffer:2000000});
   if(run.status!==0||!/^# pass [1-9][0-9]*$/m.test(run.stdout||''))return 'fresh evidence test failed or ran zero passing tests';
  }else if(record.kind==='deployment'){
   const allowed=new Set(['https://gentle-movement.vercel.app','https://parris-tech-services.github.io']);
   if(!Array.isArray(record.assets)||!record.assets.length)return 'no deployed assets';
   if(!['app.js','programmes.js','index.html','sw.js','style.css'].every(p=>record.assets.some(a=>a.path===p)))return 'required production runtime asset missing';
   for(const asset of record.assets){
    const url=new URL(asset.url);
    if(!allowed.has(url.origin)||url.username||url.password||url.search||url.hash||!/^[a-f0-9]{64}$/.test(asset.sha256||''))return 'unsupported deployment asset';
    const local=realpathSync(resolve(root,asset.path));
    if(!local.startsWith(root+sep)||!url.pathname.endsWith('/'+asset.path))return 'deployment source path mismatch';
    if(createHash('sha256').update(readFileSync(local)).digest('hex')!==asset.sha256)return 'deployment evidence differs from tested source';
    const response=await fetch(url,{redirect:'error',signal:AbortSignal.timeout(10000)});
    if(!response.ok)return 'deployed asset unavailable';
    if(createHash('sha256').update(Buffer.from(await response.arrayBuffer())).digest('hex')!==asset.sha256)return 'deployed asset is stale or changed';
   }
  }else return 'evidence kind requires an executable independent check';
  return null;
 }catch(e){return `evidence unavailable: ${e.code||e.message}`;}
}
for(const o of data.objectives){
 if(!o.id||ids.has(o.id)||!o.title||!Array.isArray(o.acceptance)||!o.acceptance.length)throw Error('Malformed or duplicate objective');
 ids.add(o.id);
 if(!['open','blocked','complete'].includes(o.status))throw Error('Invalid objective status: '+o.id);
 const seen=new Set(),criteria=[];
 for(const a of o.acceptance){
  if(!a.id||seen.has(a.id)||!a.description||typeof a.verified!=='boolean'||!Array.isArray(a.evidence))throw Error('Malformed or duplicate acceptance criterion: '+o.id);
  seen.add(a.id);
  const errors=[];
  if(!a.verified)errors.push('not verified');
  if(!a.evidence.length)errors.push('no evidence');
  for(const ref of a.evidence){const error=await evidence(ref,a);if(error)errors.push(error);}
  criteria.push({id:a.id,verified:!errors.length,errors});
 }
 const incomplete=criteria.filter(a=>!a.verified);
 const complete=!incomplete.length&&o.status==='complete';
 results.push({id:o.id,status:complete?'complete':o.status==='blocked'?'blocked':'open',criteria});
 lines.push(`## ${o.id}: ${o.title}`,`Status: ${complete?'COMPLETE':'OPEN'} (${criteria.length-incomplete.length}/${criteria.length} evidenced)`,'');
 for(const a of criteria)lines.push(`- [${a.verified?'x':' '}] ${a.id}${a.errors.length?' — '+a.errors.join('; '):''}`);
 lines.push('');
 if(!complete)failures.push(`${o.id}: ${incomplete.length} criteria unverified; status=${o.status}`);
}
mkdirSync('completion',{recursive:true});
const report=lines.join('\n')+'\n';
writeFileSync('completion/report.md',report);
writeFileSync('completion/report.json',JSON.stringify({schemaVersion:1,complete:!failures.length,objectives:results},null,2)+'\n');
console.log(report);
if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,report,{flag:'a'});
if(failures.length){console.error('Completion gate: '+failures.join(' | '));if(strict||data.objectives.some(o=>o.status==='complete'))process.exitCode=1;}

