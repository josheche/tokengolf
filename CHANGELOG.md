# Changelog

TokenGolf patch notes — what changed, what it measures, and why the mechanic exists.

---

## [Unreleased]

### Changed
- **Sublinear par scaling (sqrt)** — Par formula changed from `prompts × rate` to `rate × sqrt(prompts)`. Early prompts have headroom for exploration; pressure builds as the session goes on. Long wasteful sessions bust. Rates recalibrated: Haiku $0.55, Sonnet $7.00, Paladin $22.00, Opus $45.00. Floors unchanged. All models bust around 20 prompts at typical per-prompt spend.
- **Design D HUD** — StatusLine HUD redesigned with `██` accent bar, inline `▓░` progress bars for budget and context, no separator lines. 1 line when context <50%, 2 lines when context visible. Accent bar turns red when budget >75%. Matches Design D across all UI surfaces.
- **Design D block accent UI** — All bordered boxes replaced with left-only `██` block accent bars. Eliminates persistent right-border misalignment caused by emoji/unicode width differences across terminals. Color-coded: yellow for won, red for died, gray for neutral.
- ScoreCard, StatsView, ActiveRun, StartRun components all use custom Ink `borderStyle` with `left: '██'`, no right/top/bottom borders
- session-end.js ANSI scorecard uses `██` prefix per line with `─` horizontal separators
- Achievement badges in StatsView rendered inline (no individual bordered boxes)
- Death tip in ScoreCard rendered as indented text (no bordered box)
- Landing page terminal demos updated to match `██` style
- README screenshots replaced with inline code block demos — no more stale PNGs

### Fixed
- StatusLine HUD effort label now reads exclusively from live `settings.json` — `/model` changes (High, Low, Max) reflect immediately without requiring a new session
- Medium effort no longer shown in HUD or scorecard — it's the default, so it's omitted (same as not annotating Sonnet as "normal difficulty")
- Scorecard `modelSuffix` no longer suppressed effort when stored as 'medium' — effort label now shows whenever explicitly stored in run state

---

## [0.3.x] — 2026-03-09

### New Character Class

**⚜️ Paladin** — Opus running in plan mode. Thinks before it acts. The strategic archetype: slower, more deliberate, higher cost floor than Warlock but more structured output. Budget presets match Opus (same model, different playstyle).

### New Achievements

#### Prompting Skill
These measure *how* you communicate, not just how much. The same task done in 1 prompt vs 20 prompts represents fundamentally different skill levels — and different costs.

- **🥊 One Shot** — Won in a single prompt. The platonic ideal: perfectly specified the problem, Claude solved it, done. Rare on complex tasks. Chasing this forces you to front-load your context instead of iterating.
- **💬 Conversationalist** — 20+ prompts in one run. Not necessarily bad — complex exploratory work takes conversation. But if you're seeing this often, it's a signal to consolidate before prompting.
- **🤐 Terse** — ≤3 prompts, ≥10 tool calls. You said little and Claude did a lot. Strong delegation: clear brief, trusted execution, minimal correction loop.
- **🪑 Backseat Driver** — 15+ prompts, fewer than 1 tool call per prompt. High prompt-to-action ratio. You're steering more than executing — which can indicate under-specified initial prompts or excessive check-ins.
- **🏗️ High Leverage** — 5+ tool calls per prompt (≥2 prompts). Each prompt is producing significant automated work. The agentic sweet spot: you describe intent, Claude handles implementation.

#### Tool Mastery
What you reach for reveals how you think. These reward deliberate tool use and recognize distinct working styles.

- **👁️ Read Only** — Won without a single Edit or Write call. Pure exploration, analysis, or diagnosis. The run existed entirely in understanding — no mutations. Rarer than it sounds on most tasks.
- **🔪 Surgeon** — 1–3 Edit calls, completed under budget. Precise, targeted changes. Found the exact lines, changed them, done. The opposite of spray-and-pray editing.
- **🔍 Scout** — ≥60% of tool calls were Reads (≥5 total). Heavily investigation-weighted run. You understood the codebase before touching it. Good discipline on unfamiliar repos.
- **🐚 Bash Warrior** — 10+ Bash calls, Bash comprising ≥50% of tool usage. Shell-native approach. Either running tests, pipeline commands, or automating things other people would do by hand.
- **✏️ Editor** — 10+ Edit calls. High-edit run — significant code mutation. Normal on large refactors or multi-file features, a flag on simple tasks.
- **🧰 Toolbox** — 5+ distinct tool types used. Broad-spectrum run: read, write, bash, search, web, etc. Signals either a complex task or an exploratory style.

