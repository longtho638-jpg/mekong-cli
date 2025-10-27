#!/usr/bin/env python3
"""
API Key Detection Helper for Gemini Audio Skill

Checks for GEMINI_API_KEY in this order:
1. Process environment variable
2. Skill directory .env file
3. Project directory .env file
"""

import os
import sys
from pathlib import Path
from typing import Optional


def find_api_key() -> Optional[str]:
    """
    Find GEMINI_API_KEY using 5-step lookup:
    1. Process environment
    2. Project root .env
    3. ./.claude/.env
    4. ./.claude/skills/.env
    5. Skill directory .env

    Returns:
        API key string or None if not found
    """
    # Step 1: Check process environment
    api_key = os.getenv('GEMINI_API_KEY')
    if api_key:
        print("✓ Using API key from environment variable", file=sys.stderr)
        return api_key

    # Determine paths
    skill_dir = Path(__file__).parent.parent
    project_dir = skill_dir.parent.parent.parent  # 3 levels up from skill dir

    # Step 2: Check project root .env
    project_env = project_dir / '.env'
    if project_env.exists():
        api_key = load_env_file(project_env)
        if api_key:
            print(f"✓ Using API key from {project_env}", file=sys.stderr)
            return api_key

    # Step 3: Check ./.claude/.env
    claude_env = project_dir / '.claude' / '.env'
    if claude_env.exists():
        api_key = load_env_file(claude_env)
        if api_key:
            print(f"✓ Using API key from {claude_env}", file=sys.stderr)
            return api_key

    # Step 4: Check ./.claude/skills/.env
    claude_skills_env = project_dir / '.claude' / 'skills' / '.env'
    if claude_skills_env.exists():
        api_key = load_env_file(claude_skills_env)
        if api_key:
            print(f"✓ Using API key from {claude_skills_env}", file=sys.stderr)
            return api_key

    # Step 5: Check skill directory .env
    skill_env = skill_dir / '.env'
    if skill_env.exists():
        api_key = load_env_file(skill_env)
        if api_key:
            print(f"✓ Using API key from {skill_env}", file=sys.stderr)
            return api_key

    return None


def load_env_file(env_path: Path) -> Optional[str]:
    """
    Load GEMINI_API_KEY from .env file

    Args:
        env_path: Path to .env file

    Returns:
        API key or None
    """
    try:
        with open(env_path, 'r') as f:
            for line in f:
                line = line.strip()
                if line.startswith('GEMINI_API_KEY='):
                    # Extract value, removing quotes if present
                    value = line.split('=', 1)[1].strip()
                    value = value.strip('"').strip("'")
                    if value:
                        return value
    except Exception as e:
        print(f"Warning: Error reading {env_path}: {e}", file=sys.stderr)

    return None


def get_api_key_or_exit() -> str:
    """
    Get API key or exit with helpful error message

    Returns:
        API key string
    """
    api_key = find_api_key()

    if not api_key:
        print("\n❌ Error: GEMINI_API_KEY not found!", file=sys.stderr)
        print("\nPlease set your API key using one of these methods (in priority order):", file=sys.stderr)
        print("1. Environment variable:", file=sys.stderr)
        print("   export GEMINI_API_KEY='your-api-key'", file=sys.stderr)

        skill_dir = Path(__file__).parent.parent
        project_dir = skill_dir.parent.parent.parent

        print("\n2. Project root .env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {project_dir}/.env", file=sys.stderr)
        print("\n3. .claude/.env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {project_dir}/.claude/.env", file=sys.stderr)
        print("\n4. .claude/skills/.env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {project_dir}/.claude/skills/.env", file=sys.stderr)
        print("\n5. Skill directory .env file:", file=sys.stderr)
        print(f"   echo 'GEMINI_API_KEY=your-api-key' > {skill_dir}/.env", file=sys.stderr)
        print("\nGet your API key at: https://aistudio.google.com/apikey", file=sys.stderr)
        sys.exit(1)

    return api_key


if __name__ == '__main__':
    # Test the API key detection
    api_key = get_api_key_or_exit()
    print(f"Found API key: {api_key[:8]}..." + "*" * (len(api_key) - 8))
