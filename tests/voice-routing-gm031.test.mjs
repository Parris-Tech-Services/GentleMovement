import test from 'node:test'
import assert from 'node:assert/strict'
import vm from 'node:vm'
import { readFileSync } from 'node:fs'
import { approvedMovementTrackPath, premiumAssetFor } from '../premium-voice.js'

const source = readFileSync(new URL('../app.js', import.meta.url), 'utf8')
const first = source.indexOf('function cancelSpeech(){')
const last = source.indexOf('async function refreshVoiceStatus(){', first)
assert.ok(first >= 0 && last > first, 'Locate the actual current app voice dispatcher')
const dispatcher = source.slice(first, last)

function harness({provider='elevenlabs', useBank=true, exact=false, bankStatus='played',
  bankReject=false, premium=true, playReject=false, auto=true}={}) {
  const calls = { audios:[], phone:0, shared:0, stop:0, notices:[], persisted:0, rendered:0, completed:0 }
  const phrase = 'A recorded movement prompt.'
  const hash = 'a'.repeat(64) + '.mp3'
  const manifest = { provider:'elevenlabs', clips: premium ? {[phrase]:hash} : {} }
  const speech = {
    cancel(){}, getVoices(){return []},
    speak(){ calls.phone++ }
  }
  class Audio {
    constructor(src){this.src=src;this.paused=false;calls.audios.push(this)}
    play(){return playReject ? Promise.reject(new Error('media rejected')) : Promise.resolve()}
    pause(){this.paused=true}
    removeAttribute(){}
  }
  const session = {auto,paused:false,autoUntil:Date.now()+10000,autoLeft:null}
  const state = { settings:{voice:true,voiceProvider:provider,speed:1,browserVoiceURI:''},session }
  const sharedVoice = {
    ready:bankReject ? Promise.reject(new Error('voice manifest denied')) : Promise.resolve(),
    stop(){calls.stop++},
    hasExact(){return exact},
    say(){calls.shared++;return Promise.resolve({status:bankStatus})}
  }
  sharedVoice.ready.catch(()=>{})
  const ctx = {
    state,Audio,sharedVoice,sharedVoiceBankEnabled:useBank,
    window:{speechSynthesis:speech},speechSynthesis:speech,
    SpeechSynthesisUtterance:class {constructor(text){this.text=text}},
    loadPremiumManifest:async()=>manifest,fetch:async()=>({ok:true,json:async()=>manifest}),
    premiumAssetFor,approvedMovementTrackPath,
    recognition:null,listen(){},persist(){calls.persisted++},render(){calls.rendered++},
    notice(message){calls.notices.push(message)},
    setTimeout(){return 1},clearTimeout(){},
    Date,Math,Promise
  }
  vm.createContext(ctx)
  vm.runInContext('let activeAudio=null,speechToken=0,premiumManifestPromise=null,speaking=false,listening=false;\n' + dispatcher,ctx)
  function say(text=phrase,approved=null) {
    ctx.phrase=text
    ctx.approved=approved
    vm.runInContext('say(phrase,true,()=>{ onDone() },approved)',Object.assign(ctx,{onDone:()=>{calls.completed++}}))
  }
  return {ctx,calls,session,phrase,hash,say}
}
const flush = async() => { await new Promise(resolve=>setImmediate(resolve)); await new Promise(resolve=>setImmediate(resolve)) }

test('approved physio cue selects the original VO track synchronously, never native TTS',()=>{
  const h=harness()
  h.say('Welcome back', 'VO021')
  assert.equal(h.calls.audios.length,1)
  assert.equal(h.calls.audios[0].src,'./audio/elevenlabs/VO021.mp3')
  assert.equal(h.calls.phone,0)
  assert.equal(h.calls.shared,0)
  h.calls.audios[0].onended()
  assert.equal(h.calls.completed,1)
})
test('approved shared VoiceBank exact cue wins, without duplicate premium playback',async()=>{
  const h=harness({exact:true})
  h.say()
  await flush()
  assert.equal(h.calls.shared,1)
  assert.equal(h.calls.audios.length,0)
  assert.equal(h.calls.phone,0)
  assert.equal(h.calls.completed,1)
})
test('a shared catalogue miss goes to the existing premium MP3, not phone speech',async()=>{
  const h=harness({exact:false})
  h.say()
  await flush()
  assert.equal(h.calls.shared,0)
  assert.equal(h.calls.audios.length,1)
  assert.equal(h.calls.audios[0].src,'./audio/elevenlabs/'+h.hash)
  assert.equal(h.calls.phone,0)
})
test('a rejected shared manifest still tries the approved local premium MP3',async()=>{
  const h=harness({bankReject:true})
  h.say()
  await flush()
  assert.equal(h.calls.audios.at(-1)?.src,'./audio/elevenlabs/'+h.hash)
  assert.equal(h.calls.phone,0)
})
test('missing saved MP3 pauses hands-free safely and never silently invokes device voice',async()=>{
  const h=harness({exact:false,premium:false})
  h.say()
  await flush()
  assert.equal(h.calls.audios.length,0)
  assert.equal(h.session.paused,true)
  assert.ok(h.calls.notices.some(v=>v.includes('Recording unavailable')))
  assert.equal(h.calls.phone,0)
  assert.equal(h.calls.completed,0)
  assert.ok(h.calls.persisted>0&&h.calls.rendered>0)
})
test('media promise rejection pauses hands-free and does not replace it with phone speech',async()=>{
  const h=harness({useBank:false,playReject:true})
  h.say()
  await flush()
  assert.equal(h.session.paused,true)
  assert.equal(h.calls.phone,0)
  assert.ok(h.calls.audios.at(-1)?.paused)
})
test('media error event has exactly the recorded-mode failure semantics',async()=>{
  const h=harness({useBank:false})
  h.say()
  await flush()
  h.calls.audios[0].onerror()
  assert.equal(h.session.paused,true)
  assert.equal(h.calls.phone,0)
})
test('device speech is only used when explicitly selected as the provider',()=>{
  const h=harness({provider:'browser'})
  h.say()
  assert.equal(h.calls.phone,1)
  assert.equal(h.calls.audios.length,0)
  assert.equal(h.calls.shared,0)
})
test('the next cue cancels any obsolete playing media before creating another player',()=>{
  const h=harness()
  h.say('First','VO021')
  const old=h.calls.audios[0]
  h.say('Second','VO022')
  assert.equal(old.paused,true)
  assert.equal(h.calls.audios[1].src,'./audio/elevenlabs/VO022.mp3')
  assert.equal(h.calls.phone,0)
})
test('shared adapter accepts only approved exact Naomy clips and never synthesises',()=>{
  const adapter=readFileSync(new URL('../voicebank/adapters/gentle-movement.js',import.meta.url),'utf8')
  assert.match(adapter,/manifest\.voice\.id!==voiceId/)
  assert.match(adapter,/c\.text===text&&c\.status==='ready'&&c\.approval==='approved'&&!c\.idOnly/)
  assert.doesNotMatch(adapter,/speechSynthesis|SpeechSynthesisUtterance|api\.elevenlabs\.io/)
  assert.match(dispatcher,/if\(token!==speechToken\)return/)
  assert.match(dispatcher,/if\(state\.settings\.voiceProvider==='elevenlabs'\)/)
})
