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
║  📝 proposal   Generate client proposal                  ║
║  🎨 content     Generate 50 content ideas                 ║
║  💳 invoice     Create client invoice                     ║
║  🎮 demo        Run full demonstration                    ║
║                                                           ║
║  ⚡ NEW COMMANDS:                                         ║
║  📋 workflow    List all available workflows              ║
║  🎯 crm         Quick CRM access                          ║
║  📊 analytics   Analytics dashboard                       ║
║  📝 plan        Create task plan (Manus pattern)          ║
║  📝 notes       Add/view research notes                   ║
║  🧠 mem         Memory system (search/add/timeline)       ║
║  📦 module      Module system (KuckIt pattern)            ║
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


def run_plan():
    """Create or view task plan (Manus 3-file pattern)."""
    print("\n📋 Task Plan (Manus 3-File Pattern)")
    print("-" * 50)
    
    import os
    from pathlib import Path
    from datetime import datetime
    
    plans_dir = Path("plans")
    plans_dir.mkdir(exist_ok=True)
    
    task_plan = plans_dir / "task_plan.md"
    notes = plans_dir / "notes.md"
    
    # Get task from args or show current plan
    if len(sys.argv) > 2:
        task = " ".join(sys.argv[2:])
        
        # Create task_plan.md
        content = f"""# Task Plan: {task}

Created: {datetime.now().strftime('%Y-%m-%d %H:%M')}

## Goal
{task}

## Phases
- [ ] Phase 1: Research & Planning
- [ ] Phase 2: Implementation
- [ ] Phase 3: Testing
- [ ] Phase 4: Review & Delivery

## Progress Notes
<!-- Update after each phase -->

## Errors Log
<!-- Track any errors for future reference -->
"""
        task_plan.write_text(content, encoding="utf-8")
        
        # Create notes.md if not exists
        if not notes.exists():
            notes.write_text("# Research Notes\n\n", encoding="utf-8")
        
        print(f"   ✅ Created: plans/task_plan.md")
        print(f"   ✅ Created: plans/notes.md")
        print(f"\n   Task: {task}")
        print(f"\n   Next: mekong cook @plans/task_plan.md")
    else:
        # Show current plan
        if task_plan.exists():
            print(task_plan.read_text(encoding="utf-8"))
        else:
            print("   No task plan found.")
            print("   Create one: python3 cli/main.py plan \"Your task\"")


def run_notes():
    """View or add notes (Manus pattern)."""
    print("\n📝 Research Notes")
    print("-" * 50)
    
    from pathlib import Path
    
    plans_dir = Path("plans")
    plans_dir.mkdir(exist_ok=True)
    notes = plans_dir / "notes.md"
    
    if len(sys.argv) > 2:
        # Add note
        note = " ".join(sys.argv[2:])
        
        if notes.exists():
            content = notes.read_text(encoding="utf-8")
        else:
            content = "# Research Notes\n\n"
        
        content += f"- {note}\n"
        notes.write_text(content, encoding="utf-8")
        print(f"   ✅ Added: {note}")
    else:
        # View notes
        if notes.exists():
            print(notes.read_text(encoding="utf-8"))
        else:
            print("   No notes yet.")
            print("   Add: python3 cli/main.py notes \"Your note\"")


def run_mem():
    """Memory system (based on claude-mem architecture)."""
    print("\n🧠 AgencyOS Memory System")
    print("-" * 50)
    
    try:
        from core.memory import Memory
        
        memory = Memory()
        
        # Parse subcommand
        if len(sys.argv) < 3:
            subcommand = "recent"
        else:
            subcommand = sys.argv[2].lower()
        
        if subcommand == "add":
            # Add observation
            if len(sys.argv) < 4:
                print("   Usage: python3 cli/main.py mem add \"observation\"")
                return
            
            content = " ".join(sys.argv[3:])
            obs_id = memory.add_observation(content)
            print(f"   ✅ Added observation #{obs_id}")
            print(f"   Content: {content}")
        
        elif subcommand == "search":
            # Search memory
            if len(sys.argv) < 4:
                print("   Usage: python3 cli/main.py mem search \"query\"")
                return
            
            query = " ".join(sys.argv[3:])
            results = memory.search_memory(query)
            
            print(f"   🔍 Search: {query}")
            print(f"   Found: {len(results)} results\n")
            
            for r in results:
                print(f"   #{r['id']} [{r['type']}] {r['summary']}")
                print(f"   ⏰ {r['created_at']}")
                print()
        
        elif subcommand == "timeline":
            # View timeline
            timeline = memory.get_timeline()
            
            print(f"   📅 Recent Activity ({len(timeline)} observations)\n")
            
            for t in timeline:
                print(f"   #{t['id']} [{t['type']}] {t['summary']}")
                print(f"   ⏰ {t['created_at']}")
                print()
        
        else:
            # Default: show recent
            recent = memory.get_recent(limit=5)
            
            print(f"   📝 Recent Observations ({len(recent)})\n")
            
            for r in recent:
                print(f"   #{r['id']} [{r['type']}] {r['summary']}")
                print(f"   ⏰ {r['created_at']}")
                print()
            
            print("   Commands:")
            print("   • mem add \"text\"     - Add observation")
            print("   • mem search \"query\"  - Search memory")
            print("   • mem timeline        - View timeline")
    
    except ImportError as e:
        print(f"   ❌ Memory module not found: {e}")
    except Exception as e:
        print(f"   ❌ Error: {e}")


