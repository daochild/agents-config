# Contributing

> How to add to and modify the `agents-config` repository. Read `AGENTS.md` first for
> the authoritative layout and the "Adding a new component" table.

This repo configures AI coding agents (opencode and Claude Code). Contributions are almost always **new configuration
files** (agents, skills, commands, rules, plugins), not runtime code.

## Before you start

1. Read `AGENTS.md` — it is the single source of truth for layout and conventions.
2. Read `ARCHITECTURE.md` — explains the instruction-source layout and what must not be changed without approval.
3. Read `SECURITY.md` — the LLM security rule applies to every change.
4. If your change touches the SDLC, load the `sdlc-regulatory` skill; if it is medium/high risk or spans multiple
   components, run it through `/sdlc`.

## Adding a component

Add OpenCode-facing components under `instructions/` and register them in `opencode.json` where required. When a
component must also work in Claude Code or Agent-Skills-compatible clients, maintain the corresponding mirrors listed
below. Do not assume a mirror directory exists; create the required target and keep its format consistent with that
client.

| Component      | opencode path                         | Claude Code path              | Agent Skills path             |
|----------------|---------------------------------------|-------------------------------|-------------------------------|
| Subagent       | `instructions/agent/<n>.md`           | `.claude/agents/<n>.md`              | `.agents/agents/<n>.md`       |
| Skill          | `instructions/skills/<n>/SKILL.md`    | `.claude/skills/<n>/SKILL.md`        | `.agents/skills/<n>/SKILL.md` |
| Slash command  | `instructions/command/<n>.md`         | `.claude/commands/<n>.md`            | `.agents/commands/<n>.md`     |
| Plugin         | `plugin/<n>.ts`                       | n/a                                  | n/a                           |
| Always-on rule | `instructions/rules/<n>.md`           | `.claude/rules/<n>.md`               | `.agents/rules/<n>.md`        |

### Format differences

- **opencode subagent frontmatter** uses `mode: subagent` (and optional `permission`).
- **Claude Code subagent frontmatter** omits the `mode:` field.
- **`.agents/` mirrors** keep the OpenCode frontmatter verbatim.
- **Skills** use the same `SKILL.md` format in all three locations.

## Workflow

1. Create a branch: `feat/<name>` or `chore/<name>`.
2. Make the OpenCode-facing change under `instructions/`.
3. Add or update the `.claude/` counterpart (apply format differences above) and `.agents/` counterpart (verbatim) when those clients are in scope.
4. If you added/changed an always-on rule, register its actual path in `opencode.json` `instructions` and add the file to `.claude/rules/` and `.agents/rules/` when those clients are in scope.
5. If you added a subagent, register it under `agent` in `opencode.json` with a
   `prompt: "{file:./instructions/agent/<n>.md}"` entry.
6. **Restart opencode** to validate — config is loaded once at startup, not hot-reloaded.
7. Verify any maintained mirrors before committing (see the examples below).

## Verifying mirror consistency

Before committing, confirm each maintained counterpart is consistent with the source:

```bash
# .agents keeps OpenCode frontmatter; Claude Code subagents omit mode: subagent
diff -q instructions/agent/<n>.md .agents/agents/<n>.md
diff <(grep -v '^mode: subagent$' instructions/agent/<n>.md) .claude/agents/<n>.md
# skills share the same content
diff -q instructions/skills/<n>/SKILL.md .claude/skills/<n>/SKILL.md
diff -q instructions/skills/<n>/SKILL.md .agents/skills/<n>/SKILL.md
```

## Commit conventions

- Conventional Commits style: `feat:`, `fix:`, `chore:`, `docs:`.
- One logical change per commit. Do not batch unrelated mirrors with feature work.
- Never commit secrets, tokens, or personal data (see `SECURITY.md`).

## SDLC changes

If your change modifies the SDLC framework itself (gates, risk table, compliance crosswalk, subagent handoff protocol),
it is **high-risk** per the
`sdlc-regulatory` skill's own risk model. Run it through `/sdlc` and require human approval at the Architecture,
Security, and Code Review gates. Do not relax the autonomy caps or gate checklists without explicit sign-off.

## Updating documentation

After any change, update:

- `AGENTS.md` — if layout/conventions changed.
- `ARCHITECTURE.md` — if structure or key decisions changed.
- `docs/adr/NNNN-<slug>.md` — for any non-trivial architectural decision.
- `README.md` — if install/usage changed.
- `package.json` version — follow SemVer; breaking config changes are a major bump.

Treat outdated docs as technical debt.

## License

By contributing, you agree your contributions are licensed under the MIT license (see `LICENSE`).