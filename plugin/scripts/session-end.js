#!/usr/bin/env node

// hooks/session-end.js
import path5 from "path";
import fs5 from "fs";
import os3 from "os";

// src/lib/cost.js
import fs from "fs";
import path from "path";
import os from "os";
var PRICING = {
  "claude-opus-4": { input: 15, output: 75, cacheWrite: 18.75, cacheRead: 1.5 },
  "claude-sonnet-4": { input: 3, output: 15, cacheWrite: 3.75, cacheRead: 0.3 },
  "claude-haiku-4": { input: 0.8, output: 4, cacheWrite: 1, cacheRead: 0.08 }
};
function getPrice(model) {
  const lower = (model || "").toLowerCase();
  for (const [key, price] of Object.entries(PRICING)) {
    if (lower.includes(key)) return price;
  }
  return PRICING["claude-sonnet-4"];
}
function getProjectDir(cwd) {
  return path.join(os.homedir(), ".claude", "projects", cwd.replace(/\//g, "-"));
}
function parseCostFromTranscript(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, "utf8").trim().split("\n");
    let total = 0;
    const byModel = {};
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === "assistant" && entry.message?.usage && entry.message?.model) {
          const model = entry.message.model;
          const p = getPrice(model);
          const u = entry.message.usage;
          const cost = (u.input_tokens || 0) / 1e6 * p.input + (u.output_tokens || 0) / 1e6 * p.output + (u.cache_creation_input_tokens || 0) / 1e6 * p.cacheWrite + (u.cache_read_input_tokens || 0) / 1e6 * p.cacheRead;
          total += cost;
          byModel[model] = (byModel[model] || 0) + cost;
        }
      } catch {
      }
    }
    return total > 0 ? { total, byModel } : null;
  } catch {
    return null;
  }
}
function findTranscriptsSince(projectDir, sinceMs) {
  try {
    return fs.readdirSync(projectDir).filter((f) => f.endsWith(".jsonl")).map((f) => ({
      p: path.join(projectDir, f),
      mtime: fs.statSync(path.join(projectDir, f)).mtimeMs
    })).filter(({ mtime }) => mtime >= sinceMs).map(({ p }) => p);
  } catch {
    return [];
  }
}
function parseThinkingFromTranscripts(paths) {
  let invocations = 0;
  let tokens = 0;
  for (const p of paths) {
    try {
      const lines = fs.readFileSync(p, "utf8").trim().split("\n");
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === "assistant" && Array.isArray(entry.message?.content)) {
            const thinkBlocks = entry.message.content.filter((b) => b.type === "thinking");
            if (thinkBlocks.length > 0) {
              invocations++;
              for (const block of thinkBlocks) {
                tokens += Math.round((block.thinking?.length || 0) / 4);
              }
            }
          }
        } catch {
        }
      }
    } catch {
    }
  }
  return invocations > 0 ? { thinkingInvocations: invocations, thinkingTokens: tokens } : null;
}
function parseAllTranscripts(paths) {
  let total = 0;
  const byModel = {};
  for (const p of paths) {
    const result = parseCostFromTranscript(p);
    if (!result) continue;
    total += result.total;
    for (const [model, cost] of Object.entries(result.byModel)) {
      byModel[model] = (byModel[model] || 0) + cost;
    }
  }
  return total > 0 ? { total, byModel } : null;
}
function modelFamily(model) {
  const m = (model || "").toLowerCase();
  if (m.includes("haiku")) return "haiku";
  if (m.includes("sonnet")) return "sonnet";
  if (m.includes("opus")) return "opus";
  return "unknown";
}
function parseModelSwitches(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, "utf8").trim().split("\n");
    let lastFamily = null;
    let switches = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === "assistant" && entry.message?.model) {
          const family = modelFamily(entry.message.model);
          if (lastFamily !== null && family !== lastFamily) switches++;
          lastFamily = family;
        }
      } catch {
      }
    }
    return { switches };
  } catch {
    return { switches: 0 };
  }
}
function findTranscript(sessionId, projectDir) {
  if (sessionId) {
    try {
      const p = path.join(projectDir, `${sessionId}.jsonl`);
      fs.accessSync(p);
      return p;
    } catch {
    }
  }
  try {
    const files = fs.readdirSync(projectDir).filter((f) => f.endsWith(".jsonl")).map((f) => ({ f, mtime: fs.statSync(path.join(projectDir, f)).mtimeMs })).sort((a, b) => b.mtime - a.mtime);
    return files.length ? path.join(projectDir, files[0].f) : null;
  } catch {
    return null;
  }
}
function autoDetectCost(run) {
  const projectDir = getProjectDir(process.cwd());
  const sinceMs = run.startedAt ? new Date(run.startedAt).getTime() : 0;
  const paths = sinceMs > 0 ? findTranscriptsSince(projectDir, sinceMs) : [findTranscript(run.sessionId, projectDir)].filter(Boolean);
  const parsed = paths.length > 0 ? parseAllTranscripts(paths) : null;
  const spent = parsed?.total ?? (run.spent > 0 ? run.spent : null);
  if (spent === null) return null;
  const modelBreakdown = parsed?.byModel ?? run.modelBreakdown ?? null;
  const thinking = parseThinkingFromTranscripts(paths);
  const primaryPath = findTranscript(run.sessionId, projectDir);
  const { switches: modelSwitches } = primaryPath ? parseModelSwitches(primaryPath) : { switches: 0 };
  const families = new Set(
    Object.keys(parsed?.byModel ?? {}).map(modelFamily).filter((f) => f !== "unknown")
  );
  const distinctModels = families.size;
  return {
    spent,
    modelBreakdown,
    thinkingInvocations: thinking?.thinkingInvocations ?? 0,
    thinkingTokens: thinking?.thinkingTokens ?? 0,
    modelSwitches,
    distinctModels
  };
}

