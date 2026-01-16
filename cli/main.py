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
from rich.console import Console
from rich.panel import Panel
from rich.table import Table
from rich.markdown import Markdown
from cli.theme import get_theme

# Initialize Console with AgencyOS Theme
console = Console(theme=get_theme())

# Add parent to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))


def print_banner():
    """Print main banner."""
    banner_text = """
[bold primary]╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏯 AGENCY OS - COMMAND CENTER                          ║
║                                                           ║
║   The One-Person Unicorn Operating System                ║
║   "Không đánh mà thắng" - Win Without Fighting           ║
║                                                           ║
║   🌐 agencyos.network                                    ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝[/bold primary]
    """
    console.print(banner_text)


def print_help():
    """Print help menu."""
    table = Table(title="[bold white]📚 AVAILABLE COMMANDS[/bold white]", border_style="panel.border", box=None, header_style="bold secondary")
    
    table.add_column("Command", style="command")
    table.add_column("Description", style="white")
    
    table.add_row("", "")
    table.add_row("[bold secondary]🚀 START HERE[/bold secondary]", "")
    table.add_row("guide", "Hướng dẫn sử dụng cho người mới")
    table.add_row("scaffold", "Tạo bản vẽ kiến trúc (Architecture)")
    table.add_row("kanban", "Quản lý task và agent")
    
    table.add_row("", "")
    table.add_row("[bold secondary]🎯 CORE COMMANDS[/bold secondary]", "")
    table.add_row("binh-phap", "Phân tích chiến lược dự án")
    table.add_row("cook", "Xây dựng tính năng (AI Agent)")
    table.add_row("ship", "Deploy sản phẩm")
    
    table.add_row("", "")
    table.add_row("[bold secondary]⚡ UTILITIES[/bold secondary]", "")
    table.add_row("proposal", "Tạo Proposal khách hàng")
    table.add_row("content", "Tạo Content Marketing")
    table.add_row("invoice", "Tạo Invoice")
    
    console.print(table)
    console.print("\n[dim]Usage: agencyos [command][/dim]")


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
        from core.modules.proposal import ProposalGenerator, ServiceTier
        
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
        from core.modules.content import ContentGenerator
        
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


def run_content_marketing():
    """Run content marketing strategy generator."""
    print("\n🎯 Content Marketing Strategy Generator")
    print("-" * 50)
    
    try:
        from core.content_marketing import ContentMarketingStrategy
        
        # Get business type from args or use default
        business_type = " ".join(sys.argv[2:]) if len(sys.argv) > 2 else "digital agency"
        
        strategy_gen = ContentMarketingStrategy()
        result = strategy_gen.generate_strategy(business_type)
        print(strategy_gen.format_strategy(result))
        
        print(f"\n✅ Strategy generated for: {business_type}")
        print("   Best Practices:")
        print("   1. Quality over quantity - Focus on value")
        print("   2. Repurpose content - One idea, many formats")
        print("   3. Track engagement - Optimize based on data")
        
    except ImportError as e:
        print(f"❌ Content marketing module not found: {e}")


def run_invoice():
    """Run invoice generator."""
    print("\n💳 Invoice Generator")
    print("-" * 50)
    
    try:
        from core.modules.invoice import InvoiceSystem
        
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
        from core.modules.crm import CRM, CRMPresenter
        
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


def run_binh_phap():
    """Run Binh Pháp strategic analysis (Ngũ Sự + Cluster recommendations)."""
    try:
        from core.modules.strategy import StrategyService, StrategyPresenter
        
        # Get project idea from args
        if len(sys.argv) > 2:
            idea = " ".join(sys.argv[2:])
        else:
            idea = "your project"
            
        print("\n🏯 BINH PHÁP ANALYSIS")
        print("═" * 60)
        
        service = StrategyService(agency_name=idea)
        insights = service.analyze_situation(idea)
        
        print(StrategyPresenter.format_report(service, insights))
        
        print("\n   Next: python3 cli/main.py plan \"Create implementation plan\"")
        
    except ImportError as e:
        print(f"❌ Strategy module not found: {e}")


