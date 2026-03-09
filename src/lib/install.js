import fs from "fs";
import path from "path";
import os from "os";

// Follow symlinks (npm link creates a symlink in the nvm/node bin dir)
// to find the actual project directory, then resolve hooks/ relative to it.
const realEntry = fs.realpathSync(process.argv[1]);
const HOOKS_DIR = path.resolve(path.dirname(realEntry), "../hooks");
const STATUSLINE_PATH = path.join(HOOKS_DIR, "statusline.sh");
const WRAPPER_PATH = path.join(HOOKS_DIR, "statusline-wrapper.sh");
const CLAUDE_DIR = path.join(os.homedir(), ".claude");
const CLAUDE_SETTINGS = path.join(CLAUDE_DIR, "settings.json");

export function installHooks() {
  console.log("\n⛳ TokenGolf — Installing Claude Code hooks\n");

  let settings = {};
  if (fs.existsSync(CLAUDE_SETTINGS)) {
    try {
      settings = JSON.parse(fs.readFileSync(CLAUDE_SETTINGS, "utf8"));
      console.log("  ✓ Found ~/.claude/settings.json");
    } catch {
      console.log("  ⚠️  Could not parse settings.json — starting fresh");
    }
  } else {
    fs.mkdirSync(CLAUDE_DIR, { recursive: true });
    console.log("  ℹ️  Creating ~/.claude/settings.json");
  }

  if (!settings.hooks) settings.hooks = {};

  function upsertHook(event, entry) {
    const existing = settings.hooks[event] || [];
    // Remove any existing tokengolf hooks (identified by _tg marker or legacy path patterns)
    const filtered = existing.filter(
      (h) =>
        !h._tg &&
        !h.hooks?.some(
          (e) =>
            e.command?.includes("tokengolf") ||
            e.command?.includes("session-start.js") ||
            e.command?.includes("session-stop.js") ||
            e.command?.includes("session-end.js") ||
            e.command?.includes("pre-compact.js") ||
            e.command?.includes("post-tool-use.js") ||
            e.command?.includes("post-tool-use-failure.js") ||
            e.command?.includes("subagent-start.js") ||
            e.command?.includes("stop.js") ||
            e.command?.includes("user-prompt-submit.js"),
        ),
    );
    settings.hooks[event] = [...filtered, { _tg: true, ...entry }];
  }

  // Remove Stop hook if present (replaced by SessionEnd)
  if (settings.hooks.Stop) {
    settings.hooks.Stop = (settings.hooks.Stop || []).filter(
      (h) =>
        !h._tg && !h.hooks?.some((e) => e.command?.includes("session-stop.js")),
    );
    if (settings.hooks.Stop.length === 0) delete settings.hooks.Stop;
  }

  upsertHook("SessionStart", {
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "session-start.js")}`,
        timeout: 5,
      },
    ],
  });

  upsertHook("PostToolUse", {
    matcher: "",
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "post-tool-use.js")}`,
        timeout: 5,
      },
    ],
  });

  upsertHook("UserPromptSubmit", {
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "user-prompt-submit.js")}`,
        timeout: 5,
      },
    ],
  });

  upsertHook("SessionEnd", {
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "session-end.js")}`,
        timeout: 30,
      },
    ],
  });

  upsertHook("PreCompact", {
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "pre-compact.js")}`,
        timeout: 5,
      },
    ],
  });

  upsertHook("PostToolUseFailure", {
    matcher: "",
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "post-tool-use-failure.js")}`,
        timeout: 5,
      },
    ],
  });

  upsertHook("SubagentStart", {
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "subagent-start.js")}`,
        timeout: 5,
      },
    ],
  });

  upsertHook("Stop", {
    hooks: [
      {
        type: "command",
        command: `node ${path.join(HOOKS_DIR, "stop.js")}`,
        timeout: 5,
      },
    ],
  });

  // Install statusLine (non-destructive: wrap existing if present)
  try {
    fs.chmodSync(STATUSLINE_PATH, 0o755);
  } catch {}

  const existing = settings.statusLine;
  const existingCmd =
    typeof existing === "string" ? existing : (existing?.command ?? null);
  const alreadyOurs =
    existingCmd === STATUSLINE_PATH || existingCmd === WRAPPER_PATH;

  if (!alreadyOurs && existingCmd) {
    fs.writeFileSync(
      WRAPPER_PATH,
      [
        "#!/usr/bin/env bash",
        "SESSION_JSON=$(cat)",
        `echo "$SESSION_JSON" | ${existingCmd} 2>/dev/null || true`,
        `echo "$SESSION_JSON" | bash ${STATUSLINE_PATH}`,
      ].join("\n") + "\n",
    );
    fs.chmodSync(WRAPPER_PATH, 0o755);
    settings.statusLine = {
      type: "command",
      command: WRAPPER_PATH,
      padding: 1,
    };
    console.log(
      "  ✓ statusLine       → wrapped your existing statusline + tokengolf HUD",
    );
  } else if (!alreadyOurs) {
    settings.statusLine = {
      type: "command",
      command: STATUSLINE_PATH,
      padding: 1,
    };
    console.log("  ✓ statusLine       → live HUD in every Claude session");
  } else {
    console.log("  ✓ statusLine       → already installed");
  }

  fs.writeFileSync(CLAUDE_SETTINGS, JSON.stringify(settings, null, 2));

  console.log("  ✓ SessionStart     → injects run context into Claude");
  console.log("  ✓ PostToolUse      → tracks tool calls + 80% budget warning");
  console.log("  ✓ UserPromptSubmit → counts prompts + 50% nudge");
  console.log("  ✓ SessionEnd       → auto-displays scorecard on /exit");
  console.log(
    "  ✓ PreCompact           → tracks compaction events for gear achievements",
  );
  console.log("  ✓ PostToolUseFailure   → tracks failed tool calls");
  console.log("  ✓ SubagentStart        → tracks subagent spawns");
  console.log("  ✓ Stop                 → tracks turn count");
  console.log("\n  ✅ Done! Start a run: tokengolf start\n");
}
