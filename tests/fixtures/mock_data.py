"""
Mock Data Factory for Mekong-CLI Platform Simulation.

Generates realistic test data for:
- Clients (1000)
- Projects (500)
- Ventures (100)
- OKRs (200)
"""

import random
from datetime import datetime, timedelta
from typing import Dict, List, Any
from dataclasses import dataclass, field
from enum import Enum


# ═══════════════════════════════════════════════════════════════════════════════
# 📊 MOCK DATA TEMPLATES
# ═══════════════════════════════════════════════════════════════════════════════

COMPANY_PREFIXES = [
    "Tech", "Cloud", "Digital", "Smart", "AI", "Data", "Cyber", "Neo",
    "Future", "Next", "Ultra", "Prime", "Elite", "Apex", "Core"
]

COMPANY_SUFFIXES = [
    "Solutions", "Labs", "Systems", "Group", "Corp", "Inc", "Co",
    "Ventures", "Partners", "Studios", "Dynamics", "Works", "Hub"
]

INDUSTRIES = [
    "Technology", "Healthcare", "Finance", "E-commerce", "Real Estate",
    "Education", "Manufacturing", "Logistics", "Marketing", "Legal",
    "Consulting", "SaaS", "Fintech", "Proptech", "Edtech"
]

PROJECT_TYPES = [
    "Website Redesign", "Mobile App", "CRM Implementation", "Marketing Campaign",
    "Brand Strategy", "SEO Optimization", "Social Media", "Analytics Setup",
    "AI Integration", "Automation", "Cloud Migration", "Security Audit"
]

FIRST_NAMES = [
    "Khoa", "Minh", "Huy", "Tuan", "Hung", "Duc", "Long", "Thang",
    "Lan", "Linh", "Mai", "Trang", "Ngoc", "Anh", "Hoa", "Thao",
    "James", "Michael", "Sarah", "Emily", "David", "Chris", "Alex", "Sam"
]

LAST_NAMES = [
    "Nguyen", "Tran", "Le", "Pham", "Hoang", "Vu", "Dang", "Bui",
    "Smith", "Johnson", "Williams", "Brown", "Jones", "Garcia", "Miller"
]


# ═══════════════════════════════════════════════════════════════════════════════
# 🏭 FACTORY CLASSES
# ═══════════════════════════════════════════════════════════════════════════════

@dataclass
class MockClient:
    id: str
    name: str
    industry: str
    contact_name: str
    contact_email: str
    ltv: float
    health_score: int
    created_at: datetime
    projects_count: int = 0


@dataclass
class MockProject:
    id: str
    client_id: str
    name: str
    type: str
    budget: float
    status: str
    start_date: datetime
    end_date: datetime
    completion_pct: int


@dataclass
class MockVenture:
    id: str
    name: str
    type: str
    stage: str
    revenue: float
    users: int
    founders: List[str]


@dataclass
class MockOKR:
    id: str
    objective: str
    pillar: str
    owner: str
    progress: int
    key_results: List[str]


