#!/bin/bash

# Telegram Notification Hook for Claude Code (Project-Specific)
# This hook sends a notification to Telegram when Claude finishes a task

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

TIMESTAMP=$(date '+%Y-%m-%d %H:%M:%S')

# Check configuration
TELEGRAM_BOT_TOKEN="${TELEGRAM_BOT_TOKEN:-}"
TELEGRAM_CHAT_ID="${TELEGRAM_CHAT_ID:-}"

if [[ -z "$TELEGRAM_BOT_TOKEN" ]]; then
    log_warn "Telegram notification skipped: TELEGRAM_BOT_TOKEN not set"
    exit 0
fi

if [[ -z "$TELEGRAM_CHAT_ID" ]]; then
    log_warn "Telegram notification skipped: TELEGRAM_CHAT_ID not set"
    exit 0
fi

send_telegram_message() {
    local message="$1"
    local url="https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage"
    
    # Use jq to construct the payload safely
    local payload=$(jq -n \
        --arg chat_id "$TELEGRAM_CHAT_ID" \
        --arg text "$message" \
        '{ 
            chat_id: $chat_id,
            text: $text,
            parse_mode: "Markdown",
            disable_web_page_preview: true
        }')
    
    local response=$(curl -s -o /dev/null -w "%{http_code}" -X POST \
        -H "Content-Type: application/json" \
        -d "$payload" \
        "$url")

    if [[ "$response" -ge 200 && "$response" -lt 300 ]]; then
        log_info "Telegram notification sent"
    else
        log_error "Failed to send Telegram notification (HTTP $response)"
    fi
}

# --- Event Handling ---

case "$HOOK_TYPE" in
    "Stop")
        # Build Tools Text
        TOOLS_USED=$(echo "$INPUT" | jq -r '.toolsUsed[]?.tool // empty' | sort | uniq -c | sort -nr)
        
        TOTAL_TOOLS=$(echo "$INPUT" | jq '.toolsUsed | length')
        
        MESSAGE="🚀 *Project Task Completed*
        
📅 *Time:* ${TIMESTAMP}
📁 *Project:* ${PROJECT_NAME}
🔧 *Total Operations:* ${TOTAL_TOOLS}
🆔 *Session:* ${SESSION_ID:0:8}...

*Tools Used: *"

        if [[ -n "$TOOLS_USED" ]]; then
            MESSAGE="${MESSAGE}
```
${TOOLS_USED}
```"
        else
            MESSAGE="${MESSAGE}
None"
        fi

        # Build Files Modified Text
        FILES_MODIFIED=$(echo "$INPUT" | jq -r '
            .toolsUsed[]? 
            | select(.tool == "Edit" or .tool == "Write" or .tool == "MultiEdit") 
            | .parameters.file_path // empty
        ' | sort | uniq)

        if [[ -n "$FILES_MODIFIED" ]]; then
            MESSAGE="${MESSAGE}

*Files Modified: *"
            # Process files line by line
            while IFS= read -r file; do
                if [[ -n "$file" ]]; then
                    # Show relative path from project root
                    relative_file=$(echo "$file" | sed "s|^${PROJECT_DIR}/||")
                    MESSAGE="${MESSAGE}
• ${relative_file}"
                fi
            done <<< "$FILES_MODIFIED"
        fi
        
        MESSAGE="${MESSAGE}

📍 *Location:* 
`${PROJECT_DIR}`"
        ;;
        
    "SubagentStop")
        SUBAGENT_TYPE=$(echo "$INPUT" | jq -r '.subagentType // "unknown"')
        MESSAGE="🤖 *Project Subagent Completed*

📅 *Time:* ${TIMESTAMP}
📁 *Project:* ${PROJECT_NAME}
🔧 *Agent Type:* ${SUBAGENT_TYPE}
🆔 *Session:* ${SESSION_ID:0:8}...

Specialized agent completed its task.

📍 *Location:* 
`${PROJECT_DIR}`"
        ;;
        
    *)
        MESSAGE="📝 *Project Code Event*

📅 *Time:* ${TIMESTAMP}
📁 *Project:* ${PROJECT_NAME}
📋 *Event:* ${HOOK_TYPE}
🆔 *Session:* ${SESSION_ID:0:8}...

📍 *Location:* 
`${PROJECT_DIR}`"
        ;;
esac

# Send the notification
send_telegram_message "$MESSAGE"
