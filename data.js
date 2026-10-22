// No patient information belongs in this public repository.
import {programmeArchive,adviceArchive} from './programmes.js';
export const programmes=programmeArchive;
export {adviceArchive};
export const defaultTimes=['06:30','08:30','16:30','18:30','20:30','22:30'];
export const expiry=null;
export function sydneyDate(time=Date.now()){return new Intl.DateTimeFormat('en-CA',{timeZone:'Australia/Sydney',year:'numeric',month:'2-digit',day:'2-digit'}).format(time)}
export function phases(e){if(!e.reps)return [];let list=[];for(let n=1;n<=e.reps;n++)for(const side of e.sides?['Left','Right']:[''])list.push({rep:n,side,seconds:e.ambiguous?0:e.hold&&(e.each||n===e.reps)?e.hold:0});return list}
export function remaining(timer,now=Date.now()){return timer?Math.max(0,timer.end?Math.ceil((timer.end-now)/1000):timer.left):0}
export function expired(p,now=Date.now()){return Boolean(p.expiresOn)&&sydneyDate(now)>p.expiresOn}
export function command(text){text=text.toLowerCase().replace(/[’']/g,'').replace(/[^a-z0-9 ]/g,'').trim();const map={'start exercises':'start','im ready':'ready','i am ready':'ready','ready':'ready','done':'done','next exercise':'done','confirm done':'confirm','confirm':'confirm','cancel':'cancel','repeat that':'repeat','how many left':'left','start timer':'timer','pause':'pause','resume':'resume','skip this one':'skip','that hurts':'hurt','finish session':'finish','rep done':'rep','hold done':'rep'};return map[text]||null}
