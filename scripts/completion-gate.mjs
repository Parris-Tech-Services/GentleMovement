#!/usr/bin/env node
// Reusable, dependency-free project completion gate. Node 20+.
// Completion is an evidence-backed state, not a successful deploy.
import {readFileSync,writeFileSync,mkdirSync} from 'node:fs';
import {resolve} from 'node:path';
const file=process.argv.find(x=>x.startsWith('--file='))?.slice(7)||'completion/objectives.json';
const strict=process.argv.includes('--strict');
const data=JSON.parse(readFileSync(resolve(file),'utf8'));
if(data.schemaVersion!==1||!Array.isArray(data.objectives))throw Error('Invalid objective ledger');
const failures=[];
const lines=['# Project Completion Report','',`Project: ${data.project||'Unnamed'}`,''];
for(const o of data.objectives){
 if(!o.id||!o.title||!Array.isArray(o.acceptance)||!o.acceptance.length)throw Error('Malformed objective');
 const incomplete=o.acceptance.filter(a=>!a.verified||!Array.isArray(a.evidence)||a.evidence.length===0);
 const complete=incomplete.length===0;
 if(o.status==='complete'&&!complete)failures.push(`${o.id}: marked complete without evidence for every criterion`);
 if(!['open','blocked','complete'].includes(o.status))throw Error('Invalid objective status: '+o.id);
 lines.push(`## ${o.id}: ${o.title}`,`Status: ${complete&&o.status==='complete'?'COMPLETE':'OPEN'} (${o.acceptance.length-incomplete.length}/${o.acceptance.length} evidenced)`,'');
 for(const a of o.acceptance)lines.push(`- [${a.verified&&a.evidence?.length?'x':' '}] ${a.id}: ${a.description}${a.evidence?.length?' — '+a.evidence.join('; '):''}`);
 lines.push('');
 if(o.status==='complete'&&!complete)lines.push('INVALID: completion claim lacks evidence','');
 if(!complete||o.status!=='complete')failures.push(`${o.id}: ${incomplete.length} criteria unverified; status=${o.status}`);
}
const report=lines.join('\n');
mkdirSync('completion',{recursive:true});
writeFileSync('completion/report.md',report+'\n');
console.log(report);
if(process.env.GITHUB_STEP_SUMMARY)writeFileSync(process.env.GITHUB_STEP_SUMMARY,report+'\n',{flag:'a'});
if(failures.length){console.error('Completion gate: '+failures.join(' | '));if(strict||data.objectives.some(o=>o.status==='complete'&&o.acceptance.some(a=>!a.verified||!a.evidence?.length)))process.exitCode=1}
