# agents-config

A shared configuration repository for AI coding agents. Defines how
`.claude/` (Claude Code) and `.opencode/` (opencode) are organized and how
they reference each other.

## Behavior

You are committed to honesty and accuracy above all else.

Instructions:

- Prioritize accuracy over fluency.
- Distinguish clearly between facts, estimates, assumptions, and opinions.
- If you are unsure, say what is uncertain and why.
- Do not invent citations, quotes, studies, URLs, or sources.
- When discussing recent events or rapidly changing topics, indicate that
  information may have changed and recommend verification from current
  sources.
- When providing statistics, identify whether they are exact figures,
  estimates, or approximations.
- If multiple interpretations are possible, explain the alternatives rather
  than assuming one is correct.

## Layout

```
agents-config/
├── AGENTS.md                # Repo-level layout + cross-tool conventions
├── opencode.json            # opencode project config (schema-pinned)
├── LICENSE
├── docs/                    # Project documentation
├── research/                # Research and investigation materials
├── resources/               # Project resources and assets
├── .claude/                 # Claude Code project config
│   ├── CLAUDE.md            # Claude Code instructions (sources AGENTS.md)
│   ├── CLAUDE.local.md      # Personal overrides (gitignored)
│   ├── settings.json        # Permissions + config (committed)
│   ├── settings.local.json  # Personal permissions (gitignored)
│   ├── rules/               # Always-loaded rule files
│   │   ├── code-style.md
│   │   ├── testing.md
│   │   └── api-conventions.md
│   ├── agents/              # Subagents (Claude Code .md format)
│   │   ├── code-reviewer.md
│   │   └── security-auditor.md
│   ├── commands/            # Slash commands
│   │   ├── review.md
│   │   ├── fix-issue.md
│   │   └── deploy.md
│   └── skills/              # Skill folders, each with SKILL.md
│       ├── security-review/
│       │   └── SKILL.md
│       └── deploy/
│           └── SKILL.md
└── .opencode/               # opencode project config
    ├── AGENTS.md            # opencode-scoped instructions (loaded via opencode.json)
    ├── agent/               # Subagents (opencode .md format)
    ├── skill/               # Skill folders, each with SKILL.md
    ├── command/             # Slash commands
    └── plugin/              # Local plugins (*.ts / *.js)
```

## Linking

- `AGENTS.md` (root) is the single source of truth for layout and conventions.
  Both tools read it: Claude Code via `.claude/CLAUDE.md`, opencode via
  `opencode.json` → `instructions` → `AGENTS.md`.
- `.opencode/AGENTS.md` is opencode-specific instructions (loaded by
  `opencode.json`). It defers to the root `AGENTS.md` for shared structure
  and only adds opencode-only notes.
- `.claude/CLAUDE.md` is Claude Code's instructions file. It sources the
  root `AGENTS.md` so both tools see the same layout.
- Skills live in `.opencode/skill/` (or `.opencode/skills/`) and
  `.claude/skills/`. `opencode.json` declares both paths under
  `skills.paths` so opencode auto-discovers the Claude-format skills.
- The example `docs` subagent exists in both `.opencode/agent/docs.md` and
  `.claude/agents/docs.md`. Each tool uses its own copy; they share the same
  description so behavior is consistent.

## Adding a new component

| Component       | opencode path             | Claude Code path           |
| --------------- | ------------------------- | -------------------------- |
| Subagent        | `.opencode/agent/<n>.md`  | `.claude/agents/<n>.md`    |
| Skill           | `.opencode/skill/<n>/SKILL.md` | `.claude/skills/<n>/SKILL.md` |
| Slash command   | `.opencode/command/<n>.md` | `.claude/commands/<n>.md`  |
| Plugin          | `.opencode/plugin/<n>.ts` | n/a                        |
| Always-on rule  | add to `opencode.json` `instructions` | add to `.claude/rules/` |

## Code Generation Pipeline

To create an agent for code generation tasks:

1. **Define the agent** in `.opencode/agent/code-generator.md`:
   ```markdown
   ---
   description: Generates code based on specifications and requirements
   mode: primary
   model: anthropic/claude-sonnet-4-6
   permission:
     edit: ask
     bash: ask
   ---
   
   You are a code generation agent specialized in creating high-quality code...
   ```

2. **Create supporting rules** in `.claude/rules/code-generation.md`:
   - Coding standards and patterns
   - Language-specific guidelines
   - Testing requirements

3. **Add skills** in `.opencode/skill/code-gen/SKILL.md`:
   ```markdown
   ---
   name: code-gen
   description: Use when generating new code or refactoring existing code
   ---
   
   # Code Generation Skill
   
   When generating code, follow these steps...
   ```

4. **Set up commands** in `.opencode/command/generate.md`:
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

After editing `opencode.json`, an agent file, a skill, a plugin, or any
other config-time file, restart opencode — config is loaded once on startup
and is not hot-reloaded.

## General Recommendations

- Create a `README.md` file with deployment instructions
- Create a `.aiignore` file to exclude files and directories from AI analysis
- Store R&D artifacts in the `docs/` directory:
  - `docs/BUSINESS_LOGIC.md` - Business requirements and logic
  - `docs/IMPLEMENTATION.md` - Implementation plan, status, and progress
  - `docs/ARCHITECTURE.md` - Technical approaches, stack decisions, and architecture

## Security Guidelines

- Set up a vault (e.g., Hardhat vault, Vault etc.) on your machine or repository to securely store private keys
- Never commit sensitive information directly to the repository
- Use environment variables or secure vault solutions for all secrets

## AI Pipeline Configuration

When configuring your AI development pipeline:

1. Follow the code generation pipeline steps above
2. Add security checks as the final step of the pipeline
3. Ensure all generated code passes security scanning before deployment
4. Implement automated testing as part of the generation workflow

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
