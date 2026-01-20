"""
Outreach Agent core logic and templates.
"""
import random
from datetime import datetime
from typing import Dict, Optional

from .models import ContactType, MediaContact, Pitch, PitchStatus

TEMPLATES = {
    "product_launch": """
Chào {name},
Tôi là Founder của Mekong-CLI, nền tảng mã nguồn mở giúp tự động hóa việc khởi tạo Agency.
...
""",
    "partnership": """
Chào {name},
Tôi muốn đề xuất hợp tác giữa Mekong-CLI and {outlet}.
...
""",
}

class OutreachAgentBase:
    def __init__(self):
        self.contacts: Dict[str, MediaContact] = {}
        self.pitches: Dict[str, Pitch] = {}

    def add_contact(self, name: str, outlet: str, email: str, contact_type: ContactType, beat: str) -> MediaContact:
        contact_id = f"contact_{len(self.contacts) + 1}"
        contact = MediaContact(id=contact_id, name=name, outlet=outlet, email=email, contact_type=contact_type, beat=beat)
        self.contacts[contact_id] = contact
        return contact

    def generate_pitch(self, contact_id: str, template: str = "product_launch", subject: str = "Mekong-CLI Launch") -> Pitch:
        if contact_id not in self.contacts: raise ValueError("Contact not found")
        contact = self.contacts[contact_id]
        body = TEMPLATES.get(template, TEMPLATES["product_launch"]).format(name=contact.name, outlet=contact.outlet, subject=subject)
        pitch_id = f"pitch_{int(datetime.now().timestamp())}_{random.randint(100, 999)}"
        pitch = Pitch(id=pitch_id, contact_id=contact_id, subject=subject, body=body)
        self.pitches[pitch_id] = pitch
        return pitch
