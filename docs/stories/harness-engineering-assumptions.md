# AI assumptions log — harness engineering

> Traceability id (slug): `harness-engineering`.
> Scope: shared configuration and documentation only.
> Status: implementation complete; automated validation and independent review passed.

| # | Assumption | Basis | What would invalidate it |
|---|------------|-------|--------------------------|
| A1 | The user instruction "do implementation" authorizes the documented KISS, configuration-only approach. | User directed implementation immediately after reviewing the plan. | User clarifies that a different architecture or runtime scope was intended. |
| A2 | Existing triple-mirror conventions are the correct distribution mechanism for the skill and rule. | `AGENTS.md`, `ARCHITECTURE.md`, and `CONTRIBUTING.md` require shared components to be mirrored. | A supported client requires a different format or does not consume `.agents/`. |
| A3 | The always-on rule should remain short and link to the on-demand skill for detail. | Existing rules are always loaded; the skill carries the deeper methodology. | Agent behavior evaluations show the always-on guidance is insufficient or too large. |
| A4 | Configuration can express requirements but cannot implement runtime authorization, isolation, approval pauses, state verification, or trace storage. | This package has no agent execution runtime or external service. | A future package version adds a controlled runtime surface; it would need a separate architecture and security review. |
| A5 | Operational traces should not default to storing full prompts, private reasoning, secrets, or personal data. | Data minimization is safer and sufficient for operational diagnosis in this generic guidance. | A consumer has a documented, lawful, access-controlled need for specific additional data and retention. |
| A6 | The repository's package test command is not usable as an automated validation gate because it is an intentional placeholder. | `package.json` defines `test` as an erroring placeholder. | A real test suite is added and the package script is updated. |

## Risk and approval record

- **Risk class:** Medium overall for configuration behavior. Security sensitivity is Medium
  because the guidance influences agent behavior but does not grant permissions or implement
  an enforcement mechanism. Technical complexity, data, infrastructure, and financial
  impacts are Low; behavior change/breaking potential is Medium because the new rule is
  always-on for configured clients.
- **Autonomy cap:** 50% (conservative planning cap for cross-client behavior guidance).
- **Architecture authorization:** The user instruction "do implementation" is treated as
  authorization for the KISS configuration-only approach documented in the implementation
  plan. No runtime expansion was inferred.
- **Gate limitation:** The configured `sdlc-orchestrator` was invoked, but it reported that
  role specialist agents were unavailable and did not implement the work. A separate
  read-only code review has since passed, but the full specialist-agent SDLC chain and any
  further required gate approvals remain incomplete in this environment.
- **Validation passed:** The three skill files and two rule files are byte-identical;
  `opencode.json` parses and every configured instruction file exists; `git diff --check`
  passes.
- **Independent review:** The read-only code-review agent found no significant issues.
- **Architecture audit:** The configuration follows existing component/mirror conventions,
  introduces no executable runtime or permissions, and explicitly assigns enforcement to
  the consumer host. No architecture drift or conflict with the package's no-runtime
  application-code constraint was found.

## Implementation boundary

No runtime, new dependency, permissions grant, external system integration, telemetry
collection, or change to the existing SDLC gates was added. Existing repository changes,
including the `SOW.md` worktree state, are outside this task and must remain untouched.
