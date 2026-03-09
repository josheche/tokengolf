import fs from 'fs';
import path from 'path';
import { calculateAchievements } from './score.js';
import { STATE_DIR } from './state.js';
const RUNS_FILE = path.join(STATE_DIR, 'runs.json');

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

function readRuns() {
  try {
    return JSON.parse(fs.readFileSync(RUNS_FILE, 'utf8'));
  } catch {
    return [];
  }
}

function writeRuns(runs) {
  ensureDir();
  fs.writeFileSync(RUNS_FILE, JSON.stringify(runs, null, 2));
}

export function saveRun(run) {
  const runs = readRuns();
  const achievements = calculateAchievements(run);
  const record = {
    id: `run_${Date.now()}`,
    ...run,
    achievements,
    savedAt: new Date().toISOString(),
  };
  runs.push(record);
  writeRuns(runs);
  return record;
}

export function getLastRun() {
  const runs = readRuns();
  return runs.length ? runs[runs.length - 1] : null;
}

export function getAllRuns() {
  return readRuns();
}

export function getStats() {
  const runs = readRuns().filter((r) => r.status !== 'active');
  const wins = runs.filter((r) => r.status === 'won');
  const deaths = runs.filter((r) => r.status === 'died');

  const avgSpend = wins.length ? wins.reduce((sum, r) => sum + (r.spent || 0), 0) / wins.length : 0;

  const bestRun = wins.length
    ? wins.reduce((best, r) => (!best || r.spent < best.spent ? r : best), null)
    : null;

  const allAchievements = runs.flatMap((r) =>
    (r.achievements || []).map((a) => ({
      ...a,
      quest: r.quest,
      earnedAt: r.endedAt,
    }))
  );

  return {
    total: runs.length,
    wins: wins.length,
    deaths: deaths.length,
    avgSpend,
    bestRun,
    recentRuns: runs.slice(-10).reverse(),
    achievements: allAchievements.slice(-20).reverse(),
    winRate: runs.length > 0 ? Math.round((wins.length / runs.length) * 100) : 0,
  };
}
