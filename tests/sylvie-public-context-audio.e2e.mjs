/**
 * Cross-application public-endpoint acceptance: no SylvieApp private code,
 * credentials, user profile, local saves or downloaded recordings.
 * Executes only published browser controls and publicly served original MP3s.
 */
import { chromium } from 'playwright'
import assert from 'node:assert/strict'

const BASE = process.env.SYLVIE_PUBLIC_URL || 'https://cdeb90a2.sylvie-app-github.pages.dev'
const favoriteClips = Object.entries({
  fairy:'Y8LfgE8ddvEnQMJ5rjuH',farm:'BRuCJTsHYZiQ9czRRp6x',
  piglet:'FHkb1rgg72R8U8AYgFdw',puppy:'29nEpwGmFRojInH5kxNz',
  'ocean-princess':'FhPRbdQwUvvC3y5M5r7i','ice-sisters':'YfaFpWVNVBlvZ1ELNflL',
  'book-princess':'c7816n2K2hQS2TSCei8u',mermaid:'n73cD2bdGe4NWHbZQpps',
  'mouse-friend':'zEhLc1cg0XJRkSH8zXzu','sorting-truck':'0twafB3JnXULs87nIjbU',
  colouring:'kuRs4qGiYeIqQON4Y5n9',swing:'XA3JyiibPC5pPyihvTZJ',
  trampoline:'XMZWq0qbSQoheBjh1S4x','dress-up':'KiRJJlhSVSxqyJtdhmd3',
  wand:'6m1BuLNlLu2qY4WoYkd4',puzzle:'JKbZ1GO3Mb5ji9bHgxHc',
  blocks:'phAxgo89jS4GpOBnqm9e'
})
const ideas = [
  ['game-ideas-intro','cogIdefG2ujTPcuPNYp5','Hear about these future ideas'],
  ['game-concepts','TlfaUxA5iEGFD40ZPOYx','Hear these game concepts'],
  ['feature-inspiration','0Lgh6mQAqjJQWpNSLITm','Hear these future feature ideas']
]

