"""
🚀 Agency OS - Grand Finale Simulation
======================================

Orchestrates a full "Zero to One" agency lifecycle simulation to verify 
the production readiness of the WOW architecture.

Scenario:
1. 🧬 DNA: Initialize 'Mekong Ventures' (Venture Studio model).
2. 🧲 Lead: Capture a high-value SaaS startup lead.
3. 🏯 Deal: Structure a 'General' tier engagement.
4. ⚖️ Governance: Pass the WIN-WIN-WIN alignment check.
5. 💰 Revenue: Close the deal and recognize ARR.
6. 🏆 Mastery: Display the final system status.

"Không đánh mà thắng" - Win Without Fighting 🏯
"""

import sys
import time
from rich.console import Console
from rich.panel import Panel
from rich.markdown import Markdown

# Import Core Engines
from antigravity.core.agency_dna import AgencyDNA, Tone, PricingTier
from antigravity.core.client_magnet import client_magnet, LeadSource
from antigravity.core.money_maker import MoneyMaker, ServiceTier
from antigravity.core.proposal_generator import ProposalGenerator
from antigravity.core.revenue_engine import RevenueEngine
from antigravity.core.master_dashboard import show_full_status

console = Console()

def step(title: str, delay: float = 1.0):
    """Visual step separator."""
    console.print(f"\n[bold cyan]🚀 STEP: {title}[/bold cyan]")
    time.sleep(delay)

def main():
    console.print(Panel.fit(
        "[bold yellow]🏯 AGENCY OS - GO LIVE SIMULATION[/bold yellow]\n"
        "[italic]Executing 'Zero to One' Sequence...[/italic]",
        border_style="cyan"
    ))

    # 1. INITIALIZE DNA
    step("Initializing Agency DNA (Linh hồn)")
    dna = AgencyDNA(
        name="Mekong Ventures",
        niche="SaaS Incubation",
        location="Ho Chi Minh City",
        tone=Tone.PROFESSIONAL,
        tier=PricingTier.ENTERPRISE
    )
    dna.add_service("Product Strategy", "Zero to One", 5000)
    dna.add_service("MVP Development", "Full Stack", 15000)
    console.print(f"✅ DNA Active: [bold]{dna.name}[/bold] | Tagline: {dna.get_tagline()}")

    # 2. CAPTURE LEAD
    step("Activating Client Magnet (Địa)")
    lead = client_magnet.add_lead(
        name="FinTech Solutions",
        company="NextGen Finance",
        email="founder@nextgen.co",
        source=LeadSource.REFERRAL
    )
    client_magnet.qualify_lead(lead, budget=25000, score=90)
    console.print(f"✅ Hot Lead Captured: [bold]{lead.name}[/bold] (Score: {lead.score})")

    # 3. STRUCTURE DEAL
    step("Structuring Deal (Tài & Mưu Công)")
    mm = MoneyMaker()
    # Chapters: 1 (Strategy), 3 (Win-Without-Fighting), 7 (Speed Sprint)
    quote = mm.generate_quote(
        client_name=lead.company,
        chapters=[1, 3, 7],
        tier=ServiceTier.GENERAL
    )
    console.print(f"✅ Quote Generated: [bold]${quote.one_time_total:,.0f}[/bold] + [bold]${quote.monthly_retainer:,.0f}/mo[/bold]")

    # 4. GOVERNANCE CHECK
    step("Verifying WIN-WIN-WIN Alignment (Đạo)")
    win3 = mm.validate_win3(quote)
    if win3.is_valid:
        console.print(f"[green]✅ ALIGNMENT PASSED! Score: {win3.score}/100[/green]")
        console.print(f"   👑 Owner: {win3.details['owner']}")
        console.print(f"   🏢 Agency: {win3.details['agency']}")
        console.print(f"   🚀 Client: {win3.details['client']}")
    else:
        console.print("[red]❌ ALIGNMENT FAILED - ABORTING[/red]")
        sys.exit(1)

    # 5. GENERATE PROPOSAL
    step("Generating Strategic Proposal (Kế)")
    pg = ProposalGenerator()
    pg.set_agency_context(dna.name, "+84 900 000", "hello@mekong.vc")
    proposal = pg.generate_proposal(quote, lead.name)
    console.print(f"✅ Proposal Ready: [bold]#{proposal.id}[/bold] ({len(proposal.markdown_content)} chars)")

    # 6. CLOSE & REVENUE
    step("Closing Deal & Recognizing Revenue (Thực Thi)")
    rev_engine = RevenueEngine()
    # Create and pay invoice
    inv = rev_engine.create_invoice(lead.company, quote.one_time_total)
    rev_engine.mark_paid(inv)
    # Add recurring revenue
    inv_rec = rev_engine.create_invoice(lead.company, quote.monthly_retainer, notes="Retainer Month 1")
    rev_engine.mark_paid(inv_rec)
    
    console.print(f"✅ Revenue Recognized: [bold]${rev_engine.get_total_revenue():,.0f}[/bold]")
    console.print(f"✅ New ARR: [bold]${rev_engine.get_arr():,.0f}[/bold]")

    # 7. FINAL STATUS
    step("Displaying Master Dashboard (Thống)")
    show_full_status()

if __name__ == "__main__":
    main()
