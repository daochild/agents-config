# ADR 0001 — Triple-mirror every shared component

- **Status**: accepted
- **Date**: 2026-08-18
- **Deciders**: maintainer

## Context

`agents-config` configures two AI coding agents (opencode and Claude Code) that use incompatible frontmatter formats and
different discovery mechanisms:

- opencode reads `opencode.json` → `agent` registry with `{file:...}` prompts and
  `mode: subagent` frontmatter; skills via `skills.paths`.
- Claude Code reads `.claude/agents/*.md` with Claude Code frontmatter (no `mode:`
  field), `.claude/skills/<n>/SKILL.md`, and `.claude/commands/*.md`; rules in
  `.claude/rules/` are always-on.
- A third convention, [Agent Skills](https://agentskills.io/) (`.agents/`), is a cross-client fallback for any tool that
  scans it.

A component added in only one location works in only one tool. Consumers using both tools would see inconsistent
behavior.

## Decision

Every subagent, skill, slash command, and always-on rule that must work across clients is **triple-mirrored**:

| Component      | opencode (authoritative)          | Claude Code (authoritative)   | `.agents/` (fallback)         |
|----------------|-----------------------------------|-------------------------------|-------------------------------|
| Subagent       | `.opencode/agent/<n>.md`          | `.claude/agents/<n>.md`       | `.agents/agents/<n>.md`       |
| Skill          | `.opencode/skill/<n>/SKILL.md`    | `.claude/skills/<n>/SKILL.md` | `.agents/skills/<n>/SKILL.md` |
| Slash command  | `.opencode/command/<n>.md`        | `.claude/commands/<n>.md`     | `.agents/commands/<n>.md`     |
| Always-on rule | in `opencode.json` `instructions` | `.claude/rules/<n>.md`        | `.agents/rules/<n>.md`        |

### Format differences

- opencode subagent frontmatter: `mode: subagent` (and optional `permission`).
- Claude Code subagent frontmatter: omits `mode:`.
- `.agents/` mirrors: keep the opencode frontmatter verbatim.
- Skills are identical across all three (same `SKILL.md` format).

### Authoritative copy

For drift resolution: the `.opencode/` copy is authoritative for opencode; the
`.claude/` copy is authoritative for Claude Code. When a change is made, update
`.opencode/` first, then mirror to `.claude/` (applying the format difference) and
`.agents/` (verbatim). Skills are byte-identical in all three.

## Consequences

**Positive**

- One change works in both tools and any Agent-Skills-compatible client.
- Skills are universally discoverable (`opencode.json` lists all three skill dirs).
- Clear ownership: each tool's authoritative copy is in its own directory.

**Negative**

- Three files to keep in sync per component; mirror drift is a real risk.
- Requires a verification step before commit (see `CONTRIBUTING.md`).
- More files in the repo; larger diff surface.

**Mitigations**

- `CONTRIBUTING.md` documents the verify commands.
- Backlog item BL-4: add CI to check mirror consistency on PR.
- The `.agents/` mirror is verbatim from `.opencode/`, so it can be regenerated; the `.claude/` mirror differs only by
  the `mode:` line, which is mechanical.

## Alternatives considered

1. **Single source + symlinks.** Rejected: symlinks don't reliably survive npm packaging across platforms and OSes.
2. **Generate `.claude/` from `.opencode/` at install time.** Rejected: adds a build step to a config-only repo and
   couples the tools' release cadences.
3. **`.agents/` only, let both tools scan it.** Rejected: opencode and Claude Code do not both natively scan `.agents/`
   for all component types today; relying on it would lose tool-specific frontmatter.

## References

- `AGENTS.md` → "Adding a new component"
- `ARCHITECTURE.md` → Architectural rules + Key decisions
- `CONTRIBUTING.md` → "Verifying mirror consistency"