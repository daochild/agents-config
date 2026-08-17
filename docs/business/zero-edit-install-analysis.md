# Analysis — zero-edit-install

> SDLC stage 1 (Requirements analysis) artifact. Owner: `sdlc-analyst`.
> Traceability id (slug): `zero-edit-install`.
> Prior artifact: verbal requirement from the maintainer (see verbatim context below).
> Gate: Requirement (partial — first half).

## Verbatim requirement context (from the maintainer)

Add a `postinstall` script to `@daochild/agents-config` so that after a consumer
runs `npm install --save-dev @daochild/agents-config` (or yarn/pnpm/bun
equivalent), the package automatically and idempotently writes a single pointer
line into the consumer's `AGENTS.md`:

> Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.

Goal: zero-edit install for the consumer. Today the user must hand-edit
`AGENTS.md` (one line, after today's README simplification). With this change,
`npm install` alone is sufficient; the consumer only restarts their agent session.

The maintainer also supplied five hard constraints (facts about the repo, not
negotiable). They are reproduced under "Constraints" and "Impacted invariants"
below and are treated as binding inputs to this analysis.

## Problem / opportunity statement

### Problem
Consumers of `@daochild/agents-config` currently must perform a manual one-line
edit of their `AGENTS.md` after installing the package. This is a small but real
adoption friction: a step that can be forgotten, done inconsistently (wrong
location, typos), or done differently across a team. It also means a fresh clone
of a consumer repo that forgot the pointer line silently loses all of the
package's conventions on the next agent session restart — a failure mode that is
hard to notice (the agent simply behaves as if unconfigured).

### Opportunity
A `postinstall` script can make `npm install --save-dev @daochild/agents-config`
*alone* sufficient: the pointer line is written automatically, idempotently, and
safely. The consumer only restarts their agent session. This aligns the package
with the "inherit, don't copy" principle (BR-1) by making inheritance the default
path rather than a manual opt-in.

## Stakeholders and intended users

| Stakeholder | Role in this change | Concern |
|-------------|----------------------|---------|
| Maintainer (Pavlo Bolhar) | Decides the contract; approves high-risk gates | Correctness, security, the repo's invariants |
| Consumer developers (npm/yarn/pnpm/bun) | Run `npm install`; expect zero-edit | Install must not break; must not silently mutate unrelated files |
| Consumer CI pipelines | Run installs, often with `--ignore-scripts` or a postinstall-blocking policy | Must still have a working manual fallback; postinstall must never fail the install |
| Consumer security reviewers | Review supply-chain risk of any postinstall | Script must be deterministic, no network, no telemetry, safe-append only |
| `sdlc-security` / `sdlc-reviewer` / human approvers | Validate the Security and Code Review gates | See "Risk classification" below |

## Market / internal context (brief)

- `@daochild/agents-config` is published to npm as a dev dependency (v1.1.0
  today). The current install flow is documented in `README.md` → "Installation":
  install, then add one pointer line to `AGENTS.md`, then restart the agent
  session. The README was simplified today (commit `fd9a3a7`, "simplify install")
  to collapse the post-install block into a single pointer line.
- `postinstall` scripts are a well-known npm supply-chain vector. The npm
  ecosystem has had multiple high-profile incidents of malicious postinstall
  payloads. As a result: (a) many consumers run installs with `--ignore-scripts`,
  (b) some CI policies reject packages that ship `postinstall` outright, and
  (c) consumer security reviewers scrutinize any `postinstall`. Any design that
  ignores this will be rejected at the Security Gate and by consumer security
  teams.
- This repo's own invariants currently **forbid** runtime code (see "Impacted
  invariants"). A `postinstall` script is runtime code by definition. Therefore
  this change cannot proceed without explicitly superseding those invariants via
  a new ADR. That ADR is **out of scope for this role** (analyst); it is a required
  downstream artifact owned by `sdlc-architect`.

## Crisp, testable restatement of the requirement

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
> The change supersedes repo invariants that forbid runtime code; this requires a
> new ADR (ADR 0002, produced downstream by `sdlc-architect`) and updates to
> `ARCHITECTURE.md`, `docs/adr/0001-triple-mirror.md` alt.2, and
> `docs/BUSINESS_LOGIC.md` non-goals. It also partially resolves backlog item BL-1
> (the `index.js` stub). `SECURITY.md` must be updated to cover the postinstall
> supply-chain surface (downstream of this role).

## Constraints (binding, from the maintainer)

1. **Idempotent.** Running `npm install` twice (or any number of times) MUST NOT
   duplicate the pointer line. The script must detect an existing pointer line
   and no-op.
2. **Safe-append only.** NEVER overwrite existing `AGENTS.md` content. If the
   pointer line is missing, prepend or append it (the architect decides which; not
   this role). If it is present, no-op. Existing content is sacred.
3. **Do not silently create `AGENTS.md`.** If no `AGENTS.md` exists in `cwd`:
   - default behavior: print a notice telling the user how to create one / use the
     manual path, and **exit 0** (never fail the install);
   - if an `--init` flag is passed: create a minimal `AGENTS.md` containing the
     pointer line (the exact minimal shape is an architecture decision, not this
     role's).
4. **Never modify files outside `cwd`.** The script operates on the consumer's
   `AGENTS.md` in the install `cwd` only. No traversal, no home dir, no global
   files.
5. **Deterministic.** No network access, no telemetry, no randomization, no
   time-based behavior. The output is a pure function of the input
   (`AGENTS.md` content + flags).
6. **Always exit 0.** The script must never cause `npm install` to fail. Errors
   are logged to stdout as notices, not thrown.
7. **Manual fallback remains documented and supported.** The current README
   one-line edit MUST remain in `README.md` as the supported fallback for
   consumers who use `--ignore-scripts` or whose CI rejects `postinstall`.
8. **`SECURITY.md` must be updated** to cover the new supply-chain surface (this
   is a downstream artifact, out of this role's scope; flagged here per the
   maintainer's instruction).
9. **Always-on SDLC.** This is a medium/high-risk change per the repo's own
   `sdlc-gates` rule. The orchestrator MUST require human approval at the
   Architecture, Security, and Code Review gates before advancing. (This analysis
   itself runs under that rule.)

## Impacted invariants (MUST be surfaced; supersession is downstream)

This change **supersedes / relaxes** three currently-stated repo invariants. The
analyst MUST surface them; superseding them via an ADR is the architect's job,
NOT this role's. They are listed here as **required downstream artifacts** so the
PM can carry them forward as acceptance criteria / dependencies:

1. **`ARCHITECTURE.md` rule 6** — "No runtime code. This repo's 'code' is
   configuration. The only JS is the opencode plugin host
   (`@opencode-ai/plugin` dependency) and any `.opencode/plugin/*.ts|.js` the user
   adds. There is no `src/`, no build output, no deployable service."
   A `postinstall` script is runtime code that runs in the consumer's environment
   at install time. Rule 6 must be superseded (narrowed) to permit *this specific,
   constrained* runtime code while keeping the general "no runtime application
   code" stance.

2. **`docs/adr/0001-triple-mirror.md` alt.2** — "Generate `.claude/` from
   `.opencode/` at install time. Rejected: adds a build step to a config-only
   repo and couples the tools' release cadences."
   A `postinstall` is an install-time step. Alt.2's rationale must be
   distinguished: that rejection was about *generating config* (coupling release
   cadences); this change writes a *one-line pointer in the consumer's file*, not
   config in this repo. ADR 0002 must explicitly carve out the distinction so
   alt.2's rejection is not silently violated.

3. **`docs/BUSINESS_LOGIC.md` non-goal** — "This repo does not ship runtime
   application code."
   The non-goal must be narrowed: this repo does not ship runtime *application*
   code, but it DOES ship a constrained, install-time, file-pointer helper
   (postinstall). The non-goal wording must be updated.

> These three are **impacted invariants**, not things this role changes. The
> analyst explicitly does NOT edit `ARCHITECTURE.md`, `docs/adr/`, or
> `docs/BUSINESS_LOGIC.md`. The PM MUST carry them forward as required downstream
> artifacts (acceptance criteria / dependencies), and the architect MUST produce
> ADR 0002 superseding the relevant clauses.

## Relationship to existing backlog item BL-1

`docs/IMPLEMENTATION.md` lists:

> BL-1 | Add a real `index.js` entry if plugins need a host hook | low | Only if a
> plugin requires programmatic registration

The existing `package.json` declares `"main": "index.js"` pointing at a
non-existent stub (flagged in `docs/IMPLEMENTATION.md` as BL-1, status "Stub").
This change **partially resolves** BL-1: the postinstall script is a real, albeit
constrained, runtime entry. The PM should note in the PRD that BL-1 moves from
"Stub" to "Partially resolved (postinstall only)" and that the `main` field may
need to be reconciled (architecture decision, not this role's). BL-1 is NOT
fully closed by this change — a full `index.js` host hook for plugins is a
separate concern.

## Assumptions

- The consumer runs `npm install` (or yarn/pnpm/bun equivalent) from their project
  root, and the package is installed under `node_modules/@daochild/agents-config/`
  relative to that root. The `postinstall` script runs with `cwd` set to the
  consumer's project root (npm's documented behavior). *(To be confirmed by the
  architect against current npm/pnpm/bun/yarn behavior; flagged as an
  assumption.)*
- The pointer line's exact wording is fixed by the maintainer (verbatim above).
  The script writes that exact string; it is not parameterized.
- The script is plain Node.js (the repo's stack is Node; `type: commonjs`). No
  extra runtime dependency is introduced for the script itself (it uses Node
  built-ins only) — this is a constraint, not an assumption, but restated here
  because it bounds the architect's options.
- "Restart your agent session" remains a manual consumer step; this change does
  not attempt to hot-reload agent config (rule 5 in `ARCHITECTURE.md`: config is
  loaded once at startup).

## Unknowns (to be resolved downstream)

- **Exact placement** of the pointer line (prepend vs. append) when it is missing.
  The maintainer's README says "at the top of your project's `AGENTS.md`,
  immediately after the title". The script should replicate that intent, but the
  robust definition of "immediately after the title" (first `# ` heading? first
  blank line after it?) is an architecture decision. Flagged as unknown.
- **`--init` minimal `AGENTS.md` shape.** If `--init` creates a minimal
  `AGENTS.md`, what exactly does it contain? (Just the title + pointer? A
  documented template?) Architecture decision.
- **Cross-package-manager behavior.** npm, yarn (classic + berry), pnpm, and bun
  differ in how (and whether) they run `postinstall`, and in `cwd` semantics. The
  architect MUST verify behavior across the supported set (the README lists all
  four). Some package managers run `postinstall` with a different `cwd` or not at
  all by default (pnpm has historically had different lifecycle behavior). This
  is the single biggest unknown and a likely source of cross-manager
  inconsistency.
- **`--ignore-scripts` detection.** There is no reliable way for a package to
  detect that the consumer ran with `--ignore-scripts` (the script simply doesn't
  run). The manual fallback's discoverability therefore depends on `README.md`
  being clear. Flagged as an inherent limitation, not something the script can
  solve.
- **Monorepo / workspace installs.** In a workspace, `postinstall` may run once
  per the root or once per workspace; the pointer line target (`AGENTS.md` at
  which level?) is unclear. Architect must address or scope out.

## Out of scope for this role (analyst)

- Acceptance criteria — owned by `sdlc-pm` (next).
- Architecture / script design / language choice / placement rules / `--init`
  template — owned by `sdlc-architect`.
- ADR 0002 — owned by `sdlc-architect`.
- Supersession edits to `ARCHITECTURE.md`, `docs/BUSINESS_LOGIC.md`,
  `docs/adr/0001-triple-mirror.md` — owned by `sdlc-architect` (architecture gate).
- `SECURITY.md` update — owned downstream (security gate).
- Implementation, tests, review — downstream roles.

## AI-readable precondition check (per `sdlc-regulatory` skill)

Required for any SDLC run:
- `AGENTS.md` — present, current (commit `fd9a3a7`, today). ✔
- `ARCHITECTURE.md` — present, current (same commit). ✔

Other AI-readable contract files present: `CONTRIBUTING.md`, `SECURITY.md`,
`docs/BUSINESS_LOGIC.md`, `docs/IMPLEMENTATION.md`, `docs/adr/0001-triple-mirror.md`.
The repo is AI-readable; no bootstrap pass is required before routing the feature
work.

## Risk classification (preliminary — `sdlc-sm` assigns the final cap)

This change is **medium / high risk** on multiple axes (the maintainer asserts
medium/high; this analysis concurs and breaks it down):

| Axis | Assessment |
|------|------------|
| Business impact | Medium — improves adoption; a regression here directly hurts every consumer's install |
| Technical complexity | Medium — the script is small, but cross-package-manager behavior and idempotent safe-append have real edge cases |
| Security sensitivity | **High** — `postinstall` is a known supply-chain vector; this is the dominant risk |
| Data sensitivity | Low — no personal data; the script only touches a local markdown file |
| Infrastructure impact | Low — no deployable service; npm publish only |
| Financial impact | Low — no payments/billing surface |
| Breaking-change probability | Medium — consumers who pin or who run `--ignore-scripts` are unaffected; consumers whose CI rejects `postinstall` may see a *policy* break (not a code break); the manual fallback mitigates |

Because security sensitivity is High, the autonomy cap is ≤40% per the
`sdlc-regulatory` risk-autonomy table (postinstall is closest to
"Authentication"/"Production infrastructure" in sensitivity, not
"Documentation"/"Test generation"). This is above the ~50% cap threshold *only in
the sense that any high-risk change requires human approval* — to be precise: the
**cap is low** (≤40%), and **human approval is required at Architecture,
Security, and Code Review gates** before advancing. The orchestrator must request
and record those approvals.

## Gate self-check (Requirement Gate, partial — analyst's half)

- [x] Requirement is clearly defined — crisp restatement above.
- [x] Business requirements are understood — problem, stakeholders, context documented.
- [x] Unknowns and assumptions surfaced — listed explicitly, with owners.
- [x] Impacted invariants surfaced — three listed, flagged as downstream ADR work.
- [x] AI-readable precondition verified — `AGENTS.md` + `ARCHITECTURE.md` present and current.

All analyst-half items pass.

## Handoff

```
HANDOFF: sdlc-pm | artifact: docs/business/zero-edit-install-analysis.md | gate: pass
```

The PM MUST carry forward as required downstream artifacts:
- ADR 0002 superseding `ARCHITECTURE.md` rule 6, `docs/adr/0001-triple-mirror.md`
  alt.2, and `docs/BUSINESS_LOGIC.md` non-goals.
- `SECURITY.md` update covering the postinstall supply-chain surface.
- BL-1 partial resolution noted in the PRD.
- Manual fallback documented in README as a supported path (acceptance criterion).
- Human approvals required at Architecture, Security, and Code Review gates.