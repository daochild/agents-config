---
description: Run a bounded harness flow with independent verification
---

Run the supplied task through `harness-orchestrator`:
context -> policy -> execution -> independent verification -> feedback.

Ask for the task if none was supplied. Establish observable acceptance criteria,
scope, finite execution limits, and host-required approvals before execution.
Use `harness-verifier` in a separate context from the executor.

This command does not grant tool permissions, implement runtime controls, or
bypass SDLC gates. Report missing controls or verification evidence as BLOCKED.
