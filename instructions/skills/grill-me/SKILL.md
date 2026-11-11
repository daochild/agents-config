---
name: grill-me
description: Adversarial accountability session that challenges both AI output and human operator choices—assumptions, evidence, skipped gates, and premature "done" claims. Use when the user asks to be grilled, red-teamed, stress-tested, or wants pushback before shipping, merging, or trusting a conclusion.
metadata:
  scope: repo-level
  version: "1.0"
---

# Grill Me

Structured skepticism aimed at **two actors**:

1. **The AI** — fluency, unverified claims, missing reads/tests, scope creep, false completion.
2. **The operator** — vague intent, rubber-stamping, gate-skipping, urgency without criteria, trusting the model over evidence.

The tone is direct and forensic, not performative hostility. The goal is to surface what would **falsify** the current plan or "done" claim before irreversible action.

## When to Use

Use `grill-me` when:

- The user says **grill me**, **challenge this**, **red team**, **what am I missing**, or **poke holes**.
- An agent claims **done**, **fixed**, or **ready to merge** without independent verification.
- A change skipped or compressed SDLC/harness steps (especially testing, security, or human review).
- Requirements or acceptance criteria were never written down.
- The operator and AI are aligned on a story but nobody has named risks or disconfirming evidence.

## When NOT to Use

| Need | Use instead |
| --- | --- |
| Pick among ambiguous product/architecture options | `council` (if available) or explicit tradeoff analysis |
| Domain code/security audit | Matching `senior-*-auditor` or `security-audit` |
| Formal SDLC DoD sign-off | `sdlc-auditor` via `/sdlc` |
| Read-only check of harness artifacts | `harness-verifier` |
| Implementing fixes | Dev workflow; grill first, then implement |

## Modes

| Mode | Duration | Use when |
| --- | --- | --- |
| **Flash grill** | ~5 questions | Quick sanity check before a small change |
| **Full grill** | Full worksheet below | Medium/high risk, production paths, or regulatory work |
| **Post-mortem grill** | After an incident | What did AI and operator each fail to verify? |

Default to **Flash** unless the user asks for depth or risk is medium/high per `sdlc-regulatory`.

## Workflow

### 1. Freeze the artifact

Write a short **claim ledger** (max 10 bullets):

- What the **AI** asserts (facts, estimates, opinions labeled per `AGENTS.md` honesty rules).
- What the **operator** decided (scope, shortcuts, approvals, overrides).
- Stated **acceptance criteria** (or explicit "none yet").

If criteria are missing, mark **BLOCKED** until the operator defines at least one observable pass/fail check.

### 2. Dual-track interrogation

Run **both** tracks every time; do not let the AI hide behind the operator or vice versa.

**AI track**

- What files/commands were **not** run but should have been?
- What is **assumed** vs read from the repo?
- Where could the model **confabulate** (paths, APIs, CI status)?
- What test or verifier would **fail** if run now?

**Operator track**

- What business outcome is this supposed to achieve?
- What gates were **skipped or compressed** and why?
- What would make you **reject** this if you were a reviewer today?
- What are you **not** doing because of this work?

### 3. Question bank

Pick the highest-leverage questions from each category (Flash: at least one per category; Full: all that apply).

| Category | Example challenges |
| --- | --- |
| **Evidence** | What single experiment would prove this wrong? Who can reproduce it? |
| **Scope** | What is explicitly **out** of scope? What adjacent bug is still open? |
| **Gates** | Which SDLC gate is weakest right now? Was human review bypassed? |
| **Reversibility** | Rollback plan? Feature flag? Migration backward-compatible? |
| **Incentives** | Why ship **now**? What pressure is causing false confidence? |
| **Dual control** | Did the same agent both implement and declare success? |
| **Secrets & safety** | Any `.env`, PII, or irreversible shell risk accepted without approval? |

### 4. Verdict

Issue one verdict for the **combined** AI+operator posture:

| Verdict | Meaning |
| --- | --- |
| **BLOCKED** | Missing criteria, unknown evidence, or gate violation — do not ship |
| **NEEDS EVIDENCE** | Direction OK but proof missing — name exact commands/artifacts |
| **PROCEED WITH RISKS** | Known gaps documented; operator accepts residual risk in writing |

### 5. Next actions

List **concrete** next steps (who: AI vs operator), e.g.:

- Run `npm test` / named test and paste outcome.
- Run `harness-verifier` or `sdlc-auditor`.
- Operator writes 3 acceptance criteria.
- Re-grill after evidence lands.

## Output template

```markdown
## Grill Me — <topic>

### Claim ledger
- AI: ...
- Operator: ...
- Acceptance criteria: ...

### AI challenges
1. ...

### Operator challenges
1. ...

### Verdict: BLOCKED | NEEDS EVIDENCE | PROCEED WITH RISKS

### Required before proceed
- [ ] ...

### Residual risks (if proceeding)
- ...
```

## Integration with this repo

- **Honesty** — Separate facts, estimates, assumptions, and opinions in the claim ledger.
- **`sdlc-regulatory`** — Map findings to the gate that failed or was skipped.
- **`harness-engineering`** — Treat completion claims as proposals until independently verified.
- **`nvidia-skillspector-check`** — When the session is about **landing a new skill**, grill whether Skillspector artifacts exist before merge.

## Anti-patterns

- Asking leading questions that let the operator vent without falsifiable tests.
- Grilling only the AI while ignoring the operator's gate-skipping.
- Ending with "looks good" without a verdict and explicit next actions.
- Replacing auditors or SDLC — grill is **pre-flight pressure**, not sign-off.
