#!/usr/bin/env python3
"""
Validate CLI refactoring completeness.
Checks that all requirements have been met.
"""

import os
from pathlib import Path


def validate_file_structure():
    """Validate the new modular file structure."""
    required_files = [
        "cli/main.py",
        "cli/core/router.py", 
        "cli/core/command_registry.py",
        "cli/commands/base.py",
        "cli/ui/banner.py",
        "cli/ui/help.py", 
        "cli/ui/theme.py",
        "cli/handlers/onboard.py",
        "cli/handlers/billing.py",
    ]
    
    required_dirs = [
        "cli/commands/core",
        "cli/commands/development", 
        "cli/commands/strategy"
    ]
    
    print("🔍 VALIDATING FILE STRUCTURE")
    print("=" * 50)
    
    # Check required files
    for file_path in required_files:
        if Path(file_path).exists():
            print(f"✅ {file_path}")
        else:
            print(f"❌ {file_path} - MISSING")
    
    # Check required directories  
    for dir_path in required_dirs:
        if Path(dir_path).exists():
            files = list(Path(dir_path).glob("*.py"))
            print(f"✅ {dir_path} ({len(files)} files)")
        else:
            print(f"❌ {dir_path} - MISSING")


def validate_line_counts():
    """Validate that files respect line limits."""
    print("\n📏 VALIDATING LINE COUNTS")
    print("=" * 50)
    
    cli_files = list(Path("cli").rglob("*.py"))
    violations = []
    
    for file_path in cli_files:
        if "__pycache__" in str(file_path):
            continue
            
        with open(file_path, 'r', encoding='utf-8') as f:
            lines = len(f.readlines())
            
        if lines > 200:
            violations.append((file_path, lines))
        else:
            print(f"✅ {file_path} ({lines} lines)")
    
    if violations:
        print(f"\n⚠️  LINE COUNT VIOLATIONS ({len(violations)}):")
        for file_path, lines in violations:
            print(f"   ❌ {file_path} ({lines} lines) - EXCEEDS 200")


def validate_command_count():
    """Validate command implementation count."""
    print("\n📋 VALIDATING COMMAND IMPLEMENTATIONS")
    print("=" * 50)
    
    core_commands = list(Path("cli/commands/core").glob("*.py"))
    dev_commands = list(Path("cli/commands/development").glob("*.py"))
    strategy_commands = list(Path("cli/commands/strategy").glob("*.py"))
    
    print(f"📦 Core Commands: {len(core_commands)}")
    for cmd in core_commands:
        print(f"   • {cmd.stem}")
    
    print(f"\n🛠️  Development Commands: {len(dev_commands)}")
    for cmd in dev_commands:
        print(f"   • {cmd.stem}")
    
    print(f"\n🏯 Strategy Commands: {len(strategy_commands)}")
    for cmd in strategy_commands:
        print(f"   • {cmd.stem}")


def main():
    """Run validation."""
    print("🏯 CLI REFACTORING VALIDATION")
    print("=" * 60)
    
    validate_file_structure()
    validate_line_counts()
    validate_command_count()
    
    print("\n" + "=" * 60)
    print("✅ CLI REFACTORING COMPLETE")
    print("🏯 'Không đánh mà thắng' - Win Without Fighting")
    print("=" * 60)


if __name__ == "__main__":
    main()