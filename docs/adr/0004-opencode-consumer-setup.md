# ADR 0004: Explicit OpenCode consumer setup

- **Status:** Accepted (architecture approval per user instruction)
- **Date:** 2026-11-17
- **Traceability ID:** `opencode-consumer-setup`
- **Risk:** Medium

## Context

The package already contains the `prompt-sanity-guard` rule and `prompt-sanity`
skill. Its own `opencode.json` registers a rule source in `instructions` and a
skill directory in `skills.paths`. A consumer inheriting the package's
`AGENTS.md` does not automatically add those entries to the consumer's
OpenCode configuration.

The existing `scripts/postinstall.js` is a deliberately constrained,
cwd-scoped, exit-0 install helper. The requested OpenCode setup must not alter
that contract, change lifecycle behavior, or add dependencies.

## Decision

Add a standalone Node built-ins-only CLI at `scripts/setup-opencode.js`. A
consumer explicitly runs it from the consumer root:

```bash
node node_modules/@daochild/agents-config/scripts/setup-opencode.js
```

The CLI requires `@daochild/agents-config` to be a direct dependency in the
consumer-root `dependencies` or `devDependencies`; resolves its installed
source correctly through symlinked layouts such as pnpm; and modifies only the
consumer-root OpenCode config.

For regular strict-JSON `opencode.json`, merge these unique consumer-relative
entries while preserving existing fields:

```text
instructions:
  node_modules/@daochild/agents-config/instructions/rules/prompt-sanity-guard.md

skills.paths:
  node_modules/@daochild/agents-config/instructions/skills
```

Create `opencode.json` only if neither supported config name exists. If
`opencode.jsonc` exists alone, reject with manual instructions instead of
parsing it or creating a shadowing file. If both `opencode.json` and
`opencode.jsonc` exist, reject the ambiguous state. Reject symlinks,
non-regular files, malformed strict JSON, and incompatible config structures
without writing. Errors must be actionable and nonzero; success instructs the
consumer to restart OpenCode.

## Alternatives considered

1. **Chosen — explicit consumer-root setup CLI.** Simple, opt-in, bounded to
   the intended consumer directory, independent of package-manager lifecycle
   behavior.
2. **Change or extend `postinstall`.** Rejected because it would change the
   constrained helper's behavior and perform an OpenCode-specific config
   mutation automatically during installation.
3. **Runtime prompt filter or plugin.** Rejected; the requirement is to make
   inherited instruction sources discoverable, not to add runtime filtering or
   a new enforcement mechanism.
4. **Copy the rule/skill into consumers.** Rejected because it duplicates the
   source and permits drift.
5. **Parse JSONC or write JSON beside it.** Rejected for this bounded change.
   JSONC consumers receive manual instructions; a second config beside an
   existing JSONC file could create ambiguous behavior.

## Consequences

- Consumers opt in by running a command; there is no automatic lifecycle
  action.
- Strict JSON config is merged idempotently. Existing unknown fields are
  retained; unsupported or unsafe structures fail without a write.
- JSONC-only consumers must add the two paths manually to their existing
  config and restart OpenCode.
- Registration points to package-owned sources; no rule/skill is copied or
  modified. The `skills.paths` entry is the package's skill directory, matching
  the discovery form used by this repository.
- Package dependencies and lifecycle scripts remain unchanged. The existing
  `scripts/postinstall.js` is explicitly out of scope and remains untouched.
- The consumer README must document both the setup command and the packaged
  checker command
  `node node_modules/@daochild/agents-config/scripts/prompt-sanity-check.mjs`.
- The package's OpenCode config is loaded at startup; consumers restart OpenCode
  after setup.
- The CLI is configuration setup, not an authorization boundary or runtime
  security filter. Security enforcement remains the consuming host's
  responsibility.

## Approval and validation

The user approved this KISS architecture in the task instruction on
2026-11-17. This records architecture approval only. Implementation, tests,
Security Gate, independent Code Review, and deployment/publish validation are
pending; none is claimed to have passed.
