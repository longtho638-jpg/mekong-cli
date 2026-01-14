"""
WIN-WIN-WIN check models.

Extracted from sales_pipeline.py for clean architecture.
"""

from dataclasses import dataclass
from enum import Enum
from typing import Optional

from ..errors import WinWinWinError


class WinType(Enum):
    """WIN-WIN-WIN stakeholder types."""
    ANH = "anh"          # Owner
    AGENCY = "agency"    # Agency
    STARTUP = "startup"  # Client/Startup


@dataclass
class WinCheck:
    """
    WIN-WIN-WIN alignment verification.
    
    All 3 parties must WIN for deal to proceed:
    - 👑 ANH (Owner): Portfolio equity + cash flow
    - 🏢 AGENCY: Deal flow + knowledge + infrastructure
    - 🚀 STARTUP: Protection + strategy + network
    """
    anh_win: str = ""
    agency_win: str = ""
    startup_win: str = ""
    is_aligned: bool = False

    def validate(self) -> bool:
        """
        All 3 parties must WIN for deal to proceed.
        Raises WinWinWinError if validation fails.
        """
        if not self.anh_win:
            raise WinWinWinError("ANH (Owner) không WIN", "anh")
        if not self.agency_win:
            raise WinWinWinError("AGENCY không WIN", "agency")
        if not self.startup_win:
            raise WinWinWinError("STARTUP không WIN", "startup")
        
        self.is_aligned = True
        return True

    def is_valid(self) -> bool:
        """Check if all parties WIN (no exception)."""
        try:
            return self.validate()
        except WinWinWinError:
            return False

    def get_losing_party(self) -> Optional[str]:
        """Get the first party that is not winning."""
        if not self.anh_win:
            return "anh"
        if not self.agency_win:
            return "agency"
        if not self.startup_win:
            return "startup"
        return None

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "anh_win": self.anh_win,
            "agency_win": self.agency_win,
            "startup_win": self.startup_win,
            "is_aligned": self.is_aligned,
            "losing_party": self.get_losing_party()
        }

    def print_check(self) -> None:
        """Print formatted WIN check."""
        print("""
┌───────────────────────────────────────────────────┐
│  WIN-WIN-WIN Alignment Check                      │
├───────────────────────────────────────────────────┤""")
        print(f"│  👑 ANH: {self.anh_win[:40]:<40} │")
        print(f"│  🏢 AGENCY: {self.agency_win[:37]:<37} │")
        print(f"│  🚀 STARTUP: {self.startup_win[:36]:<36} │")
        status = "✅ ALIGNED" if self.is_aligned else "❌ NOT ALIGNED"
        print(f"│  Status: {status:<40} │")
        print("└───────────────────────────────────────────────────┘")
