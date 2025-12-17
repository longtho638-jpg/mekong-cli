"""
Empire in a Box - Auto Agency Setup
Agency CLI - Phase 3: The WOW Experience

One-command setup for complete agency infrastructure:
- Website with branding
- Legal documents
- CRM setup
- Agent activation
"""

from dataclasses import dataclass, field
from datetime import datetime
from enum import Enum
from typing import List, Dict, Optional
import random
import json


class AgencyNiche(Enum):
    SAAS_MARKETING = "saas_marketing"
    ECOMMERCE = "ecommerce"
    LOCAL_BUSINESS = "local_business"
    REAL_ESTATE = "real_estate"
    HEALTHCARE = "healthcare"
    FINANCE = "finance"
    EDUCATION = "education"
    TECH_STARTUP = "tech_startup"


class BrandStyle(Enum):
    CYBER = "cyber"           # Matrix green, dark, tech
    MINIMAL = "minimal"       # Clean, white space
    BOLD = "bold"             # Vibrant colors, striking
    PROFESSIONAL = "professional"  # Corporate, trust
    CREATIVE = "creative"     # Playful, colorful


@dataclass
class BrandIdentity:
    """Generated brand identity."""
    name: str
    tagline: str
    primary_color: str
    secondary_color: str
    accent_color: str
    font_heading: str
    font_body: str
    style: BrandStyle
    logo_concept: str


@dataclass
class LegalDocument:
    """Generated legal document."""
    doc_type: str
    title: str
    content: str
    generated_at: datetime


@dataclass
class AgencyConfig:
    """Complete agency configuration."""
    id: str
    name: str
    niche: AgencyNiche
    brand: BrandIdentity
    agents_activated: List[str]
    legal_docs: List[LegalDocument]
    created_at: datetime
    setup_time_seconds: int


