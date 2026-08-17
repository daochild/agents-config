# Stories — zero-edit-install

> SDLC stage 4 (Implementation planning) artifact. Owner: `sdlc-sm`.
> Traceability id (slug): `zero-edit-install`.
> Prior artifacts:
> - `docs/business/zero-edit-install-prd.md` (Revision 2, approved; maintainer approval 2026-08-18).
> - `docs/architecture/zero-edit-install-architecture.md` (Architecture Gate, pass).
> - `docs/adr/0002-zero-edit-install.md` (ADR, Architecture Gate, pass).
> Gate: Architecture (second half — stories + risk classification + autonomy cap). Completes the Architecture Gate.

## Risk classification basis

Per the `sdlc-regulatory` skill, every story is classified on 7 axes and assigned an AI
autonomy cap. The change's overall risk tier is **Medium/High** (driven by security sensitivity
High — postinstall is a supply-chain vector). The architect's recommendation (≤40% for
script-touching stories; 80–100% for documentation-only stories) is adopted as the default;
where unsure, the stricter (lower) cap is used.

The postinstall contract (ADR 0002) is binding on every implementation story: idempotent,
safe-append, exit-0, cwd-scoped, deterministic (no network/`child_process`/`http`/`https`/`net`/
`fetch`/`dns` imports, no `Date`/`Math.random` driving content), direct-dependency-only
(transitive suppression; `peerDependencies`/`optionalDependencies` do NOT count as direct),
pointer-line content fixed (em dash `—` U+2014, exact wording).

## Story breakdown

### zero-edit-install-S01 — ADR 0002 + contract-file supersession edits (architect-owned residual)

- **Title:** ADR 0002 + `ARCHITECTURE.md` + `docs/BUSINESS_LOGIC.md` supersession edits.
- **Description:** The architect (`sdlc-architect`) has ALREADY produced ADR 0002 and edited
  `ARCHITECTURE.md` (rule 6 narrowed, Constraints + Stack + "must NOT change" list updated) and
  `docs/BUSINESS_LOGIC.md` (non-goal narrowed) as part of passing the Architecture Gate. This
  story exists for traceability: it captures the contract-file edits so the DoD audit can verify
  AC-D1/D2/D3 were satisfied. If any residual edit is found missing at DoD, it is routed back to
  the architect (NOT to dev — the architect owns these files).
- **ACs satisfied:** AC-D1, AC-D2, AC-D3.
- **Owner:** `sdlc-architect` (already done). Not reassigned to dev.
- **Risk axes:** business Medium, technical Low, security Medium (touches the invariant
  surface), data Low, infra Low, financial Low, breaking-change Medium.
- **Risk tier:** Medium.
- **Autonomy cap:** N/A (architect-owned, not dev-implemented; already complete as of the
  Architecture Gate pass).
- **Required human approvals:** Architecture Gate (already requested with the architecture
  artifact; recorded in the DoD audit per AC-D6).
- **Complexity:** S.
- **Status:** Done (architect passed the gate).

### zero-edit-install-S02 — `scripts/postinstall.js` implementation

- **Title:** Implement the postinstall script.
- **Description:** Create `scripts/postinstall.js` (CommonJS, `"type": "commonjs"`) implementing
  the postinstall contract per ADR 0002 and the architecture artifact. The script:
  1. Reads `<cwd>/package.json` (`fs.readFileSync` + `JSON.parse` in try/catch); if missing or
     unreadable → no-op, exit 0 (EC-16).
  2. Checks `dependencies` and `devDependencies` for `@daochild/agents-config`; if not direct
     (including peer/optional-only, EC-17) → no-op, exit 0 (AC-11, EC-14). Optional fast-path:
     `process.env.npm_package_name` hint, but `<cwd>/package.json` is authoritative.
  3. If `AGENTS.md` is a symlink → skip, debug note, exit 0 (EC-8).
  4. If no `AGENTS.md` in cwd:
     - no `--init` → print notice, no file created, exit 0 (AC-5).
     - `--init` → create minimal `AGENTS.md` (`# <cwd-basename>` + blank + pointer line +
       trailing newline) via temp-file + rename, exit 0 (AC-6).
  5. If `AGENTS.md` exists and contains the canonical pointer line (exact byte match,
     present-anywhere) → no-op, exit 0 (AC-2, EC-4, EC-5).
  6. If `AGENTS.md` exists and does NOT contain the canonical line → insert it immediately after
     the first `# ` heading (or at the top if none), with blank-line separation, via temp-file +
     rename (atomic write, EC-15). Exit 0 (AC-1, AC-3).
  7. Every error path prints a notice to stdout and exits 0 (AC-7). No throws to non-zero.
  8. Uses only Node built-ins: `fs`, `path`, `process`. No `http`/`https`/`net`/`fetch`/`dns`/
     `child_process`. No `Date`/`Math.random` driving content (`process.pid` may be used only for
     the temp filename, not content — see architecture artifact EC-15 note) (AC-9).
