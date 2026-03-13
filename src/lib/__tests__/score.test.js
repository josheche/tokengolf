import { describe, it, expect } from 'vitest';
import {
  calculateAchievements,
  getTier,
  getEfficiencyRating,
  getModelClass,
  MODEL_CLASSES,
} from '../score.js';

// ── helpers ──────────────────────────────────────────────────────────────────

function keys(run) {
  return calculateAchievements(run).map((a) => a.key);
}

function wonRun(overrides = {}) {
  return {
    status: 'won',
    spent: 0.1,
    budget: 0.5,
    model: 'claude-sonnet-4-6',
    promptCount: 5,
    totalToolCalls: 10,
    toolCalls: { Read: 5, Edit: 3, Bash: 2 },
    compactionEvents: [],
    thinkingInvocations: 0,
    sessionCount: 1,
    fainted: false,
    startedAt: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
    endedAt: new Date().toISOString(),
    ...overrides,
  };
}

function diedRun(overrides = {}) {
  return {
    status: 'died',
    spent: 0.55,
    budget: 0.5,
    model: 'claude-sonnet-4-6',
    promptCount: 5,
    totalToolCalls: 10,
    toolCalls: {},
    compactionEvents: [],
    thinkingInvocations: 0,
    ...overrides,
  };
}

// ── pure functions ────────────────────────────────────────────────────────────

describe('getTier (model-calibrated)', () => {
  // Sonnet defaults (no model = sonnet)
  it('Mythic under Sonnet $0.10', () => expect(getTier(0.05).label).toBe('Mythic'));
  it('Diamond under Sonnet $0.50', () => expect(getTier(0.3).label).toBe('Diamond'));
  it('Gold under Sonnet $1.50', () => expect(getTier(1.0).label).toBe('Gold'));
  it('Silver under Sonnet $4.00', () => expect(getTier(3.0).label).toBe('Silver'));
  it('Bronze under Sonnet $10.00', () => expect(getTier(8.0).label).toBe('Bronze'));
  it('Reckless above Sonnet $10.00', () => expect(getTier(15.0).label).toBe('Reckless'));
  // Haiku calibration
  it('Mythic under Haiku $0.03', () =>
    expect(getTier(0.02, 'claude-haiku-4-5').label).toBe('Mythic'));
  it('Diamond under Haiku $0.15', () =>
    expect(getTier(0.1, 'claude-haiku-4-5').label).toBe('Diamond'));
  it('Reckless above Haiku $2.50', () =>
    expect(getTier(3.0, 'claude-haiku-4-5').label).toBe('Reckless'));
  // Opus calibration
  it('Diamond under Opus $2.50', () =>
    expect(getTier(2.0, 'claude-opus-4-6').label).toBe('Diamond'));
  it('Gold under Opus $7.50', () => expect(getTier(5.0, 'claude-opus-4-6').label).toBe('Gold'));
  it('Reckless above Opus $50.00', () =>
    expect(getTier(60.0, 'claude-opus-4-6').label).toBe('Reckless'));
});

describe('getEfficiencyRating', () => {
  it('LEGENDARY at 14%', () => expect(getEfficiencyRating(0.14, 1.0).label).toBe('LEGENDARY'));
  it('LEGENDARY at 15% boundary', () =>
    expect(getEfficiencyRating(0.15, 1.0).label).toBe('LEGENDARY'));
  it('EPIC at 16%', () => expect(getEfficiencyRating(0.16, 1.0).label).toBe('EPIC'));
  it('EPIC at 30% boundary', () => expect(getEfficiencyRating(0.3, 1.0).label).toBe('EPIC'));
  it('PRO at 31%', () => expect(getEfficiencyRating(0.31, 1.0).label).toBe('PRO'));
  it('PRO at 49%', () => expect(getEfficiencyRating(0.49, 1.0).label).toBe('PRO'));
  it('SOLID at 74%', () => expect(getEfficiencyRating(0.74, 1.0).label).toBe('SOLID'));
  it('CLOSE CALL at 99%', () => expect(getEfficiencyRating(0.99, 1.0).label).toBe('CLOSE CALL'));
  it('BUST over 100%', () => expect(getEfficiencyRating(1.01, 1.0).label).toBe('BUST'));
});

