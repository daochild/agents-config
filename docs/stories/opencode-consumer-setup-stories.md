# Stories — opencode-consumer-setup

> SDLC stage 4 (Implementation planning). Owner: `sdlc-sm`.
> Traceability id (slug): `opencode-consumer-setup`.
> Inputs: `docs/business/opencode-consumer-setup-prd.md`,
> `docs/architecture/opencode-consumer-setup.md`, and
> `docs/adr/0004-opencode-consumer-setup.md`.

## Overall risk and autonomy

Overall risk: **Medium**. The explicit local CLI can change consumer OpenCode
configuration, so filesystem boundaries, unknown-field preservation, failure
semantics, and pnpm-style symlink resolution must be validated independently.
The cap below is a conservative planning value for this medium-risk change; it
does not authorize skipping any SDLC gate.

| Story | Risk tier | Autonomy cap | Complexity |
|---|---|---:|---|
| `opencode-consumer-setup-S01` — implement setup CLI | Medium | 70% | M |
| `opencode-consumer-setup-S02` — tests and consumer-path validation | Medium | 100% | M |
| `opencode-consumer-setup-S03` — consumer documentation | Low | 100% | S |

The architecture approach was approved by the user for this preparation
(2026-11-17). Human implementation authorization, independent Security Gate and
Code Review decisions, and deployment/publish approval are not recorded as
complete. AI-authored implementation must not be its sole review.

## `opencode-consumer-setup-S01` — Implement explicit config setup CLI

- **Description:** Add `scripts/setup-opencode.js` using Node built-ins. It
  validates a direct dependency, resolves the package source through symlinked
  layouts, and creates or merges consumer-root strict JSON according to
  AC-1–AC-9 and AC-13.
- **Acceptance criteria:** PRD AC-1–AC-9 and AC-13.
- **Risk axes:** business Medium; technical Medium; security Medium; data Low;
  infrastructure Low; financial Low; breaking-change Low.
- **Risk tier:** Medium.
- **AI autonomy cap:** 70%.
- **Required approvals:** Approved Architecture Gate is recorded. Obtain
  independent Security Gate and human engineering review before advancing;
  keep deployment/publish authorization pending until its gate.
- **Complexity / approximate effort:** M; approximately 3–5 engineering hours.
- **Dependencies:** none.

## `opencode-consumer-setup-S02` — Validate CLI behavior and package resolution

- **Description:** Add tests for the acceptance criteria and verify the actual
  packaged CLI can be invoked from a consumer root. Include the pnpm-style
  symlink case; test filesystem boundaries and no-write rejection paths.
- **Acceptance criteria:** Tests cover AC-2–AC-8, AC-11, and AC-13, including
  clean creation, semantic preservation of unknown fields, idempotence,
  malformed JSON/containers, JSONC-only and dual-file conflicts, symlink and
  non-regular targets, direct-dependency rejection, and symlinked installed
  package assets.
- **Risk axes:** business Low; technical Medium; security Medium; data Low;
  infrastructure Low; financial Low; breaking-change Low.
- **Risk tier:** Medium.
- **AI autonomy cap:** 100% for test generation; tests do not replace independent
  security or human code review.
- **Required approvals:** Independent review of the test adequacy at Code
  Review; Security Gate validates filesystem and config-safety coverage.
- **Complexity / approximate effort:** M; approximately 3–5 engineering hours.
- **Dependencies:** S01.

## `opencode-consumer-setup-S03` — Document consumer setup and checker invocation

- **Description:** Update README installation/consumer instructions to show
  the explicit setup command, direct-dependency expectation, restart step,
  JSONC manual path, and the packaged Prompt Sanity CLI.
- **Acceptance criteria:** PRD AC-9, AC-12, and AC-13. Documentation uses
  `node node_modules/@daochild/agents-config/scripts/setup-opencode.js` and
  `node node_modules/@daochild/agents-config/scripts/prompt-sanity-check.mjs`;
  it does not claim that consumer projects inherit the package's
  `npm run prompt-sanity:check` script or that setup runs automatically.
- **Risk axes:** business Low; technical Low; security Low; data Low;
  infrastructure Low; financial Low; breaking-change Low.
- **Risk tier:** Low.
- **AI autonomy cap:** 100% for documentation; independent review confirms
  accuracy against the implemented CLI.
- **Required approvals:** Normal independent Code Review; no additional
  high-risk approval identified for this documentation-only story.
- **Complexity / approximate effort:** S; approximately 1–2 engineering hours.
- **Dependencies:** S01, so documented behavior matches the implementation.

## Sequencing and gate status

1. S01 implements the CLI.
2. S02 validates it and the packaged/pnpm-symlink invocation.
3. S03 documents the verified consumer flow.
4. Run independent security and code review; preserve deployment/publish as a
   pending gate until actual validation and authorization exist.

The current preparation completes analysis, PRD, architecture, and planning
artifacts only. No script, test, package, or README implementation work has
been performed.

## Planning Gate self-check

- [x] Every story includes all seven risk axes, risk tier, autonomy cap, and
  complexity.
- [x] Approvals and pending gates are explicit; no downstream pass is claimed.
- [x] Stable story IDs are linked to PRD acceptance criteria.

```text
HANDOFF: sdlc-dev | artifact: docs/stories/opencode-consumer-setup-stories.md | gate: pass
```
