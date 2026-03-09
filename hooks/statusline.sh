#!/usr/bin/env bash
STATE_FILE="$HOME/.tokengolf/current-run.json"
SESSION_JSON=$(cat)
[ ! -f "$STATE_FILE" ] && exit 0

TG_SESSION_JSON="$SESSION_JSON" python3 - "$STATE_FILE" <<'PYEOF'
import sys, json, os

try:
    session = json.loads(os.environ.get('TG_SESSION_JSON') or '{}')
except: session = {}

try:
    with open(sys.argv[1]) as f: run = json.load(f)
except: sys.exit(0)

cost    = (session.get('cost') or {}).get('total_cost_usd') or run.get('spent', 0)
ctx_pct = (session.get('context_window') or {}).get('used_percentage') or None
quest   = (run.get('quest') or 'Flow')[:32]
budget  = run.get('budget')
floor   = f"{run.get('floor',1)}/{run.get('totalFloors',5)}"
m       = run.get('model', '').lower()
model   = 'Haiku' if 'haiku' in m else 'Sonnet' if 'sonnet' in m else 'Opus' if 'opus' in m else '?'
effort  = run.get('effort')
fast    = run.get('fastMode', False)
fainted = run.get('fainted', False)

label_parts = [model]
if effort and effort != 'medium': label_parts.append(effort.capitalize())
if fast: label_parts.append('⚡Fast')
model_label = '·'.join(label_parts)

R, B, G, Y, M, C, DIM, RESET = '\033[31m','\033[34m','\033[32m','\033[33m','\033[35m','\033[36m','\033[2m','\033[0m'
BOLD = '\033[1m'

if budget:
    pct = cost / budget * 100
    if   pct <= 25:  rating, rc = 'LEGENDARY',  M
    elif pct <= 50:  rating, rc = 'EFFICIENT',  C
    elif pct <= 75:  rating, rc = 'SOLID',      G
    elif pct <= 100: rating, rc = 'CLOSE CALL', Y
    else:            rating, rc = 'BUSTED',     R
    cost_str   = f"${cost:.4f}/${budget:.2f} {pct:.0f}%"
    rating_str = f"{rc}{rating}{RESET}"
else:
    cost_str   = f"${cost:.4f}"
    rating_str = None

sep = f" {DIM}|{RESET} "
ctx_str = None
if ctx_pct is not None:
    if   ctx_pct >= 90: ctx_str = f"{R}📦 {ctx_pct:.0f}%{RESET}"
    elif ctx_pct >= 75: ctx_str = f"{Y}📦 {ctx_pct:.0f}%{RESET}"
    elif ctx_pct >= 50: ctx_str = f"{DIM}ctx {ctx_pct:.0f}%{RESET}"

prefix = f"{BOLD}{C}{'💤' if fainted else '⛳'}{RESET}"
parts = [f"{prefix} {quest}", cost_str]
if rating_str: parts.append(rating_str)
if ctx_str: parts.append(ctx_str)
parts += [f"Floor {floor}", f"{C}{model_label}{RESET}"]
print('\n' + sep.join(parts))
PYEOF
