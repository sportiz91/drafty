#!/usr/bin/env node
/**
 * One-shot local setup: creates .env.local from .env.example with a
 * generated JWT_SECRET. Node-based so it runs identically on
 * Linux/macOS/Windows — no openssl or bash required.
 */
import crypto from 'node:crypto';
import fs from 'node:fs';

const ENV_FILE = '.env.local';

if (fs.existsSync(ENV_FILE)) {
  console.log(`${ENV_FILE} already exists — leaving it untouched.`);
  process.exit(0);
}

const example = fs.readFileSync('.env.example', 'utf8');
const secret = crypto.randomBytes(32).toString('hex');
const env = example.replace(/^JWT_SECRET=$/m, `JWT_SECRET=${secret}`);

fs.writeFileSync(ENV_FILE, env);
console.log(`Created ${ENV_FILE} with a generated JWT_SECRET.`);
