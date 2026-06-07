# opencode instructions

This file is loaded by `opencode.json` → `instructions` and runs in addition
to the repo-root `AGENTS.md`, which is the single source of truth for layout
and cross-tool conventions.

Read the root `AGENTS.md` first for: directory layout, where skills / agents
/ commands / plugins / rules live, and the cross-tool linking model.

## opencode-only notes

- Config is loaded once at startup. After editing `opencode.json`, an agent
  file, a skill, a plugin, or any other config file, quit and restart
  opencode for the change to take effect.
- `opencode.json` is validated against `https://opencode.ai/config.json`.
  The file declares `"$schema": "https://opencode.ai/config.json"` for
  editor IntelliSense.
- Agent frontmatter is the opencode format (see
  `.opencode/agent/docs.md` for an example). Do not copy a Claude Code
  agent verbatim — fields like `mode` and `permission` differ.
- Skills may be shared with Claude Code: `opencode.json` lists
  `.claude/skills` under `skills.paths`, so a Claude-format skill in
  `.claude/skills/<name>/SKILL.md` is auto-discovered by opencode.
