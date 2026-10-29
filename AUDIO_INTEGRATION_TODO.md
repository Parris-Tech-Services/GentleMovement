# ElevenLabs integration — numbered outstanding tasks

**Status:** OPEN / NOT YET VERIFIED. **Last inventoried:** 2026-10-24. This document is a task tracker, not evidence that the changes or playtests are done.

**Triage and unique subtasks:** [TASK_TRIAGE.md](TASK_TRIAGE.md) · [Central VoiceBank 55-task register](https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/docs/GENTLE_MOVEMENT_AUDIO_TASK_INDEX.md). **Next AI item: GM-031.01**. Existing global parent numbers and completion checkboxes are unchanged.

**Global tracker:** https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/AUDIO_INTEGRATION_MASTER_TODO.md

**Rules:** Global numbers are stable (001–048); check a task off only after recording the passing tests and real production verification. Reuse existing ElevenLabs assets rather than regenerating paid speech. Manual workflows are preferred to save GitHub Actions usage. Do not play audio automatically or mislabel generic TTS as a recording.

## Tasks relevant to this repository (14)

- [x] **029** [P1] Independently confirm the documented 148-recording voice pack is completely accessible in production
  - [x] **GM-029.01** [AI] Enumerated the exact 128 dynamic manifest entries and 20 approved VO021–VO040 tracks; source SHA 987a15b5.
  - [x] **GM-029.02** [AI] Verified all 148 production MP3s (HTTP success, MIME, bytes, full SHA-256) match local source, with no unindexed local clips; [self-hosted CI run 40056982862](https://github.com/joshualparris/JoshMemory/actions/runs/40056982862).
  - [x] **GM-029.03** [AI] Tested production Auto Mode in headless Chromium/Playwright on 2026-10-24: user pressed Start Auto Mode; `audio/elevenlabs/VO021.mp3` returned HTTP 206; HTMLMediaElement `playing` and advancing `timeupdate` (over 3 seconds), `readyState=4`, no audio error. This is genuine Chromium playback verification, not a physical-device loudspeaker listening test.
  - [x] **GM-029.04** [AI] Saved a permanent [148-row per-clip live validation report](audit/elevenlabs-148-live-2026-10-24.json), with SHA-256, lengths, transcript where available and source references. Production Chromium UI playback now verified; physical phone remains optional under task 032.
- [ ] **030** [P1] Recheck every current physiotherapy exercise instruction, left/right cue, repetition count and hold timer
  - [x] **GM-030.01** [AI] Exported all four archived/current programmes to [167-row clinical cue matrix](audit/clinical-cue-matrix-2026-10-24.csv), containing exercise instructions, side, repetition, prescribed hold seconds, and exact recorded cue caption; committed `f3f1a7e1c7df4758aaa77a61689c282aace61a31`.
  - [ ] **GM-030.02** [AI] Check actual real-time audio voice timing at hold/repeat/left/right transitions against current physio instructions. Accelerated full-session browser simulations passed (silent timeline and instrumented 69 audio triggers); genuine complete real-time narration remains unverified.
  - [x] **GM-030.03** [AI] `tests/clinical-audio-acceptance.test.mjs` verifies prescribed rep/hold phase counts, 160 source phase mappings, pause/resume remaining-time arithmetic, recorded-only fallback and altered-repetition count mapping; latest independent `node --test`: 46/46 passing, commit `07a80e6f4761f949bac72e78fc54182cffe5b94a`.
  - [x] **GM-030.04** [AI] Automated mapping checks assert clinical `phases()` rep/side/hold values exactly match source exercise dose and current recorded cue coverage; no dosages synthesized for ambiguous/untimed exercises (45/45 passing tests).
- [ ] **031** [P1] Verify Auto Mode produces no accidental generic TTS when ElevenLabs is selected
  - [x] **GM-031.01** [AI] Traced actual `app.js` `say()` and shared adapter → approved VO track / exact approved VoiceBank / local premium MP3 / fail-closed pause / explicitly selected Phone voice. 10 new runtime-branch tests plus existing clinical tests PASS on public GitHub Actions [#40826496521](https://github.com/Parris-Tech-Services/GentleMovement/actions/runs/40826496521) at source commit `7a3984d5c440dfbaf86fb1ba03078c9431d2f4bc` (`tests/voice-routing-gm031.test.mjs`). Mocked media and browser API, not physical playback. Zero ElevenLabs generation. No clinical doses changed.
  - [x] **GM-031.02** [AI] Automated `node --test` on real repository checkout: 42/42 passed, including the recorded-only fallback assertion and all 167 current Auto Mode cues (161 exact manifest and six approved mappings); source commit e5624802efc7c0459cebc66223c415bdc7574178.
  - [ ] **GM-031.03** [AI] Emulate missing files, slow downloads, repeated exercises and timer transitions.
  - [x] **GM-031.04** [AI] Production Chromium Auto Mode initiated `VO021.mp3` via media element; `playing` and advancing media time observed; physical-speaker/auditory listening not asserted.
- [ ] **032** [P1] Test pausing, resuming, repeat instructions, background interruptions, offline sessions and saved history on a real phone
  - [x] **GM-032.01** [AI] Production Chromium acceptance: pause/resume works, hard-refresh retains paused session, virtual tab `visibilitychange` pauses, and a skip-through of all five exercises saves five results as a partial (not falsely completed) session; offline refresh works after SW activation. Replay and full-duration audio transitions remain open for deeper checks.
  - [x] **GM-032.02** [AI] Chromium verified exercise index=0 and step=0 preserved on pause, browser reload, and simulated `document.hidden` visibility interruption. Live 30-second hold pause/resume now validated under 60× accelerated Chromium clock; physical real-time remains unverified.
  - [x] **GM-032.03** [AI] Verified production partial-session history remained `status=partial` with five results after page reload and after closing the tab and opening a new tab in the same browser context; UI also reported partial/stopped history. A wholly new browser profile does not share localStorage by design.
  - [ ] **GM-032.04** [YOU, optional] Confirm one physical-phone background-audio/lock-screen behaviour that emulation cannot reproduce.
- [ ] **033** [P1] Ensure any missing or new instructions are explicitly identified rather than silently replaced by another voice
  - [x] **GM-033.01** [AI] Current complete four-programme phase catalogue checked: 160 rep/hold phases, seven untimed cues, 167/167 covered by either exact manifest text (161) or approved track (six). No current mapped-phase gaps found; newly added instructions are guarded by a failing regression assertion.
  - [x] **GM-033.02** [AI] Real production Chromium/Playwright failure injection: intercepted all `audio/elevenlabs/*.mp3` and served HTTP 404; Start Auto Mode paused at step 0, displayed exactly `Recording unavailable. Follow the written cue. Retry with Resume, or choose Phone voice in Settings.`, and called device `speechSynthesis.speak` zero times.
  - [x] **GM-033.03** [AI] Tests fail when newly introduced clinical phase cues are unmapped; recorded-only source fallback assertion prohibits device TTS in missing-clip branch and runtime uses local assets. Actual outbound domain capture remains task 044.
- [ ] **040** [P2] Audit voice consistency, pronunciation, volume, pauses and audio quality across all characters
  - [x] **GM-040.01** [AI] Ran FFmpeg `volumedetect` and duration decode across all 148 approved production-source MP3 files in the independent Sydney sandbox on 2026-10-24: 148/148 decoded, mean-volume range −25.0 to −14.2 dB, highest maximum peak −0.3 dB, no failed decodes. Leading/trailing silence requires follow-up `silencedetect` analysis.
  - [ ] **GM-040.02** [AI] Flag speaker changes, clipped audio, pronunciation errors and long pauses for listening review.
  - [ ] **GM-040.03** [AI] Apply non-destructive free gain/trim normalisation only with before/after hashes and source preserved.
  - [ ] **GM-040.04** [AI] Test representative character clips in the actual app/game playback mix.
- [ ] **041** [P2] Check integrity, captions, wrong-file matches and broken URLs for each recording
  - [x] **GM-041.01** [AI] Published [148-row source/URL/voice/caption/trigger matrix](audit/gentle-recording-matrix-2026-10-24.csv), enumerating 128 manifest-labeled dynamic files and 20 approved clinician VO tracks. Dynamic caption/voice populated; 20 curated VO captions and speaker metadata explicitly remain pending. Per-file real SHA-256 available in the prior 148-row validated report.
  - [ ] **GM-041.02** [AI] Validate all manifest references and content type/length, and audit caption versus text metadata.
  - [ ] **GM-041.03** [AI] Test fail-fast behaviour for swapped voice files, 404, CORS and corrupt ZIP; store report.
  - [ ] **GM-041.04** [AI] Do not close until all required clips in the specified scope pass.
- [ ] **042** [P2] Verify no overlapping audio, autoplay problems, stuck players or missing stop controls
  - [ ] **GM-042.01** [AI] Enumerate distinct media engines per app and document precedence, pause and stop rules.
  - [ ] **GM-042.02** [AI] Add a repeat-tap/switch/close stress test that detects overlapping voices or hanging player state.
  - [x] **GM-042.03** [AI] Production Chromium media prototype spy: zero playback calls on initial load; clicking Start Auto Mode triggered VO021; Pause stopped VO021 before starting VO036; Resume stopped VO036 before starting VO022; second Pause stopped VO022 before VO036. Session remained paused on step zero, with no observed overlapping active media in this interaction.
  - [ ] **GM-042.04** [AI] Confirm screen-reader announcements remain clear when an audio error occurs.
- [ ] **043** [P2] Check loading performance and avoid unnecessarily downloading hundreds of recordings on mobile data
  - [ ] **GM-043.01** [AI] Record startup/network bytes and lazy-load timing on a throttled simulated mobile connection.
  - [ ] **GM-043.02** [AI] Ensure packs download on explicit interaction, cache selectively and respect audio settings.
  - [x] **GM-043.03** [AI] Live Chromium mobile-viewport (390×844) clean initial load: only 18 total requests, 17 performance resources, and **zero MP3 requests** before a user action. No page errors or horizontal overflow (scrollWidth=viewport=390); storage-pressure/eviction remains separately open.
  - [ ] **GM-043.04** [AI] Add performance budgets and compare measurements after optimisation.
- [ ] **044** [P2] Test fallback and retry behaviour without unexpected ElevenLabs API calls or costs
  - [ ] **GM-044.01** [AI] Simulate offline, rate limits, 404, timeout, CORS denial and decode failure for every playback API. **Done subsets:** 404 and intercepted `internetdisconnected` MP3 request failures in production Chromium both paused Auto Mode and showed explicit recording-unavailable text. Rate limits, decode failures, true device offline caching and every playback API still pending.
  - [ ] **GM-044.02** [AI] Assert graceful retry/disabled control with accurate voice source label.
  - [ ] **GM-044.03** [AI] Log outbound request domains and prove no unplanned ElevenLabs/paid API calls.
  - [ ] **GM-044.04** [AI] Preserve working offline alternatives only where approved, with no disguised device TTS.
- [ ] **045** [P2] Check accessibility, keyboard controls, reduced-motion preferences and screen-reader labels
  - [x] **GM-045.01** [AI] Automated axe-core WCAG2 AA / WCAG2.1 AA tests in Chromium on Today/Settings/Progress: initial color-contrast failures; fixed `--muted` light-theme colour #64756d→#52635b (commit `cc104b7ccd93c184a05bfe6b9d745133778681ad`); reran local updated-build axe scans: zero reported WCAG AA violations across these three screens. Deeper session screen reader and focus audits remain open.
  - [ ] **GM-045.02** [AI] Test keyboard-only controls and switch to reduced-motion mode where relevant.
  - [ ] **GM-045.03** [AI] Inspect mobile hit targets and long translated/recorded captions for overflow.
  - [ ] **GM-045.04** [AI] Retest screen-reader relevant semantics after fixes.
- [ ] **046** [P2] Run project builds, automated tests, real-browser journeys and production smoke tests
  - [ ] **GM-046.01** [AI] Record per-app build, unit, integration, browser and deployed smoke commands in a single evidence matrix.
  - [ ] **GM-046.02** [AI] Run lowest-cost tests first, then real browser journeys (Chrome mobile/desktop) without generating speech.
  - [ ] **GM-046.03** [AI] Gate deployment on the relevant tests; attach SHA, exit logs, network/audio proof and URL.
  - [ ] **GM-046.04** [AI] Distinguish an independent test from GitHub Actions execution and never claim CI green when runner was blocked.
- [ ] **047** [P2] Confirm save/load, offline support and core gameplay remain unchanged where audio was added
  - [ ] **GM-047.01** [AI] Snapshot test saves/progress before audio features and verify backwards-compatible restores.
  - [ ] **GM-047.02** [AI] Test offline startup and cached/missing audio without breaking gameplay, exercise tracking or school-safe app features.
  - [ ] **GM-047.03** [AI] Check changing voice settings does not change game data, achievements or scores.
  - [ ] **GM-047.04** [AI] Perform a production upgrade/reload regression on each affected app.
- [ ] **048** [P2] Publish a central audit showing clip ID, voice, source, destination, gameplay trigger, review status and test outcome
  - [ ] **GM-048.01** [AI] Consolidate all accessible audio manifests into one versioned inventory with ID, source, speaker, text, hash, game, trigger and deployed URL.
  - [ ] **GM-048.02** [AI] Link QA evidence (CI/build/browser/devices), confidence level, review status and unresolved blockers per clip.
  - [ ] **GM-048.03** [AI] Publish a machine-readable CSV/JSON and human audit in VoiceBank with source references.
  - [ ] **GM-048.04** [AI] Reconcile all 48 task checkboxes from actual proof; leave missing/private/inaccessible items explicitly OPEN.

<!-- NO_COST_SUBTASKS_V1 -->

**Ownership:** `[AI]` = connected-tool implementation and testing; `[YOU]` = only essential account/device work. No paid services. See the master task checklist for global policy and evidence.

## Independent execution evidence — 24 October 2026

- Vercel Sydney sandbox `sbx_Qi8xuQYmJtp3v92RHy7p2T43kore`, temporary `node24` checkout of GitHub `main` at `e5624802efc7c0459cebc66223c415bdc7574178`.
- `node --test`: **42 passed, zero failed**, including 167/167 mapped current Auto Mode cues.
- `fetch` of the production URL for all **148 MP3 recordings**, byte-for-byte compared against the checked-out GitHub files: **148 passed, zero missing or mismatched**. Filename hashes are prompt IDs, not necessarily the MP3 file SHA-256; this test compared actual binaries.
- Playwright with Chromium 141 on Amazon Linux 2023: loaded https://gentle-movement.vercel.app, pressed **Start Auto Mode**, observed request for `/audio/elevenlabs/VO021.mp3`, HTTP 206, browser `playing` event, `readyState=4` and media `currentTime` progressing beyond 3 seconds without a media error.
- Latest relevant production deployment was Vercel `READY` for commit `e5624802efc7c0459cebc66223c415bdc7574178`, deployment ID `dpl_Ae8itK8yj3Cvaxijc6L54BGiDnSK`.
- **Not yet evidenced:** full rep-to-rep/browser session journey, physical phone output, offline and pause/resume, missing-asset browser interruption, all programme transitions, CI-run status; leave remaining parent tasks open.

## Production acceptance continuation — 24 October 2026

- Tested Vercel browser sandbox `sbx_YLqJB8aNWkwQVNALUzEE7awaUqA4` against `https://gentle-movement.vercel.app` in actual Chromium / Playwright.
- Pause → resume maintained index=0, step=0 without unexpected advancement. Paused session also persisted across full page reload.
- Clicking Skip on each of the five programme exercises traversed indexes 0,1,2,3,4 and produced exactly one saved partial history record with five results. No JavaScript page errors occurred. This is **not** proof that all 167 timed steps play automatically to completion.
- Emulated a hidden document by dispatching `visibilitychange`: Auto Mode switched to paused=true, preserving index and step at zero. Physical background operation / lock screen remains unverified.
- Found and fixed offline PWA initial-start failure. Previous service worker waited for 148 MP3s before activating, which prevented offline refresh during installation. Commit [114094bf](https://github.com/Parris-Tech-Services/GentleMovement/commit/114094bf06eccbb3c12570c9cd0da8029dd0e332) activates after precaching the smaller app shell and caches subsequent successful requests opportunistically. On new production deployment, `navigator.serviceWorker.controller` became active, `caches.keys()` contained `gentle-movement-v15-shell-first`, and offline browser reload succeeded with paused index zero retained. Offline **audio** for all clips is not guaranteed: partial HTTP 206 audio responses and eviction must be separately addressed.
- Re-ran `node --test` after the service worker update: 42 pass, zero fail.
- Outstanding: full-duration unskipped Auto Mode and all transitions; mobile hardware/lock screen; offline audio coverage, mobile network throttling, fresh-profile persisted history, error injection, keyboard/a11y audits and other numbered tasks. Do not mark task 032 complete from emulation alone.

- Additional Playwright production history check: saved partial five-result session, reloaded page, closed tab, reopened a new tab with the same browser context: all three reads returned `[{status:'partial',length:5}]` and the history UI displayed partial/stopped. No cross-device sync claim.

## Clinical cue regression check — 24 October 2026

- Commit `9de98f29aa7ea2474381ca75344ca1997b1f4135` introduced `tests/clinical-audio-acceptance.test.mjs`.
- Fresh checkout, `node --test`: 45 tests passed, none failed. Validated 160 prescribed phase steps, 14 hold steps and four archived/current programmes; source durations and sides unchanged. This is **unit/source simulation**, not a full-duration browser run.

- Recorded-only missing-audio browser test (production Chromium): MP3 requests forcibly returned 404. Observed `session.paused=true`, `step=0`, user-visible explicit recording-unavailable notice, and `window.speechSynthesis.speak` spy recorded `[]`. Result PASS. This confirms no silent fallback to generic phone speech in this tested missing-file path.

- Production media interaction stress sample: Start → Pause → Resume → Pause; intercepted HTMLMediaElement play/pause methods. No autoplay before user gesture, each prior MP3 was stopped before the next began, final `paused=true`, `step=0`. This is a four-control representative test, not exhaustive overlap/concurrency proof.
- Offline service-worker observations require more investigation: two unplayed VO files fetched successfully while Chromium context marked offline. Browser-level cache/network source attribution not yet independently proven, so do not treat this as full offline audio approval.

- Independent audio decode/loudness scan: used packaged FFmpeg to decode all 148 approved locally checked-out MP3s with `-af volumedetect -f null -`. 148/148 succeeded, mean level range −25.0 to −14.2 dB, highest sample peak −0.3 dB, no observed digital samples above 0 dB. These are sample-based volume measurements, not LUFS/loudness-normalized nor a subjective pronunciation/speaker audit; preserve originals.

- Published [gentle-recording-matrix-2026-10-24.csv](audit/gentle-recording-matrix-2026-10-24.csv) with all 148 production file identifiers, repo paths, URL references, approval/trigger/verification status and manifest captions where defined. VO021–VO040 descriptive captions and definitive voice IDs are not available from the cited manifest and are intentionally blank/pending rather than invented. The matrix now includes the actual verified MP3 SHA-256 and byte length for every one of its 148 rows, reconciled from the original independent per-file validation report.

- Continuation regression: added changed repetition count test; corrected an initial test-only malformed regex caught by actual Node run; final `node --test` 46 passing, zero failing at commit `07a80e6f4761f949bac72e78fc54182cffe5b94a`. This does not certify unskipped long-duration playback.

## Unskipped five-exercise timeline browser test — 24 October 2026

- Created independent Vercel Sydney sandbox `sbx_7IQjzpheNkUQ4dk1HtNjkjsaA2IP`; Chromium via Playwright opened actual production `https://gentle-movement.vercel.app/`.
- Used `page.addInitScript` to set `settings.voice=false` and accelerate the client clock approximately 100× and the 500ms tick interval to 5ms. Clicked the actual **Start Auto Mode** button; **never** clicked Skip. Observed all exercise indices `[0,1,2,3,4]`, an automatically saved session with `status=complete` and five results, and zero `pageerror` events. This proves timeline progression under a mocked clock, **not** real-time audio playback or movement confirmation. Do not use this result to close end-to-end audible playback or physical device items.

- Mobile emulation initial-load network sample: viewport 390×844, 2× device pixel ratio, touch enabled; fresh production homepage had 18 HTTP requests, zero MP3 requests, zero JavaScript page errors, zero unnamed empty buttons, and document scrollWidth equal to 390px viewport width. This is an unthrottled cold-page smoke check, not a full WCAG audit or real mobile-data performance budget.

- Accelerated 30-second hold browser interruption: Chromium actually reached second exercise, first 30-second hold (`index=1`, `step=0`, `autoStage=moving`). After pressing Pause, remaining virtual 26,100ms was persisted as `autoLeft`, `autoUntil=null`. Waited a real second (60 seconds virtual), verified unchanged remaining 26,100ms while paused. Resuming preserved index/step and reset `autoUntil` to new current virtual time plus remaining time. Passed. Mocked clock, so not a real-time physical device hold test.

## Instrumented full audio transition sequence — 24 October 2026

- Independent Chromium/Playwright opened the live production site and clicked Start Auto Mode. Clock accelerated 150×; 500ms timer tick shortened to 4ms, media `play()` instrumented to dispatch synthetic `ended` after 1ms (no actual audio decoding in this particular test). The complete **unskipped** five-exercise sequence advanced to `session=null` and saved `status=complete` with five exercise results.
- Observed **69 media-play triggers, 45 distinct MP3 URLs**, zero `speechSynthesis.speak` calls, zero page errors. **PASS for audio-trigger sequencing and complete simulated flow**. This is not evidence for playback duration, audibility, speaker/pronunciation fidelity or physical movement.
- Preserve task 030/031/032 real-time narrated-playthrough requirements as OPEN until full-duration real audio session is evidenced.

- Accessibility test: @axe-core/playwright on production previously flagged serious text contrast (5 nodes Today, 1 Settings, 3 Progress). Edited light theme `--muted` to #52635b; local HTTP-served checkout of the new commit rechecked all three screens with WCAG2 AA and WCAG2.1 AA tags: `violations=[]` for each. This validates automated scanner scope, not full manual/physical accessibility or production-alias deployment.

- Session screen accessibility: after CSS contrast change, local Chromium 390×844 viewport opened a real Auto Mode session and paused it; axe-core WCAG2 AA/2.1 AA yielded zero violations, with one `incomplete: color-contrast` requiring human verification. Do not equate automated scan with full WCAG signoff.
- Disconnected-audio branch: production Chromium with Service Workers blocked and MP3 requests aborted using `internetdisconnected` produced `session.paused=true`, `step=0`, and the explicit `Recording unavailable` notice. Device/network offline MP3 availability is not established by this test.

## Continuation: 25 October 2026 — actual-MP3 wall-clock acceptance

- Task 030 still **OPEN**. Added [real-time-hold.e2e.mjs](real-time-hold.e2e.mjs) at commit [76796a7](https://github.com/Parris-Tech-Services/GentleMovement/commit/76796a7ce36823315686b171b1edc7388638dac2): Chromium test uses actual decoded ElevenLabs MP3s, no virtual clock, no playback-rate acceleration, tests an actual 30-second prescribed hold, pause/remainder-preserving resume, confirms no native speech synthesis, and records wall-clock evidence. It is a *representative timed hold*, not the entire five-exercise full real-time narrated sequence.
- Fixed the full-session local HTTP server's Windows path check at [248d57f](https://github.com/Parris-Tech-Services/GentleMovement/commit/248d57f60cd59e3fb03a1029e142bb9ccb129a6c). The existing `recorded-session.e2e.mjs` test uses real media with accelerated playback and virtual exercise-clock waits; still distinct from a true full-duration real-time check.
- Added and enabled [recorded-session-acceptance.yml](.github/workflows/recorded-session-acceptance.yml), triggering on relevant changes and manually. Initial Windows runner run [#40126871251](https://github.com/Parris-Tech-Services/GentleMovement/actions/runs/40126871251) queued while the personal runner was occupied. Switched to `ubuntu-latest` because this repository is **public** and standard GitHub-hosted actions are free for public repositories, committed [9b42308](https://github.com/Parris-Tech-Services/GentleMovement/commit/9b423080e5110a8dd3f0ecdded02e0b3f64a451e).
- At latest check [#40127260233](https://github.com/Parris-Tech-Services/GentleMovement/actions/runs/40127260233) is **pending** with no completion conclusion. **Do not claim timing/audio success** from a committed test alone. The 20/55 previously checked subtask baseline is unchanged; none newly marked complete until actual run results.
