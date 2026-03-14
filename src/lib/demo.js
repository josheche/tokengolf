const R = '\x1b[31m';
const G = '\x1b[32m';
const Y = '\x1b[33m';
const M = '\x1b[35m';
const C = '\x1b[36m';
const W = '\x1b[37m';
const DIM = '\x1b[2m';
const BOLD = '\x1b[1m';
const RESET = '\x1b[0m';

// Par rates (prompt-scaled budget) — same as MODEL_PAR_RATES in score.js
const PAR_RATES = { Haiku: 0.15, Sonnet: 1.5, Opus: 8.0, Paladin: 4.5, '?': 1.5 };
const PAR_FLOORS = { Haiku: 0.1, Sonnet: 0.75, Opus: 3.0, Paladin: 2.0, '?': 0.75 };

function getPar(modelName, promptCount) {
  return Math.max(
    promptCount > 0 ? (PAR_RATES[modelName] || 7.0) * Math.sqrt(promptCount) : 0,
    PAR_FLOORS[modelName] || 3.0
  );
}

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

function hudLine({ model, cost, prompts, ctxPct, effort, fainted, emotionKey }) {
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

  // Model-calibrated spend tier emoji
  const SPEND_TIERS = {
    Haiku: [0.03, 0.15, 0.4, 1.0, 2.5],
    Sonnet: [0.1, 0.5, 1.5, 4.0, 10.0],
    Opus: [0.5, 2.5, 7.5, 20.0, 50.0],
    Paladin: [0.3, 1.5, 4.5, 12.0, 30.0],
    '?': [0.1, 0.5, 1.5, 4.0, 10.0],
  };
  const st = SPEND_TIERS[modelName] || SPEND_TIERS.Sonnet;
  const tierEmojis = ['✨', '💎', '🥇', '🥈', '🥉', '💸'];
  const tierIdx = [0, 1, 2, 3, 4].find((i) => cost < st[i]);
  const tierEmoji = tierEmojis[tierIdx !== undefined ? tierIdx : 5];

  // Par-based budget
  const par = getPar(modelName, prompts || 0);
  const pct = (cost / par) * 100;
  let rating, rc, effEmoji;
  if (pct <= 15) {
    rating = 'LEGENDARY';
    rc = Y;
    effEmoji = '🌟';
  } else if (pct <= 30) {
    rating = 'EPIC';
    rc = M;
    effEmoji = '🔥';
  } else if (pct <= 50) {
    rating = 'PRO';
    rc = C;
    effEmoji = '💪';
  } else if (pct <= 75) {
    rating = 'SOLID';
    rc = G;
    effEmoji = '✅';
  } else if (pct <= 100) {
    rating = 'CLOSE CALL';
    rc = W;
    effEmoji = '⚠️';
  } else {
    rating = 'BUST';
    rc = R;
    effEmoji = '💥';
  }
  const accent = rc;
  const barW = 11;
  const barFilled = Math.min(barW, Math.round((pct / 100) * barW));
  const barEmpty = barW - barFilled;
  const bar = `${accent}${'▓'.repeat(barFilled)}${'░'.repeat(barEmpty)}${RESET}`;
  const costStr = `${tierEmoji} ${DIM}$${RESET}${cost.toFixed(2)}${DIM}/${par.toFixed(2)}${RESET} ${bar} ${pct.toFixed(0)}%`;
  const ratingStr = ` ${effEmoji} ${rc}${rating}${RESET}`;

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

  // Line 1: accent + icon + emotion + cost bar + rating
  const icon = fainted ? '💤' : '⛳';
  let emotionDisplay;
  if (emotionKey) {
    emotionDisplay = `${EMOTION_COLORS[emotionKey] || G}${emotionKey}${RESET}`;
  } else {
    emotionDisplay = `${G}VIBING${RESET}`;
  }
  const line1 = ` ${accent}██${RESET} ${icon} ${emotionDisplay}  ${costStr}${ratingStr}`;

  // Line 2: model + context bar (always shown)
  const promptStr = (prompts || 0) > 0 ? `  💬 ${prompts}p` : '';
  const line2 = ` ${accent}██${RESET} ${modelLabel}  ${ctxIcon} ${ctxBar} ${ctxPctVal}%${promptStr}`;

  return `${line1}\n${line2}`;
}

const SCENARIOS = [
  {
    title: 'Fresh session · Sonnet · 2 prompts · VIBING',
    hud: { model: 'claude-sonnet-4-6', cost: 0.42, prompts: 2, ctxPct: 8, emotionKey: 'VIBING' },
  },
  {
    title: 'Sonnet · 8 prompts · efficient · GRINDING',
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 6.8,
      prompts: 8,
      ctxPct: 34,
      emotionKey: 'GRINDING',
    },
  },
  {
    title: 'Sonnet·High · 5 prompts · LEGENDARY',
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 0.41,
      prompts: 5,
      ctxPct: 29,
      effort: 'high',
      emotionKey: 'VIBING',
    },
  },
  {
    title: 'Opus · 4 prompts · EPIC',
    hud: {
      model: 'claude-opus-4-6',
      cost: 18.0,
      prompts: 4,
      ctxPct: 52,
      emotionKey: 'CRUISING',
    },
  },
  {
    title: 'Haiku · 20 prompts · CLOSE CALL',
    hud: {
      model: 'claude-haiku-4-5-20251001',
      cost: 2.1,
      prompts: 20,
      ctxPct: 78,
      emotionKey: 'SWEATING',
    },
  },
  {
    title: 'Sonnet · 10 prompts · BUSTED',
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 34.24,
      prompts: 10,
      ctxPct: 45,
      emotionKey: 'ZOMBIE',
    },
  },
  {
    title: 'Opus · 3 prompts · overencumbered context',
    hud: {
      model: 'claude-opus-4-6',
      cost: 28.0,
      prompts: 3,
      ctxPct: 91,
      emotionKey: 'FOCUSED',
    },
  },
  {
    title: 'Fainted 💤 — usage limit hit, run resumes next session',
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 4.22,
      prompts: 6,
      ctxPct: 67,
      fainted: true,
      emotionKey: 'SLEEPING',
    },
  },
];

export function runDemo() {
  console.log('');
  console.log(`${BOLD}${C}⛳ TokenGolf — HUD Demo${RESET}`);
  console.log(`${DIM}Live statusline shown in every Claude Code session${RESET}`);
  console.log(`${DIM}Par scales with prompts: par = max(rate × sqrt(prompts), floor)${RESET}`);
  console.log('');

  for (const { title, hud } of SCENARIOS) {
    console.log(`${DIM}${title}${RESET}`);
    console.log(hudLine(hud));
    console.log('');
  }

  console.log(
    `${DIM}Every session is tracked automatically — just open Claude Code and go.${RESET}`
  );
  console.log('');
}
