export function validateArchive(raw) {
  if (!raw || raw.version !== 1 || !Array.isArray(raw.programmes) || raw.programmes.length < 1 || raw.programmes.length > 30) throw new Error('Archive must contain 1–30 programmes.');
  const programmes = raw.programmes.map((p,i) => {
    if (!p || typeof p.name !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(p.date) || !Array.isArray(p.exercises) || !p.exercises.length || p.exercises.length > 30) throw new Error('Invalid programme '+(i+1));
    const exercises = p.exercises.map((e,j) => {
      if (!e || typeof e.name !== 'string' || typeof e.text !== 'string' || !e.name.trim() || !e.text.trim()) throw new Error('Invalid exercise '+(j+1));
      const o={name:e.name.slice(0,120),text:e.text.slice(0,1200),area:String(e.area||'Custom').slice(0,40)};
      if (Number.isInteger(e.reps) && e.reps>0 && e.reps<=100) o.reps=e.reps;
      if (Number.isInteger(e.hold) && e.hold>0 && e.hold<=600) o.hold=e.hold;
      if (e.sides===true) o.sides=true;
      if (e.each===true) o.each=true;
      if (e.ambiguous===true) o.ambiguous=true;
      if (['rotation','flexion','extension','posture'].includes(e.visual)) o.visual=e.visual;
      if (typeof e.clarify==='string') o.clarify=e.clarify.slice(0,1200);
      return o;
    });
    return {id:'archive-'+p.date+'-'+i,custom:true,name:p.name.slice(0,150),date:p.date,source:String(p.source||'Imported archive').slice(0,200),frequency:String(p.frequency||'Frequency not specified').slice(0,1000),precaution:String(p.precaution||'Follow your clinician’s instructions.').slice(0,1000),expiresOn:/^\d{4}-\d{2}-\d{2}$/.test(p.expiresOn||'')?p.expiresOn:undefined,review:String(p.review||'').slice(0,300),exercises};
  });
  const notes=Array.isArray(raw.advice)?raw.advice.slice(0,100).filter(n=>n&&typeof n.title==='string'&&typeof n.text==='string').map(n=>({date:String(n.date||''),title:n.title.slice(0,150),text:n.text.slice(0,1500),source:String(n.source||'').slice(0,200),area:String(n.area||'General').slice(0,40)})):[];
  return {programmes,notes};
}
