# Project Completion Gate

This folder is a durable, version-controlled definition of done. A deployment, green build, or merged PR **does not** close an objective.

## Workflow
1. Add a new objective and measurable acceptance criteria in `objectives.json` before implementing changes.
2. Keep `status: "open"` until every criterion has `verified: true` **and** concrete evidence references (test run URLs, production URLs, commit IDs, logs or playtest recordings).
3. Run `node scripts/completion-gate.mjs` to generate `completion/report.md`; unresolved work stays visible.
4. Run `node scripts/completion-gate.mjs --strict` before declaring completion. It exits nonzero for incomplete objectives.
5. GitHub Actions runs this report automatically on relevant pushes and PRs. Label a PR `ready-for-completion` to enforce the strict gate.
6. The agent must resume all open criteria in future sessions. Do not invent evidence or mark tests verified without actually executing them.

**Limitations:** GitHub Actions cannot itself prove a human-perceived audio quality or a complete phone playtest. Evidence must come from real tests; an unchecked checklist cannot prevent an agent from stopping. Configure branch protection requiring the strict check if your workflow requires merge blocking. This is a portable template for other repositories, not a guarantee of autonomous background execution.

## Gentle Movement
`GM-AUDIO-001` remains open until existing Drive recordings are reconciled, all exercise cues covered, automated tests pass, production assets verified, and a full mobile session playtested.
