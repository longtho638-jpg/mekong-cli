#!/bin/bash

# Integration Test for Engine Layer
# Usage: ./test-integration.sh

echo "🚀 Starting Integration Test..."

# 1. Check Redis
if ! nc -z localhost 6379; then
  echo "❌ Redis is not running. Please start it with 'docker compose up -d' in infrastructure/."
  exit 1
fi
echo "✅ Redis is running."

# 2. Start Engine (Port 3000)
echo "🚀 Starting Engine API..."
cd ../../../apps/engine
npm start > ../../engine.log 2>&1 &
ENGINE_PID=$!
echo "   PID: $ENGINE_PID"

# 3. Start Worker
echo "🚀 Starting Worker..."
cd ../worker
npm start > ../../worker.log 2>&1 &
WORKER_PID=$!
echo "   PID: $WORKER_PID"

# Wait for startup
sleep 3

# 4. Send Test Request
echo "📤 Sending Test Request..."
RESPONSE=$(curl -s -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "model": "test-model",
    "messages": [
      { "role": "user", "content": "Hello from integration test" }
    ]
  }')

echo "   Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "queued"; then
  echo "✅ Job Queued Successfully"
else
  echo "❌ Failed to queue job"
  kill $ENGINE_PID $WORKER_PID
  exit 1
fi

# 5. Verify Worker Processing
echo "⏳ Waiting for Worker to process..."
sleep 10

if grep -q "Job .* completed" ../../worker.log; then
  echo "✅ Worker processed job successfully"
else
  echo "❌ Worker did not process job. Check worker.log"
  echo "--- Worker Log ---"
  cat ../../worker.log
  echo "------------------"
  echo "--- Engine Log ---"
  cat ../../engine.log
  echo "------------------"
fi

# Cleanup
echo "🧹 Cleaning up..."
kill $ENGINE_PID $WORKER_PID
rm ../../engine.log ../../worker.log

echo "✅ Integration Test Complete"
