# Security Policy

> Security policy for the `agents-config` repository. Required by the
> `sdlc-regulatory` skill's AI-Readable Codebase contract.

## Reporting a vulnerability

Do not open a public GitHub issue for security vulnerabilities. Instead, email the
maintainer at the address listed in `package.json` → `author`, or open a private
security advisory on GitHub. Include:

- A description of the issue and its impact.
- Steps to reproduce or a proof of concept.
- Affected file(s) or component(s).
- Suggested remediation if you have one.

You will receive an acknowledgment within 72 hours. Please do not disclose the
vulnerability publicly until a fix has been released.

## LLM Security Rule (binding on every agent and contributor)

> **LLMs must never commit tokens, keys, personal data, or any sensitive
> information to code, even if they have permission to read such data.**

This is the single most important security rule in this repository:

- Agents that read secrets (env vars, `.env` files, vault contents, API tokens)
  must NEVER write them into any file, commit message, log, or artifact.
- This prevents accidental data breaches and maintains the security boundary
  between "agent can read" and "agent can publish".
- If an agent encounters a secret while editing, it MUST redact it (replace with
  `<redacted>` or a placeholder) rather than copy it forward.
- The `sdlc-security` subagent's Security Gate includes secrets scanning; any
  detected secret in a diff blocks advancement until remediated or explicitly
  accepted by a human.

## Secrets handling

- **No secrets in the repository.** `.gitignore` excludes `.env*` and `secrets`;
  `.npmignore` reinforces this for package publishing.
- Use environment variables or a secure vault (e.g., Hardhat vault, AWS Secrets
  Manager, 1Password CLI) for all secrets — never inline them.
- The `sdlc-regulatory` skill's Security Gate requires secrets scanning on every
  AI-generated change (SAST, dependency scan, secrets scan, security AI review,
  authN/Z validation where applicable).

## What is in scope

This repository is configuration-only (no runtime code, no deployable service).
Security concerns are therefore primarily:

- **Secret leakage** via agent-generated content (the LLM Security Rule above).
- **Supply-chain risk** from the npm dependency `@opencode-ai/plugin` — keep it
  pinned and monitor advisories.
- **Permission overreach** in `opencode.json` agent `permission` blocks — prefer
  `ask` over `allow` for `edit` and `bash` on any agent that touches production.
- **Model-only policy enforcement** — prompts and skills do not authorize actions or
  isolate tools. The consuming host must check identity, scope, and arguments at each
  side-effect boundary, fail closed when authorization is unclear, and pause for required
  human approval.
- **Sensitive observability data** — agent traces can contain secrets or personal data.
  Record only operational fields needed for diagnosis; redact sensitive values and apply
  access and retention controls. Do not log private model reasoning by default.
- **SDLC gate bypass** — any change that weakens a gate, removes a reviewer, or
  raises an autonomy cap is a high-risk security change requiring human approval.

## Out of scope

- Vulnerabilities in downstream projects that consume this config — report those to
  the downstream project, not here.
- Vulnerabilities in opencode or Claude Code themselves — report to the respective
  upstream project.

## Compliance

When a consuming project targets a regulated domain (EU AI Act high-risk, ISO 42001
certified, SOC 2 audited, or processes personal data under GDPR), the SDLC gates
must produce the artifacts the compliance crosswalk in the `sdlc-regulatory` skill
lists. This policy does not replace legal review.

## See also

- `AGENTS.md` → "Security Guidelines"
- `sdlc-regulatory` skill → Security Gate checklist + compliance crosswalk
- `instructions/skills/harness-engineering/SKILL.md` → harness design guidance and host/runtime boundary
- `CONTRIBUTING.md` → SDLC changes are high-risk
- `.gitignore`, `.npmignore` — what is excluded from repo and package