// src/lib/state.js
import fs2 from "fs";
import path2 from "path";
import os2 from "os";
var STATE_DIR = path2.join(os2.homedir(), ".tokengolf");
var cwdKey = (process.env.PWD || process.cwd()).replace(/\//g, "-");
var STATE_FILE = path2.join(STATE_DIR, `current-run${cwdKey}.json`);
function ensureDir() {
  if (!fs2.existsSync(STATE_DIR)) fs2.mkdirSync(STATE_DIR, { recursive: true });
}
function getCurrentRun() {
  try {
    return JSON.parse(fs2.readFileSync(STATE_FILE, "utf8"));
  } catch {
    return null;
  }
}
function setCurrentRun(run) {
  ensureDir();
  fs2.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
}
function clearCurrentRun() {
  if (fs2.existsSync(STATE_FILE)) fs2.unlinkSync(STATE_FILE);
}

// src/lib/store.js
import fs4 from "fs";
import path4 from "path";

// src/lib/score.js
var SPEND_TIER_DEFS = [
  { label: "Mythic", emoji: "\u2728", key: "mythic", color: "magenta" },
  { label: "Diamond", emoji: "\u{1F48E}", key: "diamond", color: "cyan" },
  { label: "Gold", emoji: "\u{1F947}", key: "gold", color: "yellow" },
  { label: "Silver", emoji: "\u{1F948}", key: "silver", color: "white" },
  { label: "Bronze", emoji: "\u{1F949}", key: "bronze", color: "yellow" },
  { label: "Reckless", emoji: "\u{1F4B8}", key: "reckless", color: "red" }
];
var EFFORT_LEVELS = {
  low: { label: "Low", emoji: "\u{1FAB6}", color: "green" },
  medium: { label: "Medium", emoji: "\u2696\uFE0F", color: "white" },
  high: { label: "High", emoji: "\u{1F525}", color: "yellow" },
  max: { label: "Max", emoji: "\u{1F4A5}", color: "magenta", opusOnly: true }
};
function getEffortLevel(effort) {
  return EFFORT_LEVELS[effort] || null;
}
var MODEL_BUDGET_TIERS = {
  haiku: { mythic: 0.03, diamond: 0.15, gold: 0.4, silver: 1, bronze: 2.5 },
  sonnet: { mythic: 0.1, diamond: 0.5, gold: 1.5, silver: 4, bronze: 10 },
  opusplan: { mythic: 0.3, diamond: 1.5, gold: 4.5, silver: 12, bronze: 30 },
  opus: { mythic: 0.5, diamond: 2.5, gold: 7.5, silver: 20, bronze: 50 }
};
function getModelBudgets(model) {
  const m = (model || "").toLowerCase();
  if (m.includes("opusplan")) return MODEL_BUDGET_TIERS.opusplan;
  if (m.includes("haiku")) return MODEL_BUDGET_TIERS.haiku;
  if (m.includes("opus")) return MODEL_BUDGET_TIERS.opus;
  return MODEL_BUDGET_TIERS.sonnet;
}
var MODEL_CLASSES = {
  haiku: {
    name: "Haiku",
    label: "Rogue",
    emoji: "\u{1F3F9}",
    difficulty: "Nightmare",
    color: "red"
  },
  sonnet: {
    name: "Sonnet",
    label: "Fighter",
    emoji: "\u2694\uFE0F",
    difficulty: "Standard",
    color: "cyan"
  },
  opusplan: {
    name: "Paladin",
    label: "Paladin",
    emoji: "\u269C\uFE0F",
    difficulty: "Tactical",
    color: "yellow"
  },
  opus: {
    name: "Opus",
    label: "Warlock",
    emoji: "\u{1F9D9}",
    difficulty: "Casual",
    color: "magenta"
  }
};
var MODEL_PAR_RATES = {
  haiku: 0.15,
  sonnet: 1.5,
  opusplan: 4.5,
  opus: 8
};
var MODEL_PAR_FLOORS = {
  haiku: 0.1,
  sonnet: 0.75,
  opusplan: 2,
  opus: 3
};
function getParBudget(model, promptCount, rateOverrides, floorOverrides) {
  const m = (model || "").toLowerCase();
  let key = "sonnet";
  if (m.includes("opusplan")) key = "opusplan";
  else if (m.includes("haiku")) key = "haiku";
  else if (m.includes("opus")) key = "opus";
  const rates = rateOverrides ? { ...MODEL_PAR_RATES, ...rateOverrides } : MODEL_PAR_RATES;
  const floors = floorOverrides ? { ...MODEL_PAR_FLOORS, ...floorOverrides } : MODEL_PAR_FLOORS;
  return Math.max((promptCount || 0) > 0 ? rates[key] * Math.sqrt(promptCount) : 0, floors[key]);
}
function getTier(spent, model) {
  const budgets = model ? getModelBudgets(model) : MODEL_BUDGET_TIERS.sonnet;
  for (const def of SPEND_TIER_DEFS) {
    const max = budgets[def.key];
    if (max !== void 0 && spent <= max) return def;
  }
  return SPEND_TIER_DEFS[SPEND_TIER_DEFS.length - 1];
}
function getModelClass(model = "") {
  const m = model.toLowerCase();
  if (m.includes("opusplan")) return MODEL_CLASSES.opusplan;
  const key = Object.keys(MODEL_CLASSES).find((k) => m.includes(k));
  return MODEL_CLASSES[key] || MODEL_CLASSES.sonnet;
}
function getEfficiencyRating(spent, budget) {
  const pct = spent / budget;
  if (pct <= 0.15) return { label: "LEGENDARY", emoji: "\u{1F31F}", color: "yellow" };
  if (pct <= 0.3) return { label: "EPIC", emoji: "\u{1F525}", color: "magenta" };
  if (pct <= 0.5) return { label: "PRO", emoji: "\u{1F4AA}", color: "cyan" };
  if (pct <= 0.75) return { label: "SOLID", emoji: "\u2705", color: "green" };
  if (pct <= 1) return { label: "CLOSE CALL", emoji: "\u26A0\uFE0F", color: "white" };
  return { label: "BUST", emoji: "\u{1F4A5}", color: "red" };
}
function getBudgetPct(spent, budget) {
  return Math.min(Math.round(spent / budget * 100), 999);
}
function formatCost(amount = 0) {
  if (amount === 0) return "$0.00";
  if (amount < 0.01) return `$${amount.toFixed(5)}`;
  return `$${amount.toFixed(2)}`;
}
function getOpusPct(modelBreakdown, totalSpent) {
  if (!modelBreakdown || !totalSpent) return null;
  const opusCost = Object.entries(modelBreakdown).filter(([m]) => m.toLowerCase().includes("opus")).reduce((sum, [, c]) => sum + c, 0);
  if (opusCost === 0) return null;
  return Math.round(opusCost / totalSpent * 100);
}
function getHaikuPct(modelBreakdown, totalSpent) {
  if (!modelBreakdown || !totalSpent) return null;
  const haikuCost = Object.entries(modelBreakdown).filter(([m]) => m.toLowerCase().includes("haiku")).reduce((sum, [, c]) => sum + c, 0);
  if (haikuCost === 0) return null;
  return Math.round(haikuCost / totalSpent * 100);
}
function calculateAchievements(run, rateOverrides, floorOverrides) {
  const achievements = [];
  const won = run.status === "won";
  const effBudget = getParBudget(run.model, run.promptCount, rateOverrides, floorOverrides);
  const pct = run.spent / effBudget;
  const mc = getModelClass(run.model);
  const isPaladin = mc === MODEL_CLASSES.opusplan;
  if ((run.modelSwitches ?? 0) >= 3)
    achievements.push({
      key: "indecisive",
      label: `Indecisive \u2014 ${run.modelSwitches} model switches mid-session`,
      emoji: "\u{1F3B2}"
    });
  if (run.thinkingInvocations > 0 && run.status === "died")
    achievements.push({
      key: "hubris",
      label: "Hubris \u2014 Used ultrathink, busted anyway",
      emoji: "\u{1F926}"
    });
  if (!won) {
    if (pct >= 2)
      achievements.push({ key: "blowout", label: "Blowout \u2014 Spent 2\xD7 par", emoji: "\u{1F4A5}" });
    else if (pct > 1 && pct <= 1.1)
      achievements.push({
        key: "so_close",
        label: "So Close \u2014 Died within 10% of par",
        emoji: "\u{1F62D}"
      });
    if ((run.totalToolCalls || 0) >= 30)
      achievements.push({
        key: "tool_happy",
        label: `Tool Happy \u2014 Died with ${run.totalToolCalls} tool calls`,
        emoji: "\u{1F528}"
      });
    if ((run.promptCount || 0) <= 2)
      achievements.push({
        key: "silent_death",
        label: "Silent Death \u2014 Died with \u22642 prompts",
        emoji: "\u{1FAA6}"
      });
    if ((run.failedToolCalls ?? 0) >= 5)
      achievements.push({
        key: "fumble",
        label: `Fumble \u2014 Died with ${run.failedToolCalls} failed tool calls`,
        emoji: "\u{1F921}"
      });
    if (pct >= 0.5) {
      if ((run.promptCount || 0) >= 3 && run.spent / (run.promptCount || 1) >= 0.5)
        achievements.push({
          key: "expensive_taste",
          label: "Expensive Taste \u2014 Over $0.50 per prompt",
          emoji: "\u{1F377}"
        });
    }
    return achievements;
  }
  if (mc === MODEL_CLASSES.haiku) {
    achievements.push({
      key: "gold_haiku",
      label: "Gold \u2014 Completed with Haiku",
      emoji: "\u{1F947}"
    });
    if (run.spent < 0.1)
      achievements.push({
        key: "diamond",
        label: "Diamond \u2014 Haiku under $0.10",
        emoji: "\u{1F48E}"
      });
  } else if (mc === MODEL_CLASSES.sonnet) {
    achievements.push({
      key: "silver_sonnet",
      label: "Silver \u2014 Completed with Sonnet",
      emoji: "\u{1F948}"
    });
  } else if (mc === MODEL_CLASSES.opusplan) {
    achievements.push({
      key: "paladin",
      label: "Paladin \u2014 Completed a run as Paladin",
      emoji: "\u269C\uFE0F"
    });
    if (pct <= 0.25)
      achievements.push({
        key: "grand_strategist",
        label: "Grand Strategist \u2014 EPIC efficiency as Paladin",
        emoji: "\u265F\uFE0F"
      });
  } else if (mc === MODEL_CLASSES.opus) {
    achievements.push({
      key: "bronze_opus",
      label: "Bronze \u2014 Completed with Opus",
      emoji: "\u{1F949}"
    });
  }
  if (pct <= 0.25)
    achievements.push({
      key: "sniper",
      label: "Sniper \u2014 Under 25% of par",
      emoji: "\u{1F3AF}"
    });
  if (pct <= 0.5)
    achievements.push({
      key: "efficient",
      label: "Efficient \u2014 Under 50% of par",
      emoji: "\u26A1"
    });
  if (run.spent < 0.1)
    achievements.push({
      key: "penny",
      label: "Penny Pincher \u2014 Under $0.10",
      emoji: "\u{1FA99}"
    });
  if (run.effort) {
    if (run.effort === "low" && pct < 1)
      achievements.push({
        key: "speedrunner",
        label: "Speedrunner \u2014 Low effort, completed under par",
        emoji: "\u{1F3CE}\uFE0F"
      });
    if ((run.effort === "high" || run.effort === "max") && pct <= 0.25)
      achievements.push({
        key: "tryhard",
        label: "Tryhard \u2014 High effort, EPIC efficiency",
        emoji: "\u{1F3CB}\uFE0F"
      });
    if (run.effort === "max" && mc === MODEL_CLASSES.opus)
      achievements.push({
        key: "archmagus",
        label: "Archmagus \u2014 Opus at max effort, completed",
        emoji: "\u{1F451}"
      });
  }
  if (run.fastMode && mc === MODEL_CLASSES.opus) {
    if (pct < 1)
      achievements.push({
        key: "lightning",
        label: "Lightning Run \u2014 Opus fast mode, completed under par",
        emoji: "\u26C8\uFE0F"
      });
    if (pct <= 0.25)
      achievements.push({
        key: "daredevil",
        label: "Daredevil \u2014 Opus fast mode, EPIC efficiency",
        emoji: "\u{1F3B0}"
      });
  }
  const sessions = run.sessionCount || 1;
  if (sessions >= 2)
    achievements.push({
      key: "made_camp",
      label: `Made Camp \u2014 Completed across ${sessions} sessions`,
      emoji: "\u{1F3D5}\uFE0F"
    });
  if (sessions === 1)
    achievements.push({
      key: "no_rest",
      label: "No Rest for the Wicked \u2014 Completed in one session",
      emoji: "\u{1F525}"
    });
  if (run.fainted)
    achievements.push({
      key: "came_back",
      label: "Came Back \u2014 Fainted and finished anyway",
      emoji: "\u{1F9DF}"
    });
  const compactionEvents = run.compactionEvents || [];
  const manualCompactions = compactionEvents.filter((e) => e.trigger === "manual");
  const autoCompactions = compactionEvents.filter((e) => e.trigger === "auto");
  if (autoCompactions.length > 0)
    achievements.push({
      key: "overencumbered",
      label: "Overencumbered \u2014 Context auto-compacted during run",
      emoji: "\u{1F4E6}"
    });
  if (manualCompactions.length > 0) {
    const minPct = Math.min(...manualCompactions.map((e) => e.contextPct ?? 100));
    if (minPct <= 30)
      achievements.push({
        key: "ghost_run",
        label: `Ghost Run \u2014 Manual compact at ${minPct}% context`,
        emoji: "\u{1F977}"
      });
    else if (minPct <= 40)
      achievements.push({
        key: "ultralight",
        label: `Ultralight \u2014 Manual compact at ${minPct}% context`,
        emoji: "\u{1FAB6}"
      });
    else if (minPct <= 50)
      achievements.push({
        key: "traveling_light",
        label: `Traveling Light \u2014 Manual compact at ${minPct}% context`,
        emoji: "\u{1F392}"
      });
  }
  const ti = run.thinkingInvocations;
  if (ti > 0) {
    achievements.push({
      key: "spell_cast",
      label: `Spell Cast \u2014 Used extended thinking (${ti}\xD7)`,
      emoji: "\u{1F52E}"
    });
    if (pct <= 0.25)
      achievements.push({
        key: "calculated_risk",
        label: "Calculated Risk \u2014 Ultrathink + EPIC efficiency",
        emoji: "\u{1F9EE}"
      });
    if (ti >= 3)
      achievements.push({
        key: "deep_thinker",
        label: `Deep Thinker \u2014 ${ti} ultrathink invocations, completed`,
        emoji: "\u{1F300}"
      });
  }
  if (run.thinkingInvocations === 0 && pct <= 0.75)
    achievements.push({
      key: "silent_run",
      label: "Silent Run \u2014 No extended thinking, completed under par",
      emoji: "\u{1F92B}"
    });
  if (mc === MODEL_CLASSES.opusplan) {
    const opusPct = getOpusPct(run.modelBreakdown, run.spent);
    if (opusPct !== null) {
      if (opusPct > 60)
        achievements.push({
          key: "architect",
          label: `Architect \u2014 Opus handled ${opusPct}% of cost (heavy planner)`,
          emoji: "\u{1F3DB}\uFE0F"
        });
      if (opusPct < 25)
        achievements.push({
          key: "blitz",
          label: `Blitz \u2014 Opus handled only ${opusPct}% of cost (light plan, fast execution)`,
          emoji: "\u{1F4A8}"
        });
      if (opusPct >= 40 && opusPct <= 60)
        achievements.push({
          key: "equilibrium",
          label: `Equilibrium \u2014 Opus and Sonnet balanced at ${opusPct}% / ${100 - opusPct}%`,
          emoji: "\u2696\uFE0F"
        });
    }
  }
  const switches = run.modelSwitches ?? 0;
  const distinct = run.distinctModels ?? 0;
  if (!isPaladin) {
    if (distinct === 1)
      achievements.push({
        key: "purist",
        label: "Purist \u2014 Single model family throughout",
        emoji: "\u{1F537}"
      });
    if (distinct >= 2 && pct < 1)
      achievements.push({
        key: "chameleon",
        label: `Chameleon \u2014 ${distinct} model families used, completed under par`,
        emoji: "\u{1F98E}"
      });
    if (switches === 1 && pct < 1)
      achievements.push({
        key: "tactical_switch",
        label: "Tactical Switch \u2014 Exactly 1 model switch, completed under par",
        emoji: "\u{1F500}"
      });
    if (switches === 0 && distinct <= 1)
      achievements.push({
        key: "committed",
        label: "Committed \u2014 No model switches, one model family",
        emoji: "\u{1F512}"
      });
    if (run.modelBreakdown && run.spent > 0) {
      const declared = (run.model || "").toLowerCase();
      const isHaikuRun = declared.includes("haiku");
      const isSonnetRun = declared.includes("sonnet") && !declared.includes("opus");
      const opusPct2 = getOpusPct(run.modelBreakdown, run.spent) ?? 0;
      const haikuPct2 = getHaikuPct(run.modelBreakdown, run.spent) ?? 0;
      const nonHaikuPct = 100 - haikuPct2;
      if (isHaikuRun && nonHaikuPct > 50)
        achievements.push({
          key: "class_defection",
          label: `Class Defection \u2014 Declared Haiku but ${nonHaikuPct}% cost on heavier models`,
          emoji: "\u26A0\uFE0F"
        });
      else if (isSonnetRun && opusPct2 > 40)
        achievements.push({
          key: "class_defection",
          label: `Class Defection \u2014 Declared Sonnet but ${opusPct2}% cost on Opus`,
          emoji: "\u26A0\uFE0F"
        });
    }
  }
  const haikuPct = getHaikuPct(run.modelBreakdown, run.spent);
  if (haikuPct !== null) {
    if (haikuPct >= 50)
      achievements.push({
        key: "frugal",
        label: `Frugal \u2014 Haiku handled ${haikuPct}% of session cost`,
        emoji: "\u{1F3F9}"
      });
    if (haikuPct >= 75)
      achievements.push({
        key: "rogue_run",
        label: `Rogue Run \u2014 Haiku handled ${haikuPct}% of session cost`,
        emoji: "\u{1F3B2}"
      });
  }
  const promptCount = run.promptCount || 0;
  const totalToolCalls = run.totalToolCalls || 0;
  if (promptCount === 1)
    achievements.push({
      key: "one_shot",
      label: "One Shot \u2014 Completed in a single prompt",
      emoji: "\u{1F94A}"
    });
  if (promptCount >= 20)
    achievements.push({
      key: "conversationalist",
      label: `Conversationalist \u2014 ${promptCount} prompts`,
      emoji: "\u{1F4AC}"
    });
  if (promptCount <= 3 && totalToolCalls >= 10)
    achievements.push({
      key: "terse",
      label: `Terse \u2014 ${promptCount} prompts, ${totalToolCalls} tool calls`,
      emoji: "\u{1F910}"
    });
  if (promptCount >= 15 && totalToolCalls / promptCount < 1)
    achievements.push({
      key: "backseat_driver",
      label: "Backseat Driver \u2014 Many prompts, few tool calls",
      emoji: "\u{1FA91}"
    });
  if (promptCount >= 2 && totalToolCalls / promptCount >= 5)
    achievements.push({
      key: "high_leverage",
      label: `High Leverage \u2014 ${(totalToolCalls / promptCount).toFixed(1)}\xD7 tools per prompt`,
      emoji: "\u{1F3D7}\uFE0F"
    });
  const toolCalls = run.toolCalls || {};
  const editCount = toolCalls["Edit"] || 0;
  const writeCount = toolCalls["Write"] || 0;
  const readCount = toolCalls["Read"] || 0;
  const bashCount = toolCalls["Bash"] || 0;
  const distinctTools = Object.keys(toolCalls).filter((k) => toolCalls[k] > 0).length;
  if (editCount === 0 && writeCount === 0 && readCount >= 1)
    achievements.push({ key: "read_only", label: "Read Only \u2014 No edits or writes", emoji: "\u{1F441}\uFE0F" });
  if (editCount >= 10)
    achievements.push({ key: "editor", label: `Editor \u2014 ${editCount} Edit calls`, emoji: "\u270F\uFE0F" });
  if (bashCount >= 10 && totalToolCalls >= 1 && bashCount / totalToolCalls >= 0.5)
    achievements.push({
      key: "bash_warrior",
      label: `Bash Warrior \u2014 ${bashCount} Bash calls (${Math.round(bashCount / totalToolCalls * 100)}% of tools)`,
      emoji: "\u{1F41A}"
    });
  if (totalToolCalls >= 5 && readCount / totalToolCalls >= 0.6)
    achievements.push({
      key: "scout",
      label: `Scout \u2014 ${Math.round(readCount / totalToolCalls * 100)}% Read calls`,
      emoji: "\u{1F50D}"
    });
  if (editCount >= 1 && editCount <= 3 && pct < 1)
    achievements.push({
      key: "surgeon",
      label: `Surgeon \u2014 Only ${editCount} Edit call${editCount > 1 ? "s" : ""}, under par`,
      emoji: "\u{1F52A}"
    });
  if (distinctTools >= 5)
    achievements.push({
      key: "toolbox",
      label: `Toolbox \u2014 ${distinctTools} distinct tools used`,
      emoji: "\u{1F9F0}"
    });
  if (promptCount >= 3) {
    const costPerPrompt = run.spent / promptCount;
    if (costPerPrompt < 0.01)
      achievements.push({
        key: "cheap_shots",
        label: `Cheap Shots \u2014 $${costPerPrompt.toFixed(4)} per prompt`,
        emoji: "\u{1F4B2}"
      });
    if (costPerPrompt >= 0.5)
      achievements.push({
        key: "expensive_taste",
        label: `Expensive Taste \u2014 $${costPerPrompt.toFixed(2)} per prompt`,
        emoji: "\u{1F377}"
      });
  }
  if (run.startedAt && run.endedAt) {
    const elapsedMs = new Date(run.endedAt).getTime() - new Date(run.startedAt).getTime();
    const elapsedMin = elapsedMs / 6e4;
    if (elapsedMin < 5)
      achievements.push({
        key: "speedrun",
        label: `Speedrun \u2014 Completed in ${Math.round(elapsedMin * 60)}s`,
        emoji: "\u23F1\uFE0F"
      });
    if (elapsedMin > 60 && elapsedMin <= 180)
      achievements.push({
        key: "marathon",
        label: `Marathon \u2014 ${Math.round(elapsedMin)}m session`,
        emoji: "\u{1F3C3}"
      });
    if (elapsedMin > 180)
      achievements.push({
        key: "endurance",
        label: `Endurance \u2014 ${Math.round(elapsedMin / 60)}h session`,
        emoji: "\u{1FAE0}"
      });
  }
  const failedToolCalls = run.failedToolCalls ?? 0;
  const subagentSpawns = run.subagentSpawns ?? 0;
  const turnCount = run.turnCount ?? 0;
  if (failedToolCalls === 0 && totalToolCalls >= 5)
    achievements.push({ key: "clean_run", label: "Clean Run \u2014 No tool failures", emoji: "\u2705" });
  if (failedToolCalls >= 10)
    achievements.push({
      key: "stubborn",
      label: `Stubborn \u2014 ${failedToolCalls} failed tool calls, still won`,
      emoji: "\u{1F402}"
    });
  if (subagentSpawns === 0)
    achievements.push({ key: "lone_wolf", label: "Lone Wolf \u2014 No subagents spawned", emoji: "\u{1F43A}" });
  if (subagentSpawns >= 5)
    achievements.push({
      key: "summoner",
      label: `Summoner \u2014 ${subagentSpawns} subagents spawned`,
      emoji: "\u{1F4E1}"
    });
  if (subagentSpawns >= 10 && pct < 0.5)
    achievements.push({
      key: "army",
      label: `Army of One \u2014 ${subagentSpawns} subagents, under 50% par`,
      emoji: "\u{1FA96}"
    });
  if (promptCount >= 2 && turnCount >= 1 && turnCount / promptCount >= 3)
    achievements.push({
      key: "agentic",
      label: `Agentic \u2014 ${(turnCount / promptCount).toFixed(1)} turns per prompt`,
      emoji: "\u{1F916}"
    });
  if (promptCount >= 3 && turnCount === promptCount)
    achievements.push({ key: "obedient", label: "Obedient \u2014 One turn per prompt", emoji: "\u{1F415}" });
  return achievements;
}

// src/lib/config.js
import fs3 from "fs";
import path3 from "path";
var CONFIG_FILE = path3.join(STATE_DIR, "config.json");
function getConfig() {
  try {
    return JSON.parse(fs3.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return { emotionMode: "emoji" };
  }
}
function getEffectiveParRates() {
  const config = getConfig();
  return { ...MODEL_PAR_RATES, ...config.parRates || {} };
}
function getEffectiveParFloors() {
  const config = getConfig();
  return { ...MODEL_PAR_FLOORS, ...config.parFloors || {} };
}

// src/lib/store.js
var RUNS_FILE = path4.join(STATE_DIR, "runs.json");
function ensureDir2() {
  if (!fs4.existsSync(STATE_DIR)) fs4.mkdirSync(STATE_DIR, { recursive: true });
}
function readRuns() {
  try {
    return JSON.parse(fs4.readFileSync(RUNS_FILE, "utf8"));
  } catch {
    return [];
  }
}
function writeRuns(runs) {
  ensureDir2();
  fs4.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 2));
}
function saveRun(run) {
  const runs = readRuns();
  const achievements = calculateAchievements(run, getEffectiveParRates(), getEffectiveParFloors());
  const record = {
    id: `run_${Date.now()}`,
    ...run,
    achievements,
    savedAt: (/* @__PURE__ */ new Date()).toISOString()
  };
  runs.push(record);
  writeRuns(runs);
  return record;
}

