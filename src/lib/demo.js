const R = '\x1b[31m';
const G = '\x1b[32m';
const Y = '\x1b[33m';
const M = '\x1b[35m';
const C = '\x1b[36m';
const W = '\x1b[37m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Implicit Gold-tier budgets for flow mode (same as FLOW_BUDGETS in statusline.sh)
const FLOW_BUDGETS = { Haiku: 0.4, Sonnet: 1.5, Opus: 7.5, Paladin: 7.5, '?': 1.5 };

const EMOTION_COLORS = {
  SLEEPING: DIM,
  ZOMBIE: R,
  DEAD: R,
  OVERWHELMED: R,
  FRUSTRATED: R,
  SWEATING: Y,
  FATIGUED: DIM,
  TENSE: Y,
  GRINDING: Y,
  FOCUSED: C,
  CRUISING: G,
  VIBING: G,
};

function hudLine({ quest, model, cost, budget, ctxPct, effort, fainted, floor, emotionKey }) {
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
  if (effort && effort !== 'medium')
    labelParts.push(effort.charAt(0).toUpperCase() + effort.slice(1));
  const modelLabel = labelParts.join('·');

  // Spend tier emoji
  let tierEmoji;
  if (cost < 0.1) tierEmoji = '💎';
  else if (cost < 0.3) tierEmoji = '🥇';
  else if (cost < 1.0) tierEmoji = '🥈';
  else if (cost < 3.0) tierEmoji = '🥉';
  else tierEmoji = '💸';

  // Budget bar (always shown — uses implicit budget for flow)
  const effBudget = budget || FLOW_BUDGETS[modelName] || 1.5;
  const pct = (cost / effBudget) * 100;
  let rating, rc;
  if (pct <= 15) {
    rating = 'LEGENDARY';
    rc = Y;
  } else if (pct <= 30) {
    rating = 'EPIC';
    rc = M;
  } else if (pct <= 50) {
    rating = 'PRO';
    rc = C;
  } else if (pct <= 75) {
    rating = 'SOLID';
    rc = G;
  } else if (pct <= 100) {
    rating = 'CLOSE CALL';
    rc = W;
  } else {
    rating = 'BUST';
    rc = R;
  }
  const accent = pct > 75 ? R : Y;
  const barW = 11;
  const barFilled = Math.min(barW, Math.round((pct / 100) * barW));
  const barEmpty = barW - barFilled;
  const bar = `${accent}${'▓'.repeat(barFilled)}${'░'.repeat(barEmpty)}${RESET}`;
  const costStr = `${DIM}$${RESET}${cost.toFixed(2)}${DIM}/${effBudget.toFixed(2)}${RESET} ${bar} ${pct.toFixed(0)}%`;
  const ratingStr = ` ${tierEmoji} ${rc}${rating}${RESET}`;

  // Context bar (line 2, always shown — default to 0)
  const ctxPctVal = ctxPct != null ? ctxPct : 0;
  const ctxW = 10;
  const ctxFilled = Math.min(ctxW, Math.round((ctxPctVal / 100) * ctxW));
  const ctxEmpty = ctxW - ctxFilled;
  let ctxColor, ctxIcon;
  if (ctxPctVal >= 90) {
    ctxColor = R;
    ctxIcon = '🗿';
  } else if (ctxPctVal >= 75) {
    ctxColor = Y;
    ctxIcon = '🪨';
  } else if (ctxPctVal >= 60) {
    ctxColor = Y;
    ctxIcon = '🧱';
  } else if (ctxPctVal >= 40) {
    ctxColor = C;
    ctxIcon = '🎒';
  } else if (ctxPctVal >= 20) {
    ctxColor = G;
    ctxIcon = '📚';
  } else {
    ctxColor = G;
    ctxIcon = '🪶';
  }
  const ctxBar = `${ctxColor}${'▓'.repeat(ctxFilled)}${'░'.repeat(ctxEmpty)}${RESET}`;

  // Line 1: accent + icon + quest/emotion + cost bar + rating + floor
  const icon = fainted ? '💤' : '⛳';
  let questDisplay;
  if (quest) {
    questDisplay = quest;
  } else if (emotionKey) {
    questDisplay = `${EMOTION_COLORS[emotionKey] || G}${emotionKey}${RESET}`;
  } else {
    questDisplay = 'Flow';
  }
  let line1 = ` ${accent}██${RESET} ${icon} ${questDisplay}  ${costStr}${ratingStr}`;
  if (budget && floor) line1 += `  ${DIM}F${floor}${RESET}`;

  // Line 2: model + context bar (always shown)
  const line2 = ` ${accent}██${RESET} ${modelLabel}  🧠 ${ctxBar} ${ctxPctVal}% ${ctxIcon}`;

  return `${line1}\n${line2}`;
}

const SCENARIOS = [
  {
    title: 'Flow mode  (passive — implicit Gold-tier budget, emotion status)',
    hud: { model: 'claude-sonnet-4-6', cost: 0.0034, ctxPct: 8, emotionKey: 'VIBING' },
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
      ctxPct: 45,
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