#### Cost per Prompt
Spend ÷ prompts. A ratio that catches two distinct failure modes: prompts that do nothing (low cost, high count) and prompts that burn (high cost, low count).

- **💲 Cheap Shots** — Under $0.01 per prompt (≥3 prompts). Extremely token-efficient per exchange. Either very focused prompts or a very cheap model.
- **🍷 Expensive Taste** — Over $0.50 per prompt (≥3 prompts). Each prompt is generating significant cost. Fine if the output justifies it — a red flag if you're asking simple questions. Fires on both won *and* died runs: it's a burn pattern, not a verdict.

#### Time
Session duration from `startedAt` to `endedAt`. Rewards focus and recognizes sustained work.

- **⏱️ Speedrun** — Won in under 5 minutes. You knew exactly what needed doing and did it. Near-impossible on anything requiring reading, common on small precise fixes.
- **🏃 Marathon** — Session over 60 minutes. Sustained work. Either a genuinely complex task or a sign the session scope crept.
- **🫠 Endurance** — Session over 3 hours. Deep work. Or a debugging session that got away from you.

#### Subagent Tracking *(requires SubagentStart hook)*
Claude Code spawns subagents for parallel work, web fetches, and background tasks. These track whether you're running solo or orchestrating a team.

- **🐺 Lone Wolf** — Completed with zero subagents spawned. Everything stayed in one context, one model, one thread. Surgical and contained.
- **📡 Summoner** — 5+ subagents spawned. Significant orchestration — Claude is delegating work to parallel agents. High leverage, higher cost.
- **🪖 Army of One** — 10+ subagents spawned *and* under 50% budget used. Orchestrated aggressively and stayed efficient. The hardest subagent achievement: scale without spend.

#### Tool Reliability *(requires PostToolUseFailure hook)*
Failed tool calls aren't free — each failure costs tokens to process, explain, and retry. These track reliability under fire.

- **✅ Clean Run** — Zero failed tool calls with ≥5 total tool uses. Every tool call landed. Precise paths, correct syntax, no retries. The floor here is ≥5 total so a 1-tool run doesn't trivially qualify.
- **🐂 Stubborn** — 10+ failed tool calls, still won. Things kept breaking and you kept going. Either a hostile environment (flaky tests, bad paths) or persistence in the face of compounding errors. You won anyway.

#### Turn Discipline *(requires Stop hook)*
`turnCount` tracks how many times Claude responded; `promptCount` tracks your messages. The ratio reveals the agentic depth of each exchange.

- **🤖 Agentic** — 3+ Claude turns per user prompt. Each prompt is triggering multi-step autonomous work — Claude is planning, executing, checking, and continuing without waiting for you. High trust, high autonomy.
- **🐕 Obedient** — Exactly 1 Claude turn per prompt (≥3 prompts). Claude responds once and waits. Very human-paced. Great for exploratory sessions; on automated tasks it may mean Claude isn't being trusted to run.

#### Death Marks
Cause-of-death taxonomy. These fire on bust only — they name what killed the run so the pattern is visible.

- **💥 Blowout** — Spent 2× your committed budget. Didn't just go over — significantly over. Either severe scope creep, a runaway agentic loop, or a fundamentally mis-scoped task.
- **😭 So Close** — Died within 10% of budget. Almost made it. The budget was right, the task was right — execution was slightly off. The most fixable death.
- **🔨 Tool Happy** — Died with 30+ tool calls. High activity, no completion. Signals either a sprawling unfocused approach or a task that needed to be broken into smaller runs.
- **🪦 Silent Death** — Died with ≤2 prompts. Barely started before busting. Usually means the very first prompt triggered something expensive — a large file read, a multi-file edit, an ultrathink call on a tight budget.
- **🤡 Fumble** — Died with 5+ failed tool calls. Errors compounded until the budget ran out. Bad paths, wrong syntax, environment issues — the run became error recovery rather than task completion.

