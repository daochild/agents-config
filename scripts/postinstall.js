'use strict';

const fs = require('node:fs');
const path = require('node:path');
const process = require('node:process');

const PACKAGE_NAME = '@daochild/agents-config';
const POINTER_LINE = 'Primary instructions: node_modules/@daochild/agents-config/AGENTS.md — follow unless overridden below.';

function notice(msg) {
  process.stdout.write(msg + '\n');
}

function isDirectDependency(pkg) {
  if (!pkg || typeof pkg !== 'object') return false;
  const deps = pkg.dependencies;
  const devDeps = pkg.devDependencies;
  return (deps && Object.prototype.hasOwnProperty.call(deps, PACKAGE_NAME)) ||
         (devDeps && Object.prototype.hasOwnProperty.call(devDeps, PACKAGE_NAME));
}

function readConsumerPackageJson(cwd) {
  const pkgPath = path.join(cwd, 'package.json');
  let raw;
  try {
    raw = fs.readFileSync(pkgPath, 'utf8');
  } catch (e) {
    return null;
  }
  try {
    return JSON.parse(raw);
  } catch (e) {
    return null;
  }
}

function buildInitContent(cwd) {
  const title = path.basename(cwd);
  return '# ' + title + '\n\n' + POINTER_LINE + '\n';
}

function insertAfterFirstHeading(content) {
  const lines = content.split('\n');
  const firstHeadingIdx = lines.findIndex(function (line) {
    return line.indexOf('# ') === 0;
  });
  if (firstHeadingIdx === -1) {
    if (content.length === 0) {
      return POINTER_LINE + '\n';
    }
    const prefix = POINTER_LINE + '\n\n';
    return prefix + content;
  }
  const insertIdx = firstHeadingIdx + 1;
  const before = lines.slice(0, insertIdx);
  const after = lines.slice(insertIdx);
  const block = [];
  block.push('');
  block.push(POINTER_LINE);
  if (after.length === 0 || after[0] !== '') {
    block.push('');
  }
  return before.concat(block, after).join('\n');
}

function containsPointerLine(content) {
  return content.split('\n').some(function (line) {
    return line === POINTER_LINE;
  });
}

function atomicWrite(targetPath, content) {
  const dir = path.dirname(targetPath);
  const tmpPath = path.join(dir, '.agents-config-postinstall.tmp-' + process.pid);
  let fd;
  try {
    fd = fs.openSync(tmpPath, 'w', 0o600);
    fs.writeFileSync(fd, content);
    fs.closeSync(fd);
    fd = null;
    fs.renameSync(tmpPath, targetPath);
  } finally {
    if (fd) {
      try { fs.closeSync(fd); } catch (e) {}
    }
    try { fs.unlinkSync(tmpPath); } catch (e) {}
  }
}

function main() {
  const cwd = process.cwd();
  const args = process.argv.slice(2);
  const initFlag = args.indexOf('--init') !== -1;

  const pkg = readConsumerPackageJson(cwd);
  if (!isDirectDependency(pkg)) {
    notice('[agents-config] not a direct dependency in ' + path.join(cwd, 'package.json') + '; skipping postinstall pointer write.');
    return;
  }

  const agentsPath = path.join(cwd, 'AGENTS.md');

  let lstat;
  try {
    lstat = fs.lstatSync(agentsPath);
  } catch (e) {
    lstat = null;
  }

  if (lstat && lstat.isSymbolicLink()) {
    notice('[agents-config] ' + agentsPath + ' is a symlink; skipping to respect cwd-scoped, no-outside-cwd-write contract.');
    return;
  }

  let exists = false;
  let existing = '';
  if (lstat) {
    try {
      existing = fs.readFileSync(agentsPath, 'utf8');
      exists = true;
    } catch (e) {
      exists = false;
    }
  }

  if (exists) {
    if (containsPointerLine(existing)) {
      return;
    }
    const updated = insertAfterFirstHeading(existing);
    try {
      atomicWrite(agentsPath, updated);
    } catch (e) {
      notice('[agents-config] could not write ' + agentsPath + ': ' + (e && e.message ? e.message : String(e)));
    }
    return;
  }

  if (!initFlag) {
    notice('[agents-config] No AGENTS.md found in ' + cwd + '.');
    notice('[agents-config] To create one automatically, re-run with the --init flag:');
    notice('[agents-config]   node node_modules/@daochild/agents-config/scripts/postinstall.js --init');
    notice('[agents-config] Or add this line manually at the top of your AGENTS.md, after the title:');
    notice('[agents-config]   ' + POINTER_LINE);
    return;
  }

  const content = buildInitContent(cwd);
  try {
    atomicWrite(agentsPath, content);
    notice('[agents-config] Created ' + agentsPath + ' with the primary instructions pointer line.');
  } catch (e) {
    notice('[agents-config] could not create ' + agentsPath + ': ' + (e && e.message ? e.message : String(e)));
  }
}

try {
  main();
} catch (e) {
  notice('[agents-config] postinstall encountered an unexpected error: ' + (e && e.message ? e.message : String(e)));
}

process.exit(0);