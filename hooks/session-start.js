#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_FILE = path.join(os.homedir(), '.tokengolf', 'current-run.json');
const STATE_DIR = path.join(os.homedir(), '.tokengolf');

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
      quest: null,
      model: 'claude-sonnet-4-6',
      budget: null,
      effort: detectEffort(),
      fastMode: detectFastMode(),
      spent: 0,
      status: 'active',
      mode: 'flow',
      floor: 1,
      totalFloors: 5,
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

  const pct = run.budget ? run.spent / run.budget : 0;
  const urgency = run.budget && pct >= 0.8 ? '⚠️  BUDGET CRITICAL — be concise. ' : '';
  const questLine = run.quest ? `Quest: ${run.quest}` : 'Mode: Flow (auto-tracking)';
  const budgetLine = run.budget
    ? `Budget: $${run.budget.toFixed(2)} | Spent: $${run.spent.toFixed(4)} (${Math.round(pct * 100)}%) | Remaining: $${(run.budget - run.spent).toFixed(4)}`
    : '';

  const effortStr = run.effort ? run.effort : 'default';
  const fastStr = run.fastMode ? ' ⚡ Fast' : '';
  const context = `## ⛳ TokenGolf Active
${urgency}Every token counts.

${questLine}
Model: ${run.model} | Effort: ${effortStr}${fastStr} | Floor: ${run.floor}/${run.totalFloors}
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
