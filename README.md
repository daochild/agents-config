# AGENTS CONFIG

This repository contains configuration and tooling for the Opencode and Claude Code AI agents. It defines the project layout, skills, agents, commands and plugins used to orchestrate AI‑powered development workflows.

The package is intended for production‑grade automation: version control, CI/CD, and collaboration across development teams. Extend the configuration as needed for your ecosystem.

## What's in the box

- **Shared layout & conventions** — `AGENTS.md` is the single source of truth, inherited (not copied) by consuming projects.
- **Shared instruction sources** — OpenCode-facing agents, commands, rules, and skills are organized under `instructions/`; `opencode.json` declares the paths used by OpenCode. Keep configured paths aligned with the files and maintain Claude Code or Agent Skills counterparts when required; see `AGENTS.md` and `CONTRIBUTING.md`.
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

### Automatic path (zero-edit)

After `npm install`, this package's `postinstall` script automatically writes a
single pointer line into your project's `AGENTS.md` (if one exists), idempotently
and non-destructively. The script is deterministic (no network, no telemetry),
scoped to your project root (`cwd`), never overwrites existing content, and
always exits `0` so it can never break your install. It only writes when
`@daochild/agents-config` is a **direct** dependency in your `package.json`
(`dependencies` or `devDependencies`); transitive installs are left untouched.

The line it writes is:

```markdown
Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — read in full and follow unless overridden below.
```

If your project has no `AGENTS.md`, the script prints a notice and exits `0`
without creating one. To have it create a minimal `AGENTS.md` (a title line
followed by the pointer line), pass the explicit `--init` flag:

```bash
node node_modules/@daochild/agents-config/scripts/postinstall.js --init
```

**Known limitation (monorepo / workspace):** the script checks only the
`package.json` in the directory where the install is running (`cwd`); it does
not traverse parent or sibling workspace `package.json` files. In a monorepo
where the dependency is declared in a sub-workspace but the install `cwd` is the
workspace root (or vice versa), the automatic write may not fire. Use the manual
path below in that case.

### Manual path (supported fallback)

If your CI policy rejects `postinstall`, you use `--ignore-scripts`, or the
automatic path does not apply (e.g. the monorepo limitation above), add this one
line at the top of your project's `AGENTS.md`, immediately after the title, so
the agent inherits this package as its primary instructions source:

```markdown
Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — read in full and follow unless overridden below.
```

This manual path is the supported fallback and is runnable without the
`postinstall` ever having run.

### After either path

Restart your agent session (opencode or Claude Code) so the new instructions
take effect — config is loaded once at startup and is not hot-reloaded.

## Read-only SDLC session diagnostic

Run a small documentation-analysis task through OpenCode and check whether the
response addresses the SDLC gates without changing the repository:

```bash
npm run sdlc:check
# Optional: select another configured model, including a provider's free model
npm run sdlc:check -- --model provider/model
```

The default model candidate is `opencode/beam-free`; model availability and
provider requirements can change, so use `--model` for a currently available
free model. OpenCode CLI and an authenticated provider are required.

The runner injects explicit read-only OpenCode permissions, denies shell and
subagent access, and hashes repository files before and after the session
(including ignored files, excluding `.git`). It writes one private
session directory under `~/.local/state/agents-config/sdlc-session-checks/`
containing `events.jsonl` and `summary.json`. These logs contain tool names,
statuses, observed SDLC subagents, and gate-mention checks only; they do not
store the prompt, response, tool arguments, or tool outputs. OpenCode itself
may retain its normal session history according to its own configuration.

`Assessment: PASS` means the diagnostic task completed, no file-write tool or
other disallowed tool was attempted, repository contents stayed unchanged, and
the response reported a risk classification plus a status for every gate. A
blocked shell attempt still makes the assessment fail, but the file snapshot
shows whether anything changed. This is a read-only smoke check, not proof that
an agent obeys policy in every session or that a gate was actually
approved/passed. The permission policy governs OpenCode tool calls, not
arbitrary side effects from external plugins or host processes; use an
OS-level read-only sandbox when those must be excluded as well. Run tests
without OpenCode using `npm test`. Gate labels/statuses and risk classification
are heuristic checks of the response, not independent validation that its
claims are accurate or that the underlying gates passed.

## License

MIT