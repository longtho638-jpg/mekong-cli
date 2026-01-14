"""
🏯 Agent Chains - Auto-Orchestration Definitions

Maps each suite:subcommand to an optimal agent chain.
Each chain executes agents in sequence for maximum efficiency.

Usage:
    from antigravity.core.agent_chains import AGENT_CHAINS, get_chain
    chain = get_chain("dev", "cook")
"""

from typing import Dict, List, Tuple, Optional
from dataclasses import dataclass
from enum import Enum


class AgentCategory(Enum):
    """Agent categories."""
    DEVELOPMENT = "development"
    BUSINESS = "business"
    CONTENT = "content"
    DESIGN = "design"
    EXTERNAL = "external"


@dataclass
class AgentStep:
    """Single step in an agent chain."""
    agent: str
    action: str
    description: str
    optional: bool = False


# Agent Inventory (26 total)
AGENT_INVENTORY: Dict[str, Dict] = {
    # Development (8)
    "fullstack-developer": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/fullstack-developer.md"},
    "planner": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/planner.md"},
    "tester": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/tester.md"},
    "code-reviewer": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/code-reviewer.md"},
    "debugger": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/debugger.md"},
    "git-manager": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/git-manager.md"},
    "database-admin": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/database-admin.md"},
    "mcp-manager": {"category": AgentCategory.DEVELOPMENT, "file": ".claude/agents/mcp-manager.md"},
    
    # Business (8)
    "money-maker": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/money-maker.md"},
    "deal-closer": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/deal-closer.md"},
    "client-magnet": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/client-magnet.md"},
    "client-value": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/client-value.md"},
    "growth-strategist": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/growth-strategist.md"},
    "binh-phap-strategist": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/binh-phap-strategist.md"},
    "revenue-engine": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/revenue-engine.md"},
    "project-manager": {"category": AgentCategory.BUSINESS, "file": ".claude/agents/project-manager.md"},
    
    # Content (5)
    "content-factory": {"category": AgentCategory.CONTENT, "file": ".claude/agents/content-factory.md"},
    "copywriter": {"category": AgentCategory.CONTENT, "file": ".claude/agents/copywriter.md"},
    "docs-manager": {"category": AgentCategory.CONTENT, "file": ".claude/agents/docs-manager.md"},
    "journal-writer": {"category": AgentCategory.CONTENT, "file": ".claude/agents/journal-writer.md"},
    "researcher": {"category": AgentCategory.CONTENT, "file": ".claude/agents/researcher.md"},
    
    # Design (3)
    "ui-ux-designer": {"category": AgentCategory.DESIGN, "file": ".claude/agents/ui-ux-designer.md"},
    "flow-expert": {"category": AgentCategory.DESIGN, "file": ".claude/agents/flow-expert.md"},
    "scout": {"category": AgentCategory.DESIGN, "file": ".claude/agents/scout.md"},
    
    # External (2)
    "scout-external": {"category": AgentCategory.EXTERNAL, "file": ".claude/agents/scout-external.md"},
    "brainstormer": {"category": AgentCategory.EXTERNAL, "file": ".claude/agents/brainstormer.md"},
}


