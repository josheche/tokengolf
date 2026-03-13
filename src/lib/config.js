import fs from 'fs';
import path from 'path';
import { STATE_DIR } from './state.js';

const CONFIG_FILE = path.join(STATE_DIR, 'config.json');

export const VALID_EMOTION_MODES = ['off', 'emoji', 'ascii'];

function ensureDir() {
  if (!fs.existsSync(STATE_DIR)) fs.mkdirSync(STATE_DIR, { recursive: true });
}

export function getConfig() {
  try {
    return JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
  } catch {
    return { emotionMode: 'emoji' };
  }
}

export function setConfig(key, value) {
  ensureDir();
  const config = getConfig();
  config[key] = value;
  fs.writeFileSync(CONFIG_FILE, JSON.stringify(config, null, 2));
  return config;
}
