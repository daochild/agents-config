# OpenCode consumer setup assumptions

Traceability: `opencode-consumer-setup`.

- The consumer explicitly invokes its installed package script from its project
  root; automatic discovery of ancestors/workspaces is deliberately unsupported.
- OpenCode discovers packaged skills from a parent directory in `skills.paths`,
  matching this repository's existing registration. This is configuration-level
  coverage, not a claim that a real OpenCode session was exercised.
- Existing configuration must be strict JSON. JSONC requires manual registration
  to avoid discarding comments or shadowing an existing configuration.
- Consumer files are not concurrently edited during setup; the command detects
  common concurrent changes but does not provide a cross-process locking protocol.
- Install-time helper behavior, package dependencies, shared rule/skill sources,
  permissions, runtime prompt filtering, and deployment are outside this change.
