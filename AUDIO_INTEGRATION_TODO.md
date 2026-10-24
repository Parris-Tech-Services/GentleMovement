# ElevenLabs integration — numbered outstanding tasks

**Status:** OPEN / NOT YET VERIFIED. **Last inventoried:** 2026-10-24. This document is a task tracker, not evidence that the changes or playtests are done.

**Global tracker:** https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/AUDIO_INTEGRATION_MASTER_TODO.md

**Rules:** Global numbers are stable (001–048); check a task off only after recording the passing tests and real production verification. Reuse existing ElevenLabs assets rather than regenerating paid speech. Manual workflows are preferred to save GitHub Actions usage. Do not play audio automatically or mislabel generic TTS as a recording.

## Tasks relevant to this repository (14)

- [ ] **029** [P1] Independently confirm the documented 148-recording voice pack is completely accessible in production
- [ ] **030** [P1] Recheck every current physiotherapy exercise instruction, left/right cue, repetition count and hold timer
- [ ] **031** [P1] Verify Auto Mode produces no accidental generic TTS when ElevenLabs is selected
- [ ] **032** [P1] Test pausing, resuming, repeat instructions, background interruptions, offline sessions and saved history on a real phone
- [ ] **033** [P1] Ensure any missing or new instructions are explicitly identified rather than silently replaced by another voice
- [ ] **040** [P2] Audit voice consistency, pronunciation, volume, pauses and audio quality across all characters
- [ ] **041** [P2] Check integrity, captions, wrong-file matches and broken URLs for each recording
- [ ] **042** [P2] Verify no overlapping audio, autoplay problems, stuck players or missing stop controls
- [ ] **043** [P2] Check loading performance and avoid unnecessarily downloading hundreds of recordings on mobile data
- [ ] **044** [P2] Test fallback and retry behaviour without unexpected ElevenLabs API calls or costs
- [ ] **045** [P2] Check accessibility, keyboard controls, reduced-motion preferences and screen-reader labels
- [ ] **046** [P2] Run project builds, automated tests, real-browser journeys and production smoke tests
- [ ] **047** [P2] Confirm save/load, offline support and core gameplay remain unchanged where audio was added
- [ ] **048** [P2] Publish a central audit showing clip ID, voice, source, destination, gameplay trigger, review status and test outcome
