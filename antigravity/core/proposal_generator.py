'''
📄 ProposalGenerator - Professional Proposal Builder
===================================================

Automates the creation of high-impact strategic proposals based on the 
13-Chapter Binh Pháp framework. Ensures all documents are professionally 
formatted and reflect the Agency OS core values.

Features:
- Markdown-based Templating: Ready for PDF export.
- WIN-WIN-WIN Alignment: Visualizes value for all parties.
- Localized Messaging: Vietnamese-first executive summaries.
- Persistence: Tracks all generated proposals.

Binh Pháp: 📄 Kế (Strategy) - Creating the map before the march.
'''

import logging
from dataclasses import dataclass, field
from datetime import datetime, timedelta
from typing import Dict, List, Optional, Any, Union
from pathlib import Path

from .base import BaseEngine
from .money_maker import Quote, ServiceTier

# Configure logging
logger = logging.getLogger(__name__)

@dataclass
class Proposal:
    '''A generated client-ready proposal document.'''
    id: int
    client_name: str
    client_contact: str
    quote: Quote
    markdown_content: str
    created_at: datetime = field(default_factory=datetime.now)
    valid_until: datetime = field(default_factory=lambda: datetime.now() + timedelta(days=30))
    status: str = "draft"


PROPOSAL_TEMPLATE = '''# 📜 Strategic Proposal: {client_name}

> **Engagement Tier:** {tier_label}
> **Prepared by {agency_name}** | {date}
> Proposal ID: #{proposal_id:04d} | Valid until: {valid_until}

---

## 🎯 Executive Summary

Chào **{client_contact}**,

Cảm ơn Anh đã tin tưởng và kết nối cùng **{agency_name}**. Dựa trên mục tiêu tăng trưởng của Anh, chúng tôi đề xuất lộ trình hợp tác theo phương pháp **Binh Pháp WIN-WIN-WIN** - đảm bảo sự bền vững và đột phá cho cả hai bên.

---

## 📦 Giải Pháp Chiến Lược (Strategic Modules)

Chúng tôi đã lựa chọn các module Binh Pháp tối ưu nhất cho giai đoạn này:

| Module | Dịch Vụ | Chi Tiết | Đầu Tư |
|--------|---------|----------|--------|
{service_table}

---

## 💰 Cơ Cấu Hợp Tác (Engagement Model)

### 1. Đầu Tư Ban Đầu (One-Time)
| Hạng mục | Giá trị |
|----------|---------|
| Tổng các Module thực thi | ${project_total:,.0f} |

### 2. Đồng Hành Hàng Tháng (Retainer)
| Hạng mục | Giá trị |
|----------|---------|
| Phí quản lý & vận hành | ${monthly_retainer:,.0f}/tháng |
| Thời hạn tối thiểu | 06 tháng |

### 3. Chia Sẻ Thành Quả (Equity & Success)
| Hạng mục | Tỷ lệ |
|----------|-------|
| Cổ phần chiến lược (Equity) | {equity_percent:.1f}% |
| Phí thành công (Success Fee) | {success_fee:.1f}% của vòng gọi vốn tiếp theo |

**Ước tính giá trị năm đầu tiên: ${total_year1:,.0f}**

---

## 🏯 WIN-WIN-WIN Alignment Check

Mọi sự hợp tác tại Agency OS đều phải vượt qua bài kiểm tra "Tam Thắng":

### 👑 WIN Của Anh (Client)
{client_win}

### 🏢 WIN Của Agency
{agency_win}

### 🎯 OWNER WIN (Sự Gắn Kết)
{owner_win}

**Điểm Cân Bằng (Alignment Score): {alignment_score}/100** {alignment_emoji}

{warnings_section}

---

## 📋 Điều Khoản & Lộ Trình

### Thanh Toán
- 50% Ngay sau khi ký hợp đồng.
- 50% Sau khi hoàn thành các module chiến lược.
- Retainer hàng tháng thanh toán vào ngày 05 mỗi tháng.

### Lộ Trình Thực Thi
- **Tuần 1:** Khám phá (Discovery) & Thiết lập DNA.
- **Tuần 2-3:** Xây dựng Moat & Huấn luyện AI Agents.
- **Tuần 4+:** Triển khai đa kênh & Tăng trưởng.

---

## ✍️ Bước Tiếp Theo

1. **Phản hồi:** Anh vui lòng xem qua và cho ý kiến về các module đề xuất.
2. **Hợp đồng:** Chúng tôi sẽ gửi bản thảo hợp đồng điện tử sau khi thống nhất.
3. **Kích hoạt:** Bắt đầu hành trình chinh phục cột mốc mới.

---

> 🏯 **"Bất chiến nhi khuất nhân chi binh"**
> *Thắng mà không cần đánh - Chúng tôi chỉ thắng khi Anh thắng.*

**{agency_name}**
Zalo/Phone: {agency_phone}
Email: {agency_email}
'''


class ProposalGenerator(BaseEngine):
    '''
    🏢 Proposal Generation Engine
    
    Transforms financial quotes into high-conversion strategic documents.
    '''

    def __init__(self, data_dir: str = ".antigravity"):
        super().__init__(data_dir)
        self.proposals: List[Proposal] = []
        self._next_id = 1
        
        # Agency context (Ideally loaded from AgencyDNA)
        self.agency_name = "Agency OS Partner"
        self.agency_phone = "+84 900 000 000"
        self.agency_email = "hq@agencyos.network"

    def set_agency_context(self, name: str, phone: str, email: str):
        '''Overrides default agency contact info.'''
        self.agency_name = name
        self.agency_phone = phone
        self.agency_email = email

    def generate_proposal(
        self,
        quote: Quote,
        client_contact: str,
        template_override: Optional[str] = None
    ) -> Proposal:
        '''Hydrates the proposal template with quote data.'''
        from .money_maker import MoneyMaker
        
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
        logger.info(f"Proposal generated for {quote.client_name} (ID: {proposal.id})")
        return proposal

    def quick_launch(
        self,
        client_name: str,
        contact: str,
        chapter_ids: List[int],
        tier: Union[ServiceTier, str] = ServiceTier.WARRIOR
    ) -> Proposal:
        '''One-call quote and proposal generation.'''
        from .money_maker import MoneyMaker
        mm = MoneyMaker()
        quote = mm.generate_quote(client_name, chapter_ids, tier)
        return self.generate_proposal(quote, contact)

    def save_to_file(self, proposal: Proposal, output_dir: str = "proposals") -> Path:
        '''Exports the proposal to a Markdown file.'''
        out_path = Path(output_dir)
        out_path.mkdir(parents=True, exist_ok=True)
        
        slug = proposal.client_name.lower().replace(" ", "_")
        filename = f"proposal_{proposal.id:03d}_{slug}.md"
        full_path = out_path / filename
        
        full_path.write_text(proposal.markdown_content, encoding="utf-8")
        return full_path

    def get_stats(self) -> Dict[str, Any]:
        '''Insight into proposal volume and conversion values.'''
        return {
            "volume": len(self.proposals),
            "pipeline_value_usd": sum(p.quote.one_time_total for p in self.proposals)
        }
