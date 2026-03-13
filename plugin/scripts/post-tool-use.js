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

    // Warn at 80%+ (use implicit Gold-tier budget for flow mode)
    const FLOW_BUDGETS = {
      'claude-haiku-4-5-20251001': 0.4,
      'claude-sonnet-4-6': 1.5,
      'claude-opus-4-6': 7.5,
      opusplan: 7.5,
    };
    const effBudget = updated.budget || FLOW_BUDGETS[updated.model] || 1.5;
    const pct = updated.spent / effBudget;
    if (pct >= 0.8 && pct < 1.0) {
      const remaining = (effBudget - updated.spent).toFixed(4);
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PostToolUse',
            systemMessage: `⚠️ TokenGolf: $${updated.spent.toFixed(4)} of $${effBudget.toFixed(2)} spent (${Math.round(pct * 100)}%). Only $${remaining} left. Be concise and targeted.`,
          },
        })
      );
    }
  } catch {
    // silent fail
  }
  process.exit(0);
});
