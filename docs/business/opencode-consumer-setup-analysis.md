# Analysis — opencode-consumer-setup

> SDLC stage 1 (Requirements analysis) artifact. Owner: `sdlc-analyst`.
> Traceability id (slug): `opencode-consumer-setup`.
> Gate: Requirement (analyst half).

## Problem / opportunity

`@daochild/agents-config` contains the `prompt-sanity-guard` rule and the
`prompt-sanity` skill, and its own `opencode.json` registers their source paths.
Inheriting this package's `AGENTS.md` does not itself register those sources in a
consumer's OpenCode configuration. Consumer projects therefore need a safe,
repeatable way to add the package-provided rule and skill discovery path to their
own `opencode.json`, without copying the sources or changing the package's
install lifecycle.

The maintainer approved a KISS approach: an explicit Node.js setup CLI, run from
the consumer project root. This is opt-in configuration, not an automatic
postinstall action or a runtime filter.

## Stakeholders and intended users

| Stakeholder | Role / interest |
|---|---|
| Consumer developer | Explicitly enables the inherited Prompt Sanity guidance for OpenCode. |
| Consumer project maintainers | Need existing OpenCode options preserved and conflicts reported without data loss. |
| `agents-config` maintainer | Maintains a single source for the rule and skill and protects the existing postinstall contract. |
| Consumer security reviewers | Need a bounded, inspectable setup action with clear failure behavior. |

## Context and constraints

- The package's root `opencode.json` demonstrates the supported shape: rule files
  are listed as strings in `instructions`, and skill discovery locations are
  listed in `skills.paths`.
- The package rule and skill already exist under `instructions/`; this change
  registers those inherited sources and must not edit or copy them.
- Consumers explicitly run
  `node node_modules/@daochild/agents-config/scripts/setup-opencode.js` from
  their project root. The command must not be added to or invoked by a lifecycle
  script.
- Require `@daochild/agents-config` as a direct dependency in the consumer's
  `dependencies` or `devDependencies`. Resolve the installed package's sources
  correctly even when the package is symlinked by pnpm.
- Read and write only the consumer's current working directory. Do not search
  ancestor directories or use `INIT_CWD`.
- Support strict JSON only. Do not parse or overwrite `opencode.jsonc`; if it
  exists, report actionable manual setup instructions. If both config variants
  exist, reject the ambiguous state.
- Do not follow or replace symlinks and do not overwrite non-regular config
  files. Merge idempotently and preserve unknown configuration fields.
- Do not add a dependency, change lifecycle behavior, add a plugin, introduce a
  runtime filter, or copy package sources into a consumer.
- Leave `scripts/postinstall.js` and its constrained contract untouched. The
  existing install-time helper remains exit-0 and does not become an OpenCode
  configuration writer.
- Consumer-facing documentation must use the packaged CLI path
  `node node_modules/@daochild/agents-config/scripts/prompt-sanity-check.mjs`;
  the package's own `npm run prompt-sanity:check` script is not installed as a
  consumer npm script.

## Crisp requirement

Provide a standalone, Node built-ins-only CLI at
`scripts/setup-opencode.js`. When a consumer with a direct dependency runs it
from the consumer root, it safely creates or merges `opencode.json` to add the
unique rule entry
`node_modules/@daochild/agents-config/instructions/rules/prompt-sanity-guard.md`
to `instructions` and the unique skill path
`node_modules/@daochild/agents-config/instructions/skills` to `skills.paths`.
It must preserve existing options and unknown fields, reject unsupported or
unsafe config states without writing, and provide actionable errors with a
nonzero exit status. It must not alter package lifecycle behavior or the
existing postinstall helper.

## Assumptions and unknowns

- The OpenCode config schema continues to accept the current package's
  `instructions` string-array and `skills.paths` string-array conventions.
  Implementation must verify against the supported OpenCode configuration
  contract and test the resulting paths through a pnpm-style symlink.
- The consumer runs the command from the directory whose configuration should
  be updated; this explicit contract removes workspace-root guessing.
- A consumer using JSONC must follow manual instructions rather than having the
  tool create a competing `opencode.json`.
- Startup caching means consumers restart OpenCode after successful setup.

## Preliminary risk classification

| Axis | Assessment |
|---|---|
| Business impact | Medium — affects whether consumer projects load shared prompt-safety guidance. |
| Technical complexity | Medium — filesystem boundaries, config merge behavior, and symlinked package resolution. |
| Security sensitivity | Medium — explicit local config mutation; no runtime filter or automatic lifecycle execution. |
| Data sensitivity | Low — configuration only; no personal data or secrets are required. |
| Infrastructure impact | Low — no service or infrastructure changes. |
| Financial impact | Low — no payment or billing path. |
| Breaking-change probability | Low — additive, explicit setup; unsupported config formats fail closed. |

Overall: **Medium risk**. The Architecture Gate has user approval for the KISS
approach; implementation, security, independent review, and deployment evidence
remain pending.

## Analyst handoff

The requirement is defined and the constraints, risks, and assumptions are
surfaced. Acceptance criteria are owned by the PM.

```text
HANDOFF: sdlc-pm | artifact: docs/business/opencode-consumer-setup-analysis.md | gate: pass
```
