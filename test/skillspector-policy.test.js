'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const skillspectorRule = 'instructions/rules/nvidia-skillspector-check.md';

const ALWAYS_ON_RULES = [
  'instructions/rules/sdlc-gates.md',
  'instructions/rules/harness-engineering.md',
  skillspectorRule,
];

function escapeRe(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

test('opencode always-on instructions include every documented harness and skillspector rule', () => {
  const config = JSON.parse(fs.readFileSync(path.join(root, 'opencode.json'), 'utf8'));
  for (const rule of ALWAYS_ON_RULES) {
    assert.ok(
      config.instructions.includes(rule),
      `opencode.json instructions must include ${rule}`,
    );
    assert.ok(fs.statSync(path.join(root, rule)).isFile(), `${rule} must exist`);
  }

  const agents = fs.readFileSync(path.join(root, 'AGENTS.md'), 'utf8');
  for (const rule of ALWAYS_ON_RULES) {
    assert.match(agents, new RegExp(escapeRe(rule)));
  }
  assert.match(agents, /three always-on rules/);
});

test('find-skills and CONTRIBUTING point skill contributors at Skillspector', () => {
  const findSkills = fs.readFileSync(
    path.join(root, 'instructions/skills/find-skills/SKILL.md'),
    'utf8',
  );
  const contributing = fs.readFileSync(path.join(root, 'CONTRIBUTING.md'), 'utf8');
  const readme = fs.readFileSync(path.join(root, 'README.md'), 'utf8');
  const needle = escapeRe(skillspectorRule);

  assert.match(findSkills, new RegExp(needle));
  assert.match(findSkills, /Step 4b/);
  assert.match(contributing, new RegExp(needle));
  assert.match(readme, new RegExp(needle));
});

test('skillspector rule links gates, discovery skill, and instructions/skills install path', () => {
  const rule = fs.readFileSync(path.join(root, skillspectorRule), 'utf8');
  assert.match(rule, /sdlc-gates\.md/);
  assert.match(rule, /harness-engineering\.md/);
  assert.match(rule, /find-skills/);
  assert.match(rule, /instructions\/skills\//);
  assert.match(rule, /skills-lock\.json/);
});
