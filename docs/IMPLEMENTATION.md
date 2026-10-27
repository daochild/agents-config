# Implementation

> Implementation plan, status, and progress for the `agents-config` repository.
> AGENTS.md "General Recommendations" / "Documentation Maintenance" require this file.

## Status: stable

The repository is production-published as `@daochild/agents-config` (see
`package.json`). The core configuration model (shared instruction sources, client-specific counterparts, single source of truth, skill/subagent split) is stable.
The SDLC regulatory framework was added in the current cycle and is the most recent significant feature.

## Implemented components

| Component                       | Status | Location                                                                                                                                                                                                | Notes                                      |
|---------------------------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| Root instructions (`AGENTS.md`) | Done   | `AGENTS.md`                                                                                                                                                                                             | Single source of truth                     |
| opencode config                 | Path alignment needed | `opencode.json`                                                                                                                                                                               | Schema-pinned; audit agent prompts and always-on instructions against `instructions/` sources |
| Shared instruction sources      | Done   | `instructions/{agent,command,rules,skills}/`                                                                                                                                                            | OpenCode-facing source content             |
| Client-specific counterparts    | Maintained as needed | `.claude/`, `.agents/`                                                                                                                                                                   | Keep formats and content aligned           |
| Always-on rules                 | Done   | `instructions/rules/`, `opencode.json` instructions                                                                                                                                                     | `programming-best-practices`, `sdlc-gates`, `harness-engineering` |
| Harness engineering guidance    | Done   | `instructions/skills/harness-engineering/`, `instructions/rules/`                                                                                                                                       | Context, host-enforced policy, bounded tools, independent verification, privacy-aware observability |
| SDLC regulatory skill           | Done   | `instructions/skills/sdlc-regulatory/SKILL.md`                                                                                                                                                          | Supersedes deleted `SOW.md`                |
| SDLC orchestrator               | Done   | `instructions/agent/sdlc-orchestrator.md`                                                                                                                                                               | Entry point for `/sdlc`                    |
| SDLC role subagents (×9)        | Done   | `instructions/agent/sdlc-{analyst,pm,architect,sm,dev,qa,security,reviewer,auditor}.md`                                                                                                                | One per gate                               |
| `/sdlc` command                 | Done   | `instructions/command/sdlc.md`                                                                                                                                                                          | Invokes orchestrator                       |
| Domain skills                   | Done   | `instructions/skills/{archivarius,data-engineer,find-skills,frontend-design,harness-engineering,senior-bitcoin-auditor,senior-frontend-dev,senior-qa,senior-software-developer,senior-solidity-auditor,senior-ux-ui-designer}/` | Loaded on demand                           |
| AI-readable contract files      | Done   | `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`                                                                                                                                            | This cycle                                 |
| `index.js` entry                | Stub   | `package.json` → `main`                                                                                                                                                                                 | Placeholder; no runtime code yet           |
| Postinstall pointer script      | Done   | `scripts/postinstall.js`, `package.json` → `scripts.postinstall`                                                                                                                                        | Per ADR 0002; constrained install-time helper |

## In progress

- Nothing actively in progress.

## Backlog

| ID   | Item                                                         | Priority | Notes                                               |
|------|--------------------------------------------------------------|----------|-----------------------------------------------------|
| BL-1 | Add a real `index.js` entry if plugins need a host hook      | low      | Partially resolved (postinstall only); a full plugin host hook remains a separate concern. `package.json` `main: "index.js"` is unchanged — the postinstall script (`scripts/postinstall.js`) is a constrained install-time helper per ADR 0002, not the package's main entry. Reconciling `main` with a real `index.js` host hook is still open. |
| BL-2 | Seed `docs/api/` if the plugin interface becomes public      | low      | Config-only repo has no public API today            |
| BL-3 | Seed `docs/database/` if any stateful metadata is introduced | low      | Config-only repo has no database                    |
| BL-4 | Add CI workflow to verify maintained client counterparts on PR | medium | See `CONTRIBUTING.md` consistency checks           |
| BL-5 | Record an ADR for shared instruction sources                 | low      | Architecture decision documentation                 |
| BL-6 | Operationalize harness engineering principles in shared config | medium | Implemented as shared skill and rule; runtime enforcement remains the consumer host's responsibility. |

## Definition of Done (per the `sdlc-regulatory` skill)

Every change to this repo should be able to check off the DoD checklist in the
`sdlc-regulatory` skill. For config-only changes (no code, no deploy), the
"Deployment successfully validated" item is satisfied by "npm publish succeeds and a consumer can install the new
version"; the "Observability" item is satisfied by
"the change is documented in this file and in `AGENTS.md`/`ARCHITECTURE.md` as relevant".

## Change log

2026-10-27: Implemented shared harness-engineering guidance and host/runtime boundaries; see
the `harness-engineering` story and assumptions log for scope, validation, review, and gate
limitations.

| Date       | Change                                                                                                                                                                                                                       | Author     |
|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| 2026-10-26 | Researched harness engineering sources, assessed the supplied six-component model, and documented a configuration-only implementation proposal. No runtime or agent configuration behavior changed; architecture approval is pending. | maintainer |
| 2026-08-18 | Bumped version to 1.1.0 (minor) for the SDLC feature release; updated `package.json` description and keywords to reflect the SDLC/governance scope.                                                                          | maintainer |
| 2026-08-18 | Simplified `README.md` install section: collapsed "After installation" into "Installation"; replaced 3-line `AGENTS.md` block with a single pointer line. No contract change (no postinstall/bin; respects the "no runtime code" invariant). | maintainer |
| 2026-08-18 | Added SDLC regulatory framework (skill + 10 subagents + rule + command); absorbed `SOW.md` into the skill; deleted `SOW.md`; added AI-readable contract files (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`) | maintainer |
| 2026-08-18 | Implemented postinstall zero-edit install (S02+S03+S04+S06) per ADR 0002 + architecture artifact. Added `scripts/postinstall.js` (CommonJS, Node built-ins only) wired via `package.json` `scripts.postinstall`; updated `README.md` to document both the automatic (postinstall) and manual (one-line edit) paths; updated BL-1 status to "Partially resolved (postinstall only)". Narrowed `ARCHITECTURE.md` rule 6 and `docs/BUSINESS_LOGIC.md` non-goal per ADR 0002. `SECURITY.md` update deferred to the Security Gate (S05); tests deferred to the Testing Gate (S07). | sdlc-dev (Implementation Gate) |