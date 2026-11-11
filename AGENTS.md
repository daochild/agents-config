# agents-config

A shared configuration repository for AI coding agents.

## Primary instruction

Mandatory start-of-session checklist:
1. Read the root AGENTS.md completely.
2. If the task involves code changes, load the matching auditor skill from AGENTS.md's Audit Rule before implementation.
3. Confirm the architecture approach with the user and document it before coding.
4. Do not begin implementation until steps 1–3 are satisfied.

## Behavior

You are committed to honesty and accuracy above all else.

Instructions:

- Prioritize accuracy over fluency.
- If you are an agent, do NOT copy files from this repository; instead, inherit them.
- Distinguish clearly between facts, estimates, assumptions, and opinions.
- If you are unsure, say what is uncertain and why.
- Do not invent citations, quotes, studies, URLs, or sources.
- When discussing recent events or rapidly changing topics, indicate that information may have changed and recommend
  verification from current sources.
- When providing statistics, identify whether they are exact figures, estimates, or approximations.
- If multiple interpretations are possible, explain the alternatives rather than assuming one is correct.

## Audit Rule

When the current task involves significant code changes — for example, after the first code-generation prompt or after
substantial deviations from the agreed statement of work (requirement/PRD artifacts; `SOW.md` was superseded by the
`sdlc-regulatory` skill) — the agent MUST run a system audit before finalizing the output.

1. **Pick the right auditor skill** for the domain of the change. Examples (replace `xxx` with the actual domain):
    - Smart contracts / EVM → `senior-solidity-auditor`
    - Bitcoin / Taproot / PSBT → `senior-bitcoin-auditor`
    - Quality assurance / test strategy → `senior-qa`
    - General architecture / system design → `senior-software-architect`
2. **Run the audit via the matching `xxx-auditor` skill.** Surface findings, severity, and concrete remediation steps.
3. **If the required skill does not exist locally, create it first:**
    - Add `instructions/skills/<xxx-auditor>/SKILL.md` — auto-discovered via `skills.paths`, no `opencode.json` edit needed
    - Add `.claude/` / `.agents/` counterparts only when that client is in scope (see `CONTRIBUTING.md`)
    - Then execute the audit using the newly created skill.

Do not skip the audit because a skill is missing; create the skill and perform the audit as part of the same session.

## AI-Driven SDLC Regulatory Framework

This repo ships a BMad-style, subagent-based SDLC that operationalizes the AI-Driven Software Development Lifecycle (now
fully absorbed into the `sdlc-regulatory` skill). It is **always-on** via the `sdlc-gates` rule and is the default flow
for any feature/change that touches multiple modules or is medium/high risk.

### Components

| Component             | Path                                                                | OpenCode registration      |
|-----------------------|---------------------------------------------------------------------|----------------------------|
| Methodology skill     | `instructions/skills/sdlc-regulatory/SKILL.md`                      | auto via `skills.paths`    |
| Always-on rule        | `instructions/rules/sdlc-gates.md`                                  | `instructions` array       |
| Orchestrator subagent | `instructions/agent/sdlc-orchestrator.md`                           | `agent` + `command.sdlc`   |
| Role subagents (×9)   | `instructions/agent/sdlc-{analyst,pm,architect,sm,dev,qa,security,reviewer,auditor}.md` | `agent` entries |
| `/sdlc` slash command | `instructions/command/sdlc.md`                                      | `command.sdlc.template`    |

No `.claude/` or `.agents/` mirrors exist for these today; create counterparts only when another client is in scope
(see `CONTRIBUTING.md`).

### SDLC chain

```
requirement → sdlc-analyst → sdlc-pm → sdlc-architect → sdlc-sm
           → sdlc-dev → sdlc-qa → sdlc-security → sdlc-reviewer → sdlc-auditor
           → deploy (CI/CD, subject to the Deployment Gate)
```

Each role owns one gate from the `sdlc-regulatory` skill. A failed gate returns work to the previous role with a
`BLOCKED` note; no gate is skipped. AI never self-validates its own work — reviewer/auditor/security are different
agents from dev. High-risk changes require explicit human approval at Architecture, Security, and Code Review gates. The
`sdlc-regulatory` skill also contains a compliance crosswalk (EU AI Act, NIST AI RMF, ISO/IEC 42001, SOC 2, GDPR) for
regulated projects.

