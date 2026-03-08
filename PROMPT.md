# TokenGolf — Claude Code Kickoff Prompt

Paste this into Claude Code when starting a new session on this project.

---

## Prompt

I'm working on **TokenGolf** — a CLI game that gamifies Claude Code sessions. Full context is in `CLAUDE.md`. Read that first before doing anything.

Current status: v0.1 scaffold is complete. All files exist but haven't been tested end-to-end yet.

**Your first task**: Do a full orientating read of the project.
1. Read `CLAUDE.md` completely
2. Read `package.json`
3. Scan `src/cli.js` to understand the command structure
4. Scan `src/lib/state.js` and `src/lib/store.js` to understand persistence
5. Then tell me: what looks wrong, what's missing, what would break on first run

After that I'll tell you what to work on.

**Working style I want**:
- Don't over-explain. Be direct.
- Don't refactor things that aren't broken.
- Small focused changes. One thing at a time.
- Ask before making structural changes.
- Test commands with `node src/cli.js <command>` not `npm run`.

---

## Context snapshot (as of scaffold)

**Stack**: Node.js ESM + Ink v5 + @inkjs/ui + Commander + JSON files

**State lives in**: `~/.tokengolf/current-run.json` and `~/.tokengolf/runs.json`

**Claude Code hooks** (installed via `tokengolf install`):
- `SessionStart` → injects run context into Claude's conversation
- `PostToolUse` → tracks tool calls, warns at 80% budget
- `UserPromptSubmit` → counts prompts, nudges at 50% budget

**Known gaps to fix**:
- Cost is self-reported — no automatic transcript parsing yet
- Win condition is manual (`tokengolf win` / `tokengolf bust`)
- Floor structure is cosmetic — not enforced yet
- Flow mode is implicit — no explicit toggle yet

**Immediate priorities**:
1. Get `tokengolf start` → `tokengolf status` → `tokengolf win` → `tokengolf scorecard` working end-to-end
2. Fix anything that breaks on `npm install && node src/cli.js start`
3. Then tackle automatic cost parsing from `~/.claude/` transcripts