describe('getModelClass', () => {
  it('haiku', () => expect(getModelClass('claude-haiku-4-5')).toBe(MODEL_CLASSES.haiku));
  it('sonnet', () => expect(getModelClass('claude-sonnet-4-6')).toBe(MODEL_CLASSES.sonnet));
  it('opus', () => expect(getModelClass('claude-opus-4-6')).toBe(MODEL_CLASSES.opus));
  it('unknown defaults to sonnet', () =>
    expect(getModelClass('unknown-model')).toBe(MODEL_CLASSES.sonnet));
});

// ── model class achievements ──────────────────────────────────────────────────

describe('model class achievements', () => {
  it('haiku win → gold_haiku', () => {
    expect(keys(wonRun({ model: 'claude-haiku-4-5-20251001' }))).toContain('gold_haiku');
  });
  it('haiku win under $0.10 → diamond', () => {
    expect(keys(wonRun({ model: 'claude-haiku-4-5-20251001', spent: 0.08 }))).toContain('diamond');
  });
  it('haiku win at $0.12 → no diamond', () => {
    expect(keys(wonRun({ model: 'claude-haiku-4-5-20251001', spent: 0.12 }))).not.toContain(
      'diamond'
    );
  });
  it('sonnet win → silver_sonnet', () => {
    expect(keys(wonRun())).toContain('silver_sonnet');
  });
  it('opus win → bronze_opus', () => {
    expect(keys(wonRun({ model: 'claude-opus-4-6' }))).toContain('bronze_opus');
  });
});

// ── budget efficiency achievements ───────────────────────────────────────────

describe('budget efficiency', () => {
  it('sniper at 20% budget', () => {
    expect(keys(wonRun({ spent: 0.1, budget: 0.5 }))).toContain('sniper');
  });
  it('efficient at 40% budget', () => {
    expect(keys(wonRun({ spent: 0.2, budget: 0.5 }))).toContain('efficient');
  });
  it('no sniper at 30% budget', () => {
    expect(keys(wonRun({ spent: 0.15, budget: 0.5 }))).not.toContain('sniper');
  });
  it('penny pincher under $0.10', () => {
    expect(keys(wonRun({ spent: 0.08 }))).toContain('penny');
  });
  it('no penny at $0.12', () => {
    expect(keys(wonRun({ spent: 0.12 }))).not.toContain('penny');
  });
  it('sniper/efficient in flow mode uses implicit Gold-tier budget', () => {
    // Sonnet Gold = $1.50, $0.05 = 3.3% → sniper + efficient
    const a = keys(wonRun({ budget: null, spent: 0.05, model: 'claude-sonnet-4-6' }));
    expect(a).toContain('sniper');
    expect(a).toContain('efficient');
  });
  it('no sniper in flow mode at high spend', () => {
    // Sonnet Gold = $1.50, $1.00 = 67% → no sniper, no efficient
    const a = keys(wonRun({ budget: null, spent: 1.0, model: 'claude-sonnet-4-6' }));
    expect(a).not.toContain('sniper');
    expect(a).not.toContain('efficient');
  });
});

// ── prompting skill ───────────────────────────────────────────────────────────

describe('prompting skill achievements', () => {
  it('one_shot on single prompt', () => {
    expect(keys(wonRun({ promptCount: 1 }))).toContain('one_shot');
  });
  it('no one_shot on 2 prompts', () => {
    expect(keys(wonRun({ promptCount: 2 }))).not.toContain('one_shot');
  });
  it('conversationalist at 20+ prompts', () => {
    expect(keys(wonRun({ promptCount: 20 }))).toContain('conversationalist');
  });
  it('terse: ≤3 prompts and ≥10 tool calls', () => {
    expect(keys(wonRun({ promptCount: 2, totalToolCalls: 12 }))).toContain('terse');
  });
  it('no terse if tool calls < 10', () => {
    expect(keys(wonRun({ promptCount: 2, totalToolCalls: 8 }))).not.toContain('terse');
  });
  it('high_leverage: 5+ tools per prompt', () => {
    expect(keys(wonRun({ promptCount: 2, totalToolCalls: 10 }))).toContain('high_leverage');
  });
  it('backseat_driver: 15+ prompts, <1 tool per prompt', () => {
    expect(keys(wonRun({ promptCount: 15, totalToolCalls: 10 }))).toContain('backseat_driver');
  });
});

