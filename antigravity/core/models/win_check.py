"""
⚖️ WIN-WIN-WIN Alignment Framework
==================================

Implements the mandatory 3-way alignment check required by the Agency OS
Constitution. Every strategic decision or deal must create value for all
three primary stakeholders to proceed.

Stakeholders:
- 👑 ANH (Owner): Strategic equity and sustainable cash flow.
- 🏢 AGENCY: Operational IP, infrastructure, and brand moat.
- 🚀 CLIENT: 10x value, strategic protection, and market winning.

Binh Pháp: ⚖️ Đạo (Way) - Alignment of purpose and benefit.
"""

import logging
from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import Any, Dict, Optional

from ..errors import WinWinWinError

# Configure logging
logger = logging.getLogger(__name__)


class WinType(Enum):
    """The three pillars of the WIN-WIN-WIN architecture."""

    ANH = "anh"
    AGENCY = "agency"
    CLIENT = "client"


@dataclass
class WinCheck:
    """
    ⚖️ Governance Validation Gate

    Verifies that all three parties have identified wins.
    Acts as a compliance filter for the revenue and strategy engines.
    """

    anh_win: str = ""
    agency_win: str = ""
    client_win: str = ""
    is_aligned: bool = False
    checked_at: datetime = field(default_factory=datetime.now)

    def validate(self) -> bool:
        """
        Enforces the alignment rules.
        Raises WinWinWinError if any party lacks a defined WIN.
        """
        if not self.anh_win:
            raise WinWinWinError("Missing alignment: ANH (Owner) must have a WIN.", "anh")
        if not self.agency_win:
            raise WinWinWinError("Missing alignment: AGENCY must have a WIN.", "agency")
        if not self.client_win:
            raise WinWinWinError("Missing alignment: CLIENT must have a WIN.", "client")

        self.is_aligned = True
        logger.info("WIN-WIN-WIN alignment validated successfully.")
        return True

    def check_valid(self) -> bool:
        """Returns True if the deal is aligned, False otherwise (no exception)."""
        try:
            return self.validate()
        except WinWinWinError:
            return False

    def get_failing_stakeholder(self) -> Optional[str]:
        """Identifies the first party that lacks a defined WIN."""
        if not self.anh_win:
            return "anh"
        if not self.agency_win:
            return "agency"
        if not self.client_win:
            return "client"
        return None

    def to_dict(self) -> Dict[str, Any]:
        """Provides a serializable representation for deal records."""
        return {
            "status": "aligned" if self.is_aligned else "misaligned",
            "pillars": {
                "owner": self.anh_win,
                "agency": self.agency_win,
                "client": self.client_win,
            },
            "timestamp": self.checked_at.isoformat(),
            "failing_party": self.get_failing_stakeholder(),
        }

    def print_visual_check(self) -> None:
        """Renders a visual alignment card to the console."""
        print("\n" + "┌" + "─" * 50 + "┐")
        print("│" + "⚖️  WIN-WIN-WIN ALIGNMENT GATE".center(50) + "│")
        print("├" + "─" * 50 + "┤")
        print(f"│ 👑 OWNER WIN  : {self.anh_win[:35]:<35} │")
        print(f"│ 🏢 AGENCY WIN : {self.agency_win[:35]:<35} │")
        print(f"│ 🚀 CLIENT WIN : {self.client_win[:35]:<35} │")
        print("├" + "─" * 50 + "┤")
        status = "✅ ALIGNED" if self.is_aligned else "❌ MISALIGNED"
        print(f"│ STATUS        : {status:<35} │")
        print("└" + "─" * 50 + "┘")
