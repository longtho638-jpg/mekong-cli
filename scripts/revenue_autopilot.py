#!/usr/bin/env python3
"""
🚀 Revenue Autopilot - Daily Automated Revenue Operations
==========================================================

Runs automatically via LaunchAgent to maximize passive income.

Daily Tasks:
1. Check revenue metrics
2. Generate & queue content
3. Send outreach emails
4. Update dashboards
5. Alert on opportunities

Usage:
    python3 scripts/revenue_autopilot.py
"""

import logging
import sys
from datetime import datetime
from pathlib import Path

# Add project root
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.client_magnet import ClientMagnet
from antigravity.core.content_factory import ContentFactory
from antigravity.core.revenue_engine import RevenueEngine

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(Path(__file__).parent.parent / "logs" / "autopilot.log"),
        logging.StreamHandler(),
    ],
)
logger = logging.getLogger(__name__)


class RevenueAutopilot:
    """
    🏯 Revenue Autopilot Engine

    Automates daily revenue operations for $1M goal.
    Runs via LaunchAgent at scheduled intervals.
    """

    def __init__(self):
        self.revenue = RevenueEngine()
        self.content = ContentFactory()
        self.magnet = ClientMagnet()
        self.run_date = datetime.now()

    def check_revenue_metrics(self) -> dict:
        """Step 1: Check current revenue status."""
        logger.info("📊 Checking revenue metrics...")

        stats = self.revenue.get_stats()
        goal = self.revenue.get_goal_summary()

        metrics = {
            "mrr": stats["financials"]["mrr"],
            "arr": stats["financials"]["arr"],
            "progress": goal["progress_percent"],
            "gap": goal["gap_usd"],
            "months_to_goal": goal["months_to_goal"],
        }

        logger.info(f"   MRR: ${metrics['mrr']:,.0f}")
        logger.info(f"   ARR: ${metrics['arr']:,.0f}")
        logger.info(f"   Progress: {metrics['progress']}%")

        return metrics

    def generate_content(self) -> list:
        """Step 2: Generate marketing content."""
        logger.info("📝 Generating content...")

        generated = []
        try:
            # Use correct API: generate_ideas() returns List[ContentIdea]
            ideas = self.content.generate_ideas(count=3)
            for idea in ideas:
                generated.append({"title": str(idea), "score": idea.virality_score})
                logger.info(f"   ✅ Generated: {str(idea)[:50]}...")
        except Exception as e:
            logger.warning(f"   ⚠️ Failed to generate: {e}")

        return generated

    def process_leads(self) -> dict:
        """Step 3: Process and score leads."""
        logger.info("🎯 Processing leads...")

        # Use correct API: access leads directly from self.magnet.leads
        try:
            leads = self.magnet.leads  # List[Lead] stored in ClientMagnet
            hot_leads = (
                self.magnet.get_priority_leads()
            )  # Leads with score >= 75 or budget >= 5000

            result = {
                "total": len(leads),
                "hot": len(hot_leads),
                "new_today": 0,  # Would track new leads
            }

            logger.info(f"   Total leads: {result['total']}")
            logger.info(f"   Hot leads: {result['hot']}")

            return result
        except Exception as e:
            logger.warning(f"   ⚠️ Lead processing error: {e}")
            return {"total": 0, "hot": 0, "new_today": 0}

    def check_opportunities(self) -> list:
        """Step 4: Check for revenue opportunities."""
        logger.info("💡 Checking opportunities...")

        opportunities = []

        # Check for low-hanging fruit
        metrics = self.check_revenue_metrics()

        if metrics["mrr"] < 5000:
            opportunities.append(
                {
                    "type": "upsell",
                    "action": "Reach out to existing customers for upgrades",
                    "potential": "$500-1000/mo",
                }
            )

        if metrics["progress"] < 50:
            opportunities.append(
                {
                    "type": "new_products",
                    "action": "Launch 2 new templates this week",
                    "potential": "$1000-2000",
                }
            )

        for opp in opportunities:
            logger.info(f"   💡 {opp['type']}: {opp['action']}")

        return opportunities

    def generate_report(
        self, metrics: dict, content: list, leads: dict, opportunities: list
    ) -> str:
        """Generate daily report."""
        report = f"""
═══════════════════════════════════════════════════════════
  🏯 REVENUE AUTOPILOT DAILY REPORT
  {self.run_date.strftime("%Y-%m-%d %H:%M")}
═══════════════════════════════════════════════════════════

💰 REVENUE METRICS
   MRR: ${metrics["mrr"]:,.0f}
   ARR: ${metrics["arr"]:,.0f}
   Progress to $1M: {metrics["progress"]}%
   Gap: ${metrics["gap"]:,.0f}

📝 CONTENT GENERATED
   {len(content)} pieces created

🎯 LEADS
   Total: {leads["total"]}
   Hot: {leads["hot"]}

💡 OPPORTUNITIES
   {len(opportunities)} identified

═══════════════════════════════════════════════════════════
"""
        return report

    def run(self) -> dict:
        """Run full autopilot cycle."""
        logger.info("🚀 Starting Revenue Autopilot...")
        logger.info(f"   Date: {self.run_date.strftime('%Y-%m-%d %H:%M')}")
        logger.info("")

        # Execute all steps
        metrics = self.check_revenue_metrics()
        content = self.generate_content()
        leads = self.process_leads()
        opportunities = self.check_opportunities()

        # Generate report
        report = self.generate_report(metrics, content, leads, opportunities)
        logger.info(report)

        # Save report
        reports_dir = Path(__file__).parent.parent / "logs" / "reports"
        reports_dir.mkdir(parents=True, exist_ok=True)

        report_file = (
            reports_dir / f"autopilot_{self.run_date.strftime('%Y%m%d_%H%M')}.txt"
        )
        report_file.write_text(report)

        logger.info(f"📄 Report saved: {report_file.name}")

        return {
            "status": "success",
            "metrics": metrics,
            "content_count": len(content),
            "leads": leads,
            "opportunities_count": len(opportunities),
        }


if __name__ == "__main__":
    # Ensure logs directory exists
    logs_dir = Path(__file__).parent.parent / "logs"
    logs_dir.mkdir(parents=True, exist_ok=True)

    autopilot = RevenueAutopilot()
    result = autopilot.run()

    print(f"\n✅ Autopilot completed: {result['status']}")
