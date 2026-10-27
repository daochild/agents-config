# Architecture

> AI-readable architecture doc for the `agents-config` repository. Required by the
> `sdlc-regulatory` skill's AI-Readable Codebase contract (hard minimum: `AGENTS.md`
> + `ARCHITECTURE.md`). Update whenever the repo's structure or conventions change.

## What this repository is

`agents-config` is a **shared configuration package** for AI coding agents. It does not ship runtime code; it ships the
instructions, subagents, skills, slash commands, plugins, and always-on rules that configure how AI agents (opencode and
Claude Code)
behave on any project that consumes it.

Published to npm as `@daochild/agents-config` and intended to be installed as a **dev dependency**. Consuming projects
point their `AGENTS.md` at
`node_modules/@daochild/agents-config/AGENTS.md` to inherit this repo's conventions.

## Architectural rules

1. **`AGENTS.md` is the single source of truth.** Both opencode (via `opencode.json`
   → `instructions`) and Claude Code (via `.claude/CLAUDE.md` → `@AGENTS.md`) read it. Never duplicate layout/convention
   content in tool-specific files; reference it.
2. **Shared instruction sources.** OpenCode-facing agents, commands, rules, and skills are organized under
   `instructions/{agent,command,rules,skills}/` and registered through `opencode.json`. Add `.claude/` and `.agents/`
   counterparts for clients that need them, following the per-format differences in `AGENTS.md` (for example, Claude
   Code subagents omit the `mode:` frontmatter field). Keep the source and any maintained counterparts synchronized.
3. **Skills are the methodology layer; subagents are thin.** Subagent `.md` files hold the role description,
   responsibilities, and handoff protocol. Deep methodology (gate checklists, risk tables, compliance crosswalks) lives
   in skills (`<n>/SKILL.md`) so it can be loaded by any agent or reviewer.
4. **Always-on rules are always-on everywhere.** A rule in `.claude/rules/` is loaded by Claude Code on every turn; to
   make the same rule apply in opencode it MUST also be listed in `opencode.json` → `instructions`. The `.agents/rules/`
   mirror covers Agent-Skills-compatible clients.
5. **Config is loaded once at startup.** After editing `opencode.json`, an agent file, a skill, a plugin, or a command,
   restart opencode. No hot reload.
6. **No runtime *application* code.** This repo's "code" is configuration. The only JS is the
   opencode plugin host (`@opencode-ai/plugin` dependency), any
   `plugin/*.ts|.js` the user adds, **and one constrained install-time file-pointer
   helper (`scripts/postinstall.js`) permitted by [ADR 0002](docs/adr/0002-zero-edit-install.md)**.
   There is no `src/`, no build output, no deployable service, no long-running process. (Rule 6
   narrowed by ADR 0002 from "No runtime code" to "No runtime *application* code"; a single
   bounded install-time helper is permitted.)

## Key decisions

- **Dedicated harness flow (2026-10-27).** The user selected KISS: a thin
  `harness-orchestrator` coordinates context, policy, execution, independent verification,
  and feedback using the existing harness skill. A separate read-only `harness-verifier`
  checks outcomes; neither role grants authority or replaces SDLC gates. The change is
  medium risk with a 70% autonomy cap; human review and deployment remain pending.
  Traceability id: `dedicated-harness-flow`.
- **Client loading and dispatch.** Use the discoverable `opencode.json` filename
  (formerly `opencode.jsonp`) and explicitly register commands stored under
  `instructions/command/`. Other hosts must load role instructions into supported
  subagents; OpenCode configuration does not register named Copilot agent types.
  Missing dispatch capability is a host limitation, not a failed engineering gate.
  `experimental.subagent_depth: 3` permits the finite harness -> SDLC -> role
  chain; the default single level would block it. The harness coordinator denies
  direct side effects and restricts delegation; the verifier is read-only.
  The nesting setting requires a compatible OpenCode version and live validation.
- **Schema-pinned config.** `opencode.json` declares
  `"$schema": "https://opencode.ai/config.json"` for editor IntelliSense and validation against the opencode config
  schema.
- **Client-specific frontmatter.** OpenCode agent files use `mode: subagent` (and optional `permission`). Claude Code
  agent files omit `mode:`. `.agents/` counterparts retain OpenCode frontmatter.
