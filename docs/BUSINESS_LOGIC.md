# Business Logic

> Business requirements and logic for the `agents-config` repository.
> AGENTS.md "General Recommendations" / "Documentation Maintenance" require this file.

## Purpose

`agents-config` exists to give AI coding agents (opencode and Claude Code) a **single, shared, version-controlled
configuration source** so that:

1. Agent behavior is consistent across projects and across tools.
2. Conventions, skills, subagents, and rules are inherited, not copy-pasted.
3. The AI-Driven SDLC (gates, risk model, traceability, compliance) is always-on by default for any consuming project.
4. New AI capabilities can be added once and propagate to every consumer via an npm update.

## Stakeholders

- **Maintainer**: Pavlo Bolhar (`package.json` author).
- **Consumers**: any project that installs `@daochild/agents-config` as a dev dependency and points its `AGENTS.md` at
  the package.
- **End users**: developers using opencode or Claude Code on those consumer projects.

## Core requirements

| ID   | Requirement                                             | Status                                                                               |
|------|---------------------------------------------------------|--------------------------------------------------------------------------------------|
| BR-1 | Single source of truth for agent layout and conventions | Met by `AGENTS.md`                                                                   |
| BR-2 | Works in both opencode and Claude Code from one config  | Met by triple-mirror model                                                           |
| BR-3 | Skills are loadable expertise, reusable across agents   | Met by `skills.paths` union in `opencode.json`                                       |
| BR-4 | SDLC gates are always-on, not opt-in                    | Met by `sdlc-gates` rule in `opencode.json` instructions + `.claude/rules/`          |
| BR-5 | AI never self-validates its own work                    | Met by separate `sdlc-reviewer` / `sdlc-security` / `sdlc-auditor` agents            |
| BR-6 | High-risk changes require human approval                | Met by autonomy caps + human approval gates in `sdlc-regulatory` skill               |
| BR-7 | Changes are traceable to requirements                   | Met by the traceability block in the DoD audit artifact                              |
| BR-8 | Config is portable across Node ecosystems               | Met by npm packaging; consumer picks package manager                                 |
| BR-9 | Repo is itself AI-readable (dogfoods its own contract)  | Met by `AGENTS.md` + `ARCHITECTURE.md` + `SECURITY.md` + `CONTRIBUTING.md` + `docs/` |

## Non-goals

- This repo does not ship runtime application code.
- This repo does not deploy anything; it has no `services/`, `tests/`, or
  `infrastructure/` of its own (those dirs are part of the contract for consuming projects, not for this config
  package).
- This repo does not replace opencode's or Claude Code's own configuration schemas; it conforms to them (`opencode.json`
  is pinned to the opencode config schema).

## Scope of the SDLC framework

The `sdlc-regulatory` skill + `sdlc-*` subagents + `sdlc-gates` rule implement the AI-Driven Software Development
Lifecycle. The original specification lived in
`SOW.md` and has been **fully absorbed into the `sdlc-regulatory` skill** (the skill header records that it supersedes
the deleted `SOW.md`). The business logic of the SDLC — gates, risk model, autonomy caps, traceability, Definition of
Done, compliance crosswalk — lives in that skill, not in this file. This file records *why* the SDLC framework exists as
a business requirement (BR-4 through BR-7).

## Change log

| Date       | Change                                          | Author     |
|------------|-------------------------------------------------|------------|
| 2026-08-18 | Bumped version to 1.1.0; broadened package metadata (description/keywords) to cover the SDLC governance scope introduced today | maintainer |
| 2026-08-18 | Initial creation; absorbed SOW business context | maintainer |