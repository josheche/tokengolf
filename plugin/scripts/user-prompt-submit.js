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

  // Par-based nudge at 50% — once (between 50-60%, with user overrides from config.json)
  let _cfg = {};
  try {
    _cfg = JSON.parse(
      fs.readFileSync(path.join(os.homedir(), '.tokengolf', 'config.json'), 'utf8')
    );
  } catch {}
  const PAR_RATES = {
    haiku: 0.15,
    sonnet: 1.5,
    opusplan: 4.5,
    opus: 8.0,
    ...(_cfg.parRates || {}),
  };
  const PAR_FLOORS = {
    haiku: 0.1,
    sonnet: 0.75,
    opusplan: 2.0,
    opus: 3.0,
    ...(_cfg.parFloors || {}),
  };
  const mk = (updated.model || '').includes('opusplan')
    ? 'opusplan'
    : (updated.model || '').includes('haiku')
      ? 'haiku'
      : (updated.model || '').includes('opus')
        ? 'opus'
        : 'sonnet';
  const par = Math.max(
    (updated.promptCount || 0) > 0 ? PAR_RATES[mk] * Math.sqrt(updated.promptCount) : 0,
    PAR_FLOORS[mk]
  );
  const pct = updated.spent / par;
  if (pct >= 0.5 && pct < 0.6) {
    process.stdout.write(
      JSON.stringify({
        hookSpecificOutput: {
          hookEventName: 'UserPromptSubmit',
          additionalContext: `[TokenGolf] Halfway point. $${updated.spent.toFixed(4)} of $${par.toFixed(2)} par spent. Stay focused.`,
        },
      })
    );
  }
} catch {
  // silent fail
}
process.exit(0);
