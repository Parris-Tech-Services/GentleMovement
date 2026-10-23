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
