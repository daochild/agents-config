# Copilot instructions

## Repository guidance

- Read `AGENTS.md` before making changes. It is the repository's primary instruction source; use `ARCHITECTURE.md`, `CONTRIBUTING.md`, and `SECURITY.md` for the relevant architectural, contribution, and security details.
- This is the npm package `@daochild/agents-config`, not an application. OpenCode-facing agent, command, rule, and skill sources live under `instructions/`; `opencode.json` declares the paths used by OpenCode. Client-specific counterparts may be maintained under `.claude/` and `.agents/`.
- Before changing an agent component, inspect the actual file paths and matching `opencode.json` entry. Some agent prompts and always-on instruction entries may still use legacy client-specific paths; align them with the source under `instructions/` when modifying those registrations. Follow `CONTRIBUTING.md` for counterpart formats and checks.
- Treat the SDLC gate order and risk/autonomy rules as controls, not optional workflow suggestions. Classify risk before implementation; use the orchestrator for multi-component or medium/high-risk work. The author of a change must not be its sole reviewer, and high-risk approval decisions belong to a human.
- Configuration and prompt text do not enforce authorization or isolate tools. Runtime hosts must enforce permissions and approvals at side-effect boundaries.
- Never write secrets, tokens, personal data, or other sensitive information into files, logs, commits, or artifacts. Redact any such values encountered during work.
- `scripts/postinstall.js` is a deliberately constrained install-time helper. Preserve its cwd-only writes, safe/idempotent append behavior, direct-dependency check, deterministic operation, Node built-ins-only dependency boundary, and exit-0 contract; see `docs/adr/0002-zero-edit-install.md` before changing it.
- OpenCode loads configuration at startup; restart it after changing `opencode.json` or agent configuration.

## Commands

- Run the full test suite: `npm test`
- Run one test by name: `node --test --test-name-pattern="defaults to an OpenCode Zen model candidate and parses overrides" test/sdlc-session-check.test.js`
- Run the read-only SDLC session diagnostic: `npm run sdlc:check` (requires the OpenCode CLI and an authenticated provider; see `README.md`).
