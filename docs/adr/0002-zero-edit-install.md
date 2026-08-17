# ADR 0002 — Permit a constrained postinstall file-pointer helper (zero-edit-install)

- **Status**: accepted
- **Date**: 2026-08-18
- **Deciders**: maintainer
- **Supersedes / narrows**: `ARCHITECTURE.md` rule 6; `docs/adr/0001-triple-mirror.md` alt.2; `docs/BUSINESS_LOGIC.md` non-goal ("This repo does not ship runtime application code").
- **Traceability id (slug)**: `zero-edit-install`.

## Context

`@daochild/agents-config` is a configuration-only npm package. Consumers install it as a dev
dependency and currently must hand-edit their `AGENTS.md` to add one pointer line:

```
Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.
```

This is adoption friction: a step that is forgotten, done inconsistently, or lost on a fresh
clone. The maintainer wants `npm install --save-dev @daochild/agents-config` alone to be
sufficient (the consumer only restarts their agent session).

The natural mechanism is an npm `postinstall` script. But three currently-stated repo
invariants forbid runtime code / install-time steps:

1. `ARCHITECTURE.md` rule 6 — "No runtime code. This repo's 'code' is configuration. The only JS
   is the opencode plugin host (`@opencode-ai/plugin` dependency) and any
   `.opencode/plugin/*.ts|.js` the user adds. There is no `src/`, no build output, no deployable
   service."
2. `docs/adr/0001-triple-mirror.md` alt.2 — "Generate `.claude/` from `.opencode/` at install
   time. Rejected: adds a build step to a config-only repo and couples the tools' release
   cadences."
3. `docs/BUSINESS_LOGIC.md` non-goal — "This repo does not ship runtime application code."

This ADR narrows (does not abolish) those invariants to permit a single, tightly-constrained
install-time helper.

### Maintainer decisions (binding inputs to this ADR, recorded for traceability)

The maintainer reviewed the PRD (`docs/business/zero-edit-install-prd.md`, Revision 2) and
approved it with four open items resolved. These are binding decisions for this ADR and the
downstream implementation; they are not re-litigated here:

1. **Pointer line uses the em dash `—` (U+2014).** PRD AC-4 stands as written — the line is
   byte-identical to
   `Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.`
2. **`--init` flag is kept.** PRD US-5 / AC-6 / EC-2 stand as written — the script supports an
   explicit `--init` flag that creates a minimal `AGENTS.md` when none exists.
3. **Monorepo / workspace (PRD EC-10) — architect MAY defer** with a documented limitation
   covered by the manual fallback. The direct-dependency check is locked to `<cwd>/package.json`
   only; the script does not traverse parents or workspaces (PRD EC-18).
4. **PRD EC-17 — `peerDependencies` and `optionalDependencies` are NOT "direct".** PRD AC-11 and
   EC-17 stand as the PM wrote them: peer/optional-only presence → suppress (no-op, exit 0).

**Human approval recorded for the Requirement Gate**: approver = maintainer, date = 2026-08-18.
(To be recorded in the eventual DoD audit per PRD AC-D6.)

## Decision

