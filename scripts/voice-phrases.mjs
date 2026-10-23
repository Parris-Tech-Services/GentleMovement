// Enumerate finite prerecorded narration for the currently published prescribed programmes.
// Never embeds API keys, patient-identifiable details, or session history.
import {programmeArchive} from '../programmes.js';
import {phases} from '../data.js';
import {autoPhasePrompt,autoUnspecifiedPrompt} from '../auto-mode.js';
import {PREMIUM_SAMPLE} from '../premium-voice.js';
export function voicePhrasePlan(){
 const phrases=new Set([PREMIUM_SAMPLE,
 'Your guided routine is finished. Well done for taking time to move gently.',
 'Continuing your exercise.',
 'Time for your exercises. We will take it gently. Say I am ready to begin.',
 'Your guided routine is finished. Well done for taking time to move gently.',
 'Session saved. Take care, and keep going gently.'
 ]);
 for(const [exerciseIndex,p] of programmeArchive.entries()){
  for(const [idx,e] of p.exercises.entries()){
   const steps=phases(e);
   if(!steps.length){phrases.add(autoUnspecifiedPrompt(e));continue}
   phrases.add(e.name+'. '+e.text);
   // Ten possible session-date offsets and each actual exercise index.
   for(let offset=0;offset<10;offset++)for(const phase of steps){
    phrases.add(autoPhasePrompt(phase,{totalReps:e.reps,exerciseIndex:idx,sessionSeed:offset*86400000}));
   }
  }
 }
 return [...phrases].sort((a,b)=>a.localeCompare(b,'en'));
}
