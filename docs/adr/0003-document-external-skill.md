# ADR 0003: Documenting an externally sourced skill

- **Status:** Accepted
- **Date:** 2026-10-27
- **Traceability ID:** `document-side-skills`

## Context

The repository's first-party skills are stored under `instructions/skills/` and that
directory is registered in `opencode.json`. The imported `security-audit` skill is
stored in `.agents/skills/security-audit/` and its provenance is recorded in
`skills-lock.json`. These locations serve different discovery mechanisms, but the
existing documentation listed only the first-party skill directory.

## Decision

Use the KISS approach: update the existing README, implementation inventory, and
architecture documentation to describe the imported skill, its upstream source,
and its discovery boundary. Keep `skills-lock.json` as the provenance record; do
not add a separate skill catalog or change runtime discovery configuration.

## Consequences

- Readers can distinguish the externally sourced Agent Skill from the
  `instructions/skills/` collection.
- OpenCode discovery remains limited to the configured `instructions/skills`
  path; the `.agents/skills/` placement does not imply OpenCode registration.
- Future externally sourced skills should be documented alongside the
  first-party skills while retaining their lock-file provenance.
