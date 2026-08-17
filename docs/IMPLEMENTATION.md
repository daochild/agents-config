# Implementation

> Implementation plan, status, and progress for the `agents-config` repository.
> AGENTS.md "General Recommendations" / "Documentation Maintenance" require this file.

## Status: stable

The repository is production-published as `@daochild/agents-config` (see
`package.json`). The core configuration model (triple-mirror, single source of truth, skill/subagent split) is stable.
The SDLC regulatory framework was added in the current cycle and is the most recent significant feature.

## Implemented components

| Component                       | Status | Location                                                                                                                                                                                                | Notes                                      |
|---------------------------------|--------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------|
| Root instructions (`AGENTS.md`) | Done   | `AGENTS.md`                                                                                                                                                                                             | Single source of truth                     |
| opencode config                 | Done   | `opencode.json`                                                                                                                                                                                         | Schema-pinned; 11 agents registered        |
| Cross-client fallback           | Done   | `.agents/`                                                                                                                                                                                              | Verbatim mirrors                           |
| Claude Code config              | Done   | `.claude/`                                                                                                                                                                                              | `CLAUDE.md` sources `AGENTS.md`            |
| Always-on rules                 | Done   | `.claude/rules/`, `.agents/rules/`, `opencode.json` instructions                                                                                                                                        | `programming-best-practices`, `sdlc-gates` |
| SDLC regulatory skill           | Done   | `.opencode/skill/sdlc-regulatory/` (+ mirrors)                                                                                                                                                          | Supersedes deleted `SOW.md`                |
| SDLC orchestrator               | Done   | `.opencode/agent/sdlc-orchestrator.md` (+ mirrors)                                                                                                                                                      | Entry point for `/sdlc`                    |
| SDLC role subagents (×9)        | Done   | `.opencode/agent/sdlc-{analyst,pm,architect,sm,dev,qa,security,reviewer,auditor}.md` (+ mirrors)                                                                                                        | One per gate                               |
| `/sdlc` command                 | Done   | `.opencode/command/sdlc.md` (+ mirrors)                                                                                                                                                                 | Invokes orchestrator                       |
| Domain skills                   | Done   | `.opencode/skill/{senior-qa,senior-solidity-auditor,senior-bitcoin-auditor,senior-frontend-dev,senior-software-developer,senior-ux-ui-designer,archivarius,data-engineer,find-skills,frontend-design}/` | Loaded on demand                           |
| AI-readable contract files      | Done   | `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`                                                                                                                                            | This cycle                                 |
| `index.js` entry                | Stub   | `package.json` → `main`                                                                                                                                                                                 | Placeholder; no runtime code yet           |

## In progress

- Nothing actively in progress.

## Backlog

| ID   | Item                                                         | Priority | Notes                                               |
|------|--------------------------------------------------------------|----------|-----------------------------------------------------|
| BL-1 | Add a real `index.js` entry if plugins need a host hook      | low      | Only if a plugin requires programmatic registration |
| BL-2 | Seed `docs/api/` if the plugin interface becomes public      | low      | Config-only repo has no public API today            |
| BL-3 | Seed `docs/database/` if any stateful metadata is introduced | low      | Config-only repo has no database                    |
| BL-4 | Add CI workflow to verify triple-mirror consistency on PR    | medium   | See `CONTRIBUTING.md` verify script                 |
| BL-5 | Record an ADR for the triple-mirror decision                 | low      | `docs/adr/0001-triple-mirror.md`                    |

## Definition of Done (per the `sdlc-regulatory` skill)

Every change to this repo should be able to check off the DoD checklist in the
`sdlc-regulatory` skill. For config-only changes (no code, no deploy), the
"Deployment successfully validated" item is satisfied by "npm publish succeeds and a consumer can install the new
version"; the "Observability" item is satisfied by
"the change is documented in this file and in `AGENTS.md`/`ARCHITECTURE.md` as relevant".

## Change log

| Date       | Change                                                                                                                                                                                                                       | Author     |
|------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|------------|
| 2026-08-18 | Bumped version to 1.1.0 (minor) for the SDLC feature release; updated `package.json` description and keywords to reflect the SDLC/governance scope.                                                                          | maintainer |
| 2026-08-18 | Simplified `README.md` install section: collapsed "After installation" into "Installation"; replaced 3-line `AGENTS.md` block with a single pointer line. No contract change (no postinstall/bin; respects the "no runtime code" invariant). | maintainer |
| 2026-08-18 | Added SDLC regulatory framework (skill + 10 subagents + rule + command); absorbed `SOW.md` into the skill; deleted `SOW.md`; added AI-readable contract files (`ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/`) | maintainer |