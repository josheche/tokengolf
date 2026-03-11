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
# Persist CC's authoritative cost so session-end can read it (SessionEnd doesn't receive cost in stdin)
try:
    with open(os.path.join(os.path.expanduser('~'), '.tokengolf', 'session-cost'), 'w') as _cf: _cf.write(str(cost))
except: pass
ctx_pct = (session.get('context_window') or {}).get('used_percentage') or None
quest   = (run.get('quest') or 'Flow')[:32]
budget  = run.get('budget')
floor   = f"F{run.get('floor',1)}/{run.get('totalFloors',5)}"
sm = session.get('model') or {}; m = (sm.get('id','') or run.get('model','') if isinstance(sm,dict) else sm or run.get('model','')).lower()
# opusplan must be checked before opus (opusplan contains 'opus' as substring)
if   'opusplan' in m: model, model_emoji = 'Paladin', '⚜️'
elif 'haiku'    in m: model, model_emoji = 'Haiku',   '🏹'
elif 'sonnet'   in m: model, model_emoji = 'Sonnet',  '⚔️'
elif 'opus'     in m: model, model_emoji = 'Opus',    '🧙'
else:                 model, model_emoji = '?',        '?'
try:
    with open(os.path.expanduser('~/.claude/settings.json')) as _sf: _s = json.load(_sf)
except: _s = {}
effort  = _s.get('effortLevel')
fast    = run.get('fastMode', False)
fainted = run.get('fainted', False)

label_parts = [f'{model_emoji} {model}']
if effort and effort != 'medium': label_parts.append(effort.capitalize())
if fast: label_parts.append('⚡Fast')
model_label = '·'.join(label_parts)

R, G, Y, M, C, DIM, RESET = '\033[31m','\033[32m','\033[33m','\033[35m','\033[36m','\033[2m','\033[0m'
BOLD = '\033[1m'

if   cost < 0.10: tier_emoji = '💎'
elif cost < 0.30: tier_emoji = '🥇'
elif cost < 1.00: tier_emoji = '🥈'
elif cost < 3.00: tier_emoji = '🥉'
else:             tier_emoji = '💸'

# Accent bar color: red in danger, yellow otherwise
if budget:
    pct = cost / budget * 100
    if   pct <= 25:  rating, rc = 'LEGENDARY',  M
    elif pct <= 50:  rating, rc = 'EFFICIENT',  C
    elif pct <= 75:  rating, rc = 'SOLID',      G
    elif pct <= 100: rating, rc = 'CLOSE CALL', Y
    else:            rating, rc = 'BUSTED',     R
    accent = R if pct > 75 else Y
    # Budget progress bar
    bar_w = 11
    bar_filled = min(bar_w, int(pct / 100 * bar_w + 0.5))
    bar_empty = bar_w - bar_filled
    bar = f"{accent}{'▓' * bar_filled}{'░' * bar_empty}{RESET}"
    cost_str = f"{DIM}${RESET}{cost:.2f}{DIM}/{budget:.2f}{RESET} {bar} {pct:.0f}%"
    rating_str = f"  {rc}{rating}{RESET}"
else:
    accent = Y
    cost_str = f"{tier_emoji} ${cost:.2f}"
    rating_str = ''

# Context bar (line 2, only shown when >= 50%)
ctx_line = None
if ctx_pct is not None and ctx_pct >= 50:
    ctx_w = 10
    ctx_filled = min(ctx_w, int(ctx_pct / 100 * ctx_w + 0.5))
    ctx_empty = ctx_w - ctx_filled
    if   ctx_pct >= 90: ctx_color, ctx_icon = R, '📦'
    elif ctx_pct >= 75: ctx_color, ctx_icon = Y, '🎒'
    else:               ctx_color, ctx_icon = G, '🪶'
    ctx_bar = f"{ctx_color}{'▓' * ctx_filled}{'░' * ctx_empty}{RESET}"
    ctx_line = f" {accent}██{RESET} 🧠 {ctx_bar} {ctx_pct:.0f}% {ctx_icon}"

# Line 1: accent bar + quest + cost bar + rating + model + floor
icon = '💤' if fainted else '⛳'
parts = [f" {accent}██{RESET} {icon} {quest}  {cost_str}{rating_str}  {model_label}"]
if budget: parts.append(f"  {DIM}{floor}{RESET}")
line1 = ''.join(parts)

# Output (leading blank line separates from any existing statusline above)
print()
print(line1)
if ctx_line: print(ctx_line)
PYEOF
