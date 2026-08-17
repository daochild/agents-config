# PRD — zero-edit-install

> SDLC stage 2 (Technical specification / PRD) artifact. Owner: `sdlc-pm`.
> Traceability id (slug): `zero-edit-install`.
> Prior artifact: `docs/business/zero-edit-install-analysis.md` (analyst, gate: pass).
> Gate: Requirement (complete — PM owns the second half: acceptance criteria + edge cases).

## Source

This PRD is derived from `docs/business/zero-edit-install-analysis.md` and the
maintainer's five hard constraints. The analyst's crisp restatement is adopted
verbatim as the requirement; this document adds acceptance criteria, edge cases,
out-of-scope, and priority.

### Revision 2 (maintainer change request, transitive-install suppression)

The maintainer reviewed Revision 1 and returned one change request before
approving the Architecture Gate dispatch: **suppress transitive installs**. The
`postinstall` script MUST only write the pointer line when
`@daochild/agents-config` is a **direct** dependency (in the consumer's
`dependencies` or `devDependencies` in their `package.json`). When installed
transitively, the script MUST no-op (no `AGENTS.md` modification, at most a
debug-level stdout note, exit 0). Rationale: this aligns with "never modify files
outside cwd" and US-8 "no surprises in my environment"; a project that did not
directly opt in should not have its `AGENTS.md` modified. The safe-append + exit-0
contract is necessary but not sufficient; explicit opt-in via direct dependency
is the stronger guarantee.

Revision 2 changes (line-level summary, for the maintainer's re-review):
- US-8 updated to explicitly include transitive-install suppression.
- AC-11 added (direct-dependency-only gate).
- EC-14 rewritten from an architecture-decision "default assumption" to a
  **binding PRD requirement** (suppress).
- EC-16, EC-17, EC-18 added (edge cases introduced by the detection mechanism).
- "Out of scope" updated: EC-14 is no longer an architecture decision.
- AC-D1 / AC-D2 updated: the direct-dependency-only contract is now part of the
  postinstall contract that must not change without human approval.
- "Non-functional requirements" updated: direct-dependency-only added.
- Risk note: suppress-transitive **reduces** blast radius (risk reduction);
  security sensitivity remains High.

The analyst's artifact (`docs/business/zero-edit-install-analysis.md`) is
unchanged. The analyst already surfaced EC-14 as an unknown; the PM resolving it
here is the expected next step.

## Requirement (adopted from the analyst, verbatim)

> Ship a `postinstall` script in `@daochild/agents-config` that, after a consumer
> installs the package as a dev dependency, automatically and idempotently writes
> the single pointer line
> `Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.`
> into the consumer's `AGENTS.md` — **safe-append only** (prepend or append if the
> line is missing; no-op if already present; never overwrite existing content),
> **never creates an `AGENTS.md` silently** (if absent, print a notice and exit 0
> unless `--init` was passed), **never modifies files outside `cwd`**, is
> **deterministic** (no network, no telemetry), and **always exits 0** so it can
> never break `npm install`.
>
> Consumers who refuse `postinstall` (via `--ignore-scripts` or policy) MUST still
> have a fully documented, supported manual fallback (the current one-line edit in
> `README.md`).
>
> **Direct-dependency only (Revision 2).** The script MUST only write the pointer
> line when `@daochild/agents-config` is a **direct** dependency of the consumer
> (listed in the consumer's `dependencies` or `devDependencies` in their
> `<cwd>/package.json`). When the package is installed transitively
> (dependency-of-a-dependency), the script MUST **no-op**: do not touch
> `AGENTS.md`, print at most a debug-level note to stdout, and exit 0. This is a
> binding PRD requirement, not an architecture decision (see AC-11, EC-14).
>
> The change supersedes repo invariants that forbid runtime code; this requires a
> new ADR (ADR 0002, produced downstream by `sdlc-architect`) and updates to
> `ARCHITECTURE.md`, `docs/adr/0001-triple-mirror.md` alt.2, and
> `docs/BUSINESS_LOGIC.md` non-goals. It also partially resolves backlog item BL-1
> (the `index.js` stub). `SECURITY.md` must be updated to cover the postinstall
> supply-chain surface (downstream of this role).

## User stories

### US-1 — Zero-edit install (happy path)
**As a** consumer developer,
**I want** `npm install --save-dev @daochild/agents-config` to automatically add
the pointer line to my `AGENTS.md`,
**so that** I don't have to hand-edit any file — I only restart my agent session.