// ── tool mastery ──────────────────────────────────────────────────────────────

describe('tool mastery achievements', () => {
  it('read_only: reads but no edits/writes', () => {
    expect(keys(wonRun({ toolCalls: { Read: 5 }, totalToolCalls: 5 }))).toContain('read_only');
  });
  it('no read_only if Edit present', () => {
    expect(keys(wonRun({ toolCalls: { Read: 5, Edit: 1 }, totalToolCalls: 6 }))).not.toContain(
      'read_only'
    );
  });
  it('editor: 10+ Edit calls', () => {
    expect(keys(wonRun({ toolCalls: { Edit: 10 }, totalToolCalls: 10 }))).toContain('editor');
  });
  it('bash_warrior: 10+ Bash, ≥50% of tools', () => {
    expect(keys(wonRun({ toolCalls: { Bash: 10, Read: 5 }, totalToolCalls: 15 }))).toContain(
      'bash_warrior'
    ); // 67%
    expect(keys(wonRun({ toolCalls: { Bash: 10, Read: 9 }, totalToolCalls: 19 }))).toContain(
      'bash_warrior'
    ); // 53%
    expect(keys(wonRun({ toolCalls: { Bash: 10 }, totalToolCalls: 10 }))).toContain('bash_warrior'); // 100%
    expect(keys(wonRun({ toolCalls: { Bash: 5, Read: 6 }, totalToolCalls: 11 }))).not.toContain(
      'bash_warrior'
    ); // <10 Bash
  });
  it('scout: ≥60% Read, ≥5 total', () => {
    expect(keys(wonRun({ toolCalls: { Read: 7, Edit: 3 }, totalToolCalls: 10 }))).toContain(
      'scout'
    );
  });
  it('no scout if <60% Read', () => {
    expect(keys(wonRun({ toolCalls: { Read: 5, Edit: 5 }, totalToolCalls: 10 }))).not.toContain(
      'scout'
    );
  });
  it('surgeon: 1-3 Edits, under budget', () => {
    expect(
      keys(wonRun({ toolCalls: { Read: 5, Edit: 2 }, totalToolCalls: 7, spent: 0.1, budget: 0.5 }))
    ).toContain('surgeon');
  });
  it('no surgeon if over budget', () => {
    expect(
      keys(wonRun({ toolCalls: { Edit: 2 }, totalToolCalls: 2, spent: 0.6, budget: 0.5 }))
    ).not.toContain('surgeon');
  });
  it('toolbox: 5+ distinct tools', () => {
    expect(
      keys(
        wonRun({ toolCalls: { Read: 1, Edit: 1, Bash: 1, Glob: 1, Grep: 1 }, totalToolCalls: 5 })
      )
    ).toContain('toolbox');
  });
});

// ── cost per prompt ───────────────────────────────────────────────────────────

describe('cost per prompt', () => {
  it('cheap_shots: <$0.01 per prompt, ≥3 prompts', () => {
    expect(keys(wonRun({ spent: 0.02, promptCount: 3 }))).toContain('cheap_shots');
  });
  it('expensive_taste on won run: ≥$0.50 per prompt, ≥3 prompts', () => {
    expect(keys(wonRun({ spent: 1.6, promptCount: 3, budget: 2.0 }))).toContain('expensive_taste');
  });
});

// ── time-based ────────────────────────────────────────────────────────────────

describe('time-based achievements', () => {
  it('speedrun under 5 minutes', () => {
    const start = new Date(Date.now() - 3 * 60 * 1000).toISOString();
    expect(keys(wonRun({ startedAt: start, endedAt: new Date().toISOString() }))).toContain(
      'speedrun'
    );
  });
  it('no speedrun at 10 minutes', () => {
    const start = new Date(Date.now() - 10 * 60 * 1000).toISOString();
    expect(keys(wonRun({ startedAt: start, endedAt: new Date().toISOString() }))).not.toContain(
      'speedrun'
    );
  });
  it('marathon over 60 minutes', () => {
    const start = new Date(Date.now() - 90 * 60 * 1000).toISOString();
    expect(keys(wonRun({ startedAt: start, endedAt: new Date().toISOString() }))).toContain(
      'marathon'
    );
  });
  it('endurance over 3 hours', () => {
    const start = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    expect(keys(wonRun({ startedAt: start, endedAt: new Date().toISOString() }))).toContain(
      'endurance'
    );
  });
  it('endurance but not marathon at 4 hours', () => {
    const start = new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString();
    const a = keys(wonRun({ startedAt: start, endedAt: new Date().toISOString() }));
    expect(a).toContain('endurance');
    expect(a).not.toContain('marathon');
  });
});

