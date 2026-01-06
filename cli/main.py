#!/usr/bin/env python3
"""
🏯 Agency OS - Unified CLI
===========================

One CLI to rule them all.

Usage:
    python3 cli/main.py [command]

Commands:
    onboard     - Start agency onboarding (DNA generation)
    proposal    - Generate client proposal
    content     - Generate 50 content ideas
    invoice     - Create client invoice
    demo        - Run full demo
    help        - Show this help

"Không đánh mà thắng" 🏯
"""

import sys
import os

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def print_banner():
    """Print main banner."""
    print("""
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏯 AGENCY OS - COMMAND CENTER                          ║
║                                                           ║
║   The One-Person Unicorn Operating System                ║
║   "Không đánh mà thắng" - Win Without Fighting           ║
║                                                           ║
║   🌐 agencyos.network                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """)


def print_help():
    """Print help menu."""
    print("""
╔═══════════════════════════════════════════════════════════╗
║  📚 AVAILABLE COMMANDS                                    ║
╠═══════════════════════════════════════════════════════════╣
║                                                           ║
║  🎯 onboard     Create your Agency DNA                   ║
║  📝 proposal    Generate client proposal                  ║
║  🎨 content     Generate 50 content ideas                 ║
║  💳 invoice     Create client invoice                     ║
║  🎮 demo        Run full demonstration                    ║
║                                                           ║
║  ⚡ NEW COMMANDS:                                         ║
║  📋 workflow    List all available workflows              ║
║  🎯 crm         Quick CRM access                          ║
║  📊 analytics   Analytics dashboard                       ║
║                                                           ║
║  ❓ help        Show this help menu                       ║
║                                                           ║
╠═══════════════════════════════════════════════════════════╣
║  Usage: python3 cli/main.py [command]                     ║
╚═══════════════════════════════════════════════════════════╝
    """)


def run_onboard():
    """Run onboarding flow."""
    print("\n🎯 Starting Agency Onboarding...")
    print("-" * 50)
    
    try:
        from cli.onboard import main as onboard_main
        onboard_main()
    except ImportError:
        print("❌ Onboarding module not found. Run from mekong-cli directory.")


def run_proposal():
    """Run proposal generator."""
    print("\n📝 Proposal Generator")
    print("-" * 50)
    
    try:
        from core.proposal_gen import ProposalGenerator, ServiceTier
        
        # Demo
        generator = ProposalGenerator(
            agency_name="Your Agency",
            niche="Digital Marketing",
            location="Your City",
            skill="Your Skill"
        )
        
        proposal = generator.create_proposal(
            client_name="Demo Client",
            client_company="Demo Company",
            client_email="demo@example.com",
            tiers=[ServiceTier.GROWTH]
        )
        
        print(generator.format_proposal(proposal))
        
    except ImportError:
        print("❌ Proposal module not found.")


def run_content():
    """Run content generator."""
    print("\n🎨 Content Generator")
    print("-" * 50)
    
    try:
        from core.content_generator import ContentGenerator
        
        generator = ContentGenerator(
            agency_name="Your Agency",
            niche="Digital Marketing",
            location="Your City",
            skill="Your Skill"
        )
        
        ideas = generator.generate_50_ideas()
        print(generator.format_content_calendar(ideas))
        print(f"\n✅ Generated {len(ideas)} content ideas!")
        
    except ImportError:
        print("❌ Content module not found.")


def run_invoice():
    """Run invoice generator."""
    print("\n💳 Invoice Generator")
    print("-" * 50)
    
    try:
        from core.invoice import InvoiceSystem
        
        system = InvoiceSystem()
        summary = system.get_summary()
        
        print(f"📊 Invoice Summary:")
        print(f"   Total: {summary['total_invoices']}")
        print(f"   Paid: {summary['paid']}")
        print(f"   Pending: {summary['pending']}")
        print(f"   Value: {summary['total_value_usd']}")
        
        # Show sample
        if system.invoices:
            invoice = list(system.invoices.values())[0]
            print()
            print(system.format_invoice(invoice))
        
    except ImportError:
        print("❌ Invoice module not found.")


