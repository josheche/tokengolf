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
    const run = JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
    if (!run || run.status !== 'active') process.exit(0);

    const event = JSON.parse(input);
    const toolName = event.tool_name || 'Unknown';
    const toolCalls = run.toolCalls || {};
    toolCalls[toolName] = (toolCalls[toolName] || 0) + 1;

    const updated = {
      ...run,
      toolCalls,
      totalToolCalls: (run.totalToolCalls || 0) + 1,
    };
    fs.writeFileSync(STATE_FILE, JSON.stringify(updated, null, 2));

    // Par-based budget warning at 80%+ (with user overrides from config.json)
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
    if (pct >= 0.8 && pct < 1.0) {
      const remaining = (par - updated.spent).toFixed(4);
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            systemMessage: `⚠️ TokenGolf: $${updated.spent.toFixed(4)} of $${par.toFixed(2)} par (${Math.round(pct * 100)}%). Only $${remaining} left. Be concise and targeted.`,
          },
        })
      );
    }
  } catch {
    // silent fail
  }
  process.exit(0);
});
