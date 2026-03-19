import fs from 'fs';
import path from 'path';
import os from 'os';

// Follow symlinks (npm link creates a symlink in the nvm/node bin dir)
// to find the actual project directory, then resolve hooks/ relative to it.
const realEntry = fs.realpathSync(process.argv[1]);
const HOOKS_DIR = path.resolve(path.dirname(realEntry), '../hooks');
const SRC_STATUSLINE_PATH = path.join(HOOKS_DIR, 'statusline.sh');
const TG_DIR = path.join(os.homedir(), '.tokengolf');
const STABLE_STATUSLINE = path.join(TG_DIR, 'statusline.sh');
const STABLE_WRAPPER = path.join(TG_DIR, 'statusline-wrapper.sh');
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
    const filtered = existing.filter(
      (h) =>
        !h._tg &&
        !h.hooks?.some(
          (e) =>
            e.command?.includes('tokengolf') ||
            e.command?.includes('session-start.js') ||
            e.command?.includes('session-stop.js') ||
            e.command?.includes('session-end.js') ||
            e.command?.includes('pre-compact.js') ||
            e.command?.includes('post-tool-use.js') ||
            e.command?.includes('post-tool-use-failure.js') ||
            e.command?.includes('subagent-start.js') ||
            e.command?.includes('stop.js') ||
            e.command?.includes('user-prompt-submit.js')
        )
    );
    settings.hooks[event] = [...filtered, { _tg: true, ...entry }];
  }

  // Remove old session-stop.js Stop hook if present (superseded by session-end.js)
  if (settings.hooks.Stop) {
    settings.hooks.Stop = (settings.hooks.Stop || []).filter(
      (h) => !h._tg && !h.hooks?.some((e) => e.command?.includes('session-stop.js'))
    );
    if (settings.hooks.Stop.length === 0) delete settings.hooks.Stop;
  }

  upsertHook('SessionStart', {
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'session-start.js')}`,
        timeout: 5,
      },
    ],
  });

  upsertHook('PostToolUse', {
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'post-tool-use.js')}`,
        timeout: 5,
      },
    ],
  });

  upsertHook('UserPromptSubmit', {
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'user-prompt-submit.js')}`,
        timeout: 5,
      },
    ],
  });

  upsertHook('SessionEnd', {
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'session-end.js')}`,
        timeout: 30,
      },
    ],
  });

  upsertHook('PreCompact', {
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'pre-compact.js')}`,
        timeout: 5,
      },
    ],
  });

  upsertHook('PostToolUseFailure', {
    matcher: '',
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'post-tool-use-failure.js')}`,
        timeout: 5,
      },
    ],
  });

  upsertHook('SubagentStart', {
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'subagent-start.js')}`,
        timeout: 5,
      },
    ],
  });

  upsertHook('Stop', {
    hooks: [
      {
        type: 'command',
        command: `node ${path.join(HOOKS_DIR, 'stop.js')}`,
        timeout: 5,
      },
    ],
  });

  // Install statusLine (non-destructive: wrap existing if present)
  // Copy to stable ~/.tokengolf/ path (survives npm uninstall / plugin removal)
  if (!fs.existsSync(TG_DIR)) fs.mkdirSync(TG_DIR, { recursive: true });
  try {
    fs.copyFileSync(SRC_STATUSLINE_PATH, STABLE_STATUSLINE);
    fs.chmodSync(STABLE_STATUSLINE, 0o755);
  } catch (err) {
    console.log(`  ⚠️  Could not copy statusline.sh: ${err.message}`);
    console.log('      The HUD may not work. Try reinstalling tokengolf.');
  }

  const existing = settings.statusLine;
  const existingCmd = typeof existing === 'string' ? existing : (existing?.command ?? null);
  // Detect any tokengolf statusline (from any install path — npm, homebrew, project dir, stable)
  const isTgStatusline = (cmd) =>
    cmd &&
    (cmd.includes('tokengolf/hooks/statusline') ||
      cmd.includes('tokengolf\\hooks\\statusline') ||
      cmd.includes('.tokengolf/statusline'));
  const alreadyOurs = isTgStatusline(existingCmd);

  // Extract user's non-TG statusline command from a wrapper, following chains recursively
  function extractUserStatusline(wrapperPath, visited = new Set()) {
    if (!wrapperPath || visited.has(wrapperPath)) return null;
    visited.add(wrapperPath);
    try {
      const content = fs.readFileSync(wrapperPath, 'utf8');
      const pipeLines = content.split('\n').filter((l) => l.includes('echo "$SESSION_JSON"'));
      for (const line of pipeLines) {
        const match = line.match(/echo "\$SESSION_JSON" \| (.+?)( 2>|$)/);
        if (!match) continue;
        const cmd = match[1].replace(/^bash /, '');
        if (!isTgStatusline(cmd)) return cmd; // found the user's statusline
        // It's another TG wrapper — follow the chain
        if (cmd.includes('statusline-wrapper')) {
          const found = extractUserStatusline(cmd, visited);
          if (found) return found;
        }
      }
    } catch {}
    return null;
  }

  if (alreadyOurs) {
    // Find user's statusline buried in any depth of wrapper chain
    const userStatusline = existingCmd.includes('statusline-wrapper')
      ? extractUserStatusline(existingCmd)
      : null;

    if (userStatusline) {
      // Re-wrap: preserve user's statusline + update tokengolf path
      fs.writeFileSync(
        STABLE_WRAPPER,
        [
          '#!/usr/bin/env bash',
          'SESSION_JSON=$(cat)',
          `echo "$SESSION_JSON" | ${userStatusline} 2>/dev/null || true`,
          `echo "$SESSION_JSON" | bash ${STABLE_STATUSLINE}`,
        ].join('\n') + '\n'
      );
      fs.chmodSync(STABLE_WRAPPER, 0o755);
      settings.statusLine = {
        type: 'command',
        command: STABLE_WRAPPER,
        padding: existing?.padding ?? 0,
      };
      console.log('  ✓ statusLine       → updated paths (kept your existing statusline)');
    } else {
      // Direct install — no user statusline to preserve
      settings.statusLine = {
        type: 'command',
        command: STABLE_STATUSLINE,
        padding: existing?.padding ?? 0,
      };
      console.log('  ✓ statusLine       → updated to current install path');
    }
  } else if (existingCmd) {
    // User has a non-TG statusline — wrap it
    fs.writeFileSync(
      STABLE_WRAPPER,
      [
        '#!/usr/bin/env bash',
        'SESSION_JSON=$(cat)',
        `echo "$SESSION_JSON" | ${existingCmd} 2>/dev/null || true`,
        `echo "$SESSION_JSON" | bash ${STABLE_STATUSLINE}`,
      ].join('\n') + '\n'
    );
    fs.chmodSync(STABLE_WRAPPER, 0o755);
    settings.statusLine = {
      type: 'command',
      command: STABLE_WRAPPER,
      padding: 0,
    };
    console.log('  ✓ statusLine       → wrapped your existing statusline + tokengolf HUD');
  } else {
    // No existing statusline — install directly
    settings.statusLine = {
      type: 'command',
      command: STABLE_STATUSLINE,
      padding: 0,
    };
    console.log('  ✓ statusLine       → live HUD in every Claude session');
  }

  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2));

  // Stamp installed version for auto-sync detection
  try {
    const pkgVersion = JSON.parse(
      fs.readFileSync(path.resolve(path.dirname(realEntry), '../package.json'), 'utf8')
    ).version;
    fs.writeFileSync(path.join(TG_DIR, 'installed-version'), pkgVersion);
    console.log(`  ✓ installed-version → ${pkgVersion}`);
  } catch (err) {
    console.log(`  ⚠️  Could not stamp installed version: ${err.message}`);
  }

  // Create default config if it doesn't exist
  const CONFIG_FILE = path.join(TG_DIR, 'config.json');
  if (!fs.existsSync(CONFIG_FILE)) {
    if (!fs.existsSync(TG_DIR)) fs.mkdirSync(TG_DIR, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify({ emotionMode: 'emoji' }, null, 2));
    console.log('  ✓ config.json      → created with default emotion mode (emoji)');
  }

  console.log('  ✓ SessionStart     → injects run context into Claude');
  console.log('  ✓ PostToolUse      → tracks tool calls + 80% budget warning');
  console.log('  ✓ UserPromptSubmit → counts prompts + 50% nudge');
  console.log('  ✓ SessionEnd       → auto-displays scorecard on /exit');
  console.log('  ✓ PreCompact           → tracks compaction events for gear achievements');
  console.log('  ✓ PostToolUseFailure   → tracks failed tool calls');
  console.log('  ✓ SubagentStart        → tracks subagent spawns');
  console.log('  ✓ Stop                 → tracks turn count');
  console.log('\n  ✅ Done! Start a run: tokengolf start\n');
}
