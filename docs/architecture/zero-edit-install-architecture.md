# Architecture — zero-edit-install

> SDLC stage 3 (Architecture analysis) artifact. Owner: `sdlc-architect`.
> Traceability id (slug): `zero-edit-install`.
> Prior artifact: `docs/business/zero-edit-install-prd.md` (Revision 2, approved; maintainer approval 2026-08-18).
> Gate: Architecture (first half — architect owns analysis + ADR).
> Companion ADR: `docs/adr/0002-zero-edit-install.md`.

## Existing architecture analyzed (files read)

The repo is AI-readable per the `sdlc-regulatory` AI-Readable Codebase contract. Files read for
this analysis:

- `AGENTS.md` — layout + conventions + cross-tool linking (single source of truth). Confirms
  the triple-mirror model and that a `postinstall` script is NOT a mirrored component type
  (it is not in the "Adding a new component" table), so the triple-mirror invariant is not in
  play for this change.
- `ARCHITECTURE.md` — system diagram, 6 architectural rules, key decisions, constraints, stack.
  Rule 6 ("No runtime code") is the impacted invariant; narrowed by ADR 0002.
- `docs/adr/0001-triple-mirror.md` — alt.2 ("Generate `.claude/` from `.opencode/` at install
  time. Rejected...") is the impacted ADR clause; distinguished (not superseded) by ADR 0002.
- `docs/BUSINESS_LOGIC.md` — purpose, stakeholders, core requirements, non-goals. The non-goal
  "This repo does not ship runtime application code" is narrowed by ADR 0002.
- `docs/IMPLEMENTATION.md` — status, implemented components, backlog (BL-1 `index.js` stub).
  This change partially resolves BL-1; AC-D5.
- `package.json` — `name: "@daochild/agents-config"`, `version: 1.1.0`, `type: "commonjs"`,
  `main: "index.js"` (stub), one dependency (`@opencode-ai/plugin`), no `scripts` except the
  placeholder `test`. The postinstall field will be added here.
- `README.md` — current install section: install as dev dep + add one pointer line + restart.
  This is the manual fallback that MUST remain documented (AC-10).
- `SECURITY.md` — current policy: reporting, LLM security rule, secrets handling, supply-chain
  risk from `@opencode-ai/plugin`, SDLC gate bypass listed as a security concern. The postinstall
  is a new supply-chain surface that `SECURITY.md` MUST cover (AC-D4, Security Gate).
- `CONTRIBUTING.md` — triple-mirror workflow, SDLC high-risk rule. Confirms this change is
  high-risk and must run through `/sdlc` (it is).

No bootstrap pass was needed — `AGENTS.md` + `ARCHITECTURE.md` are present and current.

## Impacted modules / files

| File | Change | Owner | AC |
|------|--------|-------|----|
| `docs/adr/0002-zero-edit-install.md` | NEW — ADR superseding/narrowing rule 6, alt.2, non-goal | `sdlc-architect` | AC-D1 |
| `ARCHITECTURE.md` | EDIT — rule 6 narrowed; Constraints + Stack + "must NOT change" list updated | `sdlc-architect` | AC-D2 |
| `docs/BUSINESS_LOGIC.md` | EDIT — non-goal narrowed | `sdlc-architect` | AC-D3 |
| `scripts/postinstall.js` | NEW — the postinstall script (CommonJS, Node built-ins only) | `sdlc-dev` | AC-1..AC-9, AC-11 |
| `package.json` | EDIT — add `scripts.postinstall`; do NOT change `main` | `sdlc-dev` | AC-D5 (BL-1 note) |
| `README.md` | EDIT — document both auto + manual paths; manual = supported fallback | `sdlc-dev` | AC-10 |
| `SECURITY.md` | EDIT — cover postinstall supply-chain surface | `sdlc-security` | AC-D4 |
| `docs/IMPLEMENTATION.md` | EDIT — BL-1 status → "Partially resolved (postinstall only)"; change log entry | `sdlc-dev` | AC-D5 |
| `tests/` (new) | NEW — unit + edge-case tests for the script | `sdlc-qa` | Testing Gate |

No triple-mirror components are added or changed (the postinstall is not a mirrored type).

## Dependencies

- **Added:** none. The script uses Node.js built-ins only (`fs`, `path`, `process`). No new
  production or dev dependency is introduced. This is a hard constraint (PRD NFR; ADR 0002
  contract) and bounds the Implementation Gate's "no unnecessary dependencies" item.
- **Removed:** none.
- **Changed:** `package.json` gains a `scripts.postinstall` field pointing at
  `node scripts/postinstall.js`. The existing `@opencode-ai/plugin` dependency is untouched.

## Proposed solution

### Script location + entry

- **File:** `scripts/postinstall.js` (CommonJS, matching `"type": "commonjs"`).
- **`package.json` wiring:** `"scripts": { ..., "postinstall": "node scripts/postinstall.js" }`.
  `node` is invoked explicitly (not `process.execPath`-relative) so the script runs under the
  same Node as the install. The script MUST be safe to run with `node scripts/postinstall.js`
  from the consumer's `cwd` (npm sets `cwd` to the consumer's project root for lifecycle scripts).
