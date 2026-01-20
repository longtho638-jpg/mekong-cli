"""
Orchestrator Server Handlers
============================
Logic for Orchestrator MCP.
"""

import asyncio
from antigravity.mcp_servers.agency_server.handlers import AgencyHandler

# Import handlers from other MCP servers for direct usage or mocking
# In a real microservices architecture, we might call them via MCP protocol.
# For simplicity in this monorepo, we import the handlers if possible,
# or use internal logic if they are self-contained.
# Given the original code imported from scripts.vibeos, and those are now migrating.
# We should try to import from the new locations if they exist, or keep the logic
# high-level and delegated.
from antigravity.mcp_servers.coding_server.handlers import CodingHandler
from antigravity.mcp_servers.marketing_server.handlers import MarketingHandler
from dataclasses import asdict, dataclass
from typing import Any, Dict, List, Optional, Union


@dataclass
class SimpleOutput:
    """Simple output for AgencyER users."""
    success: bool
    message: str
    details: List[str]
    next_action: Optional[str] = None

class OrchestratorHandler:
    """
    Orchestrator Logic
    Routes commands to appropriate engines.
    """

    def __init__(self):
        self.coding = CodingHandler()
        self.marketing = MarketingHandler()
        self.agency = AgencyHandler()

    async def execute(self, command: str, args: List[str] = None) -> Dict[str, Any]:
        """
        Execute a VibeOS command.
        """
        args = args or []
        command = command.lower().strip()

        # Remove leading slash if present
        if command.startswith("/"):
            command = command[1:]

        if command == "money":
            return asdict(await self._execute_money())

        elif command == "build":
            feature = args[0] if args else "feature"
            return asdict(await self._execute_build(feature))

        elif command == "client":
            name = " ".join(args) if args else "New Client"
            return asdict(await self._execute_client(name))

        elif command == "content":
            topic = " ".join(args) if args else "AI Marketing"
            return asdict(await self._execute_content(topic))

        elif command == "win":
            decision = " ".join(args) if args else "New opportunity"
            return asdict(await self._execute_win(decision))

        elif command == "ship":
            message = " ".join(args) if args else ""
            return asdict(await self._execute_ship(message))

        else:
            return asdict(SimpleOutput(
                success=False,
                message=f"❌ Unknown command: /{command}",
                details=["Try /help to see available commands"],
            ))

    async def _execute_money(self) -> SimpleOutput:
        """Execute /money - Full revenue pipeline."""
        # Run ALL engines in parallel
        lead_task = self.marketing.lead_pipeline()
        content_task = self.marketing.generate_ideas(3)
        outreach_task = self.agency.outreach_pipeline()

        leads, ideas, outreach = await asyncio.gather(lead_task, content_task, outreach_task)

        # Process results
        # Note: leads is a dict from lead_pipeline
        hot_leads = leads.get("hot", 0)
        if isinstance(hot_leads, list):
            hot_count = len(hot_leads)
        elif isinstance(hot_leads, int):
            hot_count = hot_leads
        else:
            hot_count = 0

        total_leads = leads.get("total", 0)

        details = [
            f"✅ {total_leads} leads processed ({hot_count} hot)",
            f"✅ {len(ideas)} content ideas generated",
            f"✅ {outreach.get('emails_queued', 0)} outreach emails queued",
            f"💰 Projected MRR: ${hot_count * 1000}",
        ]

        return SimpleOutput(
            success=True,
            message="🏯 Revenue pipeline complete!",
            details=details,
            next_action="Follow up with hot leads",
        )

    async def _execute_build(self, feature: str) -> SimpleOutput:
        """Execute /build - Full coding pipeline."""
        result = await self.coding.build(feature)
        # result is a dict

        details = [
            f"✅ Files created: {result.get('files_created', 0)}",
            f"✅ Tests: {result.get('tests_passed', 0)}/{result.get('tests_total', 0)} passed",
        ]

        if result.get("deploy_url"):
            details.append(f"🔗 Live: {result.get('deploy_url')}")

        return SimpleOutput(
            success=result.get("success", False),
            message=result.get("message", ""),
            details=details,
            next_action="Run /ship to deploy" if result.get("success") else "Fix failing tests",
        )

    async def _execute_client(self, name: str) -> SimpleOutput:
        """Execute /client - Full onboarding."""
        client = await self.agency.onboard_client(name)
        # client is a dict

        details = [
            f"✅ Contract: {client.get('contract_path')}",
            f"✅ Invoice: {client.get('invoice_path')}",
            f"✅ Portal: {client.get('portal_url')}",
            f"✅ Welcome email: {'Sent' if client.get('welcome_sent') else 'Pending'}",
        ]

        return SimpleOutput(
            success=True,
            message=f"🎉 Client '{name}' onboarded!",
            details=details,
            next_action="Schedule kickoff call",
        )

    async def _execute_content(self, topic: str) -> SimpleOutput:
        """Execute /content - Full content pipeline."""
        content = await self.marketing.content_pipeline(topic)
        # content is a dict

        details = [
            f"✅ Article: {content.get('article_words', 0)} words",
            f"✅ SEO Score: {content.get('seo_score', 0)}/100",
            f"✅ Images: {len(content.get('images', []))} generated",
            f"✅ Social: {len(content.get('social_posts', []))} posts ready",
        ]

        return SimpleOutput(
            success=True,
            message=f"📝 Content for '{topic}' ready!",
            details=details,
            next_action="Schedule for publication",
        )

    async def _execute_win(self, decision: str) -> SimpleOutput:
        """Execute /win - WIN-WIN-WIN validation."""
        result = await self.agency.validate_win(decision)
        # result is a dict

        emoji = "✅" if result.get("decision") == "GO" else "❌"

        details = [
            f"👑 Owner WIN: {result.get('owner_win')}",
            f"🏢 Agency WIN: {result.get('agency_win')}",
            f"🚀 Client WIN: {result.get('client_win')}",
            f"⚠️ Risk Score: {result.get('risk_score')}/10",
            "",
            f"💡 {result.get('wisdom')}",
        ]

        return SimpleOutput(
            success=result.get("decision") == "GO",
            message=f"{emoji} Decision: {result.get('decision')}",
            details=details,
            next_action="Proceed with implementation"
            if result.get("decision") == "GO"
            else "Reconsider approach",
        )

    async def _execute_ship(self, message: str) -> SimpleOutput:
        """Execute /ship - Full ship pipeline."""
        result = await self.coding.ship(message)
        # result is a dict

        details = [
            f"✅ Tests: {result.get('tests_passed', 0)}/{result.get('tests_total', 0)} passed",
            f"✅ Commit: {result.get('commit_sha', '')[:7] if result.get('commit_sha') else 'N/A'}",
        ]

        if result.get("deploy_url"):
            details.append(f"🔗 Live: {result.get('deploy_url')}")

        return SimpleOutput(
            success=result.get("success", False),
            message=result.get("message", ""),
            details=details,
            next_action="Monitor CI/CD" if result.get("success") else "Fix issues and retry",
        )
