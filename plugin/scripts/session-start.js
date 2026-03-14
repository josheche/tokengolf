#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_FILE = path.join(os.homedir(), '.tokengolf', 'current-run.json');
const STATE_DIR = path.join(os.homedir(), '.tokengolf');

// Auto-sync: if npm package version changed since last install, update hook paths
try {
  const pkgPath = path.resolve(path.dirname(process.argv[1]), '../package.json');
  const currentVersion = JSON.parse(fs.readFileSync(pkgPath, 'utf8')).version;
  const stampFile = path.join(STATE_DIR, 'installed-version');
  let installedVersion = null;
  try {
    installedVersion = fs.readFileSync(stampFile, 'utf8').trim();
  } catch {}
  if (installedVersion !== null && installedVersion !== currentVersion) {
    const hooksDir = path.resolve(path.dirname(process.argv[1]), '../hooks');
    const settingsPath = path.join(os.homedir(), '.claude', 'settings.json');
    try {
      let raw = fs.readFileSync(settingsPath, 'utf8');
      const settings = JSON.parse(raw);
      // Update all _tg hook command paths
      if (settings.hooks) {
        for (const entries of Object.values(settings.hooks)) {
          for (const entry of entries) {
            if (!entry._tg) continue;
            for (const h of entry.hooks || []) {
              if (h.command && h.command.includes('node ')) {
                const scriptName = h.command.split('/').pop();
                h.command = `node ${path.join(hooksDir, scriptName)}`;
              }
            }
          }
        }
      }
      // Update statusLine paths
      const statuslinePath = path.join(hooksDir, 'statusline.sh');
      const wrapperPath = path.join(hooksDir, 'statusline-wrapper.sh');
      if (settings.statusLine?.command) {
        const cmd = settings.statusLine.command;
        if (cmd.includes('statusline-wrapper')) {
          settings.statusLine.command = wrapperPath;
        } else if (cmd.includes('statusline.sh')) {
          settings.statusLine.command = statuslinePath;
        }
      }
      fs.writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    } catch {}
    fs.writeFileSync(stampFile, currentVersion);
  } else if (installedVersion === null) {
    // First run after upgrade — just stamp current version
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    fs.writeFileSync(stampFile, currentVersion);
  }
} catch {}

function detectEffort() {
  const fromEnv = process.env.CLAUDE_CODE_EFFORT_LEVEL;
  if (fromEnv) return fromEnv;
  for (const p of [
    path.join(os.homedir(), '.claude', 'settings.json'),
    path.join(process.env.PWD || process.cwd(), '.claude', 'settings.json'),
  ]) {
    try {
      const s = JSON.parse(fs.readFileSync(p, 'utf8'));
      if (s.effortLevel) return s.effortLevel;
    } catch {}
  }
  return null;
}

function detectFastMode() {
  try {
    const s = JSON.parse(
      fs.readFileSync(path.join(os.homedir(), '.claude', 'settings.json'), 'utf8')
    );
    return s.fastMode === true;
  } catch {
    return false;
  }
}

try {
  const cwd = process.env.PWD || process.cwd();

  let run = null;
  try {
    run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    /* no run */
  }

  if (!run || run.status !== 'active') {
    // Flow mode: auto-start a tracking run for this session
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    run = {
      id: `run_${Date.now()}`,
      model: 'claude-sonnet-4-6',
      effort: detectEffort(),
      fastMode: detectFastMode(),
      spent: 0,
      status: 'active',
      promptCount: 0,
      totalToolCalls: 0,
      toolCalls: {},
      failedToolCalls: 0,
      subagentSpawns: 0,
      turnCount: 0,
      thinkingInvocations: 0,
      thinkingTokens: 0,
      fainted: false,
      cwd,
      sessionCount: 1,
      compactionEvents: [],
      startedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
  } else {
    // Continuing an existing run — increment session count, snapshot spent for per-session tracking
    run = {
      ...run,
      sessionCount: (run.sessionCount || 1) + 1,
      spentBeforeThisSession: run.spent || 0,
      cwd: run.cwd || cwd,
      effort: 'effort' in run ? run.effort : detectEffort(),
      fastMode: 'fastMode' in run ? run.fastMode : detectFastMode(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
  }

  // Par rates for prompt-scaled budget (with user overrides from config.json)
  let _cfg = {};
  try {
    _cfg = JSON.parse(
      fs.readFileSync(path.join(os.homedir(), '.tokengolf', 'config.json'), 'utf8')
    );
  } catch {}
  const PAR_RATES = {
    haiku: 0.55,
    sonnet: 7.0,
    opusplan: 22.0,
    opus: 45.0,
    ...(_cfg.parRates || {}),
  };
  const PAR_FLOORS = {
    haiku: 0.5,
    sonnet: 3.0,
    opusplan: 8.0,
    opus: 15.0,
    ...(_cfg.parFloors || {}),
  };
  const mk = run.model.includes('opusplan')
    ? 'opusplan'
    : run.model.includes('haiku')
      ? 'haiku'
      : run.model.includes('opus')
        ? 'opus'
        : 'sonnet';
  const par = Math.max(
    (run.promptCount || 0) > 0 ? PAR_RATES[mk] * Math.sqrt(run.promptCount) : 0,
    PAR_FLOORS[mk]
  );
  const pct = run.spent / par;
  const urgency = pct >= 0.8 ? '⚠️  PAR CRITICAL — be concise. ' : '';
  const budgetLine = `Par: $${par.toFixed(2)} | Spent: $${run.spent.toFixed(4)} (${Math.round(pct * 100)}%) | Remaining: $${(par - run.spent).toFixed(4)}`;

  const effortStr = run.effort ? run.effort : 'default';
  const fastStr = run.fastMode ? ' ⚡ Fast' : '';
  const context = `## ⛳ TokenGolf Active
${urgency}Every token counts.

Model: ${run.model} | Effort: ${effortStr}${fastStr}
${budgetLine}

Efficiency tips:
- Use Read with start_line/end_line instead of reading whole files
- Be specific — avoid exploratory reads when you know the target
- Scope bash commands tightly`;

  process.stdout.write(
    JSON.stringify({
      hookSpecificOutput: {
        hookEventName: 'SessionStart',
        additionalContext: context,
      },
    })
  );
} catch {
  // silent fail
}
process.exit(0);
