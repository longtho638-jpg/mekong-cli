"""
🏯 Agent Chains - Auto-Orchestration Definitions
================================================

Maps each suite:subcommand to an optimal agent chain.
Acts as the central registry for all AgencyOS agents and their file mappings.

Features:
- Static type checking for agent inventory
- Validation of .claude/agent/*.md file existence
- Chain definitions for all primary workflows

Usage:
    from antigravity.core.agent_chains import get_chain, validate_inventory
    
    # Get execution chain
    chain = get_chain("dev", "cook")
    
    # Validate configuration
    missing = validate_inventory()
"""

from typing import Dict, List, Optional, NamedTuple
from dataclasses import dataclass
from enum import Enum
from pathlib import Path


class AgentCategory(Enum):
    """
    Categorization for agents to organize the workbench.
    """
    DEVELOPMENT = "development"
    BUSINESS = "business"
    CONTENT = "content"
    DESIGN = "design"
    EXTERNAL = "external"


class AgentConfig(NamedTuple):
    """Configuration for a single agent."""
    category: AgentCategory
    file: Path


@dataclass
class AgentStep:
    """
    Single step in an agent chain. 
    
    Attributes:
        agent: ID of the agent (key in AGENT_INVENTORY)
        action: Semantic action name (for logging/planning)
        description: Human-readable description
        optional: If True, failure in this step doesn't halt the chain
    """
    agent: str
    action: str
    description: str
    optional: bool = False


# Base path for agents (can be overridden via env if needed)
AGENT_BASE_DIR = Path(".claude/agents")


# Agent Inventory (26 total)
# Maps agent_id -> AgentConfig
AGENT_INVENTORY: Dict[str, AgentConfig] = {
    # 🛠️ Development (8)
    "fullstack-developer": AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "fullstack-developer.md"),
    "planner":            AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "planner.md"),
    "tester":             AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "tester.md"),
    "code-reviewer":      AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "code-reviewer.md"),
    "debugger":           AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "debugger.md"),
    "git-manager":        AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "git-manager.md"),
    "database-admin":     AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "database-admin.md"),
    "mcp-manager":        AgentConfig(AgentCategory.DEVELOPMENT, AGENT_BASE_DIR / "mcp-manager.md"),
    
    # 💰 Business (8)
    "money-maker":          AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "money-maker.md"),
    "deal-closer":          AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "deal-closer.md"),
    "client-magnet":        AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "client-magnet.md"),
    "client-value":         AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "client-value.md"),
    "growth-strategist":    AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "growth-strategist.md"),
    "binh-phap-strategist": AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "binh-phap-strategist.md"),
    "revenue-engine":       AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "revenue-engine.md"),
    "project-manager":      AgentConfig(AgentCategory.BUSINESS, AGENT_BASE_DIR / "project-manager.md"),
    
    # 🎨 Content (5)
    "content-factory": AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "content-factory.md"),
    "copywriter":      AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "copywriter.md"),
    "docs-manager":    AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "docs-manager.md"),
    "journal-writer":  AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "journal-writer.md"),
    "researcher":      AgentConfig(AgentCategory.CONTENT, AGENT_BASE_DIR / "researcher.md"),
    
    # 🖌️ Design (3)
    "ui-ux-designer": AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "ui-ux-designer.md"),
    "flow-expert":    AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "flow-expert.md"),
    "scout":          AgentConfig(AgentCategory.DESIGN, AGENT_BASE_DIR / "scout.md"),
    
    # 🌐 External (2)
    "scout-external": AgentConfig(AgentCategory.EXTERNAL, AGENT_BASE_DIR / "scout-external.md"),
    "brainstormer":   AgentConfig(AgentCategory.EXTERNAL, AGENT_BASE_DIR / "brainstormer.md"),
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
    """
    Get agent chain for a command.
    
    Args:
        suite: Command suite (e.g., 'dev', 'revenue')
        subcommand: Specific command (e.g., 'cook', 'quote')
        
    Returns:
        List of AgentStep objects
    """
    key = f"{suite}:{subcommand}"
    return AGENT_CHAINS.get(key, [])


def get_chain_summary(suite: str, subcommand: str) -> str:
    """
    Get a formatted summary of the chain.
    """
    chain = get_chain(suite, subcommand)
    if not chain:
        return f"⚠️ No chain defined for {suite}:{subcommand}"
    
    lines = [f"🔗 Chain: /{suite}:{subcommand}"]
    for i, step in enumerate(chain, 1):
        opt = " (optional)" if step.optional else ""
        icon = _get_agent_icon(step.agent)
        lines.append(f"   {i}. {icon} {step.agent:<20} → {step.description}{opt}")
    return "\n".join(lines)


def list_all_chains() -> Dict[str, int]:
    """List all chains with step counts."""
    return {k: len(v) for k, v in AGENT_CHAINS.items()}


def get_agents_by_category(category: AgentCategory) -> List[str]:
    """Get agents by category."""
    return [
        name for name, config in AGENT_INVENTORY.items()
        if config.category == category
    ]


def get_agent_file(agent_name: str) -> Optional[Path]:
    """Get the file path for an agent."""
    config = AGENT_INVENTORY.get(agent_name)
    return config.file if config else None


def validate_inventory() -> List[str]:
    """
    Check if all configured agent files actually exist on disk.
    
    Returns:
        List of missing agent names.
    """
    missing = []
    for name, config in AGENT_INVENTORY.items():
        if not config.file.exists():
            missing.append(f"{name} ({config.file})")
    return missing


def _get_agent_icon(agent_name: str) -> str:
    """Helper to get icon for agent."""
    config = AGENT_INVENTORY.get(agent_name)
    if not config:
        return "❓"
    
    icons = {
        AgentCategory.DEVELOPMENT: "🛠️",
        AgentCategory.BUSINESS: "💰",
        AgentCategory.CONTENT: "🎨",
        AgentCategory.DESIGN: "🖌️",
        AgentCategory.EXTERNAL: "🌐",
    }
    return icons.get(config.category, "🤖")