### New Hooks

- **PostToolUseFailure** — Fires after any tool error. Increments `failedToolCalls` in run state. Powers Clean Run, Stubborn, Fumble. 15-line hook; synchronous JSON I/O.
- **SubagentStart** — Fires when Claude spawns a subagent. Increments `subagentSpawns`. Powers Lone Wolf, Summoner, Army of One.
- **Stop** — Fires after each Claude response turn. Increments `turnCount`. Combined with `promptCount` enables turn/prompt ratio achievements.

### Infrastructure
- **Vitest test suite** — 83 tests across all achievements and pure score functions. Catches silent regressions in `calculateAchievements()` — the function is complex enough that edge cases (null budget, missing optional fields, death mark isolation) need explicit coverage.
- **Husky pre-commit** — format:check → lint → build → test. Nothing broken ships.
- **ESLint + Prettier** — flat config, ecmaVersion latest, JSX via espree (no babel), formatOnSave wired to same `.prettierrc` as CI.

---

## [0.3.0] — 2026-02-xx

### Auto Scorecard on Exit

**SessionEnd hook** replaces the manually-triggered `tokengolf win` for clean exits. When you type `/exit` in Claude Code, the hook fires, scans your session transcripts for cost and ultrathink data, determines win/death/faint status, saves the run, and renders the ANSI scorecard directly in the terminal. Zero friction — play, exit, see your score.

The Stop hook (which Claude Code *does* fire) doesn't include `total_cost_usd` in its payload — cost must come from transcript parsing. SessionEnd is authoritative.

### Live HUD

**StatusLine** shows a persistent status line in every Claude Code session after `tokengolf install`:

```
 ───────────────
⛳ implement pagination | 💎 $0.1203/$0.50 24% | LEGENDARY | 🪶 38% | ⚔️ Sonnet·High | Floor 1/5
 ───────────────
```

Context window load is tracked live because it's a real resource that affects how Claude reasons:
- **🪶 green** (50–74%) — traveling light, context is healthy
- **🎒 yellow** (75–89%) — getting heavy, consider your next moves
- **📦 red** (90%+) — overencumbered, compaction imminent or needed

### Fainted / Rest Mechanic

Hitting Claude Code's usage limits mid-run doesn't kill the run — it *faints* it. The run state is preserved with `fainted: true`, the scorecard shows **💤 FAINTED — Run Continues**, and the next session picks up where you left off. `sessionCount` increments each time.

This maps to the real experience: usage limits aren't failure, they're an interruption. The run outcome is determined when you win or bust, not when the context window ends.

### Effort Level

Effort is now a wizard step — selected before the budget. It affects how Claude Code allocates its thinking:
- **Haiku** — skips the step entirely (effort is baked into the model)
- **Sonnet** — Low / Medium (default) / High
- **Opus** — Low / Medium (default) / High / Max

Max effort is Opus-only; the API returns an error on other models. Fast mode (`/fast` in Claude Code) is tracked separately — auto-detected from `~/.claude/settings.json`, not a wizard step.

### Context Window Achievements (Gear)

The PreCompact hook fires before any compaction event and records whether it was manual or automatic, and the context window percentage at the time. This powers four achievements that measure how you manage context load — a real skill that affects both cost and reasoning quality:

- **📦 Overencumbered** — Context auto-compacted during the run. Claude Code had to compact because you didn't. Not necessarily bad on long runs, but a signal on short ones.
- **🎒 Traveling Light** — You manually compacted at ≤50% context. Proactive housekeeping — you cleared context before it became a problem.
- **🪶 Ultralight** — Manual compact at ≤40% context. Aggressive context discipline. You're keeping the working set small deliberately.
- **🥷 Ghost Run** — Manual compact at ≤30% context. Surgical context management. The context barely registered before you cleared it.

### Effort & Fast Mode Achievements