def run_module():
    """Module system (KuckIt-style scaffolding)."""
    print("\n📦 Module System (KuckIt Pattern)")
    print("-" * 50)
    
    from pathlib import Path
    
    # Parse subcommand
    if len(sys.argv) < 3:
        print("   Commands:")
        print("   • module create <name>   - Scaffold new module")
        print("   • module list            - List all modules")
        return
    
    subcommand = sys.argv[2].lower()
    
    if subcommand == "create":
        # Create module
        if len(sys.argv) < 4:
            print("   Usage: python3 cli/main.py module create <name>")
            return
        
        module_name = sys.argv[3]
        
        # Create module structure (KuckIt pattern)
        print(f"\n   🏗️  Scaffolding module: {module_name}")
        
        # Entity
        entity_path = Path(f"core/entities/{module_name}.py")
        entity_content = f'''"""
Entity: {module_name.title()}
Core data structure for {module_name}.

Clean Architecture Layer: Entities
"""

from dataclasses import dataclass
from typing import Optional


@dataclass
class {module_name.title()}:
    """Core {module_name} entity."""
    id: Optional[int] = None
    name: str = ""
    # Add your fields here
'''
        entity_path.write_text(entity_content, encoding="utf-8")
        print(f"   ✅ Created: core/entities/{module_name}.py")
        
        # Use Case
        use_case_path = Path(f"core/use_cases/create_{module_name}.py")
        use_case_content = f'''"""
Use Case: Create {module_name.title()}
Business logic for creating {module_name}.

Clean Architecture Layer: Use Cases
"""

from core.entities.{module_name} import {module_name.title()}


class Create{module_name.title()}UseCase:
    """Use case for creating {module_name}."""
    
    def execute(self, name: str) -> {module_name.title()}:
        """Create new {module_name}."""
        # Add validation here
        return {module_name.title()}(name=name)
'''
        use_case_path.write_text(use_case_content, encoding="utf-8")
        print(f"   ✅ Created: core/use_cases/create_{module_name}.py")
        
        # Controller
        controller_path = Path(f"core/controllers/{module_name}_controller.py")
        controller_content = f'''"""
Controller: {module_name.title()}
Handles HTTP requests for {module_name} operations.

Clean Architecture Layer: Controllers
"""

from typing import Dict, Any
from core.use_cases.create_{module_name} import Create{module_name.title()}UseCase


class {module_name.title()}Controller:
    """Controller for {module_name} operations."""
    
    def __init__(self):
        self.create_use_case = Create{module_name.title()}UseCase()
    
    def create(self, request_data: Dict[str, Any]) -> Dict[str, Any]:
        """Handle create request."""
        try:
            name = request_data.get("name", "")
            entity = self.create_use_case.execute(name)
            
            return {{
                "success": True,
                "data": {{"id": entity.id, "name": entity.name}}
            }}
        except Exception as e:
            return {{"success": False, "error": str(e)}}
'''
        controller_path.write_text(controller_content, encoding="utf-8")
        print(f"   ✅ Created: core/controllers/{module_name}_controller.py")
        
        print(f"\n   🎉 Module '{module_name}' created successfully!")
        print(f"\n   Next steps:")
        print(f"   1. Edit core/entities/{module_name}.py (add fields)")
        print(f"   2. Edit core/use_cases/create_{module_name}.py (business logic)")
        print(f"   3. Edit core/controllers/{module_name}_controller.py (API routes)")
    
    elif subcommand == "list":
        # List modules
        entities_dir = Path("core/entities")
        if not entities_dir.exists():
            print("   No modules found.")
            return
        
        modules = [f.stem for f in entities_dir.glob("*.py") if f.stem != "__init__"]
        print(f"\n   📦 Installed Modules ({len(modules)}):\n")
        for module in modules:
            print(f"   • {module}")


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
        "plan": run_plan,
        "notes": run_notes,
        "mem": run_mem,
        "module": run_module,
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
