// Finite narration catalogue shared by generation and coverage verification.
import {programmeArchive} from '../programmes.js';
import {phases} from '../data.js';
import {autoPhasePrompt,autoUnspecifiedPrompt} from '../auto-mode.js';
import {PREMIUM_SAMPLE} from '../premium-voice.js';
export const APP_PHRASES=[PREMIUM_SAMPLE,
 'Your guided routine is finished. Well done for taking time to move gently.',
 'Continuing your exercise.',
 'Time for your exercises. We will take it gently. Say I am ready to begin.',
 'Session saved. Take care, and keep going gently.',
 'I did not catch that clearly. Please try again.',
 'Say confirm to mark the exercise complete, or cancel.',
 'Say confirm to skip this exercise, or cancel.',
 'Say confirm to finish the session, or cancel.',
 'Resume when you are ready. Start the hold timer when you are in position.',
 'Move at your own pace. Say rep done after each movement.',
 'Repetitions recorded. Say done when ready.',
 'The counter is not finished. If you completed the exercise yourself, say confirm to record it manually, or cancel.',
 'Session stopped. If this triggers a headache or significant pain, contact your clinician.',
 'Well done. Say confirm to save your session, or add a comfort rating first.',
 'Stop exercising and contact your clinician if you have a headache or significant pain.',
 'Hold finished. Release, then say rep done.',
 'Ten seconds remain on this hold.',
 'Pausing is fine. Resume when you are ready, or stop the session if the exercise is aggravating your symptoms.'
];
export function voicePhrasePlan(){
 const phrases=new Set(APP_PHRASES);
 for(const p of programmeArchive)for(const e of p.exercises){
  phrases.add(e.text);
  const steps=phases(e);
  phrases.add(steps.length?e.name+'. '+e.text:autoUnspecifiedPrompt(e));
  for(const phase of steps)phrases.add(autoPhasePrompt(phase,{totalReps:e.reps}));
  for(let i=0;i<=steps.length;i++)phrases.add(i+' movement steps left.');
 }
 return [...phrases].sort((a,b)=>a.localeCompare(b,'en'));
}
