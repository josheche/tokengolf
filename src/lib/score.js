export const SPEND_TIER_DEFS = [
  { label: 'Mythic', emoji: '✨', key: 'mythic', color: 'magenta' },
  { label: 'Diamond', emoji: '💎', key: 'diamond', color: 'cyan' },
  { label: 'Gold', emoji: '🥇', key: 'gold', color: 'yellow' },
  { label: 'Silver', emoji: '🥈', key: 'silver', color: 'white' },
  { label: 'Bronze', emoji: '🥉', key: 'bronze', color: 'yellow' },
  { label: 'Reckless', emoji: '💸', key: 'reckless', color: 'red' },
];

// Legacy alias for backward compat
export const BUDGET_TIERS = SPEND_TIER_DEFS;

export const EFFORT_LEVELS = {
  low: { label: 'Low', emoji: '🪶', color: 'green' },
  medium: { label: 'Medium', emoji: '⚖️', color: 'white' },
  high: { label: 'High', emoji: '🔥', color: 'yellow' },
  max: { label: 'Max', emoji: '💥', color: 'magenta', opusOnly: true },
};

export function getEffortLevel(effort) {
  return EFFORT_LEVELS[effort] || null;
}

export const MODEL_BUDGET_TIERS = {
  haiku: { mythic: 0.03, diamond: 0.15, gold: 0.4, silver: 1.0, bronze: 2.5 },
  sonnet: { mythic: 0.1, diamond: 0.5, gold: 1.5, silver: 4.0, bronze: 10.0 },
  opusplan: { mythic: 0.3, diamond: 1.5, gold: 4.5, silver: 12.0, bronze: 30.0 },
  opus: { mythic: 0.5, diamond: 2.5, gold: 7.5, silver: 20.0, bronze: 50.0 },
};

export function getModelBudgets(model) {
  const m = (model || '').toLowerCase();
  if (m.includes('haiku')) return MODEL_BUDGET_TIERS.haiku;
  if (m.includes('opusplan')) return MODEL_BUDGET_TIERS.opusplan;
  if (m.includes('opus')) return MODEL_BUDGET_TIERS.opus;
  return MODEL_BUDGET_TIERS.sonnet;
}

export const MODEL_CLASSES = {
  haiku: {
    name: 'Haiku',
    label: 'Rogue',
    emoji: '🏹',
    difficulty: 'Nightmare',
    color: 'red',
  },
  sonnet: {
    name: 'Sonnet',
    label: 'Fighter',
    emoji: '⚔️',
    difficulty: 'Standard',
    color: 'cyan',
  },
  opusplan: {
    name: 'Paladin',
    label: 'Paladin',
    emoji: '⚜️',
    difficulty: 'Tactical',
    color: 'yellow',
  },
  opus: {
    name: 'Opus',
    label: 'Warlock',
    emoji: '🧙',
    difficulty: 'Casual',
    color: 'magenta',
  },
};

export const FLOORS = [
  'Write the code',
  'Write the tests',
  'Fix failing tests',
  'Code review pass',
  'PR merged — BOSS 🏆',
];

export function getTier(spent, model) {
  const budgets = model ? getModelBudgets(model) : MODEL_BUDGET_TIERS.sonnet;
  for (const def of SPEND_TIER_DEFS) {
    const max = budgets[def.key];
    if (max !== undefined && spent <= max) return def;
  }
  return SPEND_TIER_DEFS[SPEND_TIER_DEFS.length - 1]; // Reckless
}

export function getModelClass(model = '') {
  const m = model.toLowerCase();
  // Check opusplan before opus to avoid substring collision
  if (m.includes('opusplan')) return MODEL_CLASSES.opusplan;
  const key = Object.keys(MODEL_CLASSES).find((k) => m.includes(k));
  return MODEL_CLASSES[key] || MODEL_CLASSES.sonnet;
}

export function getEfficiencyRating(spent, budget) {
  const pct = spent / budget;
  if (pct <= 0.15) return { label: 'LEGENDARY', emoji: '🌟', color: 'yellow' };
  if (pct <= 0.3) return { label: 'EPIC', emoji: '🔥', color: 'magenta' };
  if (pct <= 0.5) return { label: 'PRO', emoji: '💪', color: 'cyan' };
  if (pct <= 0.75) return { label: 'SOLID', emoji: '✅', color: 'green' };
  if (pct <= 1.0) return { label: 'CLOSE CALL', emoji: '⚠️', color: 'white' };
  return { label: 'BUST', emoji: '💥', color: 'red' };
}

