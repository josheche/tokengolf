#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_FILE = path.join(os.homedir(), '.tokengolf', 'current-run.json');
const STATE_DIR  = path.join(os.homedir(), '.tokengolf');

try {
  const cwd = process.env.PWD || process.cwd();

  let run = null;
  try { run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch { /* no run */ }

  if (!run || run.status !== 'active') {
    // Flow mode: auto-start a tracking run for this session
    if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
    run = {
      quest: null,
      model: 'claude-sonnet-4-6',
      budget: null,
      spent: 0,
      status: 'active',
      mode: 'flow',
      floor: 1,
      totalFloors: 5,
      promptCount: 0,
      totalToolCalls: 0,
      toolCalls: {},
      cwd,
      startedAt: new Date().toISOString(),
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
  } else if (!run.cwd) {
    run = { ...run, cwd };
    fs.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
  }

  const pct = run.budget ? run.spent / run.budget : 0;
  const urgency = run.budget && pct >= 0.8 ? '⚠️  BUDGET CRITICAL — be concise. ' : '';
  const questLine = run.quest ? `Quest: ${run.quest}` : 'Mode: Flow (auto-tracking)';
  const budgetLine = run.budget
    ? `Budget: $${run.budget.toFixed(2)} | Spent: $${run.spent.toFixed(4)} (${Math.round(pct * 100)}%) | Remaining: $${(run.budget - run.spent).toFixed(4)}`
    : '';

  const context = `## ⛳ TokenGolf Active
${urgency}Every token counts.

${questLine}
Model: ${run.model} | Floor: ${run.floor}/${run.totalFloors}
${budgetLine}

Efficiency tips:
- Use Read with start_line/end_line instead of reading whole files
- Be specific — avoid exploratory reads when you know the target
- Scope bash commands tightly`;

  process.stdout.write(JSON.stringify({
    hookSpecificOutput: {
      hookEventName: 'SessionStart',
      additionalContext: context,
    },
  }));
} catch {
  // silent fail
}
process.exit(0);
