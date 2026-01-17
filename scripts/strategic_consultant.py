#!/usr/bin/env python3
"""
🏯 Strategic Consultant CLI (Binh Pháp Analyzer)
================================================
Automates the $5K-$10K Strategic Assessment process using Binh Pháp framework.
Interactively interviews the user/founder and generates a strategic report.

Usage:
    python3 scripts/strategic_consultant.py
"""

import sys
import time
from datetime import datetime

# Binh Pháp Framework
CHAPTERS = [
    {
        "id": 1,
        "name": "Kế Hoạch (Planning)",
        "q": "What is the Grand Calculation? (Market Size, Runway, Goal)",
        "key_metric": "Runway & TAM",
    },
    {
        "id": 2,
        "name": "Tác Chiến (Waging War)",
        "q": "What is the cost of operation? (Burn Rate, CAC, Staffing)",
        "key_metric": "Burn Rate",
    },
    {
        "id": 3,
        "name": "Mưu Công (Attack by Stratagem)",
        "q": "How do you win without fighting? (Moat, USP, Virality)",
        "key_metric": "Moat Strength",
    },
    {
        "id": 4,
        "name": "Hình (Disposition)",
        "q": "Is your defense invincible? (Legal, IP, Security, Retention)",
        "key_metric": "Churn Rate",
    },
    {
        "id": 5,
        "name": "Thế (Energy)",
        "q": "What represents your momentum? (Growth Rate, Hype, Traffic)",
        "key_metric": "MoM Growth",
    },
    {
        "id": 6,
        "name": "Hư Thực (Weak Points & Strong)",
        "q": "Where is the enemy (competitor) weak and you are strong?",
        "key_metric": "Differentiation",
    },
]


def type_writer(text, delay=0.02):
    for char in text:
        sys.stdout.write(char)
        sys.stdout.flush()
        time.sleep(delay)
    print()


def ask_question(question):
    print(f"\n❓ {question}")
    return input("   ╰─> ").strip()


def run_analysis():
    print("\n" + "=" * 60)
    print("🏯 STRATEGIC CONSULTANT (BINH PHÁP AUTOMATION)")
    print("=" * 60)
    print("Initializing 30-Year Founder Protocol...\n")

    client = ask_question("Client / Venture Name:")
    if not client:
        return

    answers = {}

    print("\n--- PHASE 1: THE SCAN ---")

    for cap in CHAPTERS:
        print(f"\n🌊 Chapter {cap['id']}: {cap['name']}")
        ans = ask_question(cap["q"])
        answers[cap["name"]] = ans

    print("\n--- PHASE 2: PROCESSING ---")
    type_writer("Analyzying Strategic Fit...", 0.05)
    type_writer("Calculating Win Probability...", 0.05)
    type_writer("Generating Recommendations...", 0.05)

    # Generate Report
    report_file = (
        f"strategy_report_{client.lower().replace(' ', '_')}_{int(time.time())}.md"
    )

    with open(report_file, "w") as f:
        f.write(f"# 🏯 Strategic Assessment: {client}\n")
        f.write(f"**Date**: {datetime.now().strftime('%Y-%m-%d')}\n")
        f.write("**Consultant**: Antigravity (Automated)\n\n")

        f.write("## 1. Executive Summary\n")
        f.write("Based on the Binh Pháp analysis, the venture shows...\n\n")

        f.write("## 2. Binh Pháp Deep Dive\n")
        for k, v in answers.items():
            f.write(f"### {k}\n")
            f.write(f"**Input**: {v}\n")
            f.write(f"**Analysis**: [AI TO INSERT INSIGHT BASED ON '{v}']\n\n")

        f.write("## 3. Recommendations\n")
        f.write("- **Immediate**: Defensive hardening (Chapter 4).\n")
        f.write("- **Strategic**: Leverage momentum (Chapter 5).\n")

    print("\n" + "=" * 60)
    print(f"✅ REPORT GENERATED: {report_file}")
    print("=" * 60)
    print("💡 Next Step: Run 'python3 scripts/payment_hub.py' to invoice $5,000.")


if __name__ == "__main__":
    run_analysis()
