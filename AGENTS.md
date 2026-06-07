# agents-config

A shared configuration repository for AI coding agents. Defines how
`.claude/` (Claude Code) and `.opencode/` (opencode) are organized and how
they reference each other.

## Behavior

You are committed to honesty and accuracy above all else.

Instructions:

- Prioritize accuracy over fluency.
- Distinguish clearly between facts, estimates, assumptions, and opinions.
- If you are unsure, say what is uncertain and why.
- Do not invent citations, quotes, studies, URLs, or sources.
- When discussing recent events or rapidly changing topics, indicate that
  information may have changed and recommend verification from current
  sources.
- When providing statistics, identify whether they are exact figures,
  estimates, or approximations.
- If multiple interpretations are possible, explain the alternatives rather
  than assuming one is correct.

## Layout

```
agents-config/
├── AGENTS.md                # Repo-level layout + cross-tool conventions
├── opencode.json            # opencode project config (schema-pinned)
├── LICENSE
├── docs/                    # Project documentation
├── research/                # Research and investigation materials
├── .claude/                 # Claude Code project config
│   ├── CLAUDE.md            # Claude Code instructions (sources AGENTS.md)
│   ├── CLAUDE.local.md      # Personal overrides (gitignored)
│   ├── settings.json        # Permissions + config (committed)
│   ├── settings.local.json  # Personal permissions (gitignored)
│   ├── rules/               # Always-loaded rule files
│   │   ├── code-style.md
│   │   ├── testing.md
│   │   └── api-conventions.md
│   ├── agents/              # Subagents (Claude Code .md format)
│   │   ├── code-reviewer.md
│   │   └── security-auditor.md
│   ├── commands/            # Slash commands
│   │   ├── review.md
│   │   ├── fix-issue.md
│   │   └── deploy.md
│   └── skills/              # Skill folders, each with SKILL.md
│       ├── security-review/
│       │   └── SKILL.md
│       └── deploy/
│           └── SKILL.md
└── .opencode/               # opencode project config
    ├── AGENTS.md            # opencode-scoped instructions (loaded via opencode.json)
    ├── agent/               # Subagents (opencode .md format)
    ├── skill/               # Skill folders, each with SKILL.md
    ├── command/             # Slash commands
    └── plugin/              # Local plugins (*.ts / *.js)
```

## Linking

- `AGENTS.md` (root) is the single source of truth for layout and conventions.
  Both tools read it: Claude Code via `.claude/CLAUDE.md`, opencode via
  `opencode.json` → `instructions` → `AGENTS.md`.
- `.opencode/AGENTS.md` is opencode-specific instructions (loaded by
  `opencode.json`). It defers to the root `AGENTS.md` for shared structure
  and only adds opencode-only notes.
- `.claude/CLAUDE.md` is Claude Code's instructions file. It sources the
  root `AGENTS.md` so both tools see the same layout.
- Skills live in `.opencode/skill/` (or `.opencode/skills/`) and
  `.claude/skills/`. `opencode.json` declares both paths under
  `skills.paths` so opencode auto-discovers the Claude-format skills.
- The example `docs` subagent exists in both `.opencode/agent/docs.md` and
  `.claude/agents/docs.md`. Each tool uses its own copy; they share the same
  description so behavior is consistent.

## Adding a new component

| Component       | opencode path             | Claude Code path           |
| --------------- | ------------------------- | -------------------------- |
| Subagent        | `.opencode/agent/<n>.md`  | `.claude/agents/<n>.md`    |
| Skill           | `.opencode/skill/<n>/SKILL.md` | `.claude/skills/<n>/SKILL.md` |
| Slash command   | `.opencode/command/<n>.md` | `.claude/commands/<n>.md`  |
| Plugin          | `.opencode/plugin/<n>.ts` | n/a                        |
| Always-on rule  | add to `opencode.json` `instructions` | add to `.claude/rules/` |

After editing `opencode.json`, an agent file, a skill, a plugin, or any
other config-time file, restart opencode — config is loaded once on startup
and is not hot-reloaded.
