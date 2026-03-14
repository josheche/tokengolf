#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';
import os from 'os';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const { autoDetectCost } = await import(path.join(__dir, '../src/lib/cost.js'));
const { getCurrentRun, clearCurrentRun } = await import(path.join(__dir, '../src/lib/state.js'));
const { saveRun } = await import(path.join(__dir, '../src/lib/store.js'));
const { renderScorecard } = await import(path.join(__dir, '../src/lib/ansi-scorecard.js'));

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
  let liveCost = null;
  try {
    const raw = fs
      .readFileSync(path.join(os.homedir(), '.tokengolf', 'session-cost'), 'utf8')
      .trim();
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
  const { getParBudget: gp } = await import(path.join(__dir, '../src/lib/score.js'));
  const { getEffectiveParRates, getEffectiveParFloors } = await import(
    path.join(__dir, '../src/lib/config.js')
  );
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
    const { setCurrentRun } = await import(path.join(__dir, '../src/lib/state.js'));
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
    fs.unlinkSync(path.join(os.homedir(), '.tokengolf', 'session-cost'));
  } catch {}

  writeTTY('\n' + renderScorecard(saved) + '\n\n');
} catch {
  // silent fail
}

process.exit(0);
