const R = '\x1b[31m';
const G = '\x1b[32m';
const Y = '\x1b[33m';
const M = '\x1b[35m';
const C = '\x1b[36m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

function hudLine({ quest, model, cost, budget, ctxPct, effort, fainted, floor }) {
  const m = (model || '').toLowerCase();
  let modelName, modelEmoji;
  if (m.includes('haiku')) {
    modelName = 'Haiku';
    modelEmoji = '🏹';
  } else if (m.includes('sonnet')) {
    modelName = 'Sonnet';
    modelEmoji = '⚔️';
  } else if (m.includes('opus')) {
    modelName = 'Opus';
    modelEmoji = '🧙';
  } else {
    modelName = '?';
    modelEmoji = '?';
  }

  const labelParts = [`${modelEmoji} ${modelName}`];
  if (effort) labelParts.push(effort.charAt(0).toUpperCase() + effort.slice(1));
  const modelLabel = labelParts.join('·');

  let tierEmoji;
  if (cost < 0.1) tierEmoji = '💎';
  else if (cost < 0.3) tierEmoji = '🥇';
  else if (cost < 1.0) tierEmoji = '🥈';
  else if (cost < 3.0) tierEmoji = '🥉';
  else tierEmoji = '💸';

  const sep = ` ${DIM}|${RESET} `;
  let costStr, ratingStr;

  if (budget) {
    const pct = (cost / budget) * 100;
    let rating, rc;
    if (pct <= 25) {
      rating = 'LEGENDARY';
      rc = M;
    } else if (pct <= 50) {
      rating = 'EFFICIENT';
      rc = C;
    } else if (pct <= 75) {
      rating = 'SOLID';
      rc = G;
    } else if (pct <= 100) {
      rating = 'CLOSE CALL';
      rc = Y;
    } else {
      rating = 'BUSTED';
      rc = R;
    }
    costStr = `${tierEmoji} $${cost.toFixed(4)}/$${budget.toFixed(2)} ${pct.toFixed(0)}%`;
    ratingStr = `${rc}${rating}${RESET}`;
  } else {
    costStr = `${tierEmoji} $${cost.toFixed(4)}`;
    ratingStr = null;
  }

  let ctxStr = null;
  if (ctxPct != null) {
    if (ctxPct >= 90) ctxStr = `${R}📦 ${ctxPct}%${RESET}`;
    else if (ctxPct >= 75) ctxStr = `${Y}🎒 ${ctxPct}%${RESET}`;
    else if (ctxPct >= 50) ctxStr = `${G}🪶 ${ctxPct}%${RESET}`;
  }

  const icon = fainted ? '💤' : '⛳';
  const prefix = `${BOLD}${C}${icon}${RESET}`;
  const parts = [`${prefix} ${quest}`, costStr];
  if (ratingStr) parts.push(ratingStr);
  if (ctxStr) parts.push(ctxStr);
  parts.push(`${C}${modelLabel}${RESET}`);
  if (budget && floor) parts.push(`Floor ${floor}`);

  return `${DIM} ───────────────${RESET}\n${parts.join(sep)}\n${DIM} ───────────────${RESET}`;
}

const SCENARIOS = [
  {
    title: 'Flow mode  (passive — no quest, no budget)',
    hud: { quest: 'Flow', model: 'claude-sonnet-4-6', cost: 0.0034 },
  },
  {
    title: 'Roguelike · Sonnet · EFFICIENT',
    hud: {
      quest: 'add pagination to /users',
      model: 'claude-sonnet-4-6',
      cost: 0.54,
      budget: 1.5,
      ctxPct: 34,
      floor: '2/5',
    },
  },
  {
    title: 'Roguelike · Sonnet·High · LEGENDARY',
    hud: {
      quest: 'implement SSO with SAML',
      model: 'claude-sonnet-4-6',
      cost: 0.41,
      budget: 2.0,
      ctxPct: 29,
      effort: 'high',
      floor: '1/5',
    },
  },
  {
    title: 'Roguelike · Opus · LEGENDARY · 🪶 context',
    hud: {
      quest: 'refactor auth middleware',
      model: 'claude-opus-4-6',
      cost: 0.82,
      budget: 4.0,
      ctxPct: 52,
      floor: '3/5',
    },
  },
  {
    title: 'Roguelike · Haiku · CLOSE CALL · 🎒 context',
    hud: {
      quest: 'fix N+1 query in dashboard',
      model: 'claude-haiku-4-5-20251001',
      cost: 0.46,
      budget: 0.5,
      ctxPct: 78,
      floor: '4/5',
    },
  },
  {
    title: 'Roguelike · BUSTED — over budget',
    hud: {
      quest: 'migrate postgres schema',
      model: 'claude-sonnet-4-6',
      cost: 2.41,
      budget: 2.0,
      floor: '2/5',
    },
  },
  {
    title: 'Roguelike · Opus · EFFICIENT · 📦 overencumbered',
    hud: {
      quest: 'refactor entire API layer',
      model: 'claude-opus-4-6',
      cost: 3.1,
      budget: 10.0,
      ctxPct: 91,
      floor: '3/5',
    },
  },
  {
    title: 'Fainted 💤 — usage limit hit, run resumes next session',
    hud: {
      quest: 'write test suite for payments',
      model: 'claude-sonnet-4-6',
      cost: 1.22,
      budget: 3.0,
      ctxPct: 67,
      fainted: true,
      floor: '2/5',
    },
  },
];

export function runDemo() {
  console.log('');
  console.log(`${BOLD}${C}⛳ TokenGolf — HUD Demo${RESET}`);
  console.log(`${DIM}Live statusline shown in every Claude Code session${RESET}`);
  console.log('');

  for (const { title, hud } of SCENARIOS) {
    console.log(`${DIM}${title}${RESET}`);
    console.log(hudLine(hud));
    console.log('');
  }

  console.log(
    `${DIM}Run ${RESET}tokengolf start${DIM} to begin a roguelike run, or just open Claude Code — flow mode tracks automatically.${RESET}`
  );
  console.log('');
}
