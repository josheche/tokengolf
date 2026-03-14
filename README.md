<p align="center">
  <img src="docs/assets/banner.svg" alt="TokenGolf" width="800" />
</p>

<p align="center">
  <strong>Every token counts. Every session is scored.</strong>
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

Turn Claude Code token efficiency into a game. Every session is automatically tracked and scored against a dynamic par budget. Work normally. On `/exit` — a scorecard, achievements, and a score that measures how well you prompt.

**Better prompting → fewer tokens → higher score.** 60+ achievements. 9 hooks. 4 character classes. Zero config beyond install.

```
██  🏆  SESSION COMPLETE
██  ──────────────────────────────────────────────────
██  $0.21  /$3.00 par  14%  ⚔️ Sonnet  🥇 Gold
██  🌟 LEGENDARY
██  ──────────────────────────────────────────────────
██  🎯 Sniper  🥈 Silver  🔥 No Rest  ✅ Clean Run  🧰 Toolbox  🤫 Silent Run
```

---

## Quick Start

**Claude Code Plugin** (recommended — auto-updates)

```bash
claude plugin marketplace add josheche/tokengolf
claude plugin install tokengolf@tokengolf
```

**npm** (alternative — requires hook setup)

```bash
npm install -g tokengolf
tokengolf install          # patches ~/.claude/settings.json
```

**Homebrew**

```bash
brew tap josheche/tokengolf
brew install tokengolf
tokengolf install
```

**curl**

```bash
curl -fsSL https://raw.githubusercontent.com/josheche/tokengolf/main/install.sh | bash
```

That's it. Open Claude Code, work normally, `/exit` — scorecard appears automatically.

npm users get auto-sync — hooks update automatically on version change.

<details>
<summary>All commands</summary>

```bash
tokengolf scorecard              # last run scorecard
tokengolf stats                  # career dashboard
tokengolf config                 # view all config values
tokengolf config emotions emoji  # set emotion mode (off, emoji, ascii)
tokengolf config par             # view/set par rates per model
tokengolf config floor           # view/set par floors per model
tokengolf demo                   # show all UI states (hud, scorecard, stats)
tokengolf install                # patch ~/.claude/settings.json with hooks (npm only)
```

</details>

---

## How It Works

Every Claude Code session is automatically tracked — no setup, no pre-configuration. TokenGolf measures your efficiency against a **par budget** that scales with your session:

```
par = max(rate × sqrt(prompts), model_floor)
efficiency = actual_cost / par
```

Par grows with your session, but **sublinearly** — early prompts give you room to explore, while pressure builds as the session goes on. Efficient prompts beat par; wasteful ones fall behind. Spend more than par and the run **busts** — logged as a death with red accents and death achievements.

| Model      | Par Rate | Floor  |
| ---------- | -------- | ------ |
| 🏹 Haiku   | $0.15    | $0.10  |
| ⚔️ Sonnet  | $1.50    | $0.75  |
| ⚜️ Paladin | $4.50    | $2.00  |
| 🧙 Opus    | $8.00    | $3.00  |

The floor prevents 1-prompt sessions from being instant BUST. The sqrt scaling means a 4-prompt Sonnet session has par $3.00, while a 16-prompt session has par $6.00 (not $24). Long sessions must be increasingly efficient to stay under par.

Rates and floors are configurable per model:

```bash
tokengolf config par              # list all rates
tokengolf config par sonnet 1.5   # set Sonnet par rate to $1.50/prompt
tokengolf config par reset        # restore defaults
tokengolf config floor opus 20.0  # set Opus floor to $20.00
tokengolf config floor reset      # restore defaults
```

---

## Character Classes

| Class          | Model            | Difficulty | Feel                                            |
| -------------- | ---------------- | ---------- | ----------------------------------------------- |
| 🏹 **Rogue**   | Haiku            | Nightmare  | Glass cannon. Prompt precisely or die.          |
| ⚔️ **Fighter** | Sonnet           | Standard   | Balanced. The default run.                      |
| ⚜️ **Paladin** | Opus (plan mode) | Tactical   | Strategic planner. Opus plans, Sonnet executes. |
| 🧙 **Warlock** | Opus             | Casual     | Powerful but expensive.                         |

Effort levels: Low / **Medium** / High / Max (Opus-only). Fast mode (`/fast` in Claude Code) is auto-detected and unlocks unique achievements (Lightning Run, Daredevil).

---

## Scoring

**Efficiency** (% of par used):

| 🌟 LEGENDARY | 🔥 EPIC | 💪 PRO | ✅ SOLID | ⚠️ CLOSE CALL | 💥 BUST |
| ------------ | ------- | ------ | -------- | ------------- | ------- |
| < 15%        | < 30%   | < 50%  | < 75%    | < 100%        | > 100%  |

**Spend tier** (model-calibrated — shown here for Sonnet):