// ── death marks ───────────────────────────────────────────────────────────────

describe('death marks', () => {
  it('blowout at 2× budget', () => {
    expect(keys(diedRun({ spent: 1.0, budget: 0.5 }))).toContain('blowout');
  });
  it('no blowout at 1.5×', () => {
    expect(keys(diedRun({ spent: 0.75, budget: 0.5 }))).not.toContain('blowout');
  });
  it('so_close between 100-110% budget', () => {
    expect(keys(diedRun({ spent: 0.52, budget: 0.5 }))).toContain('so_close');
  });
  it('no so_close at 115%', () => {
    expect(keys(diedRun({ spent: 0.575, budget: 0.5 }))).not.toContain('so_close');
  });
  it('tool_happy at 30+ tool calls', () => {
    expect(keys(diedRun({ totalToolCalls: 30 }))).toContain('tool_happy');
  });
  it('no tool_happy at 29', () => {
    expect(keys(diedRun({ totalToolCalls: 29 }))).not.toContain('tool_happy');
  });
  it('silent_death at ≤2 prompts', () => {
    expect(keys(diedRun({ promptCount: 2 }))).toContain('silent_death');
  });
  it('no silent_death at 3 prompts', () => {
    expect(keys(diedRun({ promptCount: 3 }))).not.toContain('silent_death');
  });
  it('fumble at 5+ failed tool calls on death', () => {
    expect(keys(diedRun({ failedToolCalls: 5 }))).toContain('fumble');
  });
});

// ── death marks don't fire on won runs ───────────────────────────────────────

describe("death marks don't fire on won runs", () => {
  it('no blowout on won', () => {
    expect(keys(wonRun({ spent: 2.0, budget: 0.5 }))).not.toContain('blowout');
  });
  it('no tool_happy on won', () => {
    expect(keys(wonRun({ totalToolCalls: 35 }))).not.toContain('tool_happy');
  });
  it('no silent_death on won', () => {
    expect(keys(wonRun({ promptCount: 1 }))).not.toContain('silent_death');
  });
});

// ── hubris / ultrathink ───────────────────────────────────────────────────────

describe('hubris + ultrathink', () => {
  it('hubris fires on death with thinking', () => {
    expect(keys(diedRun({ thinkingInvocations: 2 }))).toContain('hubris');
  });
  it('no hubris on won with thinking', () => {
    expect(keys(wonRun({ thinkingInvocations: 2 }))).not.toContain('hubris');
  });
  it('spell_cast on won with thinking', () => {
    expect(keys(wonRun({ thinkingInvocations: 1 }))).toContain('spell_cast');
  });
  it('deep_thinker at 3+ invocations', () => {
    expect(keys(wonRun({ thinkingInvocations: 3 }))).toContain('deep_thinker');
  });
  it('silent_run on won with 0 thinking and SOLID budget', () => {
    expect(keys(wonRun({ thinkingInvocations: 0, spent: 0.3, budget: 0.5 }))).toContain(
      'silent_run'
    );
  });
  it('no silent_run when thinking undefined', () => {
    const run = wonRun();
    delete run.thinkingInvocations;
    expect(keys(run)).not.toContain('silent_run');
  });
});

// ── phase 2: new hook fields ──────────────────────────────────────────────────

