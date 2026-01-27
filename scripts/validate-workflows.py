#!/usr/bin/env python3
"""
Architecture Sync Validation Script
Validates all command → workflow references
Generates broken commands list and fix recommendations
"""

import json
import os
import re
from pathlib import Path
from typing import Dict, List, Set, Tuple

# Paths
MEKONG_ROOT = Path("/Users/macbookprom1/mekong-cli")
COMMANDS_DIR = MEKONG_ROOT / ".claude/commands"
WORKFLOWS_AGENT = MEKONG_ROOT / ".agent/workflows"
WORKFLOWS_CLAUDE = MEKONG_ROOT / ".claude/workflows"
REPORT_PATH = MEKONG_ROOT / "plans/reports/architecture-sync-audit-260126.md"

# Workflow reference patterns
WORKFLOW_PATTERNS = [
    r'workflow["\']?\s*:\s*["\']([^"\']+)["\']',  # workflow: "name"
    r'@\[\.agent/workflows/([^\]]+)\]',  # @[.agent/workflows/file.md]
    r'@\[\.claude/workflows/([^\]]+)\]',  # @[.claude/workflows/file.md]
    r'`\.agent/workflows/([^`]+)`',  # `.agent/workflows/file.md`
    r'`\.claude/workflows/([^`]+)`',  # `.claude/workflows/file.md`
    r'workflow:\s*([a-z-]+)',  # workflow: kebab-case-name
    r'uses workflow:\s*([a-z-]+)',  # uses workflow: name
    r'references:\s*([a-z-]+\.md)',  # references: file.md
]

def extract_workflow_refs(file_path: Path) -> Set[str]:
    """Extract all workflow references from a command file."""
    refs = set()

    try:
        content = file_path.read_text(encoding='utf-8')

        for pattern in WORKFLOW_PATTERNS:
            matches = re.findall(pattern, content, re.IGNORECASE)
            refs.update(matches)

        # Also look for workflow mentions in text
        # Match: "the xyz-workflow does..."
        workflow_mentions = re.findall(r'\b([a-z-]+)-workflow\b', content)
        refs.update([f"{w}-workflow.md" for w in workflow_mentions])

    except Exception as e:
        print(f"Error reading {file_path}: {e}")

    return refs

def find_workflow_file(workflow_ref: str) -> Tuple[bool, str, str]:
    """
    Find workflow file in either location.
    Returns: (exists, location, full_path)
    """
    # Normalize reference
    if not workflow_ref.endswith('.md'):
        workflow_ref = f"{workflow_ref}.md"

    # Check .agent/workflows/
    agent_path = WORKFLOWS_AGENT / workflow_ref
    if agent_path.exists():
        return (True, ".agent/workflows", str(agent_path))

    # Check .claude/workflows/
    claude_path = WORKFLOWS_CLAUDE / workflow_ref
    if claude_path.exists():
        return (True, ".claude/workflows", str(claude_path))

    return (False, "NOT_FOUND", "")

def validate_commands() -> Dict:
    """Validate all commands with workflow references."""

    results = {
        "total_commands": 0,
        "commands_with_refs": 0,
        "total_refs": 0,
        "broken_refs": 0,
        "commands": {}
    }

    # Scan all command files
    for cmd_file in COMMANDS_DIR.rglob("*.md"):
        results["total_commands"] += 1

        # Extract workflow references
        refs = extract_workflow_refs(cmd_file)

        if refs:
            results["commands_with_refs"] += 1
            results["total_refs"] += len(refs)

            # Validate each reference
            cmd_results = {
                "path": str(cmd_file.relative_to(MEKONG_ROOT)),
                "refs": [],
                "broken_count": 0
            }

            for ref in refs:
                exists, location, full_path = find_workflow_file(ref)

                ref_result = {
                    "name": ref,
                    "exists": exists,
                    "location": location,
                    "full_path": full_path
                }

                cmd_results["refs"].append(ref_result)

                if not exists:
                    results["broken_refs"] += 1
                    cmd_results["broken_count"] += 1

            results["commands"][str(cmd_file.relative_to(COMMANDS_DIR))] = cmd_results

    return results

def generate_matrix_table(results: Dict) -> str:
    """Generate markdown matrix table."""

    table = "| Command | Workflow Reference | Location | Status |\n"
    table += "|---------|-------------------|----------|--------|\n"

    for cmd_name, cmd_data in sorted(results["commands"].items()):
        for ref in cmd_data["refs"]:
            status = "✅ VALID" if ref["exists"] else "❌ BROKEN"
            location = ref["location"] if ref["exists"] else "N/A"

            table += f"| {cmd_name} | {ref['name']} | {location} | {status} |\n"

    return table

