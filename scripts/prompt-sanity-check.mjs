#!/usr/bin/env node
/**
 * Offline prompt-injection guard via @daochild/prompt-sanity quickCheck.
 *
 * Usage:
 *   node scripts/prompt-sanity-check.mjs "text to check"
 *   node scripts/prompt-sanity-check.mjs --file path/to/prompt.txt
 *   echo "..." | node scripts/prompt-sanity-check.mjs --stdin
 *
 * Exit codes:
 *   0 — no suspected injection (or --json with clean result)
 *   1 — suspected injection
 *   2 — usage / I/O error
 */
import { readFileSync } from 'node:fs';
import { stdin as stdinStream } from 'node:process';
import { quickCheck } from '@daochild/prompt-sanity';

function usage() {
  process.stderr.write(
    'Usage: prompt-sanity-check.mjs <text> | --file <path> | --stdin [--json] [--threshold <0-100>]\n',
  );
}

function readStdin() {
  return new Promise((resolve, reject) => {
    const chunks = [];
    stdinStream.setEncoding('utf8');
    stdinStream.on('data', (c) => chunks.push(c));
    stdinStream.on('end', () => resolve(chunks.join('')));
    stdinStream.on('error', reject);
  });
}

async function main(argv) {
  let json = false;
  let threshold = 1;
  let text = null;
  let file = null;
  let stdin = false;

  for (let i = 0; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--json') json = true;
    else if (a === '--stdin') stdin = true;
    else if (a === '--file') {
      file = argv[++i];
      if (!file) {
        usage();
        process.exit(2);
      }
    } else if (a === '--threshold') {
      threshold = Number(argv[++i]);
      if (!Number.isFinite(threshold) || threshold < 0 || threshold > 100) {
        process.stderr.write('--threshold must be 0–100\n');
        process.exit(2);
      }
    } else if (a === '-h' || a === '--help') {
      usage();
      process.exit(0);
    } else if (a.startsWith('-')) {
      process.stderr.write(`Unknown flag: ${a}\n`);
      usage();
      process.exit(2);
    } else if (text == null) {
      text = a;
    } else {
      text = `${text} ${a}`;
    }
  }

  if (stdin) text = await readStdin();
  else if (file) {
    try {
      text = readFileSync(file, 'utf8');
    } catch (e) {
      process.stderr.write(`Cannot read file: ${e.message}\n`);
      process.exit(2);
    }
  }

  if (text == null || text.trim() === '') {
    usage();
    process.exit(2);
  }

  const result = quickCheck(text);
  const flagged = result.suspectedInjection && result.riskScore >= threshold;

  if (json) {
    process.stdout.write(JSON.stringify({ ...result, flagged, threshold }, null, 2) + '\n');
  } else if (flagged) {
    process.stdout.write(
      `SUSPECTED_INJECTION riskScore=${result.riskScore} categories=${result.categories.join(',') || '-'} rules=${result.ruleSetVersion}\n`,
    );
  } else {
    process.stdout.write(
      `CLEAN riskScore=${result.riskScore} rules=${result.ruleSetVersion}\n`,
    );
  }

  process.exit(flagged ? 1 : 0);
}

main(process.argv.slice(2)).catch((e) => {
  process.stderr.write(String(e?.stack || e) + '\n');
  process.exit(2);
});
