#!/bin/bash
# scripts/update-version.sh
# Update version in package.json and plugin.json
#
# Usage:
#   ./scripts/update-version.sh patch   # Bug fixes (1.0.8 → 1.0.9)
#   ./scripts/update-version.sh minor   # New features (1.0.9 → 1.1.0)
#   ./scripts/update-version.sh major   # Breaking changes (1.9.5 → 2.0.0)

set -e

BUMP_TYPE="${1:-patch}"

# Validate bump type
if [[ ! "$BUMP_TYPE" =~ ^(patch|minor|major)$ ]]; then
    echo "❌ Invalid bump type: $BUMP_TYPE"
    echo "   Usage: $0 [patch|minor|major]"
    exit 1
fi

# Read current version from package.json
CURRENT_VERSION=$(jq -r .version < package.json)
echo "📄 Current version: $CURRENT_VERSION"

# Split version into components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Increment based on bump type
case "$BUMP_TYPE" in
    patch)
        PATCH=$((PATCH + 1))
        ;;
    minor)
        MINOR=$((MINOR + 1))
        PATCH=0
        ;;
    major)
        MAJOR=$((MAJOR + 1))
        MINOR=0
        PATCH=0
        ;;
esac

NEW_VERSION="${MAJOR}.${MINOR}.${PATCH}"
echo "📦 New version: $NEW_VERSION ($BUMP_TYPE bump)"

# Update package.json
jq --arg v "$NEW_VERSION" '.version = $v' package.json > package.json.tmp && mv package.json.tmp package.json
echo "✅ Updated package.json"

# Update plugin.json
jq --arg v "$NEW_VERSION" '.version = $v' plugin.json > plugin.json.tmp && mv plugin.json.tmp plugin.json
echo "✅ Updated plugin.json"

echo ""
echo "🎉 Version updated to $NEW_VERSION"
echo "   Next: git add -A && git commit -m 'chore: bump version to $NEW_VERSION'"
