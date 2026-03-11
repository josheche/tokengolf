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
| 🏹 Rogue | Haiku | Nightmare | Glass cannon. Must prompt precisely. |
| ⚔️ Fighter | Sonnet | Standard | Balanced. The default run. |
| 🧙 Warlock | Opus | Casual | Powerful but expensive. |
| ⚜️ Paladin | Opus (plan mode) | Tactical | Strategic planner. Thinks before acting. |

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

**Class Medals**
- 🥇 Gold — Completed with Haiku
- 💎 Diamond — Haiku under $0.10
- 🥈 Silver — Completed with Sonnet
- ⚜️ Paladin — Completed as Paladin (Opus plan mode)
- ♟️ Grand Strategist — LEGENDARY efficiency as Paladin
- 🥉 Bronze — Completed with Opus

**Budget Efficiency**
- 🎯 Sniper — Under 25% of budget used
- ⚡ Efficient — Under 50% of budget used
- 🪙 Penny Pincher — Total spend under $0.10

**Effort-Based**
- 🏎️ Speedrunner — Low effort, completed under budget
- 🏋️ Tryhard — High/Max effort, LEGENDARY efficiency
- 👑 Archmagus — Opus at max effort, completed

**Fast Mode (Opus-only)**
- ⛈️ Lightning Run — Opus fast mode, completed under budget
- 🎰 Daredevil — Opus fast mode, LEGENDARY efficiency

**Sessions**
- 🔥 No Rest for the Wicked — Completed in one session
- 🏕️ Made Camp — Completed across multiple sessions
- 🧟 Came Back — Fainted and finished anyway

**Gear (Compaction)**
- 📦 Overencumbered — Context auto-compacted during run
- 🥷 Ghost Run — Manual compact at ≤30% context
- 🪶 Ultralight — Manual compact at 31–40% context
- 🎒 Traveling Light — Manual compact at 41–50% context

**Ultrathink**
- 🔮 Spell Cast — Used extended thinking (won)
- 🧮 Calculated Risk — Ultrathink + LEGENDARY efficiency
- 🌀 Deep Thinker — ≥3 ultrathink invocations, completed
- 🤫 Silent Run — No extended thinking, SOLID or better, completed

**Paladin Planning Ratio**
- 🏛️ Architect — Opus handled >60% of cost (heavy planner)
- 💨 Blitz — Opus handled <25% of cost (light plan, fast execution)
- ⚖️ Equilibrium — Opus/Sonnet balanced at 40–60%

**Model Loyalty (non-Paladin)**
- 🔷 Purist — Single model family throughout
- 🦎 Chameleon — Multiple model families used, under budget
- 🔀 Tactical Switch — Exactly 1 model switch, under budget
- 🔒 Committed — No switches, one model family
- ⚠️ Class Defection — Declared one class but cost skewed to another

**Haiku Efficiency**
- 🏹 Frugal — Haiku handled ≥50% of session cost
- 🎲 Rogue Run — Haiku handled ≥75% of session cost

**Prompting Skill**
- 🥊 One Shot — Completed in a single prompt
- 💬 Conversationalist — ≥20 prompts
- 🤐 Terse — ≤3 prompts, ≥10 tool calls
- 🪑 Backseat Driver — ≥15 prompts, <1 tool call per prompt
- 🏗️ High Leverage — ≥5 tools per prompt (≥2 prompts)

**Tool Mastery**
- 👁️ Read Only — No Edit or Write calls (≥1 Read)
- ✏️ Editor — ≥10 Edit calls
- 🐚 Bash Warrior — ≥10 Bash calls, ≥50% of tool usage
- 🔍 Scout — ≥60% Read calls (≥5 total)
- 🔪 Surgeon — 1–3 Edit calls, completed under budget
- 🧰 Toolbox — ≥5 distinct tool types used

**Cost per Prompt**
- 💲 Cheap Shots — Under $0.01 per prompt (≥3 prompts)
- 🍷 Expensive Taste — Over $0.50 per prompt (≥3 prompts; also a death mark)

**Time**
- ⏱️ Speedrun — Completed in under 5 minutes
- 🏃 Marathon — Session 60–180 minutes
- 🫠 Endurance — Session over 3 hours

**Tool Reliability**
- ✅ Clean Run — Zero failed tool calls (≥5 total tool uses)
- 🐂 Stubborn — ≥10 failed tool calls, still won

