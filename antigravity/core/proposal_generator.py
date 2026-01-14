"""
ProposalGenerator - Professional Proposal Builder.

Features:
- Binh Pháp 13-chapter structured proposals
- WIN-WIN-WIN alignment verification
- Tiered pricing templates
- Markdown & PDF export

🏯 Binh Pháp: "Bất chiến nhi khuất nhân chi binh" - Win without fighting
"""

from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional

from .base import BaseEngine
from .money_maker import Quote, ServiceTier, BINH_PHAP_PRICING, TIER_PRICING


@dataclass
class Proposal:
    """Client proposal."""
    id: int
    client_name: str
    client_contact: str
    quote: Quote
    markdown_content: str
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    status: str = "draft"


PROPOSAL_TEMPLATE = '''# 📜 Proposal for {client_name}

> **{agency_name}** | {date}
> Valid until: {valid_until}

---

## 🎯 Executive Summary

Chào **{client_contact}**,

Cảm ơn anh/chị đã tin tưởng **{agency_name}**. Dưới đây là đề xuất hợp tác theo phương pháp **Binh Pháp WIN-WIN-WIN** - đảm bảo cả hai bên cùng thắng.

---

## 📦 Service Package

| Chapter | Service | Description | Price |
|---------|---------|-------------|-------|
{service_table}

---

## 💰 Pricing Breakdown

### One-Time Investment
| Item | Amount |
|------|--------|
| Project Services | ${project_total:,.0f} |

### Recurring Investment
| Item | Amount |
|------|--------|
| Monthly Retainer | ${monthly_retainer:,.0f}/month |
| Duration | 6 months minimum |

### Equity Alignment
| Component | Value |
|-----------|-------|
| Equity Stake | {equity_percent:.1f}% |
| Success Fee | {success_fee:.1f}% of funding round |

**Total Year 1 Value: ${total_year1:,.0f}**

---

## 🏯 WIN-WIN-WIN Alignment

Theo triết lý Binh Pháp, mọi deal phải tạo giá trị cho cả 3 bên:

### 👑 Your WIN (Client)
{client_win}

### 🏢 Our WIN (Agency)
{agency_win}

### 🎯 Aligned WIN
{owner_win}

**Alignment Score: {alignment_score}/100** {alignment_emoji}

{warnings_section}

---

## 📋 Terms & Timeline

### Payment Terms
- 50% upfront upon signing
- 50% upon project completion
- Monthly retainer billed on the 1st

### Timeline
| Phase | Duration |
|-------|----------|
| Discovery | Week 1 |
| Strategy | Week 2-3 |
| Execution | Week 4+ |

### What's Included
{services_included}

---

## ✍️ Next Steps

1. **Review** this proposal
2. **Schedule** a call to discuss any questions
3. **Sign** the agreement
4. **Start** our journey to success

---

> 🏯 **"Bất chiến nhi khuất nhân chi binh"**
> *Win without fighting - We succeed when you succeed*

**{agency_name}**
Phone: {agency_phone}
Email: {agency_email}

---

*Proposal ID: #{proposal_id:04d} | Generated: {date}*
'''


