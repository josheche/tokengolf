<p align="center">
  <img src="docs/assets/banner.svg" alt="TokenGolf" width="800" />
</p>

<p align="center">
  <strong>Flow mode tracks you. Roguelike mode trains you.</strong>
</p>

<p align="center">
  <a href="https://www.npmjs.com/package/tokengolf"><img src="https://img.shields.io/npm/v/tokengolf?style=flat&color=d4a840&label=npm" alt="npm version" /></a>
  <a href="https://www.npmjs.com/package/tokengolf"><img src="https://img.shields.io/npm/dm/tokengolf?style=flat&color=6bb54a&label=downloads" alt="npm downloads" /></a>
  <a href="https://github.com/josheche/tokengolf/blob/main/LICENSE"><img src="https://img.shields.io/npm/l/tokengolf?style=flat&color=7cb8d4" alt="license" /></a>
  <a href="https://nodejs.org"><img src="https://img.shields.io/node/v/tokengolf?style=flat&color=9a9180" alt="node version" /></a>
</p>

<p align="center">
  <a href="https://josheche.github.io/tokengolf/">tokengolf.dev</a> · <a href="https://www.npmjs.com/package/tokengolf">npm</a> · <a href="https://github.com/josheche/tokengolf">GitHub</a>
</p>

---

Turn Claude Code token efficiency into a game. Declare a quest, commit to a budget, pick a character class. Work normally. At the end — a scorecard, achievements, and a score that measures how well you prompt.

**Better prompting → fewer tokens → higher score.** 60+ achievements. 9 hooks. 4 character classes. Zero config beyond `npm install`.

```
██  🏆  SESSION COMPLETE
██  add pagination to /users endpoint
██  ──────────────────────────────────────────────────
██  $0.2300  /$1.50  15%  ⚔️ Sonnet  🥇 Gold
██  🌟 LEGENDARY
██  ──────────────────────────────────────────────────
██  🎯 Sniper  🥈 Silver  🔥 No Rest  ✅ Clean Run  🧰 Toolbox  🤫 Silent Run
```

---

## Quick Start

**npm** (recommended)
```bash
npm install -g tokengolf
```

**Homebrew**
```bash
brew tap josheche/tokengolf
brew install tokengolf
```

**curl**
```bash
curl -fsSL https://raw.githubusercontent.com/josheche/tokengolf/main/install.sh | bash
```

Then set up the hooks (npm and brew only — curl does this automatically):
```bash
tokengolf install          # patches ~/.claude/settings.json
```

That's it. Open Claude Code, work normally, `/exit` — scorecard appears automatically (Flow mode). Or declare a run first:

```bash
tokengolf start            # pick quest, class, effort, budget
# ... work in Claude Code ...
tokengolf win              # complete run, auto-detect cost
```

<details>
<summary>All commands</summary>

```bash
tokengolf start       # declare quest + class + effort + budget, begin a run
tokengolf status      # live run status
tokengolf win         # shipped it ✓ (auto-detects cost from transcripts)
tokengolf bust        # manual permadeath override
tokengolf scorecard   # last run scorecard
tokengolf stats       # career dashboard
tokengolf install     # patch ~/.claude/settings.json with hooks
tokengolf demo        # show all UI states (for screenshots)
```

</details>

---

## Two Modes

### ⛳ Flow Mode
Just work. TokenGolf auto-creates a tracking session when you open Claude Code. `/exit` and the scorecard appears. No pre-configuration.

### ☠️ Roguelike Mode
Pre-commit before you start. Declare a quest, pick a class and effort level, set a budget. Go over budget = permadeath — the run is logged as a death. The pressure trains better prompting habits, which makes your Flow sessions cheaper over time.

---

## Character Classes

| Class | Model | Difficulty | Feel |
|-------|-------|------------|------|
| 🏹 **Rogue** | Haiku | Nightmare | Glass cannon. Prompt precisely or die. |
| ⚔️ **Fighter** | Sonnet | Standard | Balanced. The default run. |
| 🧙 **Warlock** | Opus | Casual | Powerful but expensive. |
| ⚜️ **Paladin** | Opus (plan mode) | Tactical | Strategic planner. Thinks before acting. |
| ⚡ **Warlock·Fast** | Opus + fast mode | Danger | 2× cost. Maximum risk, maximum speed. |

Effort levels: Low / **Medium** / High / Max (Opus-only). Fast mode toggled with `/fast` in Claude Code, auto-detected by TokenGolf.

---

