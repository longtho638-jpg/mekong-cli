"""
🏰 Moat Definitions
===================

Defines the 5 core areas of platform defensibility (Moats).
"""

from typing import Dict

from .models import Moat


def get_default_moats() -> Dict[str, Moat]:
    """Sets up the 5 core areas of platform defensibility."""
    return {
        "data": Moat(
            id="data",
            name="Data Moat",
            emoji="📊",
            description="Hồ sơ khách hàng, báo giá, hóa đơn và lịch sử dự án.",
            switching_cost_label="Mất hàng năm dữ liệu vận hành",
            metrics={"projects": 0, "clients": 0, "quotes": 0, "invoices": 0},
        ),
        "learning": Moat(
            id="learning",
            name="Learning Moat",
            emoji="🧠",
            description="AI đã học phong cách, sở thích và quy trình riêng của Anh.",
            switching_cost_label="Mất sạch các mẫu AI cá nhân hóa",
            metrics={"patterns": 0, "success_rate": 0.75, "custom_skills": 0},
        ),
        "network": Moat(
            id="network",
            name="Network Moat",
            emoji="🌐",
            description="Kết nối cộng đồng, đối tác và uy tín hệ thống.",
            switching_cost_label="Mất toàn bộ mạng lưới đối tác",
            metrics={"partners": 0, "referrals": 0, "reputation_points": 0},
        ),
        "workflow": Moat(
            id="workflow",
            name="Workflow Moat",
            emoji="⚡",
            description="Các quy trình tự động và Agent Crews tùy chỉnh.",
            switching_cost_label="Phải xây dựng lại mọi tự động hóa",
            metrics={"custom_workflows": 0, "active_crews": 0, "hours_saved": 0},
        ),
        "identity": Moat(
            id="identity",
            name="Identity Moat",
            emoji="🏯",
            description="Agency DNA, giọng thương hiệu và bản sắc địa phương.",
            switching_cost_label="Mất bản sắc và định vị thương hiệu",
            metrics={"dna_sync": False, "locales": 1, "brand_assets": 0},
        ),
    }
