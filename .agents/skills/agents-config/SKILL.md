---
name: agents-config
description: Explains the layout of the agents-config repository and how .claude/, .opencode/, and .agents/ relate. Use when asked about cross-client agent configuration, skill locations, or adding new agents, skills, commands, or rules.
metadata:
  scope: repo-level
  version: "1.0"
---

# agents-config repository guide

This skill documents the `agents-config` repository layout.

## Directory roles

- `.agents/` — cross-client, [Agent Skills](https://agentskills.io/) compatible directory. Use it for skills, agents, commands, or rules that should be visible to any client following the `.agents/` convention.
- `.claude/` — Claude Code native configuration.
- `.opencode/` — opencode native configuration.

Both `.claude/` and `.opencode/` read the root `AGENTS.md` for shared conventions.

## Adding a component

| Component     | opencode path                    | Claude Code path               | Agent Skills path                |
| ------------- | -------------------------------- | ------------------------------ | -------------------------------- |
| Subagent      | `.opencode/agent/<n>.md`         | `.claude/agents/<n>.md`        | `.agents/agents/<n>.md`          |
| Skill         | `.opencode/skill/<n>/SKILL.md`   | `.claude/skills/<n>/SKILL.md`  | `.agents/skills/<n>/SKILL.md`    |
| Slash command | `.opencode/command/<n>.md`       | `.claude/commands/<n>.md`      | `.agents/commands/<n>.md`        |
| Always-on rule| add to `opencode.json` instructions| add to `.claude/rules/`        | add to `.agents/rules/`          |

## Restart after config changes

`opencode.json`, agent files, skills, plugins, and commands are loaded once at startup. Restart opencode after editing them.