**Subagents**
- 🐺 Lone Wolf — No subagents spawned
- 📡 Summoner — ≥5 subagents spawned
- 🪖 Army of One — ≥10 subagents, under 50% budget used

**Turn Discipline**
- 🤖 Agentic — ≥3 Claude turns per user prompt
- 🐕 Obedient — Exactly 1 turn per prompt (≥3 prompts)

**Death Marks** *(fire before won-only cutoff; some also fire on won runs)*
- 🎲 Indecisive — ≥3 model switches *(won or died)*
- 🤦 Hubris — Used ultrathink, busted anyway
- 💥 Blowout — Spent ≥2× budget
- 😭 So Close — Died within 10% of budget
- 🔨 Tool Happy — Died with ≥30 tool calls
- 🪦 Silent Death — Died with ≤2 prompts
- 🤡 Fumble — Died with ≥5 failed tool calls
- 🍷 Expensive Taste — Over $0.50/prompt *(won or died)*

---

## Tech Stack

- **Runtime**: Node.js (ESM, `"type": "module"`)
- **Build**: esbuild (JSX transform, `npm run build` → `dist/cli.js`)
- **TUI**: [Ink v5](https://github.com/vadimdemedes/ink) + [@inkjs/ui v2](https://github.com/vadimdemedes/ink-ui)
- **CLI parsing**: Commander.js
- **Persistence**: JSON files in `~/.tokengolf/` (no native deps, zero compilation)
- **Claude Code integration**: Hooks via `~/.claude/settings.json`
- **Testing**: Vitest (ESM-native, `npm test`)
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
│       ├── install.js            # Patches ~/.claude/settings.json with hooks
│       └── __tests__/
│           └── score.test.js     # Vitest: 120 tests covering achievements + pure functions
├── hooks/
│   ├── session-start.js          # Injects run context; auto-creates flow run
│   ├── session-end.js            # Captures cost on /exit; saves run; renders scorecard
│   ├── post-tool-use.js          # Tracks tool calls, fires budget warnings
│   ├── post-tool-use-failure.js  # Tracks failedToolCalls
│   ├── user-prompt-submit.js     # Counts prompts, fires 50% nudge
│   ├── pre-compact.js            # Tracks compaction events for gear achievements
│   ├── subagent-start.js         # Tracks subagentSpawns
│   ├── stop.js                   # Tracks turnCount
│   └── statusline.sh             # Bash HUD shown in Claude Code statusline
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
  "failedToolCalls": 0,
  "subagentSpawns": 2,
  "turnCount": 12,
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

Nine hooks in `hooks/` directory, installed via `tokengolf install`. Most complete in < 5s (synchronous JSON I/O). `session-end.js` uses async dynamic imports with a 30s timeout.

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

### `PostToolUseFailure` (`post-tool-use-failure.js`)
- Reads stdin (event JSON with `tool_name` and error info)
- Increments `failedToolCalls` in `current-run.json`
- Powers Fumble death mark (≥5 failed tool calls)

### `SubagentStart` (`subagent-start.js`)
- Reads stdin (subagent event JSON)
- Increments `subagentSpawns` in `current-run.json`
- Powers Lone Wolf / Summoner / Army of One achievements

### `Stop` (`stop.js`)
- Reads stdin for turn data
- Increments `turnCount` in `current-run.json`
- Powers Agentic / Obedient turn discipline achievements

### `StatusLine` (`statusline.sh`)
- Bash script; uses `TG_SESSION_JSON=... python3 - "$STATE_FILE" <<'PYEOF'` pattern to avoid heredoc/stdin conflict
- Receives live session JSON (cost, context %, model) via stdin
- **Design D accent bar**: `██` prefix on each line, color-coded (yellow normal, red when budget >75%)
- Line 1: `██ ⛳ quest  $cost/budget ▓▓▓░░░ pct%  RATING  model  F1/5`
- Line 2 (optional, when context ≥50%): `██ 🧠 ▓▓▓▓░░░ ctx% 🪶/🎒/📦`
- Budget progress bar: `▓` filled, `░` empty, 11 chars wide. Red when >75%, yellow otherwise
- Context progress bar: `▓░` 10 chars wide. Green (50–74%), yellow (75–89%), red (90%+); hidden below 50%
- Model label: `⚔️ Sonnet`, `⚔️ Sonnet·High`, `🏹 Haiku`, `🧙 Opus·Max`, etc. Effort appended only when explicitly set in settings.json (medium omitted — it's the default)
- 1 line when context <50% (flow mode is often just 1 line), 2 lines when context visible
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

1. **SessionEnd hook is authoritative for cost/scorecard** — SessionEnd fires on `/exit`, scans transcripts, saves run, and renders ANSI scorecard. `tokengolf win` is a manual override that still works. The Stop hook is also active but only for `turnCount` tracking — it does NOT include `total_cost_usd` so it cannot determine final cost.

2. **Scan all transcripts for multi-model + ultrathink** — Claude Code creates separate `.jsonl` files for subagent sidechains (Haiku usage lives there). Same scan also picks up thinking blocks for ultrathink detection. One pass, all data.

3. **Floors are cosmetic** — Floor structure exists in the data model but isn't enforced. It's a UI element. Full roguelike floor mechanics with per-floor budgets are a future feature.

4. **Flow mode is automatic** — SessionStart hook creates a flow run if none exists. Any Claude Code session is tracked. Just `/exit` and the scorecard appears.

5. **Budget presets are model-calibrated** — `MODEL_BUDGET_TIERS` in score.js defines Diamond/Gold/Silver/Bronze amounts per model class. Wizard calls `getModelBudgets(model)` so Haiku sees $0.15/$0.40/$1.00/$2.50 and Opus sees $2.50/$7.50/$20.00/$50.00. Efficiency ratings (LEGENDARY/EFFICIENT/etc.) still derive as % of whatever budget was committed — no change there.

6. **Ultrathink is natural language, not a slash command** — Writing `ultrathink` in a prompt triggers extended thinking mode. It's tracked via thinking blocks in transcripts, not via any hook. `thinkingInvocations === 0` on a won run = Silent Run achievement; on a died run with invocations > 0 = Hubris death mark.

7. **Death marks fire before the early return** — `calculateAchievements` has an `if (!won) return []` early exit, but death marks (blowout, so_close, tool_happy, silent_death, fumble, expensive_taste, hubris) fire before it. `indecisive` (model switches) and `expensive_taste` also fire on won runs — they're behavior patterns, not death verdicts.

8. **Design D: ██ block accent, no right borders** — All UI cards use a left-only `██` block accent bar instead of full box borders. This eliminates persistent right-border misalignment caused by emoji/unicode width calculation differences across terminals. Color-coded: yellow `██` for won, red `██` for died, gray `██` for neutral (stats, wizard). Ink components use a custom `borderStyle` object with `left: '██'` and `borderRight/Top/Bottom={false}`, `paddingLeft={3}`. session-end.js ANSI scorecard uses `██` prefix + `─` horizontal separators. No screenshots — README uses inline code block demos.

---

## Current Status: v0.4

### Done
- [x] Full project scaffold with esbuild pipeline
- [x] All CLI commands wired up
- [x] Ink components: StartRun, ActiveRun, ScoreCard, StatsView
- [x] JSON persistence (state.js + store.js)
- [x] Scoring logic (tiers, ratings, achievements, multi-model)
- [x] 9 Claude Code hooks: SessionStart, PostToolUse, PostToolUseFailure, UserPromptSubmit, PreCompact, SessionEnd, SubagentStart, Stop, StatusLine
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
- [x] 5 ultrathink achievements including Hubris death mark
- [x] Paladin (⚜️ opusplan) character class with model-aware budgets and statusline support
- [x] 28 new achievements: prompting skill, tool mastery, cost/prompt, time, subagents, turn discipline, death marks
- [x] 3 new hooks: PostToolUseFailure, SubagentStart, Stop
- [x] Vitest test suite — 120 tests covering all achievements + pure score functions
- [x] Design D block accent UI — ██ left bar, no right borders, color-coded state
- [x] Landing page terminal demos updated to ██ style
- [x] README inline code block demos (replaced PNG screenshots)

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
- **Run `npm test` after score.js changes** — 83 tests catch achievement regressions
- Test hooks standalone: `echo '{"tool_name":"Read"}' | node hooks/post-tool-use.js`
- Remember hooks run in a separate process with no access to shell env vars
- Always `process.exit(0)` at the end of hooks

When adding a new CLI command:
1. Add it to `src/cli.js`
2. Add a component in `src/components/` if it needs a TUI
3. Document it in this file and README.md
