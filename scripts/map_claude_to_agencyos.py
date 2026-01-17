#!/usr/bin/env python3
"""
Map .claude configuration to .agencyos/mekong-cli structure.
"""
import json
import os
import shutil

CLAUDE_DIR = ".claude"
AGENCY_DIR = ".agencyos"
MCP_FILE = "mcp.json"

def map_configs():
    print(f"🗺️  Mapping {CLAUDE_DIR} -> {AGENCY_DIR}...")
    
    if not os.path.exists(CLAUDE_DIR):
        print(f"⚠️  {CLAUDE_DIR} not found. Nothing to map.")
        return

    if not os.path.exists(AGENCY_DIR):
        print(f"⚠️  {AGENCY_DIR} not found. Creating...")
        os.makedirs(AGENCY_DIR, exist_ok=True)

    # Map MCP config
    claude_mcp = os.path.join(CLAUDE_DIR, MCP_FILE)
    agency_mcp = os.path.join(AGENCY_DIR, MCP_FILE)
    
    if os.path.exists(claude_mcp):
        print(f"📄 Found {claude_mcp}")
        try:
            with open(claude_mcp, 'r') as f:
                data = json.load(f)
            
            # Write to agencyos
            with open(agency_mcp, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"✅ Synced {MCP_FILE} to {AGENCY_DIR}")
        except Exception as e:
            print(f"❌ Failed to sync MCP config: {e}")
    else:
        print(f"ℹ️  No {MCP_FILE} in {CLAUDE_DIR}")

    # Check agents mapping
    claude_agents = os.path.join(CLAUDE_DIR, "agents")
    if os.path.exists(claude_agents):
        print(f"ℹ️  Found agents in {CLAUDE_DIR}. Note: Mekong-CLI uses 'backend/agents' or '.agent/subagents'.")
        print("   Please manually review if migration is needed.")

if __name__ == "__main__":
    map_configs()
