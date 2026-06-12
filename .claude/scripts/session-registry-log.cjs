// Session registry — passive coordination board between parallel Claude Code
// sessions. PostToolUse hook on Edit|Write|NotebookEdit: appends one JSONL
// line per file edit to a shared board in the user's home directory (so all
// worktrees + the main checkout share one file). Read side:
// session-registry-start.cjs injects a summary at SessionStart.
const os = require('os');
const path = require('path');

const REGISTRY = path.join(os.homedir(), '.drafty-sessions.jsonl');

let d = '';
process.stdin.on('data', c => (d += c));
process.stdin.on('end', () => {
  try {
    const j = JSON.parse(d);
    const file =
      (j.tool_input && j.tool_input.file_path) ||
      (j.tool_response && j.tool_response.filePath);
    if (!file) process.exit(0);
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
    const line = JSON.stringify({
      ts: new Date().toISOString(),
      session: (j.session_id || '').slice(0, 8),
      branch,
      file,
    });
    require('fs').appendFileSync(REGISTRY, line + '\n');
  } catch {}
  process.exit(0);
});
