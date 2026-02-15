#!/bin/bash
# QA Certification Script
# Called by task-watcher.js to verify mission results.
# Outputs: A report summary for Opus (P0) to review.

PROJECT_DIR="$1"
REPORT_FILE="$2"

echo "Running QA Certification for: $PROJECT_DIR" > "$REPORT_FILE"
echo "Date: $(date)" >> "$REPORT_FILE"
echo "----------------------------------------" >> "$REPORT_FILE"

cd "$PROJECT_DIR" || exit 1

# 1. BUILD CHECK
if [ -f "package.json" ] && grep -q '"build":' "package.json"; then
  echo ">>> Running Build Check..." >> "$REPORT_FILE"
  npm run build >> "$REPORT_FILE" 2>&1
  if [ $? -eq 0 ]; then
    echo "✅ Build PASSED" >> "$REPORT_FILE"
  else
    echo "❌ Build FAILED" >> "$REPORT_FILE"
    echo "CRITICAL: Fix build errors before merging." >> "$REPORT_FILE"
    exit 1
  fi
else
  echo "ℹ️ No build script found (skipped)" >> "$REPORT_FILE"
fi

echo "----------------------------------------" >> "$REPORT_FILE"

# 2. PLAYWRIGHT CHECK (Headless)
if [ -f "package.json" ] && grep -q '"playwright":' "package.json"; then
  echo ">>> Running Playwright Tests (Headless)..." >> "$REPORT_FILE"
  # Run only if playwright config exists
  if [ -f "playwright.config.ts" ] || [ -f "playwright.config.js" ]; then
    npx playwright test --reporter=line >> "$REPORT_FILE" 2>&1
    if [ $? -eq 0 ]; then
      echo "✅ Playwright Tests PASSED" >> "$REPORT_FILE"
    else
      echo "❌ Playwright Tests FAILED" >> "$REPORT_FILE"
      echo "CRITICAL: Fix regression tests." >> "$REPORT_FILE"
      exit 1
    fi
  else
     echo "ℹ️ Playwright config missing (skipped)" >> "$REPORT_FILE"
  fi
else
  echo "ℹ️ No playwright dependency found (skipped)" >> "$REPORT_FILE"
fi

echo "----------------------------------------" >> "$REPORT_FILE"
echo "QA Certification COMPLETE." >> "$REPORT_FILE"
exit 0
