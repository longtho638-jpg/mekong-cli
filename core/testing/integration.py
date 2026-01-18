"""
Integration Testing Logic
=========================
Validates the integrity of the .claude and mekong-cli mapping.
"""

import json
from pathlib import Path
from typing import Any, Dict

class IntegrationTester:
    def __init__(self, project_root: Path):
        self.project_root = project_root
        self.test_results = {
            "skill_unification": {},
            "workflow_bridge": {},
            "documentation_sync": {},
            "backward_compatibility": {},
        }

    def test_skill_unification(self) -> Dict[str, Any]:
        """Test skill system unification"""
        unified_skills = self.project_root / ".claude-skills"
        registry_file = unified_skills / "registry.json"

        results = {
            "unified_directory_exists": unified_skills.exists(),
            "registry_exists": registry_file.exists(),
            "skill_count": 0,
            "sample_skills_verified": [],
        }

        if unified_skills.exists():
            skill_dirs = [
                d for d in unified_skills.iterdir() if d.is_dir() and d.name != "__pycache__"
            ]
            results["skill_count"] = len(skill_dirs)

            # Test sample skills
            sample_skills = [
                "web-frameworks",
                "sequential-thinking",
                "vibe-development",
                "better-auth",
            ]
            for skill_name in sample_skills:
                skill_path = unified_skills / skill_name
                skill_md = skill_path / "SKILL.md"

                skill_result = {
                    "exists": skill_path.exists(),
                    "has_skill_md": skill_md.exists(),
                    "has_structure": False,
                }

                if skill_path.exists():
                    required_dirs = ["tests", "docs", "scripts", "references"]
                    existing_dirs = [d for d in required_dirs if (skill_path / d).exists()]
                    skill_result["has_structure"] = len(existing_dirs) >= 2

                results["sample_skills_verified"].append(
                    {"skill": skill_name, "result": skill_result}
                )

        if registry_file.exists():
            try:
                registry = json.loads(registry_file.read_text())
                results["registry_skills_count"] = len(registry.get("skills", {}))
                results["registry_valid"] = True
            except Exception:
                results["registry_valid"] = False

        self.test_results["skill_unification"] = results
        return results

    def test_workflow_bridge(self) -> Dict[str, Any]:
        """Test workflow bridge system"""
        bridge_dir = self.project_root / "claude_bridge"

        results = {
            "bridge_directory_exists": bridge_dir.exists(),
            "components_created": [],
            "command_mappings_exist": False,
            "sample_mappings_tested": [],
        }

        if bridge_dir.exists():
            # Test components
            required_components = [
                "mappers/command_mapper.py",
                "executors/workflow_executor.py",
                "context_manager.py",
                "reporting_system.py",
            ]

            for component in required_components:
                component_path = bridge_dir / component
                results["components_created"].append(
                    {"component": component, "exists": component_path.exists()}
                )

            # Test command mappings
            mappings_file = bridge_dir / "command_mappings.json"
            results["command_mappings_exist"] = mappings_file.exists()

            if mappings_file.exists():
                try:
                    mappings = json.loads(mappings_file.read_text())
                    test_commands = [
                        "agencyos cook",
                        "agencyos scaffold",
                        "/skill web-frameworks",
                        "agencyos test",
                    ]
                    for cmd in test_commands:
                        mapping_result = {"command": cmd, "has_mapping": cmd in mappings}
                        if cmd in mappings:
                            mapping_result["mapping"] = mappings[cmd]
                        results["sample_mappings_tested"].append(mapping_result)
                except Exception as e:
                    results["mappings_error"] = str(e)

        self.test_results["workflow_bridge"] = results
        return results

    def test_documentation_sync(self) -> Dict[str, Any]:
        """Test documentation synchronization"""
        docs_dir = self.project_root / "docs"

        results = {
            "docs_directory_exists": docs_dir.exists(),
            "standards_created": False,
            "workflows_created": False,
            "integrated_standards_exists": False,
            "documentation_index_exists": False,
            "synced_files_count": 0,
        }

        if docs_dir.exists():
            standards_dir = docs_dir / "standards"
            workflows_dir = docs_dir / "workflows"

            results["standards_created"] = standards_dir.exists()
            results["workflows_created"] = workflows_dir.exists()

            integrated_standards = standards_dir / "integrated-standards.md"
            results["integrated_standards_exists"] = integrated_standards.exists()

            docs_index = docs_dir / "README.md"
            results["documentation_index_exists"] = docs_index.exists()

            if standards_dir.exists():
                claude_files = list(standards_dir.glob("claude-*.md"))
                results["synced_files_count"] += len(claude_files)
            if workflows_dir.exists():
                workflow_files = list(workflows_dir.glob("*.md"))
                results["synced_files_count"] += len(workflow_files)

        self.test_results["documentation_sync"] = results
        return results

    def test_backward_compatibility(self) -> Dict[str, Any]:
        """Test backward compatibility"""
        results = {
            "claude_dir_exists": False,
            "agencyos_dir_exists": False,
            "original_skills_preserved": False,
            "cli_commands_work": False,
        }

        claude_dir = self.project_root / ".claude"
        agencyos_dir = self.project_root / ".agencyos"

        results["claude_dir_exists"] = claude_dir.exists()
        results["agencyos_dir_exists"] = agencyos_dir.exists()

        if claude_dir.exists():
            claude_skills = claude_dir / "skills"
            if claude_skills.exists():
                skill_count = len([d for d in claude_skills.iterdir() if d.is_dir()])
                results["original_skills_preserved"] = skill_count > 0

        cli_files = ["main.py", "cli/entrypoint.py"]
        cli_found = any((self.project_root / f).exists() for f in cli_files)
        results["cli_commands_work"] = cli_found

        self.test_results["backward_compatibility"] = results
        return results

    def run_all(self) -> Dict[str, Any]:
        """Run all integration tests"""
        self.test_skill_unification()
        self.test_workflow_bridge()
        self.test_documentation_sync()
        self.test_backward_compatibility()
        return self.test_results