## Scoring

**Efficiency** (roguelike — % of budget used):

| 🌟 LEGENDARY | ⚡ EFFICIENT | ✓ SOLID | 😅 CLOSE CALL | 💀 BUSTED |
|---|---|---|---|---|
| < 25% | < 50% | < 75% | < 100% | > 100% |

**Spend tier** (absolute, shown on every scorecard):

| 💎 Diamond | 🥇 Gold | 🥈 Silver | 🥉 Bronze | 💸 Reckless |
|---|---|---|---|---|
| < $0.10 | < $0.30 | < $1.00 | < $3.00 | > $3.00 |

Budget presets are model-calibrated — Haiku Diamond is $0.15, Opus Diamond is $2.50. Same relative difficulty, different absolute cost.

---

## Achievements

60+ achievements tracking how you prompt, what tools you use, and how efficiently you spend. Here are some highlights:

| | Achievement | How |
|---|---|---|
| 🥊 | **One Shot** | Completed in a single prompt |
| 🎯 | **Sniper** | Under 25% of budget used |
| 💎 | **Diamond** | Haiku under $0.10 total |
| 🔪 | **Surgeon** | 1–3 Edit calls, under budget |
| 🤫 | **Silent Run** | No extended thinking, SOLID or better |
| 👑 | **Archmagus** | Opus at max effort, completed |
| 🥷 | **Ghost Run** | Manual compact at ≤30% context |
| 🐺 | **Lone Wolf** | No subagents spawned |
| 🤦 | **Hubris** | Used ultrathink, busted anyway *(death mark)* |
| 💥 | **Blowout** | Spent 2× your budget *(death mark)* |

<details>
<summary><strong>Full achievement list (60+)</strong></summary>

**Class**
- 💎 Diamond — Haiku under $0.10 total spend
- 🥇 Gold — Completed with Haiku
- 🥈 Silver — Completed with Sonnet
- 🥉 Bronze — Completed with Opus
- ⚜️ Paladin — Completed as Paladin (Opus plan mode)
- ♟️ Grand Strategist — LEGENDARY efficiency as Paladin

**Efficiency**
- 🎯 Sniper — Under 25% of budget used
- ⚡ Efficient — Under 50% of budget used
- 🪙 Penny Pincher — Total spend under $0.10
- 💲 Cheap Shots — Under $0.01 per prompt (≥3 prompts)
- 🍷 Expensive Taste — Over $0.50 per prompt (≥3 prompts)

**Prompting skill**
- 🥊 One Shot — Completed in a single prompt
- 💬 Conversationalist — 20+ prompts in one run
- 🤐 Terse — ≤3 prompts, ≥10 tool calls
- 🪑 Backseat Driver — 15+ prompts but <1 tool call per prompt
- 🏗️ High Leverage — 5+ tool calls per prompt (≥2 prompts)

**Tool mastery**
- 👁️ Read Only — Won with no Edit or Write calls
- ✏️ Editor — 10+ Edit calls
- 🐚 Bash Warrior — 10+ Bash calls comprising ≥50% of tools
- 🔍 Scout — ≥60% of tool calls were Reads (≥5 total)
- 🔪 Surgeon — 1–3 Edit calls, completed under budget
- 🧰 Toolbox — 5+ distinct tools used

**Effort**
- 🏎️ Speedrunner — Low effort, completed under budget
- 🏋️ Tryhard — High/max effort, LEGENDARY efficiency
- 👑 Archmagus — Opus at max effort, completed

**Fast mode**
- ⛈️ Lightning Run — Opus fast mode, completed under budget
- 🎰 Daredevil — Opus fast mode, LEGENDARY efficiency

**Time**
- ⏱️ Speedrun — Completed in under 5 minutes
- 🏃 Marathon — Session over 60 minutes
- 🫠 Endurance — Session over 3 hours

**Ultrathink**
- 🔮 Spell Cast — Used extended thinking during the run
- 🧮 Calculated Risk — Ultrathink + LEGENDARY efficiency
- 🌀 Deep Thinker — 3+ ultrathink invocations, completed under budget
- 🤫 Silent Run — No extended thinking, SOLID or better
- 🤦 Hubris — Used ultrathink, busted anyway *(death mark)*

**Multi-model**
- 🏹 Frugal — Haiku handled ≥50% of session cost
- 🎲 Rogue Run — Haiku handled ≥75% of session cost
- 🔷 Purist — Single model family throughout
- 🦎 Chameleon — Multiple model families used, under budget
- 🔀 Tactical Switch — Exactly 1 model switch, under budget
- 🔒 Committed — No switches, one model family
- ⚠️ Class Defection — Declared one class but cost skewed to another