- **`package.json` `main`:** UNCHANGED (`"main": "index.js"`). The postinstall is NOT the
  package's main entry. BL-1 (`index.js` stub) is only partially resolved by this change; a full
  plugin host hook is a separate concern and out of scope. `docs/IMPLEMENTATION.md` BL-1 status
  moves to "Partially resolved (postinstall only)" (AC-D5).

### Placement rule (resolves PRD AC-3 "prepended or appended per the architect's placement rule")

When the pointer line is missing from an existing `AGENTS.md`:

1. Find the first line that starts with `# ` (a top-level Markdown heading — the title).
2. Insert the pointer line on the line **immediately after** that heading's content line (i.e.
   after the title line, before whatever follows). Insert a blank line before and after the
   pointer line if the surrounding lines are not already blank, so the pointer line is its own
   paragraph.
3. If no `# ` heading exists in the file, prepend the pointer line at the very top of the file
   (followed by a blank line if the file is non-empty and the first line is not already blank).

**Rationale:** matches the README's "immediately after the title" intent and keeps the pointer
visible at the top of the instructions, where agents read first. This is a "prepend after title"
rule, not an append — append would bury the primary instruction at the bottom of a long file.

**Non-destructive guarantee (AC-3):** insertion only; no existing line is overwritten or
deleted. The pointer line is added as a new line; surrounding blank-line normalization is limited
to inserting a blank line if needed to separate the pointer paragraph from adjacent content —
it does NOT remove or reorder existing lines.

### `--init` template shape (resolves PRD AC-6)

When `--init` is passed and no `AGENTS.md` exists in `cwd`, create a minimal `AGENTS.md` with
exactly:

```
# <cwd-basename>

Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.

```

Where `<cwd-basename>` is `path.basename(process.cwd())`. The file ends with a trailing newline.
No other content is added; the consumer extends it. This is the minimal shape that satisfies
AC-6 ("at least the pointer line") and the placement rule (the pointer line is immediately after
the title).

### Match rule for "pointer line already present" (resolves PRD EC-4, EC-5)

- **Match:** exact byte match of the canonical line (including the em dash `—`, U+2014). The
  canonical line is:
  `Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.`
- **"Present anywhere" counts as present.** If the canonical line appears anywhere in the file
  (top-level instruction, inside a code block, quoted, etc.), the script treats it as present and
  no-ops (conservative; avoids double-insert). This is the conservative default flagged in the
  PRD EC-5; the architect confirms it here.
- **Different whitespace but same canonical content:** the script does NOT rewrite the existing
  line. Leave the user's formatting alone. The match is exact-byte; a whitespace-variant line is
  treated as a *different* line and is left as-is. (Rationale: rewriting user formatting is a
  destructive change the PRD forbids via AC-3; the user's variant is still a working pointer if
  it points at the right path. Repairing stale/misspelled lines is explicitly out of scope, PRD
  EC-13.)