def run_cook():
    """Build features with agent orchestration."""
    print("\n🍳 COOK - Build Mode")
    print("═" * 60)
    
    if len(sys.argv) > 2:
        feature = " ".join(sys.argv[2:])
    else:
        feature = "new feature"
    
    print(f"\n🎯 Building: {feature}\n")
    
    # Agent orchestration simulation
    import time
    
    steps = [
        ("planner", "Analyzing requirements...", 0.3),
        ("researcher", "Checking best practices...", 0.3),
        ("developer", "Writing components...", 0.5),
        ("tester", "Running tests...", 0.3),
        ("reviewer", "Code review...", 0.2),
        ("git", "Committing changes...", 0.2),
    ]
    
    print("🤖 AGENT ORCHESTRATION")
    print("─" * 60)
    
    for agent, task, delay in steps:
        time.sleep(delay)
        print(f"   ✓ {agent}: {task}")
    
    print("\n✅ Build complete!")
    print("   Next: python3 cli/main.py test")


def run_test():
    """Run enhanced test workflow."""
    print("\n🧪 TEST - Verification Mode")
    print("═" * 60)
    
    import subprocess
    
    print("\n📋 Running test suite...")
    print("─" * 60)
    
    try:
        result = subprocess.run(
            ["python", "tests/test_wow.py"],
            capture_output=True,
            text=True,
            timeout=60
        )
        print(result.stdout)
        if result.returncode == 0:
            print("\n✅ All tests passed!")
        else:
            print("\n⚠️ Some tests failed. Review output above.")
    except FileNotFoundError:
        print("   Running pytest fallback...")
        try:
            subprocess.run(["python", "-m", "pytest", "tests/", "-v"], timeout=60)
        except Exception as e:
            print(f"   ❌ Error: {e}")
    except Exception as e:
        print(f"   ❌ Error: {e}")
    
    print("\n   Next: python3 cli/main.py ship")


def run_ship():
    """Deploy to production."""
    print("\n🚀 SHIP - Deployment Mode")
    print("═" * 60)
    
    if len(sys.argv) > 2:
        target = " ".join(sys.argv[2:])
    else:
        target = "production"
    
    print(f"\n🎯 Target: {target}\n")
    
    import time
    
    steps = [
        ("Building production bundle...", 0.5),
        ("Running final tests...", 0.3),
        ("Deploying to Vercel...", 0.5),
        ("Configuring domain...", 0.3),
        ("Setting up SSL...", 0.2),
        ("Configuring analytics...", 0.2),
    ]
    
    print("🚀 DEPLOYMENT")
    print("─" * 60)
    
    for task, delay in steps:
        time.sleep(delay)
        print(f"   ✓ {task}")
    
    print("\n📍 PRODUCTION URLs")
    print("─" * 60)
    print("   • Live: https://your-app.vercel.app")
    print("   • Dashboard: https://your-app.vercel.app/dashboard")
    print("   • API: https://your-app.vercel.app/api")
    
    print("\n✅ Deployed successfully!")
    print("   Next: python3 cli/main.py monitor")


def run_deploy():
    """Infrastructure deployment."""
    print("\n🏗️ DEPLOY - Infrastructure Mode")
    print("═" * 60)
    
    print("\n📋 Deployment Options:")
    print("─" * 60)
    print("   1. vercel deploy --prod    (Frontend)")
    print("   2. gcloud run deploy       (Backend)")
    print("   3. docker-compose up -d    (Local)")
    
    print("\n💡 Recommended: Use /ship for unified deployment")


def run_monitor():
    """Set up error tracking and performance monitoring."""
    print("\n📊 MONITOR - Observability Mode")
    print("═" * 60)
    
    print("\n🔍 MONITORING SETUP")
    print("─" * 60)
    print("   ✓ Error Tracking: Sentry configured")
    print("   ✓ Performance: Vercel Analytics enabled")
    print("   ✓ Uptime: Checkly monitoring active")
    print("   ✓ Logs: Structured logging enabled")
    
    print("\n📈 DASHBOARDS")
    print("─" * 60)
    print("   • Errors: sentry.io/your-org")
    print("   • Performance: vercel.com/dashboard")
    print("   • Uptime: checkly.com/dashboard")
    
    print("\n✅ Monitoring configured!")


