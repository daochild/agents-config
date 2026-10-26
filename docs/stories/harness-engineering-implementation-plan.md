# Harness Engineering — Research and Implementation Plan

> Traceability id (slug): `harness-engineering`.
> Status: Implemented; automated validation and independent review passed.
> Scope: Shared agent configuration in this repository, not a production agent runtime.
> Research checked: 2026-10-26.

## Research story

Harness engineering treats the model as one component in a larger system: people define
intent, the model proposes decisions, and the surrounding system supplies context, tools,
boundaries, execution controls, verification, and feedback. The engineering work shifts from
relying on a better prompt to making the environment legible and consequential actions
controllable and testable.

OpenAI's 2026 harness-engineering article describes an internal, agent-first software
engineering experiment. Its reported lessons emphasize a legible repository, explicit
constraints, mechanical checks, and tight feedback loops rather than relying on model
instructions or manual review alone. Treat the scale and productivity figures in that article
as the authors' account of one experiment, not as independently validated benchmarks or a
general guarantee.

Anthropic's context-engineering guidance reinforces that context is a changing, finite
resource: provide high-signal information, retrieve details progressively, and avoid
burying the task in redundant material. Its agent-building guidance favors simple,
composable designs and distinguishes fixed workflows from agents that dynamically choose
their next actions. OpenAI's Agents SDK documentation provides concrete examples of
automatic guardrails and pausing for human approval before sensitive tool calls.

### Check of the supplied six components

| Supplied component | Assessment | Clarification for the plan |
|-------------------|------------|-----------------------------|
| Context Builder | Sound. Relevant task state and evidence reduce avoidable assumptions. | Keep always-loaded instructions concise; discover detailed material just in time. Mark untrusted user or retrieved content as data, not policy. |
| Model | Sound as a decision-making component, but not a source of authority or proof. | The runtime/orchestrator controls loop transitions, limits, and whether a proposed tool call reaches execution. |
| Policy Gate | Essential, but the model must not be the gate. | Enforce authorization deterministically at the action boundary; pause for human approval where policy requires it. |
| Tools & Runtime | Least privilege is the right baseline. | Also specify argument validation, isolation, time/call/retry budgets, and safe handling of irreversible side effects. |
| Verification | Correct and central. | Verify the resulting state or artifact with independent checks; a model's completion message is not evidence. |
| Observability & Feedback | Correct and necessary for diagnosis and improvement. | Capture useful events and outcomes, with explicit data minimization, access, and retention rules. Use failures to improve tests and controls. |

The supplied list is a conceptual architecture, not a guarantee that these controls are
implemented. It also omits explicit success criteria, bounded loops/termination, fail-safe
behavior, and treatment of untrusted inputs. These are included below.

## Repository fit and proposed architecture

This repository publishes instructions, rules, skills, and subagents; it does not host the
agent execution loop or control a consumer's external services. The existing SDLC framework
already provides relevant configuration surfaces: repository context (`AGENTS.md` and
`ARCHITECTURE.md`), risk classification and approval gates, distinct implementation,
testing, security, review, and audit roles, plus change traceability.

**Proposed approach: KISS, configuration-only, reusing the existing SDLC framework.** Add
only the missing shared guidance and verification expectations. Keep client-specific
permissions in their native config formats and maintain the existing mirror invariant.
Do not introduce a runtime, new framework, external service, or duplicate policy system.
Where execution controls are needed, the consuming application or agent host must enforce
them; documentation in this package cannot itself sandbox tools, approve side effects, or
collect runtime traces.

The user authorized implementation of this documented scope with the instruction "do
implementation" on 2026-10-27. No new runtime or external enforcement was approved or added.
The configuration follows existing component patterns; this implementation did not require
a separate ADR.

## Proposed implementation

### Stories and sequence

| ID | Work | Proposed deliverables | Estimate |
|----|------|-----------------------|----------|
| HE-01 | Agree on architecture, scope, and enforcement ownership. | Approved scope; ADR if the approach is non-trivial; updated architecture doc if needed. | 1–2 hours |
| HE-02 | Strengthen the shared context and execution guidance. | Concise context-selection rules; source/untrusted-data handling; explicit success criteria, loop limits, and stop/escalation conditions. | 2–4 hours |
| HE-03 | Clarify policy and tool boundaries across clients. | Matched rule/config updates; least-privilege and approval guidance; explicit note that host policy—not model prose—must enforce action authorization. | 3–6 hours |
| HE-04 | Specify outcome verification and failure feedback. | Gate guidance requiring observable evidence for completion; privacy-aware trace/event expectations and a path from failures to regression tests. | 2–4 hours |
| HE-05 | Validate mirrors, consistency, and examples. | Automated or scripted checks using existing repository conventions; docs review confirming no unsupported runtime promises. | 2–4 hours |