# Agent Chains - Maps suite:subcommand to agent sequence
AGENT_CHAINS: Dict[str, List[AgentStep]] = {
    # 🛠️ Dev Suite
    "dev:cook": [
        AgentStep("planner", "analyze", "Analyze requirements and create plan"),
        AgentStep("researcher", "best_practices", "Research best practices"),
        AgentStep("fullstack-developer", "implement", "Build the feature"),
        AgentStep("tester", "verify", "Run tests"),
        AgentStep("code-reviewer", "review", "Review code quality"),
        AgentStep("git-manager", "commit", "Commit changes"),
    ],
    "dev:test": [
        AgentStep("tester", "run_tests", "Execute test suite"),
        AgentStep("debugger", "analyze_failures", "Analyze any failures", optional=True),
    ],
    "dev:ship": [
        AgentStep("tester", "verify", "Final verification"),
        AgentStep("git-manager", "push", "Push to remote"),
    ],
    "dev:debug": [
        AgentStep("debugger", "investigate", "Investigate the issue"),
        AgentStep("researcher", "solutions", "Research solutions"),
        AgentStep("fullstack-developer", "fix", "Apply fix"),
        AgentStep("tester", "verify", "Verify fix"),
    ],
    "dev:fix": [
        AgentStep("debugger", "quick_fix", "Apply quick fix"),
        AgentStep("tester", "verify", "Verify fix"),
    ],
    
    # 💰 Revenue Suite
    "revenue:quote": [
        AgentStep("client-magnet", "qualify", "Qualify the client"),
        AgentStep("money-maker", "price", "Calculate pricing"),
        AgentStep("deal-closer", "validate", "Validate WIN-WIN-WIN"),
    ],
    "revenue:invoice": [
        AgentStep("money-maker", "generate_invoice", "Create invoice"),
        AgentStep("revenue-engine", "track", "Track in system"),
    ],
    "revenue:proposal": [
        AgentStep("researcher", "client_research", "Research client"),
        AgentStep("money-maker", "quote", "Generate quote"),
        AgentStep("copywriter", "write", "Write proposal"),
        AgentStep("deal-closer", "validate", "Validate alignment"),
    ],
    "revenue:stats": [
        AgentStep("revenue-engine", "calculate", "Calculate metrics"),
        AgentStep("growth-strategist", "analyze", "Analyze trends"),
    ],
    
    # 🏯 Strategy Suite
    "strategy:analyze": [
        AgentStep("researcher", "market_scan", "Scan market"),
        AgentStep("binh-phap-strategist", "analyze", "Apply Binh Pháp"),
        AgentStep("growth-strategist", "recommend", "Growth recommendations"),
    ],
    "strategy:plan": [
        AgentStep("planner", "create_plan", "Create implementation plan"),
        AgentStep("project-manager", "schedule", "Define milestones"),
    ],
    "strategy:win3": [
        AgentStep("money-maker", "validate_win3", "Check WIN-WIN-WIN"),
        AgentStep("client-value", "assess", "Assess client value"),
    ],
    
    # 🧲 CRM Suite
    "crm:leads": [
        AgentStep("client-magnet", "list_leads", "List all leads"),
        AgentStep("deal-closer", "score", "Score leads"),
    ],
    "crm:pipeline": [
        AgentStep("client-magnet", "pipeline", "Show pipeline"),
        AgentStep("growth-strategist", "forecast", "Forecast conversions"),
    ],
    "crm:add": [
        AgentStep("client-magnet", "add_lead", "Add new lead"),
        AgentStep("deal-closer", "qualify", "Initial qualification"),
    ],
    
    # 🎨 Content Suite
    "content:ideas": [
        AgentStep("brainstormer", "generate", "Generate ideas"),
        AgentStep("content-factory", "prioritize", "Prioritize by virality"),
    ],
    "content:write": [
        AgentStep("researcher", "topic_research", "Research topic"),
        AgentStep("copywriter", "write", "Write content"),
        AgentStep("content-factory", "optimize", "Optimize for engagement"),
    ],
    
    # 📄 Docs Suite
    "docs:init": [
        AgentStep("scout", "scan", "Scan codebase"),
        AgentStep("docs-manager", "init", "Initialize docs"),
    ],
    "docs:update": [
        AgentStep("docs-manager", "update", "Update documentation"),
        AgentStep("git-manager", "commit", "Commit changes"),
    ],
    
    # 🔧 Git Suite
    "git:cm": [
        AgentStep("git-manager", "commit", "Stage and commit"),
    ],
    "git:cp": [
        AgentStep("git-manager", "commit", "Commit"),
        AgentStep("git-manager", "push", "Push"),
    ],
    "git:pr": [
        AgentStep("git-manager", "pr", "Create pull request"),
        AgentStep("code-reviewer", "summary", "Add PR summary"),
    ],
    
    # 🐛 Fix Suite
    "fix:fast": [
        AgentStep("debugger", "quick_fix", "Apply quick fix"),
    ],
    "fix:hard": [
        AgentStep("debugger", "deep_investigate", "Deep investigation"),
        AgentStep("researcher", "solutions", "Research solutions"),
        AgentStep("fullstack-developer", "fix", "Apply fix"),
        AgentStep("tester", "regression", "Regression test"),
    ],
    "fix:ci": [
        AgentStep("debugger", "analyze_ci", "Analyze CI logs"),
        AgentStep("fullstack-developer", "fix", "Fix CI issue"),
        AgentStep("git-manager", "push", "Push fix"),
    ],
    
    # 🎨 Design Suite
    "design:fast": [
        AgentStep("ui-ux-designer", "quick_design", "Quick design"),
    ],
    "design:good": [
        AgentStep("researcher", "inspiration", "Research inspiration"),
        AgentStep("ui-ux-designer", "design", "Create design"),
        AgentStep("flow-expert", "review", "Review flow"),
    ],
    
    # 📊 Analytics Suite
    "analytics:dashboard": [
        AgentStep("growth-strategist", "metrics", "Calculate key metrics"),
    ],
    "analytics:report": [
        AgentStep("growth-strategist", "analyze", "Analyze data"),
        AgentStep("copywriter", "format", "Format report"),
    ],
    
    # 🏢 Agency Suite
    "agency:dna": [
        AgentStep("client-magnet", "analyze_identity", "Analyze identity"),
    ],
    "agency:scorecard": [
        AgentStep("growth-strategist", "score", "Calculate scorecard"),
        AgentStep("binh-phap-strategist", "assess", "Strategic assessment"),
    ],
    
    # 🚀 Startup Suite
    "startup:pitch": [
        AgentStep("researcher", "market", "Market research"),
        AgentStep("binh-phap-strategist", "position", "Strategic positioning"),
        AgentStep("copywriter", "pitch", "Write pitch"),
    ],
    "startup:deck": [
        AgentStep("researcher", "data", "Gather data"),
        AgentStep("copywriter", "narrative", "Create narrative"),
        AgentStep("ui-ux-designer", "design", "Design slides"),
    ],
    "startup:vc": [
        AgentStep("growth-strategist", "metrics", "VC metrics"),
        AgentStep("money-maker", "valuation", "Valuation prep"),
    ],
}


def get_chain(suite: str, subcommand: str) -> List[AgentStep]:
    """Get agent chain for a command."""
    key = f"{suite}:{subcommand}"
    return AGENT_CHAINS.get(key, [])


def get_chain_summary(suite: str, subcommand: str) -> str:
    """Get a formatted summary of the chain."""
    chain = get_chain(suite, subcommand)
    if not chain:
        return "No chain defined"
    
    lines = [f"🔗 Chain: /{suite}:{subcommand}"]
    for i, step in enumerate(chain, 1):
        opt = " (optional)" if step.optional else ""
        lines.append(f"   {i}. {step.agent} → {step.description}{opt}")
    return "\n".join(lines)


def list_all_chains() -> Dict[str, int]:
    """List all chains with step counts."""
    return {k: len(v) for k, v in AGENT_CHAINS.items()}


def get_agents_by_category(category: AgentCategory) -> List[str]:
    """Get agents by category."""
    return [
        name for name, info in AGENT_INVENTORY.items()
        if info["category"] == category
    ]
