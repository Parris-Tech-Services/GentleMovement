// Local-only optional exercise feedback. These ratings never change a prescription.
export const DIFFICULTIES = Object.freeze(['easy','manageable','difficult']);
export function normaliseExerciseFeedback({pain='',difficulty='',note=''}={}) {
  let discomfort = null;
  if (pain !== '' && pain !== null && pain !== undefined) {
    discomfort = Number(pain);
    if (!Number.isInteger(discomfort) || discomfort < 0 || discomfort > 10) {
      throw new RangeError('Discomfort must be an integer between 0 and 10.');
    }
  }
  if (difficulty !== '' && !DIFFICULTIES.includes(difficulty)) throw new RangeError('Unknown difficulty rating.');
  if (typeof note !== 'string') throw new TypeError('Exercise note must be text.');
  return {pain:discomfort,difficulty,note:note.trim().slice(0,500)};
}
export function makeExerciseLog(exercise,session,{skip=false,manual=false,feedback={}}={}) {
  if (!exercise?.name) throw new TypeError('Exercise name is required.');
  const logged=normaliseExerciseFeedback(feedback);
  return {
    name: exercise.name,
    status: skip?'skipped':'complete',
    steps: session.step,
    total: session.totalSteps||null,
    holdSeconds: session.holdSeconds,
    manual: manual||!session.totalSteps,
    ...logged
  };
}
