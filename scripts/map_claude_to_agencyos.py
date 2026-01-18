#!/usr/bin/env python3
"""
🌉 BRIDGE SYNC: Claude <-> AgencyOS/Mekong
==========================================
Synchronizes configuration, agents, and skills between the ClaudeKit
environment (.claude) and the AgencyOS/Mekong environment (.agent/.agencyos).

Goals:
1. Ensure MCP config is identical.
2. Identify missing agents/subagents.
3. Report on skill parity.
"""

import json
import logging
import os
from dataclasses import dataclass, field
from pathlib import Path
from typing import List

# Configure Logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(levelname)s - %(message)s",
    datefmt="%Y-%m-%d %H:%M:%S",
)
logger = logging.getLogger("BridgeSync")

# Paths
ROOT_DIR = Path.cwd()
CLAUDE_DIR = ROOT_DIR / ".claude"
AGENCY_DIR = ROOT_DIR / ".agencyos"
AGENT_DIR = ROOT_DIR / ".agent"
GEMINI_MEMORY = ROOT_DIR / "GEMINI.md"


@dataclass
class SyncReport:
    claude_agents: int = 0
    gemini_agents: int = 0
    missing_in_gemini: List[str] = field(default_factory=list)
    missing_in_claude: List[str] = field(default_factory=list)
    synced_configs: List[str] = field(default_factory=list)


class BridgeSync:
    def __init__(self):
        self.report = SyncReport()

    def sync_mcp(self):
        """Syncs MCP configuration files."""
        logger.info("Syncing MCP configurations...")

        claude_mcp = CLAUDE_DIR / "mcp.json"
        agency_mcp = AGENCY_DIR / "mcp.json"

        if not claude_mcp.exists():
            logger.warning(f"No MCP config found at {claude_mcp}")
            return

        try:
            AGENCY_DIR.mkdir(exist_ok=True)

            with open(claude_mcp, "r") as f:
                data = json.load(f)

            # Simple check if content differs before writing
            write = True
            if agency_mcp.exists():
                with open(agency_mcp, "r") as f:
                    current_data = json.load(f)
                if current_data == data:
                    write = False

            if write:
                with open(agency_mcp, "w") as f:
                    json.dump(data, f, indent=2)
                self.report.synced_configs.append("mcp.json")
                logger.info("✅ Synced mcp.json")
            else:
                logger.info("mcp.json is already up to date.")

        except Exception as e:
            logger.error(f"Failed to sync MCP: {e}")

    def analyze_agents(self):
        """Analyzes agent parity."""
        logger.info("Analyzing Agent Parity...")

        # Claude Agents
        claude_agents_path = CLAUDE_DIR / "agents"
        claude_agents = set()
        if claude_agents_path.exists():
            claude_agents = {f.stem for f in claude_agents_path.glob("*.md")}

        # Gemini/AgencyOS Subagents
        gemini_agents_path = AGENT_DIR / "subagents"
        gemini_agents = set()
        if gemini_agents_path.exists():
            # Recursively find md files in subagents
            for p in gemini_agents_path.rglob("*.md"):
                gemini_agents.add(p.stem)

        self.report.claude_agents = len(claude_agents)
        self.report.gemini_agents = len(gemini_agents)

        # Naive matching by name
        self.report.missing_in_gemini = list(claude_agents - gemini_agents)
        self.report.missing_in_claude = list(gemini_agents - claude_agents)

        logger.info(f"Claude Agents: {len(claude_agents)}")
        logger.info(f"Gemini Agents: {len(gemini_agents)}")

    def update_memory(self):
        """Updates GEMINI.md with sync status."""
        if not GEMINI_MEMORY.exists():
            return

        logger.info("Updating GEMINI.md...")

        status_section = f"""
## 🌉 Bridge Sync Status (Last Run: {os.popen("date").read().strip()})

- **MCP Config**: {"✅ Synced" if "mcp.json" in self.report.synced_configs else "Checked"}
- **Agent Parity**:
  - Claude: {self.report.claude_agents}
  - Gemini: {self.report.gemini_agents}
  - Missing in Gemini: {len(self.report.missing_in_gemini)} (e.g., {", ".join(self.report.missing_in_gemini[:3])}...)
"""
        # Append or Replace logic would go here. For now, we append if not present.
        # Ideally, we should parse GEMINI.md, but that's complex.
        # We will just append a log entry.

        with open(GEMINI_MEMORY, "a") as f:
            f.write(f"\n{status_section}\n")

    def run(self):
        print("🚀 Starting Bridge Sync...")
        self.sync_mcp()
        self.analyze_agents()
        self.update_memory()

        print("\n📊 SYNC REPORT")
        print("=" * 40)
        print(f"Synced Configs: {self.report.synced_configs}")
        print(f"Claude Agents:  {self.report.claude_agents}")
        print(f"Gemini Agents:  {self.report.gemini_agents}")
        if self.report.missing_in_gemini:
            print(f"⚠️  Missing in Gemini ({len(self.report.missing_in_gemini)}):")
            for a in self.report.missing_in_gemini[:5]:
                print(f"   - {a}")
            if len(self.report.missing_in_gemini) > 5:
                print("   ...")
        print("=" * 40)


if __name__ == "__main__":
    bridge = BridgeSync()
    bridge.run()
