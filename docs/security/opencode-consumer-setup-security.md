# Security review — opencode-consumer-setup

Traceability: `opencode-consumer-setup`  
Review date: 2026-11-17  
Scope: read-only source review of `scripts/setup-opencode.js`, consumer setup documentation, the related architecture/requirements artifacts, and `test/setup-opencode.test.js`. The pre-existing `SOW.md` worktree state is excluded as requested.

## Security boundary and approach

The explicit consumer-run CLI accepts the consumer's current working directory as its root and updates only that root's `opencode.json`. The relevant protected resource is the consumer's configuration; the boundary of concern is accidental or malicious modification of another file, a file outside the consumer root, or an unintended change to the package's install-time behavior.

The review was static. No target code, tests, OpenCode session, package install, or external endpoint was run by this reviewer. The security-audit skill's required OS sandbox controls were not available to establish before execution.

## Checks and evidence

| Check | Result |
|---|---|
| Static/security-focused source review | Reviewed `scripts/setup-opencode.js:13–139`. It uses Node built-ins only; validates the consumer-root direct dependency and installed package identity (`:52–67`); uses `lstat` for config-path selection and rejects JSONC conflicts, symlinks, and non-regular `opencode.json` (`:17–23`, `:69–91`); validates merge containers before writing (`:83–103`); creates an exclusive UUID-named temp file and publishes by rename or non-overwriting hard link (`:105–127`); and reports errors to stderr with nonzero exit status (`:135–139`). No network, child-process, dynamic-code, or credential-handling path was found in the CLI. |
| Path/discovery convention | The emitted paths are the exact package-relative rule file and skill directory used by the package's own `opencode.json` (`opencode.json:6–18`). This establishes source-level consistency, not live OpenCode loading. |
| Legacy lifecycle and dependency boundary | Git status shows `scripts/postinstall.js`, `package.json`, and `package-lock.json` are unchanged. The new CLI imports no dependencies beyond Node built-ins. |
| SAST | No automated SAST tool was run or available in this read-only review. Manual source review found no actionable source-level security defect. |
| Dependency/advisory scan | No dependency or lockfile change was found. No CVE/advisory scan was run; therefore this report makes no claim that the existing dependency tree is vulnerability-free. |
| Secrets scan | A local targeted `rg` scan for common private-key, GitHub-token, Slack-token, AWS-key, and credential-assignment patterns across the reviewed setup files and docs returned no matches. This is not a substitute for Gitleaks, TruffleHog, or a full repository scan. |
| Prompt Sanity | Not applicable: this change does not add, install, or forward untrusted prompt text and does not change the prompt rule or skill source. |
| Authentication/authorization | Not applicable: the CLI changes local configuration and does not implement identity, session, authorization, or PII handling. |
| Independent security review | A separate security-review agent also reported no source-grounded vulnerability in the reviewed changes. It did not execute the implementation. |

## Findings

**No confirmed security vulnerabilities found in the reviewed source.** No severity is assigned.

The implementation's atomic publication and pre-write validation are appropriate for the approved explicit, local setup flow. `docs/stories/opencode-consumer-setup-assumptions.md:12–13` explicitly limits guarantees for concurrent edits: the CLI detects common changes but does not provide cross-process locking. This is a documented operating assumption, not a confirmed vulnerability in the approved scope. A consumer must not concurrently edit the config during setup.

## Validation limits and gate status

### Post-review validation addendum

The developer subsequently ran Node syntax checks on the CLI and test file,
the targeted suite (16/16), and the complete suite (37/37). The QA report now
records the initial independent failure and the developer's passing rerun
separately. An npm pack dry-run confirms all four required packaged sources
are included. These commands do not constitute a dedicated automated SAST scan
or live OpenCode verification. No Semgrep, Gitleaks, or TruffleHog executable
was available in the session; no new scanning dependency was installed.

`npm audit --json` returned nonzero with **two moderate package entries for one
existing advisory**, [GHSA-chp3-j5qr-2vfr](https://github.com/advisories/GHSA-chp3-j5qr-2vfr):
cookie attribute injection in Effect's `@effect/platform makeCookie()`.
The reported chain is `@opencode-ai/plugin` -> `effect` (affected range
`>=4.0.0-beta.0 <4.0.0-beta.103`). Neither dependency nor its use was changed
by this setup implementation, which uses only Node built-ins. Consumer
exploitability was not established. Treat this as a **medium-severity baseline
dependency finding**, not two distinct new CLI vulnerabilities. Remediation:
assess a compatible patched upstream dependency in a separate dependency
change; do not apply npm's proposed major-version downgrade blindly.

The historical observations below describe evidence available at review time;
the addendum supersedes their missing-audit and stale-QA-report statements.

- The tests exercise consumer-root and symlink fixtures, but this review did not run them. The parent reports the latest targeted and full-suite results as 16/16 and 37/37 passing; this is reported evidence, not independently reproduced here.
- At review time, `docs/stories/opencode-consumer-setup-tests.md:26–42` still contained the earlier 15-pass/1-fail result and the now-obsolete dual-config diagnostic finding. The current CLI contains a distinct both-config error (`scripts/setup-opencode.js:71–78`), and the test asserts that diagnostic (`test/setup-opencode.test.js:232–255`). The QA report must be synchronized to the latest run before it is treated as authoritative.
- No real OpenCode session, actual package-manager installation, or published-package consumer was exercised. The approved boundary is configuration guidance only; it is not an enforced prompt filter or runtime security guarantee (`README.md:78–80`).
- No automated SAST, advisory, or full secret-scanner evidence was available.

**Security Gate: NOT PASSED / BLOCKED.** Source review found no new CLI
vulnerability, but dedicated automated SAST/full secret-scanner evidence is
missing and the baseline dependency advisory remains unresolved. The dependency
scan is now evidenced; it did not pass cleanly.