class ProposalGenerator(BaseEngine):
    """
    Professional Proposal Builder.
    
    Example:
        pg = ProposalGenerator()
        proposal = pg.generate_proposal(quote, "John Doe")
        print(proposal.markdown_content)
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.proposals: List[Proposal] = []
        self._next_id = 1
        
        # Agency defaults (can be configured)
        self.agency_name = "NovaAgency"
        self.agency_phone = "+84 123 456 789"
        self.agency_email = "hello@novaagency.vn"

    def configure_agency(
        self,
        name: str,
        phone: str = "",
        email: str = ""
    ):
        """Configure agency details."""
        self.agency_name = name
        if phone:
            self.agency_phone = phone
        if email:
            self.agency_email = email

    def generate_proposal(
        self,
        quote: Quote,
        client_contact: str,
        custom_template: Optional[str] = None
    ) -> Proposal:
        """
        Generate full proposal from quote.
        
        Args:
            quote: Quote object from MoneyMaker
            client_contact: Contact person name
            custom_template: Optional custom Markdown template
        """
        from .money_maker import MoneyMaker
        
        mm = MoneyMaker()
        win3 = mm.validate_win3(quote)
        
        # Build service table
        service_rows = []
        for svc in quote.services:
            price_str = f"${svc['price']:,}"
            if svc.get("recurring"):
                price_str += "/mo"
            elif svc.get("quarterly"):
                price_str += "/qtr"
            service_rows.append(
                f"| {svc['chapter']}️⃣ {svc['name']} | {svc['service']} | - | {price_str} |"
            )
        
        # Calculate year 1 total
        total_year1 = quote.total_amount + (quote.recurring_monthly * 12)
        
        # Services included list
        services_included = "\n".join([
            f"- ✅ {svc['service']}" for svc in quote.services
        ])
        
        # Warnings section
        warnings_section = ""
        if win3.warnings:
            warnings_section = "\n> [!WARNING]\n> " + "\n> ".join(win3.warnings)
        
        # Generate content
        template = custom_template or PROPOSAL_TEMPLATE
        content = template.format(
            client_name=quote.client_name,
            client_contact=client_contact,
            agency_name=self.agency_name,
            agency_phone=self.agency_phone,
            agency_email=self.agency_email,
            date=datetime.now().strftime("%Y-%m-%d"),
            valid_until=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            service_table="\n".join(service_rows),
            project_total=quote.total_amount,
            monthly_retainer=quote.recurring_monthly,
            equity_percent=quote.equity_percent,
            success_fee=quote.success_fee_percent,
            total_year1=total_year1,
            client_win=f"- {len(quote.services)} premium services\n- ${quote.total_amount:,.0f} project value\n- Strategic growth support",
            agency_win=f"- ${quote.recurring_monthly:,.0f}/month recurring\n- {quote.success_fee_percent:.1f}% success alignment\n- Portfolio diversification",
            owner_win=f"- {quote.equity_percent:.1f}% equity upside\n- Sustainable cash flow\n- Long-term partnership",
            alignment_score=win3.alignment_score,
            alignment_emoji="✅" if win3.is_valid else "⚠️",
            warnings_section=warnings_section,
            services_included=services_included,
            proposal_id=self._next_id
        )
        
        proposal = Proposal(
            id=self._next_id,
            client_name=quote.client_name,
            client_contact=client_contact,
            quote=quote,
            markdown_content=content
        )
        
        self.proposals.append(proposal)
        self._next_id += 1
        return proposal

    def quick_proposal(
        self,
        client_name: str,
        client_contact: str,
        chapter_ids: List[int],
        tier: ServiceTier = ServiceTier.WARRIOR
    ) -> Proposal:
        """
        Generate proposal in one step.
        
        Args:
            client_name: Company name
            client_contact: Contact person
            chapter_ids: Binh Pháp chapters (1-13)
            tier: Service tier
        """
        from .money_maker import MoneyMaker
        
        mm = MoneyMaker()
        quote = mm.generate_quote(client_name, chapter_ids, tier)
        return self.generate_proposal(quote, client_contact)

    def get_chapter_menu(self) -> str:
        """Get formatted chapter selection menu."""
        lines = [
            "📜 **Select Chapters for Proposal**\n",
            "| # | Chapter | Service | Price |",
            "|---|---------|---------|-------|",
        ]
        
        for cid, info in BINH_PHAP_PRICING.items():
            price_str = f"${info['price']:,}"
            if info.get("recurring"):
                price_str += "/mo"
            elif info.get("quarterly"):
                price_str += "/qtr"
            lines.append(f"| {cid} | {info['name']} | {info['service']} | {price_str} |")
        
        lines.extend([
            "",
            "**Tiers:**",
            "- 🗡️ WARRIOR (Pre-Seed): $2K/mo + 5-8% equity",
            "- ⚔️ GENERAL (Series A): $5K/mo + 3-5% equity", 
            "- 🏯 TƯỚNG QUÂN (Studio): Deferred + 15-30% equity",
        ])
        
        return "\n".join(lines)

    def save_proposal(self, proposal: Proposal, filepath: str = "") -> str:
        """Save proposal to Markdown file."""
        if not filepath:
            filepath = f"proposal_{proposal.id:04d}_{proposal.client_name.replace(' ', '_')}.md"
        
        with open(filepath, "w", encoding="utf-8") as f:
            f.write(proposal.markdown_content)
        
        return filepath

    def get_stats(self) -> Dict:
        """Get proposal statistics."""
        return {
            "total_proposals": len(self.proposals),
            "total_value": sum(p.quote.total_amount for p in self.proposals),
            "avg_deal_size": (
                sum(p.quote.total_amount for p in self.proposals) / len(self.proposals)
                if self.proposals else 0
            ),
            "by_tier": {
                tier.value: sum(1 for p in self.proposals if p.quote.tier == tier)
                for tier in ServiceTier
            }
        }
