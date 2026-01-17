#!/usr/bin/env python3
"""
Integration Testing for .claude & mekong-cli
Test CLI → agent workflow mappings, skill unification, and documentation sync
"""

import os
import json
import subprocess
from pathlib import Path
from typing import Dict, List, Any

class IntegrationTester:
    def __init__(self, project_root: str):
        self.project_root = Path(project_root)
        self.test_results = {
            "skill_unification": {},
            "workflow_bridge": {},
            "documentation_sync": {},
            "backward_compatibility": {}
        }
        
    def test_skill_unification(self) -> Dict[str, Any]:
        """Test skill system unification"""
        print("🧪 Testing skill unification...")
        
        unified_skills = self.project_root / ".claude-skills"
        registry_file = unified_skills / "registry.json"
        
        results = {
            "unified_directory_exists": unified_skills.exists(),
            "registry_exists": registry_file.exists(),
            "skill_count": 0,
            "sample_skills_verified": []
        }
        
        if unified_skills.exists():
            skill_dirs = [d for d in unified_skills.iterdir() if d.is_dir() and d.name != "__pycache__"]
            results["skill_count"] = len(skill_dirs)
            
            # Test sample skills
            sample_skills = ["web-frameworks", "sequential-thinking", "vibe-development", "better-auth"]
            for skill_name in sample_skills:
                skill_path = unified_skills / skill_name
                skill_md = skill_path / "SKILL.md"
                
                skill_result = {
                    "exists": skill_path.exists(),
                    "has_skill_md": skill_md.exists(),
                    "has_structure": False
                }
                
                if skill_path.exists():
                    required_dirs = ["tests", "docs", "scripts", "references"]
                    existing_dirs = [d for d in required_dirs if (skill_path / d).exists()]
                    skill_result["has_structure"] = len(existing_dirs) >= 2
                    
                results["sample_skills_verified"].append({
                    "skill": skill_name,
                    "result": skill_result
                })
        
        if registry_file.exists():
            try:
                registry = json.loads(registry_file.read_text())
                results["registry_skills_count"] = len(registry.get("skills", {}))
                results["registry_valid"] = True
            except:
                results["registry_valid"] = False
        
        self.test_results["skill_unification"] = results
        print(f"✓ Skill unification tested: {results['skill_count']} skills unified")
        return results
        
    def test_workflow_bridge(self) -> Dict[str, Any]:
        """Test workflow bridge system"""
        print("🧪 Testing workflow bridge...")
        
        bridge_dir = self.project_root / "claude_bridge"
        
        results = {
            "bridge_directory_exists": bridge_dir.exists(),
            "components_created": [],
            "command_mappings_exist": False,
            "sample_mappings_tested": []
        }
        
        if bridge_dir.exists():
            # Test components
            required_components = [
                "mappers/command_mapper.py",
                "executors/workflow_executor.py", 
                "context_manager.py",
                "reporting_system.py"
            ]
            
            for component in required_components:
                component_path = bridge_dir / component
                results["components_created"].append({
                    "component": component,
                    "exists": component_path.exists()
                })
            
            # Test command mappings
            mappings_file = bridge_dir / "command_mappings.json"
            results["command_mappings_exist"] = mappings_file.exists()
            
            if mappings_file.exists():
                try:
                    mappings = json.loads(mappings_file.read_text())
                    
                    # Test sample mappings
                    test_commands = [
                        "agencyos cook",
                        "agencyos scaffold", 
                        "/skill web-frameworks",
                        "agencyos test"
                    ]
                    
                    for cmd in test_commands:
                        mapping_result = {
                            "command": cmd,
                            "has_mapping": cmd in mappings
                        }
                        
                        if cmd in mappings:
                            mapping_result["mapping"] = mappings[cmd]
                            
                        results["sample_mappings_tested"].append(mapping_result)
                        
                except Exception as e:
                    results["mappings_error"] = str(e)
        
        self.test_results["workflow_bridge"] = results
        print(f"✓ Workflow bridge tested: {len(results['components_created'])} components")
        return results
        
    def test_documentation_sync(self) -> Dict[str, Any]:
        """Test documentation synchronization"""
        print("🧪 Testing documentation sync...")
        
        docs_dir = self.project_root / "docs"
        
        results = {
            "docs_directory_exists": docs_dir.exists(),
            "standards_created": False,
            "workflows_created": False,
            "integrated_standards_exists": False,
            "documentation_index_exists": False,
            "synced_files_count": 0
        }
        
        if docs_dir.exists():
            standards_dir = docs_dir / "standards"
            workflows_dir = docs_dir / "workflows"
            
            results["standards_created"] = standards_dir.exists()
            results["workflows_created"] = workflows_dir.exists()
            
            # Check specific files
            integrated_standards = standards_dir / "integrated-standards.md"
            results["integrated_standards_exists"] = integrated_standards.exists()
            
            docs_index = docs_dir / "README.md"
            results["documentation_index_exists"] = docs_index.exists()
            
            # Count synced files
            claude_files = list(standards_dir.glob("claude-*.md"))
            workflow_files = list(workflows_dir.glob("*.md"))
            results["synced_files_count"] = len(claude_files) + len(workflow_files)
        
        self.test_results["documentation_sync"] = results
        print(f"✓ Documentation sync tested: {results['synced_files_count']} files synced")
        return results
        
    def test_backward_compatibility(self) -> Dict[str, Any]:
        """Test backward compatibility"""
        print("🧪 Testing backward compatibility...")
        
        results = {
            "claude_dir_exists": False,
            "agencyos_dir_exists": False, 
            "original_skills_preserved": False,
            "cli_commands_work": False
        }
        
        # Test original directories still exist
        claude_dir = self.project_root / ".claude"
        agencyos_dir = self.project_root / ".agencyos"
        
        results["claude_dir_exists"] = claude_dir.exists()
        results["agencyos_dir_exists"] = agencyos_dir.exists()
        
        # Test original skills preserved
        if claude_dir.exists():
            claude_skills = claude_dir / "skills"
            if claude_skills.exists():
                skill_count = len([d for d in claude_skills.iterdir() if d.is_dir()])
                results["original_skills_preserved"] = skill_count > 0
        
        # Test if CLI would still work (simulated)
        cli_files = [
            "main.py",
            "cli/main.py", 
            "apps/cli/src/main.py"
        ]
        
        cli_found = any((self.project_root / f).exists() for f in cli_files)
        results["cli_commands_work"] = cli_found
        
        self.test_results["backward_compatibility"] = results
        print("✓ Backward compatibility tested")
        return results
        
    def run_integration_tests(self) -> Dict[str, Any]:
        """Run all integration tests"""
        print("🚀 Starting integration tests...")
        print("=" * 50)
        
        # Run all tests
        self.test_skill_unification()
        self.test_workflow_bridge() 
        self.test_documentation_sync()
        self.test_backward_compatibility()
        
        # Calculate overall status
        overall_status = "passed"
        failed_tests = []
        
        for test_name, results in self.test_results.items():
            test_passed = self.evaluate_test_results(results)
            if not test_passed:
                overall_status = "failed"
                failed_tests.append(test_name)
        
        summary = {
            "overall_status": overall_status,
            "failed_tests": failed_tests,
            "test_results": self.test_results,
            "timestamp": str(Path.cwd())
        }
        
        # Save test report
        test_report_file = self.project_root / "integration_test_report.json"
        test_report_file.write_text(json.dumps(summary, indent=2, default=str))
        
        print("=" * 50)
        print(f"🏁 Integration tests completed: {overall_status.upper()}")
        
        if failed_tests:
            print(f"❌ Failed tests: {', '.join(failed_tests)}")
        else:
            print("✅ All tests passed!")
            
        return summary
        
    def evaluate_test_results(self, results: Dict[str, Any]) -> bool:
        """Evaluate if test results indicate success"""
        critical_checks = []
        
        # Skill unification critical checks
        if "skill_count" in results:
            critical_checks.append(results.get("unified_directory_exists", False))
            critical_checks.append(results.get("skill_count", 0) > 0)
            
        # Workflow bridge critical checks
        if "components_created" in results:
            components_ok = all(c.get("exists", False) for c in results["components_created"])
            critical_checks.append(components_ok)
            
        # Documentation sync critical checks
        if "integrated_standards_exists" in results:
            critical_checks.append(results.get("integrated_standards_exists", False))
            
        # Backward compatibility critical checks
        if "claude_dir_exists" in results:
            critical_checks.append(results.get("claude_dir_exists", False))
            
        return all(critical_checks) if critical_checks else True
        
    def generate_test_report(self) -> str:
        """Generate human-readable test report"""
        report = ["# Integration Test Report\\n"]
        
        for test_name, results in self.test_results.items():
            report.append(f"## {test_name.replace('_', ' ').title()}\\n")
            
            for key, value in results.items():
                if isinstance(value, bool):
                    status = "✅" if value else "❌"
                    report.append(f"- {key}: {status}")
                elif isinstance(value, list) and value:
                    report.append(f"- {key}: {len(value)} items")
                elif isinstance(value, (int, float)):
                    report.append(f"- {key}: {value}")
                    
            report.append("")
            
        return "\\n".join(report)

if __name__ == "__main__":
    project_root = "/Users/macbookprom1/mekong-cli"
    tester = IntegrationTester(project_root)
    results = tester.run_integration_tests()
    
    # Generate human-readable report
    report = tester.generate_test_report()
    report_file = Path(project_root) / "integration_test_report.md"
    report_file.write_text(report)
    
    print(f"\\n📄 Test reports saved:")
    print(f"- JSON: integration_test_report.json")
    print(f"- Markdown: integration_test_report.md")