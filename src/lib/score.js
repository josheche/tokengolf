export const BUDGET_TIERS = [
  { label: 'Diamond', emoji: '💎', max: 0.10, color: 'cyan' },
  { label: 'Gold',    emoji: '🥇', max: 0.30, color: 'yellow' },
  { label: 'Silver',  emoji: '🥈', max: 1.00, color: 'white' },
  { label: 'Bronze',  emoji: '🥉', max: 3.00, color: 'yellow' },
  { label: 'Reckless',emoji: '💸', max: Infinity, color: 'red' },
];

export const EFFORT_LEVELS = {
  low:    { label: 'Low',    emoji: '🪶', color: 'green'   },
  medium: { label: 'Medium', emoji: '⚖️',  color: 'white'   },
  high:   { label: 'High',   emoji: '🔥', color: 'yellow'  },
  max:    { label: 'Max',    emoji: '💥', color: 'magenta', opusOnly: true },
};

export function getEffortLevel(effort) {
  return EFFORT_LEVELS[effort] || null;
}

export const MODEL_CLASSES = {
  haiku:  { name: 'Haiku',  label: 'Rogue',   emoji: '🏹', difficulty: 'Hard',   color: 'red' },
  sonnet: { name: 'Sonnet', label: 'Fighter', emoji: '⚔️',  difficulty: 'Normal', color: 'cyan' },
  opus:   { name: 'Opus',   label: 'Warlock', emoji: '🧙', difficulty: 'Easy',   color: 'magenta' },
};

export const FLOORS = [
  'Write the code',
  'Write the tests',
  'Fix failing tests',
  'Code review pass',
  'PR merged — BOSS 🏆',
];

export function getTier(spent) {
  return BUDGET_TIERS.find(t => spent <= t.max) || BUDGET_TIERS[BUDGET_TIERS.length - 1];
}

export function getModelClass(model = '') {
  const key = Object.keys(MODEL_CLASSES).find(k => model.toLowerCase().includes(k));
  return MODEL_CLASSES[key] || MODEL_CLASSES.sonnet;
}

export function getEfficiencyRating(spent, budget) {
  const pct = spent / budget;
  if (pct <= 0.25) return { label: 'LEGENDARY',   emoji: '🌟', color: 'magenta' };
  if (pct <= 0.50) return { label: 'EFFICIENT',   emoji: '⚡', color: 'cyan' };
  if (pct <= 0.75) return { label: 'SOLID',        emoji: '✓',  color: 'green' };
  if (pct <= 1.00) return { label: 'CLOSE CALL',  emoji: '😅', color: 'yellow' };
  return               { label: 'BUSTED',       emoji: '💀', color: 'red' };
}

export function getBudgetPct(spent, budget) {
  return Math.min(Math.round((spent / budget) * 100), 999);
}

