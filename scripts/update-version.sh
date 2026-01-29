#!/bin/bash
# scripts/update-version.sh
# Sync version from package.json, increment it, and update both files.

set -e

# Read current version from package.json
CURRENT_VERSION=$(jq -r .version < package.json)
echo "📄 Current version: $CURRENT_VERSION"

# Split version into components
IFS='.' read -r MAJOR MINOR PATCH <<< "$CURRENT_VERSION"

# Smart Increment logic (Rollover at 10)
NEW_PATCH=$((PATCH + 1))
NEW_MINOR=$MINOR
NEW_MAJOR=$MAJOR

if [ $NEW_PATCH -ge 10 ]; then
    NEW_PATCH=0
    NEW_MINOR=$((MINOR + 1))
fi

if [ $NEW_MINOR -ge 10 ]; then
    NEW_MINOR=0
    NEW_MAJOR=$((MAJOR + 1))
fi

NEW_VERSION="${NEW_MAJOR}.${NEW_MINOR}.${NEW_PATCH}"
echo "📦 New version: $NEW_VERSION"

# Update package.json
jq --arg v "$NEW_VERSION" '.version = $v' package.json > package.json.tmp && mv package.json.tmp package.json
echo "✅ Updated package.json version to $NEW_VERSION"

# Update plugin.json
jq --arg v "$NEW_VERSION" '.version = $v' plugin.json > plugin.json.tmp && mv plugin.json.tmp plugin.json
echo "✅ Updated plugin.json version to $NEW_VERSION"
