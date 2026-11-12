'use strict';

const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');

function readIfExists(filePath) {
  return fs.existsSync(filePath) ? fs.readFileSync(filePath, 'utf8') : null;
}

function stripClaudeAgentMode(content) {
  return content.replace(/^mode: subagent\r?\n/m, '');
}

function assertCounterpart(label, expected, actual) {
  assert.ok(actual !== null, `${label} is missing but the instruction source exists`);
  assert.equal(actual, expected, `${label} must match the instruction source`);
}

test('maintained client counterparts match instruction sources when present', () => {
  const agentDir = path.join(root, 'instructions/agent');
  for (const entry of fs.readdirSync(agentDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }
    const source = fs.readFileSync(path.join(agentDir, entry.name), 'utf8');
    const agentsMirror = readIfExists(path.join(root, '.agents/agents', entry.name));
    const claudeMirror = readIfExists(path.join(root, '.claude/agents', entry.name));
    if (agentsMirror !== null) {
      assertCounterpart(`.agents/agents/${entry.name}`, source, agentsMirror);
    }
    if (claudeMirror !== null) {
      assertCounterpart(
        `.claude/agents/${entry.name}`,
        stripClaudeAgentMode(source),
        claudeMirror,
      );
    }
  }

  const commandDir = path.join(root, 'instructions/command');
  for (const entry of fs.readdirSync(commandDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }
    const source = fs.readFileSync(path.join(commandDir, entry.name), 'utf8');
    for (const mirrorRoot of ['.agents/commands', '.claude/commands']) {
      const mirror = readIfExists(path.join(root, mirrorRoot, entry.name));
      if (mirror !== null) {
        assertCounterpart(`${mirrorRoot}/${entry.name}`, source, mirror);
      }
    }
  }

  const rulesDir = path.join(root, 'instructions/rules');
  for (const entry of fs.readdirSync(rulesDir, { withFileTypes: true })) {
    if (!entry.isFile() || !entry.name.endsWith('.md')) {
      continue;
    }
    const source = fs.readFileSync(path.join(rulesDir, entry.name), 'utf8');
    for (const mirrorRoot of ['.agents/rules', '.claude/rules']) {
      const mirror = readIfExists(path.join(root, mirrorRoot, entry.name));
      if (mirror !== null) {
        assertCounterpart(`${mirrorRoot}/${entry.name}`, source, mirror);
      }
    }
  }

  const skillsDir = path.join(root, 'instructions/skills');
  for (const entry of fs.readdirSync(skillsDir, { withFileTypes: true })) {
    if (!entry.isDirectory()) {
      continue;
    }
    const sourcePath = path.join(skillsDir, entry.name, 'SKILL.md');
    if (!fs.existsSync(sourcePath)) {
      continue;
    }
    const source = fs.readFileSync(sourcePath, 'utf8');
    for (const mirrorRoot of ['.agents/skills', '.claude/skills']) {
      const mirrorPath = path.join(root, mirrorRoot, entry.name, 'SKILL.md');
      const mirror = readIfExists(mirrorPath);
      if (mirror !== null) {
        assertCounterpart(`${mirrorRoot}/${entry.name}/SKILL.md`, source, mirror);
      }
    }
  }
});
