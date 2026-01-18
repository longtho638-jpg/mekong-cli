"""
CRM Module Export
"""

from .entities import ActivityType, Contact, ContactType, Deal, DealStage
from .presentation import CRMPresenter
from .services import CRMService

# Alias for backward compatibility if needed, or preferred naming
CRM = CRMService
