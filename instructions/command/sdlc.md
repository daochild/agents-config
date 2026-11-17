---
description: Run an AI-driven SDLC cycle for a product requirement or change
---

/sdlc [requirement or change description]

Invokes the `sdlc-orchestrator` subagent to route the given requirement through the BMad-style SDLC chain (analyst → pm → architect → sm → dev → qa → security → reviewer → auditor), enforcing all quality gates from the `sdlc-regulatory` skill.

If no argument is given, the orchestrator will ask for the requirement first.

Use this command for any feature/change that:
- touches multiple modules, OR
- is medium/high risk, OR
- needs traceability/compliance artifacts.

For trivial documentation/test-generation/trivial-refactoring (autonomy 80–100%), inline work without `/sdlc` is acceptable.

After invoking, the orchestrator produces artifacts keyed by a slug derived from the requirement (see the `spec-based-docs` rule): `docs/business/`, `docs/architecture/` + ADRs (+ root `ARCHITECTURE.md` when impactful), `docs/stories/`, `docs/security/`, `docs/reviews/` (including DoD at `docs/reviews/{slug}-dod.md`), and same-change updates to `docs/api/`, `docs/database/`, runbooks, troubleshooting, or deployment docs when those surfaces change.