class MockDataFactory:
    """Factory for generating realistic mock data for platform simulation."""
    
    def __init__(self, seed: int = 42):
        random.seed(seed)
        self._client_counter = 0
        self._project_counter = 0
        self._venture_counter = 0
        self._okr_counter = 0
    
    def generate_client(self) -> MockClient:
        """Generate a single mock client."""
        self._client_counter += 1
        company_name = f"{random.choice(COMPANY_PREFIXES)} {random.choice(COMPANY_SUFFIXES)}"
        contact_first = random.choice(FIRST_NAMES)
        contact_last = random.choice(LAST_NAMES)
        
        return MockClient(
            id=f"CLI-{self._client_counter:04d}",
            name=company_name,
            industry=random.choice(INDUSTRIES),
            contact_name=f"{contact_first} {contact_last}",
            contact_email=f"{contact_first.lower()}.{contact_last.lower()}@{company_name.lower().replace(' ', '')}.com",
            ltv=round(random.uniform(5000, 500000), 2),
            health_score=random.randint(50, 100),
            created_at=datetime.now() - timedelta(days=random.randint(30, 730))
        )
    
    def generate_project(self, client_id: str) -> MockProject:
        """Generate a single mock project."""
        self._project_counter += 1
        project_type = random.choice(PROJECT_TYPES)
        status = random.choice(["planning", "in_progress", "review", "completed"])
        start_date = datetime.now() - timedelta(days=random.randint(7, 180))
        
        return MockProject(
            id=f"PRJ-{self._project_counter:04d}",
            client_id=client_id,
            name=f"{project_type} - {client_id}",
            type=project_type,
            budget=round(random.uniform(5000, 100000), 2),
            status=status,
            start_date=start_date,
            end_date=start_date + timedelta(days=random.randint(30, 180)),
            completion_pct=random.randint(0, 100) if status != "completed" else 100
        )
    
    def generate_venture(self) -> MockVenture:
        """Generate a single mock venture."""
        self._venture_counter += 1
        venture_types = ["SaaS", "Marketplace", "Agency", "Product", "Service"]
        stages = ["CONCEPT", "MVP", "GROWTH", "SCALE"]
        
        return MockVenture(
            id=f"VEN-{self._venture_counter:04d}",
            name=f"{random.choice(COMPANY_PREFIXES)}{random.choice(['OS', 'AI', 'Hub', 'Pro', 'Max'])}",
            type=random.choice(venture_types),
            stage=random.choice(stages),
            revenue=round(random.uniform(0, 1000000), 2),
            users=random.randint(0, 50000),
            founders=[f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}" for _ in range(random.randint(1, 3))]
        )
    
    def generate_okr(self) -> MockOKR:
        """Generate a single mock OKR."""
        self._okr_counter += 1
        objectives = [
            "Increase MRR to $100K", "Launch mobile app", "Expand to 3 new markets",
            "Achieve 90% customer satisfaction", "Reduce churn to 5%", "Hire 10 engineers",
            "Reach 10K active users", "Close Series A", "Achieve SOC2 compliance"
        ]
        pillars = ["GROWTH", "PRODUCT", "OPERATIONS", "FINANCE", "TEAM"]
        
        return MockOKR(
            id=f"OKR-{self._okr_counter:04d}",
            objective=random.choice(objectives),
            pillar=random.choice(pillars),
            owner=f"{random.choice(FIRST_NAMES)} {random.choice(LAST_NAMES)}",
            progress=random.randint(0, 100),
            key_results=[
                f"KR1: {random.choice(['Hit', 'Achieve', 'Complete'])} metric by {random.randint(20, 150)}%",
                f"KR2: {random.choice(['Launch', 'Ship', 'Deploy'])} feature by Q{random.randint(1, 4)}",
                f"KR3: {random.choice(['Reduce', 'Increase', 'Maintain'])} rate to {random.randint(5, 95)}%"
            ]
        )
    
    # ═══════════════════════════════════════════════════════════════════════════
    # 📦 BULK GENERATION
    # ═══════════════════════════════════════════════════════════════════════════
    
    def generate_clients(self, count: int = 1000) -> List[MockClient]:
        """Generate bulk clients."""
        return [self.generate_client() for _ in range(count)]
    
    def generate_projects(self, clients: List[MockClient], projects_per_client: int = 2) -> List[MockProject]:
        """Generate bulk projects for clients."""
        projects = []
        for client in clients:
            num_projects = random.randint(1, projects_per_client * 2)
            client.projects_count = num_projects
            for _ in range(num_projects):
                projects.append(self.generate_project(client.id))
        return projects
    
    def generate_ventures(self, count: int = 100) -> List[MockVenture]:
        """Generate bulk ventures."""
        return [self.generate_venture() for _ in range(count)]
    
    def generate_okrs(self, count: int = 200) -> List[MockOKR]:
        """Generate bulk OKRs."""
        return [self.generate_okr() for _ in range(count)]
    
    def generate_full_dataset(self) -> Dict[str, Any]:
        """Generate complete mock dataset for platform simulation."""
        clients = self.generate_clients(1000)
        projects = self.generate_projects(clients)
        ventures = self.generate_ventures(100)
        okrs = self.generate_okrs(200)
        
        return {
            "clients": clients,
            "projects": projects,
            "ventures": ventures,
            "okrs": okrs,
            "stats": {
                "total_clients": len(clients),
                "total_projects": len(projects),
                "total_ventures": len(ventures),
                "total_okrs": len(okrs),
                "total_ltv": sum(c.ltv for c in clients),
                "avg_health_score": sum(c.health_score for c in clients) / len(clients),
                "total_budget": sum(p.budget for p in projects),
                "total_venture_revenue": sum(v.revenue for v in ventures)
            }
        }


# ═══════════════════════════════════════════════════════════════════════════════
# 🧪 QUICK TEST
# ═══════════════════════════════════════════════════════════════════════════════

if __name__ == "__main__":
    factory = MockDataFactory()
    dataset = factory.generate_full_dataset()
    
    print("🏭 Mekong-CLI Mock Data Factory")
    print("=" * 60)
    print(f"✓ Generated {dataset['stats']['total_clients']:,} clients")
    print(f"✓ Generated {dataset['stats']['total_projects']:,} projects")
    print(f"✓ Generated {dataset['stats']['total_ventures']:,} ventures")
    print(f"✓ Generated {dataset['stats']['total_okrs']:,} OKRs")
    print()
    print(f"💰 Total LTV: ${dataset['stats']['total_ltv']:,.2f}")
    print(f"📊 Avg Health: {dataset['stats']['avg_health_score']:.1f}%")
    print(f"💵 Total Budget: ${dataset['stats']['total_budget']:,.2f}")
    print(f"🚀 Venture Revenue: ${dataset['stats']['total_venture_revenue']:,.2f}")
