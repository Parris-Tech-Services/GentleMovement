// Exact raw prompt and exact Naomy identity only. Existing app owns all fallback/safety sequencing.
import {loadVoiceBank} from '../src/browser.js'
export function gentleMovementAdapter(manifestURL,{voiceId='2oKmj8Mq72d27JWiLtSX'}={}) {
 let bank=null
 const ready=loadVoiceBank(manifestURL).then(value=>{
  if(value.manifest.voice.id!==voiceId)throw new Error('Gentle Movement voice identity mismatch')
  bank=value;return value
 })
 return {
  ready,
  hasExact(text){return !!bank?.manifest.clips.some(c=>c.text===text&&c.status==='ready'&&c.approval==='approved'&&!c.idOnly)},
  say(text,{rate=1}={}){
   if(!this.hasExact(text))return Promise.resolve({status:'missing'})
   bank.setRate(rate);return bank.say(text)
  },
  stop(){bank?.stop()},
  setEnabled(enabled){bank?.setEnabled(enabled)},
 }
}
