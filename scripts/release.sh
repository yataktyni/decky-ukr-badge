#!/bin/bash
# scripts/release.sh
# Create and push a git tag for the current version
#
# Usage:
#   ./scripts/release.sh          # Tag current version
#   ./scripts/release.sh patch    # Bump patch (1.2.8 -> 1.2.9), then tag
#   ./scripts/release.sh minor    # Bump minor (1.2.9 -> 1.3.0), then tag
#   ./scripts/release.sh major    # Bump major (1.9.9 -> 2.0.0), then tag
#   ./scripts/release.sh --help   # Show help

set -e

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
cd "$PROJECT_DIR"

BUMP_TYPE="$1"

if [[ "$BUMP_TYPE" == "--help" || "$BUMP_TYPE" == "-h" ]]; then
    echo "Usage:"
    echo "  ./scripts/release.sh          # Tag current version"
    echo "  ./scripts/release.sh patch    # Bump patch (1.2.8 -> 1.2.9), then tag"
    echo "  ./scripts/release.sh minor    # Bump minor (1.2.9 -> 1.3.0), then tag"
    echo "  ./scripts/release.sh major    # Bump major (1.9.9 -> 2.0.0), then tag"
    exit 0
fi

# If bump type specified, update version first
if [[ -n "$BUMP_TYPE" ]]; then
    echo "📦 Bumping version ($BUMP_TYPE)..."
    bash "$SCRIPT_DIR/update-version.sh" "$BUMP_TYPE"
    echo ""
fi

# Get current version from package.json
VERSION=$(jq -r .version < package.json)
TAG="v$VERSION"

echo "🔍 Checking if tag $TAG exists..."

# Check if tag already exists
if git rev-parse "$TAG" >/dev/null 2>&1; then
    echo "❌ Tag $TAG already exists!"
    echo "   Either bump version first or delete the existing tag."
    exit 1
fi

echo "🏷️  Creating tag: $TAG"

# Stage and commit version changes if any
if [[ -n "$(git status --porcelain package.json plugin.json 2>/dev/null)" ]]; then
    git add package.json plugin.json
    git commit -m "chore: release $TAG"
fi

# Create and push tag
git tag "$TAG"
git push origin main --tags

echo ""
echo "✅ Released $TAG!"
echo "   - Tag pushed to origin"
echo "   - Decky CI will build and publish automatically"