**Paladin planning ratio**
- 🏛️ Architect — Opus handled >60% of cost (heavy planner)
- 💨 Blitz — Opus handled <25% of cost (light plan, fast execution)
- ⚖️ Equilibrium — Opus/Sonnet balanced at 40–60%

**Rest & recovery**
- 🔥 No Rest for the Wicked — Completed in one session
- 🏕️ Made Camp — Completed across multiple sessions
- 🧟 Came Back — Fainted (hit usage limits) and finished anyway

**Context management (gear)**
- 📦 Overencumbered — Context auto-compacted during run
- 🎒 Traveling Light — Manual compact at ≤50% context
- 🪶 Ultralight — Manual compact at ≤40% context
- 🥷 Ghost Run — Manual compact at ≤30% context

**Tool reliability**
- ✅ Clean Run — Zero failed tool calls (≥5 total)
- 🐂 Stubborn — 10+ failed tool calls, still won

**Subagents**
- 🐺 Lone Wolf — Completed with no subagents spawned
- 📡 Summoner — 5+ subagents spawned
- 🪖 Army of One — 10+ subagents, under 50% budget used

**Turn discipline**
- 🤖 Agentic — 3+ Claude turns per user prompt
- 🐕 Obedient — Exactly one turn per prompt (≥3 prompts)

**Death marks** *(fire on bust, not win)*
- 💥 Blowout — Spent 2× your budget
- 😭 So Close — Died within 10% of budget
- 🔨 Tool Happy — Died with 30+ tool calls
- 🪦 Silent Death — Died with ≤2 prompts
- 🤡 Fumble — Died with 5+ failed tool calls
- 🎲 Indecisive — 3+ model switches
- 🍷 Expensive Taste — Over $0.50 per prompt

</details>

---

## Live HUD

After `tokengolf install`, a status line appears in every Claude Code session showing quest, cost, efficiency, context load, and model class.

```
██ ⛳ add pagination to /users  $0.54/1.50 ▓▓▓▓░░░░░░░ 36%  EFFICIENT  ⚔️ Sonnet  F2/5

██ ⛳ refactor auth middleware  $0.82/4.00 ▓▓░░░░░░░░░ 21%  LEGENDARY  🧙 Opus  F3/5
██ 🧠 ▓▓▓▓▓░░░░░ 52% 🪶
```

Budget bar turns red above 75%. Context bar (line 2) appears at 50%+: **🪶** green · **🎒** yellow · **📦** red. Accent `██` turns red in danger. **💤** replaces ⛳ when fainted.

---

## Auto Scorecard

When you `/exit`, the scorecard appears automatically — cost, model breakdown, achievements, tool usage.

```
██  🏆  SESSION COMPLETE
██  add pagination to /users endpoint
██  ──────────────────────────────────────────────────
██  SPENT      BUDGET    USED    MODEL        TIER
██  $0.2300    $1.50     15%     ⚔️ Sonnet     🥇 Gold
██
██  🌟 LEGENDARY
██  ──────────────────────────────────────────────────
██  Achievements unlocked:
██   🎯 Sniper — Under 25% budget
██   🥈 Silver — Completed with Sonnet
██   🔥 No Rest for the Wicked — One session
██   ✅ Clean Run — Zero failed tool calls
██   🧰 Toolbox — 5+ distinct tool types
██   🤫 Silent Run — No extended thinking
██  ──────────────────────────────────────────────────
██  Model usage:  🏹 17% Haiku
██  Sonnet 83% $0.19   Haiku 17% $0.04
██  ──────────────────────────────────────────────────
██  Tool calls:
██  Read ×8  Edit ×4  Bash ×3  Grep ×2  Glob ×1
```

```
██  💀  BUDGET BUSTED
██  migrate postgres schema to v3
██  ──────────────────────────────────────────────────
██  $3.8700  /$1.50  258%  ⚔️ Sonnet  💸 Reckless
██  ──────────────────────────────────────────────────
██  🤦 Hubris   💥 Blowout   🤡 Fumble   🔨 Tool Happy
██  ──────────────────────────────────────────────────
██  Cause of death: Budget exceeded by $2.37
██  Tip: Use Read with line ranges instead of full file reads.
```

---

<details>
<summary><strong>Ultrathink</strong></summary>

