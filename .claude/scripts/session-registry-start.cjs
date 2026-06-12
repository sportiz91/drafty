// Session registry — SessionStart hook. Registers the new session on the
// shared board and injects a summary of what OTHER sessions touched recently
// as additionalContext, so every session starts knowing the territory another
// session (e.g. one building the landing in a worktree) already claimed.
const os = require('os');
const path = require('path');
const fs = require('fs');

const REGISTRY = path.join(os.homedir(), '.drafty-sessions.jsonl');
const WINDOW_MS = 4 * 60 * 60 * 1000; // look back 4h
const MAX_BYTES = 1024 * 1024; // rotate at ~1MB

let d = '';
process.stdin.on('data', c => (d += c));
process.stdin.on('end', () => {
  let j = {};
  try {
    j = JSON.parse(d);
  } catch {}
  const me = (j.session_id || '').slice(0, 8);
  let branch = '';
  try {
    branch = require('child_process')
      .execSync(
        `git -C ${JSON.stringify(j.cwd || process.cwd())} branch --show-current`,
        { stdio: ['ignore', 'pipe', 'ignore'] }
      )
      .toString()
      .trim();
  } catch {}

  try {
    if (fs.existsSync(REGISTRY) && fs.statSync(REGISTRY).size > MAX_BYTES) {
      const keep = fs
        .readFileSync(REGISTRY, 'utf8')
        .trim()
        .split('\n')
        .slice(-1000);
      fs.writeFileSync(REGISTRY, keep.join('\n') + '\n');
    }
  } catch {}

  try {
    fs.appendFileSync(
      REGISTRY,
      JSON.stringify({
        ts: new Date().toISOString(),
        session: me,
        branch,
        event: 'start',
        cwd: j.cwd || process.cwd(),
      }) + '\n'
    );
  } catch {}

  let summary = '';
  try {
    const cutoff = Date.now() - WINDOW_MS;
    const lines = fs
      .readFileSync(REGISTRY, 'utf8')
      .trim()
      .split('\n')
      .slice(-500);
    const bySession = {};
    for (const l of lines) {
      let e;
      try {
        e = JSON.parse(l);
      } catch {
        continue;
      }
      if (!e.file || e.session === me) continue;
      if (new Date(e.ts).getTime() < cutoff) continue;
      const key = `session ${e.session} [${e.branch || '?'}]`;
      (bySession[key] = bySession[key] || new Set()).add(e.file);
    }
    const parts = Object.entries(bySession).map(
      ([k, files]) => `- ${k}: ${[...files].slice(-12).join(', ')}`
    );
    if (parts.length) {
      summary =
        'Session registry (passive coordination board): OTHER Claude Code sessions ' +
        'edited these files in the last 4h. Avoid claiming overlapping files/areas; ' +
        'if your task requires touching them, flag the overlap to the user first.\n' +
        parts.join('\n');
    }
  } catch {}

  if (summary) {
    console.log(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'SessionStart',
          additionalContext: summary,
        },
        suppressOutput: true,
      })
    );
  }
  process.exit(0);
});