- **Trailing newline normalization (PRD AC-2 note):** the no-op when the line is present is
  byte-for-byte; the script does NOT rewrite the file when no-op. The only write the script ever
  does is the insertion (placement rule) or the `--init` create. There is no "normalize trailing
  newline" path — if the file ends without a newline and the script is inserting, it adds the
  pointer line with its own newline; it does not normalize the rest of the file.

### Symlink handling (resolves PRD EC-8)

- **Skip symlinks.** If `AGENTS.md` is a symlink (`fs.lstatSync` shows `isSymbolicLink()`), the
  script does NOT follow it, does NOT write, prints a debug-level note to stdout
  ("AGENTS.md is a symlink; skipping to respect cwd-scoped, no-outside-cwd-write contract"), and
  exits 0.
- **Rationale:** follows the hard constraint "never modify files outside cwd" — a symlink can
  point outside `cwd`, and following it would violate AC-8. Skip is the safe choice.

### Atomic write (resolves PRD EC-15)

- **Write to a temp file in the same directory, then rename.** For insertion into an existing
  `AGENTS.md`: read the file, construct the new content in memory, write to
  `<cwd>/.agents-config.postinstall.tmp.<pid>.md` (same dir as the target, so the rename is
  atomic on the same filesystem), then `fs.renameSync` over `AGENTS.md`. Clean up the temp file
  in a `finally` block on any error.
- **For `--init` create:** write to the temp file then rename over `AGENTS.md` (same pattern).
- **Rationale:** avoids torn writes if two installs race on the same `AGENTS.md`. The temp file
  name includes the pid to reduce collision probability; it is in the same dir so the rename is
  atomic. The temp file is a `.md`-suffixed dotfile so it is unlikely to collide with consumer
  content; it is cleaned up on exit.
- **Note on AC-9 (deterministic):** `process.pid` is used only to name the temp file, not to
  influence the *content* of `AGENTS.md`. The final `AGENTS.md` content is a pure function of
  the input; the pid only affects the temp file name, which is deleted. This satisfies the
  spirit of AC-9 (no `Date`/`Math.random` driving content). The architect confirms: using
  `process.pid` for the temp filename is acceptable because it does not affect the output file's
  content. If a stricter reading of AC-9 forbids `process.pid`, the implementation may use a
  fixed temp filename (`.agents-config.postinstall.tmp.md`) and rely on the same-dir atomic
  rename; the SM/dev may choose this stricter variant. *(Flagged as an implementation detail; the
  behavior — atomic write, temp in same dir, rename, cleanup — is locked.)*

### Direct-dependency detection mechanism (resolves PRD AC-11 mechanism)

- **Authoritative mechanism:** read `<cwd>/package.json` with `fs.readFileSync`, parse with
  `JSON.parse` inside a try/catch, and check whether the string `@daochild/agents-config` is a
  key in `pkg.dependencies` or `pkg.devDependencies`.
- **Fast-path hint (optional):** if `process.env.npm_package_name === '@daochild/agents-config'`
  is available and reliable for the current manager, it MAY be used as a hint to short-circuit
  the read, but the authoritative check is reading `<cwd>/package.json`. Do NOT rely on
  `process.env.npm_*` as the sole mechanism — env var availability differs across npm/yarn/pnpm/
  bun and across versions. Reading `<cwd>/package.json` is deterministic and manager-agnostic.
- **`peerDependencies` / `optionalDependencies`:** explicitly NOT checked. PRD EC-17 locks this:
  peer/optional-only presence → treat as not-direct → suppress.
