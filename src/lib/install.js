import fs from 'fs';
import path from 'path';
import os from 'os';

// Follow symlinks (npm link creates a symlink in the nvm/node bin dir)
// to find the actual project directory, then resolve hooks/ relative to it.
const realEntry = fs.realpathSync(process.argv[1]);
const HOOKS_DIR = path.resolve(path.dirname(realEntry), '../hooks');
const CLAUDE_DIR = path.join(os.homedir(), '.claude');
const CLAUDE_SETTINGS = path.join(CLAUDE_DIR, 'settings.json');

export function installHooks() {
  console.log('\n⛳ TokenGolf — Installing Claude Code hooks\n');

  let settings = {};
  if (fs.existsSync(CLAUDE_SETTINGS)) {
    try {
      settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, 'utf8'));
      console.log('  ✓ Found ~/.claude/settings.json');
    } catch {
      console.log('  ⚠️  Could not parse settings.json — starting fresh');
    }
  } else {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    console.log('  ℹ️  Creating ~/.claude/settings.json');
  }

  if (!settings.hooks) settings.hooks = {};

  function upsertHook(event, entry) {
    const existing = settings.hooks[event] || [];
    // Remove any existing tokengolf hooks (identified by _tg marker or legacy path patterns)
    const filtered = existing.filter(h =>
      !h._tg &&
      !h.hooks?.some(e => e.command?.includes('tokengolf') || e.command?.includes('session-start.js') || e.command?.includes('post-tool-use.js') || e.command?.includes('user-prompt-submit.js'))
    );
    settings.hooks[event] = [...filtered, { _tg: true, ...entry }];
  }

  upsertHook('SessionStart', {
    hooks: [{ type: 'command', command: `node ${path.join(HOOKS_DIR, 'session-start.js')}`, timeout: 5 }],
  });

  upsertHook('PostToolUse', {
    matcher: '',
    hooks: [{ type: 'command', command: `node ${path.join(HOOKS_DIR, 'post-tool-use.js')}`, timeout: 5 }],
  });

  upsertHook('UserPromptSubmit', {
    hooks: [{ type: 'command', command: `node ${path.join(HOOKS_DIR, 'user-prompt-submit.js')}`, timeout: 5 }],
  });

  upsertHook('Stop', {
    hooks: [{ type: 'command', command: `node ${path.join(HOOKS_DIR, 'session-stop.js')}`, timeout: 5 }],
  });

  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2));

  console.log('  ✓ SessionStart     → injects run context into Claude');
  console.log('  ✓ PostToolUse      → tracks tool calls + 80% budget warning');
  console.log('  ✓ UserPromptSubmit → counts prompts + 50% nudge');
  console.log('  ✓ Stop             → captures exact session cost automatically');
  console.log('\n  ✅ Done! Start a run: tokengolf start\n');
}
