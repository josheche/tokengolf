import fs from 'fs';
import path from 'path';
import os from 'os';

export const STATE_DIR = path.join(os.homedir(), '.tokengolf');
const STATE_FILE = path.join(STATE_DIR, 'current-run.json');

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

export function getCurrentRun() {
  try {
    return JSON.parse(fs.readFileSync(STATE_FILE, 'utf8'));
  } catch {
    return null;
  }
}

export function setCurrentRun(run) {
  ensureDir();
  fs.writeFileSync(STATE_FILE, JSON.stringify(run, null, 2));
}

export function updateCurrentRun(updates) {
  const run = getCurrentRun();
  if (!run) return null;
  const updated = { ...run, ...updates };
  setCurrentRun(updated);
  return updated;
}

export function clearCurrentRun() {
  if (fs.existsSync(STATE_FILE)) fs.unlinkSync(STATE_FILE);
}
