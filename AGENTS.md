# Working instructions

## Durable checkpoints — required for project work
At the start of a task, read WORK_CHECKPOINT.md and inspect the current repository/branch and existing task trackers before editing. Resume the first unfinished task; do not rely on chat history or screenshots as proof of completion.

Create/update WORK_CHECKPOINT.md at the start, after each meaningful milestone, before switching projects, before ending a turn, and roughly every 10–15 minutes during long work. This is an active-session target, not a background timer. Save small complete batches rather than deferring all persistence until the end.

Record:
- Full objective and a stable numbered checklist; preserve existing task IDs.
- Branch, completed work and pushed commit IDs. The checkpoint commit itself can be identified through its Git history; do not invent a self-referential SHA.
- Exact tests run, results and evidence paths; distinguish prior reports from checks performed this session.
- Deployment URL, deployed revision if known, and precisely what was verified live.
- Unfinished changes (including paths), blockers and failed approaches.
- Exact next action, including command/path when known.

Commit and push completed work with the checkpoint. Preserve unrelated changes; never commit credentials or private user data. If incomplete work must be preserved, use a clearly labelled WIP branch and record it. Verify the remote commit/files after pushing. If persistence fails, say explicitly whether work is local-only and what was lost/not saved.

Keep unverified tasks open. Use VERIFIED COMPLETE, PARTIALLY COMPLETE or BLOCKED with a specific scope. Source edits, asset existence, tests and live user-triggered playback are separate evidence levels.

For cross-app audio work, also update the master checklist at https://github.com/Parris-Tech-Services/ParrisVoiceBank/blob/main/WORK_CHECKPOINT.md with links to each app checkpoint. Discover additional projects from the reconciliation records and connected sources; the current list is not an exhaustive inventory. Finish and verify one app at a time.

Do not stop simply because a checkpoint was saved. Continue the authorised task unless finished or genuinely blocked.
