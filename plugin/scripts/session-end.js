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
var { getTier, getModelClass, getEffortLevel, getEfficiencyRating, getBudgetPct } = await import(path.join(__dir, "../src/lib/score.js"));
function writeTTY(text) {
  try {
    const ttyFd = fs.openSync("/dev/tty", "w");
    fs.writeSync(ttyFd, text);
    fs.closeSync(ttyFd);
  } catch {
    process.stdout.write(text);
  }
}
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
  const FLOW_BUDGETS = { "claude-haiku-4-5-20251001": 0.4, "claude-sonnet-4-6": 1.5, "claude-opus-4-6": 7.5, "opusplan": 7.5 };
  const effBudget = run.budget || FLOW_BUDGETS[run.model] || 1.5;
  const R = "\x1B[31m", G = "\x1B[32m", Y = "\x1B[33m", C = "\x1B[36m";
  const M = "\x1B[35m", WH = "\x1B[37m", DIM = "\x1B[2m", RESET = "\x1B[0m", BOLD = "\x1B[1m";
  const bc = won ? Y : R;
  const BLK = "\u2588\u2588";
  function row(content) {
    return bc + BLK + RESET + "  " + content;
  }
  function bar() {
    return bc + BLK + RESET + "  " + DIM + "\u2500".repeat(W) + RESET;
  }
  const mc = getModelClass(run.model);
  const tier = getTier(run.spent);
  const fainted = run.fainted;
  const sessions = run.sessionCount || 1;
  const header = won ? `${BOLD}${Y}\u{1F3C6}  SESSION COMPLETE${RESET}` : fainted ? `${BOLD}${Y}\u{1F4A4}  FAINTED \u2014 Run Continues${RESET}` : `${BOLD}${R}\u{1F480}  BUDGET BUST${RESET}`;
  const questStr = run.quest ? `${BOLD}${run.quest.slice(0, 60)}${RESET}` : `${DIM}Flow Mode${RESET}`;
  const spentBefore = run.spentBeforeThisSession || 0;
  const spentThisSession = run.spent - spentBefore;
  const multiSession = sessions > 1 && spentBefore > 0;
  const spentStr = `${won ? G : R}$${run.spent.toFixed(4)}${RESET}` + (multiSession ? `  ${DIM}(+$${spentThisSession.toFixed(4)} this session)${RESET}` : "");
  let midRow = spentStr;
  {
    const pct = getBudgetPct(run.spent, effBudget);
    const eff = getEfficiencyRating(run.spent, effBudget);
    const effC = eff.color === "yellow" ? Y : eff.color === "magenta" ? M : eff.color === "cyan" ? C : eff.color === "green" ? G : eff.color === "white" ? WH : R;
    midRow += `  ${DIM}/${RESET}$${effBudget.toFixed(2)}${!run.budget ? `${DIM}*${RESET}` : ""}  ${pct}%  ${effC}${eff.emoji} ${eff.label}${RESET}`;
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
  const achTokens = achievements.map((a) => `${a.emoji} ${a.key}`);
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
  lines.push(
    row(
      `${DIM}tokengolf scorecard${RESET}  \xB7  ${DIM}tokengolf start${RESET}  \xB7  ${DIM}tokengolf stats${RESET}`
    )
  );
  lines.push("");
  return lines.join("\n");
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
  let status;
  if (run.budget && result.spent > run.budget) status = "died";
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
