'use strict';

const assert = require('node:assert/strict');
const { spawnSync } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const root = path.resolve(__dirname, '..');
const packageName = '@daochild/agents-config';
const packagePath = `node_modules/${packageName}`;
const rulePath = `${packagePath}/instructions/rules/prompt-sanity-guard.md`;
const skillsPath = `${packagePath}/instructions/skills`;
const setupScript = path.join(root, 'scripts/setup-opencode.js');
const postinstallScript = path.join(root, 'scripts/postinstall.js');
const checkerDependencyAvailable = fs.existsSync(
  path.join(root, 'node_modules/@daochild/prompt-sanity/package.json'),
);

function makeConsumer(t, options = {}) {
  const fixtureRoot = fs.mkdtempSync(path.join(__dirname, '.setup-opencode-fixtures-'));
  t.after(() => fs.rmSync(fixtureRoot, { recursive: true, force: true }));

  const consumerRoot = path.join(fixtureRoot, 'consumer');
  fs.mkdirSync(consumerRoot);
  if (options.packageJson !== null) {
    const packageJson = options.packageJson === undefined
      ? { name: 'setup-opencode-fixture', version: '1.0.0', devDependencies: { [packageName]: '1.0.0' } }
      : options.packageJson;
    if (typeof packageJson === 'string') {
      fs.writeFileSync(path.join(consumerRoot, 'package.json'), packageJson);
    } else {
      fs.writeFileSync(path.join(consumerRoot, 'package.json'), JSON.stringify(packageJson));
    }
  }

  const installedPath = path.join(consumerRoot, packagePath);
  fs.mkdirSync(path.dirname(installedPath), { recursive: true });
  fs.symlinkSync(options.installedPackage || root, installedPath, 'dir');

  return { fixtureRoot, consumerRoot, installedPath };
}

function runConsumer(
  consumerRoot,
  script = path.join(consumerRoot, packagePath, 'scripts/setup-opencode.js'),
  args = [],
  options = {},
) {
  return spawnSync(process.execPath, [script, ...args], {
    cwd: consumerRoot,
    encoding: 'utf8',
    env: options.env ? { ...process.env, ...options.env } : process.env,
    timeout: 10_000,
  });
}

function readConfig(consumerRoot) {
  return JSON.parse(fs.readFileSync(path.join(consumerRoot, 'opencode.json'), 'utf8'));
}

function assertNoSetupTemps(consumerRoot) {
  const leftovers = fs.readdirSync(consumerRoot)
    .filter((name) => name.startsWith('.agents-config-setup-') && name.endsWith('.tmp'));
  assert.deepEqual(leftovers, [], 'setup must clean its temporary file');
}

function assertFailedWithoutConfig(result, consumerRoot) {
  assert.notEqual(result.status, 0, result.stdout);
  assert.equal(fs.existsSync(path.join(consumerRoot, 'opencode.json')), false);
  assertNoSetupTemps(consumerRoot);
}

test('creates the exact consumer-relative registrations and exposes the packaged skill source', (t) => {
  const { consumerRoot } = makeConsumer(t);
  const result = runConsumer(consumerRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readConfig(consumerRoot), {
    $schema: 'https://opencode.ai/config.json',
    instructions: [rulePath],
    skills: { paths: [skillsPath] },
  });
  assert.equal(fs.statSync(path.join(consumerRoot, rulePath)).isFile(), true);

  const skillFile = path.join(consumerRoot, skillsPath, 'prompt-sanity/SKILL.md');
  assert.equal(fs.statSync(skillFile).isFile(), true);
  assert.match(fs.readFileSync(skillFile, 'utf8'), /^name: prompt-sanity\s*$/m);
  assert.match(result.stdout, /Restart OpenCode/);
  assertNoSetupTemps(consumerRoot);
});

test('merges missing entries once while preserving unrelated settings and existing skills.urls', (t) => {
  const { consumerRoot } = makeConsumer(t);
  const original = {
    $schema: 'https://example.test/config.json',
    instructions: [rulePath, './local-rule.md'],
    tools: { unrelated: { enabled: false } },
    skills: {
      urls: ['https://example.test/skill.git'],
      paths: ['./local-skills', skillsPath],
      experimental: { retained: true },
    },
    unknownOption: ['keep', { nested: 42 }],
  };
  fs.writeFileSync(path.join(consumerRoot, 'opencode.json'), JSON.stringify(original, null, 2));

  const result = runConsumer(consumerRoot);

  assert.equal(result.status, 0, result.stderr);
  const merged = readConfig(consumerRoot);
  assert.deepEqual(merged, original);
  assert.equal(merged.instructions.filter((entry) => entry === rulePath).length, 1);
  assert.equal(merged.skills.paths.filter((entry) => entry === skillsPath).length, 1);
});

