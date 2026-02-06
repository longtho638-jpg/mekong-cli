#!/bin/bash

# Docker Integration Test for Engine Layer
# Usage: ./test-engine-docker.sh
# Prerequisite: docker compose up -d (running in infrastructure/ directory)

echo "🚀 Starting Docker Integration Test..."

# 1. Check if services are reachable
echo "📡 Checking Service Health..."

# Check Engine API (Port 3000)
if ! curl -s http://localhost:3000/health > /dev/null; then
  echo "❌ Engine API is not reachable at localhost:3000"
  echo "   Ensure 'docker compose up' is running and port 3000 is mapped."
  exit 1
fi
echo "✅ Engine API is reachable."

# Check Redis (Port 6379) - Optional check via nc
if command -v nc >/dev/null; then
  if ! nc -z localhost 6379; then
    echo "⚠️  Redis port 6379 not reachable (is it mapped in docker-compose?)"
  else
    echo "✅ Redis is reachable."
  fi
fi

# 2. Send Test Request
echo "📤 Sending Test Request to Engine..."
RESPONSE=$(curl -s -X POST http://localhost:3000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer dev-token" \
  -d '{
    "model": "docker-test-model",
    "messages": [
      { "role": "user", "content": "Hello from Docker container" }
    ]
  }')

echo "   Response: $RESPONSE"

if echo "$RESPONSE" | grep -q "queued"; then
  echo "✅ Job Queued Successfully"
else
  echo "❌ Failed to queue job"
  exit 1
fi

# 3. Verify Worker Logs (requires access to docker logs)
echo "⏳ Waiting for Worker to process (2s)..."
sleep 2

echo "🔍 Checking Docker Logs for 'agency_worker'..."
if docker logs agency_worker 2>&1 | grep -q "Job .* completed"; then
  echo "✅ Worker processed job successfully (found in logs)"
else
  echo "⚠️  Could not find completion message in logs."
  echo "   Please check manually: docker logs agency_worker"
fi

echo "✅ Docker Integration Test Complete"