### When to use

- **Full `/sdlc` flow**: any change touching multiple modules, medium/high risk, or requiring traceability/compliance
  artifacts.
- **Inline (main agent only)**: documentation, test generation, trivial internal refactoring (autonomy 80–100%). Still
  subject to the `sdlc-gates` rule.
- **Above ~50% autonomy cap**: must use the full flow with human approvals.

See the `sdlc-regulatory` skill for the full gate checklists, risk-autonomy table, traceability format, and the
compliance crosswalk. Config is loaded once at startup — restart opencode after editing `opencode.json`, agents, skills,
plugins, or commands.

## Layout

```
agents-config/
├── AGENTS.md / ARCHITECTURE.md / CONTRIBUTING.md / README.md / SECURITY.md
├── CLAUDE.md                        # Claude Code entry: @AGENTS.md
├── opencode.json                    # instructions, skills.paths, commands, agents (schema-pinned)
├── package.json                     # scripts: test, sdlc:check, postinstall
├── skills-lock.json                 # provenance for externally sourced skills
├── instructions/                    # OpenCode-facing sources — the real component tree
│   ├── agent/                       # subagent prompts (sdlc-*, harness-*, docs)
│   ├── command/                     # slash-command templates (sdlc, harness)
│   ├── rules/                       # always-on rules (sdlc-gates, harness-engineering)
│   └── skills/                      # first-party skills (auto-discovered)
├── .agents/skills/security-audit/   # external skill (ADR 0003), not in skills.paths
├── scripts/                         # postinstall.js, sdlc-session-check.js
├── test/                            # node --test suites, incl. opencode.json path validation
├── .github/copilot-instructions.md
└── docs/                            # BUSINESS_LOGIC, IMPLEMENTATION, adr/, stories/, ...
```

## Linking

- OpenCode loads `opencode.json` → `instructions`: `AGENTS.md` plus the two always-on rules
  (`instructions/rules/sdlc-gates.md`, `instructions/rules/harness-engineering.md`). Skills are discovered only from
  `skills.paths` → `instructions/skills`.
- Every `agent.*.prompt`, `command.*.template`, and `instructions` entry is a real path that `npm test` verifies —
  if you move or rename a file under `instructions/`, update `opencode.json` in the same change.
- Claude Code reads root `CLAUDE.md` (`@AGENTS.md`); Copilot reads `.github/copilot-instructions.md`.
- `.agents/skills/security-audit/` is an externally sourced skill (provenance in `skills-lock.json`, ADR 0003); it is
  deliberately NOT in `skills.paths`.
- Config loads once at startup — restart OpenCode after editing `opencode.json` or any file under `instructions/`.

## Commands

- `npm test` — runs `node --test` over `test/` (no framework config; includes `agent-config.test.js`, which fails if
  any `opencode.json` path points at a missing file). Run this after every config/path change.
- `node --test --test-name-pattern="<name>" test/<file>.test.js` — run a single test.
- `npm run sdlc:check [-- --model provider/model]` — read-only SDLC session diagnostic; needs the OpenCode CLI and an
  authenticated provider (see `README.md`).
- There is no lint/typecheck/build step — this package ships Markdown + JSON only.

## Adding a new component

Add OpenCode-facing components under `instructions/` and register them in `opencode.json` where required
(CONTRIBUTING.md has the full workflow, mirror rules, and frontmatter differences):

| Component      | Path                                | Registered in `opencode.json`                  |
|----------------|-------------------------------------|------------------------------------------------|
| Subagent       | `instructions/agent/<n>.md`         | `agent.<n>.prompt` = `{file:./instructions/agent/<n>.md}` |
| Skill          | `instructions/skills/<n>/SKILL.md`  | nothing — auto-discovered via `skills.paths`   |
| Slash command  | `instructions/command/<n>.md`       | `command.<n>.template` = `{file:./instructions/command/<n>.md}` |
| Always-on rule | `instructions/rules/<n>.md`         | append to `instructions` array                 |
| Plugin         | `plugin/<n>.ts`                     | `plugin` array (no plugins exist yet)          |

`.claude/` and `.agents/` counterparts are optional and currently absent; create them only for clients in scope.

## Harness engineering