### US-2 — Idempotent reinstall
**As a** consumer developer,
**I want** running `npm install` again (or upgrading the package) to NOT duplicate
the pointer line,
**so that** my `AGENTS.md` stays clean no matter how many times I install.

### US-3 — Non-destructive
**As a** consumer developer,
**I want** the script to never overwrite my existing `AGENTS.md` content,
**so that** my custom instructions are preserved.

### US-4 — No silent file creation
**As a** consumer developer without an `AGENTS.md`,
**I want** the script to print a clear notice (and not fail) instead of silently
creating a file,
**so that** I understand what happened and can choose the manual path or `--init`.

### US-5 — Explicit init
**As a** consumer developer who wants the package to seed a minimal `AGENTS.md`,
**I want** an explicit `--init` flag that creates a minimal `AGENTS.md` with the
pointer line,
**so that** file creation is an opt-in, never a surprise.

### US-6 — Refused-postinstall fallback
**As a** consumer on a CI policy that blocks `postinstall` (or who uses
`--ignore-scripts`),
**I want** a documented one-line manual edit in `README.md`,
**so that** I can still use the package.

### US-7 — Never breaks install
**As a** consumer,
**I want** the script to always exit 0,
**so that** a config package can never break my dependency install.

### US-8 — No surprises in my environment
**As a** consumer security reviewer,
**I want** the script to be deterministic, network-free, telemetry-free, scoped to
`cwd`, **and to not run (no-op) on projects that installed this package
transitively**,
**so that** I can approve it as a low-blast-radius supply-chain surface. A project
that did not directly opt into `@daochild/agents-config` must not have its
`AGENTS.md` modified by it.

## Acceptance criteria

> Measurable and testable. Each AC has an id (AC-*) for traceability into the
> Testing Gate. The downstream `sdlc-architect` decides *how* (placement rule,
> `--init` template shape, cross-manager behavior); these criteria constrain
> *what* must be true.

### Functional

- **AC-1 (idempotent, missing line).** Given an `AGENTS.md` that does NOT contain
  the pointer line, when the `postinstall` runs, then the pointer line is added
  exactly once.
- **AC-2 (idempotent, already present).** Given an `AGENTS.md` that already
  contains the pointer line (anywhere in the file), when the `postinstall` runs,
  then the file is unchanged (byte-for-byte, modulo trailing newline
  normalization which MUST be documented by the architect) and no second copy is
  added.
