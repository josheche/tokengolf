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

# Load config for emotion mode
try:
    with open(os.path.join(os.path.expanduser('~'), '.tokengolf', 'config.json')) as _cf: _config = json.load(_cf)
except: _config = {}
emotion_mode = _config.get('emotionMode', 'emoji')

cost    = (session.get('cost') or {}).get('total_cost_usd') or run.get('spent', 0)
# Persist CC's authoritative cost so session-end can read it (SessionEnd doesn't receive cost in stdin)
try:
    with open(os.path.join(os.path.expanduser('~'), '.tokengolf', 'session-cost'), 'w') as _cf: _cf.write(str(cost))
except: pass
ctx_pct = (session.get('context_window') or {}).get('used_percentage') or None
quest   = (run.get('quest') or '')[:32]
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

R, G, Y, M, C, W, DIM, RESET = '\033[31m','\033[32m','\033[33m','\033[35m','\033[36m','\033[37m','\033[2m','\033[0m'
BOLD = '\033[1m'

# Emotion mapping
EMOTIONS = {
    'SLEEPING':     ('💤', '(-ω-)zzZ',    DIM),
    'ZOMBIE':       ('🧟', '[¬º-°]¬',     R),
    'DEAD':         ('🪦', '(X_X)',        R),
    'OVERWHELMED':  ('🤯', '(×_×)',        R),
    'FRUSTRATED':   ('😡', '(ノಠ益ಠ)ノ',   R),
    'SWEATING':     ('😰', '(°△°)',        Y),
    'FATIGUED':     ('🥱', '(-_-)',        DIM),
    'TENSE':        ('😬', '(•_•)',        Y),
    'GRINDING':     ('😤', '(ง•̀_•́)ง',     Y),
    'FOCUSED':      ('🎯', '(•̀ᴗ•́)',       C),
    'CRUISING':     ('🛹', '(‾◡‾)',        G),
    'VIBING':       ('😎', '(◕‿◕)',        G),
}

# Implicit Gold-tier budgets for flow mode (same as MODEL_BUDGET_TIERS in score.js)
FLOW_BUDGETS = {'Haiku': 0.40, 'Sonnet': 1.50, 'Opus': 7.50, 'Paladin': 7.50, '?': 1.50}

def get_emotion(fainted, budget, cost, ctx_pct, failed_tools, prompt_count, model_name):
    if fainted: return 'SLEEPING'
    # Use explicit budget if set, otherwise derive from model's Gold tier
    effective_budget = budget if (budget is not None and budget > 0) else FLOW_BUDGETS.get(model_name, 1.50)
    budget_pct = (cost / effective_budget * 100) if effective_budget > 0 else 0
    ctx = ctx_pct if ctx_pct is not None else 0
    if budget_pct >= 115: return 'ZOMBIE'
    if budget_pct >= 100: return 'DEAD'
    if budget_pct >= 75 and ctx >= 90: return 'OVERWHELMED'
    if failed_tools >= 5: return 'FRUSTRATED'
    if budget_pct >= 75: return 'SWEATING'
    if prompt_count >= 15 and budget_pct > 50: return 'FATIGUED'
    if budget_pct >= 50: return 'TENSE'
    if budget_pct >= 25: return 'GRINDING'
    if ctx >= 75: return 'FOCUSED'
    return 'VIBING'

# Model-calibrated spend tiers
SPEND_TIERS = {
    'Haiku':   (0.03, 0.15, 0.40, 1.00, 2.50),
    'Sonnet':  (0.10, 0.50, 1.50, 4.00, 10.00),
    'Opus':    (0.50, 2.50, 7.50, 20.00, 50.00),
    'Paladin': (0.30, 1.50, 4.50, 12.00, 30.00),
    '?':       (0.10, 0.50, 1.50, 4.00, 10.00),
}
st = SPEND_TIERS.get(model, SPEND_TIERS['Sonnet'])
if   cost < st[0]: tier_emoji = '✨'
elif cost < st[1]: tier_emoji = '💎'
elif cost < st[2]: tier_emoji = '🥇'
elif cost < st[3]: tier_emoji = '🥈'
elif cost < st[4]: tier_emoji = '🥉'
else:              tier_emoji = '💸'

