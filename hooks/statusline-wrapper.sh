#!/usr/bin/env bash
SESSION_JSON=$(cat)
echo "$SESSION_JSON" | oh-my-posh claude --config ~/.claude/blazed.omp.json 2>/dev/null || true
echo "$SESSION_JSON" | bash /Users/josheche/projects/tokengolf/hooks/statusline.sh
