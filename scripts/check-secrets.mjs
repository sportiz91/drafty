#!/usr/bin/env node
/**
 * Deterministic secret scan over STAGED content. Runs first in the husky
 * pre-commit hook — fast, zero dependencies, scans what will actually be
 * committed (git index), not the working tree.
 */
import { execSync } from 'node:child_process';

const PATTERNS = [
  { name: 'Stripe secret key', regex: /sk_(live|test)_[A-Za-z0-9]{10,}/ },
  { name: 'Stripe webhook secret', regex: /whsec_[A-Za-z0-9]{10,}/ },
  { name: 'AWS access key id', regex: /AKIA[0-9A-Z]{16}/ },
  { name: 'Private key block', regex: /-----BEGIN [A-Z ]*PRIVATE KEY-----/ },
  { name: 'GitHub token', regex: /gh[pousr]_[A-Za-z0-9]{30,}/ },
  {
    name: 'Hardcoded JWT secret',
    regex: /JWT_SECRET\s*=\s*['"]?[A-Za-z0-9+/=_-]{16,}/,
  },
  {
    name: 'Generic assigned secret',
    regex:
      /(api[_-]?key|client[_-]?secret|password|auth[_-]?token)\s*[:=]\s*['"][A-Za-z0-9+/=_-]{20,}['"]/i,
  },
];

// Optional machine-local patterns (gitignored — never committed). Lets a
// developer block strings that must not appear in this public repo without
// the blocklist itself disclosing them.
try {
  const { default: fs } = await import('node:fs');
  const local = JSON.parse(
    fs.readFileSync('scripts/check-secrets.local.json', 'utf8')
  );
  for (const { name, pattern } of local) {
    PATTERNS.push({ name, regex: new RegExp(pattern, 'i') });
  }
} catch {
  // No local pattern file — fine.
}

// Files allowed to contain pattern-matching strings (placeholders, test
// fixtures, this scanner itself).
const ALLOWED_FILES = new Set([
  '.env.example',
  'jest.env.ts',
  'scripts/check-secrets.mjs',
]);

const staged = execSync('git diff --cached --name-only --diff-filter=ACM', {
  encoding: 'utf8',
})
  .split('\n')
  .filter(Boolean);

const findings = [];

for (const file of staged) {
  if (ALLOWED_FILES.has(file)) {
    continue;
  }

  let content;
  try {
    content = execSync(`git show :"${file}"`, {
      encoding: 'utf8',
      maxBuffer: 10 * 1024 * 1024,
    });
  } catch {
    continue; // binary or deleted file
  }

  for (const { name, regex } of PATTERNS) {
    const match = content.match(regex);
    if (match) {
      findings.push({ file, name, sample: `${match[0].slice(0, 12)}…` });
    }
  }
}

if (findings.length > 0) {
  console.error('✖ Potential secrets in staged files:');
  for (const finding of findings) {
    console.error(`  - ${finding.file}: ${finding.name} (${finding.sample})`);
  }
  console.error('Unstage the secret or replace it with a placeholder.');
  process.exit(1);
}

console.log('✓ No secrets detected in staged files.');