describe('failed tool call achievements', () => {
  it('clean_run: 0 failures, ≥5 tool calls', () => {
    expect(keys(wonRun({ failedToolCalls: 0, totalToolCalls: 10 }))).toContain('clean_run');
  });
  it('no clean_run if <5 tool calls', () => {
    expect(keys(wonRun({ failedToolCalls: 0, totalToolCalls: 4 }))).not.toContain('clean_run');
  });
  it('no clean_run if failedToolCalls undefined but totalToolCalls ok', () => {
    // undefined ?? 0 = 0 → should still fire
    const run = wonRun({ totalToolCalls: 10 });
    delete run.failedToolCalls;
    expect(keys(run)).toContain('clean_run');
  });
  it('stubborn: 10+ failures, still won', () => {
    expect(keys(wonRun({ failedToolCalls: 10 }))).toContain('stubborn');
  });
});

describe('subagent achievements', () => {
  it('lone_wolf: 0 subagents', () => {
    expect(keys(wonRun({ subagentSpawns: 0 }))).toContain('lone_wolf');
  });
  it('no lone_wolf if subagents undefined (defaults to 0)', () => {
    const run = wonRun();
    delete run.subagentSpawns;
    expect(keys(run)).toContain('lone_wolf');
  });
  it('summoner: 5+ subagents', () => {
    expect(keys(wonRun({ subagentSpawns: 5 }))).toContain('summoner');
  });
  it('army: 10+ subagents, <50% budget', () => {
    expect(keys(wonRun({ subagentSpawns: 10, spent: 0.1, budget: 0.5 }))).toContain('army');
  });
  it('no army if ≥50% budget', () => {
    expect(keys(wonRun({ subagentSpawns: 10, spent: 0.3, budget: 0.5 }))).not.toContain('army');
  });
});

describe('turn count achievements', () => {
  it('agentic: 3+ turns per prompt', () => {
    expect(keys(wonRun({ turnCount: 15, promptCount: 5 }))).toContain('agentic');
  });
  it('no agentic below 3× ratio', () => {
    expect(keys(wonRun({ turnCount: 10, promptCount: 5 }))).not.toContain('agentic');
  });
  it('obedient: turnCount === promptCount, ≥3 prompts', () => {
    expect(keys(wonRun({ turnCount: 5, promptCount: 5 }))).toContain('obedient');
  });
  it('no obedient if mismatch', () => {
    expect(keys(wonRun({ turnCount: 6, promptCount: 5 }))).not.toContain('obedient');
  });
  it('no obedient if <3 prompts', () => {
    expect(keys(wonRun({ turnCount: 2, promptCount: 2 }))).not.toContain('obedient');
  });
});

// ── session / rest achievements ───────────────────────────────────────────────

describe('session achievements', () => {
  it('no_rest on single session', () => {
    expect(keys(wonRun({ sessionCount: 1 }))).toContain('no_rest');
  });
  it('made_camp on 2+ sessions', () => {
    expect(keys(wonRun({ sessionCount: 2 }))).toContain('made_camp');
  });
  it('came_back if fainted', () => {
    expect(keys(wonRun({ fainted: true, sessionCount: 2 }))).toContain('came_back');
  });
});

// ── getModelClass opusplan ────────────────────────────────────────────────────

describe('getModelClass opusplan', () => {
  it('opusplan string → MODEL_CLASSES.opusplan', () => {
    expect(getModelClass('opusplan')).toBe(MODEL_CLASSES.opusplan);
  });
});

// ── Paladin achievements ──────────────────────────────────────────────────────

describe('Paladin achievements', () => {
  it('paladin: opusplan win', () => {
    expect(keys(wonRun({ model: 'opusplan' }))).toContain('paladin');
  });
  it('grand_strategist: opusplan win at ≤25% budget', () => {
    expect(keys(wonRun({ model: 'opusplan', spent: 0.1, budget: 0.5 }))).toContain(
      'grand_strategist'
    );
  });
  it('no grand_strategist at 30% budget', () => {
    expect(keys(wonRun({ model: 'opusplan', spent: 0.15, budget: 0.5 }))).not.toContain(
      'grand_strategist'
    );
  });
  it('architect: opus pct > 60%', () => {
    const mb = { 'claude-opus-4-6': 0.07, 'claude-sonnet-4-6': 0.03 };
    expect(keys(wonRun({ model: 'opusplan', spent: 0.1, modelBreakdown: mb }))).toContain(
      'architect'
    );
  });
  it('blitz: opus pct < 25%', () => {
    const mb = { 'claude-opus-4-6': 0.02, 'claude-sonnet-4-6': 0.08 };
    expect(keys(wonRun({ model: 'opusplan', spent: 0.1, modelBreakdown: mb }))).toContain('blitz');
  });
  it('equilibrium: opus pct 40–60%', () => {
    const mb = { 'claude-opus-4-6': 0.05, 'claude-sonnet-4-6': 0.05 };
    expect(keys(wonRun({ model: 'opusplan', spent: 0.1, modelBreakdown: mb }))).toContain(
      'equilibrium'
    );
  });
  it('Paladin does not fire purist/committed/chameleon', () => {
    const a = keys(wonRun({ model: 'opusplan', spent: 0.1, budget: 0.5 }));
    expect(a).not.toContain('purist');
    expect(a).not.toContain('committed');
    expect(a).not.toContain('chameleon');
  });
});

