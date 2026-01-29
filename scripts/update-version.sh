#!/bin/bash

# Sync version from Git tag (if available) or package.json to plugin.json

set -e

# Check if a version was passed as argument (from CI/CD)
if [ -n "$1" ]; then
    VERSION="$1"
    echo "📦 Using provided version: $VERSION"
elif [ -n "$GITHUB_REF_NAME" ] && [[ "$GITHUB_REF_NAME" == v* ]]; then
    # Extract version from Git tag (e.g., v0.6.7 -> 0.6.7)
    VERSION="${GITHUB_REF_NAME#v}"
    echo "🏷️ Using Git tag version: $VERSION"
else
    # Fallback to package.json
    VERSION=$(jq -r .version < package.json)
    echo "📄 Using package.json version: $VERSION"
fi

if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
    echo "❌ Error: Could not determine version"
    exit 1
fi

# Update package.json
jq --arg v "$VERSION" '.version = $v' package.json > package.json.tmp
mv package.json.tmp package.json
echo "✅ Updated package.json version to $VERSION"

# Update plugin.json
jq --arg v "$VERSION" '.version = $v' plugin.json > plugin.json.tmp
mv plugin.json.tmp plugin.json
echo "✅ Updated plugin.json version to $VERSION"
