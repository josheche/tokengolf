#!/usr/bin/env bash
# Syncs plugin.json version from package.json and rebuilds plugin scripts.
# Called automatically during `npm version` lifecycle.
set -euo pipefail

VERSION=$(node -p "require('./package.json').version")
PLUGIN_JSON="plugin/.claude-plugin/plugin.json"
MARKETPLACE_JSON=".claude-plugin/marketplace.json"

echo "Syncing plugin version to v${VERSION}..."

# Update plugin.json version
node -e "
const fs = require('fs');
const p = JSON.parse(fs.readFileSync('${PLUGIN_JSON}', 'utf8'));
p.version = '${VERSION}';
fs.writeFileSync('${PLUGIN_JSON}', JSON.stringify(p, null, 2) + '\n');
"

# Update marketplace.json plugin version
node -e "
const fs = require('fs');
const m = JSON.parse(fs.readFileSync('${MARKETPLACE_JSON}', 'utf8'));
m.plugins[0].version = '${VERSION}';
fs.writeFileSync('${MARKETPLACE_JSON}', JSON.stringify(m, null, 2) + '\n');
"

# Rebuild plugin scripts
npm run build:plugin

echo "Done — plugin synced to v${VERSION}"
