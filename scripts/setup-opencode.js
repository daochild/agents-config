#!/usr/bin/env node
'use strict';

const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const PACKAGE = '@daochild/agents-config';
const PACKAGE_PATH = 'node_modules/' + PACKAGE;
const RULE = PACKAGE_PATH + '/instructions/rules/prompt-sanity-guard.md';
const SKILLS = PACKAGE_PATH + '/instructions/skills';

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function statIfPresent(file) {
  try {
    return fs.lstatSync(file);
  } catch (error) {
    if (error.code === 'ENOENT') return null;
    throw error;
  }
}

function readObject(file, label) {
  const raw = fs.readFileSync(file, 'utf8');
  let value;
  try {
    value = JSON.parse(raw);
  } catch {
    throw new Error(label + ' must contain strict JSON; no files were changed.');
  }
  if (!isObject(value)) throw new Error(label + ' must be a JSON object.');
  return { raw, value };
}

function assertStrings(value, label) {
  if (!Array.isArray(value) || value.some((entry) => typeof entry !== 'string')) {
    throw new Error(label + ' must be an array of strings.');
  }
}

function main() {
  const args = process.argv.slice(2);
  if (args.length === 1 && (args[0] === '--help' || args[0] === '-h')) {
    process.stdout.write('Run from your project root: node ' + PACKAGE_PATH + '/scripts/setup-opencode.js\n');
    return;
  }
  if (args.length !== 0) throw new Error('Unsupported arguments; use --help for usage.');

  const cwd = process.cwd();
  const { value: pkg } = readObject(path.join(cwd, 'package.json'), 'package.json');
  const direct = [pkg.dependencies, pkg.devDependencies].some(
    (deps) => isObject(deps) && Object.hasOwn(deps, PACKAGE),
  );
  if (!direct) throw new Error(PACKAGE + ' must be a direct dependency in cwd/package.json.');

  const installed = path.join(cwd, PACKAGE_PATH);
  if (fs.realpathSync(installed) !== fs.realpathSync(path.join(__dirname, '..'))) {
    throw new Error('Run the setup script from this project\'s installed ' + PACKAGE + ' package.');
  }
  for (const relative of [RULE, SKILLS + '/prompt-sanity/SKILL.md']) {
    if (!fs.statSync(path.join(cwd, relative)).isFile()) {
      throw new Error('Required packaged source is not a file: ' + relative);
    }
  }

  const configPath = path.join(cwd, 'opencode.json');
  const originalStat = statIfPresent(configPath);
  if (statIfPresent(path.join(cwd, 'opencode.jsonc'))) {
    if (originalStat) {
      throw new Error('Both opencode.json and opencode.jsonc exist; resolve the conflicting configs manually before setup.');
    }
    throw new Error(
      'opencode.jsonc exists; refusing to shadow or rewrite it. Add "' + RULE +
      '" to instructions and "' + SKILLS + '" to skills.paths manually, then restart OpenCode.',
    );
  }
  if (originalStat && !originalStat.isFile()) {
    throw new Error('opencode.json must be a regular file, not a symlink or directory.');
  }
  const original = originalStat ? readObject(configPath, 'opencode.json') : null;
  const config = original ? original.value : { $schema: 'https://opencode.ai/config.json' };
  if (Object.hasOwn(config, 'instructions')) assertStrings(config.instructions, 'instructions');
  if (Object.hasOwn(config, 'skills') && !isObject(config.skills)) {
    throw new Error('skills must be an object.');
  }
  if (config.skills && Object.hasOwn(config.skills, 'paths')) {
    assertStrings(config.skills.paths, 'skills.paths');
  }

  const instructions = config.instructions || [];
  const skills = config.skills || {};
  const paths = skills.paths || [];
  if (instructions.includes(RULE) && paths.includes(SKILLS)) {
    process.stdout.write('[agents-config] Prompt Sanity rule and skill discovery already configured.\n');
    return;
  }
  if (!instructions.includes(RULE)) instructions.push(RULE);
  if (!paths.includes(SKILLS)) paths.push(SKILLS);
  config.instructions = instructions;
  config.skills = { ...skills, paths };

  const temporary = path.join(cwd, '.agents-config-setup-' + randomUUID() + '.tmp');
  let created = false;
  try {
    fs.writeFileSync(temporary, JSON.stringify(config, null, 2) + '\n', {
      flag: 'wx',
      mode: originalStat ? originalStat.mode & 0o777 : 0o600,
    });
    created = true;
    if (original) {
      const current = statIfPresent(configPath);
      if (!current || !current.isFile() || current.ino !== originalStat.ino ||
          fs.readFileSync(configPath, 'utf8') !== original.raw) {
        throw new Error('opencode.json changed during setup; retry when no other process is editing it.');
      }
      fs.renameSync(temporary, configPath);
      created = false;
    } else {
      // Link publishes a complete file without replacing a concurrently created config.
      fs.linkSync(temporary, configPath);
    }
  } finally {
    if (created) fs.unlinkSync(temporary);
  }
  process.stdout.write(
    '[agents-config] Configured inherited Prompt Sanity rule and packaged skill discovery in opencode.json.\n' +
    '[agents-config] Restart OpenCode. This registers guidance, not mandatory runtime prompt filtering.\n' +
    '[agents-config] Consumer check: node ' + PACKAGE_PATH + '/scripts/prompt-sanity-check.mjs --stdin --json\n',
  );
}

try {
  main();
} catch (error) {
  process.stderr.write('[agents-config] OpenCode setup failed: ' + error.message + '\n');
  process.exitCode = 1;
}
