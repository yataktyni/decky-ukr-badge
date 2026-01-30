#!/bin/bash
# scripts/release.sh
# Automated release helper:
# 1. Fetches latest tags
# 2. Calculates next patch version
# 3. Creates tag
# 4. Pushes tag

set -e

# Fetch tags to ensure we have latest truth
echo "🔄 Fetching tags..."
git fetch --tags

# Get latest SemVer tag (vX.Y.Z)
# We use sort -V to ensure version sorting (e.g. v0.9.10 > v0.9.9)
LATEST_TAG=$(git tag -l "v*" | sort -V | tail -n1)

if [ -z "$LATEST_TAG" ]; then
    LATEST_TAG="v0.0.0"
fi

echo "📍 Latest tag: $LATEST_TAG"

# Strip 'v' prefix
VERSION=${LATEST_TAG#v}

# Split into components
IFS='.' read -r MAJOR MINOR PATCH <<< "$VERSION"

# Increment logic
PATCH=$((PATCH + 1))

# Simplistic Rollover (keep same as update-version.sh)
if [ $PATCH -ge 10 ]; then
    PATCH=0
    MINOR=$((MINOR + 1))
fi

if [ $MINOR -ge 10 ]; then
    MINOR=0
    MAJOR=$((MAJOR + 1))
fi

NEW_TAG="v${MAJOR}.${MINOR}.${PATCH}"

echo "🚀 Releasing $NEW_TAG..."

git tag $NEW_TAG
git push origin $NEW_TAG

echo "✅ Released $NEW_TAG! CI will build and publish it."