export function formatCost(amount = 0) {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${(amount * 100).toFixed(3)}¢`;
  return `$${amount.toFixed(4)}`;
}

export function formatElapsed(startedAt) {
  if (!startedAt) return '—';
  const ms = Date.now() - new Date(startedAt).getTime();
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const h = Math.floor(m / 60);
  if (h > 0) return `${h}h ${m % 60}m`;
  if (m > 0) return `${m}m ${s % 60}s`;
  return `${s}s`;
}

// Returns haiku's share of total spend as a 0–100 integer, or null
export function getHaikuPct(modelBreakdown, totalSpent) {
  if (!modelBreakdown || !totalSpent) return null;
  const haikuCost = Object.entries(modelBreakdown)
    .filter(([m]) => m.toLowerCase().includes('haiku'))
    .reduce((sum, [, c]) => sum + c, 0);
  if (haikuCost === 0) return null;
  return Math.round((haikuCost / totalSpent) * 100);
}

export function calculateAchievements(run) {
  if (run.status !== 'won') return [];
  const achievements = [];
  const pct = run.budget ? run.spent / run.budget : null;
  const mc = getModelClass(run.model);

  if (mc === MODEL_CLASSES.haiku) {
    achievements.push({ key: 'gold_haiku', label: 'Gold — Completed with Haiku', emoji: '🥇' });
    if (run.spent < 0.10)
      achievements.push({ key: 'diamond', label: 'Diamond — Haiku under $0.10', emoji: '💎' });
  } else if (mc === MODEL_CLASSES.sonnet) {
    achievements.push({ key: 'silver_sonnet', label: 'Silver — Completed with Sonnet', emoji: '🥈' });
  } else if (mc === MODEL_CLASSES.opus) {
    achievements.push({ key: 'bronze_opus', label: 'Bronze — Completed with Opus', emoji: '🥉' });
  }

  if (pct !== null) {
    if (pct <= 0.25) achievements.push({ key: 'sniper',    label: 'Sniper — Under 25% of budget',    emoji: '🎯' });
    if (pct <= 0.50) achievements.push({ key: 'efficient', label: 'Efficient — Under 50% of budget', emoji: '⚡' });
  }
  if (run.spent < 0.10) achievements.push({ key: 'penny', label: 'Penny Pincher — Under $0.10', emoji: '🪙' });

  // Effort-based achievements
  if (run.effort) {
    if (run.effort === 'low' && pct !== null && pct < 1.0)
      achievements.push({ key: 'speedrunner', label: 'Speedrunner — Low effort, completed under budget', emoji: '🎯' });
    if ((run.effort === 'high' || run.effort === 'max') && pct !== null && pct <= 0.25)
      achievements.push({ key: 'tryhard', label: 'Tryhard — High effort, LEGENDARY efficiency', emoji: '💪' });
    if (run.effort === 'max' && mc === MODEL_CLASSES.opus)
      achievements.push({ key: 'archmagus', label: 'Archmagus — Opus at max effort, completed', emoji: '👑' });
  }

  // Fast mode achievements
  if (run.fastMode) {
    if (pct !== null && pct < 1.0)
      achievements.push({ key: 'lightning', label: 'Lightning Run — Opus fast mode, completed under budget', emoji: '⚡' });
    if (pct !== null && pct <= 0.25)
      achievements.push({ key: 'daredevil', label: 'Daredevil — Opus fast mode, LEGENDARY efficiency', emoji: '🎰' });
  }

  // Rest / multi-session achievements
  const sessions = run.sessionCount || 1;
  if (sessions >= 2)
    achievements.push({ key: 'made_camp', label: `Made Camp — Completed across ${sessions} sessions`, emoji: '🏕️' });
  if (sessions === 1)
    achievements.push({ key: 'no_rest', label: 'No Rest for the Wicked — Completed in one session', emoji: '⚡' });
  if (run.fainted)
    achievements.push({ key: 'came_back', label: 'Came Back — Fainted and finished anyway', emoji: '💪' });

  // Compaction achievements
  const compactionEvents = run.compactionEvents || [];
  const manualCompactions = compactionEvents.filter(e => e.trigger === 'manual');
  const autoCompactions   = compactionEvents.filter(e => e.trigger === 'auto');

  if (autoCompactions.length > 0)
    achievements.push({ key: 'overencumbered', label: 'Overencumbered — Context auto-compacted during run', emoji: '📦' });

  if (manualCompactions.length > 0) {
    const minPct = Math.min(...manualCompactions.map(e => e.contextPct ?? 100));
    if (minPct <= 30)
      achievements.push({ key: 'ghost_run',      label: `Ghost Run — Manual compact at ${minPct}% context`,      emoji: '🥷' });
    else if (minPct <= 40)
      achievements.push({ key: 'ultralight',     label: `Ultralight — Manual compact at ${minPct}% context`,     emoji: '🪶' });
    else if (minPct <= 50)
      achievements.push({ key: 'traveling_light', label: `Traveling Light — Manual compact at ${minPct}% context`, emoji: '🎒' });
  }

  // Multi-model achievements based on Haiku usage ratio
  const haikuPct = getHaikuPct(run.modelBreakdown, run.spent);
  if (haikuPct !== null) {
    if (haikuPct >= 50) achievements.push({ key: 'frugal',    label: `Frugal — Haiku handled ${haikuPct}% of session cost`, emoji: '🏹' });
    if (haikuPct >= 75) achievements.push({ key: 'rogue_run', label: `Rogue Run — Haiku handled ${haikuPct}% of session cost`, emoji: '🎲' });
  }

  return achievements;
}
