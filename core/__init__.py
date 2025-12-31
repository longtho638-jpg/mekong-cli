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

# New modules added in Phase 44-48
try:
    from .license import LicenseManager
except ImportError:
    LicenseManager = None

try:
    from .invoice import InvoiceSystem
except ImportError:
    InvoiceSystem = None

try:
    from .notifications import NotificationSystem
except ImportError:
    NotificationSystem = None

try:
    from .client_experience import ClientExperience
except ImportError:
    ClientExperience = None

try:
    from .business_plan_generator import BusinessPlanGenerator
except ImportError:
    BusinessPlanGenerator = None

# Guild Protocol modules (Blue Ocean)
try:
    from .guild_hub import GuildHub
except ImportError:
    GuildHub = None

try:
    from .guild_constitution import GuildConstitution
except ImportError:
    GuildConstitution = None

try:
    from .client_dna import ClientDNASystem
except ImportError:
    ClientDNASystem = None

try:
    from .pricing_intel import PricingIntelligence
except ImportError:
    PricingIntelligence = None

try:
    from .mutual_defense import MutualDefenseProtocol
except ImportError:
    MutualDefenseProtocol = None

# Newsletter Hub (Blue Ocean)
try:
    from .newsletter_hub import NewsletterHub
except ImportError:
    NewsletterHub = None

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
    # New modules
    "LicenseManager",
    "InvoiceSystem",
    "NotificationSystem",
    "ClientExperience",
    "BusinessPlanGenerator",
    # Guild Protocol (Blue Ocean)
    "GuildHub",
    "GuildConstitution",
    "ClientDNASystem",
    "PricingIntelligence",
    "MutualDefenseProtocol",
    # Newsletter Hub
    "NewsletterHub",
]


