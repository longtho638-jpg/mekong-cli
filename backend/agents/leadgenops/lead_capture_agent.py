"""
Lead Capture Agent - Forms & Landing Pages
Manages lead capture forms and conversion optimization.
"""

from dataclasses import dataclass, field
from typing import List, Dict, Optional
from datetime import datetime
from enum import Enum
import random


class FormType(Enum):
    CONTACT = "contact"
    DEMO = "demo"
    NEWSLETTER = "newsletter"
    DOWNLOAD = "download"
    WEBINAR = "webinar"


@dataclass
class FormField:
    """Form field"""
    name: str
    field_type: str
    required: bool = True


@dataclass
class CaptureForm:
    """Lead capture form"""
    id: str
    name: str
    form_type: FormType
    page_url: str
    fields: List[FormField] = field(default_factory=list)
    views: int = 0
    submissions: int = 0
    created_at: datetime = None
    
    def __post_init__(self):
        if self.created_at is None:
            self.created_at = datetime.now()
    
    @property
    def conversion_rate(self) -> float:
        return (self.submissions / self.views * 100) if self.views > 0 else 0


@dataclass
class CapturedLead:
    """Captured lead"""
    id: str
    email: str
    form_id: str
    data: Dict = field(default_factory=dict)
    captured_at: datetime = None
    
    def __post_init__(self):
        if self.captured_at is None:
            self.captured_at = datetime.now()


class LeadCaptureAgent:
    """
    Lead Capture Agent - Thu thập Leads
    
    Responsibilities:
    - Form management
    - Landing pages
    - Conversion tracking
    - A/B testing
    """
    
    def __init__(self):
        self.name = "Lead Capture"
        self.status = "ready"
        self.forms: Dict[str, CaptureForm] = {}
        self.leads: List[CapturedLead] = []
        
    def create_form(
        self,
        name: str,
        form_type: FormType,
        page_url: str,
        fields: List[dict] = None
    ) -> CaptureForm:
        """Create capture form"""
        form_id = f"form_{random.randint(100,999)}"
        
        form_fields = [
            FormField(f["name"], f.get("type", "text"), f.get("required", True))
            for f in (fields or [])
        ]
        
        form = CaptureForm(
            id=form_id,
            name=name,
            form_type=form_type,
            page_url=page_url,
            fields=form_fields
        )
        
        self.forms[form_id] = form
        return form
    
    def record_view(self, form_id: str) -> CaptureForm:
        """Record form view"""
        if form_id not in self.forms:
            raise ValueError(f"Form not found: {form_id}")
            
        self.forms[form_id].views += 1
        return self.forms[form_id]
    
    def capture_lead(
        self,
        form_id: str,
        email: str,
        data: Dict = None
    ) -> CapturedLead:
        """Capture lead from form"""
        if form_id not in self.forms:
            raise ValueError(f"Form not found: {form_id}")
            
        lead = CapturedLead(
            id=f"lead_{random.randint(1000,9999)}",
            email=email,
            form_id=form_id,
            data=data or {}
        )
        
        self.leads.append(lead)
        self.forms[form_id].submissions += 1
        
        return lead
    
    def simulate_traffic(self, form_id: str, views: int) -> CaptureForm:
        """Simulate form traffic"""
        if form_id not in self.forms:
            raise ValueError(f"Form not found: {form_id}")
            
        form = self.forms[form_id]
        form.views = views
        
        # Simulate conversions
        conversion = random.uniform(0.02, 0.08)
        submissions = int(views * conversion)
        
        for i in range(submissions):
            self.capture_lead(form_id, f"lead{i}@example.com", {"source": "organic"})
        
        return form
    
    def get_stats(self) -> Dict:
        """Get capture statistics"""
        forms = list(self.forms.values())
        
        return {
            "total_forms": len(forms),
            "total_views": sum(f.views for f in forms),
            "total_leads": len(self.leads),
            "avg_conversion": sum(f.conversion_rate for f in forms) / len(forms) if forms else 0
        }


# Demo
if __name__ == "__main__":
    agent = LeadCaptureAgent()
    
    print("🧲 Lead Capture Agent Demo\n")
    
    # Create form
    f1 = agent.create_form(
        "Demo Request Form",
        FormType.DEMO,
        "/demo",
        [
            {"name": "email", "type": "email"},
            {"name": "company", "type": "text"},
            {"name": "role", "type": "select"}
        ]
    )
    
    print(f"📋 Form: {f1.name}")
    print(f"   Type: {f1.form_type.value}")
    print(f"   Fields: {len(f1.fields)}")
    
    # Simulate traffic
    agent.simulate_traffic(f1.id, 1000)
    
    print(f"\n📊 Performance:")
    print(f"   Views: {f1.views}")
    print(f"   Submissions: {f1.submissions}")
    print(f"   Conversion: {f1.conversion_rate:.1f}%")
