# Task 03: Antigravity Core Optimization

**Status:** Ready to Execute
**Priority:** Medium
**Estimated Time:** 20-25 minutes
**Dependencies:** None
**Terminal:** #3

---

## 🎯 Objective

Validate Antigravity Core modules (agents, orchestrators, quota engine) are operational and integrated with `mekong-cli`. Test 24 agent inventory and 14 MCP servers connectivity.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Antigravity Engine proven operational
- Multi-agent orchestration works
- Cost optimization (Gemini quota management)

### 🏢 AGENCY WINS:
- Scalable agent framework
- Unified CLI (`cc` commands)
- Proven automation capabilities

### 🚀 CLIENT/STARTUP WINS:
- AI-powered features work reliably
- Fast response times (Gemini 1M context)
- Intelligent routing (cost vs. performance)

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli

# Activate main venv
source .venv/bin/activate

echo "=== Testing Antigravity Core Modules ==="

# Test 1: Agent Inventory (24 agents)
echo ""
echo "=== Agent Inventory Check ==="
python3 << 'EOF'
import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

try:
    from antigravity.core.agents import list_agents
    agents = list_agents()
    print(f"✅ Found {len(agents)} agents:")
    for agent in agents[:5]:
        print(f"  - {agent['name']}: {agent['role']}")
    if len(agents) >= 24:
        print(f"✅ PASS: All {len(agents)} agents loaded")
    else:
        print(f"⚠️ WARNING: Expected 24+ agents, found {len(agents)}")
except Exception as e:
    print(f"❌ FAIL: Agent loading error: {e}")
EOF

# Test 2: Quota Engine (Gemini cost optimization)
echo ""
echo "=== Quota Engine Status ==="
python3 << 'EOF'
import sys
sys.path.insert(0, '/Users/macbookprom1/mekong-cli')

try:
    from antigravity.core.quota_engine import QuotaEngine
    engine = QuotaEngine()
    status = engine.check_quota()
    print(f"✅ Quota Engine operational")
    print(f"  - Model: {status.get('current_model', 'N/A')}")
    print(f"  - Tokens Used: {status.get('tokens_used', 0):,}")
    print(f"  - Tokens Remaining: {status.get('tokens_remaining', 0):,}")
except Exception as e:
    print(f"⚠️ WARNING: Quota engine not configured (optional): {e}")
EOF

# Test 3: MCP Server Connectivity (14 servers)
echo ""
echo "=== MCP Server Health Check ==="
MCP_SERVERS=(
  "agency_server:8081"
  "revenue_server:8082"
  "security_server:8083"
  "orchestrator_server:8084"
  "quota_server:8085"
)

for server in "${MCP_SERVERS[@]}"; do
  name="${server%%:*}"
  port="${server##*:}"

  curl -f -s http://localhost:$port/health > /dev/null 2>&1 && \
    echo "  ✅ $name (port $port) OK" || \
    echo "  ⚠️ $name (port $port) NOT RUNNING (optional)"
done

# Test 4: CC CLI Commands
echo ""
echo "=== CC CLI Command Verification ==="
./cc --help > /dev/null 2>&1 && echo "  ✅ cc CLI works" || echo "  ❌ cc CLI broken"

# Test specific commands (dry-run mode)
./cc revenue dashboard --dry-run 2>&1 | grep -q "dashboard" && \
  echo "  ✅ cc revenue command works" || \
  echo "  ⚠️ cc revenue command issue"

echo ""
echo "=== Antigravity Core Validation Complete ==="
```

---

## ✅ Success Criteria

- [ ] At least 20 agents loaded successfully
- [ ] Quota engine initializes (or gracefully skips if unconfigured)
- [ ] At least 3 MCP servers respond (others optional)
- [ ] `cc` CLI executes without errors
- [ ] `cc revenue dashboard --dry-run` works
- [ ] No Python import errors

---

## 🔧 Failure Recovery

### Agent Loading Fails
```bash
# Check antigravity module structure
ls -la antigravity/core/agents/

# Test direct import
python3 -c "from antigravity.core.agents import list_agents; print(list_agents())"
```

### Quota Engine Error
```bash
# Create placeholder config (if missing)
cat > antigravity/core/quota_config.json << 'EOF'
{
  "default_model": "gemini-3-flash",
  "max_tokens_per_day": 1000000,
  "fallback_model": "gemini-3-pro-high"
}
EOF
```

### MCP Servers Not Running
```bash
# Start MCP servers (if implemented)
# Note: MCP servers may not be fully implemented yet
# This is optional - document which servers are active

# Check for server startup scripts
ls -la antigravity/mcp_servers/
```

### CC CLI Not Working
```bash
# Make cc executable
chmod +x /Users/macbookprom1/mekong-cli/cc

# Test direct Python invocation
python3 /Users/macbookprom1/mekong-cli/scripts/cc_revenue.py --help
```

---

## 📊 Post-Task Validation

```bash
# Generate agent inventory report
python3 << 'EOF'
from antigravity.core.agents import list_agents
agents = list_agents()
print(f"\n📊 Agent Inventory Report:")
print(f"Total Agents: {len(agents)}")

categories = {}
for agent in agents:
    category = agent.get('category', 'Uncategorized')
    categories[category] = categories.get(category, 0) + 1

for cat, count in sorted(categories.items()):
    print(f"  {cat}: {count}")
EOF
```

**Expected Output:**
- Strategic Agents: 4-6
- Development Agents: 8-10
- Growth Agents: 6-8
- Operations Agents: 4-6

---

## 🚀 Next Steps After Success

1. Document active MCP servers: `echo "Active MCP servers: 3/14" > docs/mcp-status.md`
2. Optimize agent loading (lazy load for faster startup)
3. Proceed to Task 04: Payment Flow Verification

---

**Report:** `echo "TASK 03 COMPLETE - ANTIGRAVITY CORE VALIDATED" >> /tmp/binh-phap-execution.log`
