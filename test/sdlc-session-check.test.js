'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const test = require('node:test');

const {
  DEFAULT_MODEL,
  READ_ONLY_CONFIG,
  assess,
  describeEvent,
  parseArgs,
  countGateStatuses,
  treeSnapshot,
} = require('../scripts/sdlc-session-check');

const COMPLETE_RESPONSE = `Risk: low (documentation-only, read-only).
Requirement Gate: NOT RUN, no change requested.
Architecture Gate: NOT APPLICABLE, no architecture changes.
Implementation Gate: NOT RUN, no files were modified.
Testing Gate: NOT RUN, this diagnostic did not change code.
Security Gate: NOT RUN, no security-sensitive change.
Code Review Gate: NOT RUN, no code change.
Deployment Gate: NOT APPLICABLE, nothing was deployed.
Definition of Done: NOT CLAIMED; this was read-only.`;

test('defaults to an OpenCode Zen model candidate and parses overrides', () => {
  assert.equal(parseArgs([]).model, DEFAULT_MODEL);
  assert.equal(parseArgs(['--model', 'openrouter/provider/model:free']).model, 'openrouter/provider/model:free');
  assert.throws(() => parseArgs(['--model', 'invalid']), /provider\/model/);
});

test('read-only config denies shell and all file mutations', () => {
  assert.equal(READ_ONLY_CONFIG.permission['*'], 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.edit, 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.bash, 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.task, 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.todowrite, 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.lsp, 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.read['.env'], 'deny');
  assert.equal(READ_ONLY_CONFIG.permission.read['**/.env'], 'deny');
});

test('records subagent names and write tool attempts without arguments or output', () => {
  const record = describeEvent({
    type: 'tool_use',
    sessionID: 'session-safe-id',
    part: {
      type: 'tool',
      tool: 'task',
      state: {
        status: 'completed',
        input: { subagent_type: 'sdlc-architect', prompt: 'private prompt' },
        output: 'private output',
      },
    },
  });
  assert.equal(record.session_id, 'session-safe-id');
  assert.equal(record.subagent, 'sdlc-architect');
  assert.equal(record.write_attempt, false);
  assert.equal('input' in record, false);
  assert.equal('output' in record, false);

  const editAttempt = describeEvent({
    type: 'tool_use',
    part: { type: 'tool', tool: 'edit', state: { status: 'rejected', input: { filePath: 'secret-path' } } },
  });
  assert.equal(editAttempt.write_attempt, true);
  assert.equal('filePath' in editAttempt, false);

  const patchAttempt = describeEvent({
    type: 'tool_use',
    part: { type: 'tool', tool: 'apply_patch', state: { status: 'rejected', input: { patch: 'private patch' } } },
  });
  assert.equal(patchAttempt.write_attempt, true);
  assert.equal(assess(COMPLETE_RESPONSE, [patchAttempt], { hash: 'same', files: 1 }, { hash: 'same', files: 1 }, 0).passed, false);
});

test('fails assessment when a write tool is attempted or a gate is omitted', () => {
  const before = { hash: 'same', files: 0 };
  const after = { hash: 'same', files: 0 };
  const writeAttempt = [{ write_attempt: true, status: 'rejected' }];
  const failed = assess(COMPLETE_RESPONSE, writeAttempt, before, after, 0);
  assert.equal(failed.no_write_tool_attempts, false);
  assert.equal(failed.passed, false);

  const incomplete = assess('Risk: low. Requirement Gate.', [], before, after, 0);
  assert.equal(incomplete.all_gate_names_reported, false);
  assert.equal(incomplete.passed, false);

  const labelsWithoutStatuses = COMPLETE_RESPONSE.replaceAll(': NOT RUN', ': mentioned');
  assert.equal(Object.values(countGateStatuses(labelsWithoutStatuses)).every(Boolean), false);
  assert.equal(assess(labelsWithoutStatuses, [], before, after, 0).passed, false);

  const blockedShell = describeEvent({
    type: 'tool_use',
    part: { type: 'tool', tool: 'bash', state: { status: 'error' } },
  });
  const blockedAssessment = assess(COMPLETE_RESPONSE, [blockedShell], before, after, 0);
  assert.equal(blockedAssessment.no_write_tool_attempts, true);
  assert.equal(blockedAssessment.no_write_observed, true);
  assert.equal(blockedAssessment.blocked_tool_attempts, 1);
  assert.equal(blockedAssessment.passed, false);
});

test('passes when the response reports every gate and the worktree remains unchanged', () => {
  const result = assess(COMPLETE_RESPONSE, [], { hash: 'same', files: 0 }, { hash: 'same', files: 0 }, 0);
  assert.equal(result.passed, true);
});