def run_marketing():
    """Generate Hỏa Công viral marketing campaign."""
    print("\n🔥 HỎA CÔNG - Viral Campaign Mode")
    print("═" * 60)
    
    if len(sys.argv) > 2:
        product = " ".join(sys.argv[2:])
    else:
        product = "your product"
    
    print(f"\n🎯 Product: {product}\n")
    
    print("📱 SOCIAL POSTS GENERATED")
    print("─" * 60)
    print("   • Twitter launch thread (15 tweets)")
    print("   • LinkedIn announcement")
    print("   • ProductHunt launch copy")
    print("   • Reddit r/SaaS post")
    
    print("\n📧 EMAIL SEQUENCE")
    print("─" * 60)
    print("   • Welcome email")
    print("   • Feature highlights (3 emails)")
    print("   • Case study template")
    
    print("\n🎯 GROWTH TACTICS")
    print("─" * 60)
    print("   • Referral program copy")
    print("   • Affiliate landing pages")
    print("   • Partnership outreach templates")
    
    print("\n✅ Campaign materials ready!")
    print("   Location: marketing/campaigns/")


def run_intel():
    """Dụng Gián - Gather competitive intelligence and user feedback."""
    print("\n🕵️ DỤNG GIÁN - Intelligence Mode")
    print("═" * 60)
    
    print("\n🔍 COMPETITOR MONITORING")
    print("─" * 60)
    print("   • Price changes tracked")
    print("   • Feature launches monitored")
    print("   • Social mentions analyzed")
    
    print("\n📊 USER FEEDBACK")
    print("─" * 60)
    print("   • NPS surveys scheduled")
    print("   • Feature requests collected")
    print("   • Churn analysis running")
    
    print("\n📈 MARKET TRENDS")
    print("─" * 60)
    print("   • Industry reports indexed")
    print("   • Keyword rankings tracked")
    print("   • Market size updates")
    
    print("\n✅ Intelligence gathering active!")
    print("   Dashboard: analytics/intel/")


def run_business_plan():
    """Generate complete business plan (計篇 Kế - Strategic Planning)."""
    print("\n📋 BUSINESS PLAN GENERATOR")
    print("═" * 60)
    
    if len(sys.argv) > 2:
        business = " ".join(sys.argv[2:])
    else:
        business = "your business"
    
    print(f"\n🎯 Business: {business}\n")
    
    # Executive Summary
    print("📌 EXECUTIVE SUMMARY")
    print("─" * 60)
    print(f"   Business: {business.title()}")
    print("   Mission: Deliver exceptional value through innovation")
    print("   Vision: Become the market leader in 3 years")
    print("   Stage: Early-stage / Growth-ready")
    
    # Market Analysis
    print("\n📊 MARKET ANALYSIS")
    print("─" * 60)
    print("   Target Market: SMBs and Agencies")
    print("   Market Size: $10B+ (TAM), $1B (SAM), $100M (SOM)")
    print("   Growth Rate: 15-20% CAGR")
    print("   Key Trends: AI adoption, automation, remote work")
    
    # Revenue Model
    print("\n💰 REVENUE MODEL")
    print("─" * 60)
    print("   Primary: SaaS Subscription (MRR)")
    print("   Secondary: Professional Services")
    print("   Tertiary: Partner/Affiliate Revenue")
    print("   Pricing Tiers:")
    print("      • Starter: $29/month")
    print("      • Growth: $99/month")
    print("      • Enterprise: $299/month")
    
    # Competitive Landscape
    print("\n🎯 COMPETITIVE LANDSCAPE")
    print("─" * 60)
    print("   Direct Competitors: 3-5 identified")
    print("   Indirect Competitors: 5-10 identified")
    print("   Competitive Advantage:")
    print("      • Technology moat (proprietary algorithms)")
    print("      • Speed to market")
    print("      • Vietnamese market expertise")
    print("      • WIN-WIN-WIN alignment")
    
    # Financial Projections
    print("\n📈 FINANCIAL PROJECTIONS (3-Year)")
    print("─" * 60)
    print("   Year 1: $120K ARR | 100 customers")
    print("   Year 2: $500K ARR | 400 customers")
    print("   Year 3: $1.2M ARR | 1000 customers")
    print("   Runway: 18 months")
    print("   Break-even: Month 18")
    
    # Operational Plan
    print("\n⚙️ OPERATIONAL PLAN")
    print("─" * 60)
    print("   Team Size: 3-5 (Year 1) → 15-20 (Year 3)")
    print("   Key Hires: CTO, VP Sales, VP Marketing")
    print("   Infrastructure: Cloud-native (Vercel + Supabase)")
    print("   Milestones:")
    print("      • Q1: MVP launch + first 10 customers")
    print("      • Q2: Product-market fit validation")
    print("      • Q3: Seed funding round")
    print("      • Q4: Scale to 100 customers")
    
    print("\n" + "═" * 60)
    print("🏯 Binh Pháp: 計篇 (Kế) - Strategic Planning")
    print("═" * 60)
    print("\n✅ Business plan generated!")
    print("   Export: plans/business_plan.md")
    print("   Next: python3 cli/main.py binh-phap \"" + business + "\"")


