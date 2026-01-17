"""
Outreach Service
================
Business logic for lead outreach and templates.
"""

from typing import Dict, Any, List, Optional
from datetime import datetime
from .repository import OutreachRepository

TEMPLATES = {
    "ghost_cto": {
        "subject": "Quick question about {company}'s engineering velocity",
        "body": """Hi {name},

I noticed {company} is growing fast. Congrats!

Quick question: How are you tracking your engineering team's velocity and output?

I've been helping startups like yours with "Ghost CTO" services - basically fractional technical oversight without the full-time cost.

Here's a sample of what I provide weekly:
- Dev velocity reports (commits, PRs, cycle time)
- Technical debt identification
- Architecture recommendations

Would you be open to a 15-min call to see if this could help {company}?

Best,
Bill

P.S. I've attached a sample CTO report from a similar-sized team.
""",
    },
    "strategy_session": {
        "subject": "Binh Pháp Strategy Session for {company}",
        "body": """Hi {name},

I came across {company} and was impressed by what you're building.

I specialize in strategic consulting for startups using the "Binh Pháp" framework (applying Sun Tzu's Art of War to modern business strategy).

I'm offering a complimentary 30-min strategy session where we'll:
- Analyze your competitive moat
- Identify strategic vulnerabilities
- Map your path to market dominance

Would you be interested in scheduling a session this week?

Best,
Bill

🏯 AgencyOS
""",
    },
}

class OutreachService:
    def __init__(self):
        self.repo = OutreachRepository()

    def add_lead(self, name: str, email: str, company: str) -> bool:
        lead = {
            "name": name,
            "email": email,
            "company": company,
            "stage": "new",
            "added": datetime.now().isoformat(),
            "last_contact": None,
            "notes": "",
        }
        return self.repo.add_lead(lead)

    def list_leads(self) -> List[Dict[str, Any]]:
        return self.repo.load_leads()

    def get_template(self, name: str) -> Optional[Dict[str, str]]:
        return TEMPLATES.get(name)

    def generate_email(self, email: str, template_name: str) -> Optional[Dict[str, str]]:
        leads = self.repo.load_leads()
        lead = next((l for l in leads if l["email"] == email), None)
        
        if not lead:
            return None
            
        template = self.get_template(template_name)
        if not template:
            return None

        # Safe formatting using default values if keys missing
        safe_lead = {k: v or "" for k, v in lead.items()}
        
        return {
            "to": f"{lead['name']} <{lead['email']}>",
            "subject": template["subject"].format(**safe_lead),
            "body": template["body"].format(**safe_lead),
            "email_raw": lead["email"]
        }

    def mark_contacted(self, email: str):
        self.repo.update_lead(email, {
            "stage": "contacted", 
            "last_contact": datetime.now().isoformat()
        })

    def get_stats(self) -> Dict[str, Any]:
        leads = self.repo.load_leads()
        stages = {"new": 0, "contacted": 0, "replied": 0, "meeting": 0, "closed": 0}
        
        for lead in leads:
            stage = lead.get("stage", "new")
            stages[stage] = stages.get(stage, 0) + 1
            
        total = len(leads)
        closed = stages.get("closed", 0)
        conversion = (closed / total * 100) if total > 0 else 0
        
        return {
            "total": total,
            "stages": stages,
            "conversion_rate": conversion
        }
