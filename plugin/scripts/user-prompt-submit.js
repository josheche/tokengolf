#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_FILE = path.join(os.homedir(), '.tokengolf', 'current-run.json');

try {
  const run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  if (!run || run.status !== 'active') process.exit(0);

  const updated = { ...run, promptCount: (run.promptCount || 0) + 1 };
  fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2));

  // Nudge at 50% — once (between 50-60%). Use implicit Gold-tier budget for flow mode.
  const FLOW_BUDGETS = { 'claude-haiku-4-5-20251001': 0.40, 'claude-sonnet-4-6': 1.50, 'claude-opus-4-6': 7.50, 'opusplan': 7.50 };
  const effBudget = updated.budget || FLOW_BUDGETS[updated.model] || 1.50;
  const pct = updated.spent / effBudget;
  if (pct >= 0.5 && pct < 0.6) {
    const questStr = updated.quest ? `Quest: "${updated.quest}" — ` : '';
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: `[TokenGolf] Halfway point. $${updated.spent.toFixed(4)} of $${effBudget.toFixed(2)} spent. ${questStr}stay focused.`,
        },
      })
    );
  }
} catch {
  // silent fail
}
process.exit(0);
