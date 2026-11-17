# QA test report — opencode-consumer-setup

Traceability: `opencode-consumer-setup`. Owner: `sdlc-qa`.

## Test approach

The integration tests launch `scripts/setup-opencode.js` as a child Node
process from isolated consumer-root fixtures. Each fixture installs the actual
repository through a package symlink at
`node_modules/@daochild/agents-config`, then checks consumer-visible files and
process results. Fixtures are created under `test/` and removed by the test
cleanup hook; the tests use only Node built-ins and add no dependencies.

## Acceptance coverage

| Area | Evidence |
|---|---|
| Generated config and inherited skill source | Asserts the exact schema and consumer-relative rule/skills paths; checks the linked rule file and `prompt-sanity/SKILL.md` are accessible and identify the skill. |
| Direct dependency and package identity | Checks direct `dependencies` and `devDependencies` succeed; missing package manifest, invalid manifest, peer-only, optional-only, transitive-only, and wrong installed package fail without config creation. |
| Merge and idempotence | Verifies unrelated top-level/nested settings and `skills.urls` are preserved, partial registration adds only the absent entry, and a repeat run preserves both config bytes and nanosecond mtime. |
| Config validation and file safety | Checks JSONC-only and JSON+JSONC refusal, strict-JSON parsing (malformed, array, null, comments, trailing comma), invalid `instructions`/`skills`/`skills.paths`, and symlink/dangling symlink/directory rejection. Rejection cases verify existing bytes or outside targets remain unchanged and no setup temporary file remains. |
| Invocation boundaries | Checks help and unsupported arguments; a nested invocation ignores parent package/config metadata and `INIT_CWD`. |
| Consumer checker path | Runs the packaged prompt checker through the package symlink with no consumer-hoisted `@daochild/prompt-sanity` and confirms the fixture package has no npm script added. |
| Legacy lifecycle behavior | Runs the existing `postinstall.js` in a valid consumer fixture and verifies it exits zero without creating OpenCode config or an `AGENTS.md` when absent. |

## Validation evidence

- Initial independent QA: targeted **15 passed, 1 failed**; full suite
  **36 passed, 1 failed**. The dual-config diagnostic finding below was returned
  to the developer.
- After remediation, the developer reran
  `node --test test/setup-opencode.test.js` — **16 passed, 0 failed, 0 skipped**.
- After remediation, the developer reran `npm test` —
  **37 passed, 0 failed, 0 skipped**.
- `node --check scripts/setup-opencode.js`,
  `node --check test/setup-opencode.test.js`, and `git diff --check` passed.
- `npm pack --dry-run --json` includes the setup script, packaged checker, rule,
  and Prompt Sanity skill. This checks package inclusion, not a published install.
- The packaged checker dependency was installed in the repository during this
  run, so its conditional symlinked-consumer test executed rather than skipped.
- No dependencies were installed or changed.

## Resolved finding

- **Low — AC-5 both-config diagnostic:** the CLI safely refuses a consumer
  containing both `opencode.json` and `opencode.jsonc`, and leaves both files
  unchanged. Initial QA found that the diagnostic did not distinguish this
  conflict from JSONC-only configuration. The developer added a distinct
  both-configs/manual-resolution message; the regression now passes. Independent
  source review examined the corrected branch. No independent post-fix test
  rerun is claimed.

## Limits

- These tests prove config-file and package-path behavior only. They do **not**
  launch OpenCode or claim live skill discovery in an OpenCode session.
- The test confirms the required rule and skill sources are available through
  the package symlink. It does not remove or alter repository sources to force
  the missing-source error branch.
- Cross-process races and concurrent config editing are not exercised.
- No coverage instrumentation is configured; code coverage percentage is
  therefore unmeasured.

```text
HANDOFF: sdlc-security | artifact: test/setup-opencode.test.js | evidence: developer post-fix run passes; independent source review completed
```