- **ACs satisfied:** AC-1, AC-2, AC-3, AC-4, AC-5, AC-6, AC-7, AC-8, AC-9, AC-11, EC-1..EC-8,
  EC-14..EC-18 (the script-behavior ones).
- **Owner:** `sdlc-dev` (Implementation Gate).
- **Risk axes:** business Medium, technical Medium, security **High** (supply-chain vector),
  data Low, infra Low, financial Low, breaking-change Low–Medium.
- **Risk tier:** High (security-driven).
- **Autonomy cap:** **≤40%**. The dev may implement the script but the Security Gate
  (`sdlc-security`) and Code Review Gate (`sdlc-reviewer` + human) are mandatory and cannot be
  self-validated by dev. Static review + tests MUST block forbidden imports (`http`, `https`,
  `net`, `fetch`, `dns`, `child_process`) and assert exit-0 on every path.
- **Required human approvals:** Security Gate (high-risk), Code Review Gate (high-risk →
  senior/security review). Architecture Gate approval already covers the design; this story
  needs the Implementation Gate approval to start (AC-D6 — separate maintainer approval before
  dev dispatch).
- **Complexity:** M.
- **AI assumptions log:** `docs/stories/zero-edit-install-assumptions.md` (dev must create this
  per the Implementation Gate "AI assumptions are documented" item).

### zero-edit-install-S03 — `package.json` `postinstall` field

- **Title:** Wire the postinstall script in `package.json`.
- **Description:** Add `"postinstall": "node scripts/postinstall.js"` to `package.json`
  `scripts`. Do NOT change `main` (stays `"index.js"` — see architecture artifact AC-D5). Do NOT
  add any new dependency. Do NOT change `type` (stays `"commonjs"`).
- **ACs satisfied:** enables AC-1..AC-9, AC-11 (the script must be wired to run); AC-D5 (BL-1
  note — `main` unchanged).
- **Owner:** `sdlc-dev` (Implementation Gate). Small edit; pairs with S02.
- **Risk axes:** business Medium, technical Low, security **High** (this is what makes the
  script run at install time — the supply-chain activation point), data Low, infra Low,
  financial Low, breaking-change Medium (consumers who pin `--ignore-scripts` unaffected; CI
  policy may flag).
- **Risk tier:** High (security-driven — this is the on-switch).
- **Autonomy cap:** **≤40%**. Pairs with S02; same gate requirements.
- **Required human approvals:** Security Gate, Code Review Gate. Implementation Gate approval
  to start (AC-D6).
- **Complexity:** S.

### zero-edit-install-S04 — `README.md` update (both paths)

- **Title:** Document both the automatic (postinstall) and manual (one-line edit) paths.
- **Description:** Update `README.md` → "Installation" to:
  1. Keep the manual one-line edit as the **supported fallback**, explicitly labeled for
     consumers who use `--ignore-scripts` or whose CI rejects `postinstall`.
  2. Document the automatic path: `npm install --save-dev @daochild/agents-config` writes the
     pointer line automatically (idempotent, safe-append, exit-0); the consumer only restarts
     their agent session.
  3. Note the monorepo/workspace limitation (EC-10/EC-18 deferred — check `<cwd>/package.json`
     only; manual fallback covers it).
  4. Note the direct-dependency-only behavior (transitive installs are not modified).
  5. Note `--init` for consumers without an `AGENTS.md`.
