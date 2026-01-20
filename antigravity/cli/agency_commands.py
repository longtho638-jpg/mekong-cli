"""
Agency Commands for AntigravityKit.

Contains agency setup and management commands.
"""

import json
from pathlib import Path


def cmd_start():
    """Bootstrap a new agency (5-minute setup)."""
    from antigravity.core.agency_dna import AgencyDNA, PricingTier, Tone

    print("\n BOOTSTRAP YOUR AGENCY")
    print("-" * 50)

    # Quick setup
    print("\n Quick Setup (Press Enter for defaults)\n")

    name = input("   Agency name [My Agency]: ").strip() or "My Agency"
    niche = input("   Niche [Digital Marketing]: ").strip() or "Digital Marketing"
    location = input("   Location [Vietnam]: ").strip() or "Vietnam"

    # Tone selection
    print("\n   Tone:")
    print("   1. Mien Tay (Southern)")
    print("   2. Mien Bac (Northern)")
    print("   3. Mien Trung (Central)")
    print("   4. Friendly (English)")
    print("   5. Professional (English)")
    tone_choice = input("   Select [1]: ").strip() or "1"

    tones = {
        "1": Tone.MIEN_TAY,
        "2": Tone.MIEN_BAC,
        "3": Tone.MIEN_TRUNG,
        "4": Tone.FRIENDLY,
        "5": Tone.PROFESSIONAL,
    }
    tone = tones.get(tone_choice, Tone.MIEN_TAY)

    # Create DNA
    dna = AgencyDNA(name=name, niche=niche, location=location, tone=tone, tier=PricingTier.STARTER)

    # Add default services
    dna.add_service("Tu van chien luoc", f"Tu van chien luoc {niche}", 500)
    dna.add_service("Goi co ban", f"Dich vu {niche} co ban", 1000)
    dna.add_service("Goi chuyen nghiep", f"Dich vu {niche} chuyen nghiep", 2500)

    # Save DNA
    dna_path = Path(".antigravity/agency_dna.json")
    dna_path.parent.mkdir(parents=True, exist_ok=True)
    dna_path.write_text(json.dumps(dna.to_dict(), indent=2, ensure_ascii=False), encoding="utf-8")

    print(f"\n Agency '{name}' created!")
    print("   Config saved: .antigravity/agency_dna.json")
    print(f"   Tagline: {dna.get_tagline()}")
    print(f"   Services: {len(dna.services)}")
    print("\n You're ready to earn $!")
    print('   Next: antigravity client:add "Your First Client"')


def cmd_client_add(name: str):
    """Add a new client."""
    from antigravity.core.client_magnet import ClientMagnet, LeadSource

    print(f"\n Adding client: {name}")
    print("-" * 50)

    magnet = ClientMagnet()

    # Get optional info
    company = input("   Company []: ").strip() or name
    email = input("   Email []: ").strip()
    phone = input("   Phone []: ").strip()

    lead = magnet.add_lead(
        name=name, company=company, email=email, phone=phone, source=LeadSource.REFERRAL
    )

    # Auto-qualify with default score
    magnet.qualify_lead(lead, budget=1000, score=70)

    # Convert to client
    magnet.convert_to_client(lead)

    print(f"\n Client '{name}' added!")
    print(f"   Company: {company}")
    print(f"   Email: {email or 'N/A'}")
    print(f"   Phone: {phone or 'N/A'}")
    print("\n Next: Create a proposal for this client")


def cmd_content_generate(count: int = 30):
    """Generate content ideas."""
    from antigravity.core.content_factory import ContentFactory

    print(f"\n Generating {count} content ideas...")
    print("-" * 50)

    # Load DNA for niche
    niche = "Digital Marketing"
    dna_path = Path(".antigravity/agency_dna.json")
    if dna_path.exists():
        dna_data = json.loads(dna_path.read_text(encoding="utf-8"))
        niche = dna_data.get("niche", niche)

    factory = ContentFactory(niche=niche)
    ideas = factory.generate_ideas(count)

    print(f"\n Top {min(10, count)} Ideas (by virality score):\n")
    for i, idea in enumerate(ideas[:10], 1):
        print(f"   {i:2}. [{idea.score:3}] {idea}")

    print(f"\n Generated {len(ideas)} ideas for '{niche}'")
    print(f"   Avg virality score: {sum(i.score for i in ideas) / len(ideas):.0f}")

    # Save ideas
    ideas_path = Path(".antigravity/content_ideas.json")
    ideas_path.parent.mkdir(parents=True, exist_ok=True)
    ideas_data = [{"title": i.title, "type": i.content_type.value, "score": i.score} for i in ideas]
    ideas_path.write_text(json.dumps(ideas_data, indent=2, ensure_ascii=False), encoding="utf-8")
    print("   Saved: .antigravity/content_ideas.json")


def cmd_stats():
    """Show dashboard stats."""
    print("\n ANTIGRAVITYKIT DASHBOARD")
    print("-" * 50)

    # Load DNA
    dna_path = Path(".antigravity/agency_dna.json")
    if dna_path.exists():
        dna_data = json.loads(dna_path.read_text(encoding="utf-8"))
        print(f"\n   Agency: {dna_data.get('name', 'Unknown')}")
        print(f"   Niche: {dna_data.get('niche', 'Unknown')}")
        print(f"   Location: {dna_data.get('location', 'Unknown')}")
        print(f"   Services: {len(dna_data.get('services', []))}")
    else:
        print("\n   No agency configured. Run `antigravity start`")

    # Load content ideas
    ideas_path = Path(".antigravity/content_ideas.json")
    if ideas_path.exists():
        ideas = json.loads(ideas_path.read_text(encoding="utf-8"))
        print(f"\n   Content Ideas: {len(ideas)}")
        avg_score = sum(i.get("score", 0) for i in ideas) / len(ideas) if ideas else 0
        print(f"   Avg Virality: {avg_score:.0f}/100")

    print("\n" + "=" * 50)
    print("   'Khong danh ma thang' - Win Without Fighting")