- **🏎️ Speedrunner** — Low effort, completed under budget. You dialed back Claude's thinking and still shipped. Efficiency through restraint.
- **🏋️ Tryhard** — High or Max effort, LEGENDARY efficiency (<25% budget used). You ran expensive settings and still came in way under. The skill ceiling achievement for roguelike mode.
- **👑 Archmagus** — Opus at Max effort, completed. You ran the most expensive possible configuration and finished. No efficiency requirement — just completion.
- **⛈️ Lightning Run** — Opus fast mode, completed under budget. Fast mode roughly doubles cost per token. Finishing under budget requires either a very generous budget or very focused prompting.
- **🎰 Daredevil** — Opus fast mode, LEGENDARY efficiency. 2× cost model, <25% budget used. The rarest fast mode achievement.

### Rest & Recovery Achievements

- **🔥 No Rest for the Wicked** — Completed in a single session without fainting. Clean run start to finish.
- **🏕️ Made Camp** — Completed across multiple sessions. You hit limits, rested, came back. The run survived the interruption.
- **🧟 Came Back** — Fainted at least once and still won. Specifically marks the resilience: the run was interrupted by the usage limit and you finished it anyway.

### Ultrathink

`ultrathink` is not a slash command. Write the word in natural language — *"ultrathink: is this the right architecture?"* or *"can you ultrathink through the tradeoffs?"* — and Claude activates extended thinking mode with a large token budget.

Extended thinking tokens bill at full output rate. A single ultrathink on Sonnet can cost $0.50–2.00 depending on depth. The mechanic creates a genuine in-session decision: **do I burn tokens thinking, or do I trust my instincts and try?** Budget pressure makes that choice real.

Detection: thinking blocks appear in session JSONL transcripts as `{"type":"thinking"}` content blocks. `parseThinkingFromTranscripts()` scans all session files (same multi-file scan used for cost), counts invocations (assistant turns with at least one thinking block), and estimates tokens from character count ÷ 4. Shown on the scorecard with a `~` prefix to be honest about the approximation.

Achievements:
- **🔮 Spell Cast** — Used extended thinking and won. Informational — marks that ultrathink was in play.
- **🧮 Calculated Risk** — Ultrathink + LEGENDARY efficiency (<25% budget). You paid for deep thinking and came in well under. The ideal outcome: the thinking paid off.
- **🌀 Deep Thinker** — 3+ ultrathink invocations, completed under budget. Committed to the approach across multiple moments. Each invocation was a deliberate bet.
- **🤫 Silent Run** — Won with zero ultrathink at SOLID or better efficiency. Pure prompting discipline. You solved it without reaching for the spell. A counterweight to Spell Cast — the game rewards both using ultrathink well *and* not needing it.
- **🤦 Hubris** *(death mark)* — Used ultrathink and busted anyway. The spell didn't save you. Hubris is the only achievement that fires on a lost run — it names the cause of death. You reached for expensive thinking on a tight budget and paid for it.

### Model-Aware Budget Presets

The original budget tiers ($0.10 / $0.30 / $1.00 / $3.00) were model-agnostic. A $0.10 Diamond budget on Opus is instant death in one prompt. The same $0.10 on Haiku is a reasonable small task. The tiers had no relationship to actual model economics.

New presets calibrated to each class, anchored to ~$0.75/task Sonnet average from Anthropic's $6/day Claude Code benchmark:

| Tier | Haiku 🏹 | Sonnet ⚔️ | Opus 🧙 |
|------|---------|---------|--------|
| 💎 Diamond | $0.15 | $0.50 | $2.50 |
| 🥇 Gold | $0.40 | $1.50 | $7.50 |
| 🥈 Silver | $1.00 | $4.00 | $20.00 |
| 🥉 Bronze | $2.50 | $10.00 | $50.00 |

The efficiency ratings (LEGENDARY/EFFICIENT/SOLID/CLOSE CALL/BUSTED) still derive as percentages of whatever you commit to — same relative challenge at every tier, different absolute cost.

---

## [0.2.0] — 2026-01-xx

### Multi-Model Cost Tracking

Claude Code uses multiple models in a single session: Sonnet for main tasks, Haiku for subagents and background work. Haiku usage lives in *separate* `.jsonl` files — subagent sidechains — not the main session transcript. Cost detection now scans all `.jsonl` files modified since `run.startedAt`, capturing the full picture.

