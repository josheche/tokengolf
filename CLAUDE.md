# TokenGolf — CLAUDE.md

A CLI game that gamifies Claude Code sessions by turning token/dollar efficiency into a score. Node.js, ESM, Ink v5 TUI, Commander.js, JSON persistence in `~/.tokengolf/`.

---

## One Mode — Every Session Is a Roguelike Run

Every Claude Code session is automatically tracked. No wizard, no upfront budget commitment. The budget (par) scales dynamically with session activity.

**Par budget** = `max(prompts × model_par_rate, model_floor)`. Each prompt adds to your expected cost. Efficient prompts beat par; wasteful prompts fall behind. BUST (>100% of par) = `status: 'died'`, red accent, death achievements.

---

## Installation

**Plugin (recommended)** — one step, auto-updates:
```
claude plugin install tokengolf
```

**npm (alternative)** — requires manual hook setup:
```
npm install -g tokengolf && tokengolf install
```

npm users get auto-sync: hooks update automatically on version change via session-start.js.

## Commands

`npm run build` after source changes. `npm test` after score.js changes. `npm run lint` / `npm run format` for code quality. Husky pre-commit hook runs automatically.

**Do not test with `node src/cli.js`** — use `node dist/cli.js` or `tokengolf` after `npm link`.

| Command | Description |
|---------|-------------|
| `tokengolf scorecard` | Show last run's score card |
| `tokengolf stats` | Career stats dashboard |
| `tokengolf demo [component]` | Show UI demos (all, hud, scorecard, stats) |
| `tokengolf config` | List all config values |
| `tokengolf config emotions [mode]` | Get/set emotion mode (`off`, `emoji`, `ascii`) |
| `tokengolf install` | Patch `~/.claude/settings.json` with hooks |

---

## Par Budget System

Par = the expected cost for a session, scaled by prompts and model.

```
par = max(prompts × model_par_rate, model_floor)
efficiency = actual_cost / par
```

### Model Par Rates

| Model | Par Rate | Floor | Rationale |
|-------|----------|-------|-----------|
| Haiku | $0.20/prompt | $0.50 | ~12× cheaper than Sonnet |
| Sonnet | $2.50/prompt | $3.00 | Calibrated from 62 real sessions |
| Paladin | $6.00/prompt | $8.00 | Opus planning + Sonnet execution blend |
| Opus | $12.50/prompt | $15.00 | ~5× more expensive than Sonnet |

Constants: `MODEL_PAR_RATES`, `MODEL_PAR_FLOORS`, `getParBudget()` in `src/lib/score.js`.

The floor prevents 1-prompt agentic sessions from being instant BUST.

---

## Scoring & Achievements

All tiers, ratings, model classes, par rates, and achievements are defined in `src/lib/score.js`. Read that file for the full catalog — don't duplicate it here.

Key concepts:
- **Model classes**: Rogue (Haiku), Fighter (Sonnet), Warlock (Opus), Paladin (Opus plan mode)
- **Spend tiers**: absolute $ thresholds, model-calibrated (`MODEL_BUDGET_TIERS` / `getModelBudgets()`)
- **Efficiency ratings**: LEGENDARY (<15%) → EPIC (<30%) → PRO → SOLID → CLOSE CALL → BUST (>100%), computed against dynamic par
- **Death marks fire before the early return** in `calculateAchievements` — they're checked before `if (!won) return []`. `indecisive` and `expensive_taste` also fire on won runs.

---

## Claude Code Hooks

Nine hooks in `hooks/`, installed via `tokengolf install`. All are synchronous JSON I/O (< 1s) except `session-end.js` (async imports, 30s timeout).

| Hook | Stdin? | What it does |
|------|--------|-------------|
| `session-start.js` | No | Auto-creates run if none active; detects effort/fastMode; injects `additionalContext` with par budget |
| `session-end.js` | Yes (`reason`) | Authoritative for cost/scorecard. Scans transcripts, saves run, renders ANSI scorecard. Death = spent > par |
| `post-tool-use.js` | Yes (`tool_name`) | Tracks `toolCalls`; fires par warning at 80%+ |
| `post-tool-use-failure.js` | Yes (`tool_name`) | Increments `failedToolCalls` |
| `user-prompt-submit.js` | No | Increments `promptCount`; fires halfway nudge at 50% of par |
| `pre-compact.js` | Yes (`trigger`, `context_window`) | Tracks compaction events for gear achievements |
| `subagent-start.js` | Yes | Increments `subagentSpawns` |
| `stop.js` | Yes | Increments `turnCount` |
| `statusline.sh` | Yes (session JSON) | 2-line HUD with `██` accent bar, par-based progress bar. Also fixes model detection (writes real model back to current-run.json) |