function instrument(mode) {
  return ({mode}) => {
    window.__observedOriginals = []
    window.__nativeSpeechCalls = 0
    localStorage.setItem('sylvieapp:settings',JSON.stringify({soundsEnabled:mode!=='quiet',voiceMode:mode}))
    const NativeAudio = window.Audio
    window.Audio = function(...args) {
      const instance = new NativeAudio(...args)
      window.__observedOriginals.push(instance)
      return instance
    }
    if(window.speechSynthesis) window.speechSynthesis.speak = ()=>{window.__nativeSpeechCalls++}
  }
}
async function hear(page, generationId, label) {
  const button = page.getByRole('button',{name:label,exact:true})
  await button.waitFor({state:'visible',timeout:15000})
  assert.equal(await button.isEnabled(),true,label+' should be enabled')
  await button.click()
  await page.waitForFunction(id=>{
    const a=window.__observedOriginals.find(x=>x.currentSrc.includes('/audio/sylvie/recovered/'+id+'.mp3'))
    return !!a&&a.currentTime>0.12&&a.readyState>=2&&!a.error&&!a.paused&&a.volume>0
  },generationId,{timeout:18000,polling:250})
  const summary=await page.evaluate(id=>{
    const a=window.__observedOriginals.find(x=>x.currentSrc.includes('/audio/sylvie/recovered/'+id+'.mp3'))
    return {src:a.currentSrc,time:a.currentTime,duration:a.duration,tts:window.__nativeSpeechCalls,readyState:a.readyState}
  },generationId)
  assert.equal(summary.tts,0,'Do not silently use device speech')
  assert.ok(summary.duration>0,'Actual file duration should decode')
  await page.getByRole('button',{name:'Stop voice',exact:true}).click()
  assert.equal(await page.evaluate(id=>window.__observedOriginals.find(x=>x.currentSrc.includes(id+'.mp3')).paused,generationId),true,'Stop must pause actual media')
  console.log('PASS ORIGINAL',label,generationId,'time',summary.time.toFixed(2),'duration',summary.duration.toFixed(2))
}
async function check(viewport) {
  const browser=await chromium.launch({headless:true,args:['--no-sandbox']})
  const context=await browser.newContext({viewport,locale:'en-AU',serviceWorkers:'block'})
  const page=await context.newPage()
  try {
    await page.addInitScript(instrument('tap'),{mode:'tap'})
    // Reproducible question selection only: still answer real game controls.
    await page.addInitScript(()=>{const n=localStorage.getItem('__qa_seed');if(n!==null)Math.random=()=>Number(n)})
    for(const [name,id] of favoriteClips) {
      await page.goto(BASE+'/things-sylvie-loves/'+name,{waitUntil:'domcontentloaded'})
      await hear(page,id,'Hear this activity')
    }
    for (const [key,id,label] of ideas) {
      await page.goto(BASE+'/game-ideas',{waitUntil:'domcontentloaded'})
      if(key==='game-concepts')await page.getByText('Fun game concepts',{exact:true}).click()
      if(key==='feature-inspiration')await page.getByText('Feature inspiration',{exact:true}).click()
      await hear(page,id,label)
    }
    await page.goto(BASE+'/parent-settings',{waitUntil:'domcontentloaded'})
    assert.equal(await page.evaluate(()=>window.__observedOriginals.some(a=>a.src.includes('CLmhlWLp5a0WCYKOIbxu'))),false,'Parent narration before gated entry')
    await page.locator('#passcode').fill('2468')
    await page.getByRole('button',{name:'Open settings'}).click()
    await hear(page,'CLmhlWLp5a0WCYKOIbxu','Hear about parent settings')
    await page.goto(BASE+'/feelings-friends',{waitUntil:'domcontentloaded'})
    await page.getByRole('button',{name:'me',exact:true}).click()
    await hear(page,'2gJAFjEybxjueORMOErd','Hear the check-in question')
    // Six additional REC clips occur only in genuine question states.
    for(const [word,seed,id] of [
      ['apple',.3,'hHYfVQwoK3Lj6HYPYozR'],
      ['book',.9,'uNcLgUDESUmyce67ppUo']
    ]) {
      await page.evaluate(seed=>localStorage.setItem('__qa_seed',String(seed)),seed)
      await page.goto(BASE+'/rhyme-time-together',{waitUntil:'domcontentloaded'})
      assert.equal((await page.locator('button.listen-card strong').textContent()).trim(),word,'Real word round should match its recording')
      await hear(page,id,'Hear the word question')
    }
    for(const [situation,seed,id] of [
      ['A kind friend gives a hug.',.7,'YTwKrU54jHNZb6uwZeIz'],
      ['A favourite cup breaks.',.9,'5Vzw1tBngEmwTi9V56LI']
    ]) {
      await page.evaluate(seed=>localStorage.setItem('__qa_seed',String(seed)),seed)
      await page.goto(BASE+'/feelings-friends',{waitUntil:'domcontentloaded'})
      for(let i=0;i<3;i++) {
        const answer=await page.locator('.feeling-main .feeling-face').getAttribute('aria-label')
        await page.locator('button.emotion-choice').filter({hasText:answer}).first().click()
        await page.waitForTimeout(1500)
      }
      assert.equal((await page.locator('.feeling-main strong').textContent()).trim(),situation,'Situation should emerge after real face matching')
      await hear(page,id,'Hear the feelings question')
    }
    await page.evaluate(()=>localStorage.setItem('__qa_seed','0.5'))
    await page.goto(BASE+'/more-or-less-meadow',{waitUntil:'domcontentloaded'})
    const left=await page.locator('button[aria-label="left group"] .meadow-thing').count()
    const right=await page.locator('button[aria-label="right group"] .meadow-thing').count()
    assert.notEqual(left,right)
    await page.getByRole('button',{name:left>right?'left group':'right group'}).click()
    await page.getByRole('button',{name:'Hear which has less'}).waitFor({state:'visible',timeout:10000})
    await hear(page,'z4o6Jz2lXcqnnvCrKn9q','Hear which has less')
    await page.goto(BASE+'/sparkle-count',{waitUntil:'domcontentloaded'})
    assert.ok(await page.locator('.sparkle-count-icon[aria-label="apple"]').count()>0,'Real non-star count should match recovered prompt')
    await hear(page,'pordhVU54sPAV9lO4gyf','Hear the counting challenge')
    await page.goto(BASE+'/game-ideas',{waitUntil:'domcontentloaded'})
    await page.getByRole('button',{name:'Toggle automatic narration'}).click()
    // Switching from tap to voice triggers route controls; allow a gesture-required browser to show a tap notice.
    await page.getByRole('button',{name:'Toggle automatic narration'}).click()
    console.log('PASS VIEWPORT',viewport.width+'x'+viewport.height,'28 contextual takes: original media, Stop, no TTS')
  } finally {await browser.close()}
}
for(const viewport of [{width:1280,height:800},{width:390,height:844}])await check(viewport)
console.log('PASS: 56 original context-media checks (28 distinct REC takes × 2 viewports); no synthetic speech')