- **ACs satisfied:** AC-10, and documents the EC-10/EC-14/EC-17 behaviors.
- **Owner:** `sdlc-dev` (Implementation Gate) — documentation, but tied to the change.
- **Risk axes:** business Low, technical Low, security Low, data Low, infra Low, financial Low,
  breaking-change Low (documentation only; no code).
- **Risk tier:** Low.
- **Autonomy cap:** **100%** (documentation, no script/contract touch). Still subject to the
  Code Review Gate (reviewer checks the README accurately describes the script's behavior — a
  wrong README is a contract drift risk, not a security risk).
- **Required human approvals:** none beyond the normal Code Review Gate (reviewer must confirm
  the README matches the implemented behavior).
- **Complexity:** S.

### zero-edit-install-S05 — `SECURITY.md` update (downstream, Security Gate)

- **Title:** Update `SECURITY.md` to cover the postinstall supply-chain surface.
- **Description:** `sdlc-security` (NOT dev) updates `SECURITY.md` at the Security Gate to cover:
  - the postinstall script is deterministic, network-free, telemetry-free, cwd-scoped,
    exit-0, direct-dependency-only (transitive suppressed);
  - consumers may use `--ignore-scripts`; the manual fallback exists;
  - the script's contract is in the "must NOT change without human approval" list (already
    added to `ARCHITECTURE.md` by the architect);
  - how to report a suspected postinstall-related issue (existing reporting channel).
- **ACs satisfied:** AC-D4.
- **Owner:** `sdlc-security` (Security Gate). NOT dev.
- **Risk axes:** business Low, technical Low, security Medium (touches the security policy
  surface), data Low, infra Low, financial Low, breaking-change Low.
- **Risk tier:** Medium (security-policy edit).
- **Autonomy cap:** security-policy edits are human-approval-gated; cap **≤40%** (the
  `sdlc-security` agent produces the update, but human approval at the Security Gate is
  required per AC-D6).
- **Required human approvals:** Security Gate human approval (high-risk change, AC-D6).
- **Complexity:** S.
- **Note:** This story is downstream of dev; it is listed here so SM seeds the traceability
  chain. `sdlc-security` owns it at the Security Gate.

### zero-edit-install-S06 — `docs/IMPLEMENTATION.md` update (BL-1 + change log)

- **Title:** Update `docs/IMPLEMENTATION.md` — BL-1 status + change log entry.
- **Description:** Update `docs/IMPLEMENTATION.md`:
  1. BL-1 status: "Stub" → "Partially resolved (postinstall only)". Note: `index.js` remains a
     stub; `main: "index.js"` is unchanged; a full plugin host hook is a separate concern
     (AC-D5).
  2. Add a change log entry for the zero-edit-install change (date, change description, author).
  3. Add `scripts/postinstall.js` and the `package.json` `postinstall` field to the
     "Implemented components" table (status: Done once S02/S03 pass their gates).
- **ACs satisfied:** AC-D5.
- **Owner:** `sdlc-dev` (Implementation Gate) — documentation.
- **Risk axes:** business Low, technical Low, security Low, data Low, infra Low, financial Low,
  breaking-change Low (documentation only).
- **Risk tier:** Low.
- **Autonomy cap:** **100%** (documentation). Subject to Code Review Gate (reviewer confirms
  the IMPLEMENTATION status accurately reflects what shipped).
- **Required human approvals:** none beyond Code Review Gate.
- **Complexity:** S.

### zero-edit-install-S07 — Tests (downstream, Testing Gate)

- **Title:** Test plan + test code for the postinstall script.
- **Description:** `sdlc-qa` produces the test plan at `docs/stories/zero-edit-install-tests.md`
  and test code under `tests/`. Tests MUST cover, at minimum:
  - AC-1: idempotent insert when line missing.
  - AC-2: no-op when line present (byte-for-byte unchanged).
  - AC-3: non-destructive (existing content preserved).
  - AC-4: exact pointer line (em dash).
  - AC-5: no `AGENTS.md`, no `--init` → notice, no file, exit 0.
  - AC-6: no `AGENTS.md`, `--init` → minimal file created.
  - AC-7: every error path exits 0 (permission error, unreadable file, unexpected throw).
  - AC-8: cwd-scoped (no parent/sibling/home write).
  - AC-9: static import block (`http`, `https`, `net`, `fetch`, `dns`, `child_process`
    forbidden; no `Date`/`Math.random` driving content) + runtime determinism.
  - AC-10: README documents both paths (assertion that the manual fallback text is present).
  - AC-11: direct-dependency-only (direct → writes; transitive → no-op; peer/optional-only →
    no-op; missing `package.json` → no-op).
  - EC-1..EC-18: each edge case has a test (symlink skip, atomic write, monorepo limitation
    documented, cross-manager smoke for npm/pnpm/bun at minimum).
