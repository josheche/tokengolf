import fs from 'fs';
import path from 'path';
import os from 'os';

// Pricing per million tokens (Anthropic list prices)
const PRICING = {
  'claude-opus-4': { input: 15.0, output: 75.0, cacheWrite: 18.75, cacheRead: 1.5 },
  'claude-sonnet-4': { input: 3.0, output: 15.0, cacheWrite: 3.75, cacheRead: 0.3 },
  'claude-haiku-4': { input: 0.8, output: 4.0, cacheWrite: 1.0, cacheRead: 0.08 },
};

function getPrice(model) {
  const lower = (model || '').toLowerCase();
  for (const [key, price] of Object.entries(PRICING)) {
    if (lower.includes(key)) return price;
  }
  return PRICING['claude-sonnet-4'];
}

export function getProjectDir(cwd) {
  return path.join(os.homedir(), '.claude', 'projects', cwd.replace(/\//g, '-'));
}

export function parseCostFromTranscript(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
    let total = 0;
    const byModel = {};
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'assistant' && entry.message?.usage && entry.message?.model) {
          const model = entry.message.model;
          const p = getPrice(model);
          const u = entry.message.usage;
          const cost =
            ((u.input_tokens || 0) / 1e6) * p.input +
            ((u.output_tokens || 0) / 1e6) * p.output +
            ((u.cache_creation_input_tokens || 0) / 1e6) * p.cacheWrite +
            ((u.cache_read_input_tokens || 0) / 1e6) * p.cacheRead;
          total += cost;
          byModel[model] = (byModel[model] || 0) + cost;
        }
      } catch {
        /* skip malformed lines */
      }
    }
    return total > 0 ? { total, byModel } : null;
  } catch {
    return null;
  }
}

// Returns all transcript paths modified at or after sinceMs
function findTranscriptsSince(projectDir, sinceMs) {
  try {
    return fs
      .readdirSync(projectDir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => ({
        p: path.join(projectDir, f),
        mtime: fs.statSync(path.join(projectDir, f)).mtimeMs,
      }))
      .filter(({ mtime }) => mtime >= sinceMs)
      .map(({ p }) => p);
  } catch {
    return [];
  }
}

export function parseThinkingFromTranscripts(paths) {
  let invocations = 0;
  let tokens = 0;
  for (const p of paths) {
    try {
      const lines = fs.readFileSync(p, 'utf8').trim().split('\n');
      for (const line of lines) {
        try {
          const entry = JSON.parse(line);
          if (entry.type === 'assistant' && Array.isArray(entry.message?.content)) {
            const thinkBlocks = entry.message.content.filter((b) => b.type === 'thinking');
            if (thinkBlocks.length > 0) {
              invocations++;
              for (const block of thinkBlocks) {
                tokens += Math.round((block.thinking?.length || 0) / 4);
              }
            }
          }
        } catch {
          /* skip malformed lines */
        }
      }
    } catch {
      /* skip unreadable files */
    }
  }
  return invocations > 0 ? { thinkingInvocations: invocations, thinkingTokens: tokens } : null;
}

// Aggregate costs across multiple transcript files
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

export function modelFamily(model) {
  const m = (model || '').toLowerCase();
  if (m.includes('haiku')) return 'haiku';
  if (m.includes('sonnet')) return 'sonnet';
  if (m.includes('opus')) return 'opus';
  return 'unknown';
}

export function parseModelSwitches(transcriptPath) {
  try {
    const lines = fs.readFileSync(transcriptPath, 'utf8').trim().split('\n');
    let lastFamily = null;
    let switches = 0;
    for (const line of lines) {
      try {
        const entry = JSON.parse(line);
        if (entry.type === 'assistant' && entry.message?.model) {
          const family = modelFamily(entry.message.model);
          if (lastFamily !== null && family !== lastFamily) switches++;
          lastFamily = family;
        }
      } catch {
        /* skip */
      }
    }
    return { switches };
  } catch {
    return { switches: 0 };
  }
}

export function findTranscript(sessionId, projectDir) {
  if (sessionId) {
    try {
      const p = path.join(projectDir, `${sessionId}.jsonl`);
      fs.accessSync(p);
      return p;
    } catch {
      /* fall through */
    }
  }
  // Fall back to most recently modified transcript
  try {
    const files = fs
      .readdirSync(projectDir)
      .filter((f) => f.endsWith('.jsonl'))
      .map((f) => ({ f, mtime: fs.statSync(path.join(projectDir, f)).mtimeMs }))
      .sort((a, b) => b.mtime - a.mtime);
    return files.length ? path.join(projectDir, files[0].f) : null;
  } catch {
    return null;
  }
}

// Returns { spent, modelBreakdown } or null
export function autoDetectCost(run) {
  const projectDir = getProjectDir(process.cwd());

  // Scan all transcripts modified since session start to capture subagent sidechains
  const sinceMs = run.startedAt ? new Date(run.startedAt).getTime() : 0;
  const paths =
    sinceMs > 0
      ? findTranscriptsSince(projectDir, sinceMs)
      : [findTranscript(run.sessionId, projectDir)].filter(Boolean);

  const parsed = paths.length > 0 ? parseAllTranscripts(paths) : null;

  // Always prefer fresh transcript parse; fall back to run.spent if no transcripts found
  const spent = parsed?.total ?? (run.spent > 0 ? run.spent : null);
  if (spent === null) return null;

  // Always use parsed model breakdown (Stop hook doesn't capture it)
  const modelBreakdown = parsed?.byModel ?? run.modelBreakdown ?? null;
  const thinking = parseThinkingFromTranscripts(paths);

  // Model switch detection: only on primary transcript (user-initiated switches)
  const primaryPath = findTranscript(run.sessionId, projectDir);
  const { switches: modelSwitches } = primaryPath
    ? parseModelSwitches(primaryPath)
    : { switches: 0 };

  // Distinct model families across ALL transcripts (includes subagents)
  const families = new Set(
    Object.keys(parsed?.byModel ?? {})
      .map(modelFamily)
      .filter((f) => f !== 'unknown')
  );
  const distinctModels = families.size;

  return {
    spent,
    modelBreakdown,
    thinkingInvocations: thinking?.thinkingInvocations ?? 0,
    thinkingTokens: thinking?.thinkingTokens ?? 0,
    modelSwitches,
    distinctModels,
  };
}
