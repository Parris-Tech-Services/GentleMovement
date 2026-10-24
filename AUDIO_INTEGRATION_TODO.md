# ElevenLabs integration — numbered outstanding tasks

**Status:** OPEN / NOT YET VERIFIED. **Last inventoried:** 2026-10-24. This document is a task tracker, not evidence that the changes or playtests are done.

**Global tracker:** https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/AUDIO_INTEGRATION_MASTER_TODO.md

**Rules:** Global numbers are stable (001–048); check a task off only after recording the passing tests and real production verification. Reuse existing ElevenLabs assets rather than regenerating paid speech. Manual workflows are preferred to save GitHub Actions usage. Do not play audio automatically or mislabel generic TTS as a recording.

## Tasks relevant to this repository (14)

- [x] **029** [P1] Independently confirm the documented 148-recording voice pack is completely accessible in production
  - [x] [AI] Enumerated the exact 128 dynamic manifest entries and 20 approved VO021–VO040 tracks; source SHA 987a15b5.
  - [x] [AI] Verified all 148 production MP3s (HTTP success, MIME, bytes, full SHA-256) match local source, with no unindexed local clips; [self-hosted CI run 40056982862](https://github.com/joshualparris/JoshMemory/actions/runs/40056982862).
  - [x] [AI] Tested production Auto Mode in headless Chromium/Playwright on 2026-10-24: user pressed Start Auto Mode; `audio/elevenlabs/VO021.mp3` returned HTTP 206; HTMLMediaElement `playing` and advancing `timeupdate` (over 3 seconds), `readyState=4`, no audio error. This is genuine Chromium playback verification, not a physical-device loudspeaker listening test.
  - [x] [AI] Saved a permanent [148-row per-clip live validation report](audit/elevenlabs-148-live-2026-10-24.json), with SHA-256, lengths, transcript where available and source references. Production Chromium UI playback now verified; physical phone remains optional under task 032.
- [ ] **030** [P1] Recheck every current physiotherapy exercise instruction, left/right cue, repetition count and hold timer
  - [ ] [AI] Export current exercise scripts, laterality, durations, rep counts, and audio cue mapping.
  - [ ] [AI] Check voice timing at hold/repeat/left/right transitions against the current physio instruction sequence.
  - [x] [AI] Added `tests/clinical-audio-acceptance.test.mjs` and passed `node --test` (45/45) for prescribed rep/hold phase counts, 160 existing phase mappings, pause/resume remaining-time arithmetic and recorded-only fallback; source commit `9de98f29aa7ea2474381ca75344ca1997b1f4135`. Tests of changed rep counts remain a follow-up.
  - [x] [AI] Automated mapping checks assert clinical `phases()` rep/side/hold values exactly match source exercise dose and current recorded cue coverage; no dosages synthesized for ambiguous/untimed exercises (45/45 passing tests).
- [ ] **031** [P1] Verify Auto Mode produces no accidental generic TTS when ElevenLabs is selected
  - [ ] [AI] Trace VoiceBank/ElevenLabs selection through Auto Mode and every speech fallback branch.
  - [x] [AI] Automated `node --test` on real repository checkout: 42/42 passed, including the recorded-only fallback assertion and all 167 current Auto Mode cues (161 exact manifest and six approved mappings); source commit e5624802efc7c0459cebc66223c415bdc7574178.
  - [ ] [AI] Emulate missing files, slow downloads, repeated exercises and timer transitions.
  - [x] [AI] Production Chromium Auto Mode initiated `VO021.mp3` via media element; `playing` and advancing media time observed; physical-speaker/auditory listening not asserted.
- [ ] **032** [P1] Test pausing, resuming, repeat instructions, background interruptions, offline sessions and saved history on a real phone
  - [x] [AI] Production Chromium acceptance: pause/resume works, hard-refresh retains paused session, virtual tab `visibilitychange` pauses, and a skip-through of all five exercises saves five results as a partial (not falsely completed) session; offline refresh works after SW activation. Replay and full-duration audio transitions remain open for deeper checks.
  - [x] [AI] Chromium verified exercise index=0 and step=0 preserved on pause, browser reload, and simulated `document.hidden` visibility interruption. Full hold-duration resume transitions not yet tested.
  - [x] [AI] Verified production partial-session history remained `status=partial` with five results after page reload and after closing the tab and opening a new tab in the same browser context; UI also reported partial/stopped history. A wholly new browser profile does not share localStorage by design.
  - [ ] [YOU, optional] Confirm one physical-phone background-audio/lock-screen behaviour that emulation cannot reproduce.
- [ ] **033** [P1] Ensure any missing or new instructions are explicitly identified rather than silently replaced by another voice
  - [x] [AI] Current complete four-programme phase catalogue checked: 160 rep/hold phases, seven untimed cues, 167/167 covered by either exact manifest text (161) or approved track (six). No current mapped-phase gaps found; newly added instructions are guarded by a failing regression assertion.
  - [x] [AI] Real production Chromium/Playwright failure injection: intercepted all `audio/elevenlabs/*.mp3` and served HTTP 404; Start Auto Mode paused at step 0, displayed exactly `Recording unavailable. Follow the written cue. Retry with Resume, or choose Phone voice in Settings.`, and called device `speechSynthesis.speak` zero times.
  - [x] [AI] Tests fail when newly introduced clinical phase cues are unmapped; recorded-only source fallback assertion prohibits device TTS in missing-clip branch and runtime uses local assets. Actual outbound domain capture remains task 044.
- [ ] **040** [P2] Audit voice consistency, pronunciation, volume, pauses and audio quality across all characters
  - [ ] [AI] Measure loudness, peak, duration and leading/trailing silence for every approved clip using open-source tools.
  - [ ] [AI] Flag speaker changes, clipped audio, pronunciation errors and long pauses for listening review.
  - [ ] [AI] Apply non-destructive free gain/trim normalisation only with before/after hashes and source preserved.
  - [ ] [AI] Test representative character clips in the actual app/game playback mix.
- [ ] **041** [P2] Check integrity, captions, wrong-file matches and broken URLs for each recording
  - [ ] [AI] Generate a canonical ID→speaker→caption→URL→SHA-256 matrix with no duplicates.
  - [ ] [AI] Validate all manifest references and content type/length, and audit caption versus text metadata.
  - [ ] [AI] Test fail-fast behaviour for swapped voice files, 404, CORS and corrupt ZIP; store report.
  - [ ] [AI] Do not close until all required clips in the specified scope pass.
- [ ] **042** [P2] Verify no overlapping audio, autoplay problems, stuck players or missing stop controls
  - [ ] [AI] Enumerate distinct media engines per app and document precedence, pause and stop rules.
  - [ ] [AI] Add a repeat-tap/switch/close stress test that detects overlapping voices or hanging player state.
  - [ ] [AI] Verify no autoplay without user gesture and stop when leaving game/dialogue.
  - [ ] [AI] Confirm screen-reader announcements remain clear when an audio error occurs.
- [ ] **043** [P2] Check loading performance and avoid unnecessarily downloading hundreds of recordings on mobile data
  - [ ] [AI] Record startup/network bytes and lazy-load timing on a throttled simulated mobile connection.
  - [ ] [AI] Ensure packs download on explicit interaction, cache selectively and respect audio settings.
  - [ ] [AI] Verify bundles do not fetch all 300 clips on every page load or exhaust storage.
  - [ ] [AI] Add performance budgets and compare measurements after optimisation.
- [ ] **044** [P2] Test fallback and retry behaviour without unexpected ElevenLabs API calls or costs
  - [ ] [AI] Simulate offline, rate limits, 404, timeout, CORS denial and decode failure for every playback API.
  - [ ] [AI] Assert graceful retry/disabled control with accurate voice source label.
  - [ ] [AI] Log outbound request domains and prove no unplanned ElevenLabs/paid API calls.
  - [ ] [AI] Preserve working offline alternatives only where approved, with no disguised device TTS.
- [ ] **045** [P2] Check accessibility, keyboard controls, reduced-motion preferences and screen-reader labels
  - [ ] [AI] Run automated accessibility assertions for labels, focus, aria-pressed/status and heading structure.
  - [ ] [AI] Test keyboard-only controls and switch to reduced-motion mode where relevant.
  - [ ] [AI] Inspect mobile hit targets and long translated/recorded captions for overflow.
  - [ ] [AI] Retest screen-reader relevant semantics after fixes.
- [ ] **046** [P2] Run project builds, automated tests, real-browser journeys and production smoke tests
  - [ ] [AI] Record per-app build, unit, integration, browser and deployed smoke commands in a single evidence matrix.
  - [ ] [AI] Run lowest-cost tests first, then real browser journeys (Chrome mobile/desktop) without generating speech.
  - [ ] [AI] Gate deployment on the relevant tests; attach SHA, exit logs, network/audio proof and URL.
  - [ ] [AI] Distinguish an independent test from GitHub Actions execution and never claim CI green when runner was blocked.
- [ ] **047** [P2] Confirm save/load, offline support and core gameplay remain unchanged where audio was added
  - [ ] [AI] Snapshot test saves/progress before audio features and verify backwards-compatible restores.
  - [ ] [AI] Test offline startup and cached/missing audio without breaking gameplay, exercise tracking or school-safe app features.
  - [ ] [AI] Check changing voice settings does not change game data, achievements or scores.
  - [ ] [AI] Perform a production upgrade/reload regression on each affected app.
- [ ] **048** [P2] Publish a central audit showing clip ID, voice, source, destination, gameplay trigger, review status and test outcome
  - [ ] [AI] Consolidate all accessible audio manifests into one versioned inventory with ID, source, speaker, text, hash, game, trigger and deployed URL.
  - [ ] [AI] Link QA evidence (CI/build/browser/devices), confidence level, review status and unresolved blockers per clip.
  - [ ] [AI] Publish a machine-readable CSV/JSON and human audit in VoiceBank with source references.
  - [ ] [AI] Reconcile all 48 task checkboxes from actual proof; leave missing/private/inaccessible items explicitly OPEN.

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
