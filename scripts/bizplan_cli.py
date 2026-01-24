#!/usr/bin/env python3
"""
BizPlan CLI - Command-line interface for Agentic Business Plan 2026 Generator

Usage:
    bizplan generate <idea> --output <file.md>
    bizplan list-skills
    bizplan --help
"""

import argparse
import sys
from pathlib import Path

# Add parent directory to path for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

from antigravity.core.bizplan import BizPlanGenerator


def generate_command(args):
    """Handle the generate command."""
    try:
        # Initialize generator
        generator = BizPlanGenerator()

        # Generate business plan
        if args.ai:
            print("Generating AI-powered business plan...")
            bizplan = generator.generate_bizplan_ai(args.idea)
        else:
            print("Generating template-based business plan...")
            bizplan = generator.generate_bizplan(args.idea)

        # Write to output file
        output_path = Path(args.output)
        output_path.parent.mkdir(parents=True, exist_ok=True)
        output_path.write_text(bizplan, encoding='utf-8')

        print(f"✓ Business plan generated successfully: {args.output}")

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        print("Make sure .agencyos/Documents/ exists with SKILL templates.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error generating business plan: {e}", file=sys.stderr)
        sys.exit(1)


def list_skills_command(args):
    """Handle the list-skills command."""
    try:
        generator = BizPlanGenerator()

        if not generator.skill_templates:
            print("No SKILL templates found.")
            return

        print(f"Available SKILL Templates ({len(generator.skill_templates)}):\n")

        for skill_id, skill in sorted(generator.skill_templates.items()):
            print(f"  • {skill.id}")
            print(f"    Title: {skill.title}")
            print(f"    Type: {skill.type}")
            print(f"    Version: {skill.version}")
            if skill.description:
                desc = skill.description[:80] + "..." if len(skill.description) > 80 else skill.description
                print(f"    Description: {desc}")
            print()

    except FileNotFoundError as e:
        print(f"Error: {e}", file=sys.stderr)
        print("Make sure .agencyos/Documents/ exists with SKILL templates.", file=sys.stderr)
        sys.exit(1)
    except Exception as e:
        print(f"Error listing skills: {e}", file=sys.stderr)
        sys.exit(1)


def main():
    """Main CLI entry point."""
    parser = argparse.ArgumentParser(
        prog='bizplan',
        description='Agentic Business Plan 2026 Generator - Create comprehensive business plans',
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  bizplan generate "AI-powered SaaS analytics platform" --output myplan.md
  bizplan generate "E-commerce marketplace" --output plan.md --ai
  bizplan list-skills
        """
    )

    subparsers = parser.add_subparsers(dest='command', help='Available commands')

    # Generate command
    generate_parser = subparsers.add_parser(
        'generate',
        help='Generate a business plan from an idea'
    )
    generate_parser.add_argument(
        'idea',
        type=str,
        help='Business idea or concept to generate plan for'
    )
    generate_parser.add_argument(
        '--output', '-o',
        type=str,
        required=True,
        help='Output markdown file path'
    )
    generate_parser.add_argument(
        '--ai',
        action='store_true',
        help='Use AI-powered generation (requires Gemini API)'
    )
    generate_parser.set_defaults(func=generate_command)

    # List skills command
    list_parser = subparsers.add_parser(
        'list-skills',
        help='List available SKILL templates'
    )
    list_parser.set_defaults(func=list_skills_command)

    # Parse arguments
    args = parser.parse_args()

    # Show help if no command provided
    if not args.command:
        parser.print_help()
        sys.exit(0)

    # Execute command
    args.func(args)


if __name__ == '__main__':
    main()
