"""
🏯 Agent Crews Registry
=======================

Definitions of specialized multi-agent squads (The Agency Workforce).
"""

from typing import Dict

from .models import Crew, CrewMember

# Crew Definitions (The Agency Workforce)
CREWS: Dict[str, Crew] = {
    # 🚀 Product Launch Crew - Full-stack delivery
    "product_launch": Crew(
        name="Product Launch Crew",
        description="End-to-end delivery from conceptualization to production.",
        lead=CrewMember("project-manager", "lead", ["planning", "problem-solving"]),
        workers=[
            CrewMember("planner", "worker", ["planning"]),
            CrewMember(
                "fullstack-developer", "worker", ["frontend-development", "backend-development"]
            ),
            CrewMember("ui-ux-designer", "worker", ["ui-ux-pro-max", "ui-styling"]),
            CrewMember("tester", "worker", ["vibe-testing"]),
            CrewMember("docs-manager", "worker", ["document-skills"]),
        ],
        qa=CrewMember("code-reviewer", "qa", ["code-review"]),
        skills_required=["planning", "frontend-development", "backend-development"],
    ),
    # 💰 Revenue Accelerator Crew - Business growth
    "revenue_accelerator": Crew(
        name="Revenue Accelerator Crew",
        description="Drives growth through client acquisition and pricing optimization.",
        lead=CrewMember("money-maker", "lead", ["payment-integration"]),
        workers=[
            CrewMember("client-magnet", "worker", []),
            CrewMember("deal-closer", "worker", ["binh-phap-wisdom"]),
            CrewMember("copywriter", "worker", []),
            CrewMember("growth-strategist", "worker", ["research"]),
        ],
        qa=CrewMember("client-value", "qa", []),
        skills_required=["binh-phap-wisdom", "payment-integration"],
    ),
    # 🎨 Content Machine Crew - Media production
    "content_machine": Crew(
        name="Content Machine Crew",
        description="Scalable production of high-engagement, localized content.",
        lead=CrewMember("content-factory", "lead", []),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("copywriter", "worker", []),
            CrewMember("ui-ux-designer", "worker", ["ui-ux-pro-max"]),
            CrewMember("brainstormer", "worker", ["brainstorming"]),
        ],
        qa=CrewMember("growth-strategist", "qa", []),
        skills_required=["research", "brainstorming"],
    ),
    # 🛠️ Dev Ops Crew - Infrastructure & CI/CD
    "dev_ops": Crew(
        name="DevOps Crew",
        description="Ensures system stability, automated testing, and secure deployment.",
        lead=CrewMember(
            "fullstack-developer", "lead", ["frontend-development", "backend-development"]
        ),
        workers=[
            CrewMember("planner", "worker", ["planning"]),
            CrewMember("database-admin", "worker", ["databases"]),
            CrewMember("tester", "worker", ["vibe-testing", "debugging"]),
            CrewMember("git-manager", "worker", []),
        ],
        qa=CrewMember("code-reviewer", "qa", ["code-review"]),
        skills_required=["frontend-development", "backend-development", "databases"],
    ),
    # 🏯 Strategy Crew - Strategic Binh Pháp analysis
    "strategy": Crew(
        name="Strategy Crew",
        description="Deep analysis using Binh Pháp framework for market winning.",
        lead=CrewMember("binh-phap-strategist", "lead", ["binh-phap-wisdom"]),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("growth-strategist", "worker", []),
            CrewMember("planner", "worker", ["planning"]),
        ],
        qa=CrewMember("money-maker", "qa", []),
        skills_required=["binh-phap-wisdom", "research", "planning"],
    ),
    # 🐛 Debug Squad Crew - High-efficiency bug fixing
    "debug_squad": Crew(
        name="Debug Squad Crew",
        description="Rapid diagnostic and resolution of complex technical issues.",
        lead=CrewMember("debugger", "lead", ["debugging"]),
        workers=[
            CrewMember("researcher", "worker", ["research"]),
            CrewMember("fullstack-developer", "worker", []),
            CrewMember("tester", "worker", ["vibe-testing"]),
        ],
        qa=CrewMember("code-reviewer", "qa", ["code-review"]),
        skills_required=["debugging", "code-review"],
    ),
}
