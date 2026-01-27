#!/bin/bash
set -e

# Get the directory of the script
DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
PROJECT_ROOT="$DIR/../.."

echo "📝 Generating Changelog..."

# Parse commits since last tag
LAST_TAG=$(git describe --tags --abbrev=0 2>/dev/null || echo "")

if [ -z "$LAST_TAG" ]; then
  echo "No tags found, generating changelog from beginning..."
  COMMITS=$(git log --pretty=format:"%s|%h|%an|%ad" --date=short)
else
  echo "Generating changelog since $LAST_TAG..."
  COMMITS=$(git log ${LAST_TAG}..HEAD --pretty=format:"%s|%h|%an|%ad" --date=short)
fi

# Categories
FEATURES=""
FIXES=""
BREAKING=""
DOCS=""
CHORE=""
OTHERS=""

# Process commits
while IFS='|' read -r message hash author date; do
  # Link to commit (adjust repo URL as needed)
  REPO_URL="https://github.com/agencyos/agencyos"
  LINK="([$hash]($REPO_URL/commit/$hash))"
  ENTRY="- ${message#*: } $LINK - *$author, $date*"

  if [[ $message =~ ^feat(\(.*\))?!?: ]]; then
    FEATURES="${FEATURES}\n${ENTRY}"
  elif [[ $message =~ ^fix(\(.*\))?!?: ]]; then
    FIXES="${FIXES}\n${ENTRY}"
  elif [[ $message =~ BREAKING[[:space:]]CHANGE ]]; then
    BREAKING="${BREAKING}\n${ENTRY}"
  elif [[ $message =~ ^docs(\(.*\))?!?: ]]; then
    DOCS="${DOCS}\n${ENTRY}"
  elif [[ $message =~ ^chore(\(.*\))?!?: ]]; then
    CHORE="${CHORE}\n${ENTRY}"
  else
    OTHERS="${OTHERS}\n- ${message} $LINK - *$author, $date*"
  fi
done <<< "$COMMITS"

# Output file
OUTPUT_FILE="$PROJECT_ROOT/docs-portal/docs/changelog.md"
mkdir -p "$(dirname "$OUTPUT_FILE")"

# Generate content
cat > "$OUTPUT_FILE" << EOF
---
title: Changelog
sidebar_position: 99
---

# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### ⚠️ Breaking Changes
${BREAKING:-"_No breaking changes_"}

### 🚀 Features
${FEATURES:-"_No new features_"}

### 🐛 Bug Fixes
${FIXES:-"_No bug fixes_"}

### 📚 Documentation
${DOCS:-"_No documentation changes_"}

### 🔧 Chore & Maintenance
${CHORE:-"_No chore changes_"}

### 📝 Other Changes
${OTHERS:-"_No other changes_"}

---

_Generated on $(date +%Y-%m-%d)_
EOF

echo "✅ Changelog generated at $OUTPUT_FILE"
