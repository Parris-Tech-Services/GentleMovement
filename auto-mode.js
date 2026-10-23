// Guided pacing is not movement detection or a change to clinical instructions.
export const AUTO_REP_SECONDS = 5;
export const AUTO_UNSPECIFIED_SECONDS = 15;
export function autoPhaseDuration(phase) {
  if (!phase) throw new TypeError('A prescribed movement step is required');
  return (phase.seconds > 0 ? phase.seconds : AUTO_REP_SECONDS) * 1000;
}
export function autoPhasePrompt(phase,{totalReps=null,exerciseIndex=0,sessionSeed=0}={}) {
  if (!phase || !Number.isInteger(phase.rep) || phase.rep<1) throw new TypeError('A valid movement step is required');
  const n=phase.rep;
  const side=phase.side==='Left'||phase.side==='Right'?phase.side:'';
  const total=Number.isInteger(totalReps)&&totalReps>=n?totalReps:null;
  // Consistent within a session; varied between exercises and across days.
  const dailyOffset=Number.isFinite(sessionSeed)?Math.abs(Math.floor(sessionSeed/86400000)):0;
  const offset=(Math.max(0,exerciseIndex)*3+dailyOffset)%10;
  const styles=side?[
    side+', '+n+'.',
    side+' side, rep '+n+'.',
    side+', number '+n+'.',
    side+', count '+n+'.',
    side+', '+n+(total?' of '+total:'')+'.',
    'On the '+side.toLowerCase()+', '+n+'.',
    side+', rep '+n+'.',
    side+' side, '+n+'.',
    side+', number '+n+'.',
    'And '+side.toLowerCase()+', '+n+'.'
  ]:[
    ''+n+'.',
    'Rep '+n+'.',
    'Number '+n+'.',
    'Count '+n+'.',
    n+(total?' of '+total:'')+'.',
    'And '+n+'.',
    'Rep '+n+'.',
    'Number '+n+'.',
    'Count '+n+'.',
    'Next, '+n+'.'
  ];
  const index=(((n-1)*2+(side==='Right'?1:0)+offset)%styles.length);
  let cue=styles[index];
  if(total && n===total && (!side||side==='Right'))
    cue=side?'Last one. '+side+', '+n+'.':'Last one, '+n+'.';
  else if(total && total%2===0 && n===total/2 && (!side||side==='Right'))
    cue+=' Halfway through the count.';
  if(phase.seconds>0){
    const seconds=phase.seconds;
    const holds=[
      'Hold for '+seconds+' seconds.',
      seconds+'-second hold.',
      'And hold for '+seconds+' seconds.',
      'Hold here for '+seconds+' seconds.'
    ];
    cue+=' '+holds[(index+n)%holds.length];
  }
  return cue;
}
export function autoUnspecifiedPrompt(exercise) {
  return `${exercise.name}. ${exercise.text} No timed duration was prescribed for this movement. Here is a short, optional fifteen-second practice window. Stop or pause at any time.`;
}
