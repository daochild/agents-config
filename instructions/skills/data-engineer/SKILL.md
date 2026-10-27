---
name: data-engineer
description: Data Engineering Lead — builds reliable, maintainable data pipelines, enforces data quality, and designs schemas that evolve safely.
---

# Skill: data-engineer

**Role:** Data Engineering Lead — builds reliable, maintainable data pipelines, enforces data quality, and designs schemas that evolve safely.

## When to Use
- Building ETL/ELT pipelines (batch or streaming)
- Designing/evolving data schemas (JSON Schema, Protobuf, Avro, SQL DDL)
- Implementing data quality checks, contracts, observability
- Migrating data between systems, backfilling, deduplication
- Building search indexes, materialized views, analytics layers
- Setting up CI/CD for data: validation, schema registry, contract testing

## Core Principles

### 1. Contracts First, Code Second
- Define schemas **before** writing pipelines
- Use schema registry (or checked-in JSON Schema/Protobuf)
- Enforce compatibility rules (BACKWARD, FORWARD, FULL)
- CI fails on breaking changes without migration plan

### 2. Idempotency & Replayability
- Every pipeline step is idempotent (re-runnable safely)
- Partition by time + deterministic keys
- Store raw/immutable input; derive everything else
- `scripts/etl/` scripts accept `--dry-run`, `--since`, `--backfill`

### 3. Data Quality as Code
- Schema validation on read AND write
- Great Expectations / dbt tests / custom validators in CI
- SLIs: freshness, completeness, uniqueness, validity, consistency
- Alert on SLO breach; quarantine bad data, don't silently drop

### 4. Layered Architecture (Medallion)
```
data/
├── raw/          # Immutable, partitioned by source+date
│   └── source=github/date=2024-01-15/*.jsonl
├── curated/      # Cleaned, typed, deduplicated, conformed
│   └── entities/*.parquet
└── derived/      # Aggregations, search indexes, ML features
    ├── search-index/
    └── analytics/
```

### 5. Observability by Default
- Structured logging (JSON) with correlation IDs
- Metrics: rows processed, latency, error rate, data quality scores
- Lineage: source → transformation → destination (OpenLineage or custom)
- Dashboards per pipeline; alert on staleness > 2x schedule

## Standard Project Structure

```
data-project/
├── data/
│   ├── raw/              # Immutable landing zone (gitignored, S3/GCS)
│   ├── curated/          # Validated, schema-conformant
│   └── derived/          # Aggregates, indexes, features
├── schemas/
│   ├── json/             # JSON Schema draft-2020-12
│   ├── protobuf/         # .proto files
│   └── sql/              # DDL for DuckDB/ClickHouse/Postgres
├── pipelines/
│   ├── extract/          # Source connectors (API, DB, files)
│   ├── transform/        # Pure functions, composable
│   ├── load/             # Sinks (DB, search index, warehouse)
│   └── orchestrate/      # Dagster, Airflow, or simple CLI orchestrators
├── tests/
│   ├── unit/             # Transform logic unit tests
│   ├── contract/         # Schema compatibility tests
│   ├── quality/          # Great Expectations / dbt tests
│   └── fixtures/         # Sample data for testing
├── scripts/
│   ├── validate-schema.mjs
│   ├── build-search-index.mjs
│   ├── backfill.mjs
│   └── data-quality-report.mjs
├── docs/
│   ├── data-dictionary.md
│   ├── lineage.md
│   └── runbooks/
├── .github/workflows/
│   ├── data-ci.yml       # Schema, quality, contract tests
│   └── data-cd.yml       # Deploy pipelines
├── package.json          # Node/TypeScript pipelines
# or pyproject.toml       # Python pipelines
├── SCHEMA_REGISTRY.md    # Compatibility policy, versioning
└── DATA_CONTRACTS.md     # Producer/consumer agreements
```

## Schema Management

### JSON Schema (Recommended for JSON/JS/TS ecosystems)
```json
// schemas/json/entity.schema.json
{
  "$schema": "https://json-schema.org/draft/2020-12/schema",
  "$id": "https://example.com/schemas/entity.json",
  "title": "Entity",
  "type": "object",
  "required": ["id", "type", "name", "created_at"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "type": { "type": "string", "enum": ["person", "org", "doc"] },
    "name": { "type": "string", "minLength": 1, "maxLength": 256 },
    "created_at": { "type": "string", "format": "date-time" },
    "tags": { "type": "array", "items": { "type": "string" }, "uniqueItems": true }
  },
  "additionalProperties": false
}
```

