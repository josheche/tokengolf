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

  const pct = updated.spent / updated.budget;

  // Nudge at 50% — once (between 50-60%)
  if (pct >= 0.5 && pct < 0.6) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: `[TokenGolf] Halfway point. $${updated.spent.toFixed(4)} of $${updated.budget.toFixed(2)} spent. Quest: "${updated.quest}" — stay focused.`,
        },
      })
    );
  }
} catch {
  // silent fail
}
process.exit(0);
