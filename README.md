# ⛳ TokenGolf

> Gamify your Claude Code sessions. Flow mode tracks you. Roguelike mode trains you.

Turn Claude Code token efficiency into a game. Declare a quest, set a budget, work normally, get a score. Better prompting = lower cost = higher score.

## Install

```bash
git clone <repo>
cd tokengolf
npm install
npm link

# Wire up Claude Code hooks
tokengolf install
```

## Usage

```bash
tokengolf start       # declare quest + budget, begin a run
tokengolf status      # live run status
tokengolf win         # shipped it ✓
tokengolf win --spent 0.18   # with actual cost
tokengolf bust        # budget exploded
tokengolf scorecard   # last run
tokengolf stats       # career dashboard
```

## How it scores

**Tiers by spend:**
| 💎 Diamond | 🥇 Gold | 🥈 Silver | 🥉 Bronze | 💸 Reckless |
|-----------|---------|----------|----------|------------|
| < $0.10 | < $0.30 | < $1.00 | < $3.00 | > $3.00 |

**Model classes:**
| 🏹 Rogue (Haiku) | ⚔️ Fighter (Sonnet) | 🧙 Warlock (Opus) |
|-----------------|-------------------|-----------------|
| Hard | Normal | Easy |

## Claude Code hooks

After `tokengolf install`, three hooks fire during every Claude Code session:

- **SessionStart** → injects your active run context into Claude's conversation. Claude sees the quest, remaining budget, floor, and efficiency tips.
- **PostToolUse** → tracks every tool call. Fires a `systemMessage` warning at 80% budget — Claude actually sees this and tightens up.
- **UserPromptSubmit** → counts prompts. Injects a halfway nudge at 50%.

## State

All data lives in `~/.tokengolf/`:
- `current-run.json` — active run
- `runs.json` — completed run history

No database, no native deps, no compilation.