| ✨ Mythic | 💎 Diamond | 🥇 Gold | 🥈 Silver | 🥉 Bronze | 💸 Reckless |
| --------- | ---------- | ------- | --------- | --------- | ----------- |
| < $0.10   | < $0.50    | < $1.50 | < $4.00   | < $10.00  | > $10.00    |

Thresholds scale per model — Haiku Diamond is $0.15, Opus Diamond is $2.50. Same relative difficulty, different absolute cost.

---

## Achievements

60+ achievements tracking how you prompt, what tools you use, and how efficiently you spend. Here are some highlights:

|     | Achievement    | How                                           |
| --- | -------------- | --------------------------------------------- |
| 🥊  | **One Shot**   | Completed in a single prompt                  |
| 🎯  | **Sniper**     | Under 25% of par used                         |
| 💎  | **Diamond**    | Haiku under $0.10 total                       |
| 🔪  | **Surgeon**    | 1–3 Edit calls, under par                     |
| 🤫  | **Silent Run** | No extended thinking, SOLID or better         |
| 👑  | **Archmagus**  | Opus at max effort, completed                 |
| 🥷  | **Ghost Run**  | Manual compact at ≤30% context                |
| 🐺  | **Lone Wolf**  | No subagents spawned                          |
| 🤦  | **Hubris**     | Used ultrathink, busted anyway _(death mark)_ |
| 💥  | **Blowout**    | Spent 2× your par _(death mark)_              |

<details>
<summary><strong>Full achievement list (60+)</strong></summary>

**Class**

- 💎 Diamond — Haiku under $0.10 total spend
- 🥇 Gold — Completed with Haiku
- 🥈 Silver — Completed with Sonnet
- 🥉 Bronze — Completed with Opus
- ⚜️ Paladin — Completed as Paladin (Opus plan mode)
- ♟️ Grand Strategist — EPIC efficiency as Paladin

**Efficiency**

- 🎯 Sniper — Under 25% of par used
- ⚡ Efficient — Under 50% of par used
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
- 🔪 Surgeon — 1–3 Edit calls, completed under par
- 🧰 Toolbox — 5+ distinct tools used

**Effort**

- 🏎️ Speedrunner — Low effort, completed under par
- 🏋️ Tryhard — High/max effort, EPIC efficiency
- 👑 Archmagus — Opus at max effort, completed

**Fast mode**

- ⛈️ Lightning Run — Opus fast mode, completed under par
- 🎰 Daredevil — Opus fast mode, EPIC efficiency

**Time**

- ⏱️ Speedrun — Completed in under 5 minutes
- 🏃 Marathon — Session over 60 minutes
- 🫠 Endurance — Session over 3 hours

**Ultrathink**

- 🔮 Spell Cast — Used extended thinking during the run
- 🧮 Calculated Risk — Ultrathink + EPIC efficiency
- 🌀 Deep Thinker — 3+ ultrathink invocations, completed under par
- 🤫 Silent Run — No extended thinking, SOLID or better
- 🤦 Hubris — Used ultrathink, busted anyway _(death mark)_

**Multi-model**

- 🏹 Frugal — Haiku handled ≥50% of session cost
- 🎲 Rogue Run — Haiku handled ≥75% of session cost
- 🔷 Purist — Single model family throughout
- 🦎 Chameleon — Multiple model families used, under par
- 🔀 Tactical Switch — Exactly 1 model switch, under par
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
- 🪖 Army of One — 10+ subagents, under 50% par used

**Turn discipline**

- 🤖 Agentic — 3+ Claude turns per user prompt
- 🐕 Obedient — Exactly one turn per prompt (≥3 prompts)

**Death marks** _(fire on bust, not win)_

- 💥 Blowout — Spent 2× your par
- 😭 So Close — Died within 10% of par
- 🔨 Tool Happy — Died with 30+ tool calls
- 🪦 Silent Death — Died with ≤2 prompts
- 🤡 Fumble — Died with 5+ failed tool calls
- 🎲 Indecisive — 3+ model switches
- 🍷 Expensive Taste — Over $0.50 per prompt

</details>

---

## Live HUD

After install, a status line appears in every Claude Code session showing cost, efficiency, context load, model class, and emotion.

```
██ 😎 VIBING  💎 $0.42/9.90 ▓░░░░░░░░░░ 4% 🌟 LEGENDARY
██ ⚔️ Sonnet  🪶 ▓░░░░░░░░░ 8%

██ 😤 GRINDING  🥉 $6.80/19.80 ▓▓▓▓░░░░░░░ 34% 💪 PRO
██ ⚔️ Sonnet  📚 ▓▓▓░░░░░░░ 34%
```

