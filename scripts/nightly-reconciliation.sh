#!/bin/bash
#
# Mekong CLI - Nightly Reconciliation Cron Script
#
# This script runs the nightly billing reconciliation job.
# Install: crontab -e && add "0 2 * * * /path/to/this/script.sh"
#
# Environment Variables:
#   MEKONG_DATABASE_URL: PostgreSQL connection string
#   MEKONG_STRIPE_SECRET_KEY: Stripe API key
#   MEKONG_TELEGRAM_BOT_TOKEN: Optional, for alerts
#   MEKONG_TELEGRAM_OPS_CHANNEL_ID: Optional, for alerts
#   MEKONG_WEBHOOK_URL: Optional, for webhook alerts
#   MEKONG_LOG_DIR: Log directory (default: /var/log/mekong)
#

set -euo pipefail

# Configuration
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MEKONG_DIR="${SCRIPT_DIR}/.."
LOG_DIR="${MEKONG_LOG_DIR:-/var/log/mekong}"
LOG_FILE="${LOG_DIR}/reconciliation-$(date +\%Y-\%m-\%d).log"

# Ensure log directory exists
mkdir -p "${LOG_DIR}"

# Logging function
log() {
    echo "[$(date '+%Y-%m-%d %H:%M:%S')] $*" | tee -a "${LOG_FILE}"
}

# Error handler
error_exit() {
    log "ERROR: $*"
    exit 1
}

# Load environment from .env file if exists
ENV_FILE="${MEKONG_DIR}/.env"
if [ -f "${ENV_FILE}" ]; then
    log "Loading environment from ${ENV_FILE}"
    set -a
    source "${ENV_FILE}"
    set +a
fi

# Set environment variables with fallbacks
export DATABASE_URL="${MEKONG_DATABASE_URL:-${DATABASE_URL}}"
export STRIPE_SECRET_KEY="${MEKONG_STRIPE_SECRET_KEY:-${STRIPE_SECRET_KEY}}"
export TELEGRAM_BOT_TOKEN="${MEKONG_TELEGRAM_BOT_TOKEN:-${TELEGRAM_BOT_TOKEN}}"
export TELEGRAM_OPS_CHANNEL_ID="${MEKONG_TELEGRAM_OPS_CHANNEL_ID:-${TELEGRAM_OPS_CHANNEL_ID}}"
export RECONCILIATION_WEBHOOK_URL="${MEKONG_WEBHOOK_URL:-${RECONCILIATION_WEBHOOK_URL}}"

# Validate required environment variables
if [ -z "${DATABASE_URL}" ]; then
    error_exit "DATABASE_URL is not set"
fi

if [ -z "${STRIPE_SECRET_KEY}" ]; then
    error_exit "STRIPE_SECRET_KEY is not set"
fi

# Change to mekong directory
cd "${MEKONG_DIR}" || error_exit "Failed to change to ${MEKONG_DIR}"

# Activate virtual environment if exists
VENV_DIR="${MEKONG_DIR}/.venv"
if [ -d "${VENV_DIR}" ]; then
    log "Activating virtual environment"
    source "${VENV_DIR}/bin/activate"
fi

# Find Python
PYTHON="${PYTHON:-python3}"
if ! command -v "${PYTHON}" &> /dev/null; then
    PYTHON="python"
fi

log "Starting nightly reconciliation"
log "Python: $(${PYTHON} --version 2>&1)"
log "Date: $(date)"

# Run reconciliation
set +e  # Don't exit on error - we want to capture exit code

"${PYTHON}" -m src.jobs.nightly_reconciliation \
    --verbose \
    2>&1 | tee -a "${LOG_FILE}"

EXIT_CODE=$?
set -e

log "Reconciliation completed with exit code: ${EXIT_CODE}"

# Handle exit codes
case ${EXIT_CODE} in
    0)
        log "✅ Reconciliation completed successfully - no critical discrepancies"
        ;;
    1)
        log "⚠ CRITICAL: Reconciliation found critical discrepancies requiring attention"
        # Send alert
        if [ -n "${TELEGRAM_BOT_TOKEN}" ] && [ -n "${TELEGRAM_OPS_CHANNEL_ID}" ]; then
            curl -s -X POST \
                "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d "chat_id=${TELEGRAM_OPS_CHANNEL_ID}" \
                -d "text=⚠ Billing Reconciliation Alert

Status: Critical discrepancies found
Date: $(date '+%Y-%m-%d %H:%M')
Log: ${LOG_FILE}

Action required: Review and resolve discrepancies" \
                -d "parse_mode=Markdown" \
                || log "Failed to send Telegram alert"
        fi
        ;;
    *)
        log "❌ Reconciliation failed with exit code: ${EXIT_CODE}"
        # Send alert
        if [ -n "${TELEGRAM_BOT_TOKEN}" ] && [ -n "${TELEGRAM_OPS_CHANNEL_ID}" ]; then
            curl -s -X POST \
                "https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage" \
                -d "chat_id=${TELEGRAM_OPS_CHANNEL_ID}" \
                -d "text=🚨 Billing Reconciliation FAILED

Exit Code: ${EXIT_CODE}
Date: $(date '+%Y-%m-%d %H:%M')
Log: ${LOG_FILE}

Check logs for details" \
                -d "parse_mode=Markdown" \
                || log "Failed to send Telegram alert"
        fi
        ;;
esac

# Rotate logs (keep 30 days)
log "Rotating logs (keeping 30 days)"
find "${LOG_DIR}" -name "reconciliation-*.log" -mtime +30 -delete 2>/dev/null || true

log "Script completed"
exit ${EXIT_CODE}
