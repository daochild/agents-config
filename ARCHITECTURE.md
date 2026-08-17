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

## System diagram

```
Consuming project
   │
   │  AGENTS.md → "Primary instructions are located at:
   │               node_modules/@daochild/agents-config/AGENTS.md"
   ▼
agents-config (this repo)
   │
   ├── AGENTS.md .................. single source of truth (layout + conventions)
   │
   ├── opencode.json .............. opencode project config
   │      ├─ instructions[] ....... always-loaded files (AGENTS.md, rules)
   │      ├─ skills.paths[] ....... skill discovery dirs
   │      └─ agent{} .............. subagent registry ({file:./.opencode/agent/<n>.md})
   │
   ├── .opencode/ ................. opencode-native config
   │      ├─ agent/ ............... subagent definitions (opencode frontmatter, mode: subagent)
   │      ├─ skill/ ............... skills (each <n>/SKILL.md)
   │      ├─ command/ ............. slash commands
   │      └─ plugin/ ............. local plugins (*.ts/*.js)
   │
   ├── .claude/ .................. Claude Code-native config
   │      ├─ CLAUDE.md ............ Claude instructions (@AGENTS.md)
   │      ├─ agents/ .............. subagents (Claude Code frontmatter — NO mode: field)
   │      ├─ skills/ .............. skills (auto-discovered by opencode via skills.paths)
   │      ├─ commands/ ............ slash commands
   │      └─ rules/ ............... always-on rules (also listed in opencode.json instructions)
   │
   └── .agents/ ................... cross-client fallback (Agent Skills / agentskills.io)
          ├─ agents/ .............. verbatim opencode frontmatter
          ├─ skills/ .............. verbatim SKILL.md
          ├─ commands/ ............ verbatim
          └─ rules/ ............... verbatim
```

## Architectural rules

1. **`AGENTS.md` is the single source of truth.** Both opencode (via `opencode.json`
   → `instructions`) and Claude Code (via `.claude/CLAUDE.md` → `@AGENTS.md`) read it. Never duplicate layout/convention
   content in tool-specific files; reference it.
2. **Triple-mirror for components that must work in all clients.** A new subagent / skill / command / rule goes in
   `.opencode/`, `.claude/`, and `.agents/`. The
   `.opencode/` copy is authoritative for opencode; `.claude/` is authoritative for Claude Code; `.agents/` is a
   verbatim cross-client fallback. See `AGENTS.md` →
   "Adding a new component" for the per-format differences (e.g. Claude Code subagents omit the `mode:` frontmatter
   field).
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
   `.opencode/plugin/*.ts|.js` the user adds, **and one constrained install-time file-pointer
   helper (`scripts/postinstall.js`) permitted by [ADR 0002](docs/adr/0002-zero-edit-install.md)**.
   There is no `src/`, no build output, no deployable service, no long-running process. (Rule 6
   narrowed by ADR 0002 from "No runtime code" to "No runtime *application* code"; a single
   bounded install-time helper is permitted.)

## Key decisions

- **Schema-pinned config.** `opencode.json` declares
  `"$schema": "https://opencode.ai/config.json"` for editor IntelliSense and validation against the opencode config
  schema.
- **opencode frontmatter vs Claude Code frontmatter.** opencode agent files use
  `mode: subagent` (and optional `permission`). Claude Code agent files omit
  `mode:`. `.agents/` mirrors keep the opencode frontmatter verbatim so any Agent-Skills-compatible client can use them.
- **Skill discovery is union of paths.** `opencode.json` lists
  `.agents/skills`, `.opencode/skill`, `.opencode/skills` (optional plural fallback), and `.claude/skills` so a
  Claude-format skill is visible to opencode and vice-versa. This is why triple-mirroring skills is safe.
- **SDLC regulatory framework.** The `sdlc-*` subagents + `sdlc-regulatory` skill +
  `sdlc-gates` rule implement the AI-Driven SDLC. The skill is the source of truth for the methodology (it superseded
  the deleted `SOW.md`). The orchestrator is the single entry point via the `/sdlc` command.

## What must NOT be changed without human approval

- `AGENTS.md` — layout and linking model (any change breaks both tools).
- `opencode.json` schema pin and `instructions` list (changes what's always-loaded).
- The triple-mirror invariant for any component already published to consumers (deleting a mirror breaks that client).
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
- `.opencode/skill/sdlc-regulatory/SKILL.md` — AI-Driven SDLC methodology (source of truth for the SDLC controls).