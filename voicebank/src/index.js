export function normalize(text) {
  return String(text).normalize('NFKC').toLowerCase().replace(/[’]/g, "'")
    .replace(/[^\p{L}\p{N}']/gu, ' ').replace(/\s+/g, ' ').trim()
}
export function numberWords(n) {
  if (!Number.isInteger(n) || n < 0 || n > 100) throw new RangeError('Numbers must be integers from 0 to 100')
  const small = 'zero one two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen'.split(' ')
  const tens = ['', '', 'twenty', 'thirty', 'forty', 'fifty', 'sixty', 'seventy', 'eighty', 'ninety']
  if (n < 20) return small[n]
  if (n === 100) return 'one hundred'
  return tens[Math.floor(n / 10)] + (n % 10 ? ' ' + small[n % 10] : '')
}
export function canonical(text) {
  return normalize(text).replace(/\b\d+\b/g, n => Number(n) <= 100 ? numberWords(Number(n)) : n)
}
export function validateManifest(manifest) {
  if (manifest?.schemaVersion !== 1 || !manifest.packId || !manifest.voice?.id || !manifest.locale || !Array.isArray(manifest.clips)) throw new Error('Invalid voice pack manifest')
  const ids = new Set(), texts = new Set()
  for (const clip of manifest.clips) {
    const key = canonical(clip.text) + ":" + (clip.variant || "default")
    if (!clip.id || !key || ids.has(clip.id) || texts.has(key)) throw new Error('Duplicate or invalid clip: ' + clip.id)
    if (!['planned', 'ready'].includes(clip.status)) throw new Error('Invalid clip status')
    if (clip.status === 'ready' && (!clip.file || !/^[a-f0-9]{64}$/.test(clip.sha256 || ''))) throw new Error('Ready clip needs file and SHA-256')
    if (clip.file && (clip.file.startsWith('/') || clip.file.includes('..') || /^[a-z]+:/i.test(clip.file))) throw new Error('Clip files must be relative pack paths')
    ids.add(clip.id); texts.add(key)
  }
  return manifest
}
export function planSpeech(manifest, text, { structured = false } = {}) {
  validateManifest(manifest)
  const key = canonical(text)
  if (!key || String(text).length > 1000) throw new Error('Speech must contain 1–1000 characters')
  const ready = manifest.clips.filter(c => c.status === 'ready' && !c.idOnly && c.approval === 'approved' && (c.variant || 'default') === 'default')
  const exact = ready.find(c => canonical(c.text) === key)
  if (exact) return { kind: 'recording', clips: [exact], text }
  if (!structured || key.split(' ').length > 12) return { kind: 'fallback', clips: [], text, reason: 'No complete recording' }
  const tokens = key.split(' '), best = Array(tokens.length + 1).fill(null)
  best[tokens.length] = []
  for (let i = tokens.length - 1; i >= 0; i--) {
    for (const clip of ready) {
      if (clip.assemblySafe === false) continue
      const words = canonical(clip.text).split(' ')
      const end = i + words.length
      if (end <= tokens.length && best[end] && words.every((w, j) => w === tokens[i+j])) {
        const candidate = [clip, ...best[end]]
        if (!best[i] || candidate.length < best[i].length) best[i] = candidate
      }
    }
  }
  return best[0] ? {kind:'structured', clips:best[0], text} : {kind:'fallback', clips:[], text, reason:'Missing clip; use whole-sentence fallback'}
}
export class VoiceBank {
  constructor({manifest, baseURL, backend, fallback = null, enabled = true, volume = 1}) {
    this.manifest = validateManifest(manifest)
    this.baseURL = baseURL
    this.backend = backend
    this.fallback = fallback
    this.enabled = enabled
    this.volume = Math.max(0, Math.min(1, volume))
    this.revision = 0
    this.missing = new Set()
    this.listeners = new Set(); this.rate = 1
  }
  on(listener) { this.listeners.add(listener); return () => this.listeners.delete(listener) }
  emit(event) { for(const listener of this.listeners) { try { listener(event) } catch {} } }
  pause() { return this.backend.pause?.() }
  resume() { return this.backend.resume?.() }
  setRate(rate) { if(!Number.isFinite(rate)||rate<0.5||rate>2) throw new RangeError('Rate must be 0.5–2'); this.rate=rate }
  plan(text, options) { return planSpeech(this.manifest, text, options) }
  stop() { this.revision++; this.controller?.abort(); this.backend.stop(); this.fallback?.stop?.() }
  setEnabled(value) { this.enabled = Boolean(value); if (!this.enabled) this.stop() }
  setVolume(value) { if (!Number.isFinite(value)) throw new TypeError('Volume must be finite'); this.volume = Math.max(0, Math.min(1,value)); this.backend.setVolume?.(this.volume) }
  async say(text, options = {}) {
    this.stop()
    if (!this.enabled) return {status:'muted'}
    const revision = this.revision, controller = new AbortController()
    this.controller = controller
    this.emit({type:"start",text})
    // Resume synchronously from the click handler, before fetching/decoding audio.
    const unlocking = this.backend.unlock?.()
    const plan = this.plan(text, options)
    try {
      await unlocking
      if (controller.signal.aborted) return {status:'cancelled'}
      if (plan.kind !== 'fallback') {
        await this.backend.play(plan.clips, {baseURL:this.baseURL, signal:controller.signal, volume:this.volume, gapMs:options.gapMs ?? 35, rate:this.rate})
      } else {
        this.missing.add(String(text)) // Local memory only; never automatically transmitted.
        if (!this.fallback) return {status:'missing', reason:plan.reason}
        await this.fallback(String(text), {signal:controller.signal, volume:this.volume, voice:this.manifest.voice, locale:this.manifest.locale, backend:this.backend})
      }
      const result={status:revision === this.revision ? 'played' : 'cancelled', source:plan.kind, clipIds:plan.clips.map(c=>c.id)}
      this.emit({type:result.status,...result}); return result
    } catch (error) {
      if (controller.signal.aborted) return {status:'cancelled'}
      return {status:'error', message:error.message}
    }
  }
}
