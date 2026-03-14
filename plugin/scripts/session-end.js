#!/usr/bin/env node

// hooks/session-end.js
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import os from "os";
var __dir = path.dirname(fileURLToPath(import.meta.url));
var { autoDetectCost } = await import(path.join(__dir, "../src/lib/cost.js"));
var { getCurrentRun, clearCurrentRun } = await import(path.join(__dir, "../src/lib/state.js"));
var { saveRun } = await import(path.join(__dir, "../src/lib/store.js"));
var { renderScorecard } = await import(path.join(__dir, "../src/lib/ansi-scorecard.js"));
function writeTTY(text) {
  try {
    const ttyFd = fs.openSync("/dev/tty", "w");
    fs.writeSync(ttyFd, text);
    fs.closeSync(ttyFd);
  } catch {
    process.stdout.write(text);
  }
}
try {
  let stdin = "";
  try {
    stdin = fs.readFileSync("/dev/stdin", "utf8");
  } catch {
  }
  let event = {};
  try {
    event = JSON.parse(stdin);
  } catch {
  }
  const reason = event.reason || "other";
  let liveCost = null;
  try {
    const raw = fs.readFileSync(path.join(os.homedir(), ".tokengolf", "session-cost"), "utf8").trim();
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
  const { getParBudget: gp } = await import(path.join(__dir, "../src/lib/score.js"));
  const { getEffectiveParRates, getEffectiveParFloors } = await import(path.join(__dir, "../src/lib/config.js"));
  const par = gp(run.model, run.promptCount, getEffectiveParRates(), getEffectiveParFloors());
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
    const { setCurrentRun } = await import(path.join(__dir, "../src/lib/state.js"));
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
    fs.unlinkSync(path.join(os.homedir(), ".tokengolf", "session-cost"));
  } catch {
  }
  writeTTY("\n" + renderScorecard(saved) + "\n\n");
} catch {
}
process.exit(0);