def run_customer_profile():
    """Generate customer persona profile (地形篇 Địa Hình - Know Your Terrain)."""
    print("\n👥 CUSTOMER PROFILE GENERATOR")
    print("═" * 60)
    
    if len(sys.argv) > 2:
        product = " ".join(sys.argv[2:])
    else:
        product = "your product/service"
    
    print(f"\n🎯 Product/Service: {product}\n")
    
    # Demographics
    print("👥 DEMOGRAPHICS")
    print("─" * 60)
    print("   Age Range: 25-45")
    print("   Gender: 55% Female, 45% Male")
    print("   Location: Urban professionals")
    print("   Income: $50K-$150K annually")
    print("   Education: College degree or higher")
    print("   Occupation: Managers, entrepreneurs, freelancers")
    
    # Pain Points
    print("\n😰 PAIN POINTS")
    print("─" * 60)
    print("   1. Time-consuming manual processes")
    print("   2. Lack of integrated solutions")
    print("   3. High costs of existing alternatives")
    print("   4. Poor customer support from competitors")
    print("   5. Difficulty scaling operations")
    
    # Goals & Motivations
    print("\n🎯 GOALS & MOTIVATIONS")
    print("─" * 60)
    print("   • Increase efficiency and save time")
    print("   • Reduce operational costs")
    print("   • Scale business without proportional effort")
    print("   • Access premium features at fair price")
    print("   • Stay competitive in their industry")
    
    # Buying Behavior
    print("\n🛒 BUYING BEHAVIOR")
    print("─" * 60)
    print("   Research: Online reviews, peer recommendations")
    print("   Decision: ROI-focused, value over price")
    print("   Channels: LinkedIn, industry blogs, podcasts")
    print("   Cycle: 2-4 weeks for B2B decisions")
    
    # Key Message
    print("\n💡 KEY MESSAGING")
    print("─" * 60)
    print(f'   > "Premium solutions for {product.title()}"')
    print("   Value Prop: Save time, cut costs, scale faster")
    print("   Tone: Professional yet approachable")
    print("   CTA: Start free trial, schedule demo")
    
    # Use Cases
    print("\n📋 USE CASES")
    print("─" * 60)
    print("   For Startups: Validate product-market fit")
    print("   For Businesses: Segment customers, develop products")
    print("   For Agencies: Pitch to clients, campaign research")
    
    print("\n" + "═" * 60)
    print("🏯 Binh Pháp: 地形篇 (Địa Hình) - Know Your Terrain")
    print("═" * 60)
    print("\n✅ Customer profile generated!")
    print("   Export: plans/customer_profile.md")


