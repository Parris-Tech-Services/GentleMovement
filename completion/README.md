# Project Completion Gate

This is the existing ledger and gate, repaired on 6 November 2026. Green unit tests, a merge, or an agent-edited `verified` flag do not establish completion.

Run `node scripts/completion-gate.mjs` for an honest progress report. Strict completion requires `--strict --baseline=/path/to/preserved-original-objectives.json`. On PRs the workflow obtains the baseline from the base commit, not from the candidate ledger. Removed objective IDs, titles, acceptance IDs or descriptions reject completion. This preserves the recorded baseline; it cannot discover instructions omitted before that baseline was created.

Legacy evidence strings remain in the ledger as historical references. They are no longer accepted as verification. The existing complete audio claim is reopened; original audio subtasks remain untouched and open where unproven.

Evidence references now name a captured JSON file, its SHA-256, exact `check` ID and tested `commit`. Its schemaVersion is 1, kind must equal the acceptance criterion's kind, result must be pass, command and observedAt must be present, and commit must match GITHUB_SHA or local Git HEAD. A hash and pass flag alone never pass:

- `node-test`: command must be `["node","--test","relative.test.mjs"]`. The gate actually reruns it with a timeout and credentials removed; nonzero or zero passing tests reject completion.
- `deployment`: assets must include current app.js, programmes.js, index.html, sw.js and style.css, each with local path, approved live URL and SHA-256. Both current checkout bytes and freshly fetched live bytes must match. Redirects, unsupported origins and unavailable/stale assets fail closed. This proves those assets, not a complete browser journey or remote build provenance.

Remote URLs, invented run numbers, prose, stale commits, mismatched check kinds and edited evidence fail. Tests demonstrate exact historical weaknesses. These checks still do not judge the semantic adequacy of an agent-written test or replace independently reviewed original requirements. Physical phone/audio-perception acceptance cannot be closed by a unit-test receipt.

The repaired Project Completion Gate runs on PRs and relevant main pushes using a standard runner only while the repository is public; timeout three minutes, read-only token, no model calls and no stored artifacts. Strict mode runs on `ready-for-completion` PRs or manual strict dispatch. Automatic API repair remains disabled: it incurs model usage and proposes changes requiring review. GitHub documents standard hosted runners as free for public repositories: https://docs.github.com/en/actions/how-tos/write-workflows/choose-where-workflows-run/choose-the-runner-for-a-job . Private-repository auto-runs stop pending cost review. Branch protection is separate and must be verified before claiming merges cannot bypass the check.

The repair runner invokes the gate even for objectives labelled complete, discards stale reports, persists exact unfinished acceptance in last-run.txt and a deduplicated issue on explicit/scheduled invocation, and exits nonzero when tests pass but acceptance remains open. A proposed repair PR is also partial, not successful completion. Without a preserved baseline it cannot certify the whole objective.
