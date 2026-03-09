# TokenGolf — CLAUDE.md

You are working on **TokenGolf**, a CLI game that gamifies Claude Code sessions by turning token/dollar efficiency into a score. This is the primary project context file. Read this fully before doing anything.

---

## What TokenGolf Is

A Node.js CLI tool that wraps Claude Code sessions with game mechanics. Users declare a quest ("implement pagination for /users"), set a budget ($0.30), pick a model class, then work in Claude Code normally. At the end, they get a score based on how efficiently they used their budget.

**Core insight**: Claude Code already exposes session cost data. TokenGolf adds the game layer — the meaning, the stakes, the achievement system — on top of data that already exists.

**Tagline**: *"Flow mode tracks you. Roguelike mode trains you."*

---

## Two Modes

### Flow Mode
- Passive. No interruption. Just runs in the background.
- SessionStart hook auto-creates a flow run if none is active.
- Post-session: `tokengolf win` shows score + achievements with no pre-configuration.
- For people in flow state who don't want friction.

### Roguelike Mode
- Intentional. Pre-commitment before session starts.
- Declare quest + budget + model class = a "run" with real stakes.
- Budget bust = permadeath. Run logged as a death.
- Floor structure: Write code → Write tests → Fix tests → Code review → PR merged (BOSS)
- For deliberate practice. Trains prompting skills.

**Relationship**: Same engine, same data, same achievement system. Roguelike practice makes Flow sessions better over time. That's the meta loop.

---

## Game Mechanics

### Model as Character Class
| Class | Model | Difficulty | Feel |
|-------|-------|------------|------|
| 🏹 Rogue | Haiku | Hard | Glass cannon. Must prompt precisely. |
| ⚔️ Fighter | Sonnet | Normal | Balanced. The default run. |
| 🧙 Warlock | Opus | Easy | Powerful but expensive. |

### Budget Tiers
| Tier | Spend | Emoji |
|------|-------|-------|
| Diamond | < $0.10 | 💎 |
| Gold | < $0.30 | 🥇 |
| Silver | < $1.00 | 🥈 |
| Bronze | < $3.00 | 🥉 |
| Reckless | > $3.00 | 💸 |

### Efficiency Ratings
| Rating | Budget Used | Color |
|--------|------------|-------|
| LEGENDARY | < 25% | magenta |
| EFFICIENT | < 50% | cyan |
| SOLID | < 75% | green |
| CLOSE CALL | < 100% | yellow |
| BUSTED | > 100% | red |

### Achievements
- 💎 Diamond — Haiku under $0.10
- 🥇 Gold — Completed with Haiku
- 🥈 Silver — Completed with Sonnet
- 🥉 Bronze — Completed with Opus
- 🎯 Sniper — Under 25% of budget used
- ⚡ Efficient — Under 50% of budget used
- 🪙 Penny Pincher — Total spend under $0.10
- 🏹 Frugal — Haiku handled ≥50% of session cost
- 🎲 Rogue Run — Haiku handled ≥75% of session cost

---

## Tech Stack