test('repository snapshot detects changes to ignored and already-modified files', async (t) => {
  const root = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sdlc-snapshot-'));
  t.after(() => fs.promises.rm(root, { recursive: true, force: true }));
  await fs.promises.mkdir(path.join(root, '.git'));
  await fs.promises.writeFile(path.join(root, '.git', 'ignored-metadata'), 'excluded');
  await fs.promises.writeFile(path.join(root, 'ignored-file'), 'before');

  const before = await treeSnapshot(root);
  await fs.promises.writeFile(path.join(root, 'ignored-file'), 'after');
  const after = await treeSnapshot(root);
  assert.notEqual(before.hash, after.hash);
  assert.equal(before.files, 1);
  assert.equal(after.files, 1);
});

test('CLI stores only sanitized per-session metadata outside the repository', async (t) => {
  const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sdlc-session-check-'));
  t.after(() => fs.promises.rm(tempRoot, { recursive: true, force: true }));

  const repoRoot = path.join(tempRoot, 'repo');
  await fs.promises.mkdir(repoRoot);
  const gitInit = spawnSync('git', ['init', '--quiet'], { cwd: repoRoot, encoding: 'utf8' });
  assert.equal(gitInit.status, 0, gitInit.stderr);
  await fs.promises.writeFile(path.join(repoRoot, 'AGENTS.md'), 'test instructions\n');
  const fakeCli = path.join(tempRoot, 'fake-opencode.js');
  const logDir = path.join(tempRoot, 'logs');
  const fakeOutput = [
    { type: 'step_start', sessionID: 'mock-session' },
    {
      type: 'tool_use',
      sessionID: 'mock-session',
      part: { type: 'tool', tool: 'read', state: { status: 'completed', input: { filePath: 'README.md' } } },
    },
    { type: 'text', sessionID: 'mock-session', part: { type: 'text', text: COMPLETE_RESPONSE } },
  ];
  const fakeSource = `#!/usr/bin/env node
const config = JSON.parse(process.env.OPENCODE_CONFIG_CONTENT);
if (config.permission.edit !== 'deny' || config.permission.bash !== 'deny') process.exit(9);
for (const event of ${JSON.stringify(fakeOutput)}) console.log(JSON.stringify(event));
`;
  await fs.promises.writeFile(fakeCli, fakeSource, { mode: 0o700 });

  const script = path.resolve(__dirname, '../scripts/sdlc-session-check.js');
  const result = spawnSync(process.execPath, [script, '--opencode', fakeCli, '--model', 'opencode/test-free', '--log-dir', logDir], {
    cwd: repoRoot,
    encoding: 'utf8',
    timeout: 10_000,
  });

  assert.equal(result.status, 0, result.stderr);
  const runDirectories = await fs.promises.readdir(logDir);
  assert.equal(runDirectories.length, 1);
  const runDirectory = path.join(logDir, runDirectories[0]);
  const summary = JSON.parse(await fs.promises.readFile(path.join(runDirectory, 'summary.json'), 'utf8'));
  const events = await fs.promises.readFile(path.join(runDirectory, 'events.jsonl'), 'utf8');
  assert.equal(summary.session_id, 'mock-session');
  assert.deepEqual(summary.observed_sdlc_roles, []);
  assert.deepEqual(summary.observed_tools, ['read']);
  assert.equal(summary.assessment.passed, true);
  assert.equal(summary.privacy.prompt_saved, false);
  assert.equal(events.includes('private prompt'), false);
  assert.equal(events.includes('private output'), false);
  assert.equal(events.includes('subagent_type'), false);
});

test('CLI rejects a log directory inside the repository', async () => {
  const tempRoot = await fs.promises.mkdtemp(path.join(os.tmpdir(), 'sdlc-log-path-'));
  try {
    const repoRoot = path.join(tempRoot, 'repo');
    await fs.promises.mkdir(repoRoot);
    const gitInit = spawnSync('git', ['init', '--quiet'], { cwd: repoRoot, encoding: 'utf8' });
    assert.equal(gitInit.status, 0, gitInit.stderr);
    const script = path.resolve(__dirname, '../scripts/sdlc-session-check.js');
    const result = spawnSync(process.execPath, [script, '--log-dir', path.join(repoRoot, 'test-logs')], {
      cwd: repoRoot,
      encoding: 'utf8',
      timeout: 10_000,
    });
    assert.equal(result.status, 2);
    assert.match(result.stderr, /outside the repository/);
    assert.equal(fs.existsSync(path.join(repoRoot, 'test-logs')), false);
  } finally {
    await fs.promises.rm(tempRoot, { recursive: true, force: true });
  }
});