**Plugin distribution**: `plugin/` directory contains the Claude Code plugin scaffold — hooks.json, bundled scripts, slash commands. Build with `npm run build:plugin`. Uses `${CLAUDE_PLUGIN_ROOT}` for paths.

**Hook installation (npm)**: `tokengolf install` resolves npm link symlinks via `fs.realpathSync(process.argv[1])`. Entries tagged `_tg: true` for dedup. Non-destructive statusLine install wraps existing config. Stamps `~/.tokengolf/installed-version` for auto-sync.

**Auto-sync (npm)**: `session-start.js` checks `installed-version` vs `package.json` on every session start. On mismatch, updates all `_tg: true` hook paths and statusLine paths in `~/.claude/settings.json`, then stamps the new version.

**StatusLine gotcha**: Uses `TG_SESSION_JSON=... python3 - "$STATE_FILE" <<'PYEOF'` pattern to avoid heredoc/stdin conflict. Config must be an object: `{type:"command", command:"...statusline.sh", padding:1}`.

**Model detection fix**: `session-start.js` defaults model to `claude-sonnet-4-6`. `statusline.sh` gets the real model from session JSON and writes it back to `current-run.json` if different. This ensures par rates use the correct model.

**Emotion modes** (`tokengolf config emotions <mode>`): `emoji` (default) = mood emoji replaces `⛳` on line 1. `ascii` = adds 3rd line with kaomoji + emotion label. `off` = classic `⛳`/`💤`. Config stored in `~/.tokengolf/config.json`. Emotions are a multi-signal composite: par%, context%, failedToolCalls, promptCount.

---

## Cost Detection (`src/lib/cost.js`)

`autoDetectCost(run)` parses `~/.claude/projects/<cwd>/` transcript files modified since `run.startedAt`. Scans ALL `.jsonl` files (not just main session) to capture subagent sidechain files where Haiku usage lives. Same pass detects thinking blocks for ultrathink tracking.

**Gotcha**: Uses `process.cwd()` not `run.cwd` — user always runs `tokengolf` from their project directory.

---

## Key Design Decisions

1. **SessionEnd is authoritative for cost** — fires on `/exit`, scans transcripts, saves run, renders scorecard. Stop hook only tracks `turnCount`.

2. **Every session is a run** — SessionStart creates a run if none exists. Any Claude Code session is tracked automatically. No wizard, no upfront commitment.

3. **Par budget scales with prompts** — `max(prompts × par_rate, floor)`. The denominator grows as you work. Efficient sessions beat par; wasteful ones bust.

4. **Death is cosmetic** — BUST (>100% of par) = `status: 'died'`, red accent, death achievements. It's a scoring signal, not a hard stop.

5. **Ultrathink is natural language** — writing "ultrathink" in a prompt triggers extended thinking. Tracked via transcript parsing, not hooks.

6. **Design D: `██` block accent, no right borders** — eliminates emoji/unicode width misalignment across terminals. Yellow = won, red = died, gray = neutral. Ink: custom `borderStyle` with `borderRight/Top/Bottom={false}`, `paddingLeft={3}`. ANSI scorecard: `██` prefix + `─` separators.

---

## Working in This Repo

- Keep it ESM (`import/export`, no `require`)
- Ink components are functional React — hooks only, no classes
- State mutations go through `state.js` and `store.js` — never write to `~/.tokengolf/` directly
- Hooks must be fast (< 1s), sync, end with `process.exit(0)` (except session-end.js)
- Hooks run in a separate process with no access to shell env vars
- Test hooks standalone: `echo '{"tool_name":"Read"}' | node hooks/post-tool-use.js`
- **Always `npm run build` after source changes**
- **Always `npm test` after score.js changes**

When adding a new CLI command:
1. Add to `src/cli.js`
2. Add component in `src/components/` if it needs a TUI
3. Update this file and README.md
