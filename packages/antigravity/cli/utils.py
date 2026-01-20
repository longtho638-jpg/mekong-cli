"""
Antigravity CLI Utility commands (Stats, Help).
"""
import json
from pathlib import Path


def cmd_stats():
    """Show dashboard stats."""
    print("\n📊 ANTIGRAVITYKIT DASHBOARD\n" + "-" * 50)
    path = Path(".antigravity/agency_dna.json")
    if path.exists():
        d = json.loads(path.read_text(encoding="utf-8"))
        print(f"\n   🏢 Agency: {d.get('name', 'Unknown')}\n   🎯 Niche: {d.get('niche', 'Unknown')}\n   📍 Location: {d.get('location', 'Unknown')}\n   📦 Services: {len(d.get('services', []))}")
    else: print("\n   ⚠️ No agency configured. Run `antigravity start`")
    ipath = Path(".antigravity/content_ideas.json")
    if ipath.exists():
        ideas = json.loads(ipath.read_text(encoding="utf-8"))
        print(f"\n   📝 Content Ideas: {len(ideas)}\n   📊 Avg Virality: {sum(i.get('score', 0) for i in ideas) / len(ideas) if ideas else 0:.0f}/100")
    print("\n" + "=" * 50 + "\n   🏯 'Không đánh mà thắng' - Win Without Fighting")

def cmd_help():
    """Show help menu."""
    print("""
╔═══════════════════════════════════════════════════════════╗
║  🚀 ANTIGRAVITYKIT COMMANDS                               ║
╠═══════════════════════════════════════════════════════════╣
║  Tier 1: Student (Dễ như ăn kẹo)                         ║
║  start                  Bootstrap agency (5 min)          ║
║  client:add "Name"      Add a new client                  ║
║  content:generate 30    Generate 30 content ideas        ║
║  stats                  Show dashboard                    ║
╚═══════════════════════════════════════════════════════════╝""")
