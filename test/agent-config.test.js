'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const config = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'));

function readReference(reference) {
  const match = /^\{file:\.\/([^}]+)\}/.exec(reference);
  assert.ok(match, `Expected a project-relative file reference: ${reference}`);
  return fs.readFileSync(path.join(root, match[1]), 'utf8');
}

test('discoverable config resolves every agent, instruction, and skill path', () => {
  assert.equal(config.$schema, 'https://opencode.ai/config.json');
  for (const agent of Object.values(config.agent)) {
    assert.equal(agent.mode, 'subagent');
    assert.ok(readReference(agent.prompt).length > 0);
  }
  for (const instruction of config.instructions) {
    assert.ok(fs.statSync(path.join(root, instruction)).isFile());
  }
  for (const directory of config.skills.paths) {
    assert.ok(fs.statSync(path.join(root, directory)).isDirectory());
  }
});

test('both flows register a command, argument template, and existing agent', () => {
  for (const [command, agent] of [
    ['sdlc', 'sdlc-orchestrator'],
    ['harness', 'harness-orchestrator'],
  ]) {
    const entry = config.command[command];
    assert.equal(entry.agent, agent);
    assert.equal(entry.subtask, true);
    assert.ok(config.agent[entry.agent]);
    assert.match(entry.template, /\$ARGUMENTS/);
    assert.ok(readReference(entry.template).length > 0);
  }
});

test('harness verifier is read-only with no executor or shell capability', () => {
  assert.deepEqual(config.agent['harness-verifier'].permission, {
    '*': 'deny',
    read: {
      '*': 'allow',
      '.env': 'deny',
      '.env.*': 'deny',
      '**/.env': 'deny',
      '**/.env.*': 'deny',
      '**/secrets/**': 'deny',
    },
    glob: 'allow',
    grep: 'allow',
    skill: 'allow',
  });
  const orchestrator = readReference(config.agent['harness-orchestrator'].prompt);
  assert.match(orchestrator, /sdlc-orchestrator/);
  assert.match(orchestrator, /harness-verifier/);
  assert.match(orchestrator, /exhausted limits/);
  assert.match(orchestrator, /return BLOCKED/);
});

test('bounded nesting supports harness to SDLC to role without direct coordinator execution', () => {
  assert.equal(config.experimental.subagent_depth, 3);
  const permission = config.agent['harness-orchestrator'].permission;
  assert.equal(permission['*'], 'deny');
  assert.equal(permission.question, 'allow');
  assert.equal(permission.read['**/.env'], 'deny');
  assert.deepEqual(permission.task, {
    '*': 'deny',
    general: 'allow',
    'sdlc-orchestrator': 'allow',
    'harness-verifier': 'allow',
  });
});

test('SDLC dispatch documents cross-client role resolution without skipping gates', () => {
  const orchestrator = readReference(config.agent['sdlc-orchestrator'].prompt);
  assert.match(orchestrator, /general-purpose/);
  assert.match(orchestrator, /fresh\s+subagent/);
  assert.match(orchestrator, /Preserve all gates/);
  assert.match(orchestrator, /host-capability blocker/);
});
