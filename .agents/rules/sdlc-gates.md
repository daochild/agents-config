# SDLC Gates (always-on)

> Loaded from `.claude/rules/sdlc-gates.md` (Claude Code) and `.agents/rules/sdlc-gates.md` (cross-client).
> Methodology detail: load the `sdlc-regulatory` skill.

## Mandatory gate order

Any AI-generated change MUST pass these gates in order before it reaches production:

1. **Requirement** — defined, acceptance criteria, edge cases, business understood
2. **Architecture** — existing arch analyzed, impacted modules, dependencies, ADR if needed
3. **Implementation** — project patterns followed, no unnecessary deps, in scope, AI assumptions documented
4. **Testing** — unit, integration, regression, edge cases, existing suite passes
5. **Security** — SAST, dependency scan, secrets scan, security AI review, authN/Z where applicable
6. **Code Review** — AI review + human engineering review (+ senior/security review for high-risk)
7. **Deployment** — CI passes, staging validation, smoke tests, canary where applicable, prod monitoring
8. **Definition of Done** — every DoD checklist item verified; no unresolved AI assumptions

## Hard rules

- **No self-validation.** AI that wrote the change cannot be the sole reviewer of that change. Use a different agent/model or a human.
- **No gate skipping.** A failed gate returns the work to the previous stage with a BLOCKED note; it never advances.
- **Autonomy caps.** High-risk changes (database migrations, authN, payments, smart contracts, prod infra) require explicit human approval before advancement. See `sdlc-regulatory` skill for the cap table.
- **Traceability.** Every change carries a traceability id (requirement → task → plan → PR → tests → review → deployment) recorded in the DoD audit.
- **Risk classification first.** `sdlc-sm` (or the main agent) MUST classify the change's risk and autonomy cap before implementation begins.
- **Human approvals logged.** Architecture, Security, and Code Review approvals for high-risk changes must be captured (approver, date) in the audit artifact.

## When to use the full subagent flow vs inline

- Use the `sdlc-orchestrator` subagent when the change touches multiple modules, is medium/high risk, or spans multiple stages.
- Inline (main agent only) is acceptable for documentation/test-generation only (autonomy 100%) and trivial internal refactoring (autonomy 80–100%).
- For any change above ~50% autonomy cap, invoke the subagent flow.

## AI-readable codebase precondition

The Architecture Gate requires "existing architecture has been analyzed". That presupposes the repo is AI-readable (AI-Readable Codebase section of the `sdlc-regulatory` skill). Minimum required for any SDLC run:

- `AGENTS.md` — layout + conventions
- `ARCHITECTURE.md` — how the system works, constraints, stack

If either is missing, the orchestrator must run a bootstrap pass (analyst + architect seed the files from existing code) before routing feature work. Do not proceed on an illegible codebase. See the `sdlc-regulatory` skill for the full required documentation structure and the 9 things the AI must be able to understand.

## Compliance reminder

When the project targets a regulated domain (EU AI Act high-risk, ISO 42001 certified, SOC 2 audited, or processes personal data under GDPR), the relevant gates must produce the artifacts the compliance crosswalk in the `sdlc-regulatory` skill lists. Confirm the applicable regime and tier per project; this rule does not replace legal review.