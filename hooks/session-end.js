#!/usr/bin/env node
import { fileURLToPath } from 'url';
import path from 'path';
import fs from 'fs';

const __dir = path.dirname(fileURLToPath(import.meta.url));
const { autoDetectCost } = await import(path.join(__dir, '../src/lib/cost.js'));
const { getCurrentRun, clearCurrentRun } = await import(path.join(__dir, '../src/lib/state.js'));
const { saveRun } = await import(path.join(__dir, '../src/lib/store.js'));
const { getTier, getModelClass, getEffortLevel, getEfficiencyRating, getBudgetPct } = await import(path.join(__dir, '../src/lib/score.js'));

function renderScorecard(run) {
  const W = 68;
  const won = run.status === 'won';
  const flowMode = !run.budget;

  const R = '\x1b[31m', G = '\x1b[32m', Y = '\x1b[33m', C = '\x1b[36m';
  const M = '\x1b[35m', DIM = '\x1b[2m', RESET = '\x1b[0m', BOLD = '\x1b[1m';
  const bc = won ? Y : R;

  const tl = '╔', tr = '╗', bl = '╚', br = '╝';
  const h = '═', v = '║';
  const ml = '╠', mr = '╣';

  function bar() { return bc + ml + h.repeat(W) + mr + RESET; }
  function top() { return bc + tl + h.repeat(W) + tr + RESET; }
  function bot() { return bc + bl + h.repeat(W) + br + RESET; }
  function row(content) {
    // Strip ANSI for length calculation
    const plain = content.replace(/\x1b\[[0-9;]*m/g, '');
    const pad = Math.max(0, W - plain.length - 2);
    return bc + v + RESET + ' ' + content + ' '.repeat(pad) + ' ' + bc + v + RESET;
  }

  const mc = getModelClass(run.model);
  const tier = getTier(run.spent);

  const fainted = run.fainted;
  const sessions = run.sessionCount || 1;
  const header = won
    ? `${BOLD}${Y}🏆  SESSION COMPLETE${RESET}`
    : fainted
    ? `${BOLD}${Y}💤  FAINTED — Run Continues${RESET}`
    : `${BOLD}${R}💀  BUDGET BUSTED${RESET}`;

  const questStr = run.quest
    ? `${BOLD}${run.quest.slice(0, 60)}${RESET}`
    : `${DIM}Flow Mode${RESET}`;

  const spentStr = `${won ? G : R}$${run.spent.toFixed(4)}${RESET}`;

  let midRow = spentStr;
  if (!flowMode) {
    const pct = getBudgetPct(run.spent, run.budget);
    const eff = getEfficiencyRating(run.spent, run.budget);
    const effC = eff.color === 'magenta' ? M : eff.color === 'cyan' ? C : eff.color === 'green' ? G : eff.color === 'yellow' ? Y : R;
    midRow += `  ${DIM}/${RESET}$${run.budget.toFixed(2)}  ${pct}%  ${effC}${eff.emoji} ${eff.label}${RESET}`;
  }

  const effortInfo = run.effort ? getEffortLevel(run.effort) : null;
  const modelSuffix = [
    run.effort && run.effort !== 'medium' && effortInfo ? effortInfo.label : null,
    run.fastMode ? '⚡Fast' : null,
  ].filter(Boolean).join('·');
  midRow += `  ${C}${mc.emoji} ${mc.name}${modelSuffix ? '·' + modelSuffix : ''}${RESET}`;
  midRow += `  ${tier.emoji} ${tier.label}`;
  if (sessions > 1) midRow += `  ${DIM}${sessions} sessions${RESET}`;

  const achievements = run.achievements || [];
  const achStr = achievements.map(a => `${a.emoji} ${a.key}`).join('  ');

  const ti = run.thinkingInvocations || 0;
  const thinkRow = ti > 0
    ? `${M}🔮 ${ti} ultrathink${ti > 1 ? ' invocations' : ' invocation'}${RESET}`
    : null;

  const lines = [
    top(),
    row(header),
    row(questStr),
    bar(),
    row(midRow),
  ];

  if (thinkRow) {
    lines.push(bar());
    lines.push(row(thinkRow));
  }

  if (achievements.length > 0) {
    lines.push(bar());
    lines.push(row(achStr));
  }

  lines.push(bar());
  lines.push(row(`${DIM}tokengolf scorecard${RESET}  ·  ${DIM}tokengolf start${RESET}  ·  ${DIM}tokengolf stats${RESET}`));
  lines.push(bot());

  return lines.join('\n');
}

try {
  let stdin = '';
  try { stdin = fs.readFileSync('/dev/stdin', 'utf8'); } catch {}

  let event = {};
  try { event = JSON.parse(stdin); } catch {}
  const reason = event.reason || 'other';

  const run = getCurrentRun();
  if (!run || run.status !== 'active') process.exit(0);

  const result = autoDetectCost(run);

  // reason 'other' = unexpected exit (usage limit hit = Fainted)
  // clean exits: 'clear', 'logout', 'prompt_input_exit', 'bypass_permissions_disabled'
  const cleanExits = ['clear', 'logout', 'prompt_input_exit', 'bypass_permissions_disabled'];
  const fainted = !cleanExits.includes(reason) && reason !== 'other' ? false
    : reason === 'other';

  let status;
  if (run.budget && result.spent > run.budget) status = 'died';
  else if (fainted) status = 'resting'; // hit limit, run continues next session
  else status = 'won';

  const thinkingFields = {
    thinkingInvocations: result.thinkingInvocations ?? 0,
    thinkingTokens: result.thinkingTokens ?? 0,
  };

  // For resting runs: update state but don't clear — run continues next session
  if (status === 'resting') {
    const { setCurrentRun } = await import(path.join(__dir, '../src/lib/state.js'));
    setCurrentRun({ ...run, spent: result.spent, fainted: true, ...thinkingFields });
    const saved = { ...run, spent: result.spent, modelBreakdown: result.modelBreakdown, status, fainted: true, ...thinkingFields };
    process.stdout.write('\n' + renderScorecard({ ...saved, achievements: [] }) + '\n\n');
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

  process.stdout.write('\n' + renderScorecard(saved) + '\n\n');
} catch {
  // silent fail
}

process.exit(0);
