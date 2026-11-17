# Spec-Based Documentation (always-on)

> OpenCode-facing rule source: `instructions/rules/spec-based-docs.md`.
> Artifact owners and paths are defined by the `sdlc-regulatory` skill (`{slug}` = feature slug).

Documentation is produced **with** the change, not after. Every SDLC role writes its owned artifact at the path below; the DoD Gate fails if a required artifact for that change is missing or stale.

## Artifact ownership (`{slug}` = feature slug)

| Artifact | Path |
|----------|------|
| Analysis / PRD | `docs/business/{slug}-analysis.md`, `docs/business/{slug}-prd.md` |
| Architecture + ADR | `docs/architecture/{slug}.md`, `docs/adr/NNNN-{slug}.md` |
| Stories / assumptions / test plan | `docs/stories/{slug}-{stories,assumptions,tests}.md` |
| Security report | `docs/security/{slug}-security.md` |
| Review / DoD / incident | `docs/reviews/{slug}-{review,dod,incident}.md` |
| API contracts | `docs/api/` (+ OpenAPI colocated with route handlers, e.g. next to axum routes) |
| DB schema / migrations | `docs/database/` |
| Runbooks / troubleshooting / deploy | `docs/runbooks/`, `docs/troubleshooting/`, `docs/deployment/` |

Owners per artifact: see the Artifacts and Documentation & Knowledge Management tables in the `sdlc-regulatory` skill.

## Hard rules

1. **Root system overview.** `ARCHITECTURE.md` at the repo root is the system overview. When a change has architectural impact, `sdlc-architect` MUST create or update it **and** the relevant ADRs in the same change as `docs/architecture/{slug}.md`.
2. **API contracts travel with code.** Any change to an API contract MUST update `docs/api/` in the **same** change (and keep OpenAPI next to the route handlers when the stack uses that pattern). That keeps the backend and the TypeScript client library in sync — do not land route/handler changes without the matching contract docs.
3. **Slug reuse.** The orchestrator derives `{slug}` once; every stage artifact for that change reuses it. Do not invent parallel naming.
4. **Same-change docs.** Code that alters behaviour without the matching owned doc paths above is incomplete; `sdlc-auditor` marks "Documentation updated" as fail.

## When this binds

- Full `/sdlc` runs: orchestrator verifies each handoff writes the path in the table.
- Inline (docs/tests/trivial refactor): still update the knowledge-base surface you touch (`docs/api/`, `docs/database/`, runbooks, etc.).
- Cross-check: `sdlc-gates` + `sdlc-regulatory` skill for gate order and DoD checklist.
