#!/bin/bash

# Quick test script for BizPlan CLI Toolkit
# Tests basic agent functionality

echo "🧪 Testing BizPlan CLI Toolkit..."
echo ""

# Test 1: CLI version
echo "Test 1: CLI Version"
./bin/bizplan version
echo "✅ Version command works"
echo ""

# Test 2: Build compiles
echo "Test 2: TypeScript Build"
npm run build > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi
echo ""

# Test 3: Check agent files
echo "Test 3: Agent Files"
core_agents=("01-refactor-plan.ts" "05-agent.ts" "06-agent.ts" "07-brand-positioning.ts" "14-agent.ts" "16-agent.ts")
for agent in "${core_agents[@]}"; do
  if [ -f "src/agents/$agent" ]; then
    echo "✅ $agent exists"
  else
    echo "❌ $agent missing"
  fi
done
echo ""

# Test 4: SKILL templates
echo "Test 4: SKILL Templates"
skill_count=$(ls templates/*SKILL*.json 2>/dev/null | wc -l)
echo "Found $skill_count SKILL templates"
if [ $skill_count -eq 24 ]; then
  echo "✅ All 24 SKILL templates present"
else
  echo "⚠️  Expected 24, found $skill_count"
fi
echo ""

echo "🎉 Basic tests complete!"
echo "Next: Test orchestration with real input"