This unlocked the first multi-model achievements:
- **🏹 Frugal** — Haiku handled ≥50% of session cost. The session was more Haiku than Sonnet by spend. Signals heavy subagent use or deliberate model-mixing.
- **🎲 Rogue Run** — Haiku handled ≥75% of session cost. Haiku dominated. Extremely subagent-heavy, or you ran Haiku as primary and kept Sonnet minimal.

Both achievements reward a real behavior: letting cheaper models do the work. The multi-model breakdown appears on every scorecard.

### Flow Mode Auto-Tracking

Before this, you had to run `tokengolf start` to begin tracking. Now the SessionStart hook checks for an active run on every Claude Code session open — if none exists, it auto-creates a flow mode run (no quest, no budget). Any Claude Code session is automatically tracked. Just `/exit` and the scorecard appears.

### esbuild Pipeline

Node.js can't parse JSX natively. Added esbuild: `src/` is JSX source, `dist/cli.js` is the bundled output. `npm run build` wires it; `prepare` script ensures it rebuilds on `npm link` / `npm install`. The `bin` in package.json points to `dist/cli.js`.

### Fixed

- **Hook symlink resolution** — `npm link` installs hooks with wrong paths because `process.argv[1]` returns the symlink location. Fixed with `fs.realpathSync()` to follow symlinks to real paths. Added `_tg: true` marker on hook entries so re-running `tokengolf install` deduplicates cleanly.
- **SessionStart stdin hang** — Hook was trying to read stdin. SessionStart doesn't pipe any data. Rewrote to be synchronous, no stdin read.
- **Wrong-session cost reads** — `autoDetectCost` was using `run.cwd` (the directory where the hook fired) instead of `process.cwd()` (where the user runs `tokengolf win`). During development, this caused it to read the tokengolf dev session ($9.41) instead of the target project ($0.49).

---

## [0.1.0] — 2026-01-xx

### Initial Release

The core game loop: declare a quest, commit to a budget, pick a character class, work in Claude Code normally, get a score.

**Character classes** map models to difficulty archetypes:
- 🏹 **Rogue** (Haiku) — Hard. Glass cannon. Low cost ceiling means precision is mandatory.
- ⚔️ **Fighter** (Sonnet) — Normal. Balanced cost and capability. The default run.
- 🧙 **Warlock** (Opus) — Easy. Powerful but expensive. The safety net class.

**Budget tiers** are the commitment layer — you declare a bust threshold before starting:
- 💎 Diamond / 🥇 Gold / 🥈 Silver / 🥉 Bronze / ✏️ Custom

**Efficiency ratings** derive as percentage of committed budget used:
- 🌟 LEGENDARY (<25%) / ⚡ EFFICIENT (<50%) / ✓ SOLID (<75%) / 😅 CLOSE CALL (<100%) / 💀 BUSTED (>100%)

**Spend tiers** reflect absolute cost regardless of budget:
- 💎 <$0.10 / 🥇 <$0.30 / 🥈 <$1.00 / 🥉 <$3.00 / 💸 >$3.00

**Base achievements:**
- 💎 **Diamond** — Total spend under $0.10. Absolute cost floor. Model-agnostic.
- 🥇 **Gold** — Completed with Haiku. You chose the hard class and finished.
- 🥈 **Silver** — Completed with Sonnet. The baseline completion mark.
- 🥉 **Bronze** — Completed with Opus. You had the safety net and still shipped.
- 🎯 **Sniper** — Under 25% of budget used. Came in well under commitment. Either great scope estimation or very efficient execution.
- ⚡ **Efficient** — Under 50% of budget used. Healthy margin. The run was right-sized.
- 🪙 **Penny Pincher** — Total spend under $0.10 on any class. Absolute frugality regardless of what you committed to.

**Hooks installed via `tokengolf install`:**
- `SessionStart` — Injects quest/budget/floor context into Claude's conversation at session open
- `PostToolUse` — Tracks tool usage by type; fires budget warning message to Claude at 80%
- `UserPromptSubmit` — Counts prompts; injects halfway nudge at 50% budget

**Two modes from day one:**
- **Flow** — No pre-commitment. Auto-tracked. Just work and see what you spent.
- **Roguelike** — Pre-commit quest + budget + class. Bust = permadeath. Deliberate practice mode.