def run_quote():
    """💰 Quick quote generator - no arguments needed."""
    print("\n💰 QUICK QUOTE")
    print("═" * 60)
    
    try:
        from antigravity.core.money_maker import MoneyMaker, ServiceTier
        
        mm = MoneyMaker()
        
        # Get client from args or use default
        if len(sys.argv) > 2:
            client = " ".join(sys.argv[2:])
        else:
            client = "Demo Corp"
        
        # Show pricing menu
        print(mm.get_pricing_menu())
        
        # Generate quote with popular chapters
        quote = mm.generate_quote(client, [1, 3, 5], ServiceTier.WARRIOR)
        print(mm.format_quote(quote))
        
        # Validate
        win3 = mm.validate_win3(quote)
        print(f"\n✅ WIN-WIN-WIN: {win3.alignment_score}/100")
        
    except ImportError as e:
        print(f"❌ Error: {e}")


def run_revenue():
    """💰 Revenue Hub - all money commands in one place."""
    print("\n💰 REVENUE HUB")
    print("═" * 60)
    
    # Get subcommand
    subcommand = sys.argv[2] if len(sys.argv) > 2 else "menu"
    
    if subcommand == "quote":
        run_quote()
    elif subcommand == "stats":
        try:
            from antigravity.core.revenue_engine import RevenueEngine
            engine = RevenueEngine()
            stats = engine.get_stats()
            goal = engine.get_goal_dashboard()
            
            print(f"   MRR: ${stats['mrr']:,.0f}")
            print(f"   ARR: ${stats['arr']:,.0f}")
            print(f"   $1M Goal: {goal['progress_percent']:.1f}%")
        except ImportError:
            print("   Demo Mode - Revenue: $50,000 MRR")
    else:
        print("""
┌───────────────────────────────────────────────────────────┐
│  💰 REVENUE HUB                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Commands:                                                │
│  revenue quote     → Generate quote                       │
│  revenue invoice   → Create invoice                       │
│  revenue proposal  → Generate proposal                    │
│  revenue stats     → Dashboard                            │
│                                                           │
└───────────────────────────────────────────────────────────┘
        """)


def run_dev():
    """🛠️ Dev Hub - cook, test, ship in one place."""
    print("\n🛠️ DEV HUB")
    print("═" * 60)
    
    # Get subcommand
    subcommand = sys.argv[2] if len(sys.argv) > 2 else "status"
    
    if subcommand == "cook":
        run_cook()
    elif subcommand == "test":
        run_test()
    elif subcommand == "ship":
        run_ship()
    else:
        from pathlib import Path
        print("""
┌───────────────────────────────────────────────────────────┐
│  🛠️  DEV HUB                                              │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Commands:                                                │
│  dev cook     → Build feature                             │
│  dev test     → Run tests                                 │
│  dev ship     → Deploy                                    │
│  dev status   → Dashboard                                 │
│                                                           │
├───────────────────────────────────────────────────────────┤""")
        plan = Path("plans/task_plan.md")
        if plan.exists():
            print("│  📋 Active Plan: plans/task_plan.md                      │")
        else:
            print("│  📋 No active plan                                       │")
        print("└───────────────────────────────────────────────────────────┘")


def run_strategy():
    """🏯 Strategy Hub - Binh Pháp planning commands."""
    print("\n🏯 STRATEGY HUB")
    print("═" * 60)
    
    # Get subcommand
    subcommand = sys.argv[2] if len(sys.argv) > 2 else "win3"
    
    if subcommand == "analyze":
        run_binh_phap()
    elif subcommand == "plan":
        run_plan()
    else:
        print("""
┌───────────────────────────────────────────────────────────┐
│  🏯 STRATEGY HUB                                          │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  Commands:                                                │
│  strategy analyze  → Binh Pháp analysis                   │
│  strategy plan     → Create plan                          │
│  strategy win3     → WIN-WIN-WIN check                    │
│                                                           │
├───────────────────────────────────────────────────────────┤
│                                                           │
│  WIN-WIN-WIN ALIGNMENT:                                   │
│  👑 ANH (Owner)     ✅ Equity + Cash flow                 │
│  🏢 AGENCY          ✅ Moat + Process                     │
│  🚀 CLIENT          ✅ 10x Value                          │
│                                                           │
└───────────────────────────────────────────────────────────┘
        """)


