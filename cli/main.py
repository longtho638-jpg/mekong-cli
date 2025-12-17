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
║                 → Answer 9 questions                      ║
║                 → Get full business plan                  ║
║                                                           ║
║  📝 proposal    Generate client proposal                  ║
║                 → Professional pricing                    ║
║                 → Ready to send                           ║
║                                                           ║
║  🎨 content     Generate 50 content ideas                 ║
║                 → 5 content pillars                       ║
║                 → 10 ideas each                           ║
║                                                           ║
║  💳 invoice     Create client invoice                     ║
║                 → Multi-currency                          ║
║                 → Professional format                     ║
║                                                           ║
║  🎮 demo        Run full demonstration                    ║
║                 → See all features                        ║
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
