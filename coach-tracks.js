// Approved physio voice catalogue from the 100-track review, exactly VO021–VO040.
// Only clips with a spoken message matching the actual prompt may replace that prompt.
export const INTRO_TRACKS=Object.freeze(['VO022','VO023','VO024','VO025','VO026']);
export function introTrackForExercise(index){
 return Number.isInteger(index)&&index>=0&&index<INTRO_TRACKS.length?INTRO_TRACKS[index]:null;
}
export function repTrackForPhase(exerciseIndex,phase){
 if(!phase||!Number.isInteger(phase.rep))return null;
 if(exerciseIndex<2&&exerciseIndex>=0&&!phase.seconds&&phase.rep===1){
  return phase.side==='Left'?'VO027':phase.side==='Right'?'VO028':null;
 }
 if((exerciseIndex===2||exerciseIndex===3)&&!phase.side&&!phase.seconds){
  if(phase.rep===3)return 'VO029';
  if(phase.rep===7)return 'VO030';
 }
 return null;
}
export const PHYSIO_TRACKS=Object.freeze(Array.from({length:20},(_,i)=>'VO'+String(i+21).padStart(3,'0')));
