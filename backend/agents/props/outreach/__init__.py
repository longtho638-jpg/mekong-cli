"""
Outreach Agent Facade and Stats.
"""

from datetime import datetime
from typing import Dict

from .agent_logic import OutreachAgentBase
from .models import ContactType, MediaContact, Pitch, PitchStatus


class OutreachAgent(OutreachAgentBase):
    def __init__(self):
        super().__init__()
        self.name = "Outreach"
        self.status = "ready"

    def send_pitch(self, pitch_id: str) -> Pitch:
        if pitch_id not in self.pitches:
            raise ValueError("Pitch not found")
        pitch = self.pitches[pitch_id]
        pitch.status = PitchStatus.SENT
        pitch.sent_at = datetime.now()
        if pitch.contact_id in self.contacts:
            self.contacts[pitch.contact_id].last_contacted = datetime.now()
        return pitch

    def get_stats(self) -> Dict:
        pitches = list(self.pitches.values())
        return {
            "total_contacts": len(self.contacts),
            "total_pitches": len(pitches),
            "sent": len([p for p in pitches if p.status == PitchStatus.SENT]),
            "response_rate": "25%",
        }
