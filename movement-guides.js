// Directional schematic only, anchored to the five exercises in the 22 Oct prescription.
// Drawings do not define range of motion, body position, or unrecorded manual techniques.
const ACTIVE_ID='robins-2026-10-22';
const GUIDE_TYPES=Object.freeze({
  'Active cervical rotation':{kind:'turn',heading:'Turn your head left or right',detail:'The drawing shows only the direction, not an exact angle or how far to turn.',axis:'View from above'},
  'Passive rotation holds':{kind:'turn',heading:'Gentle rotation using your taught technique',detail:'The original instructions do not describe the hand placement. Use only the method John demonstrated.',axis:'View from above'},
  'Passive cervical flexion':{kind:'flex',heading:'Chin towards your chest',detail:'Side-view direction guide only. It does not set a range of movement.',axis:'Side view'},
  'Supported cervical extension':{kind:'extend',heading:'Gently extend with head supported',detail:'Place your fingers under the back of your head as prescribed; the drawing does not demonstrate the grip.',axis:'Side view'},
  'Mirror posture drill':{kind:'mirror',heading:'Check your posture in the mirror',detail:'Look in a mirror and gently self-correct towards neutral, as John instructed.',axis:'Front view'}
});
const esc=t=>String(t??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot',"'":'&#39;'}[c]));
export function getMovementGuide(programmeId,exercise){
  if(programmeId!==ACTIVE_ID)return null;
  return GUIDE_TYPES[exercise?.name]||null;
}
export function guideDose(exercise){
  const {reps,sides,hold,each,ambiguous}=exercise||{};
  const lines=[];
  if(reps)lines.push(sides?`${reps} on each side`:`${reps} repetitions`);
  else lines.push('No repetition count specified');
  if(hold&&ambiguous)lines.push('Hold timing unclear — confirm with your clinician');
  else if(hold)lines.push(each?`Hold each for ${hold} seconds`:`Hold the final repetition for ${hold} seconds`);
  return lines.join(' · ');
}
function turnSvg(pose,side){
  const angle=pose==='start'?0:side==='Left'?-34:34;
  const outer=pose==='start'?'Start position':side+' turn — illustrative only';
  return `<g><rect x="128" y="218" width="224" height="28" rx="14" fill="#a6b9ad"/><text x="240" y="266" text-anchor="middle" class="motion-svg-label">Shoulders (schematic)</text>
  <circle cx="240" cy="142" r="78" fill="#f2d8bc" stroke="#375c50" stroke-width="4"/>
  <g transform="rotate(${angle} 240 142)"><ellipse cx="240" cy="142" rx="48" ry="63" fill="#f2d8bc" stroke="#375c50" stroke-width="4"/>
  <path d="M226 82 L240 58 L254 82" fill="#c97b54" stroke="#375c50" stroke-width="3"/><circle cx="225" cy="138" r="4" fill="#375c50"/><circle cx="255" cy="138" r="4" fill="#375c50"/></g>
  <path d="M138 150 L115 150 L123 140 M115 150 L123 160 M342 150 L365 150 L357 140 M365 150 L357 160" stroke="#375c50" fill="none" stroke-width="4" stroke-linecap="round"/>
  <text x="107" y="180" class="motion-svg-label" text-anchor="middle">Left</text><text x="374" y="180" class="motion-svg-label" text-anchor="middle">Right</text>
  <text x="240" y="29" text-anchor="middle" class="motion-svg-heading">${outer}</text></g>`;
}
function sideSvg(pose,kind){
 const deg=pose==='start'?0:kind==='flex'?18:-17;
 const heading=pose==='start'?'Start position':kind==='flex'?'Towards chest':'Extend gently';
 return `<g><rect x="164" y="194" width="158" height="60" rx="30" fill="#8ea999"/><path d="M222 213 L226 158" stroke="#375c50" stroke-width="27" stroke-linecap="round"/>
 <g transform="rotate(${deg} 232 153)"><ellipse cx="226" cy="111" rx="47" ry="54" fill="#f2d8bc" stroke="#375c50" stroke-width="4"/><path d="M252 100 L290 126 L252 134" fill="#f2d8bc" stroke="#375c50" stroke-width="4"/><path d="M239 86 Q255 83 268 94" fill="none" stroke="#375c50" stroke-width="3"/></g>
 <path d="${kind==='flex'?'M326 94 Q343 156 307 187':'M325 171 Q348 102 311 68'}" fill="none" stroke="#375c50" stroke-width="5" stroke-linecap="round"/>
 <path d="${kind==='flex'?'M309 172 L307 187 L321 182':'M312 82 L311 68 L324 73'}" fill="none" stroke="#375c50" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"/>
 <text x="240" y="29" text-anchor="middle" class="motion-svg-heading">${heading}</text></g>`;
}
function mirrorSvg(pose){
 return `<g><rect x="105" y="42" width="270" height="214" rx="12" fill="#e5efea" stroke="#51776a" stroke-width="8"/>
 <path d="M240 58 V246" stroke="#5f9086" stroke-width="2" stroke-dasharray="5 6"/>
 <path d="M156 238 Q165 185 211 178 L269 178 Q315 185 324 238" fill="#8ea999" stroke="#375c50" stroke-width="4"/>
 <rect x="225" y="158" width="30" height="27" rx="10" fill="#f2d8bc"/>
 <g transform="translate(${pose==='start'?-17:0} 0)"><ellipse cx="240" cy="119" rx="43" ry="52" fill="#f2d8bc" stroke="#375c50" stroke-width="4"/>
 <path d="M198 107 Q194 64 241 67 Q284 65 282 107 Q255 90 240 92 Q210 84 198 107" fill="#375c50"/>
 <circle cx="223" cy="127" r="3" fill="#375c50"/><circle cx="256" cy="127" r="3" fill="#375c50"/></g>
 <text x="240" y="27" text-anchor="middle" class="motion-svg-heading">${pose==='start'?'Mirror reference':'Neutral reference (schematic)'}</text>
 </g>`;
}
export function movementGuideMarkup(guide,exercise,{pose='start',side='Left',compact=false}={}){
 if(!guide||!exercise)return '';
 pose=pose==='move'?'move':'start';side=side==='Right'?'Right':'Left';
 const svg=guide.kind==='turn'?turnSvg(pose,side):guide.kind==='mirror'?mirrorSvg(pose):sideSvg(pose,guide.kind);
 const caption=`${guide.axis}. ${pose==='start'?'Start reference':'Movement direction'}${guide.kind==='turn'?' · '+side.toLowerCase()+' side':''}. Schematic; not a measured range or clinical demonstration.`;
 return `<figure class="motion-guide ${compact?'motion-compact':''}" aria-label="Movement guide for ${esc(exercise.name)}">
 <div class="motion-head"><strong>${esc(guide.heading)}</strong><span class="pill">Schematic only</span></div>
 <svg viewBox="0 0 480 285" role="img" aria-label="${esc(caption)}">${svg}</svg>
 <figcaption>${esc(caption)}</figcaption>
 ${compact?'':`<div class="motion-controls" aria-label="Compare movement positions">
 <button type="button" data-action="guide:pose:start" aria-pressed="${pose==='start'}" class="${pose==='start'?'motion-active':''}">1 · Start reference</button>
 <button type="button" data-action="guide:pose:move" aria-pressed="${pose==='move'}" class="${pose==='move'?'motion-active':''}">2 · Direction cue</button></div>
 ${guide.kind==='turn'?`<div class="motion-controls" aria-label="Choose turning direction"><button type="button" data-action="guide:side:Left" aria-pressed="${side==='Left'}" class="${side==='Left'?'motion-active':''}">Left</button><button type="button" data-action="guide:side:Right" aria-pressed="${side==='Right'}" class="${side==='Right'?'motion-active':''}">Right</button></div>`:''}
 <div class="motion-script"><strong>John’s recorded instructions</strong><p>${esc(exercise.text)}</p>
 <strong>Recorded dose</strong><p>${esc(guideDose(exercise))}</p><p class="small">${esc(guide.detail)}</p>
 ${exercise.clarify?`<p class="note">${esc(exercise.clarify)}</p>`:''}
 </div>`}
 </figure>`;
}
