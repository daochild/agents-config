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

NodeJs stack.
Select your package manager. This package should be installed as a
**dev dependency** since it configures the local development tooling.

```bash
# Using npm
npm install --save-dev @daochild/agents-config
```
```bash
# Using yarn
yarn add --dev @daochild/agents-config
```
```bash
# Using pnpm
pnpm add --save-dev @daochild/agents-config
```
```bash
# Using bun
bun add --dev @daochild/agents-config
```

The package exposes a set of configuration files and scripts that can be consumed by the Opencode and Claude Code tooling.

## After installation

Add the following block at the top of your project's `AGENTS.md`, immediately
after the title, so the agent loads this package as its primary instructions
source:

```markdown
Primary instructions are located at:
- node_modules/@daochild/agents-config/AGENTS.md

Follow all instructions from that file unless overridden below.
```

Then restart your agent session (e.g. restart opencode or Claude Code) so
the new instructions take effect — config is loaded once at startup and is
not hot-reloaded.

## License

MIT