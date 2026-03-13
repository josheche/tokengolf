# TokenGolf — CLAUDE.md

A CLI game that gamifies Claude Code sessions by turning token/dollar efficiency into a score. Node.js, ESM, Ink v5 TUI, Commander.js, JSON persistence in `~/.tokengolf/`.

---

## Two Modes

**Flow Mode** — Passive. SessionStart hook auto-creates a run. Just `/exit` and see your scorecard. No pre-configuration.

**Roguelike Mode** — Intentional. Declare quest + budget + model class before starting. Budget bust = permadeath.

Same engine, same achievements. Roguelike practice makes Flow sessions better over time.

---

## Commands

`npm run build` after source changes. `npm test` after score.js changes. `npm run lint` / `npm run format` for code quality. Husky pre-commit hook runs automatically.

**Do not test with `node src/cli.js`** — use `node dist/cli.js` or `tokengolf` after `npm link`.

| Command | Description |
|---------|-------------|
| `tokengolf start` | Declare quest, model, budget — begin a roguelike run |
| `tokengolf status` | Show current run status |
| `tokengolf win` | Complete run (auto-detects cost from transcripts) |
| `tokengolf win --spent 0.18` | Complete with manually specified cost |
| `tokengolf bust` | Mark run as budget busted (permadeath) |
| `tokengolf floor` | Advance to next floor |
| `tokengolf scorecard` | Show last run's score card |
| `tokengolf stats` | Career stats dashboard |
| `tokengolf demo [component]` | Show UI demos (all, hud, scorecard, active, stats) |
| `tokengolf config` | List all config values |
| `tokengolf config emotions [mode]` | Get/set emotion mode (`off`, `emoji`, `ascii`) |
| `tokengolf install` | Patch `~/.claude/settings.json` with hooks |

---

## Scoring & Achievements

All tiers, ratings, model classes, budget presets, and achievements are defined in `src/lib/score.js`. Read that file for the full catalog — don't duplicate it here.

Key concepts:
- **Model classes**: Rogue (Haiku), Fighter (Sonnet), Warlock (Opus), Paladin (Opus plan mode)
- **Budget presets are model-calibrated**: `MODEL_BUDGET_TIERS` / `getModelBudgets()` in score.js
- **Efficiency ratings**: LEGENDARY (<25%) → EFFICIENT → SOLID → CLOSE CALL → BUSTED (>100%)
- **Death marks fire before the early return** in `calculateAchievements` — they're checked before `if (!won) return []`. `indecisive` and `expensive_taste` also fire on won runs.

---

## Claude Code Hooks

Nine hooks in `hooks/`, installed via `tokengolf install`. All are synchronous JSON I/O (< 1s) except `session-end.js` (async imports, 30s timeout).

| Hook | Stdin? | What it does |
|------|--------|-------------|
| `session-start.js` | No | Auto-creates flow run if none active; detects effort/fastMode; injects `additionalContext` |
| `session-end.js` | Yes (`reason`) | Authoritative for cost/scorecard. Scans transcripts, saves run, renders ANSI scorecard |
| `post-tool-use.js` | Yes (`tool_name`) | Tracks `toolCalls`; fires budget warning at 80%+ |
| `post-tool-use-failure.js` | Yes (`tool_name`) | Increments `failedToolCalls` |
| `user-prompt-submit.js` | No | Increments `promptCount`; fires halfway nudge at 50% |
| `pre-compact.js` | Yes (`trigger`, `context_window`) | Tracks compaction events for gear achievements |
| `subagent-start.js` | Yes | Increments `subagentSpawns` |
| `stop.js` | Yes | Increments `turnCount` |
| `statusline.sh` | Yes (session JSON) | 2-line HUD with `██` accent bar, budget/context progress bars. Emotion mode adds mood feedback (see below) |

**Hook installation**: `tokengolf install` resolves npm link symlinks via `fs.realpathSync(process.argv[1])`. Entries tagged `_tg: true` for dedup. Non-destructive statusLine install wraps existing config.

**StatusLine gotcha**: Uses `TG_SESSION_JSON=... python3 - "$STATE_FILE" <<'PYEOF'` pattern to avoid heredoc/stdin conflict. Config must be an object: `{type:"command", command:"...statusline.sh", padding:1}`.

**Emotion modes** (`tokengolf config emotions <mode>`): `emoji` (default) = mood emoji replaces `⛳` on line 1. `ascii` = adds 3rd line with kaomoji + emotion label. `off` = classic `⛳`/`💤`. Config stored in `~/.tokengolf/config.json`. Emotions are a multi-signal composite: budget%, context%, failedToolCalls, promptCount. Flow mode (no budget) skips budget checks.

---

## Cost Detection (`src/lib/cost.js`)

`autoDetectCost(run)` parses `~/.claude/projects/<cwd>/` transcript files modified since `run.startedAt`. Scans ALL `.jsonl` files (not just main session) to capture subagent sidechain files where Haiku usage lives. Same pass detects thinking blocks for ultrathink tracking.

**Gotcha**: Uses `process.cwd()` not `run.cwd` — user always runs `tokengolf win` from their project directory.

---

## Key Design Decisions

1. **SessionEnd is authoritative for cost** — fires on `/exit`, scans transcripts, saves run, renders scorecard. `tokengolf win` is a manual override. Stop hook only tracks `turnCount`.

2. **Flow mode is automatic** — SessionStart creates a run if none exists. Any Claude Code session is tracked.

3. **Floors are cosmetic** — exist in data model but not enforced. Per-floor budgets are a future feature.

4. **Ultrathink is natural language** — writing "ultrathink" in a prompt triggers extended thinking. Tracked via transcript parsing, not hooks.

5. **Design D: `██` block accent, no right borders** — eliminates emoji/unicode width misalignment across terminals. Yellow = won, red = died, gray = neutral. Ink: custom `borderStyle` with `borderRight/Top/Bottom={false}`, `paddingLeft={3}`. ANSI scorecard: `██` prefix + `─` separators.

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
