import { VoiceBank, validateManifest } from './index.js'
export class WebAudioBackend {
  constructor({maxDecoded = 32} = {}) { this.cache = new Map(); this.maxDecoded=maxDecoded; this.sources=[]; this.finish=null }
  unlock() {
    this.context ??= new (globalThis.AudioContext || globalThis.webkitAudioContext)()
    this.gain ??= this.context.createGain()
    this.gain.disconnect(); this.gain.connect(this.context.destination)
    return this.context.resume()
  }
  pause() { return this.context?.suspend() }
  resume() { return this.context?.resume() }
  setVolume(volume) { if(this.gain) this.gain.gain.value=volume }
  stop() {
    for (const source of this.sources) { source.onended=null; try {source.stop()} catch { /* already stopped */ } }
    this.sources=[]; this.finish?.(); this.finish=null
  }
  async decode(key, load) {
    if (this.cache.has(key)) {const buffer=this.cache.get(key);this.cache.delete(key);this.cache.set(key,buffer);return buffer}
    const buffer=await this.context.decodeAudioData(await load())
    this.cache.set(key,buffer)
    while(this.cache.size>this.maxDecoded)this.cache.delete(this.cache.keys().next().value)
    return buffer
  }
  async play(clips, {baseURL, signal, volume=1, gapMs=35, rate=1}) {
    if(!Number.isFinite(gapMs)||gapMs<0||gapMs>2000)throw new Error('Gap must be 0–2000 ms')
    const base=new URL(baseURL,location.href)
    const buffers=[]
    for(const clip of clips) {
      const url=new URL(clip.file,base)
      if(url.origin!==base.origin)throw new Error('Cross-origin pack asset rejected')
      buffers.push(await this.decode(clip.sha256,async()=>{
        const response=await fetch(url,{signal})
        if(!response.ok)throw new Error('Recording unavailable: '+clip.id)
        const bytes=await response.arrayBuffer()
        const hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('')
        if(hash!==clip.sha256)throw new Error('Recording checksum mismatch: '+clip.id)
        return bytes
      }))
    }
    return this.playBuffers(buffers,{signal,volume,gapMs,rate})
  }
  async playBytes(bytes,{signal,volume=1}) {
    const buffer=await this.context.decodeAudioData(bytes.slice(0))
    return this.playBuffers([buffer],{signal,volume,gapMs:0,rate:1})
  }
  playBuffers(buffers,{signal,volume,gapMs,rate}) {
    if(signal?.aborted)return Promise.resolve()
    this.setVolume(volume)
    return new Promise(resolve=>{
      const done=()=>{signal?.removeEventListener('abort',abort);this.finish=null;this.sources=[];resolve()}
      const abort=()=>this.stop()
      this.finish=done;signal?.addEventListener('abort',abort,{once:true})
      let time=this.context.currentTime+.02
      buffers.forEach((buffer,index)=>{
        const source=this.context.createBufferSource();source.buffer=buffer;source.playbackRate.value=rate;source.connect(this.gain)
        if(index===buffers.length-1)source.onended=done
        this.sources.push(source);source.start(time);time+=buffer.duration/rate+gapMs/1000
      })
      if(!buffers.length)done()
    })
  }
}
export async function loadVoiceBank(manifestURL, options={}) {
  const url=new URL(manifestURL,location.href)
  const response=await fetch(url)
  if(!response.ok)throw new Error('Voice pack could not load')
  const manifest=validateManifest(await response.json())
  return new VoiceBank({...options,manifest,baseURL:new URL('./',url).href,backend:options.backend||new WebAudioBackend()})
}
export function deviceSpeechFallback(text,{signal,volume,locale}) {
  return new Promise((resolve,reject)=>{
    if(!globalThis.speechSynthesis) return reject(new Error('Device speech is unavailable'))
    const utterance=new SpeechSynthesisUtterance(text);utterance.lang=locale;utterance.volume=volume
    const done=()=>{signal.removeEventListener('abort',abort);resolve()}
    const abort=()=>{speechSynthesis.cancel();done()}
    if(signal.aborted)return resolve()
    signal.addEventListener('abort',abort,{once:true});utterance.onend=done
    utterance.onerror=e=>{signal.removeEventListener('abort',abort);reject(new Error(e.error))}
    speechSynthesis.speak(utterance)
  })
}
// Explicitly configured only. It never calls ElevenLabs or any paid generation endpoint.
export function httpNeuralFallback(endpoint,{maxCached=20}={}) {
  const cache=new Map()
  return async (text,{signal,volume,backend})=>{
    const key=text
    let bytes=cache.get(key)
    if(!bytes) {
      const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({text}),signal})
      if(!response.ok)throw new Error('Local neural speech unavailable')
      bytes=await response.arrayBuffer();cache.set(key,bytes)
      while(cache.size>maxCached)cache.delete(cache.keys().next().value)
    }
    if(!signal.aborted)await backend.playBytes(bytes,{signal,volume})
  }
}
