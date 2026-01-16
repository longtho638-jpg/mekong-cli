#!/usr/bin/env python3
"""
🏯 Agency OS - Interactive Onboarding CLI
==========================================

Run: python3 onboard.py

This CLI walks new agencies through the DNA Generator:
1. Ask 9 simple questions
2. Generate full business plan
3. Save DNA to file
4. Show next steps

"Không đánh mà thắng" 🏯
"""

import os
import sys
from datetime import datetime

# Add parent to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

try:
    from core.business_plan_generator import BusinessPlanGenerator, AgencyDNA
except ImportError:
    print("❌ Could not import BusinessPlanGenerator. Run from mekong-cli directory.")
    sys.exit(1)


def print_banner():
    """Print welcome banner."""
    banner = """
╔═══════════════════════════════════════════════════════════╗
║                                                           ║
║   🏯 AGENCY OS - ONBOARDING WIZARD                       ║
║                                                           ║
║   Create your Agency DNA in 5 minutes                    ║
║   "Không đánh mà thắng" - Win Without Fighting           ║
║                                                           ║
╚═══════════════════════════════════════════════════════════╝
    """
    print(banner)


def ask_question(question: str, example: str) -> str:
    """Ask a question with example."""
    print(f"\n{question}")
    print(f"   💡 Example: {example}")
    print()
    
    while True:
        answer = input("   ▶ Your answer: ").strip()
        if answer:
            return answer
        print("   ⚠️ Please provide an answer.")


def show_progress(current: int, total: int):
    """Show progress bar."""
    filled = int(20 * current / total)
    bar = "█" * filled + "░" * (20 - filled)
    print(f"\n   Progress: [{bar}] {current}/{total}")


def save_dna(dna: AgencyDNA, plan: str) -> str:
    """Save DNA to file."""
    # Create output directory
    output_dir = os.path.join(os.path.dirname(__file__), "generated")
    os.makedirs(output_dir, exist_ok=True)
    
    # Create filename
    safe_name = dna.agency_name.lower().replace(" ", "_")
    timestamp = datetime.now().strftime("%Y%m%d")
    filename = f"{safe_name}_dna_{timestamp}.md"
    filepath = os.path.join(output_dir, filename)
    
    # Write plan
    with open(filepath, "w", encoding="utf-8") as f:
        f.write(plan)
    
    return filepath


def show_next_steps(dna: AgencyDNA, filepath: str):
    """Show next steps after onboarding."""
    print("""
╔═══════════════════════════════════════════════════════════╗
║  🎉 CONGRATULATIONS! YOUR AGENCY DNA IS READY!           ║
╚═══════════════════════════════════════════════════════════╝
""")
    
    print("   📄 Business Plan saved to:")
    print(f"      {filepath}")
    print()
    print("   🚀 NEXT STEPS:")
    print("   ───────────────────────────────────────────")
    print("   1. Review your Business Plan DNA")
    print("   2. Customize sections as needed")
    print("   3. Start with Client #1 (offer free audit)")
    print("   4. Build your first case study")
    print("   5. Scale to $10K/month! 💰")
    print()
    print(f"   🌐 Your Agency: {dna.agency_name}")
    print(f"   📍 Location: {dna.location}")
    print(f"   🎯 Niche: {dna.niche}")
    print(f"   💰 Goal: {dna.dream_revenue}")
    print()
    print("   ════════════════════════════════════════════")
    print("   🏯 \"Không đánh mà thắng\" - Win Without Fighting")
    print("   🌐 agencyos.network")
    print("   ════════════════════════════════════════════")


def main():
    """Main onboarding flow."""
    print_banner()
    
    print("Welcome to Agency OS! 👋")
    print("Let's create your Agency DNA in just 5 minutes.")
    print("Answer 9 simple questions and get a full business plan.")
    print()
    input("Press ENTER to start...")
    
    # Initialize generator
    generator = BusinessPlanGenerator()
    questions = generator.get_questions()
    
    # Ask each question
    for i, q in enumerate(questions, 1):
        show_progress(i - 1, len(questions))
        answer = ask_question(q["question"], q["example"])
        generator.answer_question(q["id"], answer)
    
    show_progress(len(questions), len(questions))
    
    print("\n\n🔄 Generating your Agency DNA...")
    print("   This may take a moment...")
    
    # Generate DNA
    dna = generator.generate_dna()
    plan = generator.format_full_plan(dna)
    
    # Save to file
    filepath = save_dna(dna, plan)
    
    # Show success
    show_next_steps(dna, filepath)


if __name__ == "__main__":
    try:
        main()
    except KeyboardInterrupt:
        print("\n\n👋 See you next time!")
        sys.exit(0)