test('adds only the missing registration when the existing config is partially configured', (t) => {
  const { consumerRoot } = makeConsumer(t);
  const original = {
    instructions: [rulePath, './local-rule.md'],
    skills: { paths: ['./local-skills'], urls: ['https://example.test/skill.git'] },
  };
  fs.writeFileSync(path.join(consumerRoot, 'opencode.json'), JSON.stringify(original));

  const result = runConsumer(consumerRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readConfig(consumerRoot), {
    instructions: [rulePath, './local-rule.md'],
    skills: {
      paths: ['./local-skills', skillsPath],
      urls: ['https://example.test/skill.git'],
    },
  });
});

test('accepts the package as a direct production dependency as well as a dev dependency', (t) => {
  const { consumerRoot } = makeConsumer(t, {
    packageJson: { name: 'setup-opencode-fixture', dependencies: { [packageName]: '1.0.0' } },
  });

  const result = runConsumer(consumerRoot);

  assert.equal(result.status, 0, result.stderr);
  assert.deepEqual(readConfig(consumerRoot).instructions, [rulePath]);
  assert.deepEqual(readConfig(consumerRoot).skills.paths, [skillsPath]);
});

test('is idempotent without changing config bytes or mtime', (t) => {
  const { consumerRoot } = makeConsumer(t);
  const first = runConsumer(consumerRoot);
  assert.equal(first.status, 0, first.stderr);

  const configPath = path.join(consumerRoot, 'opencode.json');
  const bytesBefore = fs.readFileSync(configPath);
  const mtimeBefore = fs.statSync(configPath, { bigint: true }).mtimeNs;
  const second = runConsumer(consumerRoot);

  assert.equal(second.status, 0, second.stderr);
  assert.match(second.stdout, /already configured/);
  assert.deepEqual(fs.readFileSync(configPath), bytesBefore);
  assert.equal(fs.statSync(configPath, { bigint: true }).mtimeNs, mtimeBefore);
});

test('rejects absent, malformed, peer-only, optional-only, and transitive-only declarations before writing', (t) => {
  const declarations = [
    { name: 'missing package.json', packageJson: null },
    { name: 'invalid package.json', packageJson: '{' },
    { name: 'peer-only', packageJson: { peerDependencies: { [packageName]: '1.0.0' } } },
    { name: 'optional-only', packageJson: { optionalDependencies: { [packageName]: '1.0.0' } } },
    { name: 'transitive-only', packageJson: { dependencies: { 'another-package': { dependencies: { [packageName]: '1.0.0' } } } } },
  ];

  for (const { name, packageJson } of declarations) {
    const { consumerRoot } = makeConsumer(t, { packageJson });
    const result = runConsumer(consumerRoot);
    assertFailedWithoutConfig(result, consumerRoot);
    if (name === 'missing package.json') {
      assert.match(result.stderr, /package\.json/);
    } else {
      assert.match(result.stderr, /direct dependency|strict JSON|JSON object/i, name);
    }
  }
});

test('rejects an installed package that does not resolve to this package', (t) => {
  const { consumerRoot, fixtureRoot, installedPath } = makeConsumer(t);
  fs.rmSync(installedPath);
  const wrongPackage = path.join(fixtureRoot, 'wrong-package');
  fs.mkdirSync(path.join(wrongPackage, 'scripts'), { recursive: true });
  fs.symlinkSync(setupScript, path.join(wrongPackage, 'scripts/setup-opencode.js'));
  fs.symlinkSync(wrongPackage, installedPath, 'dir');

  const result = runConsumer(consumerRoot);

  assertFailedWithoutConfig(result, consumerRoot);
  assert.match(result.stderr, /installed.*package|installed @daochild\/agents-config/i);
});