- **Explicit skill discovery.** `opencode.json` lists `instructions/skills`; keep this path aligned with the actual
  skill source directory when changing the layout.
- **External skill provenance.** The imported `security-audit` Agent Skill lives under
  `.agents/skills/security-audit/`; `skills-lock.json` records its upstream source and computed hash. Keep it
  documented separately from OpenCode's `instructions/skills` discovery path. See
  [ADR 0003](docs/adr/0003-document-external-skill.md).
- **SDLC regulatory framework.** The `sdlc-*` subagents + `sdlc-regulatory` skill +
  `sdlc-gates` rule implement the AI-Driven SDLC. The skill is the source of truth for the methodology (it superseded
  the deleted `SOW.md`). The orchestrator is the single entry point via the `/sdlc` command.
- **Harness engineering guidance.** The `harness-engineering` skill and always-on rule are
  stored under `instructions/` for OpenCode and mirrored for other clients when needed. They describe context selection,
  host-enforced policy, bounded execution, independent verification, and privacy-aware
  observability. They are guidance only; consuming runtimes enforce permissions, approvals,
  isolation, and execution limits.

## What must NOT be changed without human approval

- `AGENTS.md` — layout and linking model (any change breaks both tools).
- `opencode.json` schema pin and `instructions` list (changes what's always-loaded).
- The instruction-source layout and any maintained client counterparts; removing a counterpart can break that client.
- The `sdlc-regulatory` skill's gate checklists and risk-autonomy table (these are the control surface; relaxing them is
  a high-risk change per the skill's own risk model).
- **The `postinstall` script's contract (per [ADR 0002](docs/adr/0002-zero-edit-install.md))**:
  idempotency, safe-append (never overwrite), exit-0 (every path), cwd-scoped (no traversal
  outside the consumer root), deterministic (no network/telemetry/`Date`/`Math.random`; no
  `http`/`https`/`net`/`fetch`/`dns`/`child_process` imports), direct-dependency-only (transitive
  suppression; `peerDependencies`/`optionalDependencies` do NOT count as direct), and pointer-line
  content (the em dash `—` U+2014 and the exact wording — see ADR 0002). Relaxing any clause is a
  high-risk change requiring human approval at the Architecture, Security, and Code Review gates.

## Constraints

- Node.js stack; package type `commonjs`; main entry `index.js` (currently a placeholder — see `package.json`).
- **Install-time helper:** `scripts/postinstall.js` (CommonJS, Node built-ins only — `fs`,
  `path`, `process`; no new runtime dependency) is the one constrained runtime entry permitted by
  [ADR 0002](docs/adr/0002-zero-edit-install.md). It writes a single pointer line into the
  consumer's `AGENTS.md` after `npm install`, idempotently, safe-append only, cwd-scoped,
  deterministic, exit-0, and only for direct dependencies (transitive installs are suppressed).
  See ADR 0002 for the full binding contract.
- `.gitignore` excludes `node_modules`, `.idea`, `.vscode`, `*.logs`.
- `.npmignore` excludes tests, coverage, CI configs, linters, editor settings,
  `.env*`, `secrets`.

## Stack

| Concern              | Choice                                                          |
|----------------------|-----------------------------------------------------------------|
| Package manager      | npm / yarn / pnpm / bun (consumer's choice)                     |
| Runtime              | Node.js (plugin host only; + one install-time helper, ADR 0002) |
| Install-time helper  | `scripts/postinstall.js` (CommonJS; Node built-ins only)        |
| Config format        | JSON (`opencode.json`), Markdown (agents/skills/rules/commands) |
| Schema               | `https://opencode.ai/config.json`                               |
| Plugin SDK           | `@opencode-ai/plugin`                                           |
| License              | MIT                                                             |

## See also

- `AGENTS.md` — full layout, linking, and "Adding a new component" table.
- `CONTRIBUTING.md` — how to add agents/skills/commands/rules.
- `SECURITY.md` — security policy and the LLM security rule.
- `docs/` — business logic, implementation status, architecture deep-dives, ADRs.
- `instructions/skills/sdlc-regulatory/SKILL.md` — AI-Driven SDLC methodology (source of truth for the SDLC controls).
- `instructions/skills/harness-engineering/SKILL.md` — shared agent reliability guidance; runtime enforcement remains the consuming host's responsibility.
- `docs/adr/0003-document-external-skill.md` — documents the source and discovery boundary for externally sourced skills.