// ── effort-based achievements ─────────────────────────────────────────────────

describe('effort-based achievements', () => {
  it('speedrunner: low effort, completed under budget', () => {
    expect(keys(wonRun({ effort: 'low', spent: 0.1, budget: 0.5 }))).toContain('speedrunner');
  });
  it('no speedrunner if over budget', () => {
    expect(keys(wonRun({ effort: 'low', spent: 0.6, budget: 0.5 }))).not.toContain('speedrunner');
  });
  it('tryhard: high effort, ≤25% budget', () => {
    expect(keys(wonRun({ effort: 'high', spent: 0.1, budget: 0.5 }))).toContain('tryhard');
  });
  it('no tryhard at 30%', () => {
    expect(keys(wonRun({ effort: 'high', spent: 0.15, budget: 0.5 }))).not.toContain('tryhard');
  });
  it('archmagus: max effort, opus model', () => {
    expect(keys(wonRun({ effort: 'max', model: 'claude-opus-4-6' }))).toContain('archmagus');
  });
  it('no archmagus: max effort, non-opus', () => {
    expect(keys(wonRun({ effort: 'max', model: 'claude-sonnet-4-6' }))).not.toContain('archmagus');
  });
});

// ── fast mode achievements ────────────────────────────────────────────────────

describe('fast mode achievements', () => {
  it('lightning: opus fastMode, under budget', () => {
    expect(
      keys(wonRun({ fastMode: true, model: 'claude-opus-4-6', spent: 0.1, budget: 0.5 }))
    ).toContain('lightning');
  });
  it('daredevil: opus fastMode, ≤25% budget', () => {
    expect(
      keys(wonRun({ fastMode: true, model: 'claude-opus-4-6', spent: 0.1, budget: 0.5 }))
    ).toContain('daredevil');
  });
  it('no lightning for non-opus fastMode', () => {
    expect(
      keys(wonRun({ fastMode: true, model: 'claude-sonnet-4-6', spent: 0.1, budget: 0.5 }))
    ).not.toContain('lightning');
  });
});

// ── compaction / gear achievements ────────────────────────────────────────────

describe('compaction achievements', () => {
  it('overencumbered: auto-compaction event', () => {
    const events = [{ trigger: 'auto', contextPct: 92 }];
    expect(keys(wonRun({ compactionEvents: events }))).toContain('overencumbered');
  });
  it('no overencumbered with only manual compaction', () => {
    const events = [{ trigger: 'manual', contextPct: 45 }];
    expect(keys(wonRun({ compactionEvents: events }))).not.toContain('overencumbered');
  });
  it('ghost_run: manual compact at ≤30% context', () => {
    const events = [{ trigger: 'manual', contextPct: 28 }];
    expect(keys(wonRun({ compactionEvents: events }))).toContain('ghost_run');
  });
  it('ultralight: manual compact at 31–40% context', () => {
    const events = [{ trigger: 'manual', contextPct: 35 }];
    expect(keys(wonRun({ compactionEvents: events }))).toContain('ultralight');
  });
  it('traveling_light: manual compact at 41–50% context', () => {
    const events = [{ trigger: 'manual', contextPct: 48 }];
    expect(keys(wonRun({ compactionEvents: events }))).toContain('traveling_light');
  });
  it('no compaction achievement above 50%', () => {
    const events = [{ trigger: 'manual', contextPct: 60 }];
    const a = keys(wonRun({ compactionEvents: events }));
    expect(a).not.toContain('ghost_run');
    expect(a).not.toContain('ultralight');
    expect(a).not.toContain('traveling_light');
  });
});

