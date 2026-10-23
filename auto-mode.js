// Guided pacing is not movement detection or a change to clinical instructions.
export const AUTO_REP_SECONDS = 5;
export const AUTO_UNSPECIFIED_SECONDS = 15;
export function autoPhaseDuration(phase) {
  if (!phase) throw new TypeError('A prescribed movement step is required');
  return (phase.seconds > 0 ? phase.seconds : AUTO_REP_SECONDS) * 1000;
}
export function autoPhasePrompt(phase) {
  if (!phase) throw new TypeError('A prescribed movement step is required');
  return `${phase.side ? phase.side + ' side. ' : ''}Repetition ${phase.rep}.${phase.seconds ? ` Hold for ${phase.seconds} seconds.` : ''}`;
}
export function autoUnspecifiedPrompt(exercise) {
  return `${exercise.name}. ${exercise.text} No timed duration was prescribed for this movement. Here is a short, optional fifteen-second practice window. Stop or pause at any time.`;
}