class EmpireBuilder:
    """
    Empire in a Box - One-command agency setup.
    
    WOW Factor: 15 minutes from zero to full agency.
    """
    
    # Color palettes by style
    PALETTES = {
        BrandStyle.CYBER: {
            "primary": "#00ff41",
            "secondary": "#0d1117",
            "accent": "#00bfff",
        },
        BrandStyle.MINIMAL: {
            "primary": "#1a1a1a",
            "secondary": "#ffffff",
            "accent": "#6366f1",
        },
        BrandStyle.BOLD: {
            "primary": "#ff5f56",
            "secondary": "#1f2937",
            "accent": "#fbbf24",
        },
        BrandStyle.PROFESSIONAL: {
            "primary": "#1e40af",
            "secondary": "#f8fafc",
            "accent": "#0ea5e9",
        },
        BrandStyle.CREATIVE: {
            "primary": "#ec4899",
            "secondary": "#1e1b4b",
            "accent": "#a855f7",
        },
    }
    
    # Font pairings
    FONTS = {
        BrandStyle.CYBER: ("JetBrains Mono", "Inter"),
        BrandStyle.MINIMAL: ("Inter", "Inter"),
        BrandStyle.BOLD: ("Outfit", "Plus Jakarta Sans"),
        BrandStyle.PROFESSIONAL: ("Roboto", "Open Sans"),
        BrandStyle.CREATIVE: ("Poppins", "Nunito"),
    }
    
    # Agents by niche
    NICHE_AGENTS = {
        AgencyNiche.SAAS_MARKETING: [
            "SEOAgent", "PPCAgent", "ContentAgent", "EmailAgent",
            "SocialAgent", "AnalyticsAgent", "ABMAgent", "LeadGenAgent",
            "CopywriterAgent", "InfluencerAgent"
        ],
        AgencyNiche.ECOMMERCE: [
            "ProductAgent", "OrderAgent", "InventoryAgent", "PPCAgent",
            "EmailAgent", "SocialAgent", "AmazonAgent", "SEOAgent",
            "ReviewAgent", "ChatbotAgent"
        ],
        AgencyNiche.LOCAL_BUSINESS: [
            "LocalSEOAgent", "GMBAgent", "ReviewAgent", "SocialAgent",
            "EmailAgent", "EventAgent", "ChatbotAgent", "ContentAgent",
            "AdAgent", "CRMAgent"
        ],
    }
    
    # Tagline templates
    TAGLINES = {
        AgencyNiche.SAAS_MARKETING: [
            "Scale Your SaaS to Infinity",
            "Growth Engineering for SaaS",
            "Where SaaS Meets Scale",
        ],
        AgencyNiche.ECOMMERCE: [
            "E-commerce Excellence Delivered",
            "Sell More, Stress Less",
            "Your Store's Growth Partner",
        ],
        AgencyNiche.LOCAL_BUSINESS: [
            "Local Growth, Global Standards",
            "Putting Local on the Map",
            "Your Neighborhood's Digital Partner",
        ],
    }
    
    def __init__(self):
        self.agencies_created: List[AgencyConfig] = []
    
    def _generate_id(self) -> str:
        return f"agency_{random.randint(100000, 999999)}"
    
    def generate_brand(
        self,
        agency_name: str,
        niche: AgencyNiche,
        style: BrandStyle = BrandStyle.CYBER
    ) -> BrandIdentity:
        """Generate brand identity for agency."""
        palette = self.PALETTES[style]
        fonts = self.FONTS[style]
        
        taglines = self.TAGLINES.get(niche, ["Excellence in Every Pixel"])
        
        return BrandIdentity(
            name=agency_name,
            tagline=random.choice(taglines),
            primary_color=palette["primary"],
            secondary_color=palette["secondary"],
            accent_color=palette["accent"],
            font_heading=fonts[0],
            font_body=fonts[1],
            style=style,
            logo_concept=f"Modern {style.value} logo with {agency_name[0]} monogram"
        )
    
    def generate_legal_docs(self, agency_name: str) -> List[LegalDocument]:
        """Generate essential legal documents."""
        now = datetime.now()
        
        return [
            LegalDocument(
                doc_type="terms_of_service",
                title="Terms of Service",
                content=f"""
# Terms of Service - {agency_name}

Last updated: {now.strftime('%B %d, %Y')}

## 1. Services
{agency_name} provides digital marketing and consulting services...

## 2. Payment Terms
Payment is due within 30 days of invoice...

## 3. Confidentiality
All client information is kept strictly confidential...

## 4. Limitation of Liability
{agency_name} liability is limited to the amount paid...
""",
                generated_at=now
            ),
            LegalDocument(
                doc_type="privacy_policy",
                title="Privacy Policy",
                content=f"""
# Privacy Policy - {agency_name}

Last updated: {now.strftime('%B %d, %Y')}

## Data We Collect
We collect information you provide directly...

## How We Use Data
We use data to provide and improve services...

## Data Security
We implement industry-standard security measures...
""",
                generated_at=now
            ),
            LegalDocument(
                doc_type="client_agreement",
                title="Client Service Agreement",
                content=f"""
# Client Service Agreement - {agency_name}

This Agreement is between {agency_name} ("Agency") and [Client Name] ("Client").

## Scope of Work
Agency will provide the following services: [Services]

## Timeline
Project duration: [Duration]

## Fees
Total project fee: $[Amount]

## Signatures
_______________________
{agency_name}

_______________________
Client
""",
                generated_at=now
            ),
        ]
    
    def build_empire(
        self,
        agency_name: str,
        niche: AgencyNiche,
        style: BrandStyle = BrandStyle.CYBER
    ) -> AgencyConfig:
        """
        Build complete agency infrastructure.
        
        Args:
            agency_name: Name of the agency
            niche: Target niche
            style: Brand style
            
        Returns:
            Complete AgencyConfig with all components
        """
        start_time = datetime.now()
        
        # Generate brand
        brand = self.generate_brand(agency_name, niche, style)
        
        # Generate legal docs
        legal_docs = self.generate_legal_docs(agency_name)
        
        # Activate agents for niche
        agents = self.NICHE_AGENTS.get(niche, self.NICHE_AGENTS[AgencyNiche.SAAS_MARKETING])
        
        end_time = datetime.now()
        setup_time = (end_time - start_time).total_seconds()
        
        config = AgencyConfig(
            id=self._generate_id(),
            name=agency_name,
            niche=niche,
            brand=brand,
            agents_activated=agents,
            legal_docs=legal_docs,
            created_at=end_time,
            setup_time_seconds=int(setup_time)
        )
        
        self.agencies_created.append(config)
        return config
    
    def generate_website_config(self, config: AgencyConfig) -> Dict:
        """Generate Next.js website configuration."""
        return {
            "name": config.name,
            "tagline": config.brand.tagline,
            "theme": {
                "colors": {
                    "primary": config.brand.primary_color,
                    "secondary": config.brand.secondary_color,
                    "accent": config.brand.accent_color,
                },
                "fonts": {
                    "heading": config.brand.font_heading,
                    "body": config.brand.font_body,
                },
                "style": config.brand.style.value,
            },
            "pages": ["home", "services", "about", "contact", "blog"],
            "features": ["dark_mode", "animations", "seo_optimized"],
        }
    
    def export_config(self, config: AgencyConfig) -> str:
        """Export agency config as JSON."""
        return json.dumps({
            "id": config.id,
            "name": config.name,
            "niche": config.niche.value,
            "brand": {
                "tagline": config.brand.tagline,
                "colors": {
                    "primary": config.brand.primary_color,
                    "secondary": config.brand.secondary_color,
                    "accent": config.brand.accent_color,
                },
                "fonts": {
                    "heading": config.brand.font_heading,
                    "body": config.brand.font_body,
                },
                "style": config.brand.style.value,
            },
            "agents": config.agents_activated,
            "legal_docs_count": len(config.legal_docs),
            "setup_time_seconds": config.setup_time_seconds,
        }, indent=2)


# Demo
if __name__ == "__main__":
    builder = EmpireBuilder()
    
    print("🏯 Empire in a Box - Agency Setup")
    print("=" * 50)
    
    # Build an agency
    config = builder.build_empire(
        agency_name="Nova Digital",
        niche=AgencyNiche.SAAS_MARKETING,
        style=BrandStyle.CYBER
    )
    
    print(f"\n✅ Agency Created: {config.name}")
    print(f"   ID: {config.id}")
    print(f"   Niche: {config.niche.value}")
    print(f"   Setup Time: {config.setup_time_seconds}s")
    
    print(f"\n🎨 Brand Identity:")
    print(f"   Tagline: \"{config.brand.tagline}\"")
    print(f"   Colors: {config.brand.primary_color}, {config.brand.accent_color}")
    print(f"   Fonts: {config.brand.font_heading} / {config.brand.font_body}")
    
    print(f"\n🤖 Agents Activated ({len(config.agents_activated)}):")
    for agent in config.agents_activated[:5]:
        print(f"   ✓ {agent}")
    print(f"   ... and {len(config.agents_activated) - 5} more")
    
    print(f"\n📜 Legal Documents ({len(config.legal_docs)}):")
    for doc in config.legal_docs:
        print(f"   ✓ {doc.title}")
    
    # Website config
    web_config = builder.generate_website_config(config)
    print(f"\n🌐 Website Ready:")
    print(f"   Pages: {', '.join(web_config['pages'])}")
    print(f"   Features: {', '.join(web_config['features'])}")