The `harness-engineering` rule (`instructions/rules/harness-engineering.md`, always-on) and skill
(`instructions/skills/harness-engineering/SKILL.md`) provide shared guidance
for reliable agent workflows. The `/harness` command runs `harness-orchestrator`, which delegates only to
`general`, `sdlc-orchestrator`, and the read-only `harness-verifier`; `experimental.subagent_depth: 3` is what allows
harness → SDLC → role nesting. Load the skill when designing or changing agent context,
tools, permissions, approvals, verification, or telemetry. The consuming agent host—not
these configuration files—must enforce authorization, isolation, approvals, and runtime
limits. These properties are pinned by `test/agent-config.test.js`.

## Code Generation Pipeline

To create an agent for code generation tasks:

1. **Define the agent** in `instructions/agent/code-generator.md` (use `mode: subagent` — `test/agent-config.test.js`
   asserts every agent registered in `opencode.json` uses it):
   ```markdown
   ---
   description: Generates code based on specifications and requirements
   mode: subagent
   model: anthropic/claude-sonnet-4-6
   permission:
     edit: ask
     bash: ask
   ---
   
   You are a code generation agent specialized in creating high-quality code...
   ```

2. **Create supporting rules** in `instructions/rules/code-generation.md` and register them in the `opencode.json` `instructions` array:
    - Coding standards and patterns
    - Language-specific guidelines
    - Testing requirements

3. **Add skills** in `instructions/skills/code-gen/SKILL.md`:
   ```markdown
   ---
   name: code-gen
   description: Use when generating new code or refactoring existing code
   ---
   
   # Code Generation Skill
   
   When generating code, follow these steps...
   ```

4. **Set up commands** in `instructions/command/generate.md`:
   ```markdown
   ---
   description: Generate code from specifications
   ---
   
   /generate [specification] - Create code based on provided requirements
   ```

5. **Configure permissions** in `opencode.json`:
   ```json
   {
     "agent": {
       "code-generator": {
         "permission": {
           "edit": "ask",
           "bash": "ask"
         }
       }
     }
   }
   ```

After editing `opencode.json`, an agent file, a skill, a plugin, or any other config-time file, restart opencode —
config is loaded once on startup and is not hot-reloaded.

## General Recommendations

- Create a `README.md` file with deployment instructions
- Create a `.aiignore` file to exclude files and directories from AI analysis
- Store R&D artifacts in the `docs/` directory:
    - `docs/BUSINESS_LOGIC.md` - Business requirements and logic
    - `docs/IMPLEMENTATION.md` - Implementation plan, status, and progress
    - `docs/adr/NNNN-<slug>.md` - Architecture Decision Records

The AI-Readable Codebase contract in the `sdlc-regulatory` skill also requires root-level `ARCHITECTURE.md`,
`CONTRIBUTING.md`, and `SECURITY.md` files for any project the SDLC runs against. This repo maintains all of them.

## Architecture Approach Selection

Before implementation, always ask the user what architecture approach to use, as the choice depends on business logic
complexity. Consider these patterns:

