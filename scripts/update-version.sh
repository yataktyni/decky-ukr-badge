#!/bin/bash

# Sync version from package.json to plugin.json

set -e

# Get the version from package.json
VERSION=$(jq -r .version < package.json)

if [ -z "$VERSION" ] || [ "$VERSION" = "null" ]; then
    echo "❌ Error: Could not read version from package.json"
    exit 1
fi

# Update the version in plugin.json
jq --arg v "$VERSION" '.version = $v' plugin.json > plugin.json.tmp
mv plugin.json.tmp plugin.json

echo "✅ Updated plugin.json version to $VERSION"
