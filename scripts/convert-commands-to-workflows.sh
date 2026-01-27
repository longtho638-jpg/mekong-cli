#!/bin/bash
# Convert claudekit commands to Antigravity workflows
# Usage: ./convert-commands-to-workflows.sh

GLOBAL_CMD_DIR="$HOME/.claude/commands"
PROJECT_CMD_DIR="/Users/macbookprom1/mekong-cli/.claude/commands"
WORKFLOW_DIR="/Users/macbookprom1/mekong-cli/.agent/workflows"

# Create claudekit subdirectory in workflows
mkdir -p "$WORKFLOW_DIR/claudekit"

convert_command() {
    local src="$1"
    local name=$(basename "$src" .md)
    local rel_path="${src#$GLOBAL_CMD_DIR/}"
    rel_path="${rel_path#$PROJECT_CMD_DIR/}"
    
    # Skip README files
    [[ "$name" == "README" ]] && return
    [[ "$name" == "COMMAND_COMPLIANCE_REPORT" ]] && return
    
    # Create destination path
    local dest_name=$(echo "$rel_path" | tr '/' '-' | sed 's/.md$//')
    local dest="$WORKFLOW_DIR/claudekit/${dest_name}.md"
    
    # Extract first line as description (skip frontmatter if exists)
    local first_line=$(head -20 "$src" | grep -v "^---" | grep -v "^$" | head -1)
    first_line="${first_line#\# }"
    first_line="${first_line:0:80}"
    
    # If no good description, use filename
    [[ -z "$first_line" ]] && first_line="Claudekit command: $name"
    
    # Create workflow file with proper frontmatter
    cat > "$dest" << EOF
---
description: $first_line
---

# Claudekit Command: /$dest_name

> Imported from claudekit-engineer

EOF
    
    # Append original content (skip existing frontmatter)
    if head -1 "$src" | grep -q "^---"; then
        # Has frontmatter, skip it
        sed -n '/^---$/,/^---$/!p' "$src" | tail -n +2 >> "$dest"
    else
        cat "$src" >> "$dest"
    fi
    
    echo "✅ Created: $dest_name"
}

echo "🔄 Converting Global Commands..."
find "$GLOBAL_CMD_DIR" -name "*.md" -type f | while read f; do
    convert_command "$f"
done

echo ""
echo "🔄 Converting Project Commands..."
find "$PROJECT_CMD_DIR" -name "*.md" -type f | while read f; do
    convert_command "$f"
done

echo ""
echo "✅ Done! Workflows created in: $WORKFLOW_DIR/claudekit/"
echo "📊 Total workflows: $(ls -1 "$WORKFLOW_DIR/claudekit/"*.md 2>/dev/null | wc -l)"
