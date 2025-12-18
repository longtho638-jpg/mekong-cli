"""
Outreach Agent - Media Relations & Pitching
Manages media contacts and automated pitch sequences.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from enum import Enum
import random


class ContactType(Enum):
    JOURNALIST = "journalist"
    BLOGGER = "blogger"
    INFLUENCER = "influencer"
    PARTNER = "partner"


class PitchStatus(Enum):
    DRAFT = "draft"
    SENT = "sent"
    OPENED = "opened"
    REPLIED = "replied"
    COVERED = "covered"
    DECLINED = "declined"


@dataclass
class MediaContact:
    """Media contact for outreach"""
    id: str
    name: str
    outlet: str
    email: str
    contact_type: ContactType
    beat: str  # Topic they cover
    notes: str = ""
    last_contacted: Optional[datetime] = None


@dataclass
class Pitch:
    """Outreach pitch"""
    id: str
    contact_id: str
    subject: str
    body: str
    status: PitchStatus = PitchStatus.DRAFT
    sent_at: Optional[datetime] = None
    opened_at: Optional[datetime] = None
    replied_at: Optional[datetime] = None
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()


class OutreachAgent:
    """
    Outreach Agent - Quan hệ Báo chí
    
    Responsibilities:
    - Manage media contacts
    - Generate pitch templates
    - Track pitch status
    - Follow-up automation
    """
    
    # Pitch templates
    TEMPLATES = {
        "product_launch": """
Chào {name},

Tôi là Founder của Mekong-CLI, nền tảng mã nguồn mở giúp tự động hóa việc khởi tạo Agency.

Chúng tôi vừa ra mắt phiên bản mới với các tính năng:
• Hybrid Router: Tiết kiệm 70% chi phí AI
• Vibe Tuning: AI nói giọng địa phương
• 15-minute deployment

Liệu {outlet} có quan tâm để viết về câu chuyện này không?

Trân trọng,
Founder Team
""",
        "partnership": """
Chào {name},

Tôi muốn đề xuất hợp tác giữa Mekong-CLI và {outlet}.

Chúng tôi có thể cung cấp:
• Workshop về Google Cloud/AI Agents
• Nội dung chuyên môn về Local Agency
• Co-marketing opportunities

Bạn có thời gian để trao đổi thêm không?

Best regards,
""",
        "feature_story": """
Chào {name},

Tôi có một góc nhìn thú vị cho {outlet} về:

"{subject}"

Key points:
• Làn sóng "Agency 1 người" đang nổi lên
• AI giúp Solopreneur cạnh tranh với Agency lớn
• Case study: Doanh thu $5k, chi phí $50

Có phù hợp với editorial calendar của bạn không?

Thanks,
"""
    }
    
    def __init__(self):
        self.name = "Outreach"
        self.status = "ready"
        self.contacts: Dict[str, MediaContact] = {}
        self.pitches: Dict[str, Pitch] = {}
        
    def add_contact(
        self,
        name: str,
        outlet: str,
        email: str,
        contact_type: ContactType,
        beat: str
    ) -> MediaContact:
        """Add a media contact"""
        contact_id = f"contact_{len(self.contacts)+1}"
        
        contact = MediaContact(
            id=contact_id,
            name=name,
            outlet=outlet,
            email=email,
            contact_type=contact_type,
            beat=beat
        )
        
        self.contacts[contact_id] = contact
        return contact
    
    def generate_pitch(
        self,
        contact_id: str,
        template: str = "product_launch",
        subject: str = "Mekong-CLI Launch"
    ) -> Pitch:
        """Generate pitch from template"""
        if contact_id not in self.contacts:
            raise ValueError(f"Contact not found: {contact_id}")
            
        contact = self.contacts[contact_id]
        template_body = self.TEMPLATES.get(template, self.TEMPLATES["product_launch"])
        
        body = template_body.format(
            name=contact.name,
            outlet=contact.outlet,
            subject=subject
        )
        
        pitch_id = f"pitch_{int(datetime.now().timestamp())}_{random.randint(100,999)}"
        pitch = Pitch(
            id=pitch_id,
            contact_id=contact_id,
            subject=subject,
            body=body
        )
        
        self.pitches[pitch_id] = pitch
        return pitch
    
    def send_pitch(self, pitch_id: str) -> Pitch:
        """Mark pitch as sent"""
        if pitch_id not in self.pitches:
            raise ValueError(f"Pitch not found: {pitch_id}")
            
        pitch = self.pitches[pitch_id]
        pitch.status = PitchStatus.SENT
        pitch.sent_at = datetime.now()
        
        # Update contact last_contacted
        if pitch.contact_id in self.contacts:
            self.contacts[pitch.contact_id].last_contacted = datetime.now()
            
        return pitch
    
    def get_stats(self) -> Dict:
        """Get outreach statistics"""
        pitches = list(self.pitches.values())
        
        return {
            "total_contacts": len(self.contacts),
            "total_pitches": len(pitches),
            "sent": len([p for p in pitches if p.status == PitchStatus.SENT]),
            "opened": len([p for p in pitches if p.status == PitchStatus.OPENED]),
            "replied": len([p for p in pitches if p.status == PitchStatus.REPLIED]),
            "covered": len([p for p in pitches if p.status == PitchStatus.COVERED]),
            "response_rate": "25%"  # Mock
        }


# Demo
if __name__ == "__main__":
    agent = OutreachAgent()
    
    print("📰 Outreach Agent Demo\n")
    
    # Add contacts
    contact1 = agent.add_contact(
        name="Ngọc Anh",
        outlet="TechInAsia Vietnam",
        email="ngocanh@techinasia.com",
        contact_type=ContactType.JOURNALIST,
        beat="Startups, AI"
    )
    
    contact2 = agent.add_contact(
        name="Minh Tuấn",
        outlet="GDG Saigon",
        email="tuan@gdg.vn",
        contact_type=ContactType.PARTNER,
        beat="Developer events"
    )
    
    print(f"👤 Added: {contact1.name} ({contact1.outlet})")
    print(f"👤 Added: {contact2.name} ({contact2.outlet})")
    
    # Generate pitch
    pitch = agent.generate_pitch(contact1.id, "product_launch")
    print(f"\n📧 Generated Pitch: {pitch.subject}")
    print(f"   Preview: {pitch.body[:80]}...")
    
    # Send
    agent.send_pitch(pitch.id)
    print(f"✅ Status: {pitch.status.value}")
    
    # Stats
    print("\n📊 Stats:")
    stats = agent.get_stats()
    print(f"   Contacts: {stats['total_contacts']}")
    print(f"   Pitches: {stats['total_pitches']}")