def generate_broken_commands_list(results: Dict) -> str:
    """Generate list of commands with broken references."""

    broken_commands = []

    for cmd_name, cmd_data in sorted(results["commands"].items()):
        if cmd_data["broken_count"] > 0:
            broken_refs = [r["name"] for r in cmd_data["refs"] if not r["exists"]]
            broken_commands.append({
                "command": cmd_name,
                "broken_refs": broken_refs,
                "count": cmd_data["broken_count"]
            })

    if not broken_commands:
        return "**No broken commands found!** All workflow references are valid. ✅"

    output = f"**Total Broken Commands:** {len(broken_commands)}\n\n"

    for item in broken_commands:
        output += f"### `{item['command']}`\n"
        output += f"- **Broken References:** {item['count']}\n"
        for ref in item['broken_refs']:
            output += f"  - ❌ `{ref}` (NOT FOUND)\n"
        output += "\n"

    return output

def generate_fix_script(results: Dict) -> str:
    """Generate bash script to create missing workflow stubs."""

    # Collect all missing workflows
    missing = set()
    for cmd_data in results["commands"].values():
        for ref in cmd_data["refs"]:
            if not ref["exists"]:
                missing.add(ref["name"])

    if not missing:
        return "# No missing workflows - nothing to fix!\n"

    script = """#!/bin/bash
# Auto-generated workflow stub creation script
# Creates missing workflow files referenced by commands

WORKFLOWS_DIR=".agent/workflows"
mkdir -p "$WORKFLOWS_DIR"

echo "Creating missing workflow files..."

"""

    for workflow in sorted(missing):
        workflow_title = workflow.replace('-', ' ').replace('.md', '').title()

        script += f"""
# Create {workflow}
cat > "$WORKFLOWS_DIR/{workflow}" <<'EOF'
# {workflow_title}

> **Status:** Auto-generated stub - NEEDS CONTENT
> **Created:** $(date +%Y-%m-%d)

## Purpose

[Describe what this workflow accomplishes]

## When to Use

[Describe when this workflow should be invoked]

## Prerequisites

- [ ] [List required setup or conditions]

## Steps

1. [Step 1]
2. [Step 2]
3. [Step 3]

## Success Criteria

- [ ] [Expected outcome 1]
- [ ] [Expected outcome 2]

## Related Commands

- [List commands that reference this workflow]

## Notes

This workflow was auto-generated because it was referenced by commands but did not exist.
Please update with actual content.
EOF

echo "✅ Created {workflow}"

"""

    script += """
echo ""
echo "Created ${count} workflow stubs in $WORKFLOWS_DIR"
echo "Please review and update each stub with actual content."
"""

    return script

def main():
    """Main validation execution."""

    print("🔍 Validating Workflow References...")
    print(f"Commands Directory: {COMMANDS_DIR}")
    print(f"Workflows Location A: {WORKFLOWS_AGENT}")
    print(f"Workflows Location B: {WORKFLOWS_CLAUDE}")
    print()

    # Run validation
    results = validate_commands()

    # Print summary
    print("=" * 60)
    print("VALIDATION SUMMARY")
    print("=" * 60)
    print(f"Total Commands: {results['total_commands']}")
    print(f"Commands with Workflow Refs: {results['commands_with_refs']}")
    print(f"Total Workflow References: {results['total_refs']}")
    print(f"Broken References: {results['broken_refs']}")
    print()

    if results['broken_refs'] > 0:
        print("⚠️  BROKEN REFERENCES FOUND!")
    else:
        print("✅ ALL REFERENCES VALID!")

    print()

    # Generate outputs
    print("📊 Generating detailed reports...")

    # 1. Matrix table
    matrix = generate_matrix_table(results)

    # 2. Broken commands list
    broken_list = generate_broken_commands_list(results)

    # 3. Fix script
    fix_script = generate_fix_script(results)

    # 4. JSON output for programmatic use
    json_output = json.dumps(results, indent=2)

    # Save outputs
    output_dir = Path("/Users/macbookprom1/mekong-cli/plans/reports")

    # Save matrix
    with open(output_dir / "workflow-matrix.md", "w") as f:
        f.write("# Workflow Reference Matrix\n\n")
        f.write(matrix)

    # Save broken commands
    with open(output_dir / "broken-commands.md", "w") as f:
        f.write("# Broken Command References\n\n")
        f.write(broken_list)

    # Save fix script
    fix_script_path = Path("/Users/macbookprom1/mekong-cli/scripts/create-missing-workflows.sh")
    with open(fix_script_path, "w") as f:
        f.write(fix_script)
    fix_script_path.chmod(0o755)

    # Save JSON
    with open(output_dir / "validation-results.json", "w") as f:
        f.write(json_output)

    print("✅ Reports saved:")
    print(f"  - Matrix: {output_dir}/workflow-matrix.md")
    print(f"  - Broken List: {output_dir}/broken-commands.md")
    print(f"  - Fix Script: {fix_script_path}")
    print(f"  - JSON Data: {output_dir}/validation-results.json")
    print()

    # Return results for further processing
    return results

if __name__ == "__main__":
    results = main()

    # Exit with error code if broken refs found
    if results['broken_refs'] > 0:
        exit(1)
    else:
        exit(0)
