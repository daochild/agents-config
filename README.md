# AGENTS CONFIG

This repository contains configuration and tooling for the Opencode and Claude Code AI agents. It defines the project layout, skills, agents, commands and plugins used to orchestrate AI‑powered development workflows.

The package is intended for production‑grade automation: version control, CI/CD, and collaboration across development teams. Extend the configuration as needed for your ecosystem.

## What's in the box

- **Shared layout & conventions** — `AGENTS.md` is the single source of truth, inherited (not copied) by consuming projects.
- **Triple-mirror model** — every subagent / skill / command / rule is mirrored across `.opencode/`, `.claude/`, and `.agents/` so it works in opencode, Claude Code, and any Agent-Skills-compatible client (see ADR 0001).
- **AI-Driven SDLC framework** — `sdlc-regulatory` skill + 10 `sdlc-*` subagents + `sdlc-gates` rule + `/sdlc` command. Gates run in order (requirement → architecture → implementation → testing → security → review → deployment → DoD), AI never self-validates, high-risk changes require human approval, and a compliance crosswalk covers EU AI Act / NIST AI RMF / ISO 42001 / SOC 2 / GDPR.
- **Domain skills** — `senior-qa`, `senior-solidity-auditor`, `senior-bitcoin-auditor`, `senior-frontend-dev`, `senior-software-developer`, `senior-ux-ui-designer`, `archivarius`, `data-engineer`, `find-skills`, `frontend-design`.
- **Always-on rules** — `programming-best-practices` and `sdlc-gates`.
- **AI-readable contract** — `ARCHITECTURE.md`, `CONTRIBUTING.md`, `SECURITY.md`, `docs/` (business logic, implementation status, ADRs).

## Installation

Install as a **dev dependency** (this package configures local development tooling):

```bash
# npm / yarn / pnpm / bun
npm install --save-dev @daochild/agents-config
yarn add --dev @daochild/agents-config
pnpm add --save-dev @daochild/agents-config
bun add --dev @daochild/agents-config
```

Then add this one line at the top of your project's `AGENTS.md`, immediately after
the title, so the agent inherits this package as its primary instructions source:

```markdown
Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.
```

Restart your agent session (opencode or Claude Code) so the new instructions take
effect — config is loaded once at startup and is not hot-reloaded.

## License

MIT