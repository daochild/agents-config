# Contributing

> How to add to and modify the `agents-config` repository. Read `AGENTS.md` first for
> the authoritative layout and the "Adding a new component" table.

This repo configures AI coding agents (opencode and Claude Code). Contributions are almost always **new configuration
files** (agents, skills, commands, rules, plugins), not runtime code.

## Before you start

1. Read `AGENTS.md` — it is the single source of truth for layout and conventions.
2. Read `ARCHITECTURE.md` — explains the triple-mirror model and what must not be changed without approval.
3. Read `SECURITY.md` — the LLM security rule applies to every change.
4. If your change touches the SDLC, load the `sdlc-regulatory` skill; if it is medium/high risk or spans multiple
   components, run it through `/sdlc`.

## Adding a component (the triple-mirror rule)

Every new subagent / skill / command / rule MUST be added in all three locations so it works in opencode, Claude Code,
and any Agent-Skills-compatible client.

| Component      | opencode path                         | Claude Code path              | Agent Skills path             |
|----------------|---------------------------------------|-------------------------------|-------------------------------|
| Subagent       | `.opencode/agent/<n>.md`              | `.claude/agents/<n>.md`       | `.agents/agents/<n>.md`       |
| Skill          | `.opencode/skill/<n>/SKILL.md`        | `.claude/skills/<n>/SKILL.md` | `.agents/skills/<n>/SKILL.md` |
| Slash command  | `.opencode/command/<n>.md`            | `.claude/commands/<n>.md`     | `.agents/commands/<n>.md`     |
| Plugin         | `.opencode/plugin/<n>.ts`             | n/a                           | n/a                           |
| Always-on rule | add to `opencode.json` `instructions` | add to `.claude/rules/`       | add to `.agents/rules/`       |

### Format differences

- **opencode subagent frontmatter** uses `mode: subagent` (and optional `permission`).
- **Claude Code subagent frontmatter** omits the `mode:` field.
- **`.agents/` mirrors** keep the opencode frontmatter verbatim.
- **Skills** use the same `SKILL.md` format in all three locations.

## Workflow

1. Create a branch: `feat/<name>` or `chore/<name>`.
2. Make the change in `.opencode/` first (authoritative for opencode).
3. Mirror to `.claude/` (apply format differences above) and `.agents/` (verbatim).
4. If you added/changed an always-on rule, update `opencode.json` `instructions` and add the file to `.claude/rules/` +
   `.agents/rules/`.
5. If you added a subagent, register it under `agent` in `opencode.json` with a
   `prompt: "{file:./.opencode/agent/<n>.md}"` entry.
6. **Restart opencode** to validate — config is loaded once at startup, not hot-reloaded.
7. Verify mirror consistency before committing (see the verify script below).

## Verifying mirror consistency

Before committing, confirm the three mirrors are consistent:

```bash
# opencode <-> .agents should be byte-identical
diff -q .opencode/agent/<n>.md .agents/agents/<n>.md
# opencode <-> .claude should differ ONLY by the 'mode: subagent' line
diff <(grep -v '^mode: subagent$' .opencode/agent/<n>.md) .claude/agents/<n>.md
# skills should be byte-identical across all three
diff -q .opencode/skill/<n>/SKILL.md .claude/skills/<n>/SKILL.md
diff -q .opencode/skill/<n>/SKILL.md .agents/skills/<n>/SKILL.md
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