Permit **one** constrained install-time helper: a `postinstall` script at
`scripts/postinstall.js` (CommonJS, matching the repo's `"type": "commonjs"`), wired via
`package.json` → `"scripts" → "postinstall": "node scripts/postinstall.js"`.

### The postinstall contract (binding; must NOT change without human approval)

The script is bounded by these contract clauses. Relaxing any of them is a high-risk change
requiring human approval at the Architecture, Security, and Code Review gates (per the
`sdlc-regulatory` skill):

- **Idempotent.** Running install any number of times does not duplicate the pointer line.
- **Safe-append only.** Never overwrites existing `AGENTS.md` content. Inserts the pointer line
  if missing; no-op if present; never deletes existing lines.
- **Always exits 0.** Every code path (happy path, no-op, missing file, `--init`, permission
  error, unexpected exception) exits 0. The script must never break `npm install`. Errors are
  notices to stdout, never thrown as non-zero exits.
- **cwd-scoped.** Reads/writes only within the npm-provided `cwd` (the consumer's project root).
  Does not touch the home directory, global config, parent directories, or sibling projects.
  Does not traverse parents or workspaces.
- **Deterministic.** No network calls, no telemetry, no `Date`/`Math.random`. No imports of
  `http`, `https`, `net`, `fetch`, `dns`, or `child_process`. Output is a pure function of
  (`AGENTS.md` content, flags, `<cwd>/package.json` content).
- **Direct-dependency only (transitive suppression).** Only writes when
  `@daochild/agents-config` is a direct dependency (listed in the consumer's `dependencies` or
  `devDependencies` in `<cwd>/package.json`). Transitive installs no-op. `peerDependencies` and
  `optionalDependencies` do NOT count as direct (PRD EC-17). This is a blast-radius reduction
  control.
- **No silent file creation.** If no `AGENTS.md` exists in `cwd` and no `--init` flag is passed,
  the script prints a notice and exits 0; it does not create `AGENTS.md`. With `--init`, it
  creates a minimal `AGENTS.md` (shape defined in the architecture artifact).
- **Pointer-line content is fixed.** The exact line is byte-identical to the canonical line
  above, including the em dash `—` (U+2014).
- **No new runtime dependency.** The script uses Node.js built-ins only (`fs`, `path`,
  `process`). It introduces no production dependency.
- **Manual fallback remains documented.** `README.md` documents both the automatic (postinstall)
  path and the manual (one-line edit) path. The manual path is the supported fallback for
  consumers who use `--ignore-scripts` or whose CI rejects `postinstall`.

### How this narrows the superseded invariants (not abolishes)

1. **`ARCHITECTURE.md` rule 6** — narrowed from "No runtime code" to:
   > No runtime *application* code. This repo's "code" is configuration. The only JS is the
   > opencode plugin host (`@opencode-ai/plugin` dependency), any
   > `.opencode/plugin/*.ts|.js` the user adds, **and one constrained install-time
   > file-pointer helper (`scripts/postinstall.js`) permitted by ADR 0002**. There is no
   > `src/`, no build output, no deployable service, no long-running process.
   The general "no runtime application code" stance is retained; only this specific, bounded
   helper is permitted.

2. **`docs/adr/0001-triple-mirror.md` alt.2** — distinguished, not superseded. Alt.2 rejected
   *generating config in this repo* at install time (which would couple the opencode and Claude
   Code release cadences). This ADR permits writing a *one-line pointer in the consumer's
   file* at install time. The distinction: alt.2 was about producing `.claude/` from `.opencode/`
   inside the package (config generation, release coupling); this ADR is about a single-line
   edit to a file *outside* the package in the consumer's tree (pointer installation, no release
   coupling). The `.claude/` ↔ `.opencode/` generation remains rejected; the postinstall
   pointer-writer is a different concern. This carve-out is explicit so alt.2's rejection is not
   silently violated.

3. **`docs/BUSINESS_LOGIC.md` non-goal** — narrowed from "This repo does not ship runtime
   application code" to:
   > This repo does not ship runtime *application* code. A constrained install-time
   > file-pointer helper (`scripts/postinstall.js`, per ADR 0002) is permitted; it is not
   > application code (no business logic, no service, no long-running process).
   The non-goal's intent (no app code, no service, no deployable runtime) is preserved.

## Architecture decisions carried by this ADR (see architecture artifact for detail)

These are the architecture-level decisions that resolve the PRD's "architecture decision" items.
Full rationale is in `docs/architecture/zero-edit-install-architecture.md`; this ADR records them
so they are binding:

- **Script location/entry:** `scripts/postinstall.js` (CommonJS). `package.json` gets
  `"postinstall": "node scripts/postinstall.js"`. `package.json` `main` is NOT changed to point
  at the postinstall; `main: "index.js"` stays (BL-1 partial resolution only — full plugin host
  hook is out of scope).
- **Placement rule:** when the pointer line is missing, insert it immediately after the first
  `# ` heading (the title). If no `# ` heading exists, prepend at the top.
- **`--init` template:** `# <cwd-basename>` + blank line + the pointer line + trailing newline.
- **Match rule:** exact byte match of the canonical line; "present anywhere in the file" counts
  as present (conservative; avoids double-insert). User formatting with different whitespace but
  the same canonical content is left untouched (never rewritten).
- **Symlink handling:** skip symlinks (do not follow), print a debug note, exit 0.
- **Atomic write:** write to a temp file in the same dir, then rename.
- **Direct-dependency detection:** read `<cwd>/package.json` with `fs.readFileSync`, parse with
  `JSON.parse` in try/catch, check `dependencies` and `devDependencies` for
  `@daochild/agents-config`. `process.env.npm_*` may be used only as a fast-path hint if
  available; the authoritative check is reading `<cwd>/package.json`. Mechanism satisfies AC-9
  and AC-8.
- **Monorepo / workspace (EC-10):** deferred per maintainer decision. The script checks
  `<cwd>/package.json` only; it does not traverse parents or workspaces. Documented as a known
  limitation covered by the manual fallback. Interacts with EC-18 (cwd-vs-workspace mismatch).
- **Cross-package-manager:** one Node script, one logic, regardless of manager. Behavior
  verified and documented for npm, yarn classic, yarn berry, pnpm, bun in the architecture
  artifact. For any manager that does not run `postinstall` by default, the manual fallback
  covers it. No per-manager code paths.

## Consequences

**Positive**

- Zero-edit install for direct consumers; adoption friction removed.
- Blast radius explicitly bounded: direct-dependency-only, cwd-scoped, deterministic, exit-0,
  safe-append, no network. The AC-11 transitive suppression is a deliberate risk-reduction
  control (security sensitivity is High; this narrows it).
- The repo's "no runtime application code" stance is preserved — only a bounded helper is
  carved out.
- Manual fallback documented, so consumers who refuse `postinstall` are not stranded.
- ADR makes the supersession explicit and traceable; no silent invariant drift.

**Negative**

- A `postinstall` script is a known npm supply-chain vector. Mitigations: the contract above
  (deterministic, network-free, cwd-scoped, direct-only, exit-0); `SECURITY.md` update required
  (downstream, Security Gate, PRD AC-D4); human approval required at Security and Code Review
  gates (PRD AC-D6).
- The script is new runtime surface in a config-only repo. Mitigation: the ADR narrows (not
  abolishes) the invariant; the contract clauses are binding and human-approval-gated to change.
- Cross-package-manager lifecycle differences (EC-11) and monorepo (EC-10) are real; the
  latter is deferred with a documented limitation, the former is verified/documented in the
  architecture artifact.
- BL-1 (`index.js` stub) is only partially resolved; the `main` field is not reconciled here.

**Mitigations**

- `sdlc-security` updates `SECURITY.md` (AC-D4) and runs the Security Gate.
- `sdlc-reviewer` + human run the Code Review Gate; high-risk → senior/security review (AC-D6).
- `sdlc-auditor` verifies the contract clauses at DoD; any violation blocks.
- Tests (Testing Gate) assert idempotency, safe-append, exit-0, cwd-scope, direct-only,
  determinism (static import block), and every EC.

## Alternatives considered

1. **Keep the manual one-line edit only (do nothing).** Rejected: leaves the adoption friction
   the maintainer explicitly wants removed.
2. **A `bin` CLI the consumer runs (`npx @daochild/agents-config init`).** Considered. Rejected
   for this run: still requires a manual step (only shifts which one). Could be added later as a
   companion to the postinstall; not required by the PRD. The manual one-line edit remains the
   documented fallback either way.
3. **Generate `.claude/` from `.opencode/` at install time (ADR 0001 alt.2).** Rejected (and
   this ADR explicitly does NOT reopen it): that couples release cadences and generates config
   *in this repo*. The postinstall pointer-writer is a distinct, narrower concern (one line in
   the consumer's file).
4. **Allow the script to write for transitive installs.** Rejected by the maintainer (PRD
   Revision 2): a project that did not directly opt in should not have its `AGENTS.md`
   modified. AC-11 transitive suppression is the stronger guarantee.
5. **Workspace-aware dependency detection (traverse parents/workspaces).** Deferred per
   maintainer decision (EC-10/EC-18): the script checks `<cwd>/package.json` only; monorepo is
   a documented limitation covered by the manual fallback. Solving it here would expand scope
   and the blast radius.

## References

- `docs/business/zero-edit-install-analysis.md` — analyst artifact (Requirement Gate, pass).
- `docs/business/zero-edit-install-prd.md` — PRD Revision 2 (Requirement Gate, pass; maintainer
  approved 2026-08-18).
- `docs/architecture/zero-edit-install-architecture.md` — architecture artifact (this gate).
- `ARCHITECTURE.md` — rule 6 narrowed per this ADR.
- `docs/BUSINESS_LOGIC.md` — non-goal narrowed per this ADR.
- `docs/adr/0001-triple-mirror.md` — alt.2 distinguished (not superseded) per this ADR.
- `SECURITY.md` — to be updated at the Security Gate (AC-D4).
- `docs/IMPLEMENTATION.md` — BL-1 status update (AC-D5).
- `sdlc-regulatory` skill — gate checklists, risk-autonomy table, compliance crosswalk.

## Risk classification (input for `sdlc-sm`)

| Axis | Assessment |
|------|------------|
| Business impact | Medium — adoption gain; regression hurts every consumer's install |
| Technical complexity | Medium — small script, but idempotent safe-append + cross-manager + direct-dep detection have real edges |
| Security sensitivity | **High** — postinstall is a supply-chain vector; mitigated by the contract + AC-11 |
| Data sensitivity | Low — only a local markdown file |
| Infrastructure impact | Low — npm publish only, no service |
| Financial impact | Low — no payments |
| Breaking-change probability | Low–Medium — `--ignore-scripts` users unaffected; CI that rejects postinstall sees a *policy* signal, not a code break; manual fallback mitigates |

Overall risk tier: **Medium/High** (driven by security sensitivity).
Recommended AI autonomy cap: **≤40%** for implementation stories touching the script;
documentation-only stories may be higher (80–100%).