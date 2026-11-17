# Architecture — opencode-consumer-setup

> SDLC stage 3 (Architecture analysis). Owner: `sdlc-architect`.
> Traceability id (slug): `opencode-consumer-setup`.
> Input: `docs/business/opencode-consumer-setup-prd.md`.
> Companion ADR: `docs/adr/0004-opencode-consumer-setup.md`.

## Existing architecture analyzed

The repository is AI-readable. This preparation reviewed:

- `AGENTS.md` — package layout, instruction-source locations, config registration,
  the constrained postinstall contract, and setup/lifecycle boundaries.
- `ARCHITECTURE.md` — shared-source model, `opencode.json` registration, config
  startup behavior, and the postinstall invariant.
- `opencode.json` — current string-array `instructions` entries and
  `skills.paths` discovery pattern.
- `README.md`, `CONTRIBUTING.md`, and `SECURITY.md` — consumer installation,
  contribution, and host/security constraints.
- `instructions/rules/prompt-sanity-guard.md` and
  `instructions/skills/prompt-sanity/SKILL.md` — existing inherited source
  locations and user-facing behavior.
- `docs/BUSINESS_LOGIC.md`, `docs/IMPLEMENTATION.md`, and the existing
  `zero-edit-install` planning artifacts — package intent and the established
  postinstall boundary.
- `instructions/rules/sdlc-gates.md`,
  `instructions/rules/spec-based-docs.md`,
  `instructions/rules/harness-engineering.md`, the `sdlc-regulatory` skill, and
  the analyst/PM/architect/SM role prompts — gate and artifact requirements.

The package's `opencode.json` confirms the proposed registration shapes:
`instructions` is an array of path strings and `skills.paths` is an array of
directories. The rule and skill sources already exist; the consumer setup
registers references rather than adding or copying source files.

**Repository note:** `ARCHITECTURE.md` references ADR 0002, but
`docs/adr/0002-zero-edit-install.md` was absent from the current worktree during
preparation. This design does not reconstruct or modify it. The user explicitly
requires the existing `scripts/postinstall.js` contract to remain untouched.

## Approved architecture

Use the KISS approach approved by the user: add a standalone Node built-ins-only
CLI at `scripts/setup-opencode.js`. A consumer runs it explicitly from the
consumer root:

```bash
node node_modules/@daochild/agents-config/scripts/setup-opencode.js
```

The CLI validates that the package is a direct dependency, resolves its
installed source correctly when reached through a pnpm symlink, inspects only
the consumer-root configuration paths, and merges the two package-relative
registrations into a regular strict-JSON `opencode.json`.

The exact paths registered in the consumer config are:

```text
instructions:
  node_modules/@daochild/agents-config/instructions/rules/prompt-sanity-guard.md

skills.paths:
  node_modules/@daochild/agents-config/instructions/skills
```

The existing rule source is unchanged. Registering the package's skill directory
makes its bundled skill sources discoverable through OpenCode's existing
`skills.paths` mechanism; no skill content is copied.

### Config selection and merge behavior

1. Use only `process.cwd()` as the consumer root; never search ancestors or use
   `INIT_CWD`.
2. Require `@daochild/agents-config` in that root's `dependencies` or
   `devDependencies`. A missing, invalid, or non-direct declaration is an
   actionable failure.
3. Inspect both `opencode.json` and `opencode.jsonc` without following
   symlinks:
   - Neither exists: create `opencode.json` with the two required registration
     structures.
   - Only a regular `opencode.json` exists: parse strict JSON and merge.
   - Only `opencode.jsonc` exists: reject with instructions to add the entries
     manually to the existing JSONC config. Do not parse it or create a
     competing `opencode.json`.
   - Both exist: reject as ambiguous and ask the consumer to resolve the
     conflict manually.
   - Any target that is a symlink or non-regular file: reject without
     following, truncating, or replacing it.
4. Preserve all existing fields and values, including unknown options. Create
   absent arrays/objects as needed; reject incompatible container types without
   writing. Append an exact registration only when absent. Do not remove or
   reorder existing options.
5. Validate all preconditions before committing a write. Keep any temporary
   write artifact within the consumer root and clean it up on failure; never
   write to the package source, a parent directory, or a global location.