Estimated repository effort: **10–20 hours** (roughly 2–3 working days), assuming no
runtime implementation and no new dependencies. This is a planning estimate, not a
commitment; the runtime portion is explicitly out of scope.

### Implemented deliverables

- Added the triple-mirrored `harness-engineering` skill.
- Added the mirrored always-on `harness-engineering` rule and registered it in
  `opencode.json`.
- Updated `AGENTS.md`, `.opencode/AGENTS.md`, `ARCHITECTURE.md`, and `SECURITY.md` to
  document discovery, architecture, and security boundaries.
- Updated `docs/IMPLEMENTATION.md` and this plan for implementation traceability.
- No runtime, tool server, telemetry backend, or dependency was added.

### Acceptance criteria

- The model is described as proposing decisions; authorization and side-effect controls are
  assigned to deterministic host/runtime enforcement.
- The shared guidance states how to select context, identify untrusted content, and retrieve
  detailed information without loading unnecessary material by default.
- Every implementation task can state its expected outcome and how that outcome will be
  independently verified.
- Tool guidance includes least privilege, argument validation, bounded execution, and human
  approval for policy-designated sensitive actions.
- Completion requires evidence from the relevant tests, checks, or resulting external state;
  a model assertion alone does not pass verification.
- Observability guidance covers errors, retries, tool outcomes, and privacy-conscious
  retention/access; traces do not default to storing secrets or full prompts.
- Client-specific changes preserve the repository's existing mirror conventions and do not
  silently widen permissions.
- Documentation clearly distinguishes controls this package can describe from controls a
  consuming runtime must implement.

### Risk, approvals, and validation

The implemented always-on rule affects agent behavior across clients and is classified
Medium risk; see `harness-engineering-assumptions.md` for the axes and conservative autonomy
cap. The user authorized the documented KISS architecture by directing implementation after
reviewing the proposal. The independent code review passed, but the full specialist-agent
SDLC flow could not be completed because the orchestrator reported those agents unavailable;
any further required gate approvals remain incomplete. Do not treat a documentation rule as
a substitute for executable authorization.

Validation should include mirror-consistency checks, repository tests/linters, and a
cross-client review of the resulting instructions. Add behavioral evaluations only where
they can be run against the actual host/runtime; this repository alone cannot prove that
external tool permissions, human approval pauses, or telemetry controls are enforced.

### Out of scope

- Building an agent loop, policy service, sandbox, tool server, or telemetry backend.
- Connecting to payment, CRM, database, or other production systems.
- Promising production safety or reliability based on instructions alone.
- Capturing real user prompts, secrets, or personal data in repository artifacts.

## Web sources

1. OpenAI, [Harness engineering: leveraging Codex in an agent-first world](https://openai.com/index/harness-engineering/) (2026). Primary account of the experiment and its engineering lessons. The page was discoverable in web search; direct retrieval was blocked during this research.
2. Anthropic, [Effective context engineering for AI agents](https://www.anthropic.com/research/effective-context-engineering-for-ai-agents). Guidance on context curation, progressive disclosure, and long-horizon agents.
3. Anthropic, [Building effective agents](https://www.anthropic.com/research/building-effective-agents). Distinguishes workflows from agents and recommends starting with the simplest effective design. The page notes that parts of its tooling overview have changed since December 2024.
4. OpenAI, [Guardrails and human review](https://developers.openai.com/api/docs/guides/agents/guardrails-approvals). Documentation on automated input/output/tool checks and pausing sensitive actions for human approval.

## Handoff

```
HANDOFF: maintainer | artifact: docs/stories/harness-engineering-implementation-plan.md
         | gate: implementation complete; automated validation and independent review passed
```

Validation summary: all three skill copies and both rule copies are byte-identical;
`opencode.json` parses and every configured instruction file exists; `git diff --check`
passes. An independent read-only code review found no significant issues. Runtime behavior
evaluation is out of scope because this repository does not provide an agent host. The
specialist-agent SDLC chain remains incomplete because those agents were unavailable.
