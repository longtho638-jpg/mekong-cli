#!/usr/bin/env python3
"""
OpenCode Configuration Generator

Generates .opencode directory structure and AGENTS.md from Claude Code configuration.
Converts Claude Code agents and commands to OpenCode-compatible format.

OpenCode docs:
- Rules: https://opencode.ai/docs/rules/
- Agents: https://opencode.ai/docs/agents/
- Commands: https://opencode.ai/docs/commands/
- Skills: https://opencode.ai/docs/skills/

Usage:
    python generate-opencode.py [--force] [--dry-run] [--verbose]

Options:
    --force     Overwrite existing files
    --dry-run   Show what would be created without writing
    --verbose   Show detailed output
"""

import os
import sys
import re
import shutil
import argparse
from pathlib import Path
from datetime import datetime
from typing import Optional


def find_project_root() -> Path:
    """Find project root by looking for .git or CLAUDE.md."""
    current = Path.cwd()
    for parent in [current] + list(current.parents):
        if (parent / ".git").exists() or (parent / "CLAUDE.md").exists():
            return parent
    return current


def parse_yaml_frontmatter(content: str) -> tuple[dict, str]:
    """Parse YAML frontmatter from markdown content.

    Handles block scalars (>-, |, etc.) by collecting indented lines.
    """
    frontmatter = {}
    body = content

    if content.startswith("---"):
        parts = content.split("---", 2)
        if len(parts) >= 3:
            yaml_content = parts[1].strip()
            body = parts[2].strip()

            lines = yaml_content.split("\n")
            i = 0
            while i < len(lines):
                line = lines[i]
                stripped = line.strip()

                # Skip empty lines
                if not stripped:
                    i += 1
                    continue

                if ":" in stripped:
                    key, value = stripped.split(":", 1)
                    key = key.strip()
                    value = value.strip()

                    # Handle block scalars (>-, >, |-, |)
                    if value in (">-", ">", "|-", "|"):
                        # Collect all indented lines that follow
                        block_lines = []
                        i += 1
                        while i < len(lines):
                            next_line = lines[i]
                            # Check if line is indented (part of block)
                            if next_line.startswith("  ") or next_line.startswith("\t"):
                                block_lines.append(next_line.strip())
                                i += 1
                            elif next_line.strip() == "":
                                # Empty line might be part of block
                                i += 1
                            else:
                                # Non-indented line = end of block
                                break
                        # Join block lines (folded style uses space)
                        value = " ".join(block_lines)
                        frontmatter[key] = value
                        continue

                    # Handle quoted strings
                    if value.startswith('"') and value.endswith('"'):
                        value = value[1:-1]
                    elif value.startswith("'") and value.endswith("'"):
                        value = value[1:-1]
                    # Handle arrays
                    elif value.startswith("[") and value.endswith("]"):
                        value = [v.strip().strip("'\"") for v in value[1:-1].split(",")]

                    frontmatter[key] = value
                i += 1

    return frontmatter, body


def convert_claude_agent_to_opencode(claude_agent: dict, body: str, agent_name: str) -> tuple[dict, str]:
    """Convert Claude Code agent format to OpenCode agent format.

    Note: OpenCode agents should NOT have model metadata - they inherit from config.
    """
    # Special case: brainstormer is a primary agent
    mode = "primary" if agent_name == "brainstormer" else "subagent"

    opencode_frontmatter = {
        "description": claude_agent.get("description", f"Agent: {agent_name}"),
        "mode": mode,
    }

    # Note: We intentionally do NOT include 'model' in the frontmatter
    # OpenCode agents inherit model from opencode.json config

    # Default tool permissions for subagents
    opencode_frontmatter["tools"] = {
        "read": True,
        "write": True,
        "edit": True,
        "bash": True,
        "glob": True,
        "grep": True,
    }

    # Replace .claude/ paths with .opencode/ in body
    body = body.replace(".claude/", ".opencode/")

    return opencode_frontmatter, body


