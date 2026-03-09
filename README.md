# ⛳ TokenGolf

> Gamify your Claude Code sessions. Flow mode tracks you. Roguelike mode trains you.

Turn Claude Code token efficiency into a game. Declare a quest, commit to a budget, pick a character class. Work normally. At the end, get a score based on how efficiently you used your budget.

**Better prompting → fewer tokens → higher score.**

---

<!-- SCREENSHOT: tokengolf start wizard — quest/class/effort/budget selection -->

---

## Install

```bash
git clone <repo>
cd tokengolf
npm install && npm link
tokengolf install
```

---

## Two Modes

### ⛳ Flow Mode
Just work. TokenGolf auto-creates a tracking session when you open Claude Code. `/exit` the session and the scorecard appears automatically. No pre-configuration required.

### ☠️ Roguelike Mode
Pre-commit before you start. Declare a quest, pick a class and effort level, set a budget. Go over budget = permadeath — the run is logged as a death. The deliberate pressure trains better prompting habits, which makes your Flow sessions cheaper over time.

**The meta loop:** Roguelike practice makes Flow sessions better. Better Flow = lower daily spend = better scores without even trying.

---

## Commands

```bash
tokengolf start       # declare quest + class + effort + budget, begin a run
tokengolf status      # live run status
tokengolf win         # shipped it ✓ (auto-detects cost from transcripts)
tokengolf bust        # manual permadeath override
tokengolf scorecard   # last run scorecard
tokengolf stats       # career dashboard
tokengolf install     # patch ~/.claude/settings.json with hooks
```

---

## Character Classes & Effort

| Class | Model | Effort | Feel |
|-------|-------|--------|------|
| 🏹 Rogue | Haiku | — *(skips effort step)* | Glass cannon. Prompt precisely or die. |
| ⚔️ Fighter | Sonnet | Low / **Medium** / High | Balanced. The default run. |
| 🧙 Warlock | Opus | Low / **Medium** / High / Max | Powerful but costly. |
| ⚡ Warlock·Fast | Opus + fast mode | any | 2× cost. Maximum danger mode. |

`max` effort is Opus-only — the API returns an error if used on other models. Fast mode is toggled mid-session with `/fast` in Claude Code and is auto-detected by TokenGolf.

---

## Budget Presets (Model-Calibrated)

The wizard shows different amounts depending on your class — same relative difficulty, different absolute cost. Anchored to the ~$0.75/task Sonnet average from Anthropic's $6/day Claude Code benchmark.

| Tier | Haiku 🏹 | Sonnet ⚔️ | Opus 🧙 | Feel |
|------|---------|---------|--------|------|
| 💎 Diamond | $0.15 | $0.50 | $2.50 | Surgical micro-task |
| 🥇 Gold | $0.40 | $1.50 | $7.50 | Focused small task |
| 🥈 Silver | $1.00 | $4.00 | $20.00 | Medium task |
| 🥉 Bronze | $2.50 | $10.00 | $50.00 | Heavy / complex |
| ✏️ Custom | any | any | any | Set your own bust threshold |

These are **bust thresholds** — your commitment. Efficiency tiers derive as percentages of whatever you commit to.

---

## Scoring

**Efficiency rating** (roguelike mode — % of your budget used):

| 🌟 LEGENDARY | ⚡ EFFICIENT | ✓ SOLID | 😅 CLOSE CALL | 💀 BUSTED |
|---|---|---|---|---|
| < 25% | < 50% | < 75% | < 100% | > 100% |

**Spend tier** (absolute cost, shown on every scorecard):

| 💎 | 🥇 | 🥈 | 🥉 | 💸 |
|---|---|---|---|---|
| < $0.10 | < $0.30 | < $1.00 | < $3.00 | > $3.00 |

---

## Ultrathink

Write `ultrathink` anywhere in your prompt to trigger extended thinking mode. It's not a slash command — just say it in natural language:

> *"ultrathink: is this the right architecture before I write anything?"*
> *"can you ultrathink through the tradeoffs here?"*

Extended thinking tokens are billed at full output rate. A single ultrathink on Sonnet can cost $0.50–2.00 depending on problem depth. TokenGolf detects thinking blocks from your session transcripts and tracks invocations and estimated thinking tokens — both show on your scorecard.

