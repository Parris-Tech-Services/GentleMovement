// All report rendering is local. No network requests, uploads or clinical interpretation.
const esc=value=>String(value??'').replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;','\'':'&#39;'}[ch]));
const date=time=>new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',day:'2-digit',month:'short',year:'numeric'}).format(new Date(time));
const generated=()=>new Intl.DateTimeFormat('en-AU',{timeZone:'Australia/Sydney',dateStyle:'medium',timeStyle:'short'}).format(new Date());
const label=v=>v===null||v===undefined?'Not recorded':v+'/10';
const safeName=(id,programmes)=>programmes.find(p=>p.id===id)?.name||id||'Unknown programme';
const bar=(n,name)=>n===null?'<span class="muted">—</span>':`<span class="report-pain" aria-label="${name}: ${n} out of 10"><span style="width:${n*10}%"></span></span><span class="report-value">${n}/10</span>`;
export function clinicianReportMarkup(report,programmes,filter){
 const chosen=report.sessions.length;
 const options=[['7','Last 7 days'],['30','Last 30 days'],['90','Last 90 days'],['all','All history']];
 const names=[...new Set(report.sessions.map(s=>s.programme))];
 const fromAll=Array.isArray(programmes)?programmes:[];
 const programmeOptions=[{id:'all',name:'All programmes'},...fromAll.map(p=>({id:p.id,name:p.name}))];
 const count=report.sessionCount;
 const before=report.averageBefore===null?'—':report.averageBefore+'/10';
 const after=report.averageAfter===null?'—':report.averageAfter+'/10';
 return `<div class="report-page">
 <div class="eyebrow">FOR YOUR PHYSIOTHERAPY REVIEW</div>
 <h1>Movement & symptom report</h1>
 <p class="report-intro">A dated summary of self-reported activity. You decide whether to print or share it with your clinician; nothing is sent automatically.</p>
 <section class="card report-controls no-print" aria-label="Report options">
   <div class="report-filters"><div><label for="report-period">Time period</label><select id="report-period">${options.map(([value,title])=>`<option value="${value}" ${String(filter.days)===value?'selected':''}>${title}</option>`).join('')}</select></div>
   <div><label for="report-programme">Programme</label><select id="report-programme">${programmeOptions.map(p=>`<option value="${esc(p.id)}" ${filter.programme===p.id?'selected':''}>${esc(p.name)}</option>`).join('')}</select></div></div>
   <div class="row"><button type="button" data-action="report-print" class="primary">Print or save as PDF</button><a href="#progress" class="button">← Back to progress</a></div>
   <p class="small">On Android, the print screen may offer “Save as PDF”. Saving or sharing the resulting document is your choice.</p>
 </section>
 <section class="report-heading"><div><strong>Physiotherapy activity summary</strong><p class="small">Period: ${options.find(([value])=>value===String(report.days))?.[1]||'Selected period'} · Programme: ${esc(filter.programme==='all'?'All programmes':safeName(filter.programme,fromAll))}</p></div><p class="small">Prepared ${esc(generated())} · Australia/Sydney</p></section>
 <section class="card"><h2>At a glance</h2>
   <div class="report-stats"><div><strong>${count}</strong><span>logged sessions</span></div><div><strong>${report.completed}</strong><span>complete</span></div><div><strong>${report.partial}</strong><span>partial</span></div><div><strong>${report.stopped}</strong><span>stopped</span></div></div>
   <p class="small">${count?'Completed and stopped sessions are based only on what was recorded in this browser.':'No sessions match these filters yet.'}</p>
 </section>
 <section class="card"><h2>Discomfort across sessions</h2><p>Average before: <strong>${before}</strong> · Average after: <strong>${after}</strong></p>
 <p class="small">These averages use only the ${report.pairedCount} session${report.pairedCount===1?'':'s'} with both ratings. No ratings were treated as zero, and no clinical improvement is inferred.</p>
 ${report.trend.some(t=>t.before!==null||t.after!==null)?`<div class="report-scroll"><table class="report-table"><caption>Self-reported discomfort before and after each session (0–10)</caption><thead><tr><th scope="col">Session</th><th scope="col">Before</th><th scope="col">After</th></tr></thead><tbody>${report.trend.filter(t=>t.before!==null||t.after!==null).map(t=>`<tr><th scope="row">${esc(date(t.ended))}<span class="small report-status">${esc(t.status||'')}</span></th><td>${bar(t.before,'Before')}</td><td>${bar(t.after,'After')}</td></tr>`).join('')}</tbody></table></div>`:'<p>No before/after discomfort ratings have been saved in this period.</p>'}
 </section>
 <section class="card"><h2>Exercises to discuss</h2><p class="small">Automatically highlighted when you recorded discomfort of 7–10, marked a movement difficult, skipped it, or stopped a session. These are review prompts, not diagnoses.</p>
 ${report.flags.length?report.flags.map(f=>`<article class="report-entry"><div class="row spread"><strong>${esc(f.exercise)}</strong><span class="small">${esc(date(f.ended))}</span></div><p class="small">${esc(safeName(f.programme,fromAll))}</p><p><strong>Recorded:</strong> ${esc(f.reason)}${f.pain!==null?' · '+esc(f.pain)+'/10':''}</p>${f.note?`<p><strong>Note:</strong> ${esc(f.note)}</p>`:''}</article>`).join(''):'<p>No exercises were marked for discussion in the selected period.</p>'}
 </section>
 <section class="card"><h2>Exercise observations</h2><p class="small">All saved exercise notes and ratings in the selected period, including ones not automatically highlighted above.</p>
 ${report.observations.length?report.observations.map(o=>`<article class="report-entry"><div class="row spread"><strong>${esc(o.exercise)}</strong><span class="small">${esc(date(o.ended))}</span></div><p class="small">${esc(safeName(o.programme,fromAll))} · ${esc(o.status||'unrecorded status')}</p><p>Discomfort: ${label(o.pain)} · Difficulty: ${esc(o.difficulty||'Not recorded')}</p>${o.note?`<p><strong>Your note:</strong> ${esc(o.note)}</p>`:''}</article>`).join(''):'<p>No individual exercise ratings or notes have been saved for this period.</p>'}
 </section>
 <section class="card"><h2>Questions for your next appointment</h2><p>Which movements should continue, change or stop? Do any exercises need their hold durations clarified? Should the frequency or programme be updated?</p><p class="small">These are conversation prompts only. This report cannot measure movement quality or replace a clinician’s assessment.</p></section>
 <p class="small report-disclaimer">Generated by Gentle Movement from local records. Not automatically shared, not a diagnosis, and not evidence that a prescribed plan remains current.</p>
 </div>`;
}