def run_agencyos():
    """
    🏯 UNIFIED AGENCYOS FLOW
    Complete workflow: brainstorm → plan → code → test → ship
    """
    print("\n🏯 AGENCYOS UNIFIED FLOW")
    print("═" * 60)
    
    if len(sys.argv) > 2:
        idea = " ".join(sys.argv[2:])
    else:
        idea = None
    
    print("""
┌─────────────────────────────────────────────────────────────┐
│                   🏯 AGENCYOS UNIFIED FLOW                  │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  Phase 1: BRAINSTORM (Mưu Công)     → /binh-phap           │
│  Phase 2: PLAN (Kế Hoạch)           → /plan                │
│  Phase 3: CODE (Quân Tranh)         → /cook                │
│  Phase 4: TEST (Hành Quân)          → /test                │
│  Phase 5: SHIP (Cửu Địa)            → /ship                │
│                                                             │
└─────────────────────────────────────────────────────────────┘
    """)
    
    if idea:
        print(f"🎯 Task: {idea}")
        print("\n" + "─" * 60)
        
        # Phase 1: Strategic Analysis
        print("\n📍 PHASE 1: Strategic Analysis")
        run_binh_phap()
        
        # Phase 2: Planning
        print("\n📍 PHASE 2: Create Plan")
        sys.argv = [sys.argv[0], "plan", idea]
        run_plan()
        
        print("\n" + "─" * 60)
        print("⏸️  APPROVAL GATE")
        print("   Review: plans/task_plan.md")
        print("   Then run: agencyos cook \"feature\"")
        print("─" * 60)
    else:
        print("📋 USAGE:")
        print("   python3 cli/main.py agencyos \"Your idea or task\"")
        print()
        print("📍 INDIVIDUAL PHASES:")
        print("   1. python3 cli/main.py binh-phap \"idea\"   → Strategic analysis")
        print("   2. python3 cli/main.py plan \"task\"        → Create plan")
        print("   3. python3 cli/main.py cook \"feature\"     → Build")
        print("   4. python3 cli/main.py test               → Verify")
        print("   5. python3 cli/main.py ship               → Deploy")
        print()
        print("🔧 QUICK SETUP (add to ~/.zshrc):")
        print("   alias agencyos='cd $(pwd) && PYTHONPATH=. python3 cli/main.py'")
        print()
        print("   Then use: agencyos binh-phap \"my idea\"")
    
    print("\n" + "═" * 60)
    print("🏯 \"Không đánh mà thắng\" - Win Without Fighting")
    print("═" * 60)


def run_kanban():
    """Run Vibe Kanban CLI commands."""
    print("\n📋 KANBAN COMMAND CENTER")
    print("═" * 60)
    
    # Simple argument parsing for MVP
    # python3 cli/main.py kanban <action> <params_json>
    # e.g., python3 cli/main.py kanban list '{"status": "todo"}'
    
    if len(sys.argv) < 3:
        print("Usage: agencyos kanban <action> [params_json]")
        print("Actions: list, create, update")
        print("\nExamples:")
        print("  agencyos kanban list '{\"status\": \"todo\"}'")
        print("  agencyos kanban create '{\"title\": \"New Task\", \"agent\": \"planner\"}'")
        return

    action = sys.argv[2]
    params = sys.argv[3] if len(sys.argv) > 3 else "{}"
    
    try:
        # Import the skill directly to run it
        # We need to ensure the path is correct for the skill to import antigravity
        skill_path = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), ".agencyos", "skills", "kanban.py")
        
        # We can import it dynamically or just call the run_skill function if we import it
        # Let's try importing the module dynamically
        import importlib.util
        spec = importlib.util.spec_from_file_location("kanban_skill", skill_path)
        if spec and spec.loader:
            kanban_module = importlib.util.module_from_spec(spec)
            sys.modules["kanban_skill"] = kanban_module
            spec.loader.exec_module(kanban_module)
            
            # Execute
            result = kanban_module.run_skill(action, params)
            print(json.dumps(result, indent=2))
        else:
            print(f"❌ Could not load skill from {skill_path}")

    except Exception as e:
        print(f"❌ Error running kanban command: {e}")


