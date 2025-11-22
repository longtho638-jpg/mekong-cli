#!/usr/bin/env python3
"""Generate updated command and skill catalogs."""

import argparse
import sys
import yaml
from pathlib import Path
from datetime import datetime

# Ensure UTF-8 output on Windows
if sys.platform == 'win32':
    import io
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')

def load_yaml(path):
    return yaml.safe_load(Path(path).read_text())

def generate_commands_yaml():
    """Generate COMMANDS.yaml catalog."""
    commands = load_yaml('.claude/scripts/commands_data.yaml')

    # Group by category
    categories = {}
    for cmd in commands:
        cat = cmd['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(cmd)

    # Sort commands within each category
    for cat in categories:
        categories[cat] = sorted(categories[cat], key=lambda x: x['name'])

    # Generate catalog structure
    catalog = {
        'metadata': {
            'title': 'Commands Catalog',
            'description': 'Auto-generated catalog of all available commands in ClaudeKit Engineer',
            'last_updated': datetime.now().strftime('%Y-%m-%d'),
            'total_commands': len(commands)
        },
        'categories': {
            'core': 'Core Commands',
            'bootstrap': 'Bootstrap Commands',
            'content': 'Content Creation',
            'cook': 'Cook Commands',
            'design': 'Design Commands',
            'docs': 'Documentation',
            'fix': 'Fix & Debug',
            'git': 'Git Commands',
            'integrate': 'Integrations',
            'plan': 'Planning',
            'review': 'Code Review',
            'scout': 'Scout Commands',
            'skill': 'Skill Management'
        },
        'commands': categories
    }

    return yaml.dump(catalog, sort_keys=False, allow_unicode=True, default_flow_style=False)

def generate_skills_yaml():
    """Generate SKILLS.yaml catalog."""
    skills = load_yaml('.claude/scripts/skills_data.yaml')

    # Group by category
    categories = {}
    for skill in skills:
        cat = skill['category']
        if cat not in categories:
            categories[cat] = []
        categories[cat].append(skill)

    # Sort skills within each category
    for cat in categories:
        categories[cat] = sorted(categories[cat], key=lambda x: x['name'])

    # Generate catalog structure
    catalog = {
        'metadata': {
            'title': 'Skills Catalog',
            'description': 'Auto-generated catalog of all available skills in ClaudeKit Engineer',
            'last_updated': datetime.now().strftime('%Y-%m-%d'),
            'total_skills': len(skills)
        },
        'categories': {
            'ai-ml': 'AI & Machine Learning',
            'frontend': 'Frontend & Design',
            'backend': 'Backend Development',
            'infrastructure': 'Infrastructure & DevOps',
            'database': 'Database & Storage',
            'dev-tools': 'Development Tools',
            'multimedia': 'Multimedia & Processing',
            'frameworks': 'Frameworks & Platforms',
            'utilities': 'Utilities & Helpers',
            'other': 'Other'
        },
        'legend': {
            'has_scripts': '📦 Has executable scripts',
            'has_references': '📚 Has reference documentation'
        },
        'skills': categories
    }

    return yaml.dump(catalog, sort_keys=False, allow_unicode=True, default_flow_style=False)

if __name__ == '__main__':
    # Parse command-line arguments
    parser = argparse.ArgumentParser(description='Generate command and skill catalogs')
    parser.add_argument('--skills', action='store_true', help='Generate only skills catalog')
    parser.add_argument('--commands', action='store_true', help='Generate only commands catalog')
    args = parser.parse_args()

    # If no specific flag, generate both
    generate_both = not (args.skills or args.commands)

    # Generate catalogs based on arguments
    if args.commands or generate_both:
        commands_yaml = generate_commands_yaml()
        Path('guide/COMMANDS.yaml').write_text(commands_yaml, encoding='utf-8')
        print("✓ Generated guide/COMMANDS.yaml")

    if args.skills or generate_both:
        skills_yaml = generate_skills_yaml()
        Path('guide/SKILLS.yaml').write_text(skills_yaml, encoding='utf-8')
        print("✓ Generated guide/SKILLS.yaml")
