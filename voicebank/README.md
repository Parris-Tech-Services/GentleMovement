# Vendored Parris VoiceBank 0.1.0

Source: Parris-Tech-Services/ParrisVoiceBank, commit 55733374d6a54344f886dba04eceab167874eefa.

This adapter uses only the 30 existing dynamic prompts, with the original Naomy voice ID. It requires an exact raw script match. Original VO021–VO040 playback, the original dynamic MP3s and manifest, phone voice selection, spoken guidance toggle, speed, safety messages and Auto Mode timing remain controlled by the original app.

No remote VoiceBank host or ElevenLabs API is used. If the shared manifest or shared playback fails, the original app fallback handles the complete prompt. `?voicebank=off` disables the new matching path for rollback/testing. Service-worker cache v13 includes all required vendored modules. Revert the app import/branch, vendor files, new manifest and cache version to fully roll back.

Code licence: MIT, copyright 2026 Parris Tech Services. Audio rights remain separate and are not changed by this migration.
