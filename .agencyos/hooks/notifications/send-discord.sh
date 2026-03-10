#!/bin/bash

# Usage: ./send-discord.sh 'Your message here'
# Sends a formatted embed notification to a Discord Webhook.

set -e  # Exit immediately if a command exits with a non-zero status

# --- Helper Functions ---

log_info() {
    echo "ℹ️  $1"
}

log_error() {
    echo "❌ $1" >&2
}

log_warn() {
    echo "⚠️  $1"
}

# Load environment variables with priority: process.env > .agencyos/.env > .agencyos/hooks/.env
load_env() {
    local script_dir="$(dirname "$0")"
    local project_root="$script_dir/../../.." # Assuming script is in .agencyos/hooks/notifications

    # 1. Start with lowest priority: .agencyos/hooks/notifications/.env
    if [[ -f "$script_dir/.env" ]]; then
        set -a
        source "$script_dir/.env"
        set +a
    fi

    # 2. Override with .agencyos/.env
    if [[ -f "$project_root/.agencyos/.env" ]]; then
        set -a
        source "$project_root/.agencyos/.env"
        set +a
    fi

    # 3. Process env has highest priority (handled natively by shell)
}

escape_json_string() {
    local input="$1"
    # Basic JSON escaping: backslashes and double quotes
    # For robust escaping, a tool like 'jq' is preferred if available
    input="${input//\\/\\\\}"
    input="${input//"/\"}"
    # Replace newlines with literal \n
    input="${input//$'
'/\\n}"
    input="${input//$''/}"
    echo "$input"
}

# --- Main Logic ---

load_env

message="$1"

if [[ -z "$DISCORD_WEBHOOK_URL" ]]; then
    log_warn "Discord notification skipped: DISCORD_WEBHOOK_URL not set"
    exit 0 # Exit gracefully so as not to break the hook chain
fi

if [[ -z "$message" ]]; then
    log_error "Usage: $0 'Your message here'"
    exit 1
fi

project_name="$(basename "$(pwd)")"
timestamp="$(date -u +%Y-%m-%dT%H:%M:%S.000Z)"
session_time="$(date '+%H:%M:%S')"
escaped_message="$(escape_json_string "$message")"

# Construct JSON payload
# Using a Here-Doc for readability
payload=$(cat <<EOF
{
  "embeds": [{
    "title": "🤖 Claude Code Session Complete",
    "description": "$escaped_message",
    "color": 5763719,
    "timestamp": "$timestamp",
    "footer": {
        "text": "Project Name • $project_name"
    },
    "fields": [
        {
            "name": "⏰ Session Time",
            "value": "$session_time",
            "inline": true
        },
        {
            "name": "📂 Project",
            "value": "$project_name",
            "inline": true
        }
    ]
  }]
}
EOF
)

# Send request
response=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$DISCORD_WEBHOOK_URL" \
    -H "Content-Type: application/json" \
    -d "$payload")

if [[ "$response" -ge 200 && "$response" -lt 300 ]]; then
    log_info "Discord notification sent"
else
    log_error "Failed to send Discord notification (HTTP $response)"
    exit 1
fi