- **AC-3 (non-destructive).** Given an `AGENTS.md` with arbitrary existing content,
  when the `postinstall` runs, then all pre-existing content is preserved. No
  existing line is overwritten or deleted. The pointer line is inserted (prepended
  or appended per the architect's placement rule) without removing anything.
- **AC-4 (exact pointer line).** The written line is byte-identical to:
  `Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.`
  (including the em dash `—`, U+2014). No paraphrasing.
- **AC-5 (no `AGENTS.md`, default).** Given no `AGENTS.md` in `cwd` and no
  `--init` flag, when the `postinstall` runs, then: (a) no `AGENTS.md` is created,
  (b) a notice is printed to stdout telling the user how to proceed (manual edit
  or `--init`), (c) the script exits 0.
- **AC-6 (no `AGENTS.md`, `--init`).** Given no `AGENTS.md` in `cwd` and the
  `--init` flag, when the `postinstall` runs, then a minimal `AGENTS.md` is
  created containing at least the pointer line. The exact minimal shape is an
  architecture decision (architect MUST specify it in the architecture artifact).
- **AC-7 (always exit 0).** In every code path — happy path, no-op, missing file,
  `--init`, permission error, unexpected exception — the script exits 0. Errors
  are printed as notices to stdout, never thrown as non-zero exits. The install
  MUST NOT fail because of this script.
- **AC-8 (cwd-scoped).** The script only reads/writes within the npm-provided
  `cwd` (the consumer's project root). It does not touch the home directory, any
  global config, any parent directory, or any sibling project. (Cross-package-
  manager `cwd` semantics are an architecture concern; the architect MUST verify
  and document them.)
- **AC-9 (deterministic).** The script makes no network calls, collects no
  telemetry, uses no `Date`/`Math.random`, and writes no files other than
  `AGENTS.md` (when permitted). Output is a pure function of (`AGENTS.md` content,
  flags). This is enforceable by static review and by a test that blocks the
  script from importing `http`, `https`, `net`, `fetch`, `dns`, `child_process`
  (except where strictly required by the install lifecycle, which it isn't).
- **AC-11 (direct-dependency only).** The script MUST verify that
  `@daochild/agents-config` is a **direct** dependency of the consumer before
  writing the pointer line. "Direct" means the package name
  `@daochild/agents-config` appears as a key in the `dependencies` or
  `devDependencies` object of the consumer's `<cwd>/package.json`. If it does not
  (i.e. the package was installed transitively, or is absent from
  `package.json`), the script MUST no-op: do not modify `AGENTS.md`, print at most
  a debug-level note to stdout, and exit 0.
  - **Behavior locked by the PRD (not an architecture decision):** transitive
    installs are suppressed.
  - **Detection mechanism (PRD-level definition, implementation refinable by the
    architect):** the script reads the consumer's `<cwd>/package.json` and checks
    for `@daochild/agents-config` under `dependencies` or `devDependencies`. The
    architect MAY refine the mechanism (e.g. prefer `process.env.npm_config_*` /
    `process.env.npm_package_*` env vars when available and reliable, or read
    `<cwd>/package.json` directly) — but the *behavior* (suppress unless direct)
    is locked here. Whichever mechanism is chosen MUST satisfy AC-9
    (deterministic, no network, no `child_process`) and AC-8 (cwd-scoped, reading
    only `<cwd>/package.json`).
  - **`peerDependencies` and `optionalDependencies` are NOT "direct" for this
    check** — see EC-17 for the resolution and rationale.

### Manual fallback

- **AC-10 (README documents both paths).** `README.md` documents BOTH the
  automatic (postinstall) path AND the manual (one-line edit) path. The manual
  path is explicitly labeled as the **supported fallback** for consumers who use
  `--ignore-scripts` or whose CI rejects `postinstall`. The manual path must be
  runnable without the postinstall ever having run.

### Downstream-artifact acceptance criteria (dependencies, not this role's scope)

These are acceptance criteria the PRD requires to be satisfied *downstream* by
other roles. They are listed here so the orchestrator and later gates can verify
them. They are NOT the PM's to produce.

- **AC-D1 (ADR 0002 required).** `sdlc-architect` MUST produce
  `docs/adr/0002-<slug>.md` that explicitly supersedes:
  - `ARCHITECTURE.md` rule 6 ("No runtime code") — narrowed to permit this
    constrained postinstall while retaining the general "no runtime application
    code" stance;
  - `docs/adr/0001-triple-mirror.md` alt.2 ("Generate `.claude/` from `.opencode/`
    at install time. Rejected: adds a build step...") — distinguished: that
    rejection was about generating *config* (coupling release cadences); this
    change writes a *one-line pointer in the consumer's file*, not config in this
    repo;
  - `docs/BUSINESS_LOGIC.md` non-goal ("This repo does not ship runtime
    application code") — narrowed to "no runtime *application* code; a constrained
    install-time file-pointer helper is permitted".
  ADR 0002 MUST also record the **direct-dependency-only contract** (AC-11) as a
  binding constraint of the postinstall: the script only writes for direct
  dependencies; transitive installs are suppressed. This contract must not change
  without human approval (Revision 2).
  ADR 0002 must be approved by a human at the Architecture Gate before
  advancement.
- **AC-D2 (`ARCHITECTURE.md` updated).** `sdlc-architect` MUST update
  `ARCHITECTURE.md` rule 6 (and the Constraints / Stack sections as needed) to
  reflect the ADR 0002 narrowing. The "What must NOT be changed without human
  approval" list must explicitly include the postinstall script's contract:
  idempotency, safe-append, exit-0, cwd-scoped, deterministic, **and
  direct-dependency-only (transitive suppression) — Revision 2**.
- **AC-D3 (`docs/BUSINESS_LOGIC.md` non-goal updated).** `sdlc-architect` (or
  `sdlc-dev` under the architect's direction) MUST narrow the non-goal wording per
  AC-D1.
- **AC-D4 (`SECURITY.md` updated).** `sdlc-security` MUST update `SECURITY.md` to
  cover the postinstall supply-chain surface: the script is deterministic,
  network-free, telemetry-free, cwd-scoped, exit-0; the manual fallback exists;
  consumers may use `--ignore-scripts`. This update is a gate artifact of the
  Security Gate and requires human approval (high-risk).
- **AC-D5 (BL-1 partially resolved).** `sdlc-dev` (under the architect's plan)
  MUST update `docs/IMPLEMENTATION.md` so BL-1's status moves from "Stub" to
  "Partially resolved (postinstall only)" and notes that a full plugin host hook
  remains a separate concern. The `package.json` `main` field reconciliation is
  an architecture decision (architect MUST address it in the architecture
  artifact).
- **AC-D6 (human approvals recorded).** The orchestrator MUST request and record
  explicit human approvals at the Architecture, Security, and Code Review gates
  (approver handle + date) in the eventual DoD audit artifact, per the
  `sdlc-regulatory` skill. This is a medium/high-risk change (security sensitivity
  is High).

## Edge cases and negative paths

| ID | Scenario | Expected behavior |
|----|----------|-------------------|
| EC-1 | `AGENTS.md` missing, no `--init` | Print notice, no file created, exit 0 (AC-5) |
| EC-2 | `AGENTS.md` missing, `--init` passed | Create minimal `AGENTS.md` with pointer line, exit 0 (AC-6) |
| EC-3 | Pointer line already present (exact match) | No-op, exit 0, file unchanged (AC-2) |
| EC-4 | Pointer line present with different whitespace | Treated as present if the canonical line is detectable; the architect MUST define the match rule (exact bytes vs. normalized). If normalized, the script MUST NOT rewrite the existing line. |
| EC-5 | Pointer line present but inside a code block / quoted | The architect MUST define whether "present anywhere" counts, or only "present as a top-level instruction line". Default assumption (to be confirmed): present-anywhere counts, to stay conservative and avoid double-insert. |
| EC-6 | `AGENTS.md` exists but is empty (0 bytes) | Add the pointer line (per placement rule), exit 0 |
| EC-7 | `AGENTS.md` exists but is not writable (perms) | Print notice, do not throw, exit 0 (AC-7) |
| EC-8 | `AGENTS.md` is a symlink to another file | Architect MUST decide: follow symlink or skip. Default assumption: skip (do not follow) to respect "never modify files outside cwd"; but this is an architecture decision. |
| EC-9 | Install run with `--ignore-scripts` | Script does not run; manual fallback in README is the supported path (AC-10). The package cannot detect this; the README must be clear. |
| EC-10 | Install in a monorepo workspace | Behavior is an architecture concern (AC-8). The architect MUST document: does the script run per-workspace, at the root, or not at all? What is the target `AGENTS.md`? If out of scope, the PRD must say so explicitly (see Out of scope). |
| EC-11 | Cross-package-manager differences (npm/yarn classic/yarn berry/pnpm/bun) | The architect MUST verify and document lifecycle + `cwd` semantics for each supported manager. If a manager does not run `postinstall` by default, the manual fallback covers it. |
| EC-12 | Consumer runs install inside a CI sandbox with read-only project root | Print notice, exit 0 (AC-7). Do not fail the build. |
| EC-13 | Pointer line is present but misspelled / stale (points at a different path) | Out of scope: the script does not repair stale lines. It only ensures the canonical line is present. The architect MUST confirm this in the architecture artifact. |
| EC-14 | The package is installed as a *transitive* dependency (not directly by the consumer) | **Binding PRD requirement (Revision 2): suppress.** The script MUST no-op — do not modify `AGENTS.md`, print at most a debug-level note to stdout, and exit 0. This is enforced by AC-11. It is NO LONGER an architecture decision. |
| EC-15 | Concurrent installs racing on the same `AGENTS.md` | The script should use atomic write (temp file + rename) to avoid torn writes. Architect MUST specify. |
| EC-16 | Consumer's `<cwd>/package.json` is unreadable or missing (no package.json at cwd) | The script MUST no-op: do not modify `AGENTS.md`, print at most a debug-level note to stdout, and exit 0. This is consistent with AC-7 (always exit 0) and AC-11 (cannot verify direct dependency → treat as not-direct → suppress). The script MUST NOT throw. |
| EC-17 | `@daochild/agents-config` is listed under `peerDependencies` or `optionalDependencies` but NOT under `dependencies`/`devDependencies` | **PRD decision: treat as NOT direct → suppress (no-op, exit 0).** Justification: peer/optional dependencies are a weaker signal of consumer intent than `dependencies`/`devDependencies`. A peer dependency declares "this package works alongside X if X is present", not "this consumer explicitly opted into X". A consumer's tooling may pull in a peer without a direct install decision by a developer on that consumer. The safe-append + exit-0 contract keeps suppression safe. The maintainer is asked to confirm this choice; if they prefer to treat peer/optional as direct, this AC and EC-17 flip and downstream artifacts update accordingly. *(Flagged for maintainer review in the handoff.)* |
| EC-18 | Workspace/monorepo: the package is hoisted to a root `node_modules` while the consumer is a sub-workspace; the direct-dependency check against the *root* `package.json` may give a wrong answer | The direct-dependency check runs against the `<cwd>/package.json` (per AC-11). If `cwd` is a workspace root and the package was declared in a sub-workspace's `package.json` (or vice versa), the check may incorrectly suppress or incorrectly fire. This interacts with EC-10 (monorepo, architect-owned). The PRD does NOT solve monorepo here. The architect MUST address the interaction under EC-10: either (a) document that the script checks `<cwd>/package.json` as-is and monorepo is a known limitation covered by the manual fallback, or (b) propose a workspace-aware detection that still satisfies AC-9 (deterministic, no network, no `child_process`) and AC-8 (cwd-scoped). Until the architect resolves EC-10, the PRD locks behavior as: check `<cwd>/package.json` only; do not traverse parents or workspaces. |

## Out of scope

- **Placement rule** (prepend vs. append; "immediately after the title" semantics)
  — architecture decision (`sdlc-architect`).
- **`--init` minimal `AGENTS.md` template shape** — architecture decision.
- **Cross-package-manager lifecycle verification** — architecture decision (the
  PRD requires it to be *verified and documented*, not that the PRD pick the
  behavior).
- **Monorepo / workspace semantics** — architecture decision; may be explicitly
  deferred (the PRD allows the architect to scope it out, in which case the
  architecture artifact must say so and the README must note the limitation). The
  direct-dependency check interacts with monorepo (EC-18); the PRD locks the
  check to `<cwd>/package.json` only and leaves workspace-aware detection to the
  architect under EC-10.
- **Exact direct-dependency detection mechanism** — architecture decision. The
  PRD locks the *behavior* (suppress unless direct; transitive suppressed;
  peer/optional treated as not-direct per EC-17) and gives a PRD-level mechanism
  (read `<cwd>/package.json`, check `dependencies`/`devDependencies`). The
  architect MAY refine the mechanism (e.g. `process.env.npm_*` env vars) as long
  as AC-9 and AC-8 hold.
- **ADR 0002 and the supersession edits** — `sdlc-architect` (AC-D1/D2/D3).
- **`SECURITY.md` update** — `sdlc-security` (AC-D4).
- **BL-1 full resolution / plugin host hook** — separate concern; only the
  partial resolution is in scope here (AC-D5).
- **Repairing stale/misspelled pointer lines** — explicitly out of scope (EC-13).
- **Detecting `--ignore-scripts`** — impossible by design; out of scope (EC-9).
- **Transitive-install behavior** — NO LONGER an architecture decision; locked by
  the PRD as "suppress" (AC-11, EC-14, Revision 2).
- **Implementation, tests, review, deployment** — downstream roles.

## Priority and sequencing

- **Priority:** High (adoption friction removal; the README was already
  simplified today to a single line, making this the natural next step).
- **Risk:** Medium/High (security sensitivity High; requires human approvals at
  Architecture, Security, Code Review gates).
- **Risk note (Revision 2):** the suppress-transitive requirement (AC-11) is a
  **risk reduction**, not an increase — it narrows the blast radius to consumers
  who explicitly opted in via direct dependency. Security sensitivity remains
  High (postinstall is still a supply-chain vector); the autonomy cap stays ≤40%.
  The detection mechanism itself introduces minor complexity (reading
  `<cwd>/package.json`), addressed by EC-16/17/18.
- **Sequencing constraint:** This PRD MUST NOT advance to `sdlc-architect`
  without the maintainer's review of this PRD (the orchestrator's instruction:
  stop after PM returns pass). The next dispatch (`sdlc-architect`) is a separate
  run.
- **Open item for maintainer (Revision 2):** EC-17 resolution (peer/optional
  treated as NOT direct → suppress) is a PM recommendation flagged for maintainer
  confirmation. If the maintainer disagrees, the PRD flips AC-11's definition of
  "direct" and EC-17's resolution; downstream artifacts (AC-D1/D2) update
  accordingly. This is the one item in Revision 2 that is not yet locked.
- **Downstream critical path:** PRD (this) → `sdlc-architect` (ADR 0002 +
  architecture + `ARCHITECTURE.md`/`docs/BUSINESS_LOGIC.md` edits) →
  `sdlc-sm` (stories + risk cap, expected ≤40% autonomy) → `sdlc-dev` →
  `sdlc-qa` → `sdlc-security` (`SECURITY.md` update + security report) →
  `sdlc-reviewer` → `sdlc-auditor` → deploy (npm publish, subject to Deployment
  Gate).

## Non-functional requirements (binding constraints, restated)

- **Determinism:** no network, no telemetry, no time/random (AC-9).
- **Exit 0 always:** every path (AC-7).
- **cwd-scoped:** no traversal outside the consumer root (AC-8).
- **Safe-append only:** never overwrite existing content (AC-3).
- **Direct-dependency-only (Revision 2):** no-op when installed transitively; only
  write when `@daochild/agents-config` is a direct dependency
  (`dependencies`/`devDependencies` in `<cwd>/package.json`); peer/optional
  treated as not-direct (AC-11, EC-14, EC-17). This is a risk-reduction control:
  it shrinks the blast radius to consumers who explicitly opted in.
- **No new runtime dependency:** the script uses Node.js built-ins only. (This
  is a constraint that bounds the architect; restated here because it also bounds
  the Implementation Gate's "no unnecessary dependencies" item.)
- **CommonJS:** the repo is `"type": "commonjs"`; the script must conform.
- **Triple-mirror unaffected:** this change does NOT add a subagent/skill/command/
  rule, so the triple-mirror invariant is not in play. (Confirmed: a `postinstall`
  script is not a mirrored component type per `AGENTS.md` → "Adding a new
  component". The architect should confirm.)

## Compliance note (regulatory crosswalk)

If any consuming project of `@daochild/agents-config` targets a regulated domain
(EU AI Act high-risk, ISO 42001, SOC 2, GDPR), this change's Security Gate must
produce the supply-chain-relevant artifacts per the `sdlc-regulatory` compliance
crosswalk (Security Gate row: EU AI Act Art. 15 cybersecurity, NIST MEASURE-1.3,
ISO 42001 clause 8.8, SOC 2 CC6.1–CC6.8, GDPR Art. 32). This PRD does not itself
produce those artifacts; it flags them as Security-Gate dependencies. This repo
itself is configuration-only and not a regulated system, but its consumers may
be — the supply-chain surface of a `postinstall` is exactly the kind of thing
those regimes care about.

## Gate self-check (Requirement Gate — full)

- [x] Requirement is clearly defined — adopted verbatim from the analyst, plus the
      Revision 2 direct-dependency-only clause.
- [x] Acceptance criteria exist — AC-1..AC-11 + AC-D1..AC-D6, measurable/testable.
      AC-11 (direct-dependency only) added in Revision 2.
- [x] Edge cases are identified — EC-1..EC-18, each with expected behavior or an
      explicit "architecture decision" flag where appropriate. EC-14 is now a
      binding requirement (no longer architect-owned); EC-16/17/18 added in
      Revision 2 to cover the detection-mechanism surface.
- [x] Business requirements are understood — US-1..US-8 map to the problem
      statement and constraints. US-8 updated in Revision 2 to include
      transitive-install suppression.

All Requirement Gate items pass. No item is unchecked.

## Handoff

```
HANDOFF: sdlc-architect | artifact: docs/business/zero-edit-install-prd.md | gate: pass
```

Per the orchestrator's instruction, this run STOPS here for maintainer approval.
`sdlc-architect` will be dispatched in a separate run after the maintainer
reviews this revised PRD (Revision 2). The architect MUST produce ADR 0002
(AC-D1), update `ARCHITECTURE.md` (AC-D2), and coordinate the
`docs/BUSINESS_LOGIC.md` non-goal narrowing (AC-D3) as part of passing the
Architecture Gate. Human approval is required at that gate (AC-D6).

**Revision 2 open item for the maintainer (please confirm before architect
dispatch):** EC-17 — `@daochild/agents-config` under `peerDependencies` or
`optionalDependencies` (but not `dependencies`/`devDependencies`) is treated by
the PM as **NOT direct → suppress**. If the maintainer prefers peer/optional to
count as direct, say so and the PM will flip AC-11 and EC-17 (and adjust AC-D1/D2)
before the architect is dispatched.