- **Clean Architecture** - Separates business logic from frameworks and I/O, promoting testability and maintainability
- **Onion Architecture** - Layers of dependencies pointing inward toward the domain core, emphasizing domain isolation
- **KISS (Keep It Simple, Stupid)** - Prioritizes simplicity and avoiding unnecessary complexity
- **DRY (Don't Repeat Yourself)** - Reduces duplication by abstracting common functionality
- **Hexagonal/Ports and Adapters** - Decouples application core from external systems through ports and adapters
- **Microservices** - Decomposes application into loosely coupled, independently deployable services
- **Monolithic** - Single deployable unit containing all functionality, suitable for simpler applications

Choose the approach based on project scope, team size, scalability requirements, and business logic complexity. Document
the decision in an ADR under `docs/adr/` and summarize it in root `ARCHITECTURE.md`.

## Security Guidelines

- Set up a vault (e.g., Hardhat vault) on your machine or repository to securely store private keys
- Never commit sensitive information directly to the repository
- Use environment variables or secure vault solutions for all secrets
- **LLM Security Rule**: LLMs must never commit tokens, keys, personal data, or any sensitive information to code, even
  if they have permission to read such data. This prevents accidental data breaches and maintains security boundaries.

## Cross-Platform Portability

To make the project portable across Node.js, Python, and Rust infrastructures:

- **Language-Agnostic Configuration**: Store environment-specific settings in `.env` files or external configuration
  management systems
- **Containerization**: Use Docker and docker-compose to package applications and their dependencies for consistent
  deployment across platforms
- **API-First Design**: Expose functionality through REST/gRPC APIs to enable interoperability between services written
  in different languages
- **Shared Libraries**: Implement core business logic in portable formats (e.g., Protocol Buffers, JSON Schema) that can
  be consumed by all target platforms
- **Infrastructure as Code**: Use tools like Terraform or CloudFormation to define infrastructure that can deploy any of
  the language-specific services
- **Polyglot Persistence**: Design data access patterns that work across different database clients and ORMs for each
  platform

## AI Pipeline Configuration

When configuring your AI development pipeline:

1. Follow the code generation pipeline steps above
2. Add security checks as the final step of the pipeline
3. Ensure all generated code passes security scanning before deployment
4. Implement automated testing as part of the generation workflow
5. Add automated versioning updates at the end of the pipeline

## Code Quality Standards

All generated code must meet production-ready standards:

- **Production Ready Only** - All code must be production quality from the start
- **Deep Research First** - Conduct thorough research at the beginning of development
- **Document Findings** - Store research results and technical decisions
- **Time Estimates** - Provide estimates in hours and weeks for all development work
- **Comprehensive Testing** -
    - Local and development environment testing required
    - Minimum 80% code coverage
    - Include unit tests, integration tests, and end-to-end tests
    - Automated test execution as part of the development workflow

## Expert Agent Personalities

Create specialized AI agents with senior-level expertise in key domains:

- **Senior Software Architect** - Deep knowledge in:
    - Web architecture and scalable systems design
    - Mobile app architecture (iOS/Android)
    - Embedded systems and IoT applications
    - Cloud infrastructure and microservices
    - Database design and optimization
    - Security architecture and compliance

- **Senior Software Developer** - Comprehensive skills across:
    - Frontend development (React, Vue, Angular, etc.)
    - Backend development (Node.js, Python, Java, Go, etc.)
    - Mobile development (React Native, Flutter, native iOS/Android)
    - Embedded programming (C/C++, Rust, Arduino, etc.)
    - Database technologies (SQL, NoSQL, GraphQL)
    - DevOps and CI/CD pipelines
    - Testing frameworks and methodologies

- **DevOps Engineer** - Expertise in:
    - Infrastructure as Code (Terraform, CloudFormation)
    - Containerization and orchestration (Docker, Kubernetes)
    - CI/CD pipeline design and implementation
    - Cloud platforms (AWS, Azure, GCP)
    - Monitoring and logging solutions
    - System performance optimization
    - Deployment strategies and rollback procedures

- **SecOps Specialist** - Specialized security operations knowledge:
    - Security monitoring and incident response
    - Vulnerability assessment and penetration testing
    - Compliance frameworks (SOC 2, ISO 27001, GDPR)
    - Threat modeling and risk assessment
    - Security tooling and automation
    - Secure coding practices and code review
    - Identity and access management

- **QA Engineer** - Comprehensive testing expertise:
    - Test planning and strategy development
    - Manual and automated testing methodologies
    - Test case design and execution
    - Bug tracking and reporting
    - Performance and load testing
    - API and integration testing
    - Test automation frameworks (Selenium, Cypress, Jest, etc.)
    - Continuous testing in CI/CD pipelines

## Documentation Maintenance

At the end of each session or task, review and update relevant documentation:

- **AGENTS.md** - Update if new conventions, patterns, or structures were introduced
- **ARCHITECTURE.md** - Document architecture decisions and changes (root file; per the AI-Readable Codebase contract in
  the `sdlc-regulatory` skill)
- **docs/BUSINESS_LOGIC.md** - Record new business requirements or logic changes
- **docs/IMPLEMENTATION.md** - Track implementation progress and status
- **README.md** - Update setup, deployment, or usage instructions if changed
- **Code comments** - Add or update JSDoc/TSDoc for new public APIs

### Documentation Checklist (End of Session)

- [ ] New files/directories documented in appropriate README or ARCHITECTURE.md
- [ ] Architecture decisions recorded in ADRs or ARCHITECTURE.md
- [ ] API changes reflected in documentation
- [ ] Configuration changes documented
- [ ] Testing strategy updated if new test patterns introduced
- [ ] Dependencies added/removed documented

Keep documentation synchronized with code — treat outdated docs as technical debt.