- **Runtime**: Node.js (ESM, `"type": "module"`)
- **Build**: esbuild (JSX transform, `npm run build` → `dist/cli.js`)
- **TUI**: [Ink v5](https://github.com/vadimdemedes/ink) + [@inkjs/ui v2](https://github.com/vadimdemedes/ink-ui)
- **CLI parsing**: Commander.js
- **Persistence**: JSON files in `~/.tokengolf/` (no native deps, zero compilation)
- **Claude Code integration**: Hooks via `~/.claude/settings.json`
- **Language**: JavaScript (no TypeScript — keep it simple)

### Build pipeline
Source is JSX (`src/`) → esbuild bundles to `dist/cli.js`. The `bin` in `package.json` points to `dist/cli.js`. Run `npm run build` after any source change. `prepare` runs build automatically on `npm link`/`npm install`.

**Do not test with `node src/cli.js`** — use `node dist/cli.js` or `tokengolf` after `npm link`.

### Why JSON not SQLite
`better-sqlite3` requires native compilation which causes install failures. JSON files in `~/.tokengolf/` are sufficient for the data volume (hundreds of runs max) and have zero friction.

---

## Project Structure

```
tokengolf/
├── src/
│   ├── cli.js                    # Main entrypoint, all commands
│   ├── components/
│   │   ├── StartRun.js           # Quest declaration wizard
│   │   ├── ActiveRun.js          # Live run status display
│   │   ├── ScoreCard.js          # End-of-run screen (win/death)
│   │   └── StatsView.js          # Career stats dashboard
│   └── lib/
│       ├── state.js              # Read/write ~/.tokengolf/current-run.json
│       ├── store.js              # Read/write ~/.tokengolf/runs.json
│       ├── score.js              # Tiers, ratings, model classes, achievements
│       ├── cost.js               # Auto-detect cost from ~/.claude/ transcripts
│       └── install.js            # Patches ~/.claude/settings.json with hooks
├── hooks/
│   ├── session-start.js          # Injects run context; auto-creates flow run
│   ├── session-stop.js           # Captures exact cost from Stop event
│   ├── post-tool-use.js          # Tracks tool calls, fires budget warnings
│   └── user-prompt-submit.js     # Counts prompts, fires 50% nudge
├── dist/
│   └── cli.js                    # Built output (gitignored? check .gitignore)
├── CLAUDE.md                     # This file
├── package.json
└── README.md
```

---

## State Files (in `~/.tokengolf/`)

### `current-run.json`
Active run state. Written by `tokengolf start` or auto-created by SessionStart hook (flow mode). Cleared on `tokengolf win` or `tokengolf bust`.

```json
{
  "id": "run_1741345200000",
  "quest": "implement pagination for /users",
  "model": "claude-sonnet-4-6",
  "budget": 0.30,
  "spent": 0.11,
  "status": "active",
  "mode": "roguelike",
  "floor": 2,
  "totalFloors": 5,
  "promptCount": 8,
  "totalToolCalls": 14,
  "toolCalls": { "Read": 6, "Edit": 4, "Bash": 4 },
  "sessionId": "abc123",
  "cwd": "/Users/me/projects/my-app",
  "sessionCount": 1,
  "fainted": false,
  "compactionEvents": [],
  "thinkingInvocations": 0,
  "thinkingTokens": 0,
  "startedAt": "2026-03-07T10:00:00Z"
}
```

Flow mode runs have `"quest": null, "budget": null, "mode": "flow"`.

### `runs.json`
Array of all completed runs. Append-only.

```json
[
  {
    "id": "run_1741345200000",
    "quest": "...",
    "status": "won",
    "spent": 0.18,
    "budget": 0.30,
    "model": "claude-sonnet-4-6",
    "modelBreakdown": { "claude-sonnet-4-6": 0.15, "claude-haiku-4-5-20251001": 0.03 },
    "achievements": [...],
    "startedAt": "...",
    "endedAt": "..."
  }
]
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `tokengolf start` | Declare quest, model, budget — begin a roguelike run |
| `tokengolf status` | Show live status of current run |
| `tokengolf win` | Complete current run (auto-detects cost from transcripts) |
| `tokengolf win --spent 0.18` | Complete with manually specified cost |
| `tokengolf bust` | Mark run as budget busted (permadeath) |
| `tokengolf scorecard` | Show last run's score card |
| `tokengolf stats` | Career stats dashboard |
| `tokengolf install` | Patch `~/.claude/settings.json` with hooks |

---

## Claude Code Hooks

Six hooks in `hooks/` directory, installed via `tokengolf install`. Most complete in < 5s (synchronous JSON I/O). `session-end.js` uses async dynamic imports with a 30s timeout.

### `SessionStart` (`session-start.js`)
- Does NOT read stdin (SessionStart doesn't pipe data)
- Reads `current-run.json`; if no active run, auto-creates a flow mode run
- Auto-detects `effort` from env var or `~/.claude/settings.json`; auto-detects `fastMode` from settings.json
- Increments `sessionCount` on existing runs
- Outputs `additionalContext` injected into Claude's conversation

### `PostToolUse` (`post-tool-use.js`)
- Reads stdin (event JSON with `tool_name`)
- Updates `toolCalls` count in `current-run.json`
- At 80%+ budget: outputs `systemMessage` warning to Claude

### `UserPromptSubmit` (`user-prompt-submit.js`)
- Increments `promptCount`
- At 50% budget: injects halfway nudge as `additionalContext`

### `PreCompact` (`pre-compact.js`)
- Reads stdin (compact event JSON with `trigger` and `context_window.used_percentage`)
- Appends to `compactionEvents` array in `current-run.json`
- Powers gear achievements (Ghost Run, Ultralight, Traveling Light, Overencumbered)

### `SessionEnd` (`session-end.js`)
- Reads stdin for `reason` field (detects Fainted if reason is `'other'`)
- Calls `autoDetectCost(run)` — returns spent, modelBreakdown, thinkingInvocations, thinkingTokens
- Resting runs: updates state with fainted:true, does NOT clear — run continues next session
- Won/died runs: calls `saveRun()` (which runs `calculateAchievements()`), clears state, renders ANSI scorecard

### `StatusLine` (`statusline.sh`)
- Bash script; uses `TG_SESSION_JSON=... python3 - "$STATE_FILE" <<'PYEOF'` pattern to avoid heredoc/stdin conflict
- Receives live session JSON (cost, context %, model) via stdin
- Shows: quest/mode | tier emoji + cost [/budget pct%] | [efficiency rating] | [🪶/🎒/📦 ctx%] | model label | [floor]
- Context load: 🪶 green (50–74%), 🎒 yellow (75–89%), 📦 red (90%+); hidden below 50%
- Separator lines (`───────────────`) above and below HUD row
- statusLine config must be an object: `{type:"command", command:"...statusline.sh", padding:1}`

### Hook installation
`tokengolf install` patches `~/.claude/settings.json`. Uses `fs.realpathSync(process.argv[1])` to resolve npm link symlinks to real hook paths. Hook entries tagged with `_tg: true` for reliable dedup. Non-destructive statusLine install: wraps existing statusline if one is configured.

---

## Cost Detection (`src/lib/cost.js`)

`autoDetectCost(run)` is called by `session-end.js` and `tokengolf win/bust`. It:
1. Parses `~/.claude/projects/<cwd>/` transcript files — all `.jsonl` files modified since `run.startedAt`
2. Scans ALL files (not just the main session) — this captures subagent sidechain files where Haiku usage lives
3. Also calls `parseThinkingFromTranscripts(paths)` to count thinking blocks and estimate tokens
4. Returns `{ spent, modelBreakdown, thinkingInvocations, thinkingTokens }`

`process.cwd()` is used (not `run.cwd`) because the user always runs `tokengolf win` from their project directory.

Thinking tokens are estimated from character count ÷ 4 (approximate — displayed with `~` prefix). Invocations = assistant turns containing at least one `{"type":"thinking"}` content block.

---

## Key Design Decisions

1. **SessionEnd hook is authoritative** — Replaces the dead Stop hook (Stop event didn't include `total_cost_usd`). SessionEnd fires on `/exit`, scans transcripts, saves run, and renders ANSI scorecard. `tokengolf win` is a manual override that still works.

2. **Scan all transcripts for multi-model + ultrathink** — Claude Code creates separate `.jsonl` files for subagent sidechains (Haiku usage lives there). Same scan also picks up thinking blocks for ultrathink detection. One pass, all data.

3. **Floors are cosmetic** — Floor structure exists in the data model but isn't enforced. It's a UI element. Full roguelike floor mechanics with per-floor budgets are a future feature.

4. **Flow mode is automatic** — SessionStart hook creates a flow run if none exists. Any Claude Code session is tracked. Just `/exit` and the scorecard appears.

5. **Budget presets are model-calibrated** — `MODEL_BUDGET_TIERS` in score.js defines Diamond/Gold/Silver/Bronze amounts per model class. Wizard calls `getModelBudgets(model)` so Haiku sees $0.15/$0.40/$1.00/$2.50 and Opus sees $2.50/$7.50/$20.00/$50.00. Efficiency ratings (LEGENDARY/EFFICIENT/etc.) still derive as % of whatever budget was committed — no change there.

6. **Ultrathink is natural language, not a slash command** — Writing `ultrathink` in a prompt triggers extended thinking mode. It's tracked via thinking blocks in transcripts, not via any hook. `thinkingInvocations === 0` on a won run = Silent Run achievement; on a died run with invocations > 0 = Hubris (the only death achievement).

7. **Hubris is a death achievement** — `calculateAchievements` normally returns `[]` early for non-won runs. Hubris is the one exception — it fires before the early return. Intentional design: Hubris is a mark of cause-of-death, not a consolation prize.

---

## Current Status: v0.3

### Done
- [x] Full project scaffold with esbuild pipeline
- [x] All CLI commands wired up
- [x] Ink components: StartRun, ActiveRun, ScoreCard, StatsView
- [x] JSON persistence (state.js + store.js)
- [x] Scoring logic (tiers, ratings, achievements, multi-model)
- [x] 6 Claude Code hooks: SessionStart, PostToolUse, UserPromptSubmit, PreCompact, SessionEnd, StatusLine
- [x] `tokengolf install` hook installer with symlink resolution + statusLine config
- [x] Auto cost detection from transcripts (`cost.js`) — multi-file, multi-model
- [x] SessionEnd hook auto-displays ANSI scorecard on /exit; replaces dead Stop hook
- [x] Flow mode auto-tracking (SessionStart creates run if none exists)
- [x] Multi-model breakdown in ScoreCard
- [x] Haiku efficiency achievements (Frugal, Rogue Run)
- [x] Effort level wizard step (Low/Medium/High for Sonnet; +Max for Opus; Haiku skips)
- [x] Fast mode auto-detection from settings.json; tracked in run state
- [x] Fainted / rest mechanic (usage limit hit = fainted, run continues next session)
- [x] Context window % in StatusLine HUD: 🪶/🎒/📦 with green/yellow/red
- [x] PreCompact hook tracks manual vs auto compaction + context % for gear achievements
- [x] Multi-session tracking (sessionCount increments on each SessionStart)
- [x] Model-aware budget presets in wizard (MODEL_BUDGET_TIERS, getModelBudgets)
- [x] Ultrathink detection from transcripts (thinkingInvocations, thinkingTokens)
- [x] 5 ultrathink achievements including Hubris (only death achievement)

### Next up (v0.4)
- [ ] `tokengolf floor` command to advance floor manually
- [ ] Roguelike floor mechanics with per-floor sub-budgets
- [ ] Leaderboard / shareable run URLs
- [ ] Team mode (shared `runs.json` via git)

---

## Working in This Repo

When making changes:
- Keep it ESM (`import/export`, no `require`)
- Ink components are functional React — hooks only, no classes
- State mutations always go through `state.js` and `store.js` — never write to `~/.tokengolf/` directly from components
- Hooks must be fast (< 1s) — no async, no network, JSON file I/O only
- **Always run `npm run build` after source changes**
- Test hooks standalone: `echo '{"tool_name":"Read"}' | node hooks/post-tool-use.js`
- Remember hooks run in a separate process with no access to shell env vars
- Always `process.exit(0)` at the end of hooks

When adding a new CLI command:
1. Add it to `src/cli.js`
2. Add a component in `src/components/` if it needs a TUI
3. Document it in this file and README.md
