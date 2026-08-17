---
name: sdlc-regulatory
description: AI-driven SDLC governance framework with quality gates, risk-based autonomy caps, change traceability, Definition of Done, and a compliance crosswalk (EU AI Act, NIST AI RMF, ISO/IEC 42001, SOC 2, GDPR). Use when running or reviewing work through the BMad-style subagent SDLC, enforcing gates, classifying risk, or mapping SDLC stages to external regulatory regimes.
metadata:
  scope: repo-level
  version: "1.0"
  source: SOW.md
---

# AI-Driven SDLC Regulatory Framework

> **AI accelerates execution, SDLC controls correctness, risk, and accountability.**
> Source of truth: `SOW.md` (AI-Driven Software Development Lifecycle).

This skill is the methodology layer consumed by the `sdlc-*` subagents (BMad-style role agents) and enforced by the `sdlc-gates` always-on rule. It encodes: stages, quality gates, risk-based autonomy caps, AI vs human responsibility split, change traceability, Definition of Done, key risks, success metrics, and a compliance crosswalk.

## How to use

- **Subagents** load this skill implicitly; they implement one stage each and hand off to the next role.
- **Main agent / orchestrator** uses the gate checklist below to decide whether a stage may advance.
- **Reviewers** use the Definition of Done and risk classification to set required approvals.
- **Humans** retain final approval for any change above the autonomy cap (see Risk-Based AI Autonomy).

## SDLC Stages → BMad Role Agents

| # | SDLC Stage (SOW) | BMad role agent | Gate enforced | Human decision? |
|---|------------------|-----------------|---------------|------------------|
| 1 | Requirements analysis | `sdlc-analyst` | Requirement | Business decision |
| 2 | Technical specification | `sdlc-pm` | Requirement | Prioritize |
| 3 | Architecture analysis | `sdlc-architect` | Architecture | Approve architecture |
| 4 | Implementation planning | `sdlc-sm` | Architecture | Prioritize |
| 5 | AI implementation | `sdlc-dev` | Implementation | Supervise |
| 6 | Automated validation + tests | `sdlc-qa` | Testing | Define quality expectations |
| 7 | Security analysis | `sdlc-security` | Security | High-risk approval |
| 8 | AI code review | `sdlc-reviewer` | Code Review | Final approval |
| 9 | Audit / Definition of Done | `sdlc-auditor` | Definition of Done | n/a (gate result) |
| 10 | Deployment | (CI/CD pipeline) | Deployment | Production authorization |
| 11 | Observability / feedback | (monitoring) | n/a | Incident decisions |

The `sdlc-orchestrator` subagent is the entry point: it routes a product requirement through stages 1–9 in order and stops at any failed gate.

## Handoff protocol (BMad-style)

Each role subagent MUST:

1. Read this skill and the relevant gate checklist.
2. Produce its stage artifact in the agreed location (see Artifacts below).
3. Self-check its own gate. If any gate item fails, return the artifact to the previous role with a `BLOCKED` note; do NOT advance.
4. On pass, emit a `HANDOFF: <next-role>` line stating the next role, the artifact path, and the traceability id.
5. Never review/validate its own implementation for the *next* gate — that is the next role's job. AI must not be the sole validator of AI-generated work.

## Artifacts

| Artifact | Owner | Location (relative to repo root) |
|----------|-------|----------------------------------|
| Market/vision analysis | `sdlc-analyst` | `docs/business/{slug}-analysis.md` |
| PRD (product requirements, acceptance criteria, edge cases) | `sdlc-pm` | `docs/business/{slug}-prd.md` |
| Architecture proposal + ADR | `sdlc-architect` | `docs/architecture/{slug}.md`, `docs/adr/NNNN-{slug}.md` |
| Story breakdown + risk classification + AI autonomy cap | `sdlc-sm` | `docs/stories/{slug}-stories.md` |
| Implementation (code + AI assumptions log) | `sdlc-dev` | feature branch + `docs/stories/{slug}-assumptions.md` |
| Test plan + test code | `sdlc-qa` | `tests/` + `docs/stories/{slug}-tests.md` |
| Security report (SAST/deps/secrets/auth) | `sdlc-security` | `docs/security/{slug}-security.md` |
| Code review report | `sdlc-reviewer` | `docs/reviews/{slug}-review.md` |
| Definition-of-Done audit | `sdlc-auditor` | `docs/reviews/{slug}-dod.md` |

