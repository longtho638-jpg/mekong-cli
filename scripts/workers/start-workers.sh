#!/bin/bash
# Start Background Workers for AgencyOS
# Usage: ./start-workers.sh [email|report|export|all]

WORKER_TYPE=${1:-all}
CONCURRENCY=${2:-1}

# Ensure we are in the root directory
cd "$(dirname "$0")/../.."

echo "🚀 Starting AgencyOS Background Workers (Type: $WORKER_TYPE)..."

# Load environment variables if .env exists
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | awk '/=/ {print $1}')
fi

# Function to start a worker in background
start_worker() {
    local name=$1
    local script=$2
    echo "Starting $name worker..."
    PYTHONPATH=. python3 $script &
    PIDS+=($!)
}

PIDS=()

if [ "$WORKER_TYPE" == "email" ] || [ "$WORKER_TYPE" == "all" ]; then
    start_worker "Email" "backend/workers/email_worker.py"
fi

if [ "$WORKER_TYPE" == "report" ] || [ "$WORKER_TYPE" == "all" ]; then
    start_worker "Report" "backend/workers/report_worker.py"
fi

if [ "$WORKER_TYPE" == "export" ] || [ "$WORKER_TYPE" == "all" ]; then
    start_worker "Export/Cleanup" "backend/workers/export_worker.py"
fi

if [ "$WORKER_TYPE" == "webhook" ] || [ "$WORKER_TYPE" == "all" ]; then
    start_worker "Webhook" "backend/workers/webhook_worker.py"
fi

if [ "$WORKER_TYPE" == "scheduler" ] || [ "$WORKER_TYPE" == "all" ]; then
    start_worker "Scheduler" "backend/services/scheduler_service.py"
fi

echo "✅ Workers started with PIDs: ${PIDS[@]}"

# Trap SIGINT/SIGTERM to kill child processes
cleanup() {
    echo "Stopping workers..."
    for pid in "${PIDS[@]}"; do
        kill $pid
    done
    wait
    echo "All workers stopped."
}

trap cleanup SIGINT SIGTERM

# Wait for all background processes
wait
