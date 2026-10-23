// Guided pacing is not movement detection or a change to clinical instructions.
export const AUTO_REP_SECONDS = 5;
export const AUTO_UNSPECIFIED_SECONDS = 15;
export function autoPhaseDuration(phase) {
  if (!phase) throw new TypeError('A prescribed movement step is required');
  return (phase.seconds > 0 ? phase.seconds : AUTO_REP_SECONDS) * 1000;
}
export function autoPhasePrompt(phase,{totalReps=null,exerciseIndex=0,sessionSeed=0}={}) {
  if (!phase || !Number.isInteger(phase.rep) || phase.rep<1) throw new TypeError('A valid movement step is required');
  // A finite, complete-sentence catalogue keeps every prescribed cue recordable.
  const side=phase.side==='Left'||phase.side==='Right'?phase.side+', ':'';
  let cue=side+phase.rep+'.';
  if(phase.seconds>0)cue+=' Hold for '+phase.seconds+' seconds.';
  return cue;
}
export function autoUnspecifiedPrompt(exercise) {
  return `${exercise.name}. ${exercise.text} No timed duration was prescribed for this movement. Here is a short, optional fifteen-second practice window. Stop or pause at any time.`;
}