// src/lib/ansi-scorecard.js
var R = "\x1B[31m";
var G = "\x1B[32m";
var Y = "\x1B[33m";
var C = "\x1B[36m";
var M = "\x1B[35m";
var WH = "\x1B[37m";
var DIM = "\x1B[2m";
var RESET = "\x1B[0m";
var BOLD = "\x1B[1m";
function termWidth(str) {
  const plain = str.replace(/\x1b\[[0-9;]*m/g, "");
  const cps = [...plain].map((c) => c.codePointAt(0));
  let width = 0;
  for (let i = 0; i < cps.length; i++) {
    const cp = cps[i];
    if (cp === 65039) {
      if (i > 0 && cps[i - 1] <= 65535 && cps[i - 1] !== 8205) width += 1;
      continue;
    }
    if (cp === 65038 || cp === 8205 || cp >= 8203 && cp <= 8207) continue;
    if (cp > 65535) {
      width += 2;
      continue;
    }
    width += 1;
  }
  return width;
}
function renderScorecard(run) {
  const W = Math.min(Math.max((process.stdout.columns || 88) - 8, 40), 80);
  const won = run.status === "won";
  const effBudget = getParBudget(
    run.model,
    run.promptCount,
    getEffectiveParRates(),
    getEffectiveParFloors()
  );
  const bc = won ? Y : R;
  const BLK = "\u2588\u2588";
  function row(content) {
    return bc + BLK + RESET + "  " + content;
  }
  function bar() {
    return bc + BLK + RESET + "  " + DIM + "\u2500".repeat(W) + RESET;
  }
  const mc = getModelClass(run.model);
  const tier = getTier(run.spent, run.model);
  const fainted = run.fainted;
  const sessions = run.sessionCount || 1;
  const header = won ? `${BOLD}${Y}\u{1F3C6}  SESSION COMPLETE${RESET}` : fainted ? `${BOLD}${Y}\u{1F4A4}  FAINTED \u2014 Run Continues${RESET}` : `${BOLD}${R}\u{1F480}  PAR BUST${RESET}`;
  const questStr = `${DIM}${run.promptCount || 0} prompts \xB7 par $${effBudget.toFixed(2)}${RESET}`;
  const spentBefore = run.spentBeforeThisSession || 0;
  const spentThisSession = run.spent - spentBefore;
  const multiSession = sessions > 1 && spentBefore > 0;
  const spentStr = `${won ? G : R}${formatCost(run.spent)}${RESET}` + (multiSession ? `  ${DIM}(+${formatCost(spentThisSession)} this session)${RESET}` : "");
  let midRow = spentStr;
  {
    const pct = getBudgetPct(run.spent, effBudget);
    const eff = getEfficiencyRating(run.spent, effBudget);
    const effC = eff.color === "yellow" ? Y : eff.color === "magenta" ? M : eff.color === "cyan" ? C : eff.color === "green" ? G : eff.color === "white" ? WH : R;
    midRow += `  ${DIM}/${RESET}$${effBudget.toFixed(2)}  ${pct}%  ${effC}${eff.emoji} ${eff.label}${RESET}`;
  }
  const effortInfo = run.effort ? getEffortLevel(run.effort) : null;
  const modelSuffix = [
    run.effort && effortInfo ? effortInfo.label : null,
    run.fastMode ? "\u26A1Fast" : null
  ].filter(Boolean).join("\xB7");
  midRow += `  ${C}${mc.emoji} ${mc.name}${modelSuffix ? "\xB7" + modelSuffix : ""}${RESET}`;
  midRow += `  ${tier.emoji} ${tier.label}`;
  if (multiSession) midRow += `  ${DIM}${sessions} sessions${RESET}`;
  const achievements = run.achievements || [];
  const achTokens = achievements.map((a) => `${a.emoji} ${a.label || a.key}`);
  const achLines = [];
  let currentLine = "";
  for (const token of achTokens) {
    const sep = currentLine ? "  " : "";
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
  const thinkRow = ti > 0 ? `${M}\u{1F52E} ${ti} ultrathink${ti > 1 ? " invocations" : " invocation"}${RESET}` : null;
  const lines = ["", row(header), row(questStr), bar(), row(midRow)];
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
  lines.push(row(`${DIM}tokengolf scorecard${RESET}  \xB7  ${DIM}tokengolf stats${RESET}`));
  lines.push("");
  return lines.join("\n");
}

// hooks/session-end.js
function writeTTY(text) {
  try {
    const ttyFd = fs5.openSync("/dev/tty", "w");
    fs5.writeSync(ttyFd, text);
    fs5.closeSync(ttyFd);
  } catch {
    process.stdout.write(text);
  }
}
try {
  let stdin = "";
  try {
    stdin = fs5.readFileSync("/dev/stdin", "utf8");
  } catch {
  }
  let event = {};
  try {
    event = JSON.parse(stdin);
  } catch {
  }
  const reason = event.reason || "other";
  const cwdKey2 = (process.env.PWD || process.cwd()).replace(/\//g, "-");
  const costFile = path5.join(os3.homedir(), ".tokengolf", `session-cost${cwdKey2}`);
  let liveCost = null;
  try {
    const raw = fs5.readFileSync(costFile, "utf8").trim();
    const parsed = parseFloat(raw);
    if (!isNaN(parsed) && parsed > 0) liveCost = parsed;
  } catch {
  }
  const eventCost = event.cost?.total_cost_usd ?? null;
  const authoritativeCost = liveCost ?? eventCost;
  const run = getCurrentRun();
  if (!run || run.status !== "active") process.exit(0);
  let result = autoDetectCost(run);
  if (!result && authoritativeCost === null) process.exit(0);
  if (!result) result = { spent: 0, modelBreakdown: {}, thinkingInvocations: 0, thinkingTokens: 0 };
  if (authoritativeCost !== null) {
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
  if (result.modelBreakdown && Object.keys(result.modelBreakdown).length > 0) {
    const merged = {};
    for (const [model, cost] of Object.entries(result.modelBreakdown)) {
      const m = model.toLowerCase();
      const family = m.includes("haiku") ? "Haiku" : m.includes("sonnet") ? "Sonnet" : "Opus";
      merged[family] = (merged[family] || 0) + cost;
    }
    result.modelBreakdown = merged;
  }
  const cleanExits = ["clear", "logout", "prompt_input_exit", "bypass_permissions_disabled"];
  const fainted = !cleanExits.includes(reason) && reason !== "other" ? false : reason === "other";
  const par = getParBudget(run.model, run.promptCount, getEffectiveParRates(), getEffectiveParFloors());
  let status;
  if (result.spent > par) status = "died";
  else if (fainted)
    status = "resting";
  else status = "won";
  const thinkingFields = {
    thinkingInvocations: result.thinkingInvocations ?? 0,
    thinkingTokens: result.thinkingTokens ?? 0
  };
  if (status === "resting") {
    setCurrentRun({ ...run, spent: result.spent, fainted: true, ...thinkingFields });
    const saved2 = {
      ...run,
      spent: result.spent,
      modelBreakdown: result.modelBreakdown,
      status,
      fainted: true,
      ...thinkingFields
    };
    writeTTY("\n" + renderScorecard({ ...saved2, achievements: [] }) + "\n\n");
    process.exit(0);
  }
  const saved = saveRun({
    ...run,
    spent: result.spent,
    modelBreakdown: result.modelBreakdown,
    status,
    endedAt: (/* @__PURE__ */ new Date()).toISOString(),
    ...thinkingFields
  });
  clearCurrentRun();
  try {
    fs5.unlinkSync(costFile);
  } catch {
  }
  writeTTY("\n" + renderScorecard(saved) + "\n\n");
} catch {
}
process.exit(0);
