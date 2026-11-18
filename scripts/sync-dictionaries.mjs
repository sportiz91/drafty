#!/usr/bin/env node
/**
 * Copies the Spanish Hunspell dictionary shipped by `dictionary-es` into
 * `public/dictionaries/es/` so the browser can fetch it at runtime (the
 * package itself is Node-only — its entrypoint reads from `fs`). Kept out of
 * git (see .gitignore) and regenerated on install via the `prepare` script.
 *
 * Node-based and idempotent so it runs identically on Linux/macOS/Windows.
 */
import fs from 'node:fs';
import { createRequire } from 'node:module';
import path from 'node:path';

const require = createRequire(import.meta.url);
const SOURCE_DIR = path.dirname(require.resolve('dictionary-es'));
const TARGET_DIR = path.join('public', 'dictionaries', 'es');
const FILES = ['index.aff', 'index.dic'];

fs.mkdirSync(TARGET_DIR, { recursive: true });

for (const file of FILES) {
  const source = path.join(SOURCE_DIR, file);
  const target = path.join(TARGET_DIR, file);

  // Skip the copy when the target is already byte-for-byte up to date.
  if (
    fs.existsSync(target) &&
    fs.statSync(target).size === fs.statSync(source).size
  ) {
    continue;
  }

  fs.copyFileSync(source, target);
  console.log(`Synced ${file} → ${target}`);
}