def convert_claude_command_to_opencode(claude_cmd: dict, body: str, cmd_name: str) -> tuple[dict, str]:
    """Convert Claude Code command format to OpenCode command format."""
    opencode_frontmatter = {
        "description": claude_cmd.get("description", f"Command: {cmd_name}"),
    }

    # Map agent if specified
    if "agent" in claude_cmd:
        opencode_frontmatter["agent"] = claude_cmd["agent"]

    # OpenCode uses $ARGUMENTS instead of Claude's $ARGUMENTS (same format)
    # Convert argument-hint to description if more descriptive
    if "argument-hint" in claude_cmd:
        hint = claude_cmd["argument-hint"]
        if hint and "[" not in opencode_frontmatter.get("description", ""):
            opencode_frontmatter["description"] = (
                opencode_frontmatter.get("description", "") + f" - Args: {hint}"
            )

    # Replace .claude/ paths with .opencode/ in body
    body = body.replace(".claude/", ".opencode/")

    return opencode_frontmatter, body


def generate_yaml_frontmatter(data: dict) -> str:
    """Generate YAML frontmatter string from dict."""
    lines = ["---"]

    def format_value(v, use_block_scalar=False):
        if isinstance(v, bool):
            return "true" if v else "false"
        elif isinstance(v, str):
            # For multiline strings or strings with special chars, use block scalar
            if use_block_scalar and ("\n" in v or len(v) > 100):
                # Use YAML block scalar (literal style |)
                return None  # Signal to use block scalar
            # Escape special characters and wrap in quotes if needed
            if "\n" in v or '"' in v or ":" in v or "'" in v or v.startswith(" "):
                # Escape internal quotes and use double quotes
                escaped = v.replace("\\", "\\\\").replace('"', '\\"').replace("\n", " ")
                return f'"{escaped}"'
            elif " " in v:
                return f'"{v}"'
            return v
        elif isinstance(v, list):
            return "[" + ", ".join(str(format_value(item)) for item in v if format_value(item)) + "]"
        elif isinstance(v, dict):
            return None  # Handle separately
        return str(v)

    for key, value in data.items():
        if isinstance(value, dict):
            lines.append(f"{key}:")
            for sub_key, sub_value in value.items():
                formatted = format_value(sub_value)
                if formatted is not None:
                    lines.append(f"  {sub_key}: {formatted}")
        elif key == "description" and isinstance(value, str):
            # For description, truncate to first sentence if too long
            desc = value.replace("\n", " ").strip()
            # Remove examples and extra content - keep just the main description
            if "<example>" in desc:
                desc = desc.split("<example>")[0].strip()
            if "Examples:" in desc:
                desc = desc.split("Examples:")[0].strip()
            # Truncate if still too long (max 200 chars for clean YAML)
            if len(desc) > 200:
                desc = desc[:197] + "..."
            # Escape and quote
            desc = desc.replace('"', '\\"')
            lines.append(f'{key}: "{desc}"')
        else:
            formatted = format_value(value)
            if formatted is not None:
                lines.append(f"{key}: {formatted}")

    lines.append("---")
    return "\n".join(lines)


def generate_agents_md(project_root: Path) -> str:
    """Generate AGENTS.md content from project context."""
    readme_path = project_root / "README.md"
    claude_md_path = project_root / "CLAUDE.md"

    # Get project name from directory
    project_name = project_root.name

    # Try to extract description from README
    project_desc = ""
    if readme_path.exists():
        with open(readme_path, "r", encoding="utf-8") as f:
            readme = f.read()
            # Get first paragraph after title
            lines = readme.split("\n")
            for i, line in enumerate(lines):
                if line.startswith("# "):
                    for j in range(i + 1, min(i + 10, len(lines))):
                        if lines[j].strip() and not lines[j].startswith("#"):
                            project_desc = lines[j].strip()
                            break
                    break

    # Extract key info from CLAUDE.md if exists
    claude_instructions = ""
    if claude_md_path.exists():
        with open(claude_md_path, "r", encoding="utf-8") as f:
            claude_md = f.read()
            # Extract workflows section
            if "## Workflows" in claude_md:
                start = claude_md.index("## Workflows")
                end = claude_md.find("\n## ", start + 1)
                if end == -1:
                    end = len(claude_md)
                claude_instructions = claude_md[start:end].strip()

    # Detect project type
    project_type = "Generic"
    if (project_root / "package.json").exists():
        project_type = "Node.js/TypeScript"
    elif (project_root / "requirements.txt").exists() or (project_root / "pyproject.toml").exists():
        project_type = "Python"
    elif (project_root / "go.mod").exists():
        project_type = "Go"
    elif (project_root / "Cargo.toml").exists():
        project_type = "Rust"

    agents_md = f"""# AGENTS.md

This file provides guidance to OpenCode when working with code in this repository.

## Project Overview

**Name:** {project_name}
**Type:** {project_type}
{f"**Description:** {project_desc}" if project_desc else ""}

## Role & Responsibilities

Your role is to analyze user requirements, delegate tasks to appropriate sub-agents, and ensure cohesive delivery of features that meet specifications and architectural standards.

{claude_instructions if claude_instructions else '''## Workflows

- Follow project-specific development guidelines
- Use appropriate sub-agents for specialized tasks
- Maintain code quality and documentation standards'''}

## Development Principles

- **YAGNI**: You Aren't Gonna Need It - avoid over-engineering
- **KISS**: Keep It Simple, Stupid - prefer simple solutions
- **DRY**: Don't Repeat Yourself - eliminate code duplication

## Documentation

Keep all important docs in `./docs` folder:

```
./docs
├── project-overview-pdr.md
├── code-standards.md
├── codebase-summary.md
├── design-guidelines.md
└── system-architecture.md
```

## External Files

Reference external instruction files in `opencode.json`:

```json
{{
  "instructions": ["docs/*.md", ".opencode/agent/*.md"]
}}
```

---

*Generated by ClaudeKit OpenCode Generator*
*Date: {datetime.now().strftime("%Y-%m-%d")}*
"""
    return agents_md


