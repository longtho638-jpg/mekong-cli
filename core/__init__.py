"""
Agency OS Core Module
======================

All core functionality for the unified Agency OS platform.
"""

# Import with error handling for optional modules
try:
    from .vibe_tuner import VibeTuner
except ImportError:
    VibeTuner = None

try:
    from .crm import CRM
except ImportError:
    CRM = None

try:
    from .scheduler import Scheduler
except ImportError:
    Scheduler = None

try:
    from .analytics import AnalyticsDashboard
except ImportError:
    AnalyticsDashboard = None

try:
    from .ai_wingman import AIWingman
except ImportError:
    AIWingman = None

try:
    from .franchise import FranchiseSystem
except ImportError:
    FranchiseSystem = None

try:
    from .email_automation import EmailAutomation
except ImportError:
    EmailAutomation = None

try:
    from .client_portal import ClientPortal
except ImportError:
    ClientPortal = None

try:
    from .proposal_generator import ProposalGenerator
except ImportError:
    ProposalGenerator = None

try:
    from .telegram_bot import TelegramBot
except ImportError:
    TelegramBot = None

try:
    from .voice_clone import VoiceClone
except ImportError:
    VoiceClone = None

try:
    from .gamification import GamificationEngine
except ImportError:
    GamificationEngine = None

try:
    from .empire_builder import EmpireBuilder
except ImportError:
    EmpireBuilder = None

__all__ = [
    "VibeTuner",
    "CRM",
    "Scheduler", 
    "AnalyticsDashboard",
    "AIWingman",
    "FranchiseSystem",
    "EmailAutomation",
    "ClientPortal",
    "ProposalGenerator",
    "TelegramBot",
    "VoiceClone",
    "GamificationEngine",
    "EmpireBuilder",
]