// ── calculated_risk ───────────────────────────────────────────────────────────

describe('calculated_risk', () => {
  it('fires with thinking + ≤25% budget', () => {
    expect(keys(wonRun({ thinkingInvocations: 1, spent: 0.1, budget: 0.5 }))).toContain(
      'calculated_risk'
    );
  });
  it('no calculated_risk at 30% budget', () => {
    expect(keys(wonRun({ thinkingInvocations: 1, spent: 0.15, budget: 0.5 }))).not.toContain(
      'calculated_risk'
    );
  });
});

// ── multi-model achievements ──────────────────────────────────────────────────

describe('frugal + rogue_run', () => {
  it('frugal: haiku ≥50% of spend', () => {
    const mb = { 'claude-haiku-4-5-20251001': 0.06, 'claude-sonnet-4-6': 0.04 };
    expect(keys(wonRun({ modelBreakdown: mb, spent: 0.1 }))).toContain('frugal');
  });
  it('rogue_run: haiku ≥75% of spend', () => {
    const mb = { 'claude-haiku-4-5-20251001': 0.08, 'claude-sonnet-4-6': 0.02 };
    expect(keys(wonRun({ modelBreakdown: mb, spent: 0.1 }))).toContain('rogue_run');
  });
  it('no frugal when haiku < 50%', () => {
    const mb = { 'claude-haiku-4-5-20251001': 0.04, 'claude-sonnet-4-6': 0.06 };
    expect(keys(wonRun({ modelBreakdown: mb, spent: 0.1 }))).not.toContain('frugal');
  });
  it('no rogue_run when haiku < 75%', () => {
    const mb = { 'claude-haiku-4-5-20251001': 0.06, 'claude-sonnet-4-6': 0.04 };
    expect(keys(wonRun({ modelBreakdown: mb, spent: 0.1 }))).not.toContain('rogue_run');
  });
});

// ── model switching achievements ──────────────────────────────────────────────

describe('model switching achievements', () => {
  it('purist: single distinct model', () => {
    expect(keys(wonRun({ modelSwitches: 0, distinctModels: 1 }))).toContain('purist');
  });
  it('committed: 0 switches, ≤1 distinct', () => {
    expect(keys(wonRun({ modelSwitches: 0, distinctModels: 1 }))).toContain('committed');
  });
  it('chameleon: 2+ distinct models, under budget', () => {
    expect(
      keys(wonRun({ modelSwitches: 2, distinctModels: 2, spent: 0.1, budget: 0.5 }))
    ).toContain('chameleon');
  });
  it('no chameleon if over budget', () => {
    expect(
      keys(wonRun({ modelSwitches: 2, distinctModels: 2, spent: 0.6, budget: 0.5 }))
    ).not.toContain('chameleon');
  });
  it('tactical_switch: exactly 1 switch, under budget', () => {
    expect(
      keys(wonRun({ modelSwitches: 1, distinctModels: 2, spent: 0.1, budget: 0.5 }))
    ).toContain('tactical_switch');
  });
  it('class_defection: declared haiku but >50% on heavier models', () => {
    const mb = { 'claude-haiku-4-5-20251001': 0.04, 'claude-sonnet-4-6': 0.06 };
    expect(
      keys(wonRun({ model: 'claude-haiku-4-5-20251001', modelBreakdown: mb, spent: 0.1 }))
    ).toContain('class_defection');
  });
  it('no class_defection: declared haiku, haiku dominant', () => {
    const mb = { 'claude-haiku-4-5-20251001': 0.07, 'claude-sonnet-4-6': 0.03 };
    expect(
      keys(wonRun({ model: 'claude-haiku-4-5-20251001', modelBreakdown: mb, spent: 0.1 }))
    ).not.toContain('class_defection');
  });
  it('class_defection: declared sonnet but >40% on opus', () => {
    const mb = { 'claude-sonnet-4-6': 0.05, 'claude-opus-4-6': 0.05 };
    expect(keys(wonRun({ model: 'claude-sonnet-4-6', modelBreakdown: mb, spent: 0.1 }))).toContain(
      'class_defection'
    );
  });
});