Write `ultrathink` anywhere in your prompt to trigger extended thinking mode. It's not a slash command — just say it in natural language:

> *"ultrathink: is this the right architecture before I write anything?"*
> *"can you ultrathink through the tradeoffs here?"*

Extended thinking tokens are billed at full output rate. A single ultrathink on Sonnet can cost $0.50–2.00 depending on problem depth. TokenGolf detects thinking blocks from your session transcripts and tracks invocations and estimated thinking tokens — both show on your scorecard.

**The skill is knowing when to ultrathink.** One expensive deep-think that prevents five wrong turns is efficient. Ultrathinking every prompt when you're at 80% budget is hubris.

</details>

<details>
<summary><strong>The Meta Loop</strong></summary>

The dungeon crawl framing maps directly to real session behaviors:

- **Overencumbered** = context bloat slowing you down
- **Made Camp** = hit usage limits, came back next session
- **Ghost Run** = surgical context management before the boss
- **Hubris** = reached for ultrathink on a tight budget and paid for it
- **Silent Run** = solved it with pure prompting discipline, no extended thinking needed
- **Lone Wolf** = didn't spawn a single subagent; held the whole problem in one context
- **Agentic** = gave Claude the wheel and it ran with it — 3+ turns per prompt

Roguelike mode surfaces these patterns explicitly. Flow mode lets them compound over time. The meta loop: **roguelike practice makes Flow sessions better. Better Flow = lower daily spend = better scores without even trying.**

</details>

<details>
<summary><strong>Budget presets (model-calibrated)</strong></summary>

The wizard shows different amounts depending on your class — same relative difficulty, different absolute cost. Anchored to the ~$0.75/task Sonnet average from Anthropic's $6/day Claude Code benchmark.

| Tier | Haiku 🏹 | Sonnet ⚔️ | Opus 🧙 | Feel |
|------|---------|---------|--------|------|
| 💎 Diamond | $0.15 | $0.50 | $2.50 | Surgical micro-task |
| 🥇 Gold | $0.40 | $1.50 | $7.50 | Focused small task |
| 🥈 Silver | $1.00 | $4.00 | $20.00 | Medium task |
| 🥉 Bronze | $2.50 | $10.00 | $50.00 | Heavy / complex |
| ✏️ Custom | any | any | any | Set your own bust threshold |

These are **bust thresholds** — your commitment. Efficiency tiers derive as percentages of whatever you commit to.

</details>

<details>
<summary><strong>Why "TokenGolf"?</strong></summary>

[Code golf](https://en.wikipedia.org/wiki/Code_golf) is the engineering practice of solving a problem in as few characters (or lines, or bytes) as possible. The constraint isn't the point — the *discipline the constraint creates* is the point. Writing the shortest possible solution forces you to understand the problem deeply and use your tools precisely.

Token golf is the same idea applied to AI sessions. Your budget is par. Every unnecessary prompt, every redundant context dump, every "can you also..." tacked onto a request is a stroke over par. The game doesn't literally resemble golf — it borrows the concept: **optimize under constraint, measure your score, improve your game.**

</details>

<details>
<summary><strong>Hooks (9 total)</strong></summary>

All installed via `tokengolf install`:

| Hook | When | What it does |
|------|------|-------------|
| `SessionStart` | Session opens | Injects quest/budget/floor into Claude's context. Auto-creates Flow run if none active. |
| `PostToolUse` | After every tool | Tracks tool usage by type. Fires budget warning at 80%. |
| `PostToolUseFailure` | After a tool error | Increments `failedToolCalls` — powers Clean Run, Stubborn, Fumble. |
| `UserPromptSubmit` | Each prompt | Counts prompts. Injects halfway nudge at 50% budget. |
| `PreCompact` | Before compaction | Records manual vs auto compact + context % — powers gear achievements. |
| `SessionEnd` | Session closes | Scans transcripts for cost + ultrathink, saves run, displays scorecard. |
| `SubagentStart` | Subagent spawned | Increments `subagentSpawns` — powers Lone Wolf, Summoner, Army of One. |
| `Stop` | Claude finishes a turn | Increments `turnCount` — powers Agentic, Obedient. |
| `StatusLine` | Continuously | Live HUD with cost, tier, efficiency, context %, model class. |

</details>

<details>
<summary><strong>State</strong></summary>

All data lives in `~/.tokengolf/`:
- `current-run.json` — active run
- `runs.json` — completed run history

No database, no native deps, no compilation.

</details>
