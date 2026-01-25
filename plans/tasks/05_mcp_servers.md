# Task 05: MCP Server Health Check

**Status:** Ready to Execute
**Priority:** High
**Estimated Time:** 20-30 minutes
**Dependencies:** None
**Terminal:** #6

---

## 🎯 Objective

Validate connectivity to all 14 MCP (Model Context Protocol) servers. Document which servers are active vs. planned. Test health endpoints and basic functionality.

---

## 📋 WIN-WIN-WIN Validation

### 👑 ANH (Owner) WINS:
- Multi-agent orchestration proven
- MCP infrastructure visibility
- Scalability foundation validated

### 🏢 AGENCY WINS:
- Agent coordination framework works
- Microservices architecture proven
- Debugging capability (health checks)

### 🚀 CLIENT/STARTUP WINS:
- Reliable AI-powered features
- Distributed processing (faster responses)
- Fault-tolerant architecture

✅ **All 3 parties WIN** → Proceed

---

## ⚡ Execution Commands

```bash
cd /Users/macbookprom1/mekong-cli

echo "=== MCP Server Connectivity Test ==="
echo "Testing 14 MCP servers from Antigravity Engine catalog"
echo ""

# Define all 14 MCP servers (per CLAUDE.md)
declare -A MCP_SERVERS=(
  ["agency_server"]="8081"
  ["coding_server"]="8086"
  ["commander_server"]="8094"
  ["marketing_server"]="8087"
  ["network_server"]="8088"
  ["revenue_server"]="8082"
  ["solo_revenue_server"]="8089"
  ["orchestrator_server"]="8084"
  ["quota_server"]="8085"
  ["recovery_server"]="8090"
  ["security_server"]="8083"
  ["sync_server"]="8091"
  ["ui_server"]="8092"
  ["workflow_server"]="8093"
)

# Test each server
ACTIVE_COUNT=0
INACTIVE_COUNT=0

for server in "${!MCP_SERVERS[@]}"; do
  port="${MCP_SERVERS[$server]}"

  # Test health endpoint
  if curl -f -s --max-time 2 http://localhost:$port/health > /dev/null 2>&1; then
    echo "  ✅ $server (port $port) ACTIVE"
    ACTIVE_COUNT=$((ACTIVE_COUNT + 1))
  else
    echo "  ⚠️ $server (port $port) NOT RUNNING"
    INACTIVE_COUNT=$((INACTIVE_COUNT + 1))
  fi
done

echo ""
echo "=== Summary ==="
echo "Active Servers: $ACTIVE_COUNT/14"
echo "Inactive Servers: $INACTIVE_COUNT/14"

# Check if critical servers are running
echo ""
echo "=== Critical Server Status ==="
CRITICAL_SERVERS=("agency_server" "revenue_server" "security_server")

for server in "${CRITICAL_SERVERS[@]}"; do
  port="${MCP_SERVERS[$server]}"

  if curl -f -s --max-time 2 http://localhost:$port/health > /dev/null 2>&1; then
    echo "  ✅ CRITICAL: $server is ACTIVE"
  else
    echo "  ❌ CRITICAL: $server is NOT RUNNING (may block features)"
  fi
done

# Document MCP server implementation status
echo ""
echo "=== Generating MCP Status Report ==="
cat > /tmp/mcp-status-report.md << 'EOF'
# MCP Server Status Report

**Generated:** $(date)

## Active Servers
EOF

for server in "${!MCP_SERVERS[@]}"; do
  port="${MCP_SERVERS[$server]}"
  if curl -f -s --max-time 2 http://localhost:$port/health > /dev/null 2>&1; then
    echo "- ✅ **$server** (port $port)" >> /tmp/mcp-status-report.md
  fi
done

cat >> /tmp/mcp-status-report.md << 'EOF'

## Inactive/Planned Servers
EOF

for server in "${!MCP_SERVERS[@]}"; do
  port="${MCP_SERVERS[$server]}"
  if ! curl -f -s --max-time 2 http://localhost:$port/health > /dev/null 2>&1; then
    echo "- ⚠️ **$server** (port $port) - Not Running" >> /tmp/mcp-status-report.md
  fi
done

cat >> /tmp/mcp-status-report.md << 'EOF'

## Recommendations
1. Start critical servers: agency_server, revenue_server, security_server
2. Implement health check monitoring (cron job or systemd)
3. Document which servers are required vs. optional for each feature

EOF

cat /tmp/mcp-status-report.md

echo ""
echo "=== MCP Server Health Check Complete ==="
echo "Report saved to: /tmp/mcp-status-report.md"
```

---

## ✅ Success Criteria

- [ ] At least 3 critical servers respond (agency, revenue, security)
- [ ] Health endpoints return JSON status
- [ ] No connection timeouts (servers respond within 2 seconds)
- [ ] MCP status report generated
- [ ] Documentation updated with active server list

**Note:** Not all 14 servers need to be active. Some may be planned but not implemented yet. Document current state.

---

## 🔧 Failure Recovery

### No Servers Respond
```bash
# Check if MCP servers are implemented
ls -la antigravity/mcp_servers/

# Look for startup scripts
find . -name "*mcp*start*.sh" -o -name "*mcp*server*.py"

# If servers aren't implemented yet, document this:
echo "MCP servers not yet fully implemented" > docs/mcp-roadmap.md
```

### Port Conflicts
```bash
# Check what's using MCP ports
for port in 8081 8082 8083 8084 8085 8086 8087 8088 8089 8090 8091 8092 8093 8094; do
  lsof -i:$port | grep LISTEN && echo "Port $port in use" || echo "Port $port free"
done
```

### Start MCP Servers Manually
```bash
# If startup scripts exist, run them
# Example structure (adjust based on actual implementation):
cd antigravity/mcp_servers
./start-agency-server.sh &
./start-revenue-server.sh &
./start-security-server.sh &

# Wait for startup
sleep 5

# Re-test health endpoints
curl http://localhost:8081/health
```

---

## 📊 Post-Task Validation

```bash
# Count running MCP processes
ps aux | grep -c "[m]cp.*server" || echo "No MCP processes found"

# Test a working server with detailed response
curl -v http://localhost:8081/health 2>&1 | head -n 20

# Check for error logs
tail -n 50 antigravity/mcp_servers/logs/*.log 2>/dev/null || echo "No MCP logs found"
```

**Expected Response from Health Endpoint:**
```json
{
  "status": "healthy",
  "server": "agency_server",
  "version": "1.0.0",
  "uptime": 3600
}
```

---

## 🚀 Next Steps After Success

1. **If <5 servers active:**
   - Document planned vs. implemented servers
   - Create implementation plan for missing servers
   - Update CLAUDE.md with accurate server count

2. **If ≥5 servers active:**
   - Set up health check monitoring (cron job)
   - Configure auto-restart on failure
   - Proceed to Task 06: Skills Integration Test

3. **Production Deployment:**
   - Deploy MCP servers to Cloud Run (separate services)
   - Configure load balancer with health checks
   - Set up alerting for server failures

---

**Report:** `echo "TASK 05 COMPLETE - MCP STATUS: $ACTIVE_COUNT/14 ACTIVE" >> /tmp/binh-phap-execution.log`
