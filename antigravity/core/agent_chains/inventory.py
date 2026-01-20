"""
🏯 Agent Chains Inventory
========================

Defines the available agents and their configuration.
"""

from pathlib import Path
from typing import Dict

from .models import AgentCategory, AgentConfig

# Base path for agents
AGENT_BASE_DIR = Path(".claude/agents")


# Agent Inventory (26 total)
# Maps agent_id -> AgentConfig
AGENT_INVENTORY: Dict[str, AgentConfig] = {
    # 🛠️ Development (8)
    "fullstack-developer": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "fullstack-developer.md"),
    "planner": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "planner.md"),
    "tester": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "tester.md"),
    "code-reviewer": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "code-reviewer.md"),
    "debugger": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "debugger.md"),
    "git-manager": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "git-manager.md"),
    "database-admin": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "database-admin.md"),
    "mcp-manager": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "mcp-manager.md"),
    # 💰 Business (8)
    "money-maker": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "money-maker.md"),
    "deal-closer": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "deal-closer.md"),
    "client-magnet": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "client-magnet.md"),
    "client-value": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "client-value.md"),
    "growth-strategist": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "growth-strategist.md"),
    "binh-phap-strategist": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "binh-phap-strategist.md"),
    "revenue-engine": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "revenue-engine.md"),
    "project-manager": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "project-manager.md"),
    # 🎨 Content (5)
    "content-factory": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "content-factory.md"),
    "copywriter": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "copywriter.md"),
    "docs-manager": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "docs-manager.md"),
    "journal-writer": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "journal-writer.md"),
    "researcher": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "researcher.md"),
    # 🖌️ Design (3)
    "ui-ux-designer": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "ui-ux-designer.md"),
    "flow-expert": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "flow-expert.md"),
    "scout": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "scout.md"),
    # 🌐 External (2)
    "scout-external": AgentConfig(AgentCategory.EXTERNAL, AGENT_BASE_DIR / "scout-external.md"),
    "brainstormer": AgentConfig(AgentCategory.EXTERNAL, AGENT_BASE_DIR / "brainstormer.md"),
}
