# Gentle Movement

Standalone, mobile-first physiotherapy companion for Android and desktop.

**App:** https://gentle-movement.vercel.app

## What it includes
- Four dated physiotherapist programmes (March, June and October 2026)
- 20 exercise records, with historical plans kept separate from the current plan
- Historical physio advice and educational notes
- Spoken instructions, repetition counters and hold timers
- Personal session progress, CSV export and JSON backup stored in your browser
- Offline support after the first online load, and an installable home-screen shortcut
- Import of further dated programme archives in JSON format

## Local development
Run `python3 -m http.server 8080`, then open http://localhost:8080.
Run `npm test` or `node --test domain.test.mjs` to check exercise dosing and import rules.

## Deployment
This repository deploys automatically to Vercel from `main` as a **static site**, without a build step. It was migrated from `joshualparris/HealthLens/gentle-motion`.

Exercise instructions are dated; only the current clinician-approved routine should be treated as active. Unspecified doses are never inferred. Uploaded PDFs and session progress remain stored locally on the device.

## Clinician progress report
Open **Progress → Clinician report**. Filter by 7, 30, 90 days or all history and by programme. The report shows self-reported session counts, before/after ratings using matched pairs, review prompts for skipped/difficult/high-discomfort movements and your recorded exercise notes. Choose **Print or save as PDF** on Android to make a shareable document; the app does not automatically transmit your medical data. Historical exercise plans are not medical advice to start them again.

## Directional movement guides (22 October 2026 programme)
The latest five prescribed exercises now have **schematic**, explicitly **non-clinical** SVG movement-direction cues. In a session, switch between the starting reference and movement direction; for rotation compare left/right. Written directions and recorded doses remain unchanged. These are not videos, measured movement targets, or verified replacements for John Robins' demonstration. Other archived exercises intentionally show a text-only warning when technique cannot be accurately drawn from the original email.

## Auto Mode (hands-free guided session)
Choose **Start Auto Mode** on Today. The app speaks each movement, paces each untimed repetition with an adjustable-in-code five-second interval, counts the exact clinician-prescribed hold seconds, advances through the routine and saves the guided session automatically. Pausing, skipping, stopping and switching back to manual remain possible. An exercise with no prescribed dose receives an **optional 15-second app practice window**, clearly labelled as not prescribed. The app does not detect actual movement; auto-guided results are labelled as unverified. Keep Android Chrome open and visible for timing; sessions pause when the page becomes hidden or timing is interrupted.

Auto Mode gives the full exercise instruction once, then uses short repetition cues (e.g. “Left side. Repetition three.”). It does not repeat general pacing advice with each repetition; prescribed hold timings remain spoken.

### Coach-style voice cue variation
Auto Mode now uses a small, predictable vocabulary of real trainer-style count cues (e.g. “Left, seven”, “Right side, rep seven”, “Left, number eight”, “Right, count eight”) rather than speaking the same full sentence every time. Counts and sides remain explicit, short milestone encouragement is occasional, and holds keep their original prescribed durations. Cue variations rotate across exercises and days; because this app does not observe movements, the voice never claims your technique is correct.

## Optional prerecorded ElevenLabs MP3 voice pack
In **Settings → Coaching voice**, choose **ElevenLabs · saved MP3 voice pack**. When a phrase has an MP3 in `audio/elevenlabs/manifest.json`, the app plays it with a normal HTML audio element; an unavailable recording pauses Auto Mode instead of changing voices. **No ElevenLabs API is called by the deployed website** and **no API key goes into GitHub source or Vercel**.

One-off generation (developer): `npm run voices:plan` previews the exact unique phrases and character count, without charges. Obtain an ElevenLabs voice ID and store `ELEVENLABS_API_KEY` and `ELEVENLABS_VOICE_ID` in **private environment variables**. After approving the expected credit usage, run `GENERATE_VOICES=YES npm run voices:generate` locally. Optional `ELEVENLABS_LIMIT=25` makes a small initial batch to audition before generating all; reruns skip saved MP3s. Review the voice and licensing, then commit only `audio/elevenlabs/*.mp3` and `audio/elevenlabs/manifest.json`. Never commit your API key or private clinical records.

The MP3s remain playable from GitHub/Vercel even if you subsequently cancel ElevenLabs. Free plan outputs require attribution and cannot be used commercially; paid generation generally retains commercial rights after cancellation, subject to ElevenLabs terms. Publicly served MP3s are downloadable by anyone. Keep clinically identifiable narration out of public audio. Custom or imported wording outside the saved catalogue requires choosing Phone voice explicitly. The service worker installs the entire built-in MP3 pack for offline use; the first installation requires internet.

### Generate all tracks with one GitHub Actions button
Open **Actions → Generate ElevenLabs Voice Pack (Manual Only) → Run workflow**. Leave **Generate** unchecked to see the count without API calls. To generate, create the repository secret **ELEVENLABS_API_KEY** (Settings → Secrets and variables → Actions) and enter the voice ID in the workflow form. Choose **30 clips** for an initial voice-quality audition, then use the current dry-run plan count for a complete batch. This is a deliberately manual workflow; it never runs on ordinary code pushes. An incomplete run commits already generated MP3s so a retry does not buy those tracks twice.

For a one-time voice pack, the default model is now `eleven_multilingual_v2` (rather than latency-optimised Flash); the workflow can select Flash for credit savings. Model selection should remain consistent after the first batch. MP3 output is 44.1 kHz/128 kbps, and the public site uses only checked-in audio files, not the ElevenLabs service. The repo secret is never committed to source.

## Approved Colab audio pack VO021–VO040 (22 October 2026 programme)
The twenty approved recordings are stored at `audio/elevenlabs/VO021.mp3` through `VO040.mp3`, preserving the originals at repository root. Auto Mode uses the welcome, exercise introductions, exact-count cues, hold reminders, pause reassurance, safety warning and completion announcement where their spoken meaning matches. Remaining counts use the exact-text dynamic MP3 catalogue. Unused reassurance recordings remain available without interrupting exercise timing. Phone speech is available only when explicitly chosen in Settings.

## Complete recorded narration (24 October 2026)

The saved Naomy voice pack now contains 128 exact-text coaching cues plus the 20 approved physiotherapy tracks. All 50 MP3s from the original Drive ZIP were compared by SHA-256 and preserved unchanged; 98 missing complete phrases were generated once. `scripts/voice-phrases.mjs` enumerates 121 currently emitted built-in phrases, and CI checks that each resolves to a real MP3. Older unused recordings remain available.

Auto Mode uses a finite set of side/count/hold sentences, so the date cannot introduce an unrecorded wording variant. ElevenLabs mode never silently switches to device speech: an unavailable recording pauses Auto Mode with an explanation. Phone voice remains an explicit Settings choice. Custom/imported wording outside this saved catalogue may require that explicit choice. Repeating instructions preserves the pending timed step instead of stranding the session. Losing visibility still pauses the session. Clinical doses are unchanged.

The service worker installs all 148 MP3 assets with the app shell before reporting offline readiness. `node recorded-session.e2e.mjs` checks complete online and offline-reload sessions with real MP3 decoding, pause/resume, repeated instructions, exact hold totals, saved history and zero native TTS calls. Its media playback and clock waits are accelerated for test duration; it does not fake Audio completion events. A separate failed-audio scenario verifies safe pausing.
