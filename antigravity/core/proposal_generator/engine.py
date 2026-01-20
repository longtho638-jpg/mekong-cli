"""
📄 Proposal Generator Engine
===========================

Automates the creation of high-impact strategic proposals based on the
13-Chapter Binh Pháp framework.
"""

import logging
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, Dict, List, Optional, Union

from antigravity.core.base import BaseEngine
from antigravity.core.money_maker import MoneyMaker, Quote, ServiceTier
from .models import Proposal
from .templates import PROPOSAL_TEMPLATE

# Configure logging
logger = logging.getLogger(__name__)


class ProposalGenerator(BaseEngine):
    """
    🏢 Proposal Generation Engine

    Transforms financial quotes into high-conversion strategic documents.
    """

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.proposals: List[Proposal] = []
        self._next_id = 1

        # Agency context (Ideally loaded from AgencyDNA)
        self.agency_name = "Agency OS Partner"
        self.agency_phone = "+84 900 000 000"
        self.agency_email = "hq@agencyos.network"

    def set_agency_context(self, name: str, phone: str, email: str):
        """Overrides default agency contact info."""
        self.agency_name = name
        self.agency_phone = phone
        self.agency_email = email

    def generate_proposal(
        self, quote: Quote, client_contact: str, template_override: Optional[str] = None
    ) -> Proposal:
        """Hydrates the proposal template with quote data."""

        mm = MoneyMaker()
        win3 = mm.validate_win3(quote)

        # Build Table Rows
        rows = []
        for s in quote.services:
            p_tag = f"${s['price']:,}" + ("/mo" if s.get("recurring") else "")
            rows.append(f"| {s['chapter']} | {s['name']} | {s['label']} | {p_tag} |")

        total_y1 = quote.one_time_total + (quote.monthly_retainer * 12)

        # Format Warning Section
        warn_md = ""
        if win3.warnings:
            warn_md = "\n> [!CAUTION]\n> " + "\n> ".join(win3.warnings)

        content = (template_override or PROPOSAL_TEMPLATE).format(
            client_name=quote.client_name,
            client_contact=client_contact,
            tier_label=quote.tier.value.upper(),
            agency_name=self.agency_name,
            agency_phone=self.agency_phone,
            agency_email=self.agency_email,
            date=datetime.now().strftime("%Y-%m-%d"),
            valid_until=(datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            service_table="\n".join(rows),
            project_total=quote.one_time_total,
            monthly_retainer=quote.monthly_retainer,
            equity_percent=quote.equity_percent,
            success_fee=quote.success_fee_percent,
            total_year1=total_y1,
            client_win=f"- Nhận {len(quote.services)} module chiến lược cao cấp\n- Giá trị dự án thực tế ${quote.one_time_total:,.0f}\n- Đội ngũ AI Agent vận hành 24/7",
            agency_win=f"- Dòng tiền ổn định ${quote.monthly_retainer:,.0f}/tháng\n- Cam kết phí thành công {quote.success_fee_percent:.1f}%\n- Xây dựng Portfolio uy tín",
            owner_win=f"- Upside từ cổ phần {quote.equity_percent:.1f}%\n- Quan hệ đối tác chiến lược dài hạn\n- Legacy vững chắc",
            alignment_score=win3.score,
            alignment_emoji="✅" if win3.is_valid else "⚠️",
            warnings_section=warn_md,
            proposal_id=self._next_id,
        )

        proposal = Proposal(
            id=self._next_id,
            client_name=quote.client_name,
            client_contact=client_contact,
            quote=quote,
            markdown_content=content,
        )

        self.proposals.append(proposal)
        self._next_id += 1
        logger.info(f"Proposal generated for {quote.client_name} (ID: {proposal.id})")
        return proposal

    def quick_launch(
        self,
        client_name: str,
        contact: str,
        chapter_ids: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR,
    ) -> Proposal:
        """One-call quote and proposal generation."""
        mm = MoneyMaker()
        quote = mm.generate_quote(client_name, chapter_ids, tier)
        return self.generate_proposal(quote, contact)

    def save_to_file(self, proposal: Proposal, output_dir: str = "proposals") -> Path:
        """Exports the proposal to a Markdown file."""
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)

        slug = proposal.client_name.lower().replace(" ", "_")
        filename = f"proposal_{proposal.id:03d}_{slug}.md"
        full_path = out_path / filename

        full_path.write_text(proposal.markdown_content, encoding="utf-8")
        return full_path

    def get_stats(self) -> Dict[str, Any]:
        """Insight into proposal volume and conversion values."""
        return {
            "volume": len(self.proposals),
            "pipeline_value_usd": sum(p.quote.one_time_total for p in self.proposals),
        }
