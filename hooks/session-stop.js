#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const STATE_FILE = path.join(os.homedir(), '.tokengolf', 'current-run.json');

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const event = JSON.parse(input);

    // Claude Code passes total_cost_usd in the Stop event
    const cost = event.total_cost_usd ?? event.cost_usd ?? event.totalCostUsd ?? null;
    if (cost == null) process.exit(0);

    const run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!run || run.status !== 'active') process.exit(0);

    fs.writeFileSync(STATE_FILE, JSON.stringify({ ...run, spent: cost }, null, 2));
  } catch {
    /* no run or no cost data */
  }
  process.exit(0);
});