export function getBudgetPct(spent, budget) {
  return Math.min(Math.round((spent / budget) * 100), 999);
}

export function formatCost(amount = 0) {
  if (amount === 0) return '$0.00';
  if (amount < 0.01) return `$${amount.toFixed(5)}`;
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

// Returns opus's share of total spend as a 0–100 integer, or null (for Paladin runs)
export function getOpusPct(modelBreakdown, totalSpent) {
  if (!modelBreakdown || !totalSpent) return null;
  const opusCost = Object.entries(modelBreakdown)
    .filter(([m]) => m.toLowerCase().includes('opus'))
    .reduce((sum, [, c]) => sum + c, 0);
  if (opusCost === 0) return null;
  return Math.round((opusCost / totalSpent) * 100);
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
  const achievements = [];
  const won = run.status === 'won';
  // Use explicit budget or implicit Gold-tier budget for flow mode
  const effBudget = run.budget || getModelBudgets(run.model).gold;
  const pct = run.spent / effBudget;
  const mc = getModelClass(run.model);

  const isPaladin = mc === MODEL_CLASSES.opusplan;

  // Indecisive fires on death too (like Hubris)
  if ((run.modelSwitches ?? 0) >= 3)
    achievements.push({
      key: 'indecisive',
      label: `Indecisive — ${run.modelSwitches} model switches mid-session`,
      emoji: '🎲',
    });

  // Hubris fires on death too — ultrathink and still busted
  if (run.thinkingInvocations > 0 && run.status === 'died')
    achievements.push({
      key: 'hubris',
      label: 'Hubris — Used ultrathink, busted anyway',
      emoji: '🤦',
    });

  // Death marks
  if (!won) {
    if (run.budget && run.spent / run.budget >= 2.0)
      achievements.push({ key: 'blowout', label: 'Blowout — Spent 2× budget', emoji: '💥' });
    else if (run.budget && run.spent / run.budget > 1.0 && run.spent / run.budget <= 1.1)
      achievements.push({
        key: 'so_close',
        label: 'So Close — Died within 10% of budget',
        emoji: '😭',
      });
    if ((run.totalToolCalls || 0) >= 30)
      achievements.push({
        key: 'tool_happy',
        label: `Tool Happy — Died with ${run.totalToolCalls} tool calls`,
        emoji: '🔨',
      });
    if ((run.promptCount || 0) <= 2)
      achievements.push({
        key: 'silent_death',
        label: 'Silent Death — Died with ≤2 prompts',
        emoji: '🪦',
      });
    if ((run.failedToolCalls ?? 0) >= 5)
      achievements.push({
        key: 'fumble',
        label: `Fumble — Died with ${run.failedToolCalls} failed tool calls`,
        emoji: '🤡',
      });
    if (run.budget && run.spent / run.budget >= 0.5)
      if ((run.promptCount || 0) >= 3 && run.spent / (run.promptCount || 1) >= 0.5)
        achievements.push({
          key: 'expensive_taste',
          label: 'Expensive Taste — Over $0.50 per prompt',
          emoji: '🍷',
        });
    return achievements;
  }

  if (mc === MODEL_CLASSES.haiku) {
    achievements.push({
      key: 'gold_haiku',
      label: 'Gold — Completed with Haiku',
      emoji: '🥇',
    });
    if (run.spent < 0.1)
      achievements.push({
        key: 'diamond',
        label: 'Diamond — Haiku under $0.10',
        emoji: '💎',
      });
  } else if (mc === MODEL_CLASSES.sonnet) {
    achievements.push({
      key: 'silver_sonnet',
      label: 'Silver — Completed with Sonnet',
      emoji: '🥈',
    });
  } else if (mc === MODEL_CLASSES.opusplan) {
    achievements.push({
      key: 'paladin',
      label: 'Paladin — Completed a run as Paladin',
      emoji: '⚜️',
    });
    if (pct <= 0.25)
      achievements.push({
        key: 'grand_strategist',
        label: 'Grand Strategist — EPIC efficiency as Paladin',
        emoji: '♟️',
      });
  } else if (mc === MODEL_CLASSES.opus) {
    achievements.push({
      key: 'bronze_opus',
      label: 'Bronze — Completed with Opus',
      emoji: '🥉',
    });
  }

  if (pct <= 0.25)
    achievements.push({
      key: 'sniper',
      label: 'Sniper — Under 25% of budget',
      emoji: '🎯',
    });
  if (pct <= 0.5)
    achievements.push({
      key: 'efficient',
      label: 'Efficient — Under 50% of budget',
      emoji: '⚡',
    });
  if (run.spent < 0.1)
    achievements.push({
      key: 'penny',
      label: 'Penny Pincher — Under $0.10',
      emoji: '🪙',
    });

  // Effort-based achievements
  if (run.effort) {
    if (run.effort === 'low' && pct < 1.0)
      achievements.push({
        key: 'speedrunner',
        label: 'Speedrunner — Low effort, completed under budget',
        emoji: '🏎️',
      });
    if ((run.effort === 'high' || run.effort === 'max') && pct <= 0.25)
      achievements.push({
        key: 'tryhard',
        label: 'Tryhard — High effort, EPIC efficiency',
        emoji: '🏋️',
      });
    if (run.effort === 'max' && mc === MODEL_CLASSES.opus)
      achievements.push({
        key: 'archmagus',
        label: 'Archmagus — Opus at max effort, completed',
        emoji: '👑',
      });
  }

  // Fast mode achievements (Opus-only feature)
  if (run.fastMode && mc === MODEL_CLASSES.opus) {
    if (pct < 1.0)
      achievements.push({
        key: 'lightning',
        label: 'Lightning Run — Opus fast mode, completed under budget',
        emoji: '⛈️',
      });
    if (pct <= 0.25)
      achievements.push({
        key: 'daredevil',
        label: 'Daredevil — Opus fast mode, EPIC efficiency',
        emoji: '🎰',
      });
  }

  // Rest / multi-session achievements
  const sessions = run.sessionCount || 1;
  if (sessions >= 2)
    achievements.push({
      key: 'made_camp',
      label: `Made Camp — Completed across ${sessions} sessions`,
      emoji: '🏕️',
    });
  if (sessions === 1)
    achievements.push({
      key: 'no_rest',
      label: 'No Rest for the Wicked — Completed in one session',
      emoji: '🔥',
    });
  if (run.fainted)
    achievements.push({
      key: 'came_back',
      label: 'Came Back — Fainted and finished anyway',
      emoji: '🧟',
    });

  // Compaction achievements
  const compactionEvents = run.compactionEvents || [];
  const manualCompactions = compactionEvents.filter((e) => e.trigger === 'manual');
  const autoCompactions = compactionEvents.filter((e) => e.trigger === 'auto');

  if (autoCompactions.length > 0)
    achievements.push({
      key: 'overencumbered',
      label: 'Overencumbered — Context auto-compacted during run',
      emoji: '📦',
    });

  if (manualCompactions.length > 0) {
    const minPct = Math.min(...manualCompactions.map((e) => e.contextPct ?? 100));
    if (minPct <= 30)
      achievements.push({
        key: 'ghost_run',
        label: `Ghost Run — Manual compact at ${minPct}% context`,
        emoji: '🥷',
      });
    else if (minPct <= 40)
      achievements.push({
        key: 'ultralight',
        label: `Ultralight — Manual compact at ${minPct}% context`,
        emoji: '🪶',
      });
    else if (minPct <= 50)
      achievements.push({
        key: 'traveling_light',
        label: `Traveling Light — Manual compact at ${minPct}% context`,
        emoji: '🎒',
      });
  }

  // Ultrathink achievements
  const ti = run.thinkingInvocations;
  if (ti > 0) {
    achievements.push({
      key: 'spell_cast',
      label: `Spell Cast — Used extended thinking (${ti}×)`,
      emoji: '🔮',
    });
    if (pct <= 0.25)
      achievements.push({
        key: 'calculated_risk',
        label: 'Calculated Risk — Ultrathink + EPIC efficiency',
        emoji: '🧮',
      });
    if (ti >= 3)
      achievements.push({
        key: 'deep_thinker',
        label: `Deep Thinker — ${ti} ultrathink invocations, completed`,
        emoji: '🌀',
      });
  }
  // Silent Run: thinking was tracked (field exists), zero invocations, SOLID or better, completed
  if (run.thinkingInvocations === 0 && pct <= 0.75)
    achievements.push({
      key: 'silent_run',
      label: 'Silent Run — No extended thinking, completed under budget',
      emoji: '🤫',
    });

  // Paladin planning-ratio achievements
  if (mc === MODEL_CLASSES.opusplan) {
    const opusPct = getOpusPct(run.modelBreakdown, run.spent);
    if (opusPct !== null) {
      if (opusPct > 60)
        achievements.push({
          key: 'architect',
          label: `Architect — Opus handled ${opusPct}% of cost (heavy planner)`,
          emoji: '🏛️',
        });
      if (opusPct < 25)
        achievements.push({
          key: 'blitz',
          label: `Blitz — Opus handled only ${opusPct}% of cost (light plan, fast execution)`,
          emoji: '💨',
        });
      if (opusPct >= 40 && opusPct <= 60)
        achievements.push({
          key: 'equilibrium',
          label: `Equilibrium — Opus and Sonnet balanced at ${opusPct}% / ${100 - opusPct}%`,
          emoji: '⚖️',
        });
    }
  }

  // Model-switching achievements (skip for Paladin — multi-model is by design)
  const switches = run.modelSwitches ?? 0;
  const distinct = run.distinctModels ?? 0;
  if (!isPaladin) {
    if (distinct === 1)
      achievements.push({
        key: 'purist',
        label: 'Purist — Single model family throughout',
        emoji: '🔷',
      });
    if (distinct >= 2 && pct < 1.0)
      achievements.push({
        key: 'chameleon',
        label: `Chameleon — ${distinct} model families used, completed under budget`,
        emoji: '🦎',
      });
    if (switches === 1 && pct < 1.0)
      achievements.push({
        key: 'tactical_switch',
        label: 'Tactical Switch — Exactly 1 model switch, completed under budget',
        emoji: '🔀',
      });
    if (switches === 0 && distinct <= 1)
      achievements.push({
        key: 'committed',
        label: 'Committed — No model switches, one model family',
        emoji: '🔒',
      });

    // Class Defection: declared one class but leaned heavily on another
    if (run.modelBreakdown && run.spent > 0) {
      const declared = (run.model || '').toLowerCase();
      const isHaikuRun = declared.includes('haiku');
      const isSonnetRun = declared.includes('sonnet') && !declared.includes('opus');
      const opusPct2 = getOpusPct(run.modelBreakdown, run.spent) ?? 0;
      const haikuPct2 = getHaikuPct(run.modelBreakdown, run.spent) ?? 0;
      const nonHaikuPct = 100 - haikuPct2;
      if (isHaikuRun && nonHaikuPct > 50)
        achievements.push({
          key: 'class_defection',
          label: `Class Defection — Declared Haiku but ${nonHaikuPct}% cost on heavier models`,
          emoji: '⚠️',
        });
      else if (isSonnetRun && opusPct2 > 40)
        achievements.push({
          key: 'class_defection',
          label: `Class Defection — Declared Sonnet but ${opusPct2}% cost on Opus`,
          emoji: '⚠️',
        });
    }
  }

  // Multi-model achievements based on Haiku usage ratio
  const haikuPct = getHaikuPct(run.modelBreakdown, run.spent);
  if (haikuPct !== null) {
    if (haikuPct >= 50)
      achievements.push({
        key: 'frugal',
        label: `Frugal — Haiku handled ${haikuPct}% of session cost`,
        emoji: '🏹',
      });
    if (haikuPct >= 75)
      achievements.push({
        key: 'rogue_run',
        label: `Rogue Run — Haiku handled ${haikuPct}% of session cost`,
        emoji: '🎲',
      });
  }

  // Prompting skill achievements
  const promptCount = run.promptCount || 0;
  const totalToolCalls = run.totalToolCalls || 0;
  if (promptCount === 1)
    achievements.push({
      key: 'one_shot',
      label: 'One Shot — Completed in a single prompt',
      emoji: '🥊',
    });
  if (promptCount >= 20)
    achievements.push({
      key: 'conversationalist',
      label: `Conversationalist — ${promptCount} prompts`,
      emoji: '💬',
    });
  if (promptCount <= 3 && totalToolCalls >= 10)
    achievements.push({
      key: 'terse',
      label: `Terse — ${promptCount} prompts, ${totalToolCalls} tool calls`,
      emoji: '🤐',
    });
  if (promptCount >= 15 && totalToolCalls / promptCount < 1)
    achievements.push({
      key: 'backseat_driver',
      label: 'Backseat Driver — Many prompts, few tool calls',
      emoji: '🪑',
    });
  if (promptCount >= 2 && totalToolCalls / promptCount >= 5)
    achievements.push({
      key: 'high_leverage',
      label: `High Leverage — ${(totalToolCalls / promptCount).toFixed(1)}× tools per prompt`,
      emoji: '🏗️',
    });

  // Tool mastery achievements
  const toolCalls = run.toolCalls || {};
  const editCount = toolCalls['Edit'] || 0;
  const writeCount = toolCalls['Write'] || 0;
  const readCount = toolCalls['Read'] || 0;
  const bashCount = toolCalls['Bash'] || 0;
  const distinctTools = Object.keys(toolCalls).filter((k) => toolCalls[k] > 0).length;

  if (editCount === 0 && writeCount === 0 && readCount >= 1)
    achievements.push({ key: 'read_only', label: 'Read Only — No edits or writes', emoji: '👁️' });
  if (editCount >= 10)
    achievements.push({ key: 'editor', label: `Editor — ${editCount} Edit calls`, emoji: '✏️' });
  if (bashCount >= 10 && totalToolCalls >= 1 && bashCount / totalToolCalls >= 0.5)
    achievements.push({
      key: 'bash_warrior',
      label: `Bash Warrior — ${bashCount} Bash calls (${Math.round((bashCount / totalToolCalls) * 100)}% of tools)`,
      emoji: '🐚',
    });
  if (totalToolCalls >= 5 && readCount / totalToolCalls >= 0.6)
    achievements.push({
      key: 'scout',
      label: `Scout — ${Math.round((readCount / totalToolCalls) * 100)}% Read calls`,
      emoji: '🔍',
    });
  if (editCount >= 1 && editCount <= 3 && pct < 1.0)
    achievements.push({
      key: 'surgeon',
      label: `Surgeon — Only ${editCount} Edit call${editCount > 1 ? 's' : ''}, under budget`,
      emoji: '🔪',
    });
  if (distinctTools >= 5)
    achievements.push({
      key: 'toolbox',
      label: `Toolbox — ${distinctTools} distinct tools used`,
      emoji: '🧰',
    });

  // Cost per prompt
  if (promptCount >= 3) {
    const costPerPrompt = run.spent / promptCount;
    if (costPerPrompt < 0.01)
      achievements.push({
        key: 'cheap_shots',
        label: `Cheap Shots — $${costPerPrompt.toFixed(4)} per prompt`,
        emoji: '💲',
      });
    if (costPerPrompt >= 0.5)
      achievements.push({
        key: 'expensive_taste',
        label: `Expensive Taste — $${costPerPrompt.toFixed(2)} per prompt`,
        emoji: '🍷',
      });
  }

  // Time-based achievements
  if (run.startedAt && run.endedAt) {
    const elapsedMs = new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime();
    const elapsedMin = elapsedMs / 60000;
    if (elapsedMin < 5)
      achievements.push({
        key: 'speedrun',
        label: `Speedrun — Completed in ${Math.round(elapsedMin * 60)}s`,
        emoji: '⏱️',
      });
    if (elapsedMin > 60 && elapsedMin <= 180)
      achievements.push({
        key: 'marathon',
        label: `Marathon — ${Math.round(elapsedMin)}m session`,
        emoji: '🏃',
      });
    if (elapsedMin > 180)
      achievements.push({
        key: 'endurance',
        label: `Endurance — ${Math.round(elapsedMin / 60)}h session`,
        emoji: '🫠',
      });
  }

  // Phase 2: new hook fields (default 0 if not present)
  const failedToolCalls = run.failedToolCalls ?? 0;
  const subagentSpawns = run.subagentSpawns ?? 0;
  const turnCount = run.turnCount ?? 0;

  // Failed tool call achievements
  if (failedToolCalls === 0 && totalToolCalls >= 5)
    achievements.push({ key: 'clean_run', label: 'Clean Run — No tool failures', emoji: '✅' });
  if (failedToolCalls >= 10)
    achievements.push({
      key: 'stubborn',
      label: `Stubborn — ${failedToolCalls} failed tool calls, still won`,
      emoji: '🐂',
    });

  // Subagent achievements
  if (subagentSpawns === 0)
    achievements.push({ key: 'lone_wolf', label: 'Lone Wolf — No subagents spawned', emoji: '🐺' });
  if (subagentSpawns >= 5)
    achievements.push({
      key: 'summoner',
      label: `Summoner — ${subagentSpawns} subagents spawned`,
      emoji: '📡',
    });
  if (subagentSpawns >= 10 && pct < 0.5)
    achievements.push({
      key: 'army',
      label: `Army of One — ${subagentSpawns} subagents, EFFICIENT cost`,
      emoji: '🪖',
    });

  // Turn count achievements
  if (promptCount >= 2 && turnCount >= 1 && turnCount / promptCount >= 3)
    achievements.push({
      key: 'agentic',
      label: `Agentic — ${(turnCount / promptCount).toFixed(1)} turns per prompt`,
      emoji: '🤖',
    });
  if (promptCount >= 3 && turnCount === promptCount)
    achievements.push({ key: 'obedient', label: 'Obedient — One turn per prompt', emoji: '🐕' });

  return achievements;
}