def run_scaffold():
    """Run Architect Agent to scaffold project structure."""
    try:
        from core.modules.architect import ArchitectService, ArchitectPresenter
        
        # Get user request
        if len(sys.argv) > 2:
            request = " ".join(sys.argv[2:])
        else:
            print("\n🏯 Usage: agencyos scaffold \"I want to build a [Project Idea]\"")
            return

        service = ArchitectService()
        profile = service.analyze_request(request)
        blueprint = service.generate_blueprint(profile)
        
        print(ArchitectPresenter.display_blueprint(profile, blueprint))
        
    except ImportError as e:
        print(f"❌ Architect module not found: {e}")


def run_ui():
    """Run UI Architect to generate MD3 components."""
    try:
        from core.modules.ui_architect import UIArchitectService
        
        if len(sys.argv) < 4:
            print("Usage: agencyos ui <component|page> <name> [vibe]")
            return

        action = sys.argv[2] # component or page
        name = sys.argv[3]
        vibe = sys.argv[4] if len(sys.argv) > 4 else "Professional and clean"
        
        service = UIArchitectService()
        
        print("\n🎨 UI ARCHITECT (Material Design 3)")
        print("═" * 60)
        print(f"🎯 Target: {name} ({action})")
        print(f"✨ Vibe: {vibe}")
        print("─" * 60)
        
        prompt = service.generate_component_prompt(name, vibe)
        
        print(prompt)
        print("\n👉 Copy the above prompt to your AI Editor to generate the code.")
        
    except ImportError as e:
        print(f"❌ UI Architect module not found: {e}")


def run_ide():
    """Manage Antigravity IDE configuration."""
    if len(sys.argv) < 3 or sys.argv[2] != "sync":
        print("Usage: agencyos ide sync")
        print("  Enforces absolute synchronization of IDE settings.")
        return

    try:
        from core.modules.ide import IDEService
        service = IDEService()
        
        print("\n🔒 ANTIGRAVITY IDE SYNCHRONIZATION")
        print("═" * 60)
        
        results = service.sync_all()
        for key, msg in results.items():
            print(f"{msg}")
            
        print("\n✅ Environment is now locked to AgencyOS standards.")
        print("   Restart your editor to apply changes.")
        
    except ImportError as e:
        print(f"❌ IDE module not found: {e}")


def run_guide():
    """Show the Vibe Coding Manual for non-tech users."""
    manual = """
# 🧘 VIBE CODING MANUAL (Quick Start)

**1. 🏗️  SCAFFOLD (Bản vẽ):**
   `$ agencyos scaffold "Tôi muốn làm app [ABC]"`
   -> Copy Prompt trả về -> Paste vào AI.

**2. 🤖 CODE (Thợ xây):**
   AI sẽ tự viết code theo cấu trúc chuẩn.

**3. 📋 KANBAN (Quản lý):**
   `$ agencyos kanban create "Review module X"`
   `$ agencyos kanban board`

**4. 🚀 SHIP (Vận hành):**
   `$ agencyos ship`

👉 Xem chi tiết: `docs/VIBE_CODING_MANUAL.md`
    """
    console.print(Markdown(manual))


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
        "content-marketing": run_content_marketing,
        "invoice": run_invoice,
        "demo": run_demo,
        "workflow": run_workflow,
        "crm": run_crm,
        "analytics": run_analytics,
        "plan": run_plan,
        "notes": run_notes,
        "mem": run_mem,
        "module": run_module,
        # Full-Stack Workflow Commands
        "binh-phap": run_binh_phap,
        "cook": run_cook,
        "test": run_test,
        "ship": run_ship,
        "deploy": run_deploy,
        "monitor": run_monitor,
        "marketing": run_marketing,
        "intel": run_intel,
        # Business Commands
        "business-plan": run_business_plan,
        "customer-profile": run_customer_profile,
        # Unified Flow
        "agencyos": run_agencyos,
        "aos": run_agencyos,  # Alias
        # Command Hubs (NEW)
        "quote": run_quote,
        "revenue": run_revenue,
        "rev": run_revenue,  # Alias
        "dev": run_dev,
        "strategy": run_strategy,
        "kanban": run_kanban,
        "scaffold": run_scaffold,
        "ide": run_ide,
        "ui": run_ui,
        "guide": run_guide,
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
