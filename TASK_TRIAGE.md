# TASK_TRIAGE — GentleMovement ElevenLabs audio

**Current next unclaimed item: GM-031.01 (queue 01).** This is the authoritative agent pick-up pointer for GentleMovement audio tasks as of 2026-10-25. [Central 55-task registry](https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/docs/GENTLE_MOVEMENT_AUDIO_TASK_INDEX.md) · [Numbered local checklist](AUDIO_INTEGRATION_TODO.md) · [Checkpoint](WORK_CHECKPOINT.md).

**Progress:** 20 / 55 specific subtasks complete; 35 open. Parent objective 029 complete; 13 parent objectives open. Every subtask's checklist ID is formatted `GM-<existing global parent>.<sequence>` so the 14 existing parent numbers are preserved. All 35 remaining subtasks have a separate, explicit queue rank in the central registry. Do not confuse this game's scoped IDs with shared VoiceBank `040.1` etc or overwrite existing `UN-` IDs.

## Next work, exact priority order

| Queue | ID | Action and completion evidence |
|---:|---|---|
| 01 | **GM-031.01** | Trace app.js say(), VoiceBank adapter, premium manifest, approved-track paths and each error/timeout fallback; add tests confirming only intended engine is used. |
| 02 | **GM-031.03** | Inject missing/slow/decode failures and repeated exercises, prove fail-safe pause and no accidental device TTS. |
| 03 | **GM-030.02** | Run normal-speed, actual MP3-decoding full five-exercise session; verify real hold/rep/left/right transitions against clinical matrix. Synthetic audio endings do NOT pass. |
| 04 | **GM-044.03** | Capture outbound network hosts; prove no unexpected ElevenLabs billable synthesis API use. |
| 05 | **GM-042.01** | Document every media engine and who owns pause/stop/replacement. |
| 06 | **GM-042.02** | Stress-test double-taps, rapid pause/resume, switch and close with overlapping-playback assertions. |
| 07 | **GM-044.01** | Simulate offline, rate limits, 404, timeout, CORS denial and decode failure for every playback API. **Done subsets:** 404 and intercepted `internetdisconnected` MP3 request failures in production Chromium both paused Auto Mode and showed explicit recording-unavailable text. Rate limits, decode failures, true device offline caching and every playback API still pending. |
| 08 | **GM-044.02** | Assert graceful retry/disabled control with accurate voice source label. |
| 09 | **GM-044.04** | Preserve working offline alternatives only where approved, with no disguised device TTS. |
| 10 | **GM-047.02** | Test offline startup and cached/missing audio without breaking gameplay, exercise tracking or school-safe app features. |
| 11 | **GM-043.02** | Ensure packs download on explicit interaction, cache selectively and respect audio settings. |
| 12 | **GM-041.02** | Validate all manifest references and content type/length, and audit caption versus text metadata. |

**Queue 13–35:** use the complete central [35-task work queue](https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/docs/GENTLE_MOVEMENT_AUDIO_TASK_INDEX.md). The physical phone background/lock-screen acceptance `GM-032.04` is a human/device check, not a reason to halt AI-only tasks.

## Agent execution contract

- Start at **GM-031.01**, unless the checkpoint shows a verified result or active claim. Continue by ascending **queue rank**; do not choose a parent just because its numeric ID comes first.
- For every action, update [AUDIO_INTEGRATION_TODO.md](AUDIO_INTEGRATION_TODO.md) only after observing the applicable acceptance proof; include exact test command/output, SHA, observed production alias, and any limitations. Then update central VoiceBank registry and [WORK_CHECKPOINT.md](WORK_CHECKPOINT.md).
- Do not renumber existing global IDs or remove completed evidence. Parent completion requires all acceptance criteria, including real audio where applicable, not merely all local checkboxes.
- When Vercel is quota-limited, do source and local/test-sandbox work and record production as blocked. No paid regeneration or unrequested billing changes.

## Existing validated baseline

46 Node tests previously passed; 167 exact/current Auto Mode cues mapped to existing recordings; 148 production MP3s verified byte-for-byte; accelerated unskipped five-exercise sequence finished with 69 synthetic media trigger events. **The simulated session does not establish normal-speed audible end-to-end playback.** Contrast changes passed local axe scans, but that fix was not verified deployed to the production alias.
