# Claude Code instructions

This file is loaded automatically by Claude Code for this project. It points
at the root `AGENTS.md`, which is the single source of truth for the
`agents-config` repository layout and how `.claude/` and `.opencode/`
reference each other.

@AGENTS.md

## Claude Code-specific notes

- Skills live in `.claude/skills/<name>/SKILL.md`. opencode auto-discovers
  the same folders via `opencode.json` → `skills.paths`.
- Subagents live in `.claude/agents/<name>.md` and use the Claude Code
  frontmatter format. The mirror copy in `.opencode/agent/` uses the
  opencode format; do not assume they are interchangeable.
- Slash commands live in `.claude/commands/<name>.md`.
- Always-loaded rules live in `.claude/rules/` and are auto-included by
  Claude Code on every turn.
