#!/bin/bash
# Workflow Consolidation Script
# Migrates .claude/workflows → .agent/workflows
# Part of Architecture Sync Audit remediation

set -e  # Exit on error

CLAUDE_WORKFLOWS=".claude/workflows"
AGENT_WORKFLOWS=".agent/workflows"
BACKUP_DIR=".workflow-migration-backup-$(date +%Y%m%d-%H%M%S)"

echo "🏯 AgencyOS Workflow Consolidation"
echo "=================================="
echo ""
echo "This script will:"
echo "  1. Backup .claude/workflows to $BACKUP_DIR"
echo "  2. Move all workflows to .agent/workflows"
echo "  3. Update any hardcoded references"
echo "  4. Remove empty .claude/workflows directory"
echo ""

# Check if source directory exists
if [ ! -d "$CLAUDE_WORKFLOWS" ]; then
    echo "❌ Source directory $CLAUDE_WORKFLOWS not found"
    exit 1
fi

# Check if target directory exists
if [ ! -d "$AGENT_WORKFLOWS" ]; then
    echo "⚠️  Target directory $AGENT_WORKFLOWS not found"
    echo "   Creating it now..."
    mkdir -p "$AGENT_WORKFLOWS"
fi

# Count files to migrate
FILE_COUNT=$(find "$CLAUDE_WORKFLOWS" -name "*.md" | wc -l | tr -d ' ')
echo "📊 Found $FILE_COUNT workflow files to migrate"
echo ""

# Confirmation prompt
read -p "Continue with migration? (y/N) " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo "Migration cancelled."
    exit 0
fi

echo ""
echo "🔄 Starting migration..."
echo ""

# Step 1: Create backup
echo "📦 Creating backup..."
mkdir -p "$BACKUP_DIR"
cp -R "$CLAUDE_WORKFLOWS" "$BACKUP_DIR/"
echo "✅ Backup created at $BACKUP_DIR"
echo ""

# Step 2: Move workflows
echo "📁 Moving workflow files..."
MOVED_COUNT=0

for file in "$CLAUDE_WORKFLOWS"/*.md; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")

        # Check if file already exists in target
        if [ -f "$AGENT_WORKFLOWS/$filename" ]; then
            echo "⚠️  $filename already exists in target - creating versioned copy"
            target_file="$AGENT_WORKFLOWS/${filename%.md}-from-claude.md"
        else
            target_file="$AGENT_WORKFLOWS/$filename"
        fi

        mv "$file" "$target_file"
        echo "   ✅ Moved: $filename → $(basename "$target_file")"
        ((MOVED_COUNT++))
    fi
done

echo ""
echo "✅ Moved $MOVED_COUNT workflow files"
echo ""

# Step 3: Update references
echo "🔍 Searching for hardcoded references to .claude/workflows..."

# Search in command files
COMMAND_REFS=$(grep -r "\.claude/workflows" .claude/commands --include="*.md" | wc -l | tr -d ' ')

if [ "$COMMAND_REFS" -gt 0 ]; then
    echo "⚠️  Found $COMMAND_REFS references in command files"
    echo "   Updating references..."

    # macOS vs Linux compatible sed
    if [[ "$OSTYPE" == "darwin"* ]]; then
        # macOS
        find .claude/commands -name "*.md" -exec sed -i '' 's|\.claude/workflows|.agent/workflows|g' {} +
    else
        # Linux
        find .claude/commands -name "*.md" -exec sed -i 's|\.claude/workflows|.agent/workflows|g' {} +
    fi

    echo "   ✅ Updated command references"
else
    echo "   ✅ No hardcoded references found in commands"
fi

# Search in documentation
DOC_REFS=$(grep -r "\.claude/workflows" docs --include="*.md" 2>/dev/null | wc -l | tr -d ' ')

if [ "$DOC_REFS" -gt 0 ]; then
    echo "⚠️  Found $DOC_REFS references in documentation"
    echo "   Updating documentation..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        find docs -name "*.md" -exec sed -i '' 's|\.claude/workflows|.agent/workflows|g' {} +
    else
        find docs -name "*.md" -exec sed -i 's|\.claude/workflows|.agent/workflows|g' {} +
    fi

    echo "   ✅ Updated documentation references"
else
    echo "   ✅ No hardcoded references found in docs"
fi

# Search in CLAUDE.md and other config files
CONFIG_REFS=$(grep -r "\.claude/workflows" CLAUDE.md .claude/CLAUDE.md README.md 2>/dev/null | wc -l | tr -d ' ')

if [ "$CONFIG_REFS" -gt 0 ]; then
    echo "⚠️  Found $CONFIG_REFS references in config files"
    echo "   Updating config files..."

    if [[ "$OSTYPE" == "darwin"* ]]; then
        sed -i '' 's|\.claude/workflows|.agent/workflows|g' CLAUDE.md 2>/dev/null || true
        sed -i '' 's|\.claude/workflows|.agent/workflows|g' .claude/CLAUDE.md 2>/dev/null || true
        sed -i '' 's|\.claude/workflows|.agent/workflows|g' README.md 2>/dev/null || true
    else
        sed -i 's|\.claude/workflows|.agent/workflows|g' CLAUDE.md 2>/dev/null || true
        sed -i 's|\.claude/workflows|.agent/workflows|g' .claude/CLAUDE.md 2>/dev/null || true
        sed -i 's|\.claude/workflows|.agent/workflows|g' README.md 2>/dev/null || true
    fi

    echo "   ✅ Updated config references"
else
    echo "   ✅ No hardcoded references found in configs"
fi

echo ""

# Step 4: Clean up empty directory
if [ -d "$CLAUDE_WORKFLOWS" ]; then
    REMAINING=$(find "$CLAUDE_WORKFLOWS" -name "*.md" | wc -l | tr -d ' ')

    if [ "$REMAINING" -eq 0 ]; then
        echo "🗑️  Removing empty .claude/workflows directory..."
        rmdir "$CLAUDE_WORKFLOWS"
        echo "   ✅ Directory removed"
    else
        echo "⚠️  $REMAINING files still remain in $CLAUDE_WORKFLOWS"
        echo "   Please review manually"
    fi
fi

echo ""
echo "═══════════════════════════════════════"
echo "✅ MIGRATION COMPLETE"
echo "═══════════════════════════════════════"
echo ""
echo "Summary:"
echo "  - Files migrated: $MOVED_COUNT"
echo "  - Backup location: $BACKUP_DIR"
echo "  - Target location: $AGENT_WORKFLOWS"
echo ""
echo "Next steps:"
echo "  1. Review migrated files in $AGENT_WORKFLOWS"
echo "  2. Test command execution to verify references work"
echo "  3. If everything works, delete backup: rm -rf $BACKUP_DIR"
echo "  4. Commit changes: git add . && git commit -m 'chore: consolidate workflows to .agent/workflows'"
echo ""
echo "🏯 Binh Pháp: \"Nhất tề, nhị nghị, tam kỳ, tứ chính\""
echo "   (Unity, Discipline, Strategy, Execution)"
