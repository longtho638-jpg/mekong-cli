"""
🏰 Moat Engine Module
=====================

Creates compounding defensibility for AgencyEr by tracking accumulated value
that would be permanently lost if switching platforms.

The 5 Immortal Moats:
1. 📊 Data Moat: All operational records and client history.
2. 🧠 Learning Moat: AI personalized to the agency's specific style.
3. 🌐 Network Moat: Community reputation and partner connections.
4. ⚡ Workflow Moat: Proprietary automations and custom agent crews.
5. 🏯 Identity Moat: Agency DNA and localized brand voice.
"""

from .engine import MoatEngine, get_moat_engine
from .models import Moat

__all__ = ["MoatEngine", "Moat", "get_moat_engine"]
