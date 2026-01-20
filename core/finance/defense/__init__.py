"""
Mutual Defense Facade.
"""
from .engine import DefenseEngine
from .models import CaseStatus, CaseType, DefenseCase


class MutualDefenseProtocol(DefenseEngine):
    def __init__(self):
        super().__init__()

    def format_dashboard(self) -> str:
        return "🛡️ Mutual Defense Dashboard"

__all__ = ['MutualDefenseProtocol', 'CaseType', 'CaseStatus', 'DefenseCase']
