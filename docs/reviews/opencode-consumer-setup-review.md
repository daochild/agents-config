# Code review — opencode-consumer-setup

Traceability: `opencode-consumer-setup`  
Review date: 2026-11-17  
Scope: current setup implementation and related consumer documentation, tests, and preparation artifacts. The pre-existing `SOW.md` worktree state is excluded as requested.

## Technical review

The reviewed implementation is a focused, explicit consumer-root setup CLI. It matches the approved KISS architecture and adds no lifecycle integration or runtime enforcement.

| Area | Assessment |
|---|---|
| Correctness and scope | The CLI checks the direct dependency in the invoking root's `package.json`, validates the installed package's real path (including a symlinked package location), and writes only the two exact registrations to the invoking root's `opencode.json` (`scripts/setup-opencode.js:52–67`, `:93–103`). |
| Config preservation | Existing JSON fields and skill settings are retained; only missing exact entries are appended. Repeated setup returns without rewriting when both entries are present (`:93–103`). |
| Error behavior | JSONC-only and dual-config states, malformed JSON, incompatible fields, and unsafe config targets fail with explanatory errors; the top-level handler emits an error and sets a nonzero exit code (`:69–91`, `:135–139`). |
| File safety | A random UUID temp path is opened exclusively. Existing config is checked again before an atomic rename; creation uses a hard link that will not overwrite a concurrently created target. Cleanup runs in `finally` (`:105–127`). This is not a cross-process lock, consistent with the documented concurrency assumption. |
| Package and lifecycle boundaries | The CLI uses Node built-ins only. `scripts/postinstall.js`, `package.json`, and `package-lock.json` are unchanged. |
| Documentation | README accurately documents strict JSON, manual JSONC handling, direct dependency, restart, the packaged checker command, and the explicit non-runtime-enforcement boundary (`README.md:30–88`). |
| Tests | The test source covers merge/idempotence, invalid configs, JSONC conflicts, symlink/directory rejection, cwd boundaries, package identity, checker invocation, and legacy postinstall (`test/setup-opencode.test.js:74–374`). The user/parent reports the latest targeted 16/16 and full 37/37 tests passing; this reviewer did not execute code. |

## Findings and follow-up

No source-level correctness or maintainability blocker was identified.

**Review note — QA artifact synchronization (documentation/evidence):** The QA report content read during this review still recorded an earlier 15-pass/1-fail run and an obsolete dual-config diagnostic finding (`docs/stories/opencode-consumer-setup-tests.md:26–42`). The current script now emits a distinct ambiguity message (`scripts/setup-opencode.js:71–78`) and the test expects it (`test/setup-opencode.test.js:232–255`). QA should update the report to the latest results and close or replace the earlier finding. The parent reports that QA is updating it.

OpenCode's actual loading of these paths and published-package installation behavior were not exercised. This remains a compatibility-validation item; it does not change the approved boundary that setup registers guidance and does not enforce runtime filtering.

## Verdict

Post-review reconciliation: the developer updated the QA artifact to distinguish
the initial independent QA failure from the developer's post-fix 16/16 targeted
and 37/37 complete-suite runs. The obsolete diagnostic is recorded as resolved.
The security report now includes a developer-run npm audit finding in the
unchanged dependency tree. No further independent execution or release approval
is implied by this addendum.

**BLOCK — gate completion pending.** The technical source review found no code
change blocker. Security Gate scan evidence is incomplete, the baseline
dependency advisory is unresolved, and human engineering review is not recorded.

Human engineering review notes: **pending**; none were supplied for aggregation.
