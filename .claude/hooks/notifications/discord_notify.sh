#!/bin/bash

# Discord Notification Hook for Claude Code
# This hook sends a notification to Discord when Claude finishes a task

set -euo pipefail

# --- Helper Functions ---

log_info() {
    echo "ℹ️  $1" >&2
}

log_error() {
    echo "❌ $1" >&2
}

log_warn() {
    echo "⚠️  $1" >&2
}

check_dependency() {
    if ! command -v "$1" &> /dev/null;
 then
        log_warn "Missing dependency: $1. Notification skipped."
        exit 0
    fi
}

escape_json_string() {
    local input="$1"
    # jq can handle escaping reliably
    echo "$input" | jq -R . | sed 's/^"//;s/"$//'
}

# --- Configuration & Setup ---

# Load environment variables with priority: process.env > .claude/.env > .claude/hooks/.env
load_env() {
    local script_dir="$(dirname "$0")"
    local project_root="$script_dir/../../.." # Assuming script is in .claude/hooks/notifications

    # 1. Start with lowest priority: .claude/hooks/.env
    if [[ -f "$script_dir/.env" ]]; then
        set -a
        source "$script_dir/.env"
        set +a
    fi

    # 2. Override with .claude/.env
    if [[ -f "$project_root/.claude/.env" ]]; then
        set -a
        source "$project_root/.claude/.env"
        set +a
    fi

    # 3. Process env (already loaded) has highest priority
}

# --- Main Logic ---

# Check critical dependencies first
check_dependency "jq"
check_dependency "curl"

load_env

# Read JSON input from stdin
if [ -t 0 ]; then
    log_error "No input provided on stdin."
    exit 1
fi
INPUT=$(cat)

# Extract basic info
HOOK_TYPE=$(echo "$INPUT" | jq -r '.hookType // "unknown"')
PROJECT_DIR=$(echo "$INPUT" | jq -r '.projectDir // ""')
SESSION_ID=$(echo "$INPUT" | jq -r '.sessionId // ""')

# Default project name if empty
if [[ -z "$PROJECT_DIR" ]]; then
    PROJECT_NAME="Unknown Project"
else
    PROJECT_NAME=$(basename "$PROJECT_DIR")
fi

TIMESTAMP=$(date -u +%Y-%m-%dT%H:%M:%S.000Z)
DISPLAY_TIME=$(date '+%Y-%m-%d %H:%M:%S')

# Check configuration
DISCORD_WEBHOOK_URL="${DISCORD_WEBHOOK_URL:-}"
if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    log_warn "Discord notification skipped: DISCORD_WEBHOOK_URL not set"
    exit 0
fi

send_discord_embed() {
    local title="$1"
    local description="$2"
    local color="$3"
    local fields="$4"

    # Use jq to construct the payload safely
    local payload=$(jq -n \
        --arg title "$title" \
        --arg desc "$description" \
        --argjson color "$color" \
        --arg time "$TIMESTAMP" \
        --arg footer "Project Name • $PROJECT_NAME" \
        --argjson fields "$fields" \
        '{ 
            embeds: [{
                title: $title,
                description: $desc,
                color: $color,
                timestamp: $time,
                footer: { text: $footer },
                fields: $fields
            }]
        }')

    local response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DISCORD_WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "$payload")

    if [[ "$response" -ge 200 && "$response" -lt 300 ]]; then
        log_info "Discord notification sent"
    else
        log_error "Failed to send Discord notification (HTTP $response)"
    fi
}

# --- Event Handling ---

case "$HOOK_TYPE" in
    "Stop")
        # Build Tools Text
        TOOLS_USED=$(echo "$INPUT" | jq -r '.toolsUsed[]?.tool // empty' | sort | uniq -c | sort -nr)
        if [[ -n "$TOOLS_USED" ]]; then
            # Format: "**3** ToolName"
            TOOLS_TEXT=$(echo "$TOOLS_USED" | awk '{print "• **" $1 "** " $2}' | paste -sd '\n' -)
        else
            TOOLS_TEXT="No tools used"
        fi
        
        # Build Files Modified Text
        # Complex jq filter to get unique files from specific tools
        FILES_MODIFIED=$(echo "$INPUT" | jq -r '
            .toolsUsed[]? 
            | select(.tool == "Edit" or .tool == "Write" or .tool == "MultiEdit") 
            | .parameters.file_path // empty
        ' | sort | uniq)

        if [[ -n "$FILES_MODIFIED" ]]; then
             # Remove project dir prefix if present for cleaner display
             FILES_TEXT=$(echo "$FILES_MODIFIED" | sed "s|^${PROJECT_DIR}/||" | awk '{print "• `" $0 "`"}' | paste -sd '\n' -)
        else
            FILES_TEXT="No files modified"
        fi

        TOTAL_TOOLS=$(echo "$INPUT" | jq '.toolsUsed | length')

        # Construct Fields JSON using jq for safety
        FIELDS=$(jq -n \
            --arg time "$DISPLAY_TIME" \
            --arg ops "$TOTAL_TOOLS" \
            --arg sid "${SESSION_ID:0:8}..." \
            --arg tools "$TOOLS_TEXT" \
            --arg files "$FILES_TEXT" \
            --arg loc "$PROJECT_DIR" \
            '[ 
                { name: "⏰ Session Time", value: $time, inline: true },
                { name: "🔧 Total Operations", value: $ops, inline: true },
                { name: "🆔 Session ID", value: $sid, inline: true },
                { name: "📦 Tools Used", value: $tools, inline: false },
                { name: "📝 Files Modified", value: $files, inline: false },
                { name: "📍 Location", value: ("`" + $loc + "`"), inline: false }
            ]')

        send_discord_embed "🤖 Claude Code Session Complete" "✅ Claude Code session completed successfully" 5763719 "$FIELDS"
        ;;

    "SubagentStop")
        SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.subagentType // "unknown"')
        
        FIELDS=$(jq -n \
            --arg time "$DISPLAY_TIME" \
            --arg type "$SUBAGENT_TYPE" \
            --arg sid "${SESSION_ID:0:8}..." \
            --arg loc "$PROJECT_DIR" \
            '[ 
                { name: "⏰ Time", value: $time, inline: true },
                { name: "🔧 Agent Type", value: $type, inline: true },
                { name: "🆔 Session ID", value: $sid, inline: true },
                { name: "📍 Location", value: ("`" + $loc + "`"), inline: false }
            ]')

        send_discord_embed "🎯 Claude Code Subagent Complete" "Specialized agent completed its task" 3447003 "$FIELDS"
        ;;

    *)
        FIELDS=$(jq -n \
            --arg time "$DISPLAY_TIME" \
            --arg type "$HOOK_TYPE" \
            --arg sid "${SESSION_ID:0:8}..." \
            --arg loc "$PROJECT_DIR" \
            '[ 
                { name: "⏰ Time", value: $time, inline: true },
                { name: "📋 Event Type", value: $type, inline: true },
                { name: "🆔 Session ID", value: $sid, inline: true },
                { name: "📍 Location", value: ("`" + $loc + "`"), inline: false }
            ]')

        send_discord_embed "📝 Claude Code Event" "Claude Code event triggered" 10070709 "$FIELDS"
        ;;
esac