`{slug}` is derived from the requirement/epic title by the orchestrator and reused across all artifacts for traceability.

## Quality Gates (verbatim from SOW §2)

Every AI-generated change MUST pass all gates before production. Gate items are checklists; any unchecked item blocks advancement.

### Requirement Gate — `sdlc-analyst` / `sdlc-pm`
- [ ] Requirement is clearly defined
- [ ] Acceptance criteria exist
- [ ] Edge cases are identified
- [ ] Business requirements are understood

### Architecture Gate — `sdlc-architect`
- [ ] Existing architecture has been analyzed
- [ ] Impacted modules are identified
- [ ] Dependencies are understood
- [ ] ADR is created/updated when required

### Implementation Gate — `sdlc-dev`
- [ ] Existing project patterns are followed
- [ ] No unnecessary dependencies are introduced
- [ ] Changes remain within the intended scope
- [ ] AI assumptions are documented

### Testing Gate — `sdlc-qa`
- [ ] Unit tests
- [ ] Integration tests
- [ ] Regression tests
- [ ] Edge-case tests
- [ ] Existing test suite passes

### Security Gate — `sdlc-security`
- [ ] SAST
- [ ] Dependency scanning
- [ ] Secrets scanning
- [ ] Security-focused AI review
- [ ] Authentication/authorization validation where applicable

### Code Review Gate — `sdlc-reviewer`
- [ ] AI code review
- [ ] Human engineering review
- [ ] Additional senior/security review for high-risk changes

### Deployment Gate — CI/CD pipeline
- [ ] CI passes
- [ ] Staging validation
- [ ] Smoke tests
- [ ] Canary deployment where applicable
- [ ] Production monitoring

### Definition of Done — `sdlc-auditor`
- [ ] Requirement understood
- [ ] Acceptance criteria satisfied
- [ ] Architecture impact analyzed
- [ ] Implementation completed
- [ ] Tests generated where appropriate
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Regression tests passing
- [ ] Security checks passing
- [ ] AI code review completed
- [ ] Human review completed
- [ ] Documentation updated
- [ ] Observability added where required
- [ ] No unresolved AI assumptions
- [ ] Deployment successfully validated

A change is NOT done just because the code works.

## AI vs Human Responsibilities (SOW §AI vs Human)

| Area | AI Responsibility | Human Responsibility |
|------|-------------------|----------------------|
| Requirements | Analyze and structure | Business decision |
| Architecture | Propose solutions | Approve architecture |
| Planning | Break work into tasks | Prioritize |
| Coding | Generate implementation | Supervise |
| Testing | Generate and execute tests | Define quality expectations |
| Code Review | Technical analysis | Final approval |
| Security | Automated analysis | High-risk approval |
| Deployment | Automation | Production authorization |
| Monitoring | Detect anomalies | Incident decisions |
| Documentation | Generate/update | Validate |
| Maintenance | Diagnose/propose fixes | Approve critical changes |

## Risk-Based AI Autonomy (SOW §Risk-Based AI Autonomy)

Classify every change on these axes before implementation:
- Business impact
- Technical complexity
- Security sensitivity
- Data sensitivity
- Infrastructure impact
- Financial impact
- Breaking-change probability

Default autonomy caps (override per-project, never relax without human sign-off):

| Change Type | Suggested AI Autonomy |
|-------------|---------------------:|
| Documentation | 100% |
| Test generation | 100% |
| Internal refactoring | 80–100% |
| Simple API changes | 70–90% |
| Database migrations | 30–50% |
| Authentication | 20–40% |
| Payments | 10–30% |
| Smart contracts | 0–20% |
| Production infrastructure | 0–20% |