def main():
    parser = argparse.ArgumentParser(
        description="Generate OpenCode configuration from Claude Code setup"
    )
    parser.add_argument("--force", action="store_true", help="Overwrite existing files")
    parser.add_argument("--dry-run", action="store_true", help="Show what would be created")
    parser.add_argument("--verbose", action="store_true", help="Show detailed output")
    args = parser.parse_args()

    project_root = find_project_root()
    opencode_dir = project_root / ".opencode"
    claude_dir = project_root / ".claude"

    print(f"Project root: {project_root}")
    print(f"OpenCode dir: {opencode_dir}")
    print()

    # Create directories
    dirs_to_create = [
        opencode_dir,
        opencode_dir / "agent",
        opencode_dir / "command",
        opencode_dir / "skill",
    ]

    for dir_path in dirs_to_create:
        if not dir_path.exists():
            if args.dry_run:
                print(f"[DRY-RUN] Would create directory: {dir_path}")
            else:
                dir_path.mkdir(parents=True, exist_ok=True)
                if args.verbose:
                    print(f"Created directory: {dir_path}")

    # Generate AGENTS.md
    agents_md_path = project_root / "AGENTS.md"
    if not agents_md_path.exists() or args.force:
        agents_md_content = generate_agents_md(project_root)
        if args.dry_run:
            print(f"[DRY-RUN] Would create: {agents_md_path}")
            if args.verbose:
                print("--- AGENTS.md preview ---")
                print(agents_md_content[:500] + "...")
        else:
            with open(agents_md_path, "w", encoding="utf-8") as f:
                f.write(agents_md_content)
            print(f"Created: {agents_md_path}")
    else:
        print(f"Skipped (exists): {agents_md_path}")

    # Note: opencode.json is not generated - users configure it manually
    # OpenCode will use defaults if no config file exists

    # Convert Claude Code agents to OpenCode agents
    claude_agents_dir = claude_dir / "agents"
    if claude_agents_dir.exists():
        print("\nConverting agents...")
        for agent_file in claude_agents_dir.glob("*.md"):
            agent_name = agent_file.stem
            output_path = opencode_dir / "agent" / f"{agent_name}.md"

            if output_path.exists() and not args.force:
                if args.verbose:
                    print(f"  Skipped (exists): {agent_name}")
                continue

            with open(agent_file, "r", encoding="utf-8") as f:
                content = f.read()

            frontmatter, body = parse_yaml_frontmatter(content)
            opencode_fm, opencode_body = convert_claude_agent_to_opencode(
                frontmatter, body, agent_name
            )

            output_content = generate_yaml_frontmatter(opencode_fm) + "\n\n" + opencode_body

            if args.dry_run:
                print(f"  [DRY-RUN] Would convert: {agent_name}")
            else:
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(output_content)
                if args.verbose:
                    print(f"  Converted: {agent_name}")

        print(f"  Converted {len(list(claude_agents_dir.glob('*.md')))} agents")

    # Convert Claude Code commands to OpenCode commands
    claude_commands_dir = claude_dir / "commands"
    if claude_commands_dir.exists():
        print("\nConverting commands...")
        converted_count = 0

        for cmd_file in claude_commands_dir.glob("*.md"):
            cmd_name = cmd_file.stem
            output_path = opencode_dir / "command" / f"{cmd_name}.md"

            if output_path.exists() and not args.force:
                if args.verbose:
                    print(f"  Skipped (exists): {cmd_name}")
                continue

            with open(cmd_file, "r", encoding="utf-8") as f:
                content = f.read()

            frontmatter, body = parse_yaml_frontmatter(content)
            opencode_fm, opencode_body = convert_claude_command_to_opencode(
                frontmatter, body, cmd_name
            )

            output_content = generate_yaml_frontmatter(opencode_fm) + "\n\n" + opencode_body

            if args.dry_run:
                print(f"  [DRY-RUN] Would convert: {cmd_name}")
            else:
                with open(output_path, "w", encoding="utf-8") as f:
                    f.write(output_content)
                if args.verbose:
                    print(f"  Converted: {cmd_name}")
            converted_count += 1

        print(f"  Converted {converted_count} commands")

    # Copy skills from .claude/skills/ to .opencode/skill/
    claude_skills_dir = claude_dir / "skills"
    opencode_skills_dir = opencode_dir / "skill"
    if claude_skills_dir.exists():
        print("\nCopying skills...")
        skill_count = 0
        for skill_dir in claude_skills_dir.iterdir():
            if skill_dir.is_dir() and (skill_dir / "SKILL.md").exists():
                skill_name = skill_dir.name
                target_dir = opencode_skills_dir / skill_name

                if target_dir.exists() and not args.force:
                    if args.verbose:
                        print(f"  Skipped (exists): {skill_name}")
                    continue

                if args.dry_run:
                    print(f"  [DRY-RUN] Would copy skill: {skill_name}")
                else:
                    if target_dir.exists():
                        shutil.rmtree(target_dir)
                    shutil.copytree(skill_dir, target_dir)
                    if args.verbose:
                        print(f"  Copied: {skill_name}")
                skill_count += 1
        print(f"  Copied {skill_count} skills")

    # Copy workflows from .claude/workflows/ to .opencode/workflow/
    claude_workflows_dir = claude_dir / "workflows"
    opencode_workflows_dir = opencode_dir / "workflows"
    if claude_workflows_dir.exists():
        print("\nCopying workflows...")
        if not opencode_workflows_dir.exists():
            if args.dry_run:
                print(f"  [DRY-RUN] Would create directory: {opencode_workflows_dir}")
            else:
                opencode_workflows_dir.mkdir(parents=True, exist_ok=True)

        workflow_count = 0
        for workflow_file in claude_workflows_dir.glob("*.md"):
            workflow_name = workflow_file.name
            target_path = opencode_workflows_dir / workflow_name

            if target_path.exists() and not args.force:
                if args.verbose:
                    print(f"  Skipped (exists): {workflow_name}")
                continue

            if args.dry_run:
                print(f"  [DRY-RUN] Would copy workflow: {workflow_name}")
            else:
                shutil.copy2(workflow_file, target_path)
                if args.verbose:
                    print(f"  Copied: {workflow_name}")
            workflow_count += 1
        print(f"  Copied {workflow_count} workflows")

    # Copy .env.example if exists
    env_example_src = claude_dir / ".env.example"
    env_example_dst = opencode_dir / ".env.example"
    if env_example_src.exists():
        if not env_example_dst.exists() or args.force:
            if args.dry_run:
                print(f"\n[DRY-RUN] Would copy: .env.example")
            else:
                shutil.copy2(env_example_src, env_example_dst)
                print(f"\nCopied: .env.example")
        else:
            if args.verbose:
                print(f"\nSkipped (exists): .env.example")

    # Summary
    print("\n" + "=" * 50)
    print("GENERATION COMPLETE")
    print("=" * 50)
    print(f"\nGenerated files:")
    print(f"  - AGENTS.md (project instructions)")
    print(f"  - .opencode/agent/*.md (converted agents)")
    print(f"  - .opencode/command/*.md (converted commands)")
    print(f"  - .opencode/skill/*/ (copied skills)")
    print(f"  - .opencode/workflows/*.md (copied workflows)")
    print(f"  - .opencode/.env.example (if exists)")
    print(f"\nTo use OpenCode:")
    print(f"  1. Install OpenCode: https://opencode.ai/docs")
    print(f"  2. Run: opencode")
    print(f"  3. Use /init to regenerate AGENTS.md with AI analysis")


if __name__ == "__main__":
    main()
