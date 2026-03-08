# TokenGolf — CLAUDE.md

You are working on **TokenGolf**, a CLI game that gamifies Claude Code sessions by turning token/dollar efficiency into a score. This is the primary project context file. Read this fully before doing anything.

---

## What TokenGolf Is

A Node.js CLI tool that wraps Claude Code sessions with game mechanics. Users declare a quest ("implement pagination for /users"), set a budget ($0.30), pick a model class, then work in Claude Code normally. At the end, they get a score based on how efficiently they used their budget.

**Core insight**: Claude Code already exposes session cost data. TokenGolf adds the game layer — the meaning, the stakes, the achievement system — on top of data that already exists.

**Tagline**: *"Flow mode tracks you. Roguelike mode trains you."*

---

## Two Modes

### Flow Mode
- Passive. No interruption. Just runs in the background.
- Post-session: shows score + achievements.
- For people in flow state who don't want friction.

### Roguelike Mode
- Intentional. Pre-commitment before session starts.
- Declare quest + budget + model class = a "run" with real stakes.
- Budget bust = permadeath. Run logged as a death.
- Floor structure: Write code → Write tests → Fix tests → Code review → PR merged (BOSS)
- For deliberate practice. Trains prompting skills.

**Relationship**: Same engine, same data, same achievement system. Roguelike practice makes Flow sessions better over time. That's the meta loop.

---

## Game Mechanics

### Model as Character Class
| Class | Model | Difficulty | Feel |
|-------|-------|------------|------|
| 🏹 Rogue | Haiku | Hard | Glass cannon. Must prompt precisely. |
| ⚔️ Fighter | Sonnet | Normal | Balanced. The default run. |
| 🧙 Warlock | Opus | Easy | Powerful but expensive. |

### Budget Tiers
| Tier | Spend | Emoji |
|------|-------|-------|
| Diamond | < $0.10 | 💎 |
| Gold | < $0.30 | 🥇 |
| Silver | < $1.00 | 🥈 |
| Bronze | < $3.00 | 🥉 |
| Reckless | > $3.00 | 💸 |

### Efficiency Ratings
| Rating | Budget Used | Color |
|--------|------------|-------|
| LEGENDARY | < 25% | magenta |
| EFFICIENT | < 50% | cyan |
| SOLID | < 75% | green |
| CLOSE CALL | < 100% | yellow |
| BUSTED | > 100% | red |

### Achievements (examples)
- 💎 Diamond — Haiku under $0.10
- 🥇 Gold — Completed with Haiku
- 🥈 Silver — Completed with Sonnet
- 🥉 Bronze — Completed with Opus
- ⚡ Efficient — Under 50% of budget used
- 🎯 Sniper — Under 25% of budget used
- 🪙 Penny Pincher — Total spend under $0.10

---

## Tech Stack

