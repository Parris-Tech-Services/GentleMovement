# ElevenLabs integration — numbered outstanding tasks

**Status:** OPEN / NOT YET VERIFIED. **Last inventoried:** 2026-10-24. This document is a task tracker, not evidence that the changes or playtests are done.

**Global tracker:** https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/AUDIO_INTEGRATION_MASTER_TODO.md

**Rules:** Global numbers are stable (001–048); check a task off only after recording the passing tests and real production verification. Reuse existing ElevenLabs assets rather than regenerating paid speech. Manual workflows are preferred to save GitHub Actions usage. Do not play audio automatically or mislabel generic TTS as a recording.

## Tasks relevant to this repository (14)

- [ ] **029** [P1] Independently confirm the documented 148-recording voice pack is completely accessible in production
  - [x] [AI] Enumerated the exact 128 dynamic manifest entries and 20 approved VO021–VO040 tracks; source SHA 987a15b5.
  - [x] [AI] Verified all 148 production MP3s (HTTP success, MIME, bytes, full SHA-256) match local source, with no unindexed local clips; [self-hosted CI run 40056982862](https://github.com/joshualparris/JoshMemory/actions/runs/40056982862).
  - [ ] [AI] Test actual on-device browser speech controls for a representative pack, not just URL availability.
  - [x] [AI] Saved a permanent [148-row per-clip live validation report](audit/elevenlabs-148-live-2026-10-24.json), with SHA-256, lengths, transcript where available and source references. Parent remains open until real UI playback is tested.
- [ ] **030** [P1] Recheck every current physiotherapy exercise instruction, left/right cue, repetition count and hold timer
  - [ ] [AI] Export current exercise scripts, laterality, durations, rep counts, and audio cue mapping.
  - [ ] [AI] Check voice timing at hold/repeat/left/right transitions against the current physio instruction sequence.
  - [ ] [AI] Add deterministic timer simulation tests including pause/resume and changed rep counts.
  - [ ] [AI] Confirm no medical instruction changes are invented to fit an audio clip.
- [ ] **031** [P1] Verify Auto Mode produces no accidental generic TTS when ElevenLabs is selected
  - [ ] [AI] Trace VoiceBank/ElevenLabs selection through Auto Mode and every speech fallback branch.
  - [ ] [AI] Assert selected recorded-only mode never silently speaks via device SpeechSynthesis.
  - [ ] [AI] Emulate missing files, slow downloads, repeated exercises and timer transitions.
  - [ ] [AI] Test real production Auto Mode in Chrome; record exact audible source or an explicit unavailable message.
- [ ] **032** [P1] Test pausing, resuming, repeat instructions, background interruptions, offline sessions and saved history on a real phone
  - [ ] [AI] Test pause/resume, replay/interrupt, background/tab hide, saved session and offline with virtual/real browser.
  - [ ] [AI] Verify session timer and rep counts do not advance incorrectly after interruption.
  - [ ] [AI] Preserve history through hard refresh and browser restarts; log reproducible results.
  - [ ] [YOU, optional] Confirm one physical-phone background-audio/lock-screen behaviour that emulation cannot reproduce.
- [ ] **033** [P1] Ensure any missing or new instructions are explicitly identified rather than silently replaced by another voice
  - [ ] [AI] Diff the current script against the 148-clip inventory and identify missing instructions clearly.
  - [ ] [AI] Show explicit 'recording unavailable' for missing selected ElevenLabs speech; never mislabel generic TTS.
  - [ ] [AI] Add tests for new/unmapped instructions and no unexpected billable synthesis requests.
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