6. Emit actionable errors and a nonzero exit status for invalid states. On
   success, tell the user to restart OpenCode.

### Package-source resolution

The entry script must locate its own installed package assets rather than
assuming that `node_modules/@daochild/agents-config` is a physical directory.
Resolve/validate the source from the invoked script location while handling
symlinked package layouts (including pnpm). The strings written to config must
remain the consumer-root-relative paths above so OpenCode follows the package
manager's installed link. Add a focused integration check for this behavior
before claiming consumer compatibility.

### Security and operational boundaries

- This command is explicit and opt-in. It is not invoked by npm, yarn, pnpm, or
  bun lifecycle hooks.
- It performs a bounded local configuration merge only. There is no runtime
  prompt filtering, authorization decision, network access, telemetry, or
  external service.
- It does not copy or edit the inherited rule or skill.
- It does not change `package.json` lifecycle configuration or add a runtime
  dependency.
- `scripts/postinstall.js` remains untouched, including its existing cwd-only,
  safe/idempotent append, direct-dependency check, Node built-ins-only, and
  exit-0 contract.
- OpenCode reads config at startup; a successful setup requires an OpenCode
  restart.

## Impacted modules

| Area | Planned effect | Owner / stage |
|---|---|---|
| `scripts/setup-opencode.js` | New standalone explicit setup CLI; writes only consumer-root `opencode.json`. | `sdlc-dev` |
| `docs/business/opencode-consumer-setup-analysis.md` / `-prd.md` | Requirements and acceptance criteria for this change. | Analyst / PM |
| `docs/architecture/opencode-consumer-setup.md`, `docs/adr/0004-opencode-consumer-setup.md`, `ARCHITECTURE.md` | Architecture and decision record. | Architect |
| `docs/stories/opencode-consumer-setup-stories.md` | Sequencing, risk classification, autonomy caps, traceability. | `sdlc-sm` |
| `README.md` | Future consumer setup command, restart instructions, and packaged checker CLI path. | `sdlc-dev` |
| Tests | Future coverage of merge, boundaries, conflicts, and symlinked source resolution. | `sdlc-qa` |

No changes are planned to `scripts/postinstall.js`, `package.json`,
`opencode.json` in this repository, the existing rule/skill sources, mirrors,
plugins, dependencies, or lifecycle behavior.

## Dependencies and alternatives

- **Added dependencies:** none. Use Node built-ins only.
- **Lifecycle changes:** none.
- **Chosen:** explicit, consumer-root CLI for predictable scope and opt-in
  behavior.
- **Rejected — extend postinstall:** would change a deliberately constrained
  install-time helper and make an OpenCode-specific config mutation happen
  during package installation.
- **Rejected — runtime filter/plugin:** adds a runtime behavior surface rather
  than simply registering inherited instructions.
- **Rejected — copy the rule/skill:** duplicates sources and risks drift; the
  package must remain the source of truth.
- **Rejected — parse JSONC or shadow it:** supporting a second format expands
  parsing complexity; creating strict JSON beside an existing JSONC config
  risks ambiguous precedence. JSONC consumers receive manual instructions.

## Risk and approval

Overall risk is **Medium**, as classified in the analysis. Main risks are
accidental loss of consumer options, writing through a symlink, and OpenCode
failing to discover a symlinked package path. The prescribed merge, rejection
rules, and focused tests mitigate these risks. No change to runtime security
enforcement is claimed.

- Architecture approach: **APPROVED** by the user in the task instruction
  (2026-11-17).
- Requirement and architecture preparation gates: pass.
- Implementation, testing, Security Gate, independent code review, and
  deployment/publish validation: **pending**. No code has been implemented or
  reviewed in this preparation.

## Architecture Gate self-check

- [x] Existing architecture analyzed; source documents are listed above.
- [x] Impacted modules and non-impacted boundaries are identified.
- [x] No dependencies or lifecycle changes are introduced.
- [x] ADR 0004 and root architecture update are recorded.

```text
HANDOFF: sdlc-sm | artifacts: docs/architecture/opencode-consumer-setup.md, docs/adr/0004-opencode-consumer-setup.md, ARCHITECTURE.md | gate: pass
```