- **Runtime**: Node.js (ESM, `"type": "module"`)
- **TUI**: [Ink v5](https://github.com/vadimdemedes/ink) + [@inkjs/ui v2](https://github.com/vadimdemedes/ink-ui)
- **CLI parsing**: Commander.js
- **Persistence**: JSON files in `~/.tokengolf/` (no native deps, zero compilation)
- **Claude Code integration**: Hooks via `~/.claude/settings.json`
- **Language**: JavaScript (no TypeScript for now — keep it simple)

### Why JSON not SQLite
`better-sqlite3` requires native compilation which causes install failures. JSON files in `~/.tokengolf/` are sufficient for the data volume (hundreds of runs max) and have zero friction.

---

## Project Structure

```
tokengolf/
├── src/
│   ├── cli.js                    # Main entrypoint, all commands
│   ├── components/
│   │   ├── StartRun.js           # Quest declaration wizard
│   │   ├── ActiveRun.js          # Live run status display
│   │   ├── ScoreCard.js          # End-of-run screen (win/death)
│   │   └── StatsView.js          # Career stats dashboard
│   └── lib/
│       ├── state.js              # Read/write ~/.tokengolf/current-run.json
│       ├── store.js              # Read/write ~/.tokengolf/runs.json
│       ├── score.js              # Tiers, ratings, model classes, formatting
│       └── install.js            # Patches ~/.claude/settings.json with hooks
├── hooks/
│   ├── session-start.js          # Injects run context into Claude's conversation
│   ├── post-tool-use.js          # Tracks tool calls, fires budget warnings
│   └── user-prompt-submit.js     # Counts prompts, fires 50% nudge
├── CLAUDE.md                     # This file
├── PROMPT.md                     # Suggested Claude Code kickoff prompt
├── package.json
├── README.md
└── .gitignore
```

---

## State Files (in `~/.tokengolf/`)

### `current-run.json`
Active run state. Written by `tokengolf start`, read/updated by hooks, cleared on `tokengolf win` or `tokengolf bust`.

```json
{
  "quest": "implement pagination for /users",
  "model": "claude-sonnet-4-5",
  "budget": 0.30,
  "spent": 0.11,
  "status": "active",
  "floor": 2,
  "totalFloors": 5,
  "promptCount": 8,
  "totalToolCalls": 14,
  "toolCalls": { "Read": 6, "Edit": 4, "Bash": 4 },
  "startedAt": "2026-03-07T10:00:00Z"
}
```

### `runs.json`
Array of all completed runs. Append-only.

```json
[
  {
    "id": "run_1741345200000",
    "quest": "...",
    "status": "won",
    "spent": 0.18,
    "budget": 0.30,
    "model": "claude-sonnet-4-5",
    "achievements": [...],
    "startedAt": "...",
    "endedAt": "..."
  }
]
```

---

## CLI Commands

| Command | Description |
|---------|-------------|
| `tokengolf start` | Declare quest, model, budget — begin a run |
| `tokengolf status` | Show live status of current run |
| `tokengolf win` | Mark current run as complete (won) |
| `tokengolf bust` | Mark current run as budget busted (died) |
| `tokengolf scorecard` | Show last run's score card |
| `tokengolf stats` | Career stats dashboard |
| `tokengolf install` | Patch `~/.claude/settings.json` with hooks |

---

## Claude Code Hooks

Three hooks in `hooks/` directory, installed via `tokengolf install`:

### `SessionStart`
- Reads `current-run.json`
- Outputs `additionalContext` injected into Claude's conversation
- Shows quest, budget remaining, floor, efficiency tips
- Claude sees this and adjusts behavior accordingly

### `PostToolUse`
- Reads stdin (event JSON with `tool_name`)
- Updates `toolCalls` count in `current-run.json`
- At 80%+ budget: outputs `systemMessage` warning to Claude

### `UserPromptSubmit`
- Increments `promptCount`
- At 50% budget: injects halfway nudge as `additionalContext`

### Hook timeout
All hooks must complete in < 5 seconds. They do synchronous JSON file I/O only — this is fine.

---

## Key Design Decisions

1. **No real-time cost tracking in hooks** — Claude Code hooks don't receive cost data natively yet (filed as a feature request). Cost is self-reported via `tokengolf win/bust` or parsed from transcript post-session. This is a known gap — design for it to be filled in later.

2. **Honor system for v0** — Players self-report cost via `tokengolf win`. Automatic cost parsing from `~/.claude/projects/*/transcript.jsonl` is a v0.3 feature.

3. **Win condition is manual** — `tokengolf win` or `tokengolf bust`. Automatic detection via watching `git push` / test output is a v0.2 feature.

4. **Floors are cosmetic for now** — The floor structure exists in the data model but isn't enforced in v0. It's a UI element on `ActiveRun` and `StartRun`. Full roguelike floor mechanics with per-floor budgets come in v0.4.

5. **Flow mode is implicit** — Any Claude Code session without an active run is effectively Flow mode. The explicit Flow mode toggle and post-session automatic score is a v0.2 feature.

---

## Current Status: v0.1 — Core scaffold

### Done
- [x] Full project scaffold
- [x] All CLI commands wired up
- [x] Ink components: StartRun, ActiveRun, ScoreCard, StatsView
- [x] JSON persistence (state.js + store.js)
- [x] Scoring logic (tiers, ratings, achievements)
- [x] All 3 Claude Code hooks
- [x] `tokengolf install` hook installer

### Next up (v0.2)
- [ ] Test the full flow end-to-end
- [ ] Parse cost from `~/.claude/` transcript automatically
- [ ] `tokengolf floor` command to advance floor manually
- [ ] Automatic Flow mode session tracking
- [ ] Polish ScoreCard ASCII art

### Later (v0.3+)
- [ ] Leaderboard / shareable run URLs
- [ ] Team mode (shared `runs.json` via git)
- [ ] ink-web browser rendering for run sharing
- [ ] Roguelike floor mechanics with per-floor sub-budgets
- [ ] Real-time cost tracking (when Anthropic exposes it in hooks)

---

## Working in This Repo

When making changes:
- Keep it ESM (`import/export`, no `require`)
- Ink components are functional React — hooks only, no classes
- State mutations always go through `state.js` and `store.js` — never write to `~/.tokengolf/` directly from components
- Hooks must be fast (< 1s) — no async, no network, JSON file I/O only
- Run `node src/cli.js <command>` to test without `npm link`

When adding a new CLI command:
1. Add it to `src/cli.js`
2. Add a component in `src/components/` if it needs a TUI
3. Document it in this file and README.md

When modifying hooks:
- Test them standalone: `echo '{"tool_name":"Read"}' | node hooks/post-tool-use.js`
- Remember hooks run in a separate process with no access to shell env vars
- Always `process.exit(0)` at the end
