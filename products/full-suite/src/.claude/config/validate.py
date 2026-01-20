#!/usr/bin/env python3
"""
Configuration Validation Script
Checks for conflicting configurations across precedence hierarchy
"""

import json
import os
from pathlib import Path
from typing import Dict, List, Tuple

# Configuration directories in precedence order (highest to lowest)
CONFIG_DIRS = [
    ".claude/config",
    ".claude/rules",
    os.path.expanduser("~/.claude/workflows"),
]

def find_config_files() -> Dict[str, List[Path]]:
    """Find all config files across precedence hierarchy"""
    config_files = {}

    for config_dir in CONFIG_DIRS:
        dir_path = Path(config_dir)
        if dir_path.exists():
            for file_path in dir_path.glob("*.md"):
                filename = file_path.name
                if filename not in config_files:
                    config_files[filename] = []
                config_files[filename].append(file_path)

            for file_path in dir_path.glob("*.json"):
                filename = file_path.name
                if filename not in config_files:
                    config_files[filename] = []
                config_files[filename].append(file_path)

    return config_files

def check_conflicts() -> List[Tuple[str, List[Path]]]:
    """Check for conflicting configurations"""
    config_files = find_config_files()
    conflicts = []

    for filename, paths in config_files.items():
        if len(paths) > 1:
            conflicts.append((filename, paths))

    return conflicts

def validate_json_configs():
    """Validate all JSON configuration files"""
    errors = []

    for config_dir in CONFIG_DIRS:
        dir_path = Path(config_dir)
        if dir_path.exists():
            for json_file in dir_path.glob("*.json"):
                try:
                    with open(json_file) as f:
                        json.load(f)
                except json.JSONDecodeError as e:
                    errors.append(f"Invalid JSON in {json_file}: {e}")

    return errors

def main():
    print("🔍 Validating .claude configuration...")
    print()

    # Check for conflicts
    conflicts = check_conflicts()
    if conflicts:
        print("⚠️  Found conflicting configurations:")
        for filename, paths in conflicts:
            print(f"\n  {filename}:")
            for i, path in enumerate(paths, 1):
                priority = ["HIGHEST", "HIGH", "MEDIUM", "LOW"][min(i-1, 3)]
                print(f"    {i}. [{priority}] {path}")
        print()
        print("ℹ️  Higher priority configs will override lower priority ones.")
        print("   See .claude/config/precedence.md for details.")
    else:
        print("✅ No conflicting configurations found")

    print()

    # Validate JSON
    json_errors = validate_json_configs()
    if json_errors:
        print("❌ JSON validation errors:")
        for error in json_errors:
            print(f"  - {error}")
        return 1
    else:
        print("✅ All JSON configurations are valid")

    print()
    print("✅ Configuration validation complete!")
    return 0

if __name__ == "__main__":
    exit(main())
