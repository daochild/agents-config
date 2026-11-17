# PRD — opencode-consumer-setup

> SDLC stage 2 (Technical specification). Owner: `sdlc-pm`.
> Traceability id (slug): `opencode-consumer-setup`.
> Input: `docs/business/opencode-consumer-setup-analysis.md`.

## Goal

Let a consumer explicitly register the package's inherited Prompt Sanity rule and
skill discovery path in the consumer-root OpenCode configuration, without
copying sources, introducing runtime filtering, or changing package lifecycle
behavior.

## User stories

1. As a consumer maintainer, I can run a documented command from my project root
   to register the package-provided Prompt Sanity instructions.
2. As a consumer maintainer, I can safely repeat setup without duplicate entries
   or loss of unrelated OpenCode configuration.
3. As a consumer using JSONC or an unsafe config path, I receive an actionable
   explanation rather than an overwritten or shadowing config file.

## Acceptance criteria

### Invocation and package resolution

- **AC-1 — Explicit CLI:** `scripts/setup-opencode.js` is runnable with
  `node node_modules/@daochild/agents-config/scripts/setup-opencode.js` from the
  consumer root. There is no `postinstall`, `prepare`, or other lifecycle
  integration for this setup.
- **AC-2 — Direct dependency:** setup proceeds only when
  `@daochild/agents-config` is a direct dependency in the consumer-root
  `dependencies` or `devDependencies`. Missing, malformed, or transitive-only
  declarations fail with a clear, actionable nonzero error.
- **AC-3 — Symlink-safe source resolution:** the CLI locates the installed
  package sources correctly when the package path is a pnpm-style symlink. The
  config entries remain relative to the consumer root and use the exact paths
  below; no absolute machine-specific paths are written.
- **AC-4 — CWD boundary:** only `process.cwd()` is considered the consumer root.
  The CLI does not search parent/sibling directories, use `INIT_CWD`, or write
  outside that root.

### Config selection and safe mutation

- **AC-5 — Strict JSON and JSONC conflict handling:**
  - If neither `opencode.json` nor `opencode.jsonc` exists, create
    `opencode.json`.
  - If only a regular `opencode.json` exists, parse it as strict JSON.
  - If only `opencode.jsonc` exists, do not parse it or create a shadowing
    `opencode.json`; fail with manual instructions to add the entries to the
    existing JSONC config.
  - If both names exist, fail as ambiguous and explain that the consumer must
    resolve the conflict manually.
  - Invalid strict JSON fails without modifying the file.
- **AC-6 — Safe file types:** do not follow, truncate, or replace a symlink at
  either config path. Reject symlinks and non-regular config files (including
  directories) with an actionable error and no write.
- **AC-7 — Preserve and merge:** preserve all existing top-level options,
  nested options, and unknown fields. Append the following exact entries only
  when not already present:
  - `node_modules/@daochild/agents-config/instructions/rules/prompt-sanity-guard.md`
    in the `instructions` array.
  - `node_modules/@daochild/agents-config/instructions/skills` in
    `skills.paths`.
  Missing `instructions`, `skills`, or `skills.paths` containers are created as
  needed. If a required container has an incompatible type, fail without
  changing the file. Re-running setup adds no further entries.
- **AC-8 — Complete write or no write:** validate the dependency, config format,
  and merge structure before writing. Errors are actionable and nonzero; an
  unsupported or invalid state must not leave a partial or partially merged
  config.
- **AC-9 — Restart notice:** successful setup tells the consumer to restart
  OpenCode because configuration is loaded at startup.

### Scope, security, and documentation

- **AC-10 — No source copying or runtime filter:** do not copy the rule or skill
  into the consumer. Do not add a plugin or implement runtime prompt filtering;
  setup only registers inherited source paths.
- **AC-11 — Lifecycle and dependency unchanged:** do not add dependencies or
  alter package lifecycle scripts. In particular, leave
  `scripts/postinstall.js` and its exit-0, cwd-only contract unchanged.
- **AC-12 — Consumer command documentation:** update consumer-facing README
  instructions in the implementation stage to include the explicit setup
  command and restart step. For running the packaged prompt checker from a
  consumer, document
  `node node_modules/@daochild/agents-config/scripts/prompt-sanity-check.mjs`;
  do not imply that the package's own `npm run prompt-sanity:check` script is
  installed in the consumer.
- **AC-13 — Failure guidance:** every supported rejection (missing direct
  dependency, JSONC-only, both config variants, malformed JSON, invalid
  container types, symlink, or non-regular config) provides enough guidance to
  resolve the issue manually; no such failure silently reports success.

## Edge cases and negative paths

- Package is available only transitively, or only in `peerDependencies` /
  `optionalDependencies`: reject as not a direct dependency.
- Consumer invokes the command from the wrong directory: operate only on that
  current directory and report missing direct dependency/config context; do not
  guess another root.
- Existing config contains one or both exact entries: preserve it without
  appending another copy.
- Existing config has unrelated unknown keys: retain their values.
- Existing JSON contains comments, trailing commas, or other JSONC syntax:
  reject as invalid strict JSON; do not attempt repair.
- `instructions`, `skills`, or `skills.paths` exists with a non-array /
  incompatible shape: reject without writing.
- Config path is absent, a regular file, symlink, directory, or other special
  file: only the absent and regular-file cases are eligible for creation/merge.
- Package is installed through a symlink: source validation must work while the
  emitted OpenCode paths remain consumer-root-relative.
- After successful setup, repeated invocation is idempotent.

## Out of scope

- Editing or relaxing the prompt-sanity rule/skill source.
- Copying any package source into consumer projects.
- Runtime filtering, an OpenCode plugin, or a new skill/mirror.
- Automatic setup during installation or any changes to
  `scripts/postinstall.js`.
- JSONC parsing, format conversion, config precedence migration, or automatic
  conflict resolution when both config files exist.
- Ancestor/workspace discovery, `INIT_CWD`, global configuration, and writes
  outside the invoking consumer root.
- Dependencies, package lifecycle changes, and changes to other client
  configurations.
- Implementation, tests, security review, code review, or deployment in this
  preparation-only stage.

## Priority and sequencing

1. Implement the bounded standalone CLI and its merge/failure semantics.
2. Add focused tests for invocation, merge/idempotence, filesystem safety,
   strict-JSON/JSONC behavior, and symlinked package resolution.
3. Update README consumer instructions, including both the setup command and
   packaged Prompt Sanity checker path.
4. Run independent security and code review, then validate the consumer install
   path. Deployment/publish approval remains a separate gate.

## Requirement Gate self-check

- [x] Requirement is clearly defined.
- [x] Acceptance criteria are testable.
- [x] Edge cases and negative paths are identified.
- [x] Business requirements and non-goals are understood.

```text
HANDOFF: sdlc-architect | artifact: docs/business/opencode-consumer-setup-prd.md | gate: pass
```