Accent `██` color matches your efficiency tier — yellow for LEGENDARY, magenta for EPIC, cyan for PRO, green for SOLID, white for CLOSE CALL, red for BUST. Line 2 shows model class, context weight (**🪶** · **📚** · **🎒** · **🧱** · **🪨** · **🗿** — feather to stone), and prompt count. **💤** replaces the emotion icon when fainted.

---

## Auto Scorecard

When you `/exit`, the scorecard appears automatically — cost vs par, model breakdown, achievements, tool usage.

```
██  🏆  SESSION COMPLETE
██  ──────────────────────────────────────────────────
██  SPENT      PAR       USED    MODEL        TIER
██  $0.21    $1.50      14%    ⚔️ Sonnet     🥇 Gold
██
██  🌟 LEGENDARY
██  ──────────────────────────────────────────────────
██  Achievements unlocked:
██   🎯 Sniper — Under 25% of par
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
██  💀  PAR BUST
██  ──────────────────────────────────────────────────
██  $48.00  /$22.14 par  217%  ⚔️ Sonnet·High  💥 BUST
██  ──────────────────────────────────────────────────
██  🤦 Hubris   💥 Blowout   🤡 Fumble   🔨 Tool Happy
██  ──────────────────────────────────────────────────
██  Cause of death: Par exceeded by $25.86
██  Tip: Use Read with line ranges instead of full file reads.
```

---

<details>
<summary><strong>Ultrathink</strong></summary>

Write `ultrathink` anywhere in your prompt to trigger extended thinking mode. It's not a slash command — just say it in natural language:

> _"ultrathink: is this the right architecture before I write anything?"_
> _"can you ultrathink through the tradeoffs here?"_

Extended thinking tokens are billed at full output rate. A single ultrathink on Sonnet can cost $0.50–2.00 depending on problem depth. TokenGolf detects thinking blocks from your session transcripts and tracks invocations and estimated thinking tokens — both show on your scorecard.

**The skill is knowing when to ultrathink.** One expensive deep-think that prevents five wrong turns is efficient. Ultrathinking every prompt when you're at 80% of par is hubris.

</details>

<details>
<summary><strong>The Meta Loop</strong></summary>

Achievement names map directly to real session behaviors:

- **Overencumbered** = context bloat slowing you down
- **Made Camp** = hit usage limits, came back next session
- **Ghost Run** = surgical context management before the boss
- **Hubris** = reached for ultrathink on a tight par budget and paid for it
- **Silent Run** = solved it with pure prompting discipline, no extended thinking needed
- **Lone Wolf** = didn't spawn a single subagent; held the whole problem in one context
- **Agentic** = gave Claude the wheel and it ran with it — 3+ turns per prompt

These patterns compound over time. **Better prompting habits → lower daily spend → better scores without even trying.**

</details>

<details>
<summary><strong>Why "TokenGolf"?</strong></summary>

[Code golf](https://en.wikipedia.org/wiki/Code_golf) is the engineering practice of solving a problem in as few characters (or lines, or bytes) as possible. The constraint isn't the point — the _discipline the constraint creates_ is the point. Writing the shortest possible solution forces you to understand the problem deeply and use your tools precisely.

Token golf is the same idea applied to AI sessions. Your budget is par. Every unnecessary prompt, every redundant context dump, every "can you also..." tacked onto a request is a stroke over par. The game doesn't literally resemble golf — it borrows the concept: **optimize under constraint, measure your score, improve your game.**

</details>

<details>
<summary><strong>Hooks (9 total)</strong></summary>

Installed automatically via plugin, or manually via `tokengolf install` (npm):

| Hook                 | When                   | What it does                                                            |
| -------------------- | ---------------------- | ----------------------------------------------------------------------- |
| `SessionStart`       | Session opens          | Auto-creates run, injects par budget into Claude's context.             |
| `PostToolUse`        | After every tool       | Tracks tool usage by type. Fires par warning at 80%.                    |
| `PostToolUseFailure` | After a tool error     | Increments `failedToolCalls` — powers Clean Run, Stubborn, Fumble.      |
| `UserPromptSubmit`   | Each prompt            | Counts prompts. Injects halfway nudge at 50% of par.                    |
| `PreCompact`         | Before compaction      | Records manual vs auto compact + context % — powers gear achievements.  |
| `SessionEnd`         | Session closes         | Scans transcripts for cost + ultrathink, saves run, displays scorecard. |
| `SubagentStart`      | Subagent spawned       | Increments `subagentSpawns` — powers Lone Wolf, Summoner, Army of One.  |
| `Stop`               | Claude finishes a turn | Increments `turnCount` — powers Agentic, Obedient.                      |
| `StatusLine`         | Continuously           | Live HUD with cost, tier, efficiency, context %, model class.           |

</details>

<details>
<summary><strong>State</strong></summary>

All data lives in `~/.tokengolf/`:

- `current-run.json` — active run
- `runs.json` — completed run history

No database, no native deps, no compilation.

</details>
