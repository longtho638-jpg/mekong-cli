"""
VibeOS Orchestrator
===================
Central command router for all Vibe Engines

Maps simple /commands to complex multi-engine pipelines
Returns SimpleOutput for AgencyER users
"""

import asyncio
import sys
from dataclasses import dataclass
from pathlib import Path
from typing import List, Optional

# Add project root to path
sys.path.insert(0, str(Path(__file__).parent.parent.parent))

from scripts.vibeos.agency_engine import VibeAgencyEngine
from scripts.vibeos.coding_engine import VibeCodingEngine
from scripts.vibeos.marketing_engine import VibeMarketingEngine


@dataclass
class SimpleOutput:
    """Simple output for AgencyER users."""

    success: bool
    message: str
    details: List[str]
    next_action: Optional[str] = None


HELP_OUTPUT = """
🏯 **VibeOS Commands**

| Command | Description |
|---------|-------------|
| /money | Generate revenue (leads + content + outreach) |
| /build [feature] | Code + Test + Deploy |
| /client [name] | Full client onboarding |
| /content [topic] | Create SEO article + social posts |
| /win [decision] | WIN-WIN-WIN validation |
| /ship [msg] | Test → Commit → Push → Deploy |
| /help | This help menu |

💡 *Just type the command - AI handles the rest*
"""


class VibeOSOrchestrator:
    """
    VibeOS ORCHESTRATOR
    -------------------
    Routes /commands to appropriate Vibe Engines.
    Runs everything in background.
    Returns simple, clean output.

    Usage:
        orchestrator = VibeOSOrchestrator()
        result = await orchestrator.execute("/money", [])
        print(result.message)
    """

    def __init__(self):
        self.coding = VibeCodingEngine()
        self.marketing = VibeMarketingEngine()
        self.agency = VibeAgencyEngine()

    async def execute(self, command: str, args: List[str] = None) -> SimpleOutput:
        """
        Execute a VibeOS command.

        Args:
            command: Command name (e.g., "/money", "/build")
            args: Optional arguments

        Returns:
            SimpleOutput with results
        """
        args = args or []
        command = command.lower().strip()

        # Remove leading slash if present
        if command.startswith("/"):
            command = command[1:]

        print(f"\n{'=' * 50}")
        print(f"🏯 VibeOS: Executing /{command}")
        print(f"{'=' * 50}\n")

        if command == "money":
            return await self._execute_money()

        elif command == "build":
            feature = args[0] if args else "feature"
            return await self._execute_build(feature)

        elif command == "client":
            name = " ".join(args) if args else "New Client"
            return await self._execute_client(name)

        elif command == "content":
            topic = " ".join(args) if args else "AI Marketing"
            return await self._execute_content(topic)

        elif command == "win":
            decision = " ".join(args) if args else "New opportunity"
            return await self._execute_win(decision)

        elif command == "ship":
            message = " ".join(args) if args else ""
            return await self._execute_ship(message)

        elif command == "help":
            return SimpleOutput(success=True, message=HELP_OUTPUT, details=[])

        else:
            return SimpleOutput(
                success=False,
                message=f"❌ Unknown command: /{command}",
                details=["Try /help to see available commands"],
            )

    async def _execute_money(self) -> SimpleOutput:
        """Execute /money - Full revenue pipeline."""
        # Run ALL engines in parallel
        lead_task = self.marketing.lead_pipeline()
        content_task = self.marketing.generate_ideas(3)
        outreach_task = self.agency.outreach_pipeline()

        leads, ideas, outreach = await asyncio.gather(lead_task, content_task, outreach_task)

        details = [
            f"✅ {leads.total} leads processed ({leads.hot} hot)",
            f"✅ {len(ideas)} content ideas generated",
            f"✅ {outreach.get('emails_queued', 0)} outreach emails queued",
            f"💰 Projected MRR: ${leads.hot * 1000}",
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

        details = [
            f"✅ Files created: {result.files_created}",
            f"✅ Tests: {result.tests_passed}/{result.tests_total} passed",
        ]

        if result.deploy_url:
            details.append(f"🔗 Live: {result.deploy_url}")

        return SimpleOutput(
            success=result.success,
            message=result.message,
            details=details,
            next_action="Run /ship to deploy" if result.success else "Fix failing tests",
        )

    async def _execute_client(self, name: str) -> SimpleOutput:
        """Execute /client - Full onboarding."""
        client = await self.agency.onboard_client(name)

        details = [
            f"✅ Contract: {client.contract_path}",
            f"✅ Invoice: {client.invoice_path}",
            f"✅ Portal: {client.portal_url}",
            f"✅ Welcome email: {'Sent' if client.welcome_sent else 'Pending'}",
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

        details = [
            f"✅ Article: {content.article_words} words",
            f"✅ SEO Score: {content.seo_score}/100",
            f"✅ Images: {len(content.images)} generated",
            f"✅ Social: {len(content.social_posts)} posts ready",
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

        emoji = "✅" if result.decision == "GO" else "❌"

        details = [
            f"👑 Owner WIN: {result.owner_win}",
            f"🏢 Agency WIN: {result.agency_win}",
            f"🚀 Client WIN: {result.client_win}",
            f"⚠️ Risk Score: {result.risk_score}/10",
            "",
            f"💡 {result.wisdom}",
        ]

        return SimpleOutput(
            success=result.decision == "GO",
            message=f"{emoji} Decision: {result.decision}",
            details=details,
            next_action="Proceed with implementation"
            if result.decision == "GO"
            else "Reconsider approach",
        )

    async def _execute_ship(self, message: str) -> SimpleOutput:
        """Execute /ship - Full ship pipeline."""
        result = await self.coding.ship(message)

        details = [
            f"✅ Tests: {result.tests_passed}/{result.tests_total} passed",
            f"✅ Commit: {result.commit_sha[:7] if result.commit_sha else 'N/A'}",
        ]

        if result.deploy_url:
            details.append(f"🔗 Live: {result.deploy_url}")

        return SimpleOutput(
            success=result.success,
            message=result.message,
            details=details,
            next_action="Monitor CI/CD" if result.success else "Fix issues and retry",
        )


async def main():
    """CLI interface for VibeOS."""
    import sys

    orchestrator = VibeOSOrchestrator()

    if len(sys.argv) < 2:
        result = await orchestrator.execute("/help")
    else:
        command = sys.argv[1]
        args = sys.argv[2:] if len(sys.argv) > 2 else []
        result = await orchestrator.execute(command, args)

    # Print output
    print(f"\n{result.message}")
    print()
    for detail in result.details:
        print(f"  {detail}")

    if result.next_action:
        print(f"\n📌 Next: {result.next_action}")


if __name__ == "__main__":
    asyncio.run(main())