**Rule:** any change above ~50% autonomy cap (or any High/Critical security finding) requires explicit human approval. `sdlc-sm` assigns the cap per story; `sdlc-auditor` verifies it was respected before DoD sign-off.

## Change Traceability (SOW §AI Change Traceability)

Chain: **Business Requirement → Task → AI Plan → Pull Request → Tests → Review → Deployment**

Capture, per change (stored in the DoD audit artifact):
- Requirement / ticket id
- AI agent (role) and model used
- Repository + changed modules
- Validation results (per gate)
- Security checks
- Reviewers (AI + human)
- Deployment info

Objective: engineering traceability and accountability, not storing full prompts.

## Key Risks to Control (SOW §Key Risks)

The framework MUST explicitly protect against:
- AI hallucinations and incorrect assumptions
- Architectural drift / degradation
- Inconsistent implementations
- AI-generated technical debt
- Missing edge cases
- Security vulnerabilities
- Over-engineering
- Scope creep
- Breaking changes
- Incorrect database migrations
- Insufficient test coverage
- AI self-validation failures — **AI must not be the only validator of AI-generated code.** (Hence separate reviewer + auditor roles.)

## Success Metrics (SOW §Success Metrics)

Measure engineering outcomes, not raw AI code volume:
- Lead Time for Changes
- Deployment Frequency
- Change Failure Rate
- Mean Time to Recovery (MTTR)
- AI-generated PR acceptance rate
- AI-generated defect rate
- Defect escape rate
- AI review escape rate
- Test coverage
- Security findings
- Human review time
- AI autonomy rate
- Cost per feature / per successful deployment
- Percentage of changes passing automated quality gates

## CI/CD progressive validation (SOW §AI-Driven CI/CD)

```
Git Push → Build → Lint → Unit Tests → Integration Tests
        → SAST → Dependency Scan → AI Code Review
        → Architecture Validation → Risk Classification
        → Human Approval → Staging → Production
```

CI failure path:
```
CI Failure → AI Log Analysis → Root Cause → Proposed Fix
          → Automated Tests → Pull Request
```

Production changes always subject to the approval policy above.

## Compliance Crosswalk (extensible overlay)

Maps each SDLC gate to external regulatory/AI-management regimes. Use when the project must demonstrate compliance; otherwise treat as informative.

| SDLC Gate / Control | EU AI Act (Regulation (EU) 2024/1689) | NIST AI RMF 1.0 | ISO/IEC 42001:2023 | SOC 2 (TSC) | GDPR (Regulation (EU) 2016/679) |
|---------------------|---------------------------------------|-----------------|--------------------|-------------|---------------------------------|
| Requirement Gate | Art. 9 (high-risk system purpose, intended use, risk mgmt plan) | GOVERN-1.1, MAP-1.1 | Clauses 6.1, 8.1 (context, risk) | CC1.1–CC1.3 | Art. 5 (principles), Art. 25 (data protection by design) |
| Architecture Gate | Art. 9(2), Art. 15 (accuracy, robustness, cybersecurity) | MAP-2.1, MAP-3.1 | Clause 8.2 (AI system impact), 8.3 | CC7.1, CC7.2 | Art. 25 (DPIA, by design & by default) |
| Implementation Gate | Art. 9(4) (data governance, traceability), Art. 12 (technical documentation) | MEASURE-1.1, MEASURE-2.2 | Clause 8.4 (design), 8.5 (development) | CC7.1, CC8.1 | Art. 30 (records), Art. 32 (security of processing) |
| Testing Gate | Art. 9(3)(c), Art. 15 (resilience, fallback) | MEASURE-1.2, MEASURE-2.3 | Clause 8.6 (verification) | CC7.1 | Art. 25, Art. 32 |
| Security Gate | Art. 15 (cybersecurity), Art. 14 (human oversight) | MEASURE-1.3, MANAGE-1.1 | Clause 8.8 (security), 8.9 (disclosure) | CC6.1–CC6.8, CC7.1 | Art. 32 (security), Art. 34 (breach notification) |
| Code Review Gate | Art. 14 (human oversight, right to intervene) | MANAGE-2.1, MANAGE-4.1 | Clause 8.7 (deployment), 8.10 (human oversight) | CC7.1, CC8.1 | Art. 22 (human-in-the-loop for automated decisions) |
| Deployment Gate | Art. 26 (obligations of deployers), Art. 27 (fundamental rights impact assessment) | MANAGE-1.3, MANAGE-3.1 | Clause 8.7 (deployment), 10 (improvement) | CC8.1, CC8.2 | Art. 35 (DPIA for high-risk processing) |
| DoD Audit | Art. 12 (technical documentation), Art. 72 (post-market monitoring) | MANAGE-4.2, MANAGE-5.1 | Clause 9 (performance evaluation), 10 (continual improvement) | CC4.1, CC4.2 (monitoring) | Art. 5(2) (accountability), Art. 35 |
| Traceability | Art. 9(4)(b) (automatic traceability/logging), Art. 12 | MAP-1.3, MEASURE-2.9 | Clause 7.5 (documented info), 8.5 | CC2.1, CC2.2 | Art. 5(2), Art. 30, Art. 35(7) |
| Risk classification & autonomy caps | Art. 6 (classification), Annex III | GOVERN-2.1, MAP-2.2 | Clause 6.1 (risk), 8.1 | CC3.1–CC3.4 (risk mgmt) | Art. 35 (DPIA threshold) |

