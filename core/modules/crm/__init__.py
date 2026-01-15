"""
CRM Module Export
"""
from .entities import Contact, Deal, ContactType, DealStage, ActivityType
from .services import CRMService
from .presentation import CRMPresenter

# Alias for backward compatibility if needed, or preferred naming
CRM = CRMService