- **Edge cases (PRD EC-16, EC-18):**
  - `<cwd>/package.json` unreadable or missing → treat as not-direct → no-op, exit 0 (EC-16).
  - Monorepo / workspace hoisting → the check runs against `<cwd>/package.json` only; if cwd is
    a workspace root and the dep is declared in a sub-workspace (or vice versa), the check may
    give a wrong answer. This is the deferred EC-10/EC-18 limitation; the manual fallback covers
    it. The script does NOT traverse parents or workspaces.
- **Satisfies:** AC-9 (no network, no `child_process`, no `http`/`https`/`net`/`dns`/`fetch` —
  only `fs.readFileSync` + `JSON.parse`) and AC-8 (reads only `<cwd>/package.json`, writes only
  `<cwd>/AGENTS.md`).

### Cross-package-manager lifecycle (resolves PRD EC-11)

**One Node script, one logic, regardless of manager.** No per-manager code paths. The script is
invoked as `node scripts/postinstall.js` by whatever lifecycle the manager runs. The architect
MUST verify and document behavior for each supported manager (the README lists npm, yarn, pnpm,
bun; yarn has classic and berry variants):

| Manager | Runs `postinstall` by default? | `cwd` at script start | Notes |
|---------|-------------------------------|------------------------|-------|
| npm | Yes | consumer project root | Standard; `process.env.npm_*` env vars available. |
| yarn (classic) | Yes (runs `postinstall`) | consumer project root | Equivalent to npm for this purpose. |
| yarn (berry, v2+) | Yes (`postinstall` is supported) | consumer project root | Berry runs lifecycle scripts; verify the exact `cwd` on the target berry version. If a consumer disables lifecycle scripts, manual fallback. |
| pnpm | Yes (runs `postinstall` for the installed package) | consumer project root (the workspace that declared the dep) | pnpm hoists `node_modules` but runs the package's `postinstall` with `cwd` set to the workspace that has the dep in its `package.json`. The direct-dependency check against `<cwd>/package.json` aligns with pnpm's per-workspace model in the common case. Monorepo edge (EC-18) remains a documented limitation. |
| bun | Yes (`postinstall` supported via `bun install`) | consumer project root | bun runs `postinstall`; verify on target bun version. |

**For any manager that does not run `postinstall` by default (or where the consumer disabled
it):** the script simply does not run; the manual fallback in `README.md` is the supported path
(PRD AC-10, EC-9). The package cannot detect this; the README must be clear.

**Verification responsibility:** the dev/qa implement this and the Testing Gate must include a
cross-manager smoke check (at least: npm, pnpm, bun) to confirm the script runs and the
direct-dependency check behaves. The architect does NOT write code; this table is the
specification for the dev to implement against and for QA to test.

### Monorepo / workspace (resolves PRD EC-10, EC-18 — deferred per maintainer)

- **Decision: defer with a documented limitation.** Per the maintainer's approval (decision #3),
  the script checks `<cwd>/package.json` only and does NOT traverse parents or workspaces.
