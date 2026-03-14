// ANSI scorecard renderer — extracted from hooks/session-end.js
// Used by both the session-end hook and the demo system.
import {
  getTier,
  getModelClass,
  getEffortLevel,
  getEfficiencyRating,
  getBudgetPct,
  getParBudget,
  formatCost,
} from './score.js';

const R = '\x1b[31m',
  G = '\x1b[32m',
  Y = '\x1b[33m',
  C = '\x1b[36m';
const M = '\x1b[35m',
  WH = '\x1b[37m',
  DIM = '\x1b[2m',
  RESET = '\x1b[0m',
  BOLD = '\x1b[1m';

export function termWidth(str) {
  // Compute display width of a string for achievement line wrapping.
  // Handles emoji variation selectors and surrogates:
  // - Supplementary plane chars (> U+FFFF) → 2 cols
  // - U+FE0F (emoji variation selector after BMP char) → upgrades prev from 1→2
  // - U+FE0E, ZWJ, zero-width chars → 0
  // - Everything else → 1
  /* eslint-disable no-control-regex */
  const plain = str.replace(/\x1b\[[0-9;]*m/g, '');
  /* eslint-enable no-control-regex */
  const cps = [...plain].map((c) => c.codePointAt(0));
  let width = 0;
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (cp === 0xfe0f) {
      if (i > 0 && cps[i - 1] <= 0xffff && cps[i - 1] !== 0x200d) width += 1;
      continue;
    }
    if (cp === 0xfe0e || cp === 0x200d || (cp >= 0x200b && cp <= 0x200f)) continue;
    if (cp > 0xffff) {
      width += 2;
      continue;
    }
    width += 1;
  }
  return width;
}

export function renderScorecard(run) {
  const W = Math.min(Math.max((process.stdout.columns || 88) - 8, 40), 80);
  const won = run.status === 'won';
  const effBudget = getParBudget(run.model, run.promptCount);

  const bc = won ? Y : R;
  const BLK = '██';

  function row(content) {
    return bc + BLK + RESET + '  ' + content;
  }
  function bar() {
    return bc + BLK + RESET + '  ' + DIM + '─'.repeat(W) + RESET;
  }

  const mc = getModelClass(run.model);
  const tier = getTier(run.spent, run.model);

  const fainted = run.fainted;
  const sessions = run.sessionCount || 1;
  const header = won
    ? `${BOLD}${Y}🏆  SESSION COMPLETE${RESET}`
    : fainted
      ? `${BOLD}${Y}💤  FAINTED — Run Continues${RESET}`
      : `${BOLD}${R}💀  PAR BUST${RESET}`;

  const questStr = `${DIM}${run.promptCount || 0} prompts · par $${effBudget.toFixed(2)}${RESET}`;

  const spentBefore = run.spentBeforeThisSession || 0;
  const spentThisSession = run.spent - spentBefore;
  const multiSession = sessions > 1 && spentBefore > 0;

  const spentStr =
    `${won ? G : R}${formatCost(run.spent)}${RESET}` +
    (multiSession ? `  ${DIM}(+${formatCost(spentThisSession)} this session)${RESET}` : '');

  let midRow = spentStr;
  {
    const pct = getBudgetPct(run.spent, effBudget);
    const eff = getEfficiencyRating(run.spent, effBudget);
    const effC =
      eff.color === 'yellow'
        ? Y
        : eff.color === 'magenta'
          ? M
          : eff.color === 'cyan'
            ? C
            : eff.color === 'green'
              ? G
              : eff.color === 'white'
                ? WH
                : R;
    midRow += `  ${DIM}/${RESET}$${effBudget.toFixed(2)}  ${pct}%  ${effC}${eff.emoji} ${eff.label}${RESET}`;
  }

  const effortInfo = run.effort ? getEffortLevel(run.effort) : null;
  const modelSuffix = [
    run.effort && effortInfo ? effortInfo.label : null,
    run.fastMode ? '⚡Fast' : null,
  ]
    .filter(Boolean)
    .join('·');
  midRow += `  ${C}${mc.emoji} ${mc.name}${modelSuffix ? '·' + modelSuffix : ''}${RESET}`;
  midRow += `  ${tier.emoji} ${tier.label}`;
  if (multiSession) midRow += `  ${DIM}${sessions} sessions${RESET}`;

  const achievements = run.achievements || [];
  const achTokens = achievements.map((a) => `${a.emoji} ${a.key}`);
  const achLines = [];
  let currentLine = '';
  for (const token of achTokens) {
    const sep = currentLine ? '  ' : '';
    const testLen = termWidth(currentLine + sep + token);
    if (currentLine && testLen > W) {
      achLines.push(currentLine);
      currentLine = token;
    } else {
      currentLine += sep + token;
    }
  }
  if (currentLine) achLines.push(currentLine);

  const ti = run.thinkingInvocations || 0;
  const thinkRow =
    ti > 0 ? `${M}🔮 ${ti} ultrathink${ti > 1 ? ' invocations' : ' invocation'}${RESET}` : null;

  const lines = ['', row(header), row(questStr), bar(), row(midRow)];

  if (thinkRow) {
    lines.push(bar());
    lines.push(row(thinkRow));
  }

  if (achLines.length > 0) {
    lines.push(bar());
    for (const line of achLines) {
      lines.push(row(line));
    }
  }

  lines.push(bar());
  lines.push(row(`${DIM}tokengolf scorecard${RESET}  ·  ${DIM}tokengolf stats${RESET}`));
  lines.push('');

  return lines.join('\n');
}
