// A local-only summary of self-reported exercise activity. It does not infer diagnosis.
export const WINDOWS = Object.freeze([7,30,90,'all']);
export function rating(value) {
  if (value === null || value === undefined || value === '') return null;
  const n = Number(value);
  return Number.isInteger(n) && n >= 0 && n <= 10 ? n : null;
}
const mean = list => list.length ? Math.round(list.reduce((total,n)=>total+n,0)/list.length*10)/10 : null;
export function makeClinicianReport(history,{days=30,programme='all',now=Date.now()}={}) {
  if (!WINDOWS.includes(days)) throw new RangeError('Invalid report period.');
  if (!Array.isArray(history)) throw new TypeError('Session history must be an array.');
  const cutoff=days==='all' ? -Infinity : now-days*86400000;
  const sessions=history.filter(s=>{
    const time=Number(s?.ended);
    return Number.isFinite(time) && time>0 && time<=now && time>=cutoff &&
      (programme==='all'||s.programme===programme);
  }).sort((a,b)=>a.ended-b.ended);
  const completed=sessions.filter(s=>s.status==='complete').length;
  const stopped=sessions.filter(s=>s.status==='stopped').length;
  const partial=sessions.length-completed-stopped;
  const paired=sessions.filter(s=>rating(s.before)!==null && rating(s.after)!==null);
  const before=paired.map(s=>rating(s.before)), after=paired.map(s=>rating(s.after));
  const observations=[];
  const flags=[];
  for(const s of sessions){
    const list=Array.isArray(s.results)?s.results:[];
    if(s.status==='stopped'){
      flags.push({ended:s.ended,programme:s.programme,exercise:'Session stopped',reason:'Session stopped',pain:null,note:String(s.notes||'').slice(0,500)});
    }
    for(const entry of list){
      const pain=rating(entry?.pain);
      const difficulty=['easy','manageable','difficult'].includes(entry?.difficulty)?entry.difficulty:'';
      const note=String(entry?.note||'').trim().slice(0,500);
      const exercise=String(entry?.name||'Unnamed exercise').slice(0,150);
      const observation={ended:s.ended,programme:s.programme,exercise,pain,difficulty,note,status:entry?.status||''};
      if(pain!==null||difficulty||note)observations.push(observation);
      const reasons=[];
      if(pain!==null&&pain>=7)reasons.push('Discomfort 7–10/10');
      if(difficulty==='difficult')reasons.push('Rated difficult');
      if(entry?.status==='skipped')reasons.push('Skipped exercise');
      if(reasons.length)flags.push({...observation,reason:reasons.join(' · ')});
    }
  }
  flags.sort((a,b)=>b.ended-a.ended);
  observations.sort((a,b)=>b.ended-a.ended);
  return {
    days,programme,sessionCount:sessions.length,completed,partial,stopped,
    pairedCount:paired.length,averageBefore:mean(before),averageAfter:mean(after),
    ratedExercises:observations.filter(o=>o.pain!==null).length,
    sessions,
    trend:sessions.map(s=>({ended:s.ended,programme:s.programme,before:rating(s.before),after:rating(s.after),status:s.status})),
    flags,observations
  };
}
