#!/usr/bin/env node
import path from 'path';
import fs from 'fs';
import os from 'os';
import { autoDetectCost } from '../src/lib/cost.js';
import { getCurrentRun, clearCurrentRun, setCurrentRun } from '../src/lib/state.js';
import { saveRun } from '../src/lib/store.js';
import { renderScorecard } from '../src/lib/ansi-scorecard.js';
import { getParBudget as gp } from '../src/lib/score.js';
import { getEffectiveParRates, getEffectiveParFloors } from '../src/lib/config.js';

function writeTTY(text) {
  try {
    const ttyFd = fs.openSync('/dev/tty', 'w');
    fs.writeSync(ttyFd, text);
    fs.closeSync(ttyFd);
  } catch {
    process.stdout.write(text); // fallback
  }
}

try {
  let stdin = '';
  try {
    stdin = fs.readFileSync('/dev/stdin', 'utf8');
  } catch {}

  let event = {};
  try {
    event = JSON.parse(stdin);
  } catch {}
  const reason = event.reason || 'other';

  // Read authoritative cost from StatusLine sidecar (same source as the HUD)
  const cwdKey = (process.env.PWD || process.cwd()).replace(/\//g, '-');
  const costFile = path.join(os.homedir(), '.tokengolf', `session-cost${cwdKey}`);
  let liveCost = null;
  try {
    const raw = fs.readFileSync(costFile, 'utf8').trim();
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) liveCost = parsed;
  } catch {}
  // SessionEnd event may also carry cost (future-proofing)
  const eventCost = event.cost?.total_cost_usd ?? null;
  // Priority: liveCost (StatusLine sidecar) > eventCost > transcript parsing
  const authoritativeCost = liveCost ?? eventCost;

  const run = getCurrentRun();
  if (!run || run.status !== 'active') process.exit(0);

  let result = autoDetectCost(run);
  if (!result && authoritativeCost === null) process.exit(0); // no data at all
  if (!result) result = { spent: 0, modelBreakdown: {}, thinkingInvocations: 0, thinkingTokens: 0 };
  // Always prefer authoritative cost over manual transcript recomputation
  if (authoritativeCost !== null) {
    // Scale model breakdown to match authoritative total (transcript ratios are correct, amounts are not)
    if (result.modelBreakdown && Object.keys(result.modelBreakdown).length > 0) {
      const parsedTotal = Object.values(result.modelBreakdown).reduce((s, v) => s + v, 0);
      if (parsedTotal > 0) {
        const scale = authoritativeCost / parsedTotal;
        for (const model of Object.keys(result.modelBreakdown)) {
          result.modelBreakdown[model] *= scale;
        }
      }
    }
    result.spent = authoritativeCost;
  }

  // Merge model breakdown by family (e.g. claude-opus-4-6 + claude-opus-4-20250514 → Opus)
  if (result.modelBreakdown && Object.keys(result.modelBreakdown).length > 0) {
    const merged = {};
    for (const [model, cost] of Object.entries(result.modelBreakdown)) {
      const m = model.toLowerCase();
      const family = m.includes('haiku') ? 'Haiku' : m.includes('sonnet') ? 'Sonnet' : 'Opus';
      merged[family] = (merged[family] || 0) + cost;
    }
    result.modelBreakdown = merged;
  }

  // reason 'other' = unexpected exit (usage limit hit = Fainted)
  // clean exits: 'clear', 'logout', 'prompt_input_exit', 'bypass_permissions_disabled'
  const cleanExits = ['clear', 'logout', 'prompt_input_exit', 'bypass_permissions_disabled'];
  const fainted = !cleanExits.includes(reason) && reason !== 'other' ? false : reason === 'other';

  // Par-based death: spent > par = BUST (with user overrides from config.json)
  const par = gp(run.model, run.promptCount, getEffectiveParRates(), getEffectiveParFloors());
  let status;
  if (result.spent > par) status = 'died';
  else if (fainted)
    status = 'resting'; // hit limit, run continues next session
  else status = 'won';

  const thinkingFields = {
    thinkingInvocations: result.thinkingInvocations ?? 0,
    thinkingTokens: result.thinkingTokens ?? 0,
  };

  // For resting runs: update state but don't clear — run continues next session
  if (status === 'resting') {
    setCurrentRun({ ...run, spent: result.spent, fainted: true, ...thinkingFields });
    const saved = {
      ...run,
      spent: result.spent,
      modelBreakdown: result.modelBreakdown,
      status,
      fainted: true,
      ...thinkingFields,
    };
    writeTTY('\n' + renderScorecard({ ...saved, achievements: [] }) + '\n\n');
    process.exit(0);
  }

  const saved = saveRun({
    ...run,
    spent: result.spent,
    modelBreakdown: result.modelBreakdown,
    status,
    endedAt: new Date().toISOString(),
    ...thinkingFields,
  });

  clearCurrentRun();
  // Clean up sidecar cost file
  try {
    fs.unlinkSync(costFile);
  } catch {}

  writeTTY('\n' + renderScorecard(saved) + '\n\n');
} catch {
  // silent fail
}

process.exit(0);
