# AGENTS CONFIG

This repository contains configuration and tooling for the Opencode and Claude Code AI agents. It defines the project layout, skills, agents, commands and plugins used to orchestrate AI‑powered development workflows.

The package is intended for production‑grade automation: version control, CI/CD, and collaboration across development teams. Extend the configuration as needed for your ecosystem.

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