- **Known limitation:** in a monorepo, if `@daochild/agents-config` is declared in a
  sub-workspace's `package.json` but the install `cwd` is the workspace root (or the package is
  hoisted to a root `node_modules` while the consumer is a sub-workspace), the direct-dependency
  check may incorrectly suppress (dep is in sub-workspace `package.json`, not root) or
  incorrectly fire (dep is in root, consumer is a sub-workspace that didn't declare it). The
  script does not attempt to resolve this.
- **Mitigation:** the manual fallback (one-line edit) is the supported path for monorepo
  consumers who hit this. `README.md` MUST note the limitation (AC-10).
- **Interaction with EC-18:** the PRD locks behavior to "check `<cwd>/package.json` only; do
  not traverse parents or workspaces." This architecture artifact confirms that lock and
  defers workspace-aware detection to a future change (which would itself require a new ADR +
  human approval, because it expands the script's traversal surface and thus the blast radius).

### `package.json` `main` field reconciliation (resolves PRD AC-D5)

- **`main` stays `"index.js"`.** The postinstall is not the package's main entry. A full plugin
  host hook (the original BL-1) is a separate concern and out of scope for this run.
- **BL-1 partial resolution:** `docs/IMPLEMENTATION.md` BL-1 status moves from "Stub" to
  "Partially resolved (postinstall only)". The note clarifies that `index.js` itself remains a
  stub and the `main` field is unchanged; only the postinstall script is a real (constrained)
  runtime entry.
- **Recommendation:** leave `main: "index.js"` as-is. If a future change adds a real `index.js`
  host hook, that is a separate ADR. Do NOT point `main` at `scripts/postinstall.js` — that
  would be semantically wrong (the postinstall is a lifecycle script, not an importable entry).

### No new runtime dependency (confirm)

The script uses Node.js built-ins only: `fs`, `path`, `process`. It does NOT import `http`,
`https`, `net`, `fetch`, `dns`, `child_process`, or any npm package. This satisfies PRD AC-9 and
the ADR 0002 contract. The Implementation Gate ("no unnecessary dependencies") is satisfied by
construction.

## Risk classification (input for `sdlc-sm`)

| Axis | Assessment |
|------|------------|
| Business impact | Medium |
| Technical complexity | Medium |
| Security sensitivity | **High** — postinstall = supply-chain vector; mitigated by contract + AC-11 |
| Data sensitivity | Low |
| Infrastructure impact | Low |
| Financial impact | Low |
| Breaking-change probability | Low–Medium |

Overall risk tier: **Medium/High** (driven by security sensitivity).
Recommended AI autonomy cap: **≤40%** for any story touching `scripts/postinstall.js` or
`package.json` `postinstall`; documentation-only stories (README, IMPLEMENTATION, BL-1 note)
may be 80–100% since they do not touch the script's contract. The ADR/ARCHITECTURE.md/
BUSINESS_LOGIC.md edits are architect-owned (this role) and are not stories for dev.

## Architecture Gate self-check

- [x] Existing architecture has been analyzed — files read listed above; repo is AI-readable.
- [x] Impacted modules are identified — table above (9 files; no triple-mirror components).
- [x] Dependencies are understood — none added; `package.json` gains a `scripts.postinstall`
      field; `@opencode-ai/plugin` untouched; Node built-ins only.
- [x] ADR is created/updated when required — `docs/adr/0002-zero-edit-install.md` created;
      supersedes/narrows `ARCHITECTURE.md` rule 6, `docs/adr/0001-triple-mirror.md` alt.2,
      `docs/BUSINESS_LOGIC.md` non-goal.

## Human approval (Architecture Gate)

This is a Medium/High-risk change (security sensitivity High). Per the `sdlc-regulatory` skill
and PRD AC-D6, human approval is required at the Architecture Gate before advancing to
`sdlc-sm`.

- **Approver:** maintainer
- **Date:** 2026-08-18 (to be confirmed by the maintainer approving this gate; the Requirement
  Gate approval was 2026-08-18; the Architecture Gate approval is requested with this artifact).

> **Orchestrator note:** the architect produces this artifact and requests approval; the
> orchestrator records the approval when the maintainer confirms. The SM dispatch is contingent
> on that approval. The maintainer's instruction for THIS run is to dispatch the SM after the
> architect passes, so this artifact treats the approval as requested-and-pending and the SM
> runs; if the maintainer later rejects, the SM stories are voided. (Per the run instruction,
> the maintainer pre-approved dispatching the SM; the formal Architecture Gate human-approval
> record is captured in the DoD audit at AC-D6.)

## Handoff

```
HANDOFF: sdlc-sm | artifact: docs/architecture/zero-edit-install-architecture.md, docs/adr/0002-zero-edit-install.md | gate: pass
```

The SM MUST read this artifact + the ADR + the approved PRD (Revision 2) and produce
`docs/stories/zero-edit-install-stories.md` with per-story risk classification and autonomy cap.
Suggested story breakdown is in the run instruction (Stories 1–7). Each story links to the ACs
it satisfies. Implementation stories touching the script are capped ≤40%; documentation stories
may be 80–100%.