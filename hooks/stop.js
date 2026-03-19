#!/usr/bin/env node
import fs from 'fs';
import path from 'path';
import os from 'os';

const cwdKey = (process.env.PWD || process.cwd()).replace(/\//g, '-');
const STATE_FILE = path.join(os.homedir(), '.tokengolf', `current-run${cwdKey}.json`);

let input = '';
process.stdin.setEncoding('utf8');
process.stdin.on('data', (chunk) => {
  input += chunk;
});
process.stdin.on('end', () => {
  try {
    const run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!run || run.status !== 'active') process.exit(0);

    const updated = {
      ...run,
      turnCount: (run.turnCount || 0) + 1,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2));
  } catch {
    // silent fail
  }
  process.exit(0);
});