# Use explicit budget or implicit Gold-tier budget for display
eff_budget = budget if (budget is not None and budget > 0) else FLOW_BUDGETS.get(model, 1.50)
pct = cost / eff_budget * 100 if eff_budget > 0 else 0
if   pct <= 15:  rating, rc, eff_emoji = 'LEGENDARY',  Y, '🌟'
elif pct <= 30:  rating, rc, eff_emoji = 'EPIC',       M, '🔥'
elif pct <= 50:  rating, rc, eff_emoji = 'PRO',        C, '💪'
elif pct <= 75:  rating, rc, eff_emoji = 'SOLID',      G, '✅'
elif pct <= 100: rating, rc, eff_emoji = 'CLOSE CALL', W, '⚠️'
else:            rating, rc, eff_emoji = 'BUST',       R, '💥'
accent = R if pct > 75 else Y
# Budget progress bar
bar_w = 11
bar_filled = min(bar_w, int(pct / 100 * bar_w + 0.5))
bar_empty = bar_w - bar_filled
bar = f"{accent}{'▓' * bar_filled}{'░' * bar_empty}{RESET}"
cost_str = f"{tier_emoji} {DIM}${RESET}{cost:.2f}{DIM}/{eff_budget:.2f}{RESET} {bar} {pct:.0f}%"
rating_str = f" {eff_emoji} {rc}{rating}{RESET}"

# Context bar (line 2, always shown — default ctx_pct to 0)
ctx_pct_val = ctx_pct if ctx_pct is not None else 0
ctx_w = 10
ctx_filled = min(ctx_w, int(ctx_pct_val / 100 * ctx_w + 0.5))
ctx_empty = ctx_w - ctx_filled
if   ctx_pct_val >= 90: ctx_color, ctx_icon = R, '🗿'
elif ctx_pct_val >= 75: ctx_color, ctx_icon = Y, '🪨'
elif ctx_pct_val >= 60: ctx_color, ctx_icon = Y, '🧱'
elif ctx_pct_val >= 40: ctx_color, ctx_icon = C, '🎒'
elif ctx_pct_val >= 20: ctx_color, ctx_icon = G, '📚'
else:                   ctx_color, ctx_icon = G, '🪶'
ctx_bar = f"{ctx_color}{'▓' * ctx_filled}{'░' * ctx_empty}{RESET}"

# Compute emotion
failed_tools = run.get('failedToolCalls', 0)
prompt_count = run.get('promptCount', 0)
emotion_key = get_emotion(fainted, budget, cost, ctx_pct, failed_tools, prompt_count, model)
emotion_emoji, emotion_kaomoji, emotion_color = EMOTIONS[emotion_key]

# Line 1: accent bar + icon + quest/emotion + cost bar + rating + floor
if emotion_mode == 'emoji':
    icon = emotion_emoji
else:
    icon = '💤' if fainted else '⛳'
quest_display = quest if quest else f"{emotion_color}{emotion_key}{RESET}"
parts = [f" {accent}██{RESET} {icon} {quest_display}  {cost_str}{rating_str}"]
if budget: parts.append(f"  {DIM}{floor}{RESET}")
line1 = ''.join(parts)

# Line 2: model + context bar (always shown)
line2 = f" {accent}██{RESET} {model_label}  🧠 {ctx_bar} {ctx_pct_val:.0f}% {ctx_icon}"

# Output (leading blank line separates from any existing statusline above)
print()
print(line1)
print(line2)
if emotion_mode == 'ascii':
    print(f" {accent}██{RESET} {emotion_color}{emotion_kaomoji} {emotion_key}{RESET}")
PYEOF