Notes:
- EU AI Act: obligations differ by risk tier (unacceptable / high-risk / limited / minimal). The above assumes a **high-risk** system. For limited-risk systems, only transparency (Art. 50) applies; for minimal-risk, voluntary codes. Confirm the tier per system before applying.
- NIST AI RMF functions: **GOVERN** (cross-cutting), **MAP** (context & risk identification), **MEASURE** (assess/track), **MANAGE** (prioritize/respond).
- ISO/IEC 42001 is an AI management system standard (clauses ~ISO 9001-style: context, leadership, plan, support, operation, performance evaluation, improvement).
- SOC 2: Trust Services Criteria (TSC) 2017, with the 2018 Points of Focus. CC = Common Criteria; plus optional Security/Availability/Confidentiality/Processing Integrity/Privacy categories.
- GDPR applies whenever personal data is processed, regardless of AI use; DPIA (Art. 35) mandatory for high-risk processing including large-scale profiling, automated decisions (Art. 22).
- **This crosswalk is a planning aid, not legal advice.** Confirm applicability and exact article numbering with current official sources — numbering/paragraphs can shift between trilogue and consolidated versions. For EU AI Act, reference the version published in the OJEU; for GDPR, Regulation (EU) 2016/679.

## Audit Trail format (for `sdlc-auditor`)

Each DoD audit artifact must end with a `## Traceability` block:

```yaml
traceability:
  requirement_id: <Jira/issue id or slug>
  ai_agents: [{ role: analyst, model: <id> }, { role: dev, model: <id> }, ...]
  repository: <org/repo>
  changed_modules: [src/foo, src/bar]
  gate_results:
    requirement: pass
    architecture: pass
    implementation: pass
    testing: pass
    security: pass
    code_review: pass
    deployment: pending
  security_findings: { critical: 0, high: 0, medium: 1, low: 2 }
  risk_class: medium
  autonomy_cap_pct: 70
  human_approvals: [{ gate: architecture, approver: @handle, date: YYYY-MM-DD }]
  deployment: { env: staging, ref: <commit>, artifacts: [] }
```

## Quick reference

- Stuck at a gate? → re-run the owning role subagent with the BLOCKED note; do not skip.
- Unsure of autonomy cap? → `sdlc-sm` classifies; default to the stricter (lower) cap.
- High-risk change? → human approval required at Architecture, Security, and Code Review gates; `sdlc-auditor` will reject DoD if missing.
- New external regime? → add a column to the Compliance Crosswalk; do not fork the gates.

*Load this skill whenever you run, review, or govern work through the BMad-style subagent SDLC, or when mapping SDLC controls to external AI/security/privacy regimes.*