- **ACs satisfied:** all ACs verified via tests; Testing Gate.
- **Owner:** `sdlc-qa` (Testing Gate). NOT dev.
- **Risk axes:** business Low, technical Medium (test design for idempotency/atomic/determinism
  has real edges), security Medium (tests enforce the security contract), data Low, infra Low,
  financial Low, breaking-change Low.
- **Risk tier:** Medium.
- **Autonomy cap:** **100%** for test generation (per the `sdlc-regulatory` table, test
  generation is 100%) — BUT the tests themselves must be reviewed at the Code Review Gate, and
  the Security Gate verifies the import-block test is effective. QA does not self-validate the
  script; QA validates the script via tests, and the reviewer validates QA.
- **Required human approvals:** Code Review Gate (human engineering review of the tests).
- **Complexity:** M.
- **Note:** Downstream of dev (S02/S03 must exist to test). Listed here to seed traceability.

## Cross-story traceability

| Story | ACs satisfied | Owner | Gate | Autonomy cap | Human approval |
|-------|---------------|-------|------|--------------|----------------|
| S01 | AC-D1, AC-D2, AC-D3 | `sdlc-architect` (done) | Architecture | N/A | Architecture Gate (requested) |
| S02 | AC-1..9, AC-11, EC-1..8,14..18 | `sdlc-dev` | Implementation | ≤40% | Security + Code Review + Implementation Gate start (AC-D6) |
| S03 | enables AC-1..9, AC-11; AC-D5 (main unchanged) | `sdlc-dev` | Implementation | ≤40% | Security + Code Review + Implementation Gate start |
| S04 | AC-10, documents EC-10/14/17 | `sdlc-dev` | Implementation | 100% | Code Review (accuracy) |
| S05 | AC-D4 | `sdlc-security` | Security | ≤40% | Security Gate human (AC-D6) |
| S06 | AC-D5 | `sdlc-dev` | Implementation | 100% | Code Review (accuracy) |
| S07 | all ACs verified | `sdlc-qa` | Testing | 100% (test gen) | Code Review (human review of tests) |

## Implementation sequencing

1. S02 + S03 (script + wiring) — must be implemented together; the script is dead code without
   the wiring, and the wiring is a no-op without the script.
2. S04 (README) — may be done in parallel with S02/S03; documents the contract.
3. S06 (IMPLEMENTATION.md) — after S02/S03 pass, to reflect shipped status.
4. S07 (tests) — after S02/S03; QA tests the implemented script.
5. S05 (SECURITY.md) — at the Security Gate, after dev; `sdlc-security` owns it.
6. S01 — already done (architect).

## Gate self-check (Architecture Gate — planning side)

- [x] Every story has a risk class and autonomy cap — table above; 7 axes per story.
- [x] High-risk stories have explicit required human approvals listed — S02/S03/S05 list
      Security + Code Review + (for S02/S03) Implementation Gate start (AC-D6).
- [x] Story ids are stable and referenced in downstream artifacts — `zero-edit-install-S01`..
      `S07`; downstream PR/tests/review will reference these ids.

All Architecture Gate (planning) items pass. No item is unchecked.

## Handoff

```
HANDOFF: sdlc-dev | artifact: docs/stories/zero-edit-install-stories.md | gate: pass
```

Per the orchestrator's instruction, this run STOPS here. `sdlc-dev` (S02 + S03 + S04 + S06) will
be dispatched in a separate run AFTER the maintainer approves the Implementation Gate (AC-D6).
The Security Gate (S05) and Testing Gate (S07) are downstream of dev and are dispatched in
their own runs after dev passes the Implementation Gate.

**Implementation Gate approval required before dev dispatch (AC-D6):** the maintainer must
explicitly approve starting implementation, because this is a Medium/High-risk change
(security sensitivity High). The orchestrator will prompt for that approval in the next run.