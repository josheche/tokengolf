#!/usr/bin/env bash
# Updates the Homebrew formula after npm publish.
# Usage: ./scripts/update-homebrew.sh
set -euo pipefail

VERSION=$(node -p "require('./package.json').version")
TARBALL="https://registry.npmjs.org/tokengolf/-/tokengolf-${VERSION}.tgz"
TAP_DIR="../homebrew-tokengolf"
FORMULA="${TAP_DIR}/Formula/tokengolf.rb"

echo "Updating Homebrew formula to v${VERSION}..."

# Fetch SHA256 of the published tarball
SHA=$(curl -sL "$TARBALL" | shasum -a 256 | cut -d' ' -f1)
if [ -z "$SHA" ]; then
  echo "Error: could not fetch tarball at ${TARBALL}" >&2
  echo "Has the version been published to npm?" >&2
  exit 1
fi

echo "  tarball: ${TARBALL}"
echo "  sha256:  ${SHA}"

# Update formula
sed -i '' "s|url \".*\"|url \"${TARBALL}\"|" "$FORMULA"
sed -i '' "s|sha256 \".*\"|sha256 \"${SHA}\"|" "$FORMULA"

# Commit and push
cd "$TAP_DIR"
git add Formula/tokengolf.rb
git commit -m "tokengolf ${VERSION}"
git push

echo "Done — brew upgrade tokengolf will now pull v${VERSION}"
