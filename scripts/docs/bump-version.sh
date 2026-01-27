#!/bin/bash
set -e

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/../.."

echo "⬆️  Bumping version..."

cd "$PROJECT_ROOT"

# Get current version
CURRENT_VERSION=$(node -p "require('./package.json').version")
echo "Current version: $CURRENT_VERSION"

# Determine bump type from commits
if git log --pretty=format:"%s" | grep -q "BREAKING CHANGE"; then
  BUMP_TYPE="major"
elif git log --pretty=format:"%s" | grep -q "^feat"; then
  BUMP_TYPE="minor"
else
  BUMP_TYPE="patch"
fi

echo "Bump type: $BUMP_TYPE"

# Bump version
# Note: This requires the root to have a package.json.
# If it's a python project primarily, we might bump VERSION file instead.
# Checking if package.json exists in root...

if [ -f "package.json" ]; then
    npm version $BUMP_TYPE --no-git-tag-version
    NEW_VERSION=$(node -p "require('./package.json').version")
else
    # Python-style versioning (VERSION file)
    if [ ! -f "VERSION" ]; then
        echo "0.0.0" > VERSION
    fi

    # Simple semantic version bump logic for shell
    IFS='.' read -r major minor patch < VERSION

    if [ "$BUMP_TYPE" == "major" ]; then
        major=$((major + 1))
        minor=0
        patch=0
    elif [ "$BUMP_TYPE" == "minor" ]; then
        minor=$((minor + 1))
        patch=0
    else
        patch=$((patch + 1))
    fi

    NEW_VERSION="$major.$minor.$patch"
    echo "$NEW_VERSION" > VERSION
fi

echo "New version: $NEW_VERSION"

# Create git tag (optional, commented out for local dev safety)
# git add package.json VERSION 2>/dev/null || true
# git commit -m "chore(release): v$NEW_VERSION"
# git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION"

echo "✅ Version bumped to v$NEW_VERSION"
