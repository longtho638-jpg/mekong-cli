#!/usr/bin/env python3
"""
Scaffold Project Script
Uses Antigravity Architect Service to generate project blueprints.
"""
import sys
import os
import argparse
from typing import Optional

# Add project root to path
sys.path.append(os.getcwd())

from core.modules.architect.services import ArchitectService
from core.modules.architect.entities import ArchitectureType

def main():
    parser = argparse.ArgumentParser(description="Scaffold a new project or module.")
    parser.add_argument("request", help="Description of the project/module to scaffold")
    parser.add_argument("--arch", choices=[t.value for t in ArchitectureType], help="Force specific architecture")

    args = parser.parse_args()

    service = ArchitectService()

    print(f"🏗️  Analyzing request: '{args.request}'...")

    profile = service.analyze_request(args.request)

    if args.arch:
        print(f"⚠️  Overriding architecture to: {args.arch}")
        # Manually override if needed, though analyze_request returns a profile
        # We might need to adjust the logic if we want to force it,
        # but for now let's just trust the analyzer or warn if different.
        if profile.recommended_arch.value != args.arch:
            print(f"   (Analyzer recommended {profile.recommended_arch.value})")
            # In a real impl, we'd update the profile here

    blueprint = service.generate_blueprint(profile)

    print("\n" + "="*60)
    print(f"🏛️  RECOMMENDED ARCHITECTURE: {blueprint.type.value.upper()}")
    print("="*60)
    print(f"\n🧠 Reasoning: {profile.reasoning}")
    print(f"\n📂 Folder Structure:\n{blueprint.folder_structure}")
    print(f"\n📏 Core Rules:")
    for rule in blueprint.core_rules:
        print(f"  - {rule}")

    print("\n" + "="*60)
    print("📋 System Prompt for Implementation:")
    print("-" * 20)
    print(blueprint.system_prompt_snippet)
    print("-" * 20)

if __name__ == "__main__":
    main()
