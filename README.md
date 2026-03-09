# ⛳ TokenGolf

> Gamify your Claude Code sessions. Flow mode tracks you. Roguelike mode trains you.

Turn Claude Code token efficiency into a game. Declare a quest, set a budget, pick a difficulty class, and work normally. At the end, get a score based on how efficiently you used your budget. Better prompting = lower cost = higher score.

---

<!-- SCREENSHOT: tokengolf start wizard — the quest/model/effort/budget selection flow -->
<!-- Suggested: run `tokengolf start`, pick Sonnet + High effort + $0.30 budget, capture the wizard steps -->

---

## Install

```bash
git clone <repo>
cd tokengolf
npm install
npm link

# Wire up Claude Code hooks
tokengolf install
```

---

## Two Modes

### Flow Mode
Just work. TokenGolf auto-starts a tracking session when you open Claude Code. Run `tokengolf win` at the end to see your score. No pre-commitment required.

### Roguelike Mode
Pre-commit before you start. Declare a quest, pick a model class and effort level, set a budget. Go over budget = permadeath. Deliberate practice that makes Flow sessions better over time.

---

## Commands

```bash
tokengolf start       # declare quest + model + effort + budget, begin a run
tokengolf status      # live run status
tokengolf win         # shipped it ✓ (auto-detects cost from transcripts)
tokengolf bust        # budget exploded (manual override)
tokengolf scorecard   # last run scorecard
tokengolf stats       # career dashboard
tokengolf install     # patch ~/.claude/settings.json with hooks
```

---

## Model Classes

| Class | Model | Effort | Feel |
|-------|-------|--------|------|
| 🏹 Rogue | Haiku | — | Glass cannon. Hard mode. Prompt precisely. |
| ⚔️ Fighter | Sonnet | low / medium / **high** | Balanced. The default run. |
| 🧙 Warlock | Opus | low / medium / high / **max** | Powerful but expensive. |
| ⚡ Warlock·Fast | Opus + fast mode | any | 2× cost. Maximum danger mode. |

`max` effort is Opus-only. Fast mode is toggled with `/fast` in Claude Code.

---

## Scoring

**Budget tiers (total spend):**
| 💎 Diamond | 🥇 Gold | 🥈 Silver | 🥉 Bronze | 💸 Reckless |
|-----------|---------|----------|----------|------------|
| < $0.10 | < $0.30 | < $1.00 | < $3.00 | > $3.00 |

**Efficiency rating (roguelike mode — % of budget used):**
| 🌟 LEGENDARY | ⚡ EFFICIENT | ✓ SOLID | 😅 CLOSE CALL | 💀 BUSTED |
|-------------|------------|--------|--------------|---------|
| < 25% | < 50% | < 75% | < 100% | > 100% |

---

<!-- SCREENSHOT: ScoreCard after a completed run — showing cost, efficiency rating, model class, achievements -->
<!-- Suggested: complete a roguelike run with Sonnet and capture the auto-displayed scorecard on /exit -->

---

## Live HUD

After `tokengolf install`, a status line appears at the bottom of every Claude Code session:

```
⛳ implement pagination | $0.12/$0.30 40% | EFFICIENT | ctx 38% | Floor 1/5 | Sonnet·High
```

- **📦** appears when context hits 75%+ — you're getting heavy
- **💤** replaces ⛳ if the previous session fainted (hit usage limits)

<!-- SCREENSHOT: Claude Code terminal showing the status line HUD at the bottom in split-screen with IDE -->

---

## Hooks

Six hooks fire automatically after `tokengolf install`:

| Hook | When | What it does |
|------|------|-------------|
| `SessionStart` | Session opens | Injects quest, budget, floor into Claude's context. Auto-creates Flow run if none active. Increments session count for multi-session runs. |
| `PostToolUse` | After every tool | Tracks tool calls. Fires budget warning at 80%. |
| `UserPromptSubmit` | Each prompt | Counts prompts. Injects halfway nudge at 50% budget. |
| `PreCompact` | Before compaction | Records whether compact was manual or auto, and context % at time of compact. Powers gear achievements. |
| `SessionEnd` | Session closes | Auto-detects cost, saves run, displays scorecard. Detects Fainted if session ended unexpectedly. |
| `StatusLine` | Continuously | Live HUD showing cost, efficiency, context %, model. |

---

## Achievements

**Class achievements**
- 💎 Diamond — Haiku under $0.10
- 🥇 Gold — Completed with Haiku
- 🥈 Silver — Completed with Sonnet
- 🥉 Bronze — Completed with Opus

**Efficiency**
- 🎯 Sniper — Under 25% of budget used
- ⚡ Efficient — Under 50% of budget used
- 🪙 Penny Pincher — Total spend under $0.10

**Effort**
- 🎯 Speedrunner — Low effort, completed under budget
- 💪 Tryhard — High/max effort, LEGENDARY efficiency
- 👑 Archmagus — Opus at max effort, completed

**Fast mode**
- ⚡ Lightning Run — Opus fast mode, completed under budget
- 🎰 Daredevil — Opus fast mode, LEGENDARY efficiency

**Multi-model**
- 🏹 Frugal — Haiku handled ≥50% of session cost
- 🎲 Rogue Run — Haiku handled ≥75% of session cost

**Rest & recovery**
- ⚡ No Rest for the Wicked — Completed in one session
- 🏕️ Made Camp — Completed across multiple sessions
- 💪 Came Back — Fainted (hit usage limits) and finished anyway

**Context management (gear)**
- 📦 Overencumbered — Context auto-compacted during run
- 🎒 Traveling Light — Manual compact at ≤50% context
- 🪶 Ultralight — Manual compact at ≤40% context
- 🥷 Ghost Run — Manual compact at ≤30% context

---

<!-- SCREENSHOT: tokengolf stats career dashboard -->

---

## The Meta Loop

Roguelike mode trains you to be precise — tighter prompts, strategic compaction, right model for the job. Those habits carry into Flow sessions. Better Flow sessions = lower daily spend = better scores without even trying.

The dungeon crawl framing maps to real mechanics:
- **Overencumbered** = context bloat slowing you down
- **Made Camp** = hit usage limits, came back next session
- **Ghost Run** = surgical context discipline, cleared inventory before the boss

---

## State

All data lives in `~/.tokengolf/`:
- `current-run.json` — active run
- `runs.json` — completed run history

No database, no native deps, no compilation.
