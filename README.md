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
tokengolf win         # shipped it ✓ (auto-detects cost)
tokengolf bust        # budget exploded
tokengolf scorecard   # last run scorecard
tokengolf stats       # career dashboard
```

## How it scores

**Tiers by spend:**
| 💎 Diamond | 🥇 Gold | 🥈 Silver | 🥉 Bronze | 💸 Reckless |
|-----------|---------|----------|----------|------------|
| < $0.10 | < $0.30 | < $1.00 | < $3.00 | > $3.00 |

**Efficiency rating (roguelike mode):**
| 🌟 Legendary | ⚡ Efficient | ✓ Solid | 😅 Close Call | 💀 Busted |
|-------------|------------|--------|--------------|---------|
| < 25% used | < 50% | < 75% | < 100% | > 100% |

**Model classes:**
| 🏹 Rogue (Haiku) | ⚔️ Fighter (Sonnet) | 🧙 Warlock (Opus) |
|-----------------|-------------------|-----------------|
| Hard | Normal | Easy |

## Claude Code hooks

After `tokengolf install`, four hooks fire automatically:

- **SessionStart** → injects your active quest, remaining budget, floor, and efficiency tips into Claude's context. If no run is active, starts a Flow Mode session automatically.
- **PostToolUse** → tracks every tool call. Fires a budget warning at 80% — Claude sees it and tightens up.
- **UserPromptSubmit** → counts prompts. Injects a halfway nudge at 50%.
- **Stop** → captures exact session cost when Claude Code ends. No manual `--spent` needed.

## Auto cost detection

`tokengolf win` automatically reads cost from the session's transcript files in `~/.claude/projects/`. This includes subagent sidechain files, so multi-model usage (Haiku + Sonnet) is captured in the breakdown.

## Achievements

- 💎 Diamond — Haiku under $0.10
- 🥇 Gold — Completed with Haiku
- 🥈 Silver — Completed with Sonnet
- 🥉 Bronze — Completed with Opus
- 🎯 Sniper — Under 25% of budget
- ⚡ Efficient — Under 50% of budget
- 🪙 Penny Pincher — Total spend under $0.10
- 🏹 Frugal — Haiku handled ≥50% of session cost
- 🎲 Rogue Run — Haiku handled ≥75% of session cost

## State

All data lives in `~/.tokengolf/`:
- `current-run.json` — active run
- `runs.json` — completed run history

No database, no native deps, no compilation.