test('uses only the invoking cwd and ignores parent package metadata and INIT_CWD', (t) => {
  const { consumerRoot } = makeConsumer(t);
  const nestedRoot = path.join(consumerRoot, 'nested');
  fs.mkdirSync(nestedRoot);
  const nestedPackagePath = path.join(nestedRoot, packagePath);
  fs.mkdirSync(path.dirname(nestedPackagePath), { recursive: true });
  fs.symlinkSync(root, nestedPackagePath, 'dir');
  const parentConfig = path.join(consumerRoot, 'opencode.json');
  const parentBytes = Buffer.from('{"parentOnly":true}\n');
  fs.writeFileSync(parentConfig, parentBytes);

  const result = runConsumer(nestedRoot, undefined, [], { env: { INIT_CWD: consumerRoot } });

  assert.notEqual(result.status, 0, result.stdout);
  assert.match(result.stderr, /package\.json/);
  assert.deepEqual(fs.readFileSync(parentConfig), parentBytes);
  assert.equal(fs.existsSync(path.join(nestedRoot, 'opencode.json')), false);
  assertNoSetupTemps(nestedRoot);
});

test('rejects unsupported arguments and shows help without requiring consumer files', (t) => {
  const { consumerRoot } = makeConsumer(t, { packageJson: null });
  const unsupported = runConsumer(consumerRoot, path.join(root, 'scripts/setup-opencode.js'), ['--unknown']);
  assertFailedWithoutConfig(unsupported, consumerRoot);
  assert.match(unsupported.stderr, /Unsupported arguments/);

  const help = runConsumer(consumerRoot, path.join(root, 'scripts/setup-opencode.js'), ['--help']);
  assert.equal(help.status, 0, help.stderr);
  assert.match(help.stdout, /Run from your project root/);
  assert.equal(fs.existsSync(path.join(consumerRoot, 'opencode.json')), false);
});

test('refuses JSONC-only and conflicting JSON plus JSONC configs without shadowing them', (t) => {
  for (const includeJson of [false, true]) {
    const { consumerRoot } = makeConsumer(t);
    const jsoncPath = path.join(consumerRoot, 'opencode.jsonc');
    const jsoncBytes = Buffer.from('{ // consumer comments stay intact\n "theme": "dark"\n}\n');
    fs.writeFileSync(jsoncPath, jsoncBytes);
    if (includeJson) {
      fs.writeFileSync(path.join(consumerRoot, 'opencode.json'), '{"existing":true}\n');
    }
    const jsonBytes = includeJson ? fs.readFileSync(path.join(consumerRoot, 'opencode.json')) : null;

    const result = runConsumer(consumerRoot);

    assert.notEqual(result.status, 0, result.stdout);
    if (includeJson) {
      assert.match(result.stderr, /both|ambiguous|resolve.*manually/i);
    } else {
      assert.match(result.stderr, /opencode\.jsonc exists/);
    }
    assert.deepEqual(fs.readFileSync(jsoncPath), jsoncBytes);
    assert.equal(includeJson, fs.existsSync(path.join(consumerRoot, 'opencode.json')));
    if (jsonBytes) assert.deepEqual(fs.readFileSync(path.join(consumerRoot, 'opencode.json')), jsonBytes);
    assertNoSetupTemps(consumerRoot);
  }
});

test('refuses malformed, array, and null strict-JSON roots without changing source bytes', (t) => {
  for (const raw of ['{', '[]', 'null', '{ "foo": 1 // comment\n}', '{"foo":1,}']) {
    const { consumerRoot } = makeConsumer(t);
    const configPath = path.join(consumerRoot, 'opencode.json');
    fs.writeFileSync(configPath, raw);

    const result = runConsumer(consumerRoot);

    assert.notEqual(result.status, 0, result.stdout);
    assert.deepEqual(fs.readFileSync(configPath), Buffer.from(raw));
    assertNoSetupTemps(consumerRoot);
  }
});

test('rejects incompatible instructions, skills, and skills.paths fields without writing', (t) => {
  const invalidConfigs = [
    { instructions: {} },
    { instructions: null },
    { skills: [] },
    { skills: null },
    { skills: { paths: {} } },
    { skills: { paths: [skillsPath, 7] } },
  ];

  for (const config of invalidConfigs) {
    const { consumerRoot } = makeConsumer(t);
    const configPath = path.join(consumerRoot, 'opencode.json');
    const original = JSON.stringify(config);
    fs.writeFileSync(configPath, original);

    const result = runConsumer(consumerRoot);

    assert.notEqual(result.status, 0, result.stdout);
    assert.deepEqual(fs.readFileSync(configPath), Buffer.from(original));
    assertNoSetupTemps(consumerRoot);
  }
});