def run_demo():
    """Run full demo."""
    print("\n🎮 Running Full Demo...")
    print("=" * 60)
    
    # Import and run demo
    try:
        from demo import main as demo_main
        demo_main()
    except ImportError:
        # Run mini demo
        print("\n📊 Agency OS - Quick Stats")
        print("-" * 40)
        
        stats = {
            "Modules": 20,
            "Languages": 4,
            "Regions": 4,
            "Content Ideas": 50,
            "Service Tiers": 3,
        }
        
        for key, value in stats.items():
            print(f"   {key}: {value}")
        
        print()
        print("🏯 \"Không đánh mà thắng\"")
        print("🌐 agencyos.network")


def run_workflow():
    """List and run workflows."""
    print("\n📋 Available Workflows")
    print("-" * 50)
    
    workflows = [
        ("starting-new-project", "Bootstrap new project"),
        ("maintaining-old-project", "Maintain legacy project"),
        ("deploy-project", "Deploy to production"),
        ("add-feature", "Add new feature (11 steps)"),
        ("bug-fixing", "Debug and fix bugs"),
        ("sales-pipeline", "Sales pipeline management"),
        ("client-onboarding", "Onboard new clients"),
        ("proposal-to-close", "Close deals faster"),
        ("pricing-strategy", "Pricing optimization"),
        ("vc-readiness", "VC funding preparation"),
        ("workflow-chain", "Chain automation workflows"),
        ("human-in-loop", "Human approval workflows"),
        ("customer-success", "Customer health scoring"),
    ]
    
    print("   Category: Development")
    for name, desc in workflows[:5]:
        print(f"   /{name}: {desc}")
    
    print("\n   Category: Business")
    for name, desc in workflows[5:10]:
        print(f"   /{name}: {desc}")
    
    print("\n   Category: Automation")
    for name, desc in workflows[10:]:
        print(f"   /{name}: {desc}")
    
    print(f"\n   ✅ Total: {len(workflows)} workflows available")
    print("   Run: python3 cli/main.py workflow <name>")


def run_crm():
    """Quick CRM access."""
    print("\n🎯 CRM Quick Access")
    print("-" * 50)
    
    try:
        from core.crm import CRM, CRMPresenter
        
        crm = CRM()
        
        # CRMPresenter.format_pipeline_text is a static method
        print(CRMPresenter.format_pipeline_text(crm))
        
        # Hot leads
        hot_leads = crm.get_hot_leads()
        if hot_leads:
            print("\n🔥 Hot Leads:")
            for lead in hot_leads[:3]:
                print(f"   • {lead.name} ({lead.company}) - Score: {lead.lead_score}")
        
        # Pipeline value
        forecast = crm.forecast_revenue()
        print(f"\n💰 Pipeline: ${forecast['total_pipeline']:,.0f}")
        print(f"   Weighted: ${forecast['weighted_pipeline']:,.0f}")
        
    except ImportError:
        print("   Demo Mode - CRM module loading...")
        print("   Contacts: 5 | Deals: 4 | Pipeline: $9,500")


def run_analytics():
    """Analytics dashboard."""
    print("\n📊 Analytics Dashboard")
    print("-" * 50)
    
    try:
        from core.analytics import Analytics
        analytics = Analytics()
        
        print(f"   MRR: ${analytics.mrr:,.0f}")
        print(f"   ARR: ${analytics.arr:,.0f}")
        print(f"   Growth: +{analytics.growth_rate}%")
        
    except ImportError:
        print("   Demo Mode - Analytics loading...")
        print("   MRR: $5,000 | ARR: $60,000 | Growth: +15%")


def main():
    """Main CLI entry point."""
    print_banner()
    
    # Get command
    if len(sys.argv) < 2:
        print_help()
        return
    
    command = sys.argv[1].lower()
    
    # Route command
    commands = {
        "onboard": run_onboard,
        "proposal": run_proposal,
        "content": run_content,
        "invoice": run_invoice,
        "demo": run_demo,
        "workflow": run_workflow,
        "crm": run_crm,
        "analytics": run_analytics,
        "help": print_help,
    }
    
    if command in commands:
        commands[command]()
    else:
        print(f"❌ Unknown command: {command}")
        print_help()


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 Goodbye!")
        sys.exit(0)
