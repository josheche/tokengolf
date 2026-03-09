# Changelog

All notable changes to TokenGolf are documented here.

---

## [Unreleased]

---

## [0.3.x] — 2026-03-09

### Added
- **Paladin class** (⚜️) — Opus in plan mode, strategic planner character
- **28 new achievements** across 8 categories:
  - Prompting skill: One Shot, Conversationalist, Terse, Backseat Driver, High Leverage
  - Tool mastery: Read Only, Surgeon, Scout, Bash Warrior, Editor, Toolbox
  - Cost/prompt: Cheap Shots, Expensive Taste
  - Time: Speedrun, Marathon, Endurance
  - Subagents: Lone Wolf, Summoner, Army of One (requires SubagentStart hook)
  - Tool reliability: Clean Run, Stubborn (requires PostToolUseFailure hook)
  - Turn discipline: Agentic, Obedient (requires Stop hook)
  - Death marks: Blowout, So Close, Tool Happy, Silent Death, Fumble
- **3 new hooks**: PostToolUseFailure (`failedToolCalls`), SubagentStart (`subagentSpawns`), Stop (`turnCount`)
- **Vitest test suite** — 83 tests covering all achievements and pure score functions (`npm test`)
- **Husky pre-commit hook** — format:check → lint → build → test on every commit
- **ESLint flat config** (`eslint.config.js`) with JSX support, ecmaVersion latest
- **Prettier** (`.prettierrc`) — single quotes, semi, trailing commas, 100-char line width
- **`.vscode/settings.json`** — formatOnSave via prettier, eslint flat config enabled

### Changed
- CLAUDE.md fully updated to reflect current state (was stale since v0.2)

---

## [0.3.0] — 2026-02-xx

### Added
- **SessionEnd hook** (`session-end.js`) — replaces dead Stop hook; fires on `/exit`, scans transcripts, saves run, renders ANSI scorecard automatically. No more manual `tokengolf win` needed for clean exits.
- **StatusLine HUD** (`statusline.sh`) — live cost, tier emoji, efficiency rating, context window %, model class in Claude Code status bar
  - Context load indicators: 🪶 green (50–74%), 🎒 yellow (75–89%), 📦 red (90%+)
  - 💤 fainted state indicator
- **Fainted / rest mechanic** — hitting usage limits sets `fainted: true`, run continues next session; sessionCount increments on resume
- **Effort level wizard step** — Low/Medium/High for Sonnet, +Max for Opus, Haiku skips
- **Fast mode auto-detection** from `~/.claude/settings.json`; tracked in run state
- **PreCompact hook** — tracks manual vs auto compaction + context % for gear achievements
- **Gear achievements**: Overencumbered, Traveling Light, Ultralight, Ghost Run
- **Effort achievements**: Speedrunner, Tryhard, Archmagus
- **Fast mode achievements**: Lightning Run, Daredevil
- **Rest/recovery achievements**: No Rest for the Wicked, Made Camp, Came Back
- **Ultrathink detection** from transcripts — `thinkingInvocations` + `thinkingTokens` (char count ÷ 4, shown with `~` prefix)
- **Ultrathink achievements**: Spell Cast, Calculated Risk, Deep Thinker, Silent Run, Hubris (death mark)
- **Model-aware budget presets** — wizard shows calibrated amounts per class (Haiku: $0.15/$0.40/$1.00/$2.50, Sonnet: $0.50/$1.50/$4.00/$10.00, Opus: $2.50/$7.50/$20.00/$50.00)
- Multi-session tracking (`sessionCount` field)

### Changed
- Hubris is the first death achievement — fires before `if (!won) return` early exit in `calculateAchievements`
- `statusLine` config must be an object `{type:"command", command:..., padding:1}` not a string

### Fixed
- `statusLine` install was wrapping incorrectly on re-runs

---

## [0.2.0] — 2026-01-xx

### Added
- **esbuild pipeline** — `src/` is JSX source, `dist/cli.js` is built output; `npm run build` / `prepare` script
- **Flow mode auto-tracking** — SessionStart hook auto-creates a flow run if none exists
- **Multi-model cost breakdown** — scans ALL `.jsonl` files modified since run start, captures Haiku subagent sidechain files
- **Haiku efficiency achievements**: Frugal (≥50% Haiku cost share), Rogue Run (≥75%)
- Multi-model breakdown displayed in ScoreCard
- Responsive UI

### Changed
- Keyboard input switched from `process.stdin.on('data')` to Ink's `useInput` hook (fixed conflicts)
- `autoDetectCost` uses `process.cwd()` not `run.cwd` (fixes wrong-session cost reads)

### Fixed
- Hook install paths used symlink location instead of real path — fixed with `fs.realpathSync(process.argv[1])`
- SessionStart was hanging trying to read stdin (SessionStart doesn't pipe data)
- TOCTOU patterns (`existsSync` before `readFileSync`) removed across state.js, store.js, hooks
- Dead `db.js` SQLite file deleted
- `store.js` was redefining `STATE_DIR` instead of importing from `state.js`

---

## [0.1.0] — 2026-01-xx

### Added
- Initial scaffold: CLI, Ink TUI components (StartRun, ActiveRun, ScoreCard, StatsView)
- JSON persistence (`~/.tokengolf/current-run.json` + `runs.json`)
- Scoring engine: budget tiers, efficiency ratings, model classes
- 3 hooks: SessionStart, PostToolUse, UserPromptSubmit
- `tokengolf install` — patches `~/.claude/settings.json`
- Base achievements: Diamond, Gold, Silver, Bronze, Sniper, Efficient, Penny Pincher
