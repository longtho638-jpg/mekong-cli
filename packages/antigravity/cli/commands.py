"""
Antigravity CLI Command Handlers.
"""
import json
from datetime import datetime
from pathlib import Path


def cmd_start():
    """Bootstrap a new agency (5-minute setup)."""
    from antigravity.core.agency_dna import AgencyDNA, PricingTier, Tone

    print("\n🚀 BOOTSTRAP YOUR AGENCY")
    print("-" * 50)
    print("\n📝 Quick Setup (Press Enter for defaults)\n")

    name = input("   Agency name [My Agency]: ").strip() or "My Agency"
    niche = input("   Niche [Digital Marketing]: ").strip() or "Digital Marketing"
    location = input("   Location [Vietnam]: ").strip() or "Vietnam"

    print("\n   Tone:\n   1. Miền Tây (Southern)\n   2. Miền Bắc (Northern)\n   3. Miền Trung (Central)\n   4. Friendly (English)\n   5. Professional (English)")
    choice = input("   Select [1]: ").strip() or "1"
    tones = {"1": Tone.MIEN_TAY, "2": Tone.MIEN_BAC, "3": Tone.MIEN_TRUNG, "4": Tone.FRIENDLY, "5": Tone.PROFESSIONAL}
    tone = tones.get(choice, Tone.MIEN_TAY)

    dna = AgencyDNA(name=name, niche=niche, location=location, tone=tone, tier=PricingTier.STARTER)
    dna.add_service("Tư vấn chiến lược", f"Tư vấn chiến lược {niche}", 500)
    dna.add_service("Gói cơ bản", f"Dịch vụ {niche} cơ bản", 1000)
    dna.add_service("Gói chuyên nghiệp", f"Dịch vụ {niche} chuyên nghiệp", 2500)

    path = Path(".antigravity/agency_dna.json")
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(dna.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n✅ Agency '{name}' created!\n   📁 Config saved: .antigravity/agency_dna.json\n   🏷️ Tagline: {dna.get_tagline()}\n   📦 Services: {len(dna.services)}\n\n🎉 You're ready to earn $!\n   Next: antigravity client:add \"Your First Client\"")

def cmd_client_add(name: str):
    """Add a new client."""
    from antigravity.core.client_magnet import ClientMagnet, LeadSource
    print(f"\n➕ Adding client: {name}\n" + "-" * 50)
    magnet = ClientMagnet()
    company = input("   Company []: ").strip() or name
    email = input("   Email []: ").strip()
    phone = input("   Phone []: ").strip()
    lead = magnet.add_lead(name=name, company=company, email=email, phone=phone, source=LeadSource.REFERRAL)
    magnet.qualify_lead(lead, budget=1000, score=70)
    magnet.convert_to_client(lead)
    print(f"\n✅ Client '{name}' added!\n   🏢 Company: {company}\n   📧 Email: {email or 'N/A'}\n   📱 Phone: {phone or 'N/A'}\n\n🎯 Next: Create a proposal for this client")

def cmd_content_generate(count: int = 30):
    """Generate content ideas."""
    from antigravity.core.content_factory import ContentFactory
    print(f"\n🎨 Generating {count} content ideas...\n" + "-" * 50)
    niche = "Digital Marketing"
    path = Path(".antigravity/agency_dna.json")
    if path.exists():
        niche = json.loads(path.read_text(encoding="utf-8")).get("niche", niche)
    factory = ContentFactory(niche=niche)
    ideas = factory.generate_ideas(count)
    print(f"\n📝 Top {min(10, count)} Ideas (by virality score):\n")
    for i, idea in enumerate(ideas[:10], 1): print(f"   {i:2}. [{idea.score:3}] {idea}")
    print(f"\n✅ Generated {len(ideas)} ideas for '{niche}'\n   📊 Avg virality score: {sum(i.score for i in ideas) / len(ideas):.0f}")
    out = Path(".antigravity/content_ideas.json")
    out.parent.mkdir(parents=True, exist_ok=True)
    data = [{"title": i.title, "type": i.content_type.value, "score": i.score} for i in ideas]
    out.write_text(json.dumps(data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("   💾 Saved: .antigravity/content_ideas.json")
