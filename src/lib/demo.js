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

function hudLine({
  model,
  cost,
  prompts,
  ctxPct,
  effort,
  fainted,
  emotionKey,
  project,
  gitBranch,
  gitDirty,
}) {
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

  // Line 1: accent + icon + emotion + cost bar
  const icon = fainted ? '💤' : '⛳';
  let emotionDisplay;
  if (emotionKey) {
    emotionDisplay = `${EMOTION_COLORS[emotionKey] || G}${emotionKey}${RESET}`;
  } else {
    emotionDisplay = `${G}VIBING${RESET}`;
  }
  const line1 = ` ${accent}██${RESET} ${icon} ${emotionDisplay}  ${costStr}`;

  // Line 2: model + context bar (always shown)
  const line2 = ` ${accent}██${RESET} ${modelLabel}  ${ctxIcon} ${ctxBar} ${ctxPctVal}%`;

  // Line 3: rating + project path + git branch
  const projName = project || 'myproject';
  const branch = gitBranch || 'main';
  const dirtyIcon = gitDirty ? `${Y}●${RESET}` : `${G}✓${RESET}`;
  const line3 = ` ${accent}██${RESET} ${effEmoji} ${rc}${rating}${RESET}  ${DIM}📂${RESET} ${projName}  ${DIM}⎇${RESET} ${branch} ${dirtyIcon}`;

  return `${line3}\n${line1}\n${line2}`;
}

// Scenarios calibrated against current par rates:
// Sonnet: rate=1.5, floor=0.75  |  Opus: rate=8.0, floor=3.0  |  Haiku: rate=0.15, floor=0.10
// par = max(rate × sqrt(prompts), floor)
const SCENARIOS = [
  {
    title: 'Fresh session · Sonnet · 2 prompts · LEGENDARY',
    // par = 1.5*sqrt(2) = $2.12, cost $0.18 → 8% = LEGENDARY
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 0.18,
      prompts: 2,
      ctxPct: 8,
      emotionKey: 'VIBING',
      project: 'myapp',
      gitBranch: 'main',
      gitDirty: false,
    },
  },
  {
    title: 'Sonnet · 8 prompts · efficient · PRO',
    // par = 1.5*sqrt(8) = $4.24, cost $1.50 → 35% = PRO
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 1.5,
      prompts: 8,
      ctxPct: 34,
      emotionKey: 'GRINDING',
      project: 'api-server',
      gitBranch: 'feat/auth',
      gitDirty: true,
    },
  },
  {
    title: 'Sonnet·High · 5 prompts · LEGENDARY',
    // par = 1.5*sqrt(5) = $3.35, cost $0.41 → 12% = LEGENDARY
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 0.41,
      prompts: 5,
      ctxPct: 29,
      effort: 'high',
      emotionKey: 'VIBING',
      project: 'tokengolf',
      gitBranch: 'main',
      gitDirty: false,
    },
  },
  {
    title: 'Opus · 4 prompts · EPIC',
    // par = 8.0*sqrt(4) = $16.00, cost $3.80 → 24% = EPIC
    hud: {
      model: 'claude-opus-4-6',
      cost: 3.8,
      prompts: 4,
      ctxPct: 52,
      emotionKey: 'CRUISING',
      project: 'ml-pipeline',
      gitBranch: 'refactor/v2',
      gitDirty: false,
    },
  },
  {
    title: 'Haiku · 12 prompts · CLOSE CALL',
    // par = 0.15*sqrt(12) = $0.52, cost $0.45 → 87% = CLOSE CALL
    hud: {
      model: 'claude-haiku-4-5-20251001',
      cost: 0.45,
      prompts: 12,
      ctxPct: 78,
      emotionKey: 'SWEATING',
      project: 'docs-site',
      gitBranch: 'fix/typos',
      gitDirty: true,
    },
  },
  {
    title: 'Sonnet · 10 prompts · BUST',
    // par = 1.5*sqrt(10) = $4.74, cost $6.20 → 131% = BUST
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 6.2,
      prompts: 10,
      ctxPct: 45,
      emotionKey: 'ZOMBIE',
      project: 'monorepo',
      gitBranch: 'main',
      gitDirty: true,
    },
  },
  {
    title: 'Opus · 3 prompts · overencumbered context',
    // par = 8.0*sqrt(3) = $13.86, cost $5.50 → 40% = PRO
    hud: {
      model: 'claude-opus-4-6',
      cost: 5.5,
      prompts: 3,
      ctxPct: 91,
      emotionKey: 'FOCUSED',
      project: 'kernel',
      gitBranch: 'dev',
      gitDirty: false,
    },
  },
  {
    title: 'Fainted 💤 — usage limit hit, run resumes next session',
    // par = 1.5*sqrt(6) = $3.67, cost $0.92 → 25% = EPIC
    hud: {
      model: 'claude-sonnet-4-6',
      cost: 0.92,
      prompts: 6,
      ctxPct: 67,
      fainted: true,
      emotionKey: 'SLEEPING',
      project: 'webapp',
      gitBranch: 'feat/deploy',
      gitDirty: false,
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
