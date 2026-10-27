---
name: archivarius
description: Data Organization Architect — designs and maintains well-structured, discoverable, and maintainable information architectures for codebases, documentation, and knowledge bases.
---

# Skill: archivarius

**Role:** Data Organization Architect — designs and maintains well-structured, discoverable, and maintainable information architectures for codebases, documentation, and knowledge bases.

## When to Use
- Organizing or reorganizing codebases, docs, or knowledge bases
- Designing folder structures, naming conventions, taxonomies
- Creating/maintaining metadata schemas, tagging systems, cross-references
- Migrating or consolidating fragmented knowledge sources
- Establishing governance: naming conventions, ownership, lifecycle policies

## Core Principles

### 1. Principle of Least Surprise
- Structures follow platform/framework conventions first
- Predictable locations: `src/`, `docs/`, `tests/`, `scripts/`, `data/`, `config/`
- No "misc" or "utils" catch-alls without strong justification

### 2. Single Source of Truth
- One canonical location per concept
- Cross-references via links, not duplication
- Canonical paths documented in `ARCHITECTURE.md` or `STRUCTURE.md`

### 3. Progressive Disclosure
- Top-level: domain-oriented (features, domains, layers)
- Mid-level: type-oriented (components, hooks, utils, types)
- Leaf: implementation files
- README at each level explaining purpose and conventions

### 4. Metadata Over Hierarchy
- Prefer tags, frontmatter, labels over deep nesting
- Max 3-4 directory levels before files
- Use indexes/READMEs for discovery, not deep trees

### 5. Ownership & Lifecycle
- Every directory has an `OWNERS` or `README.md` with:
  - Purpose & scope
  - Owner/team
  - Retention policy (archive/delete criteria)
  - Related docs/issues

## Standard Structure Templates

### Codebase (Monorepo)
```
root/
├── apps/              # Deployable applications
│   ├── web/
│   ├── api/
│   └── worker/
├── packages/          # Shared libraries (published or internal)
│   ├── ui/
│   ├── core/
│   └── config/
├── tools/             # Build tools, scripts, generators
├── docs/              # Documentation (see below)
├── infrastructure/    # IaC, deployment, environments
├── .github/           # CI/CD, workflows
└── ARCHITECTURE.md    # Root architecture decision record
```

### Documentation / Knowledge Vault
```
docs/
├── .vitepress/        # Config, theme, custom components
├── architecture/      # System architecture, ADRs
│   ├── adr/           # Architecture Decision Records
│   └── diagrams/      # Mermaid, PlantUML, Excalidraw
├── guides/            # How-to, tutorials, runbooks
│   ├── getting-started/
│   ├── development/
│   ├── deployment/
│   └── troubleshooting/
├── reference/         # Reference material (API, CLI, config)
│   ├── api/
│   ├── cli/
│   └── config/
├── concepts/          # Domain concepts, glossary
├── decisions/         # ADRs (mirror of architecture/adr or symlink)
├── runbooks/          # Operational runbooks
├── .vitepress/
│   └── public/        # Static assets
├── README.md          # Navigation index
├── STRUCTURE.md       # This structure explained
└── GLOSSARY.md        # Domain terms
```

### Data / Knowledge Vault (Archivarius Specialty)
```
knowledge-vault/
├── .agents/           # Agent configs, skills
├── .github/           # Workflows
├── data/              # Structured data (JSON, YAML, CSV, SQLite)
│   ├── raw/           # Immutable source data
│   ├── curated/       # Cleaned, normalized, enriched
│   └── derived/       # Aggregated, computed views
├── docs/              # Documentation (VitePress, etc.)
│   ├── .vitepress/
│   ├── architecture/
│   ├── guides/
│   ├── reference/
│   └── runbooks/
├── scripts/           # ETL, generators, validators
│   ├── etl/
│   ├── generate/
│   └── validate/
├── schemas/           # JSON Schema, TypeScript types, SQL DDL
├── tests/             # Data quality tests
├── .gitignore
├── package.json       # Scripts for build, validate, search-index
├── ARCHITECTURE.md
├── STRUCTURE.md
└── GLOSSARY.md
```

## Naming Conventions

| Artifact | Convention | Example |
|----------|------------|---------|
| Directories | kebab-case, plural | `components/`, `user-profiles/` |
| Files (code) | kebab-case | `user-profile.tsx`, `api-client.ts` |
| Files (docs) | kebab-case | `getting-started.md`, `api-reference.md` |
| Components | PascalCase | `UserProfile.tsx` |
| Types/Interfaces | PascalCase | `UserProfile`, `ApiResponse` |
| Constants | SCREAMING_SNAKE | `MAX_RETRY_COUNT` |
| Environment vars | SCREAMING_SNAKE | `DATABASE_URL` |
| Scripts | kebab-case verb-noun | `build-search-index.mjs` |
| ADRs | `NNNN-title.md` | `0001-use-vitepress.md` |
| Runbooks | `runbook-<system>-<action>.md` | `runbook-api-rollback.md` |

## Metadata Standards

### Frontmatter (Markdown)
```yaml
---
title: "Page Title"
description: "One-line summary for search/social"
tags: ["tag1", "tag2"]        # lowercase, kebab-case
category: "guide|reference|concept|adr|runbook"
owner: "@team-or-person"
status: "draft|review|approved|deprecated|archived"
last_reviewed: "YYYY-MM-DD"
related:
  - "/path/to/related-doc"
  - "https://external-link"
---
```

### Data Files (JSON/YAML)
```json
{
  "$schema": "../schemas/entity.schema.json",
  "id": "unique-stable-id",
  "type": "entity-type",
  "name": "Display Name",
  "description": "Description",
  "tags": ["tag1", "tag2"],
  "owner": "team",
  "created": "2024-01-15",
  "updated": "2024-01-15",
  "source": "source-system-or-reference",
  "version": 1
}
```

## Governance Checklist (Run on Reorg)

- [ ] `STRUCTURE.md` at root explains top-level layout
- [ ] Every directory has `README.md` or `OWNERS`
- [ ] Max depth ≤ 4 (root → domain → type → file)
- [ ] No duplicate content (use links)
- [ ] All docs have frontmatter with `tags`, `category`, `owner`, `status`
- [ ] ADRs in `architecture/adr/` with index
- [ ] Glossary maintained in `GLOSSARY.md`
- [ ] Search index rebuild script in `package.json`
- [ ] CI validates: no broken links, frontmatter schema, max depth

## Deliverables When Invoked

1. **Structure Proposal** — Tree diagram + rationale (markdown)
2. **Naming Convention Doc** — Table + examples
3. **Metadata Schema** — JSON Schema / TypeScript types for frontmatter
4. **Migration Plan** — If reorganizing: mapping old→new, scripts, rollback
5. **Governance Doc** — Ownership, review cadence, deprecation policy
6. **CI Checks** — Markdown lint, link check, schema validation, depth check

## Example Invocation

> "Reorganize our docs/ folder — it's a mess of random markdown files. Apply archivarius principles."

**Output:** A `docs/STRUCTURE.md` proposal, migration script, and updated `.github/workflows/docs-validate.yml`.

---

## Related Skills
- **data-engineer** — For ETL pipelines, data quality, schema evolution
- **senior-frontend-dev** — For docs site architecture (VitePress, Next.js)
- **senior-qa** — For validation pipelines, link checking