**The skill is knowing when to ultrathink.** One expensive deep-think that prevents five wrong turns is efficient. Ultrathinking every prompt when you're at 80% budget is hubris.

---

## Achievements

**Class**
- 💎 Diamond — Haiku under $0.10 total spend
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

**Ultrathink**
- 🔮 Spell Cast — Used extended thinking during the run
- 🧠 Calculated Risk — Ultrathink + LEGENDARY efficiency
- 🌀 Deep Thinker — 3+ ultrathink invocations, completed under budget
- 🤫 Silent Run — No extended thinking, SOLID or better *(think without thinking)*
- 🤦 Hubris — Used ultrathink, busted anyway *(death achievement)*

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

## Live HUD

After `tokengolf install`, a status line appears in every Claude Code session:

```
 ───────────────
⛳ implement pagination | 💎 $0.1203/$0.50 24% | LEGENDARY | 🪶 38% | Sonnet·High | Floor 1/5
 ───────────────
```

- **tier emoji** (💎🥇🥈🥉💸) updates live as cost accumulates
- **🪶 green** at 50–74% context — traveling light
- **🎒 yellow** at 75–89% context — getting heavy
- **📦 red** at 90%+ context — overencumbered, consider compacting
- **💤** instead of ⛳ if the previous session fainted (hit usage limits)
- Roguelike runs show floor progress; Flow runs omit budget/efficiency

<!-- SCREENSHOT: Claude Code split-screen showing the TokenGolf HUD in the status bar -->

---

## Auto Scorecard

When you `/exit` a Claude Code session, the scorecard appears automatically:

```
╔════════════════════════════════════════════════════════════════════╗
║  🏆  SESSION COMPLETE                                              ║
║  implement pagination for /users                                   ║
╠════════════════════════════════════════════════════════════════════╣
║  $0.18/$0.50  36%  ⚡ EFFICIENT  ⚔️ Sonnet·High  🥇 Gold           ║
╠════════════════════════════════════════════════════════════════════╣
║  🔮 1 ultrathink invocation  ~8.4K thinking tokens                ║
╠════════════════════════════════════════════════════════════════════╣
║  🥈 silver_sonnet  🎯 sniper  🔮 spell_cast  🧠 calculated_risk    ║
╠════════════════════════════════════════════════════════════════════╣
║  tokengolf scorecard  ·  tokengolf start  ·  tokengolf stats      ║
╚════════════════════════════════════════════════════════════════════╝
```

<!-- SCREENSHOT: Auto-displayed scorecard after /exit in Claude Code terminal -->

---

## Hooks

Six hooks installed via `tokengolf install`:

| Hook | When | What it does |
|------|------|-------------|
| `SessionStart` | Session opens | Injects quest/budget/floor into Claude's context. Auto-creates Flow run if none active. Increments session count for multi-session runs. |
| `PostToolUse` | After every tool | Tracks tool usage by type. Fires budget warning at 80%. |
| `UserPromptSubmit` | Each prompt | Counts prompts. Injects halfway nudge at 50% budget. |
| `PreCompact` | Before compaction | Records manual vs auto compact + context % — powers gear achievements. |
| `SessionEnd` | Session closes | Scans transcripts for cost + ultrathink blocks, saves run, displays ANSI scorecard. Detects Fainted if session ended unexpectedly (usage limit hit). |
| `StatusLine` | Continuously | Live HUD with cost, tier, efficiency, context %, model class. |

---

## The Meta Loop

The dungeon crawl framing maps directly to real mechanics:

- **Overencumbered** = context bloat slowing you down
- **Made Camp** = hit usage limits, came back next session
- **Ghost Run** = surgical context management before the boss
- **Hubris** = reached for ultrathink on a tight budget and paid for it
- **Silent Run** = solved it with pure prompting discipline, no extended thinking needed

Roguelike mode surfaces these patterns explicitly. Flow mode lets them compound over time.

---

## State

All data lives in `~/.tokengolf/`:
- `current-run.json` — active run
- `runs.json` — completed run history

No database, no native deps, no compilation.
