#!/usr/bin/env bash
# Creates a GitHub Release from the current version tag with CHANGELOG notes.
# Called automatically during `npm publish` via postpublish.
set -euo pipefail

VERSION=$(node -p "require('./package.json').version")
TAG="v${VERSION}"

echo "Creating GitHub Release for ${TAG}..."

# Extract the changelog section for this version.
# Grabs everything between "## [X.Y.Z]" and the next "## [" or "---" separator.
NOTES=$(awk "
  /^## \\[${VERSION}\\]/ { found=1; next }
  found && /^## \\[/ { exit }
  found && /^---$/ { exit }
  found { print }
" CHANGELOG.md)

# If no changelog section found, fall back to auto-generated notes from commits
if [ -z "$NOTES" ]; then
  echo "  No CHANGELOG section found for ${VERSION}, using auto-generated notes"
  gh release create "$TAG" --generate-notes --title "$TAG"
else
  echo "$NOTES" | gh release create "$TAG" --title "$TAG" --notes-file -
fi

echo "Done — https://github.com/josheche/tokengolf/releases/tag/${TAG}"
