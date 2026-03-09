#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_FILE = path.join(os.homedir(), '.tokengolf', 'current-run.json');

try {
  let stdin = '';
  try { stdin = fs.readFileSync('/dev/stdin', 'utf8'); } catch {}

  let event = {};
  try { event = JSON.parse(stdin); } catch {}

  const trigger = event.trigger || 'auto'; // 'manual' or 'auto'

  let run = null;
  try { run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8')); } catch {}
  if (!run || run.status !== 'active') process.exit(0);

  const compactionEvents = run.compactionEvents || [];
  compactionEvents.push({
    trigger,
    timestamp: new Date().toISOString(),
    contextPct: event.context_window?.used_percentage ?? event.context_window_usage_pct ?? null,
    customInstructions: event.custom_instructions || null,
  });

  run = { ...run, compactionEvents };
  fs.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
} catch {
  // silent fail
}

process.exit(0);