test('refuses regular JSONC symlinks without following or changing their targets', (t) => {
  const { consumerRoot, fixtureRoot } = makeConsumer(t);
  const outside = path.join(fixtureRoot, 'outside-opencode.jsonc');
  const outsideBytes = Buffer.from('outside consumer root\n');
  fs.writeFileSync(outside, outsideBytes);
  fs.symlinkSync(outside, path.join(consumerRoot, 'opencode.jsonc'));

  const result = runConsumer(consumerRoot);

  assertFailedWithoutConfig(result, consumerRoot);
  assert.deepEqual(fs.readFileSync(outside), outsideBytes);
});

test('refuses symlink, dangling symlink, and directory opencode.json paths without changing outside files', (t) => {
  for (const kind of ['file symlink', 'dangling symlink', 'directory']) {
    const { consumerRoot, fixtureRoot } = makeConsumer(t);
    const configPath = path.join(consumerRoot, 'opencode.json');
    const outside = path.join(fixtureRoot, 'outside-config.json');
    const outsideBytes = Buffer.from('outside consumer root\n');

    if (kind === 'file symlink') {
      fs.writeFileSync(outside, outsideBytes);
      fs.symlinkSync(outside, configPath);
    } else if (kind === 'dangling symlink') {
      fs.symlinkSync(outside, configPath);
    } else {
      fs.mkdirSync(configPath);
      fs.writeFileSync(path.join(configPath, 'keep.txt'), outsideBytes);
    }

    const result = runConsumer(consumerRoot);

    assert.notEqual(result.status, 0, `${kind}: ${result.stdout}`);
    assert.match(result.stderr, /regular file|symlink/i);
    if (kind === 'file symlink' || kind === 'dangling symlink') {
      assert.equal(fs.lstatSync(configPath).isSymbolicLink(), true);
    }
    if (kind === 'file symlink') assert.deepEqual(fs.readFileSync(outside), outsideBytes);
    if (kind === 'dangling symlink') assert.equal(fs.existsSync(outside), false);
    if (kind === 'directory') {
      assert.deepEqual(fs.readFileSync(path.join(configPath, 'keep.txt')), outsideBytes);
    }
    assertNoSetupTemps(consumerRoot);
  }
});

test('runs the packaged checker through the package symlink without a consumer-hoisted dependency or npm script', {
  skip: !checkerDependencyAvailable && 'repository prompt-sanity dependency is not installed',
}, (t) => {
  const { consumerRoot } = makeConsumer(t);
  const packageJsonPath = path.join(consumerRoot, 'package.json');
  const packageJsonBytes = fs.readFileSync(packageJsonPath);
  assert.equal(fs.existsSync(path.join(consumerRoot, 'node_modules/@daochild/prompt-sanity')), false);

  const checker = spawnSync(process.execPath, [
    path.join(consumerRoot, packagePath, 'scripts/prompt-sanity-check.mjs'),
    '--stdin',
    '--json',
  ], {
    cwd: consumerRoot,
    encoding: 'utf8',
    input: 'Please summarize the README installation steps',
    timeout: 10_000,
  });

  assert.equal(checker.status, 0, checker.stderr || checker.stdout);
  assert.equal(JSON.parse(checker.stdout).flagged, false);
  assert.deepEqual(fs.readFileSync(packageJsonPath), packageJsonBytes);
  assert.equal(Object.hasOwn(JSON.parse(packageJsonBytes), 'scripts'), false);
});

test('legacy postinstall remains best-effort and exits zero without creating OpenCode config', (t) => {
  const { consumerRoot } = makeConsumer(t);
  const result = runConsumer(consumerRoot, postinstallScript);

  assert.equal(result.status, 0, result.stderr || result.stdout);
  assert.equal(fs.existsSync(path.join(consumerRoot, 'AGENTS.md')), false);
  assert.equal(fs.existsSync(path.join(consumerRoot, 'opencode.json')), false);
});