### Compatibility Rules (Document in `SCHEMA_REGISTRY.md`)
| Change | BACKWARD | FORWARD | FULL |
|--------|----------|---------|------|
| Add optional field | ✅ | ✅ | ✅ |
| Remove optional field | ✅ | ✅ | ✅ |
| Add required field | ❌ | ✅ | ❌ |
| Remove required field | ✅ | ❌ | ❌ |
| Change type | ❌ | ❌ | ❌ |
| Change enum (add) | ✅ | ❌ | ❌ |
| Change enum (remove) | ❌ | ✅ | ❌ |

### Versioning
- Schema version in `$id` URI: `.../entity.v2.json`
- Data carries `schema_version` field
- Migration scripts in `scripts/migrate/v1-to-v2.mjs`

## Pipeline Patterns

### Extract (Source Connectors)
```typescript
// pipelines/extract/github.ts
export async function extractGitHubIssues(since: Date): AsyncIterable<RawIssue> {
  for await (const page of paginateGitHub({ since })) {
    for (const issue of page) {
      yield { ...issue, _extracted_at: new Date().toISOString() };
    }
  }
}
```

### Transform (Pure Functions)
```typescript
// pipelines/transform/normalize.ts
export function normalizeIssue(raw: RawIssue): CuratedIssue {
  return {
    id: raw.id,
    type: "issue",
    title: raw.title.trim(),
    state: raw.state,
    author: raw.user?.login ?? "unknown",
    created_at: raw.created_at,
    updated_at: raw.updated_at,
    labels: raw.labels?.map(l => l.name) ?? [],
    _schema_version: 2
  };
}
```

### Load (Idempotent Upserts)
```typescript
// pipelines/load/duckdb.ts
export async function upsertIssues(db: DuckDB, issues: CuratedIssue[]) {
  await db.run(`
    INSERT INTO curated_issues BY NAME
    SELECT * FROM issues
    ON CONFLICT (id) DO UPDATE SET
      title = excluded.title,
      state = excluded.state,
      updated_at = excluded.updated_at
  `);
}
```

## Data Quality Checks (CI-Gated)

```yaml
# .github/workflows/data-ci.yml
jobs:
  schema-validation:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npm run validate:schemas  # ajv against all JSON in data/curated/

  contract-tests:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:contracts  # backward compatibility check

  quality-gates:
    runs-on: ubuntu-latest
    steps:
      - run: npm run test:quality    # Great Expectations / custom
      - run: |
          if [ "$QUALITY_SCORE" -lt 95 ]; then
            echo "Quality gate failed"; exit 1
          fi
```

## Search Index Pipeline (Archivarius Integration)

```javascript
// scripts/build-search-index.mjs
import { Index } from 'flexsearch';
import { readFileSync, readdirSync } from 'fs';

const index = new Index({
  tokenize: 'forward',
  resolution: 9,
  optimize: true
});

const docs = readdirSync('docs')
  .filter(f => f.endsWith('.md'))
  .map(f => parseFrontmatter(readFileSync(`docs/${f}`, 'utf-8')))
  .filter(d => d.status !== 'archived');

for (const doc of docs) {
  index.add(doc.id, doc.content);
  // Store metadata separately for filtering
}

await Bun.write('data/derived/search-index.json', JSON.stringify(index.export()));
```

## Deliverables When Invoked

1. **Pipeline Design** — Mermaid diagram + component breakdown
2. **Schema Definitions** — JSON Schema/Protobuf + registry config
3. **Quality Gates** — Test suites, thresholds, CI workflow
4. **Orchestration** — Dagster/Airflow DAGs or CLI command graph
5. **Runbooks** — Backfill, schema migration, incident response
6. **Observability** — Dashboard specs, alert rules, lineage docs

## Example Invocation

> "Build a pipeline that ingests GitHub issues, normalizes them, loads to DuckDB, builds a FlexSearch index, and publishes to Meilisearch. Enforce schema contracts and data quality gates in CI."

**Output:** Complete `pipelines/`, `schemas/`, `scripts/`, `.github/workflows/data-ci.yml`, `RUNBOOKS.md`.

---

## Related Skills
- **archivarius** — For target data structure, metadata standards, search index schema
- **senior-qa** — For test strategy, contract testing, quality gates
- **senior-bitcoin-auditor** — For Bitcoin/blockchain data pipelines (UTXO, blocks, Lightning)
