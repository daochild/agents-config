# Definition of Done — opencode-consumer-setup

Traceability: `opencode-consumer-setup`  
Audit date: 2026-11-17  
This is an independent, read-only audit of current artifacts. It does not authorize merge, publish, or deployment.

Developer addendum after the independent audit: the QA artifact has been
reconciled, targeted 16/16 and complete 37/37 test runs pass, Node syntax checks
pass, and npm pack dry-run includes required files. These are developer-run
checks, not a second independent QA run. The dependency scan now reports one
pre-existing moderate advisory affecting two package entries; see the security
report. Dedicated automated SAST/full secret-scanner evidence, live OpenCode
verification, human review, and deployment remain pending. The historical table
below records the audit-time state; this addendum supersedes its stale-QA and
missing-dependency-scan observations without claiming a new audit approval.

## DoD checklist

| Item | Status | Evidence / remaining work |
|---|---|---|
| Requirement understood | PASS | Analysis and PRD specify an explicit consumer-root setup, strict JSON, exact inherited paths, and no lifecycle/runtime-filter change. |
| Acceptance criteria satisfied | PARTIAL | Source implements the requested behavior and tests cover the principal branches. Actual OpenCode loading and published-package consumer behavior have not been validated. |
| Architecture impact analyzed | PASS | `docs/architecture/opencode-consumer-setup.md`, `docs/adr/0004-opencode-consumer-setup.md`, and `ARCHITECTURE.md` record the user-approved KISS approach. |
| Implementation completed | PASS | `scripts/setup-opencode.js` and consumer README instructions are present. The legacy `scripts/postinstall.js` and dependency manifests are unchanged. |
| Tests generated where appropriate | PASS | `test/setup-opencode.test.js` contains consumer-fixture integration coverage; `docs/stories/opencode-consumer-setup-tests.md` records the test scope. |
| Unit tests passing | PENDING EVIDENCE RECONCILIATION | The parent reports latest results of 16/16 targeted and 37/37 full-suite tests passing. The QA report read during this audit still records 15 passed/1 failed; update it to agree with the latest run before relying on it. This auditor did not run tests. |
| Integration tests passing | PARTIAL | Parent-reported test suite includes consumer-root fixtures and a package-symlink case. No actual OpenCode session or published install was exercised. |
| Regression tests passing | PENDING EVIDENCE RECONCILIATION | Full-suite pass is parent-reported; synchronize the QA report's stale failure summary. |
| Security checks passing | FAIL / PENDING | Static manual review and a targeted local secret-pattern search found no issue, but no automated SAST, dependency/advisory, or full secret-scanner results are recorded. Security Gate remains not passed. |
| AI code review completed | PASS, TECHNICAL ONLY | Independent source review found no source-level blocker. The review verdict remains blocked for gate completion pending evidence and human review. |
| Human engineering review completed | FAIL / PENDING | No human engineering review or approval is recorded in the artifacts available to this audit. |
| Documentation updated | PARTIAL | README, architecture, ADR, stories, and assumptions artifacts are present. At audit time, the QA report still contained the prior failing result and finding; update it to reflect the latest run. |
| Observability added where required | N/A | This is a short-lived local setup CLI with no service or persistent runtime; no additional observability requirement was identified. |
| No unresolved AI assumptions | FAIL / PENDING | The recorded no-runtime-enforcement boundary is approved. OpenCode's actual `skills.paths` loading and consumer installation behavior remain unvalidated; keep these explicit rather than claiming runtime compatibility. |
| Deployment successfully validated | FAIL / PENDING | No publish, staging, consumer install, or deployment validation is recorded. Deployment/publish approval remains separate and pending. |

## Gate outcome

**DOD FAIL.** This is a process/evidence outcome, not a finding that the implementation is defective. Before DoD can pass:

1. Reconcile the QA report with the current dual-config diagnostic and latest test results.
2. Record automated SAST, dependency/advisory, and full secrets-scan evidence.
3. Obtain and record human engineering review.
4. Validate the package-consumer path in the intended release process, without claiming runtime prompt filtering; record whether a real OpenCode session/package install is required by the release owner.
5. Re-run the DoD audit after those gates have evidence.

## Traceability

```yaml
traceability:
  requirement_id: opencode-consumer-setup
  ai_agents:
    - role: analyst
      model: not recorded
    - role: pm
      model: not recorded
    - role: architect
      model: not recorded
    - role: scrum_master
      model: not recorded
    - role: developer
      model: not recorded
    - role: qa
      model: not recorded
    - role: security-reviewer
      model: not recorded
    - role: code-reviewer
      model: not recorded
    - role: auditor
      model: not recorded
  repository: daochild/agents-config
  changed_modules:
    - scripts/setup-opencode.js
    - test/setup-opencode.test.js
    - README.md
    - ARCHITECTURE.md
    - docs/business/opencode-consumer-setup-analysis.md
    - docs/business/opencode-consumer-setup-prd.md
    - docs/architecture/opencode-consumer-setup.md
    - docs/adr/0004-opencode-consumer-setup.md
    - docs/stories/opencode-consumer-setup-stories.md
    - docs/stories/opencode-consumer-setup-assumptions.md
    - docs/stories/opencode-consumer-setup-tests.md
    - docs/security/opencode-consumer-setup-security.md
    - docs/reviews/opencode-consumer-setup-review.md
    - docs/reviews/opencode-consumer-setup-dod.md
  gate_results:
    requirement: pass
    architecture: pass
    implementation: pass
    testing: developer_rerun_pass_independent_source_review_complete
    security: blocked_baseline_advisory_and_missing_scan_evidence
    code_review: pending_human_engineering_review
    deployment: pending
  security_findings:
    critical: 0
    high: 0
    medium: 1
    low: 0
  risk_class: medium
  autonomy_cap_pct: 70
  human_approvals:
    - gate: architecture
      approver: user_identity_not_recorded
      date: 2026-11-17
    - gate: security
      approver: pending
    - gate: code_review
      approver: pending
  deployment:
    env: not_deployed
    ref: not_recorded
    artifacts: []
  metrics:
    lead_time_hours: null
    test_coverage_pct: null
    security_findings: 1
    autonomy_cap_pct: 70
    ai_pr_accepted: null
    human_review_minutes: null
```
