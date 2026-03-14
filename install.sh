#!/usr/bin/env bash
# TokenGolf installer
# Usage: curl -fsSL https://raw.githubusercontent.com/josheche/tokengolf/main/install.sh | bash
set -euo pipefail

BOLD='\033[1m'
DIM='\033[2m'
GREEN='\033[32m'
YELLOW='\033[33m'
RED='\033[31m'
CYAN='\033[36m'
RESET='\033[0m'

info()  { printf "${BOLD}${CYAN}▶${RESET} %s\n" "$1"; }
ok()    { printf "${BOLD}${GREEN}✓${RESET} %s\n" "$1"; }
warn()  { printf "${BOLD}${YELLOW}!${RESET} %s\n" "$1"; }
err()   { printf "${BOLD}${RED}✗${RESET} %s\n" "$1" >&2; }

echo ""
printf "${YELLOW}██${RESET}  ${BOLD}TokenGolf Installer${RESET}\n"
printf "${YELLOW}██${RESET}  ${DIM}Every token matters${RESET}\n"
echo ""

# Check Node.js
if ! command -v node &>/dev/null; then
  err "Node.js is required but not installed."
  echo ""
  echo "  Install Node.js (v18+) from:"
  echo "    https://nodejs.org"
  echo "    brew install node"
  echo "    curl -fsSL https://fnm.vercel.app/install | bash"
  echo ""
  exit 1
fi

NODE_VERSION=$(node -v | sed 's/v//' | cut -d. -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
  err "Node.js v18+ required (found v$(node -v | sed 's/v//'))"
  exit 1
fi

ok "Node.js $(node -v) detected"

# Check npm
if ! command -v npm &>/dev/null; then
  err "npm is required but not installed."
  exit 1
fi

# Install tokengolf globally
info "Installing tokengolf via npm..."
npm install -g tokengolf

ok "tokengolf installed ($(tokengolf --version 2>/dev/null || echo 'unknown version'))"

# Patch Claude Code hooks (only if Claude Code is installed)
if [ -d "$HOME/.claude" ]; then
  info "Installing Claude Code hooks..."
  tokengolf install
else
  warn "Claude Code not detected — skipping hook setup."
  printf "  Run ${CYAN}tokengolf install${RESET} after installing Claude Code.\n"
fi

echo ""
printf "${YELLOW}██${RESET}  ${BOLD}${GREEN}Ready to play!${RESET}\n"
printf "${YELLOW}██${RESET}  ${DIM}Open Claude Code and /exit to see your first scorecard.${RESET}\n"
printf "${YELLOW}██${RESET}  ${DIM}Or run: tokengolf start${RESET}\n"
echo ""
