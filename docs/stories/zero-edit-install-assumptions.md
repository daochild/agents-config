# AI assumptions log — zero-edit-install

> SDLC Implementation Gate artifact. Owner: `sdlc-dev`.
> Traceability id (slug): `zero-edit-install`.
> Per the `sdlc-regulatory` skill Implementation Gate ("AI assumptions are documented") and the SM's risk cap
> (S02/S03 High risk, autonomy ≤40%), every assumption the dev made during implementation is logged here. The reviewer
> and auditor validate these at the Code Review and DoD gates.

## S02 — `scripts/postinstall.js`

| # | Assumption | Why made | What would invalidate it |
|---|------------|----------|--------------------------|
| A1 | The consumer's install `cwd` is their project root (where `AGENTS.md` and `package.json` live). | npm/yarn/pnpm/bun set `cwd` to the consumer project root for lifecycle scripts, per the architecture artifact's cross-manager table. | A package manager that runs `postinstall` with a different `cwd` (e.g. the package's own dir). QA must verify per-manager `cwd` (S07). |
| A2 | `process.env.npm_*` env vars are NOT used as the authoritative direct-dependency check. | Per the architecture artifact: env var availability differs across managers/versions; `<cwd>/package.json` is authoritative. | None — this follows the locked architecture decision. |
| A3 | `peerDependencies` and `optionalDependencies` do NOT count as "direct". | Locked by PRD EC-17 (maintainer-approved). | A future maintainer decision to flip EC-17; would require PRD revision + ADR update. |
| A4 | The pointer line uses the em dash `—` (U+2014), byte-identical to `POINTER_LINE` in the script. | Locked by PRD AC-4 + maintainer decision #1. | None. |
| A5 | "Present anywhere in the file" counts as present (no-op), including inside code blocks / quotes. | Locked by PRD EC-5 (conservative default) + architecture artifact match rule. | A future decision to only match top-level instruction lines; would require ADR update. |
| A6 | A line with different whitespace but the same canonical content is NOT rewritten. | Locked by PRD EC-4 + architecture artifact ("leave the user's formatting alone"). | None. |
| A7 | The match is exact byte equality per line (not normalized, not substring). | Architecture artifact match rule. | None. |
| A8 | The temp filename uses `process.pid` (`.agents-config-postinstall.tmp-<pid>`). | Per the architecture artifact EC-15 note: `process.pid` is allowed for the temp filename (not content, not time-based). | A stricter reading of AC-9 that forbids `process.pid`; the architecture artifact flagged this as an implementation choice. If rejected, switch to a fixed `.agents-config-postinstall.tmp.md` filename. |
| A9 | The temp file is created with mode `0o600` (owner read/write only) and in the same directory as `AGENTS.md` (so the rename is atomic on the same filesystem). | Per architecture artifact atomic-write rule (same dir + rename). `0o600` limits the temp file's visibility during the brief write window. | A consumer filesystem that does not support atomic rename across the same dir (extremely rare on POSIX/NTFS/APFS). QA should test rename atomicity (S07). |
| A10 | The notice text for "no AGENTS.md, no --init" mentions both the `--init` flag command and the manual one-line edit. | Per AC-5: notice must tell the user how to proceed (manual edit or `--init`). Exact wording is the dev's choice; reviewer validates it is accurate and not misleading. | Reviewer rejects the wording as ambiguous or incorrect. |
| A11 | The notice text for the symlink case is a single debug-level line. | Per EC-8: print a debug note, exit 0. Wording is the dev's choice. | Reviewer rejects the wording. |
| A12 | The notice text for "not a direct dependency" is a single line identifying the package.json path checked. | Per EC-14/EC-16: at most a debug-level note to stdout. Wording is the dev's choice. | Reviewer rejects the wording. |
| A13 | The script does NOT create `AGENTS.md` when `--init` is passed AND the file already exists — it falls through to the normal idempotent insert logic. | Per the run instruction: "`--init` when `AGENTS.md` already exists: treat `--init` as a no-op for file creation; still apply the normal idempotent insert logic. Do not overwrite." | None — follows the binding instruction. |
| A14 | The script uses `fs.lstatSync` (not `statSync`) to detect symlinks without following them. | Per EC-8: skip symlinks, do not follow. `lstat` does not follow; `stat` would. | None. |
| A15 | The `--init` minimal `AGENTS.md` content is `# <cwd-basename>\n\n<POINTER_LINE>\n` (title, blank, pointer, trailing newline). | Per architecture artifact `--init` template. `<cwd-basename>` from `path.basename(process.cwd())`. | None. |
| A16 | The script reads `AGENTS.md` with `utf8` encoding. | Markdown is text; `utf8` is the safe default. | A consumer `AGENTS.md` with a different encoding (rare; Markdown is UTF-8 by convention). QA may add an encoding edge test (S07). |
| A17 | No code comments are present in the script. | Per the run instruction (repo convention: "DO NOT ADD ANY COMMENTS unless asked"). The architecture artifact is the documentation; the code is the source of truth for behavior. | None. |
| A18 | The script is CommonJS (`require`/`module.exports`-style, but no exports needed — it's a top-level script). | Per architecture artifact: `"type": "commonjs"`. | None. |
| A19 | The script always calls `process.exit(0)` at the end, in addition to the try/catch around `main()`. | Per AC-7: every path exits 0. The explicit `process.exit(0)` is a belt-and-suspenders guarantee that no accidental non-zero exit leaks. | None. |
| A20 | The whole `main()` is wrapped in a try/catch at the call site that prints the error as a notice and falls through to `process.exit(0)`. | Per AC-7: unexpected exception → notice, exit 0. | None. |

## S03 — `package.json` `postinstall` field

| # | Assumption | Why made | What would invalidate it |
|---|------------|----------|--------------------------|
| A21 | The `postinstall` script is invoked as `node scripts/postinstall.js` (explicit `node`). | Per architecture artifact: explicit `node` so the script runs under the same Node as the install. | None. |
| A22 | `package.json` `main` is left as `"index.js"` (unchanged). | Per AC-D5 + architecture artifact: BL-1 full resolution is out of scope; postinstall is not the main entry. | None. |
| A23 | No new dependency is added to `package.json`. | Per ADR 0002 contract + AC-9: Node built-ins only. | None. |
| A24 | `type` stays `"commonjs"`. | Per architecture artifact. | None. |
| A25 | The existing `test` script placeholder is left unchanged. | Out of scope; tests are S07 (Testing Gate, owned by QA). | None. |

## S04 — `README.md` update

| # | Assumption | Why made | What would invalidate it |
|---|------------|----------|--------------------------|
| A26 | The README "Installation" section is restructured into "Automatic path", "Manual path (supported fallback)", and "After either path" subsections. | Per AC-10: document both paths; manual = supported fallback. | Reviewer rejects the structure. |
| A27 | The README mentions the monorepo limitation (cwd-only check) under the automatic path. | Per architecture artifact EC-10/EC-18 deferral + AC-10. | None. |
| A28 | The README mentions the direct-dependency-only behavior (transitive untouched). | Per AC-11/EC-14 — consumers should know. | None. |
| A29 | The README describes `--init` as the explicit opt-in for consumers without an `AGENTS.md`. | Per US-5/AC-6 + run instruction. | None. |
| A30 | The README does NOT promise the script creates files silently. | Per AC-5/US-4: no silent file creation. | None. |

## S06 — `docs/IMPLEMENTATION.md` update

| # | Assumption | Why made | What would invalidate it |
|---|------------|----------|--------------------------|
| A31 | BL-1 status moves from "Stub" to "Partially resolved (postinstall only)" with a note that a full plugin host hook remains separate and `main` reconciliation is still open. | Per AC-D5 + architecture artifact. | None. |
| A32 | A new "Postinstall pointer script" row is added to the "Implemented components" table with status "Done". | Reflects what shipped (S02+S03). | None. |
| A33 | A change log entry for 2026-08-18 records the implementation (S02+S03+S04+S06) per ADR 0002. | Per AC-D5 + run instruction. | None. |
| A34 | The change log entry notes `SECURITY.md` update is deferred to the Security Gate (S05) and tests to the Testing Gate (S07). | Traceability: makes the deferred stories visible. | None. |

## Out-of-scope adherence (did NOT touch)

- `SECURITY.md` — owned by `sdlc-security` (S05, Security Gate). Not touched.
- `tests/` — owned by `sdlc-qa` (S07, Testing Gate). Not touched.
- `ARCHITECTURE.md` — architect-owned, already done in the prior run. Not re-edited.
- `docs/BUSINESS_LOGIC.md` — architect-owned, already done. Not re-edited.
- `docs/adr/0002-zero-edit-install.md` — architect-owned. Not re-edited.
- `package.json` `main` field — left as `"index.js"` (AC-D5).
- `package.json` `dependencies` — no new dependency added (AC-9 / ADR 0002).
- Triple-mirror components (`.opencode/`, `.claude/`, `.agents/`) — the postinstall is not a mirrored component type per `AGENTS.md` "Adding a new component"; not mirrored.

## Open questions for the reviewer / QA / security (not blocks, surfaced for downstream)

- Q1 (QA): verify `cwd` is the consumer project root for npm, yarn classic, yarn berry, pnpm, bun (A1).
- Q2 (QA): verify atomic rename works on the target platforms (A9).
- Q3 (QA): consider an encoding edge test for non-UTF-8 `AGENTS.md` (A16).
- Q4 (Security): the script writes a temp file in the consumer's `cwd` (`.agents-config-postinstall.tmp-<pid>`). Confirm this is acceptable (it is cleaned up in `finally`). If a consumer's `cwd` is read-only, the openSync will throw → caught → notice → exit 0 (AC-7).
- Q5 (Reviewer): validate the notice wordings (A10, A11, A12) are accurate and not misleading.